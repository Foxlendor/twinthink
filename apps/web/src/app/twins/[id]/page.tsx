import { getApiUrl } from '@/lib/api';
import { notFound } from 'next/navigation';

/*
 * Public TwinThink publication registry.
 *
 * This list is intentionally empty until an inventor explicitly approves
 * a twin for public publication. Do not infer publication from existence,
 * API availability, creator ownership, or an old fixture.
 */
const PUBLIC_TWIN_IDS = new Set<string>([]);

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!PUBLIC_TWIN_IDS.has(id)) {
    notFound();
  }

  try {
    const apiUrl = getApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiUrl}/api/twins/${id}`, {
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      notFound();
    }

    const twin = await res.json();

    // Publication is an explicit state, not something inferred from existence.
    if (twin?.visibility !== 'public' || twin?.publication_status !== 'approved') {
      notFound();
    }

    const { default: TwinTabs } = await import('@/components/TwinTabs');

    return (
      <div style={{ width: '100%' }}>
        <TwinTabs twin={twin} />
      </div>
    );
  } catch {
    notFound();
  }
}
