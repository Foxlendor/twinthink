'use client';

import React from 'react';
import BrandVideoBanner from '@/components/BrandVideoBanner';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 70px)',
        background: '#FAFAFA',
        color: '#111827',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem'
      }}
    >
      {/* Massive Background Logo Asset */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
        <BrandVideoBanner />
      </div>

      {/* Ultra-Minimalist Hero Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px' }}>
        <h1
          style={{
            fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            margin: '0 0 1.5rem',
            color: '#111827'
          }}
        >
          Yo twin.<br />Ideas to records.
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: '#4B5563',
            lineHeight: 1.6,
            margin: '0 auto',
            fontWeight: 500,
            maxWidth: '500px'
          }}
        >
          No BS. Just open records for physical inventions. Build, test, and verify.
        </p>
      </div>
    </main>
  );
}
