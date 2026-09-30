import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Cormorant_Garamond } from 'next/font/google';
import FallSpace from '@/components/fall/FallSpace';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Fall (preview)',
  robots: { index: false, follow: false },
};

/** The Fall formed by relationships, with real examples from Wikipedia: previews only, never the real site. */
export default function FallPage() {
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'production') notFound();
  return (
    <main className={serif.variable}>
      <FallSpace serif={serif.style.fontFamily} />
    </main>
  );
}
