'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from './BrandLogo';

// A few words at the top of the page: where you are, the way in, and day or night.
export default function Navbar() {
  const pathname = usePathname();

  // day or night, shared with the Canvas's own night switch
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // read what the pre-paint script already chose
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);
  const toggleDark = () => {
    const on = !dark;
    setDark(on);
    if (on) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.setItem('twinthink.night.v1', on ? '1' : '0');
    } catch {
      // optional
    }
  };

  // The Slate has its own quiet chrome.
  if (pathname?.startsWith('/slate')) return null;

  const word: React.CSSProperties = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
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
        <button type="button" onClick={toggleDark} style={word} aria-pressed={dark}>
          {dark ? 'day' : 'night'}
        </button>
      </nav>
    </header>
  );
}
