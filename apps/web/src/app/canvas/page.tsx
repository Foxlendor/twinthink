import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import ShadowField from '@/components/shadowfield/ShadowField';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TwinThink Canvas',
  description: 'A field of human ideas. Move closer to one and go inside it.',
};

export default function CanvasPage() {
  return (
    <main className={serif.variable}>
      <ShadowField serif={serif.style.fontFamily} />
    </main>
  );
}
