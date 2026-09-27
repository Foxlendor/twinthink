import type { Metadata } from 'next';
import Link from 'next/link';
import { Cormorant_Garamond } from 'next/font/google';
import BrandVideoBanner from '@/components/BrandVideoBanner';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'twinth.ink',
  description: 'A place where ideas are kept, given away, and built on.',
};

// The front page: a few words, and the way in.
export default function HomePage() {
  const font = 'var(--font-serif), Georgia, serif';
  return (
    <main
      className={serif.variable}
      style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'grid', placeItems: 'center', padding: '48px 24px', textAlign: 'center', overflow: 'hidden' }}
    >
      {/* his ink film, behind the words */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.85 }}>
        <BrandVideoBanner />
      </div>
      <div
        style={{
          position: 'relative',
          maxWidth: 560,
          padding: '36px 28px',
          borderRadius: 22,
          background: 'var(--card-bg)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h1 style={{ fontFamily: font, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(2.4rem, 7vw, 3.6rem)', lineHeight: 1.1, margin: 0, color: 'var(--text-primary)' }}>
          every idea deserves a place.
        </h1>
        <p style={{ fontFamily: font, fontSize: '1.25rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: '20px auto 36px' }}>
          songs, dances, drawings and inventions, kept by the people who made them, given away, and built on.
        </p>
        <Link
          href="/slate"
          style={{ fontFamily: font, fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: 2 }}
        >
          fall in
        </Link>
        <p style={{ marginTop: 56 }}>
          <Link href="/support" style={{ fontFamily: font, fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            help keep it here
          </Link>
        </p>
      </div>
    </main>
  );
}
