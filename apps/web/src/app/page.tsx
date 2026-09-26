'use client';

import React from 'react';
import Link from 'next/link';
import BrandVideoBanner from '@/components/BrandVideoBanner';
import { Compass, KeyRound, Coins } from 'lucide-react';

export default function HomePage() {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 70px)',
        background: 'transparent',
        color: 'var(--text-primary)',
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
        opacity: 0.85
      }}>
        <BrandVideoBanner />
      </div>

      {/* Central Typography */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        maxWidth: '850px', 
        textAlign: 'center',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(10px)',
        padding: '3rem 2.5rem',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
        border: '1px solid var(--border-subtle)'
      }}>
        <h1
          style={{
            fontSize: 'clamp(3.2rem, 5.5vw, 4.8rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            margin: '0 0 1.5rem',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}
        >
          Give an idea a reality.
        </h1>
        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 auto 2.5rem',
            fontWeight: 400,
            maxWidth: '700px'
          }}
        >
          TwinThink is the bridge between imagination and physics. We provide the infrastructure to test, simulate, and prove your inventions, empowering you to preserve your ideas, generate insight, and turn concepts into valuable, real-world assets.
        </p>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/explore"
            style={{
              padding: '0.85rem 1.75rem',
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'transform 0.15s ease'
            }}
          >
            <Compass size={17} />
            <span>Explore Public Shadows</span>
          </Link>
          <Link
            href="/pitch?pitch=VIPDEMO"
            style={{
              padding: '0.85rem 1.75rem',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'border-color 0.2s, background 0.2s'
            }}
          >
            <KeyRound size={17} />
            <span>Investor Access</span>
          </Link>
          <Link
            href="/roundup"
            style={{
              padding: '0.85rem 1.75rem',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s'
            }}
          >
            <Coins size={17} color="#059669" />
            <span>Support Prototyping</span>
          </Link>
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
