import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Cormorant_Garamond, Literata } from 'next/font/google';
import HomeOpening from '@/components/HomeOpening';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

// the headline variant, for comparing: ?headline=canon
const literata = Literata({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'twinth.ink',
  description: 'A place where ideas are kept, given away, and built on.',
};

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

// The front page: the film, a few words, and the way in.
export default async function HomePage({ searchParams }: Props) {
  const seen = (await cookies()).get('twinthink_intro_seen')?.value === '1';
  const headline = (await searchParams).headline === 'canon' ? 'canon' : 'mission';
  return (
    <div className={serif.variable}>
      <HomeOpening firstVisit={!seen} headline={headline} literata={literata.className} />
    </div>
  );
}
