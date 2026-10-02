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
  const title = d ? `${d.title} · TwinThink` : 'TwinThink Slate';
  const description = d?.line ?? 'Songs, dances, animation and inventions by johne.boi.';
  const image = `/slate/og${d && one ? `?at=${encodeURIComponent(one)}` : ''}`;
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
      {/* the old front page words, now kept on the Slate */}
      <div
        aria-label="every idea deserves a place"
        style={{ position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', width: 'min(520px, 80vw)', textAlign: 'center', pointerEvents: 'none', zIndex: 1, fontFamily: `var(--font-serif), Georgia, serif`, color: 'var(--text-secondary)' }}
      >
        <p style={{ fontStyle: 'italic', fontSize: '1.4rem', lineHeight: 1.2, margin: 0 }}>every idea deserves a place.</p>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.4, margin: '6px 0 0' }}>songs, dances, drawings and inventions, kept by the people who made them, given away, and built on.</p>
      </div>
    </main>
  );
}
