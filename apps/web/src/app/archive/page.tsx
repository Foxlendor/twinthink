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

        {entries.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px dashed #D1D5DB',
              borderRadius: '18px',
              padding: '4rem 2rem',
              textAlign: 'center'
            }}
          >
            <LockKeyhole size={28} color="#9CA3AF" style={{ marginBottom: '1rem' }} />
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
              No public inventions yet.
            </h2>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.55 }}>
              The public archive is intentionally empty until an inventor explicitly approves
              a record for publication.
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
      </main>
    </div>
  );
}
