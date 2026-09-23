import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCapsule } from '@/actions/getCapsule';
import CapsuleUnlockFlow from '@/components/CapsuleUnlockFlow';
import { ShieldCheck, ArrowLeft, Scale, ExternalLink } from 'lucide-react';

export default async function CapsulePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  // Pass buyerId here if you have auth session setup
  const { status, catalog, secret } = await getCapsule(id);

  return (
    <div style={{ minHeight: '100vh', background: '#090D16', color: '#F3F4F6', fontFamily: 'var(--font-mono), monospace' }}>
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link
            href="/explore"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#9CA3AF',
              fontSize: '0.8rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={14} /> Back to Idea Stream
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
            <ShieldCheck size={13} />
            <span>BLIND CATALOG / SECRET BOM ISOLATION ACTIVE</span>
          </div>
        </div>

        {/* Header */}
        <header style={{ marginBottom: '3rem', borderBottom: '1px solid #1F2937', paddingBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
            twinth.ink // DIRECT CAPSULE
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 0.5rem 0', color: '#FFFFFF' }}>
            {catalog.title}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#9CA3AF', margin: 0 }}>
            UUID: <span style={{ color: '#E5E7EB' }}>{catalog.id}</span>
          </p>
        </header>

        {/* The Blind Preview Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start'
        }}>
          {/* Left Column: The Residual Obfuscated Shadow Blueprint */}
          <div style={{
            background: 'radial-gradient(circle at center, #111827 0%, #0B0F19 100%)',
            border: '1.5px solid #1F2937',
            borderRadius: '20px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '380px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Engineering Coordinate Grid */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.5
            }} />

            {/* Obfuscated Blueprint SVG */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <svg width="220" height="220" viewBox="0 0 100 100" style={{ margin: '0 auto', opacity: 0.85 }}>
                <rect x="25" y="15" width="50" height="70" rx="6" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="15" y1="50" x2="85" y2="50" stroke="#34D399" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="50" cy="50" r="14" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="50" y="53" fill="#F59E0B" fontSize="6" textAnchor="middle" fontFamily="monospace">OBFUSCATED</text>
              </svg>

              <div style={{
                marginTop: '1rem',
                fontSize: '0.75rem',
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                display: 'inline-block'
              }}>
                Residual Shadow Representation (Unpatentable)
              </div>
            </div>
          </div>

          {/* Right Column: Structural Identity & Manifest */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#FFFFFF' }}>
              Structural Identity
            </h2>

            {/* Structural Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {catalog.structural_tags.map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.35rem 0.75rem',
                    background: '#1F2937',
                    border: '1px solid #374151',
                    fontSize: '0.75rem',
                    borderRadius: '999px',
                    color: '#34D399',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  [{tag}]
                </span>
              ))}
            </div>

            {/* Ethical & Rights Manifest */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              border: '1px solid #1F2937',
              borderRadius: '14px',
              background: '#0B0F19'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9CA3AF', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Scale size={14} color="#10B981" />
                <span>ETHICAL &amp; RIGHTS MANIFEST</span>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#D1D5DB', margin: 0 }}>
                {catalog.ethical_manifest}
              </p>
            </div>

            {/* The Dynamic Unlock Flow Component (Handles Paywall, P2P NDA, and Decrypted BOM) */}
            <CapsuleUnlockFlow
              designId={catalog.id}
              unlockPriceUsd={catalog.unlock_price_usd}
              initialStatus={status}
              secretData={secret}
            />

          </div>
        </div>

      </main>
    </div>
  );
}
