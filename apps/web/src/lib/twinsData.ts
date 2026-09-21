import { TwinData } from './types';

export const TWINS_DATABASE: Record<string, TwinData> = {
  'twizzlock': {
    id: 'twizzlock',
    slug: 'twizzlock',
    creator: 'johne.boi',
    created_at: '2026-09-20T18:00:00Z',
    lineage: {
      parent: null,
      descendants: [],
      root_twin_id: 'twizzlock'
    },
    versions: [
      {
        semver: '1.0.0',
        title: 'TwizzLock™ 2L Volume Sleeve',
        published_at: '2026-09-20T18:00:00Z'
      }
    ],
    current_version: {
      semver: '1.0.0',
      title: 'TwizzLock™ 2L Volume Lock & Piston Sleeve',
      summary: 'Reusable outer compression sleeve using the bottle itself as a sliding piston against a base check valve to collapse headspace and preserve carbonation.',
      license: 'CERN-OHL-S-2.0',
      ontology_class: 'PhysicalObject',
      properties: [
        { key: 'estimated_bom_usd', value: 2.10, type: 'number', unit: 'USD', label: 'Estimated Unit BOM' },
        { key: 'target_retail_msrp', value: 16.99, type: 'number', unit: 'USD', label: 'Target Retail MSRP' },
        { key: 'max_volume_reduction', value: 40, type: 'number', unit: '%', label: 'Max Headspace Reduction' },
        { key: 'rated_cycles', value: 500, type: 'number', unit: 'cycles', label: 'Rated Pumping Cycles' },
        { key: 'sleeve_material', value: 'TPU-coated ripstop nylon (2-chamber)', type: 'string', label: 'Sleeve Material' },
        { key: 'valve_type', value: 'Food-safe TPE duckbill (6mm bore)', type: 'string', label: 'Base Valve' },
        { key: 'bottle_fit', value: 'Standard 2L PET, 28mm neck, petaloid base', type: 'string', label: 'Compatibility' }
      ],
      relationships: [
        { type: 'DERIVED_FROM', target_twin_id: 'root_twin', description: 'TwinThink hardware paradigm' }
      ],
      assets: [
        {
          relative_path: 'twizzlock_interactive_3d',
          media_type: 'model/threejs-interactive',
          size_bytes: 63633,
          is_entrypoint: 1,
          entrypoint_name: '3D Piston & Fizz Twin',
          publication_scope: 'public_preview'
        },
        {
          relative_path: 'twizzlock_bom.csv',
          media_type: 'text/csv',
          size_bytes: 1420,
          is_entrypoint: 0,
          entrypoint_name: 'Granular BOM & Supplier Tree',
          publication_scope: 'private'
        },
        {
          relative_path: 'twizzlock_sleeve_draft.step',
          media_type: 'application/step',
          size_bytes: 284000,
          is_entrypoint: 0,
          entrypoint_name: 'TPU RF-Welding Die Tooling',
          publication_scope: 'private'
        }
      ],
      disclosure: {
        public_preview_approved: true,
        level: 2,
        public_note: 'Public concept preview with interactive 3D physics simulation. Production tooling and supplier pricing protected under Private Pitch Pass.',
        public_tabs: ['object', 'behavior', 'history', 'community'],
        callouts: [
          { label: 'Bottle-as-Piston Pumping', description: 'Eliminates separate external bulbs or CO2 charger cartridges.' },
          { label: 'Mechanical Retainer Lock', description: 'Prevents PET wall re-expansion under internal carbonation pressure.' },
          { label: 'Agitation Penalty Modeling', description: 'Simulates the physics trade-off between pumping speed and bubble nucleation.' }
        ]
      }
    }
  },

  'redrink': {
    id: 'redrink',
    slug: 'redrink',
    creator: 'johne.boi',
    created_at: '2026-09-20T20:30:00Z',
    lineage: {
      parent: {
        parent_twin_id: '0001',
        parent_version: '1.0.0',
        mutation_notes: 'Differentiated from monolithic straw prior art: modular replaceable cartridge + staged release + mouth-temp limiter.'
      },
      descendants: [],
      root_twin_id: '0001'
    },
    versions: [
      {
        semver: '1.0.0',
        title: 'redr.ink™ Modular Thermal Straw',
        published_at: '2026-09-20T20:30:00Z'
      }
    ],
    current_version: {
      semver: '1.0.0',
      title: 'redr.ink™ Modular Thermal Drinking Straw',
      summary: 'Reusable, modular double-hulled drinking straw utilizing sodium acetate phase-change cartridges, gradual heat release, and a passive mouth-temperature limiter.',
      license: 'CERN-OHL-S-2.0',
      ontology_class: 'PhysicalObject',
      properties: [
        { key: 'estimated_bom_usd', value: 3.20, type: 'number', unit: 'USD', label: 'Estimated Unit BOM' },
        { key: 'target_retail_msrp', value: 24.99, type: 'number', unit: 'USD', label: 'Target Retail MSRP' },
        { key: 'mouth_peak_temp_c', value: 41.0, type: 'number', unit: '°C', label: 'Mouthpiece Limiter Temp' },
        { key: 'cartridge_latent_heat', value: 14.2, type: 'number', unit: 'kJ', label: 'Cartridge Latent Heat' },
        { key: 'cartridge_reset_time_min', value: 6, type: 'number', unit: 'min', label: 'Boil Reset Time' },
        { key: 'pcm_chemistry', value: 'Sodium Acetate Trihydrate (NaC2H3O2 · 3H2O)', type: 'string', label: 'Phase Change Material' },
        { key: 'inner_tube_material', value: 'Food-grade Passivated 316L Stainless', type: 'string', label: 'Heat Transfer Lumen' }
      ],
      relationships: [
        { type: 'DERIVED_FROM', target_twin_id: '0001', description: 'Evolution of RESIP thermal straw' }
      ],
      assets: [
        {
          relative_path: 'redrink_thermal_simulation',
          media_type: 'application/canvas-interactive',
          size_bytes: 42000,
          is_entrypoint: 1,
          entrypoint_name: 'Dual-Straw Thermal Twin',
          publication_scope: 'public_preview'
        },
        {
          relative_path: 'redrink_cartridge_assembly.step',
          media_type: 'application/step',
          size_bytes: 340000,
          is_entrypoint: 0,
          entrypoint_name: 'Snap-in Cartridge CAD & Mold Draft',
          publication_scope: 'private'
        }
      ],
      disclosure: {
        public_preview_approved: true,
        level: 2,
        public_note: 'Side-by-side thermal transfer twin public. Mold tooling and sodium acetate crystallization inhibitors protected under Pitch Pass.',
        public_tabs: ['object', 'behavior', 'history', 'community'],
        callouts: [
          { label: 'Modular Heat Cartridge', description: 'Removable cartridge boils to recharge without boiling the straw body.' },
          { label: 'Mouth-Temperature Limiter', description: 'Passive thermal buffer caps temperature at 41°C to avoid scalding.' },
          { label: 'Visual Crystal Wave', description: 'Transparent outer jacket reveals the phase change front in real time.' }
        ]
      }
    }
  },

  '0001': {
    id: '0001',
    slug: 'resip-straw',
    creator: 'johne.boi',
    created_at: '2016-04-12T00:00:00Z',
    lineage: {
      parent: null,
      descendants: ['redrink'],
      root_twin_id: '0001'
    },
    versions: [
      {
        semver: '1.0.0',
        title: 'redr.ink™ Origin / ReSip Foundation (2016 Science Fair)',
        published_at: '2016-04-12T00:00:00Z'
      }
    ],
    current_version: {
      semver: '1.0.0',
      title: 'redr.ink™ Origin / ReSip Foundation (2016)',
      summary: 'The original 2016 Science Fair foundation record that pioneered battery-free phase-change thermal straws, rebranded and evolved into redr.ink™. Solid-state thermal exchange releasing 12.05 kJ latent heat.',
      license: 'CERN-OHL-S-2.0',
      ontology_class: 'PhysicalObject',
      properties: [
        { key: 'estimated_bom_usd', value: 4.5, type: 'number', unit: 'USD', label: 'Estimated Unit BOM' },
        { key: 'target_retail_msrp', value: 25.0, type: 'number', unit: 'USD', label: 'Target MSRP' },
        { key: 'weight_grams', value: 45, type: 'number', unit: 'g', label: 'Weight' },
        { key: 'latent_heat_release', value: 12.05, type: 'number', unit: 'kJ', label: 'Latent Heat Capacity' },
        { key: 'peak_core_temp', value: 54.0, type: 'number', unit: '°C', label: 'Peak Core Temperature' }
      ],
      relationships: [],
      assets: [
        {
          relative_path: 'resip_preview.glb',
          url: '/resip_preview.glb',
          media_type: 'model/gltf-binary',
          size_bytes: 28876,
          is_entrypoint: 1,
          entrypoint_name: 'Concept Preview GLB',
          publication_scope: 'public_preview'
        },
        {
          relative_path: 'resip_assembly.step',
          media_type: 'application/step',
          size_bytes: 1048576,
          is_entrypoint: 0,
          entrypoint_name: 'Full Parametric Assembly',
          publication_scope: 'private'
        },
        {
          relative_path: 'bom.csv',
          media_type: 'text/csv',
          size_bytes: 570,
          is_entrypoint: 0,
          entrypoint_name: 'Bill of Materials',
          publication_scope: 'private'
        }
      ],
      disclosure: {
        public_preview_approved: true,
        level: 1,
        public_note: 'Verified 2016 Science Fair invention record. Protected by PRIVATE ACCESS architecture.',
        public_tabs: ['object', 'evidence', 'history', 'community'],
        callouts: [
          { label: 'Latent Heat Capture', description: 'Uses sodium acetate trihydrate phase change to warm fluids.' },
          { label: 'Passivated Conduit', description: '316L surgical stainless steel lumen ensures food safety.' }
        ]
      }
    }
  }
};

export function getLocalTwin(id: string): TwinData | null {
  const norm = id.toLowerCase().trim();
  if (norm === 'twizzlock' || norm === 'twizzlock-v1' || norm === '0002') {
    return TWINS_DATABASE['twizzlock'];
  }
  if (norm === 'redrink' || norm === 'redr-ink' || norm === 'redr.ink' || norm === '0003') {
    return TWINS_DATABASE['redrink'];
  }
  if (norm === '0001' || norm === 'resip' || norm === 'resip-straw') {
    return TWINS_DATABASE['0001'];
  }
  return null;
}
