import { getApiUrl } from '@/lib/api';
import { notFound } from 'next/navigation';
import TwinTabs from '@/components/TwinTabs';

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

    // The API is the publication authority. A route existing is never proof of publication.
    if (
      twin?.current_version?.disclosure?.public_preview_approved !== true ||
      twin?.current_version?.assets?.some((asset: any) => asset.publication_scope === 'public_preview') !== true
    ) {
      notFound();
    }

    return (
      <div style={{ width: '100%' }}>
        <TwinTabs twin={twin} />
      </div>
    );
  } catch {
    notFound();
  }
}
