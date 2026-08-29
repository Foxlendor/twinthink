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
  semver: string;
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
