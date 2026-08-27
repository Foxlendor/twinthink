import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id === '0002') {
    return NextResponse.json({
      id: "0002",
      slug: "0002-haptic-glove---high-torque-mod",
      creator: "mech_pro",
      created_at: "2026-08-26 18:04:54",
      current_version: {
        semver: "1.0.0",
        title: "Haptic Glove - High Torque Mod",
        summary: "Forked with metal-gear micro servos.",
        license: "CERN-OHL-S-2.0",
        bundle_storage_key: "twins/0002/versions/1.0.0/bundle.zip",
        cad_glb_key: "twins/0002/versions/1.0.0/assets/cad/preview.glb",
        metrics: {
          estimated_bom_usd: 78.0,
          weight_grams: 275,
          build_time_hours: 8.5,
          difficulty: "intermediate"
        },
        assets: [
          {
            relative_path: "cad/preview.glb",
            url: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb", // Using a placeholder GLB that model-viewer hosts
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
    });
  }

  return NextResponse.json({ error: "Twin not found" }, { status: 404 });
}
