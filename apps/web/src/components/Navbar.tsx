'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from './BrandLogo';

// A few words at the top of the page: where you are, and the way in.
export default function Navbar() {
  const pathname = usePathname();

  // The Slate has its own quiet chrome.
  if (pathname?.startsWith('/slate')) return null;

  const word: React.CSSProperties = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
  };
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', height: 64 }}>
      <Link href="/" aria-label="twinth.ink, home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'var(--text-primary)' }}>
        <BrandLogo height={32} />
      </Link>
      <nav style={{ display: 'flex', gap: 22, alignItems: 'baseline' }}>
        <Link href="/slate" style={word}>
          slate
        </Link>
        <Link href="/support" style={word}>
          support
        </Link>
      </nav>
    </header>
  );
}
