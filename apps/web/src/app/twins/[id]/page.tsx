import { TwinData } from '@/lib/types';
import TwinTabs from '@/components/TwinTabs';
import { getApiUrl } from '@/lib/api';
import { FALLBACK_TWINS } from '@/lib/mockTwins';
import { notFound } from 'next/navigation';

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let twin: TwinData | null = null;
  
  try {
    const apiUrl = getApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiUrl}/api/twins/${id}`, { 
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      twin = await res.json();
    }
  } catch (err) {
    console.warn(`Direct fetch for twin ${id} failed or timed out, evaluating fallback mock:`, err);
  }

  // Graceful fallback for canonical specimens
  if (!twin && FALLBACK_TWINS[id]) {
    twin = FALLBACK_TWINS[id];
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
