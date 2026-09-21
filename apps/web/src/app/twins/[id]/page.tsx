import { getApiUrl } from '@/lib/api';
import { notFound } from 'next/navigation';
import TwinTabs from '@/components/TwinTabs';
import { getLocalTwin } from '@/lib/twinsData';

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const localTwin = getLocalTwin(id);

  try {
    const apiUrl = getApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${apiUrl}/api/twins/${id}`, {
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const twin = await res.json();
      if (twin && twin.id) {
        return (
          <div style={{ width: '100%' }}>
            <TwinTabs twin={twin} />
          </div>
        );
      }
    }
  } catch {
    // Backend API unavailable or timed out; fall back to local twin if available
  }

  if (localTwin) {
    return (
      <div style={{ width: '100%' }}>
        <TwinTabs twin={localTwin} />
      </div>
    );
  }

  notFound();
}

