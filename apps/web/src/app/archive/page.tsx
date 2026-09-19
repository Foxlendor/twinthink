'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Archive, 
  ArrowLeft, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Filter, 
  Sparkles,
  UserCheck
} from 'lucide-react';

interface JournalEntry {
  page: number;
  filename: string;
  asset_path: string;
  archive_caption: string;
  provenance: {
    source: string;
    original_archive_path: string;
  };
  resip_relationship: 'not_established' | 'ancestor_candidate' | 'verified_prototype';
  transcription_status: string;
  metadata_status: string;
}

interface JournalManifest {
  title: string;
  description: string;
  curation_note: string;
  entries: JournalEntry[];
}

export default function ArchivePage() {
  const [manifest, setManifest] = useState<JournalManifest | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unlinked' | 'ai_proposed'>('all');
  const [humanEstablishedMap, setHumanEstablishedMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/journal_manifest.json')
      .then(res => res.json())
      .then(data => setManifest(data))
      .catch(err => console.error("Failed to load journal manifest:", err));
  }, []);

  const verifiedPrefixes = ['020-', '021-', '022-', '003-1-'];
  const allEntries = manifest?.entries || [];
  
  // Directive Phase 1: All unlinked slides housed in /archive marked resip_relationship: "not_established"
  const archiveEntries = allEntries.filter(entry => 
    !verifiedPrefixes.some(prefix => entry.filename.startsWith(prefix))
  );

  const handleEstablish = (filename: string, relationship: string) => {
    setHumanEstablishedMap(prev => ({
      ...prev,
      [filename]: relationship
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#111827' }}>
      <Navbar />

      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
        
        {/* Breadcrumb navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/twins/0001"
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
            <ArrowLeft size={16} /> Back to Twin #0001
          </Link>
        </div>

        {/* Header section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#4B5563',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              fontFamily: 'monospace'
            }}>
              Unlinked Cognitive Archive
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#B45309',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <ShieldAlert size={12} />
              AI PROPOSES · HUMAN ESTABLISHES
            </span>
          </div>

          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            letterSpacing: '-0.75px',
            color: '#111827',
            margin: '0 0 0.75rem 0'
          }}>
            Global Discovery Archive
          </h1>

          <p style={{
            fontSize: '1rem',
            color: '#4B5563',
            maxWidth: '720px',
            lineHeight: 1.6,
            margin: 0
          }}>
            These 23 archival slides span diverse historical concepts (FerroPen, Xylem Thread, Triple-Rim Suspension, Packaging Drone, Gaseous Dynamic Expansion). They remain dark and unlinked from active digital twins until an inventor formally establishes cognitive lineage.
          </p>
        </div>

        {/* Epistemic Protocol Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '1.25rem 1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
              Cognitive Lineage Safeguard
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5 }}>
              Status of all entries: <code>resip_relationship: &quot;not_established&quot;</code>. TwinThink never hallucinates connections between disparate inventions.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#374151',
              background: '#F3F4F6',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px'
            }}>
              Total Preserved: {archiveEntries.length} Slides
            </span>
          </div>
        </div>

        {/* Grid of Archive Slides */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {archiveEntries.map((entry) => {
            const humanStatus = humanEstablishedMap[entry.filename];

            return (
              <div
                key={entry.filename}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                {/* Image preview */}
                <div style={{
                  position: 'relative',
                  height: '220px',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedEntry(entry)}
                >
                  <img
                    src={entry.asset_path}
                    alt={entry.archive_caption}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#FFFFFF',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}>
                    SLIDE #{entry.page}
                  </div>
                </div>

                {/* Meta details */}
                <div style={{ padding: '1.15rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '0.5rem',
                    lineHeight: 1.4
                  }}>
                    {entry.archive_caption}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.85rem' }}>
                    Source: {entry.provenance.source}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem'
                    }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: humanStatus ? '#059669' : '#6B7280',
                        background: humanStatus ? '#ECFDF5' : '#F3F4F6',
                        border: `1px solid ${humanStatus ? '#A7F3D0' : '#E5E7EB'}`,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {humanStatus ? `Human: ${humanStatus}` : 'resip_relationship: not_established'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEstablish(entry.filename, 'Independent Invention')}
                        style={{
                          flex: 1,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#374151',
                          background: '#F9FAFB',
                          border: '1px solid #D1D5DB',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Keep Independent
                      </button>
                      <button
                        onClick={() => handleEstablish(entry.filename, 'Verified Ancestor')}
                        style={{
                          flex: 1,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#059669',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Establish Ancestor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Modal Lightbox */}
        {selectedEntry && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedEntry(null)}
          >
            <div 
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '1.5rem'
              }}
              onClick={e => e.stopPropagation()}
            >
              <img
                src={selectedEntry.asset_path}
                alt={selectedEntry.archive_caption}
                style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '1rem' }}
              />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                {selectedEntry.archive_caption}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>
                Original Archive File: <code>{selectedEntry.provenance.original_archive_path}</code>
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
