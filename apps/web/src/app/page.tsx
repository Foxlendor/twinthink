'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, LockKeyhole, FilePlus2 } from 'lucide-react';
import CreateTwinModal from '@/components/CreateTwinModal';
import BrandLogo from '@/components/BrandLogo';

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        color: '#111827',
        padding: '4rem 1.5rem 6rem'
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <section
          style={{
            minHeight: '70vh',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.8fr)',
            alignItems: 'center',
            gap: '4rem'
          }}
        >
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <BrandLogo height={44} />
            </div>

            <h1
              style={{
                fontSize: 'clamp(3.25rem, 7vw, 5.5rem)',
                fontWeight: 800,
                letterSpacing: '-3px',
                lineHeight: 0.98,
                margin: '0 0 1.5rem',
                color: '#111827'
              }}
            >
              Give an idea
              <br />
              a reality.
            </h1>

            <p
              style={{
                fontSize: '1.2rem',
                color: '#4B5563',
                lineHeight: 1.6,
                maxWidth: '560px',
                margin: '0 0 2rem'
              }}
            >
              A living digital record for things people imagine, build, and test.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                flexWrap: 'wrap',
                marginBottom: '1.75rem'
              }}
            >
              <Link
                href="/archive"
                className="button-primary"
                style={{
                  padding: '0.9rem 1.6rem',
                  borderRadius: '100px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Explore
                <ArrowRight size={17} />
              </Link>

              <button
                onClick={() => setShowCreateModal(true)}
                className="button-secondary"
                style={{
                  padding: '0.9rem 1.6rem',
                  borderRadius: '100px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Create Twin
                <FilePlus2 size={17} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                color: '#6B7280',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                maxWidth: '560px'
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>
                Public pages contain only records that have been explicitly approved for
                publication. Private invention material is not used as homepage content.
              </span>
            </div>
          </div>

          <div
            aria-label="TwinThink public record principle"
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '28px',
              background: '#FFFFFF',
              padding: '2rem',
              boxShadow: '0 12px 40px rgba(17,24,39,0.05)'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#6B7280',
                marginBottom: '1.5rem'
              }}
            >
              PUBLIC RECORD
            </div>

            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '24px',
                border: '2px solid #111827',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <BrandLogo variant="glyph" height={48} />
            </div>

            <h2
              style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                letterSpacing: '-0.6px',
                margin: '0 0 0.7rem'
              }}
            >
              Ideas become records.
            </h2>

            <p
              style={{
                color: '#4B5563',
                lineHeight: 1.6,
                margin: '0 0 1.5rem'
              }}
            >
              Document the concept, preserve its history, record what is known, and
              separate published evidence from private material.
            </p>

            <div
              style={{
                borderTop: '1px solid #F3F4F6',
                paddingTop: '1.25rem',
                display: 'grid',
                gap: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
                Explicitly approved records
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9CA3AF' }} />
                Private drafts stay out of public feeds
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <LockKeyhole size={14} color="#6B7280" />
                Confidential material requires controlled access
              </div>
            </div>
          </div>
        </section>

        <section
          id="platform"
          style={{
            borderTop: '1px solid #E5E7EB',
            paddingTop: '4rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem'
          }}
        >
          {[
            ['01', 'Document', 'Keep sketches, specifications, tests, and revisions together.'],
            ['02', 'Control access', 'Choose what is private, shared under controlled access, or explicitly public.'],
            ['03', 'Publish', 'Only approved records become part of the public TwinThink archive.']
          ].map(([number, title, description]) => (
            <div key={number}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: '#9CA3AF',
                  marginBottom: '0.75rem'
                }}
              >
                {number}
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.45rem' }}>
                {title}
              </h2>
              <p style={{ color: '#6B7280', lineHeight: 1.55, margin: 0, fontSize: '0.9rem' }}>
                {description}
              </p>
            </div>
          ))}
        </section>
      </div>

      {showCreateModal && <CreateTwinModal onClose={() => setShowCreateModal(false)} />}
    </main>
  );
}
