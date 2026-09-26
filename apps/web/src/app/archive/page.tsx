'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, ArrowLeft, ShieldCheck, LockKeyhole, GitFork, Box } from 'lucide-react';
import { TWINS_DATABASE } from '@/lib/twinsData';

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
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  
  const domains = ['All', 'Thermal Systems', 'Mechanisms', 'Haptics/Wearables'];
  
  const allTwins = Object.values(TWINS_DATABASE);
  const filteredTwins = allTwins.filter(twin => selectedDomain === 'All' || twin.domain === selectedDomain);

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
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#111827' }}>
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
            marginBottom: '2.5rem',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                Interactive Records
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
                Verified Twins Directory
              </h2>
            </div>
            
            {/* Filter Taxonomy */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {domains.map(domain => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  style={{
                    background: selectedDomain === domain ? '#111827' : '#FFFFFF',
                    color: selectedDomain === domain ? '#FFFFFF' : '#4B5563',
                    border: `1px solid ${selectedDomain === domain ? '#111827' : '#E5E7EB'}`,
                    padding: '0.4rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedDomain === domain ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {filteredTwins.map((twin) => {
              const bomCost = twin.current_version.properties.find(p => p.key === 'estimated_bom_usd' || p.key === 'estimated_bom_usd')?.value || 'N/A';
              const descendantCount = twin.lineage?.descendants?.length || 0;
              // Find a valid image asset from the twin's database entry
              const imageAsset = twin.current_version.assets.find(
                a => a.relative_path.match(/\.(jpg|jpeg|png)$/i)
              );
              const posterImg = imageAsset ? `/${imageAsset.relative_path}` : null;
                
              const getStatusColor = (status: string) => {
                if (status === 'Verified Build') return '#10B981';
                if (status === 'Physical Bench Tested') return '#3B82F6';
                if (status === 'Concept Preview') return '#6B7280';
                return '#F59E0B'; // Simulated Prior Art
              };

              return (
                <Link
                  key={twin.id}
                  href={`/twins/${twin.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                  }}
                >
                  <div style={{ height: '180px', position: 'relative', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {posterImg ? (
                      <img src={posterImg} alt={twin.current_version.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                        <Box size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>No Image Available</div>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, color: '#111827', backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      ${typeof bomCost === 'number' ? bomCost.toFixed(2) : bomCost} BOM
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#DBEAFE', color: '#2563EB', padding: '0.2rem 0.55rem', borderRadius: '999px', textTransform: 'uppercase' }}>
                        {twin.domain || 'Uncategorized'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: getStatusColor(twin.status || ''), fontWeight: 700 }}>
                        ● {twin.status || 'Active'}
                      </span>
                    </div>
                    
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.4rem', lineHeight: 1.3 }}>
                      {twin.current_version.title}
                    </h3>
                    
                    <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, margin: '0 0 1.25rem', flex: 1 }}>
                      {twin.current_version.summary.length > 120 ? twin.current_version.summary.substring(0, 120) + '...' : twin.current_version.summary}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
                      <GitFork size={14} /> {descendantCount} Descendant{descendantCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Why We Inked It: Inventor's Manifesto */}
        <section style={{ marginBottom: '4rem', background: '#111827', color: '#F9FAFB', borderRadius: '16px', padding: '3rem 2.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              Inventor's Note
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1.5rem', letterSpacing: '-0.5px', color: '#FFFFFF' }}>
              Why We Inked It
            </h2>
            <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#D1D5DB' }}>
              <p style={{ marginBottom: '1.25rem' }}>
                When I was a kid, I couldn't write with pencils. The friction and the feeling of graphite on paper was an overwhelming sensory aversion. I was forced into a lifelong habit of writing and drawing entirely in permanent ink.
              </p>
              <p style={{ marginBottom: '1.25rem' }}>
                Pencils imply that mistakes can be erased, hidden, or undone. <strong>Ink demands commitment.</strong>
              </p>
              <p style={{ marginBottom: '1.25rem' }}>
                If a line is wrong or a mechanism fails, you don't rub it out; you turn the page, draw it again, and leave the earlier version intact. This became the foundational philosophy of TwinThink. In science and engineering, failed attempts aren't erased. They are documentation. As Thomas Edison famously proved with his ten thousand failed filaments, true innovation is built on a massive foundation of documented trial and error.
              </p>
              <p style={{ margin: 0, fontStyle: 'italic', color: '#9CA3AF' }}>
                "When I write my will, am I lying there in the coffin pale? Will I plant the seed and see how big it grew from sticks to leaves to me and you?"
              </p>
            </div>
          </div>
        </section>

        <section>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            Raw Inspiration & Sketches
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem', letterSpacing: '-0.4px' }}>
            A Priori Ideation: The Shadow of My Mind
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#4B5563', maxWidth: '720px', lineHeight: 1.6, marginBottom: '2rem' }}>
            These are raw, unrefined, and completely <em>a priori</em> ideas that have been documented over time. They aren't finished products. They are given out as pure inspiration to anyone who wants to see where the shadows start. By keeping them unvarnished and captured in permanent ink, we preserve the authentic chain of provenance.
          </p>

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
                    Raw ideation · Slide {entry.page}
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


