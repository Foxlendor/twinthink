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
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
        alignItems: 'center',
        padding: '0 4rem',
        gap: '4rem',
        overflow: 'hidden'
      }}
    >
      {/* Left Column: Typography */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
        <h1
          style={{
            fontSize: 'clamp(3rem, 5vw, 4.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            margin: '0 0 1.5rem',
            color: '#111827'
          }}
        >
          Engineering Truth.<br />
          Open Records.
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: '#4B5563',
            lineHeight: 1.6,
            margin: '0 0 2.5rem',
            fontWeight: 400
          }}
        >
          The authoritative digital infrastructure for physical inventions. Build, simulate, and verify transparent hardware protocols.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a
            href="/explore"
            style={{
              padding: '0.85rem 1.75rem',
              background: '#111827',
              color: '#FFFFFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'background 0.2s'
            }}
          >
            Explore Public Records
          </a>
          <a
            href="/pitch"
            style={{
              padding: '0.85rem 1.75rem',
              background: 'transparent',
              color: '#111827',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'border-color 0.2s'
            }}
          >
            Investor Access
          </a>
        </div>
      </div>

      {/* Right Column: Mirrored Video Pattern */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '1 / 1',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 0,
          opacity: 0.85,
          transform: 'scale(1.1)' // Slight overscale to fill the area nicely
        }}
      >
        {/* Top Left - Normal */}
        <div style={{ overflow: 'hidden' }}>
          <BrandVideoBanner />
        </div>
        
        {/* Top Right - Mirrored Horizontally */}
        <div style={{ overflow: 'hidden', transform: 'scaleX(-1)' }}>
          <BrandVideoBanner />
        </div>
        
        {/* Bottom Left - Mirrored Vertically */}
        <div style={{ overflow: 'hidden', transform: 'scaleY(-1)' }}>
          <BrandVideoBanner />
        </div>
        
        {/* Bottom Right - Mirrored Both */}
        <div style={{ overflow: 'hidden', transform: 'scale(-1, -1)' }}>
          <BrandVideoBanner />
        </div>
      </div>
      
      {/* Mobile-only adjustments via a simple style tag since we're writing inline */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          main {
            grid-template-columns: 1fr !important;
            padding: 4rem 1.5rem !important;
            gap: 2rem !important;
          }
          main > div:first-child {
            text-align: center;
            margin: 0 auto;
          }
          main > div:first-child div {
            justify-content: center;
          }
        }
      `}} />
    </main>
  );
}
