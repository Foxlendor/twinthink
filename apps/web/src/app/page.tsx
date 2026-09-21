'use client';

import React from 'react';
import BrandVideoBanner from '@/components/BrandVideoBanner';

export default function HomePage() {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 70px)',
        background: 'transparent',
        color: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4rem',
        overflow: 'hidden'
      }}
    >
      {/* Background Ink Video */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8 // Subtle presence
      }}>
        <BrandVideoBanner />
      </div>

      {/* Central Typography */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        maxWidth: '850px', 
        textAlign: 'center',
        background: 'rgba(250, 250, 250, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '3rem 2rem',
        borderRadius: '24px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <h1
          style={{
            fontSize: 'clamp(3rem, 5vw, 4.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: '0 0 1.5rem',
            color: '#111827'
          }}
        >
          Every physical invention<br />
          casts a digital shadow.
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: '#4B5563',
            lineHeight: 1.6,
            margin: '0 auto 3rem',
            fontWeight: 400,
            maxWidth: '650px'
          }}
        >
          <strong>The ink is where you think.</strong> TwinThink is where physical matter meets its living twin. Track the entire arc of an invention: from the first drop of ink in an inventor's notebook, to 3D designs, predictive math simulations, and real-world sensor data.
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
            Explore Public Shadows
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
          main > div:nth-child(2) h1 {
            font-size: 2.5rem !important;
          }
          main > div:nth-child(2) div {
            flex-direction: column;
          }
          main > div:nth-child(2) div a {
            width: 100%;
          }
        }
      `}} />
    </main>
  );
}
