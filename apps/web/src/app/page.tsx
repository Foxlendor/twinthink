'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user));
  }, []);

  const handleViewCanvas = () => {
    if (username.trim()) {
      router.push(`/canvas/${username.toLowerCase()}`);
    }
  };

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 70px)',
        background: '#fbfaf7',
        color: '#1e1c24',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        gap: '3rem',
      }}
    >
      <div style={{ maxWidth: '800px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 300, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
          Your ideas, verified and seen by who you choose.
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.7, margin: '0 0 2rem' }}>
          TwinThink is your personal Canvas: a space where your creative work lives with complete lineage. See what resonates. Build on what inspires you. Only you decide what's shared.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Enter a username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleViewCanvas()}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            width: '200px',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleViewCanvas}
          style={{
            padding: '0.75rem 2rem',
            background: '#1e1c24',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          View Canvas
        </button>
      </div>

      <div style={{ textAlign: 'center', color: '#666' }}>
        <p>Try: <code style={{ background: '#f0f0f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>johne.boi</code></p>
      </div>

      <div style={{ maxWidth: '900px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', marginTop: 0 }}>Build Your Canvas</h3>
          <p style={{ color: '#666', lineHeight: 1.6 }}>
            Sign in and create your own Canvas. Import your verified lineage, add your ideas, and curate what matters to you.
          </p>
          {!user ? (
            <Link href="/api/auth/signin" style={{ color: '#1e1c24', textDecoration: 'underline' }}>
              Sign in
            </Link>
          ) : (
            <Link href={`/canvas/${user.owner}`} style={{ color: '#1e1c24', textDecoration: 'underline' }}>
              Go to your Canvas
            </Link>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', marginTop: 0 }}>Verified Lineage</h3>
          <p style={{ color: '#666', lineHeight: 1.6 }}>
            Every idea carries its history. Export your lineage as a verifiable ZIP, then reimport it here with proof of origin.
          </p>
          <Link href="/docs/lineage" style={{ color: '#1e1c24', textDecoration: 'underline' }}>
            Learn how
          </Link>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', marginTop: 0 }}>Your Private Archive</h3>
          <p style={{ color: '#666', lineHeight: 1.6 }}>
            Everything is private by default. Only share what you choose, with exactly who you choose.
          </p>
          <Link href="/docs/faq" style={{ color: '#1e1c24', textDecoration: 'underline' }}>
            Questions answered
          </Link>
        </div>
      </div>
    </main>
  );
}
