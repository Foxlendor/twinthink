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
  semver: string;
  title: string;
  summary: string;
  license: string;
  bundle_storage_key?: string;
  cad_glb_key?: string;
  metrics: {
    estimated_bom_usd: number;
    weight_grams: number;
    build_time_hours: number;
    difficulty: string;
  };
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
