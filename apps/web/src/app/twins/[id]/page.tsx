import { TwinData } from '@/lib/types';
import TwinTabs from '@/components/TwinTabs';
import { getApiUrl } from '@/lib/api';
import { notFound } from 'next/navigation';

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let twin: TwinData | null = null;
  
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/twins/${id}`, { cache: 'no-store' });
    if (res.ok) {
      twin = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch twin:", err);
  }

  if (!twin) {
    notFound();
  }

  return (
    <div style={{ width: '100%' }}>
      <TwinTabs twin={twin} />
    </div>
  );
}
