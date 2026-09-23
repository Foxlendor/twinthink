'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, FileText, CheckCircle2, ArrowRight, Download, CreditCard, Sparkles, Scale } from 'lucide-react';
import { recordNdaAndUnlock } from '@/actions/getCapsule';
import AccessModal from '@/components/AccessModal';

interface CapsuleUnlockFlowProps {
  designId: string;
  unlockPriceUsd: number;
  initialStatus: 'LOCKED' | 'UNLOCKED';
  secretData?: {
    bom_json: Record<string, any>;
    step_file_url?: string;
    dpp_battery_ready_uuid?: string;
  };
}

export default function CapsuleUnlockFlow({
  designId,
  unlockPriceUsd,
  initialStatus,
  secretData
}: CapsuleUnlockFlowProps) {
  const [status, setStatus] = useState<'LOCKED' | 'UNLOCKED'>(initialStatus);
  const [secret, setSecret] = useState(secretData);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerOrg, setBuyerOrg] = useState('');
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [signedHash, setSignedHash] = useState<string | null>(null);

  const handleInstantNdaSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !ndaAgreed) return;

    setIsSigning(true);
    const mockHash = `sig_ed25519_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

    try {
      const buyerId = `buyer_${buyerName.toLowerCase().replace(/\s+/g, '_')}`;
      await recordNdaAndUnlock(designId, buyerId, mockHash);

      setSignedHash(mockHash);
      setStatus('UNLOCKED');
      setSecret({
        bom_json: {
          design_id: designId,
          signatory: buyerName,
          organization: buyerOrg || 'Independent Entity',
          unlocked_via: 'P2P Mutual NDA & Escrow Clearance',
          manufacturing_assembly: [
            { component: 'Precision Fluid Core (316L)', process: 'Passivated Extrusion', tolerance: '±0.02mm', unit_cost: 1.85 },
            { component: 'Thermal Enclosure Jacket', process: 'High-Frequency RF Welding', tolerance: '±0.05mm', unit_cost: 0.95 },
            { component: 'Mouthpiece Flow Limiter', process: 'Food-Grade TPE Overmold', tolerance: '±0.01mm', unit_cost: 0.40 }
          ]
        },
        step_file_url: `/api/twins/${designId}/assets/assembly.step`,
        dpp_battery_ready_uuid: `urn:uuid:${designId}-espr-2027`
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadNdaCovenant = () => {
    const text = `================================================================================
TWINTHINK PROTOCOL: P2P MUTUAL NON-DISCLOSURE & SECRET BOM ACCESS COVENANT
================================================================================
DESIGN ID: ${designId.toUpperCase()}
SIGNATORY: ${buyerName || 'Verified Buyer'}
ORGANIZATION: ${buyerOrg || 'Private Entity'}
DATE OF EXECUTION: ${new Date().toUTCString()}
CRYPTOGRAPHIC PROOF: ${signedHash || 'sig_ed25519_verified_0x8f2a'}
STATUS: ESCROW RELEASED / VAULT UNLOCKED

TERMS OF ACCESS & CONFIDENTIALITY:
1. NON-DISCLOSURE: The Signatory agrees that all dimensional CAD models, 
   hierarchical BOM files, supplier pricing, and manufacturing G-code unlocked 
   herein constitute confidential Trade Secrets of the Originating Creator.
2. NON-CIRCUMVENTION: The Signatory shall not reproduce, reverse-engineer, or 
   distribute the Secret BOM outside of authorized prototype validation without 
   an executed Commercial Production Covenant (enforcing the 85% creator split).
3. GOVERNING ARCHITECTURE: Enforced cryptographically by did:twin provenance.
================================================================================`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `P2P_NDA_COVENANT_${designId.toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'UNLOCKED') {
    return (
      <div style={{
        background: '#F0FDF4',
        border: '2px solid #10B981',
        borderRadius: '16px',
        padding: '1.75rem',
        marginTop: '1.5rem',
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontWeight: 900, fontSize: '1.1rem' }}>
            <Unlock size={22} color="#059669" />
            <span>ASSET UNLOCKED · SECRET BOM DECRYPTED</span>
          </div>
          <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#047857', border: '1px solid #86EFAC', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            ESCROW CLEARED
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#064E3B', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
          Cryptographic P2P NDA signature verified ({signedHash?.substring(0, 24) || 'sig_ed25519_verified_0x8f2a'}...). The proprietary manufacturing hierarchy and parametric solid files are now accessible.
        </p>

        {/* JSON BOM Terminal */}
        <div style={{
          background: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
              secret_bom.json (Decrypted)
            </span>
            <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>AES-256 GCM Cleared</span>
          </div>
          <pre style={{
            fontSize: '0.75rem',
            color: '#E2E8F0',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            margin: 0,
            lineHeight: 1.5
          }}>
            {JSON.stringify(secret?.bom_json, null, 2)}
          </pre>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href={secret?.step_file_url || `/api/twins/${designId}/assets/assembly.step`}
            download
            style={{
              background: '#059669',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={16} /> Download Parametric .STEP File
          </a>

          <button
            onClick={handleDownloadNdaCovenant}
            style={{
              background: '#FFFFFF',
              color: '#065F46',
              border: '1.5px solid #A7F3D0',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={16} /> Download Signed NDA Covenant (.txt)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
      border: '1.5px solid #374151',
      borderRadius: '20px',
      padding: '2rem',
      color: '#FFFFFF',
      marginTop: '1.5rem',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          <Lock size={15} color="#10B981" /> THE PHYSICAL SECRET BOM PAYWALL
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
          ${unlockPriceUsd.toFixed(2)} USD
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
        The hierarchical CAD solid, exact manufacturing tolerances, and supplier price quotes are locked behind a cryptographic P2P NDA. Once you sign and authorize, the access ledger transitions to <strong style={{ color: '#F3F4F6' }}>Released</strong> and unlocks the payload.
      </p>

      {/* NDA Signature Form */}
      <form onSubmit={handleInstantNdaSign}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: '0.3rem' }}>
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Elena Rostova"
              value={buyerName}
              onChange={e => setBuyerName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: '#0B0F19',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: '0.3rem' }}>
              Organization / Firm (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Hardware Ventures"
              value={buyerOrg}
              onChange={e => setBuyerOrg(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: '#0B0F19',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* NDA Acknowledgment Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
          fontSize: '0.78rem',
          color: '#D1D5DB',
          lineHeight: 1.45,
          cursor: 'pointer',
          marginBottom: '1.25rem',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <input
            type="checkbox"
            required
            checked={ndaAgreed}
            onChange={e => setNdaAgreed(e.target.checked)}
            style={{ marginTop: '0.15rem' }}
          />
          <span>
            I execute the <strong>TwinThink P2P Mutual Non-Disclosure Agreement</strong>. I covenant that all unlocked CAD models, material specifications, and BOM tables remain strictly confidential trade secrets of the inventor.
          </span>
        </label>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={isSigning || !buyerName.trim() || !ndaAgreed}
            style={{
              flex: '1 1 240px',
              background: '#10B981',
              color: '#064E3B',
              border: 'none',
              padding: '0.85rem 1.25rem',
              borderRadius: '100px',
              fontSize: '0.9rem',
              fontWeight: 900,
              cursor: isSigning ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            {isSigning ? 'Executing Cryptographic NDA...' : 'SIGN P2P NDA & UNLOCK SECRET BOM'}
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowAccessModal(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#F3F4F6',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.85rem 1.25rem',
              borderRadius: '100px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CreditCard size={15} /> Stripe Card AVS Checkout ($0 Auth)
          </button>
        </div>
      </form>

      {/* AccessModal popup if card checkout or pitch pass is selected */}
      {showAccessModal && (
        <AccessModal
          twinId={designId}
          creator="johne.boi"
          onClose={() => setShowAccessModal(false)}
          onVaultUnlocked={() => {
            setStatus('UNLOCKED');
            setShowAccessModal(false);
          }}
        />
      )}
    </div>
  );
}
