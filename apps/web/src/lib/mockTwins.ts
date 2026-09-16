import { TwinData } from './types';

export const CANONICAL_TWIN_0001: TwinData = {
  id: "0001",
  slug: "0001-resip-thermal-straw",
  creator: "Foxlendor",
  created_at: "2026-08-30 12:00:00",
  current_version: {
    semver: "1.0.0",
    title: "Resip™ Thermal Drink Straw (Outdoor Edition)",
    summary: "Solid-state, battery-free thermal exchange drink straw for backcountry recreation. Releases 12.05 kJ latent crystallization enthalpy on-demand via mechanical snap-disc trigger.",
    license: "CERN-OHL-S-2.0",
    ontology_class: "PhysicalObject",
    bundle_storage_key: "twins/0001/versions/1.0.0/bundle.zip",
    cad_glb_key: "twins/0001/versions/1.0.0/assets/cad/preview.glb",
    properties: [
      { key: "estimated_bom_usd", value: 4.5, type: "number", unit: "USD", label: "Estimated Unit BOM" },
      { key: "target_retail_msrp", value: 25.0, type: "number", unit: "USD", label: "Target MSRP" },
      { key: "weight_grams", value: 45, type: "number", unit: "g", label: "Weight" },
      { key: "difficulty", value: "intermediate", type: "string", label: "Difficulty" },
      { key: "pcm_core_mass", value: 50, type: "number", unit: "g", label: "PCM Core Mass" },
      { key: "latent_heat_release", value: 12.05, type: "number", unit: "kJ", label: "Latent Heat Capacity" },
      { key: "peak_core_temp", value: 54.0, type: "number", unit: "°C", label: "Peak Core Temp" }
    ],
    simulation: {
      engine: "twinthink.simulation.thermal",
      entrypoint: "simulation/thermal.py",
      parameters: "simulation/parameters.json",
      results: "simulation/simulation_results.json",
      scenarios_dir: "simulation/scenarios"
    },
    relationships: [],
    assets: [
      {
        relative_path: "README.md",
        url: "/fixtures/valid/straw_v1/README.md",
        media_type: "text/markdown",
        size_bytes: 2400,
        is_entrypoint: 1,
        entrypoint_name: "readme"
      },
      {
        relative_path: "spec.md",
        url: "/fixtures/valid/straw_v1/spec.md",
        media_type: "text/markdown",
        size_bytes: 4100,
        is_entrypoint: 1,
        entrypoint_name: "spec"
      },
      {
        relative_path: "bom.csv",
        url: "/fixtures/valid/straw_v1/bom.csv",
        media_type: "text/csv",
        size_bytes: 380,
        is_entrypoint: 1,
        entrypoint_name: "bom"
      },
      {
        relative_path: "cad/preview.glb",
        url: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
        media_type: "model/gltf-binary",
        size_bytes: 18000,
        is_entrypoint: 1,
        entrypoint_name: "cad_preview"
      },
      {
        relative_path: "cad/primary.step",
        url: "https://twinthink.onrender.com/api/twins/0001/assets/cad/primary.step",
        media_type: "application/step",
        size_bytes: 284000,
        is_entrypoint: 1,
        entrypoint_name: "cad_step"
      },
      {
        relative_path: "simulation/thermal.py",
        url: "https://twinthink.onrender.com/api/twins/0001/assets/simulation/thermal.py",
        media_type: "text/x-python",
        size_bytes: 5200,
        is_entrypoint: 1,
        entrypoint_name: "sim_engine"
      },
      {
        relative_path: "simulation/parameters.json",
        url: "https://twinthink.onrender.com/api/twins/0001/assets/simulation/parameters.json",
        media_type: "application/json",
        size_bytes: 850,
        is_entrypoint: 1,
        entrypoint_name: "sim_params"
      },
      {
        relative_path: "simulation/simulation_results.json",
        url: "https://twinthink.onrender.com/api/twins/0001/assets/simulation/simulation_results.json",
        media_type: "application/json",
        size_bytes: 6400,
        is_entrypoint: 1,
        entrypoint_name: "sim_results"
      },
      {
        relative_path: "testing/test-results.csv",
        url: "https://twinthink.onrender.com/api/twins/0001/assets/testing/test-results.csv",
        media_type: "text/csv",
        size_bytes: 1200,
        is_entrypoint: 1,
        entrypoint_name: "test_data"
      }
    ]
  },
  lineage: {
    parent: null,
    descendants: ["0002"],
    root_twin_id: "0001"
  },
  versions: [
    {
      semver: "1.0.0",
      title: "Resip™ Thermal Drink Straw (Outdoor Edition)",
      published_at: "2026-08-30 12:00:00"
    }
  ]
};

export const CANONICAL_TWIN_0002: TwinData = {
  id: "0002",
  slug: "0002-haptic-glove---high-torque-mod",
  creator: "mech_pro",
  created_at: "2026-08-26 18:04:54",
  current_version: {
    semver: "1.0.0",
    title: "Haptic Glove - High Torque Mod",
    summary: "Forked with metal-gear micro servos for precision haptic feedback.",
    license: "CERN-OHL-S-2.0",
    ontology_class: 'PhysicalObject',
    bundle_storage_key: "twins/0002/versions/1.0.0/bundle.zip",
    cad_glb_key: "twins/0002/versions/1.0.0/assets/cad/preview.glb",
    properties: [
      { key: "estimated_bom_usd", value: 78.0, type: "number", unit: "USD", label: "Estimated BOM" },
      { key: "weight_grams", value: 275, type: "number", unit: "g", label: "Weight" },
      { key: "build_time_hours", value: 8.5, type: "number", unit: "hours", label: "Build Time" },
      { key: "difficulty", value: "intermediate", type: "string", label: "Difficulty" }
    ],
    relationships: [
      { type: "forks", target_twin_id: "0001", description: "Forked from base haptic glove" }
    ],
    assets: [
      {
        relative_path: "cad/preview.glb",
        url: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
        media_type: "model/gltf-binary",
        size_bytes: 22000,
        is_entrypoint: 1,
        entrypoint_name: "cad_preview"
      },
      {
        relative_path: "bom.csv",
        url: "/api/twins/0002/assets/bom.csv",
        media_type: "text/csv",
        size_bytes: 48,
        is_entrypoint: 1,
        entrypoint_name: "bom"
      },
      {
        relative_path: "cad/primary.step",
        url: "/api/twins/0002/assets/primary.step",
        media_type: "application/octet-stream",
        size_bytes: 154000,
        is_entrypoint: 1,
        entrypoint_name: "cad_source"
      },
      {
        relative_path: "spec.md",
        url: "/api/twins/0002/assets/spec.md",
        media_type: "text/markdown",
        size_bytes: 3500,
        is_entrypoint: 1,
        entrypoint_name: "spec"
      }
    ]
  },
  lineage: {
    parent: {
      parent_twin_id: "0001",
      parent_version: "1.0.0",
      mutation_notes: "Replaced plastic servos with MG90S metal-gear servos for 2x grip force."
    },
    descendants: [],
    root_twin_id: "0001"
  },
  versions: [
    {
      semver: "1.0.0",
      title: "Haptic Glove - High Torque Mod",
      published_at: "2026-08-26 18:04:54"
    }
  ]
};

export const CANONICAL_TWIN_0003: TwinData = {
  id: "0003",
  slug: "0003-ontology-engine-core",
  creator: "sys_admin",
  created_at: "2026-08-28 10:00:00",
  current_version: {
    semver: "0.1.0",
    title: "Ontology Engine Core",
    summary: "The semantic graph resolver and validation engine for TWINTH.INK",
    license: "MIT",
    ontology_class: 'Software',
    properties: [
      { key: "language", value: "TypeScript", type: "string", label: "Language" },
      { key: "dependencies", value: 12, type: "number", label: "Deps Count" },
      { key: "test_coverage", value: 94.5, type: "number", unit: "%", label: "Coverage" },
      { key: "is_production_ready", value: false, type: "boolean", label: "Prod Ready" }
    ],
    relationships: [
      { type: "implements", target_twin_id: "0004", description: "Implements the abstract twin specification" }
    ],
    assets: [
      {
        relative_path: "docs/readme.md",
        url: "https://raw.githubusercontent.com/markedjs/marked/master/README.md",
        media_type: "text/markdown",
        size_bytes: 5000,
        is_entrypoint: 1,
        entrypoint_name: "readme"
      }
    ]
  },
  lineage: {
    parent: null,
    descendants: [],
    root_twin_id: "0003"
  },
  versions: [
    { semver: "0.1.0", title: "Ontology Engine Core", published_at: "2026-08-28 10:00:00" }
  ]
};

export const FALLBACK_TWINS: Record<string, TwinData> = {
  '0001': CANONICAL_TWIN_0001,
  '0002': CANONICAL_TWIN_0002,
  '0003': CANONICAL_TWIN_0003
};
