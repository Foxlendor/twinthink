'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, ArrowLeft, ShieldCheck, LockKeyhole } from 'lucide-react';

interface PublicArchiveEntry {
  page: number;
  filename: string;
  asset_path: string;
  archive_caption: string;
  visibility: 'public';
  publication_status: 'approved';
}

interface PublicArchiveManifest {
  schema_version: string;
  collection_id: string;
  title: string;
  description: string;
  entries: PublicArchiveEntry[];
}

export default function ArchivePage() {
  const [manifest, setManifest] = useState<PublicArchiveManifest | null>(null);

  useEffect(() => {
    fetch('/journal_manifest.json')
      .then((res) => res.json())
      .then((data) => setManifest(data))
      .catch(() => setManifest(null));
  }, []);

  const entries = (manifest?.entries || []).filter(
    (entry) => entry.visibility === 'public' && entry.publication_status === 'approved'
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#111827' }}>
      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: '#6B7280',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} /> Back to TwinThink
          </Link>
        </div>

        <header style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#374151',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.7px'
            }}
          >
            <Archive size={12} />
            Public Invention Archive
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              letterSpacing: '-0.75px',
              margin: '0.75rem 0'
            }}
          >
            The Archive
          </h1>

          <p style={{ fontSize: '1rem', color: '#4B5563', maxWidth: '720px', lineHeight: 1.6, margin: 0 }}>
            A public record of invention material that has been explicitly approved for publication.
            Private drafts, confidential files, and unapproved personal work do not appear here.
          </p>
        </header>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <ShieldCheck size={20} color="#059669" />
          <div>
            <div style={{ fontWeight: 750, fontSize: '0.9rem' }}>Publication safeguard</div>
            <div style={{ color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.5 }}>
              An entry must explicitly carry both <code>visibility: public</code> and
              <code> publication_status: approved</code> before it can render here.
            </div>
          </div>
        </div>

        {/* Verified Hardware Twins */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            Interactive Records
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem', letterSpacing: '-0.4px' }}>
            Verified Twins
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}
          >
            <Link
              href="/twins/twiizzlock"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#EEF2FF', color: '#4F46E5', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                  3D PISTON TWIN
                </span>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>● Active</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
                TWIIZZLock™ 2L Sleeve
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, margin: 0, flex: 1 }}>
                Interactive 3D model simulating PET bottle compression, headspace reduction, and bubble kinetics.
              </p>
            </Link>

            <Link
              href="/twins/redrink"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#FEF2F2', color: '#DC2626', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                  THERMAL FLUIDICS
                </span>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>● Active</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
                Redr.ink™ Reheat Straw
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, margin: 0, flex: 1 }}>
                Dual-channel comparative simulation of phase-change sodium acetate thermal transfer vs unheated conduit.
              </p>
            </Link>

            <Link
              href="/twins/0001"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#F3F4F6', color: '#4B5563', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                  VERIFIED ORIGIN
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>2016</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
                Redr.ink™ Origin (ReSip 2016)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, margin: 0, flex: 1 }}>
                The original Alpha R&D Phase prototype record that evolved into Redr.ink™, protected by Private Private Access architecture.
              </p>
            </Link>
          </div>
        </section>

        <section>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            Historical Artifacts
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem', letterSpacing: '-0.4px' }}>
            Approved Journal & Design Records
          </h2>

        {entries.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px dashed #D1D5DB',
              borderRadius: '18px',
              padding: '3rem 2rem',
              textAlign: 'center'
            }}
          >
            <LockKeyhole size={28} color="#9CA3AF" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800 }}>
              Physical journals in archival verification.
            </h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.55 }}>
              Scanned notebook pages are undergoing OCR and cryptographic timestamp verification before publication.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}
          >

            {entries.map((entry) => (
              <article
                key={entry.filename}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={entry.asset_path}
                  alt={entry.archive_caption}
                  style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{ padding: '1.15rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{entry.archive_caption}</div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                    Publicly approved record · Slide {entry.page}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </section>
      </main>
    </div>
  );
}

