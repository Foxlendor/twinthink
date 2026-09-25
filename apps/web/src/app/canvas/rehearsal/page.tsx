import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import RehearsalField from './RehearsalField';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TwinThink rehearsal field',
  description: 'Synthetic specimens used to test the Shadow Field at scale. Not human ideas.',
  robots: { index: false },
};

export default function RehearsalPage() {
  return (
    <main className={serif.variable}>
      <RehearsalField serif={serif.style.fontFamily} />
    </main>
  );
}
