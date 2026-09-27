import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import Link from 'next/link';
import Donate from '@/components/support/Donate';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Support TwinThink',
  description: 'Help keep a place where ideas can live.',
};

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ thanks?: string }> }) {
  const { thanks } = await searchParams;
  return (
    <main
      className={serif.variable}
      style={{ minHeight: 'calc(100vh - 64px)', display: 'grid', placeItems: 'center', padding: '48px 20px' }}
    >
      <div style={{ maxWidth: 520, width: '100%' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '2.2rem',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {thanks ? 'thank you.' : 'keep ideas alive.'}
        </h1>
        <p style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.15rem', color: 'var(--text-secondary)', margin: '14px 0 28px' }}>
          {thanks
            ? 'Your gift went straight to keeping TwinThink running.'
            : 'No ads, and no one’s ideas for sale. If you want it to keep existing, you can help. A gift is only a gift: it buys nothing and pays nothing back.'}
        </p>
        {!thanks && <Donate />}
        <p style={{ marginTop: 36 }}>
          <Link href="/slate" style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            back to the Slate
          </Link>
        </p>
      </div>
    </main>
  );
}
