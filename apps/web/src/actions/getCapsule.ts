"use server"

import { TWINS_DATABASE } from '@/lib/twinsData';

export interface BlindCatalogItem {
  id: string;
  title: string;
  structural_tags: string[];
  public_preview_url: string;
  ethical_manifest: string;
  unlock_price_usd: number;
  created_at?: string;
}

export interface SecretBomData {
  bom_json: Record<string, any>;
  step_file_url?: string;
  dpp_battery_ready_uuid?: string;
}

export interface CapsuleResult {
  status: "LOCKED" | "UNLOCKED";
  catalog: BlindCatalogItem;
  secret?: SecretBomData;
}

// In-memory / server-side ledger fallback when Supabase credentials are pending
const localAccessLedger: Record<string, { payment_status: 'Pending' | 'Escrowed' | 'Released'; nda_signature_hash: string; unlocked_at: string }> = {};

// Supabase PostgREST Direct Client (Zero-Dependency)
async function fetchSupabaseRest(endpoint: string, apiKey: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCapsule(designId: string, buyerId?: string): Promise<CapsuleResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. If Supabase is configured in environment, query PostgreSQL via secure PostgREST
  if (supabaseUrl && supabaseKey) {
    try {
      const catalogData = await fetchSupabaseRest(
        `blind_catalog?select=id,title,structural_tags,public_preview_url,ethical_manifest,unlock_price_usd,created_at&or=(id.eq.${designId},slug.eq.${designId})&limit=1`,
        supabaseKey
      );

      if (catalogData && catalogData.length > 0) {
        const catalogItem: BlindCatalogItem = catalogData[0];

        if (!buyerId) {
          return { status: "LOCKED", catalog: catalogItem };
        }

        // Check Access Ledger
        const accessData = await fetchSupabaseRest(
          `access_ledger?select=payment_status,nda_signature_hash&design_id=eq.${catalogItem.id}&buyer_id=eq.${buyerId}&limit=1`,
          supabaseKey
        );

        const accessRecord = accessData && accessData.length > 0 ? accessData[0] : null;

        if (accessRecord?.payment_status === 'Released' && accessRecord?.nda_signature_hash) {
          const secretData = await fetchSupabaseRest(
            `secret_bom?select=bom_json,step_file_url,dpp_battery_ready_uuid&design_id=eq.${catalogItem.id}&limit=1`,
            supabaseKey
          );

          return { 
            status: "UNLOCKED", 
            catalog: catalogItem, 
            secret: secretData && secretData.length > 0 ? secretData[0] : undefined 
          };
        }

        return { status: "LOCKED", catalog: catalogItem };
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to canonical SQLite / in-memory database:', err);
    }
  }

  // 2. Canonical Fallback Engine (Runs out of the box in local dev & offline mode)
  const normalizedId = designId.toLowerCase().trim();
  const twin = TWINS_DATABASE[normalizedId] || 
               Object.values(TWINS_DATABASE).find(t => t.id === normalizedId || t.slug === normalizedId) ||
               TWINS_DATABASE['redrink'];

  if (!twin) {
    throw new Error(`Capsule "${designId}" not found in physical registry.`);
  }

  // Extract Public Blind Metadata
  const structuralTags: string[] = [
    twin.domain,
    twin.current_version.license || 'CERN-OHL-S-2.0',
    ...(twin.current_version.properties || []).map(p => `${p.label}: ${p.value} ${p.unit || ''}`.trim())
  ].filter((t): t is string => Boolean(t)).slice(0, 5);

  const catalogItem: BlindCatalogItem = {
    id: twin.id,
    title: twin.current_version.title,
    structural_tags: structuralTags,
    public_preview_url: twin.id.includes('redr') ? '/brand_ink_reveal.mp4' : '/logo.png',
    ethical_manifest: twin.current_version.disclosure?.public_note || 
      'Verified physical hardware digital twin. Proprietary CAD dimensions, manufacturing tooling G-code, and supplier cost breakdown are protected behind a mutual P2P Non-Disclosure Agreement and escrowed royalty lock.',
    unlock_price_usd: twin.id.includes('twizz') ? 15.00 : 25.00,
    created_at: twin.created_at
  };

  // If no buyer ID is provided, strictly gate the Secret BOM
  if (!buyerId) {
    return { status: "LOCKED", catalog: catalogItem };
  }

  // Check Local Ledger for Buyer Verification
  const ledgerKey = `${twin.id}::${buyerId}`;
  const record = localAccessLedger[ledgerKey];

  if (record?.payment_status === 'Released' && record?.nda_signature_hash) {
    // Secret BOM payload is physically isolated until cleared
    const secretData: SecretBomData = {
      bom_json: {
        twin_id: twin.id,
        title: twin.current_version.title,
        semver: twin.current_version.semver,
        creator: twin.creator,
        domain: twin.domain,
        properties: twin.current_version.properties,
        relationships: twin.current_version.relationships,
        assets: twin.current_version.assets,
        assembly_nodes: [
          { node_id: 'asm-001', name: 'Primary Housing & Fluid Lumen', process: 'CNC Milling & Passivation', cost_usd: 1.85 },
          { node_id: 'sub-002', name: 'Phase Change Chemical Core', process: 'Ultrasonic Hermetic Seal', cost_usd: 0.95 },
          { node_id: 'cmp-003', name: 'Mouthpiece Temperature Limiter', process: 'Silicone Overmolding', cost_usd: 0.40 }
        ]
      },
      step_file_url: `/api/twins/${twin.id}/assets/assembly.step`,
      dpp_battery_ready_uuid: `urn:uuid:${twin.id}-espr-2027`
    };

    return {
      status: "UNLOCKED",
      catalog: catalogItem,
      secret: secretData
    };
  }

  return { status: "LOCKED", catalog: catalogItem };
}

// Action to record digital NDA signature and release escrowed access
export async function recordNdaAndUnlock(designId: string, buyerId: string, ndaSignatureHash: string) {
  const ledgerKey = `${designId.toLowerCase()}::${buyerId}`;
  localAccessLedger[ledgerKey] = {
    payment_status: 'Released',
    nda_signature_hash: ndaSignatureHash,
    unlocked_at: new Date().toISOString()
  };

  return { success: true, unlocked_at: localAccessLedger[ledgerKey].unlocked_at };
}
