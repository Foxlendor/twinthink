import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import ShadowField from '@/components/shadowfield/ShadowField';
import { describeShared } from '@/lib/shadowfield/share';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

/** A link to one thing unfolds into its own card: its name, its line. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const at = (await searchParams).at;
  const one = typeof at === 'string' ? at : undefined;
  const d = one ? await describeShared(one) : null;
  const title = d ? `${d.title} · TwinThink` : 'TwinThink Canvas';
  const description = d?.line ?? 'Songs, dances, animation and inventions by johne.boi.';
  const image = `/canvas/og${d && one ? `?at=${encodeURIComponent(one)}` : ''}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default function CanvasPage() {
  return (
    <main className={serif.variable}>
      <ShadowField serif={serif.style.fontFamily} />
    </main>
  );
}
