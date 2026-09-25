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
  title: 'TwinThink',
  description: 'A field of human ideas. Move closer to one and go inside it.',
};

// The Canvas is TwinThink: the front door is the field itself.
export default function Home() {
  return (
    <main className={serif.variable}>
      <ShadowField serif={serif.style.fontFamily} />
    </main>
  );
}
