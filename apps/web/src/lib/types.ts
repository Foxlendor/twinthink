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
}

export interface TwinVersion {
  semver?: string;
  version?: string;
  title: string;
  summary: string;
  license: string;
  ontology_class: OntologyClass;
  manifest_metadata?: any;
  
  // Legacy specific keys (can be moved to properties or kept as shortcuts)
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
    published_at: string;
  }[];
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
