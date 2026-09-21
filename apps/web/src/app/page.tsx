'use client';

import React from 'react';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 70px)',
        background: '#FAFAFA',
        color: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4rem',
        overflow: 'hidden'
      }}
    >
      {/* Central Typography */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 'clamp(3.5rem, 6vw, 5.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: '0 0 1.5rem',
            color: '#111827'
          }}
        >
          Give an idea<br />
          a reality.
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: '#4B5563',
            lineHeight: 1.6,
            margin: '0 auto 3rem',
            fontWeight: 400,
            maxWidth: '600px'
          }}
        >
          A living digital record for things people imagine, build, and test. Become a twinthink user today.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
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
              transition: 'background 0.2s, transform 0.1s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
              transition: 'border-color 0.2s, background 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#111827';
              e.currentTarget.style.background = '#F3F4F6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Investor Access
          </a>
        </div>
      </div>
      
      {/* Mobile-only adjustments */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          main {
            padding: 4rem 1.5rem !important;
          }
          main > div:first-child h1 {
            font-size: 3rem !important;
          }
          main > div:first-child div {
            flex-direction: column;
          }
          main > div:first-child div a {
            width: 100%;
          }
        }
      `}} />
    </main>
  );
}
