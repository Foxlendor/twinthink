import TwinRealityEngine from '@/components/TwinRealityEngine';

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TwinRealityEngine initialTwinId={id} />;
}
