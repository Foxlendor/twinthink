import { TwinData } from '@/lib/types';
import TwinTabs from '@/components/TwinTabs';
import { getApiUrl } from '@/lib/api';
import { FALLBACK_TWINS } from '@/lib/mockTwins';
import { notFound } from 'next/navigation';

export default async function CreatorTwinPage({ 
  params 
}: { 
  params: Promise<{ creator: string; id: string }> 
}) {
  const { creator, id } = await params;
  
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
    console.warn(`Direct fetch for creator ${creator} twin ${id} failed:`, err);
  }

  // Fallback support for canonical specimens
  if (!twin && FALLBACK_TWINS[id]) {
    twin = FALLBACK_TWINS[id];
  }

  if (!twin) {
    notFound();
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Private Access Trajectory Badge */}
      <div style={{
        maxWidth: '1120px',
        margin: '0.75rem auto 0',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.75rem',
        color: '#6B7280'
      }}>
        <span style={{
          background: '#111827',
          color: '#FFFFFF',
          padding: '0.15rem 0.5rem',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '0.7rem'
        }}>
          PRIVATE ACCESS
        </span>
        <span>Direct Trajectory: <strong>{creator}/{id}</strong> (Encrypted Capsule)</span>
      </div>

      <TwinTabs twin={twin} />
    </div>
  );
}
