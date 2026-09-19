export type OntologyClass = 'PhysicalObject' | 'DigitalAsset' | 'Concept' | 'Software' | 'Document' | 'Person' | 'MetaConcept';

export interface TwinProperty {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'reference';
  unit?: string;
  label?: string; // Optional human-readable label
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
  publication_scope?: 'private' | 'public_preview';
}

export interface TwinVersion {
  semver?: string;
  version?: string;
  title: string;
  summary: string;
  license: string;
  ontology_class: OntologyClass;
  
  // Legacy specific keys (can be moved to properties or kept as shortcuts)
  bundle_storage_key?: string;
  cad_glb_key?: string;
  
  properties: TwinProperty[];
  relationships: TwinRelationship[];
  assets: TwinAsset[];
  simulation?: any;
  disclosure?: {
    public_preview_approved?: boolean;
    level?: number;
    public_note?: string;
    callouts?: Array<{
      label: string;
      description: string;
    }>;
  };
  manifest_metadata?: any;
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
    published_at: string;
  }[];
  document?: any;
}

export interface TwinTestMetrics {
  rmse_C: number;
  mae_C: number;
  max_error_C: number;
  r_squared: number;
  sample_count: number;
  predicted_peak_C: number;
  measured_peak_C: number;
  peak_delta_C: number;
}

export interface TwinTestRecord {
  id: string;
  test_number: number;
  title: string;
  operator: string;
  status: 'verified' | 'unverified' | 'failed';
  notes?: string;
  s3_csv_key: string;
  metrics: TwinTestMetrics;
  initial_conditions: {
    ambient_C: number;
    inlet_C: number;
    initial_pcm_C: number;
  };
  raw_preview: Array<{
    time_s: number;
    ambient_C: number;
    pcm_C: number;
    inlet_C: number;
    outlet_C: number;
    flow_ml_s: number;
  }>;
  created_at: string;
}

export interface TwinTestsSummary {
  physical_tests_count: number;
  mean_absolute_error_C: number;
  root_mean_square_error_C: number;
  model_status: 'EXPERIMENTALLY_CALIBRATED' | 'CALIBRATION_REQUIRED';
  last_test: string;
}

export interface TwinTestsResponse {
  twin_id: string;
  summary: TwinTestsSummary;
  tests: TwinTestRecord[];
}

export interface ProvenanceEntry {
  source: string;
  artifact_hash?: string;
  captured_at: string;
  creator: string;
  creator_identity?: string;
  action: string;
  revision?: string;
  signature?: string;
  notes?: string;
}

export interface IdentityDocument {
  identity_id: string;
  algorithm: string;
  public_key: string;
  name?: string;
  created_at: string;
  status: string;
}

export interface TwinRevisionRecord {
  twin_id: string;
  revision: string;
  parent_revision?: string | null;
  graph_hash: string;
  created_at: string;
  author_identity: string;
  mutation_notes?: string;
  signature: string;
}

export interface RightsPolicyDeclaration {
  mode: 'Private' | 'Licensed' | 'Open Development' | 'Public Domain Dedication' | 'Conditional Release';
  scope: string;
  terms_uri?: string;
  declared_by?: string;
  declared_at: string;
  notes?: string;
}

export interface CapabilityToken {
  token_id: string;
  subject: string;
  twin_id: string;
  permissions: string[];
  issued_by: string;
  created_at: string;
  expires_at?: string;
  signature: string;
}

export interface MaterialSpec {
  name: string;
  grade?: string;
  standard?: string;
  origin_country?: string;
  recycled_content_pct?: number;
  notes?: string;
}

export interface ManufacturingSpec {
  process?: string;
  finish?: string;
  tolerances?: string;
  processing_cost?: number;
}

export interface CostSpec {
  unit_cost?: number | null;
  extended_cost?: number | null;
  currency?: string;
  is_estimated?: boolean;
}

export interface BomNode {
  node_id: string;
  parent_id?: string | null;
  node_type: 'assembly' | 'subassembly' | 'component' | 'raw_material' | 'fastener';
  name: string;
  part_number?: string;
  revision?: string;
  description?: string;
  quantity: number;
  unit: string;
  material?: MaterialSpec;
  manufacturing?: ManufacturingSpec;
  cost?: CostSpec;
  supplier?: string;
  dpp_id?: string;
  cad_body_name?: string;
  provenance?: ProvenanceEntry[];
  rights_override?: 'Private' | 'Licensed' | 'Open Development' | 'Public Domain Dedication' | 'Conditional Release';
  evidence_refs?: string[];
  children?: BomNode[];
}

