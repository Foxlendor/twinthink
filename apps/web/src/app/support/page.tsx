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
      style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', background: '#fbfaf7', padding: '48px 20px' }}
    >
      <div style={{ maxWidth: 520, width: '100%' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '2.2rem',
            color: '#1e1c24',
            margin: 0,
          }}
        >
          {thanks ? 'thank you.' : 'keep ideas alive.'}
        </h1>
        <p style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.15rem', color: 'rgba(30,28,36,0.6)', margin: '14px 0 28px' }}>
          {thanks
            ? 'Your gift went straight to keeping TwinThink running.'
            : 'TwinThink has no ads to sell and no ideas to sell. If you want it to exist, you can help.'}
        </p>
        {!thanks && <Donate />}
        <p style={{ marginTop: 36 }}>
          <Link href="/canvas" style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontStyle: 'italic', color: 'rgba(30,28,36,0.6)' }}>
            back to the Canvas
          </Link>
        </p>
      </div>
    </main>
  );
}
