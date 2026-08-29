import { NextResponse } from 'next/server';
import { TwinData } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id === '0002') {
    const twin: TwinData = {
      id: "0002",
      slug: "0002-haptic-glove---high-torque-mod",
      creator: "mech_pro",
      created_at: "2026-08-26 18:04:54",
      current_version: {
        semver: "1.0.0",
        title: "Haptic Glove - High Torque Mod",
        summary: "Forked with metal-gear micro servos.",
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
    return NextResponse.json(twin);
  }

  if (id === '0003') {
    const twin: TwinData = {
      id: "0003",
      slug: "0003-ontology-engine-core",
      creator: "sys_admin",
      created_at: "2026-08-28 10:00:00",
      current_version: {
        semver: "0.1.0",
        title: "Ontology Engine Core",
        summary: "The semantic graph resolver for TWINTH.INK",
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
    return NextResponse.json(twin);
  }

  return NextResponse.json({ error: "Twin not found" }, { status: 404 });
}
