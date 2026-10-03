export type OntologyClass = 'PhysicalObject' | 'DigitalAsset' | 'Concept' | 'Software' | 'Document' | 'Person' | 'MetaConcept';

export type EpistemicStatus =
  | 'VERIFIED'
  | 'ESTABLISHED'
  | 'EXPERIMENTAL'
  | 'PARTIALLY_ESTABLISHED'
  | 'ESTIMATED'
  | 'ASSUMED'
  | 'CONCEPTUAL'
  | 'UNKNOWN'
  | 'LITERATURE'
  | 'MEASURED'
  | 'CALIBRATED';

export interface Author {
  name: string;
  handle: string;
}

export interface TwinIdentityV01 {
  twin_id: string;
  slug: string;
  title: string;
  subtitle: string;
  version: string;
  author: Author;
  license: string;
  created_at?: string;
}

export interface RealityDimensionV01 {
  status: string;
  confidence: number;
  reason: string;
}

export interface RealityStateV01 {
  composite_score: number;
  derived_dimensions: {
    structure: RealityDimensionV01;
    thermal: RealityDimensionV01;
    materials: RealityDimensionV01;
    safety: RealityDimensionV01;
    manufacturing: RealityDimensionV01;
    [key: string]: RealityDimensionV01;
  };
}

export interface ClaimSourceV01 {
  type: string;
  reference: string;
}

export interface ClaimV01 {
  id: string;
  target_node: string;
  statement: string;
  value?: {
    magnitude: number | string;
    unit?: string;
    tolerance?: string;
    currency?: string;
  };
  epistemic_status: EpistemicStatus;
  confidence: number;
  source: ClaimSourceV01;
  evidence_ids: string[];
  relationships: string[];
}

export interface ObjectLayerV01 {
  id: string;
  name: string;
  role: string;
}

export interface TwinObjectV01 {
  primary_3d: string;
  cad_source: string;
  layers: ObjectLayerV01[];
}

export interface ComponentV01 {
  id: string;
  name: string;
  qty: number;
  unit_cost: number;
  material: string;
  supplier?: string;
}

export interface TwinStructureV01 {
  bom_file: string;
  component_count: number;
  components: ComponentV01[];
}

export interface TwinBehaviorV01 {
  solver: string;
  governing_equations: string[];
  parameters: Record<string, { val: number; status: string }>;
}

export interface EvidenceTestRunV01 {
  id: string;
  date: string;
  file: string;
  type: string;
  rmse?: number;
}

export interface TwinEvidenceV01 {
  test_runs: EvidenceTestRunV01[];
}

export interface HistoryEstablishedNodeV01 {
  date: string;
  title: string;
  source: string;
  provenance_level: string;
}

export interface TwinHistoryV01 {
  curated_manifest: string;
  established_nodes: HistoryEstablishedNodeV01[];
}

export interface TwinLineageV01 {
  parent: string | null;
  forks_count: number;
  mutations: any[];
}

export interface UnknownRiskV01 {
  id: string;
  category: string;
  issue: string;
}

export interface TwinDocumentV01 {
  $schema?: string;
  identity: TwinIdentityV01;
  reality_state: RealityStateV01;
  claims: ClaimV01[];
  object: TwinObjectV01;
  structure: TwinStructureV01;
  behavior: TwinBehaviorV01;
  evidence: TwinEvidenceV01;
  history: TwinHistoryV01;
  lineage: TwinLineageV01;
  unknowns: UnknownRiskV01[];
}

// Backward compatibility interfaces
export interface TwinProperty {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'reference';
  unit?: string;
  label?: string;
}

export interface TwinRelationship {
  type: string;
  target_twin_id: string;
  description?: string;
}

export interface TwinAsset {
  relative_path: string;
  url?: string;
  storage_key?: string;
  media_type: string;
  size_bytes: number;
  is_entrypoint: number;
  entrypoint_name: string;
}

export interface TwinVersion {
  semver?: string;
  version?: string;
  title: string;
  summary: string;
  license: string;
  ontology_class: OntologyClass;
  manifest_metadata?: any;
  bundle_storage_key?: string;
  cad_glb_key?: string;
  properties: TwinProperty[];
  relationships: TwinRelationship[];
  assets: TwinAsset[];
}

export interface TwinData {
  id: string;
  slug: string;
  creator: string;
  created_at: string;
  current_version: TwinVersion;
  lineage: {
    parent: {
      parent_twin_id: string;
      parent_version: string;
      mutation_notes: string;
    } | null;
    descendants: any[];
    root_twin_id: string;
  };
  versions: {
    semver: string;
    title: string;
    created_at?: string;
    published_at?: string;
  }[];
}

export interface TwinTestRecord {
  id: string;
  twin_id: number;
  test_number: number;
  title: string;
  operator: string;
  status: string;
  notes?: string;
  s3_csv_key?: string;
  metrics: {
    duration_s?: number;
    peak_pcm_temp_C?: number;
    peak_outlet_temp_C?: number;
    average_outlet_temp_C?: number;
    total_energy_delivered_J?: number;
    rmse_vs_ode?: number;
    [key: string]: any;
  };
  initial_conditions?: {
    ambient_C?: number;
    inlet_C?: number;
    initial_pcm_C?: number;
    flow_rate_ml_s?: number;
  };
  raw_preview?: Array<{
    time_s: number;
    pcm_C: number;
    drink_inlet_C: number;
    drink_outlet_C: number;
    flow_rate_ml_s: number;
    ambient_C?: number;
  }>;
  created_at?: string;
}

export interface TwinTestsResponse {
  summary?: { physical_tests_count: number; mean_absolute_error_C: number; root_mean_square_error_C: number; model_status: string; last_test: string };
  tests: TwinTestRecord[];
}
