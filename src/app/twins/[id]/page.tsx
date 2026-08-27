import { TwinData } from '@/lib/types';
import TwinHeader from '@/components/TwinHeader';
import TwinHero from '@/components/TwinHero';
import TwinTabs from '@/components/TwinTabs';
import { notFound } from 'next/navigation';

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // In a real app, this would be a database call or fetch to an external API
  // Here we're fetching from our mock API route
  // We need absolute URL for server-side fetching, or we can just mock it directly here
  // For simplicity and to avoid SSR fetch issues with absolute URLs in dev, we'll fetch from the route using a relative-like approach if possible, but actually let's just mock the response directly or use a full URL.
  // Wait, Next.js allows fetching full URLs. Since we don't know the port in advance safely (might be 3000, 3001), let's just import the GET handler or mock it directly.
  
  // Since we have the mock API at /api/twins/[id], let's try to fetch it.
  // To avoid PORT issues in SSR, we'll construct the mock data here if it's 0002.
  let twin: TwinData | null = null;
  
  if (id === '0002') {
    twin = {
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
  }

  if (!twin) {
    notFound();
  }

  return (
    <main className="container" style={{ paddingBottom: '4rem' }}>
      <TwinHeader twin={twin} />
      <TwinHero twin={twin} />
      <TwinTabs twin={twin} />
    </main>
  );
}
