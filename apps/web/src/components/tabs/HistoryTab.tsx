'use client';

import React, { useState, useEffect } from 'react';
import { TwinData } from '@/lib/types';
import { BookOpen, ChevronLeft, ChevronRight, ZoomIn, X, ShieldCheck, HelpCircle, ExternalLink } from 'lucide-react';

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

export default function HistoryTab({ twin }: { twin: TwinData }) {
  const [manifest, setManifest] = useState<JournalManifest | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/journal_manifest.json')
      .then(res => res.json())
      .then(data => setManifest(data))
      .catch(err => console.error("Failed to load journal manifest:", err));
  }, []);

  const entries = manifest?.entries || [];
  const currentEntry = entries[selectedPageIndex] || null;

  const getRelationshipBadge = (rel: string) => {
    switch (rel) {
      case 'verified_prototype':
        return { label: 'Connected to Twin #0001 → RESIP™', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
      case 'ancestor_candidate':
        return { label: 'Candidate Ancestor (2016 Science Fair)', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
      case 'not_established':
      default:
        return { label: 'Relationship: Unestablished', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
    }
  };

  return (
    <div style={{ maxWidth: '840px', width: '100%' }}>
      
      {/* Section Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.75px',
          marginBottom: '0.4rem'
        }}>
          HISTORY
        </div>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          margin: '0 0 0.4rem 0'
        }}>
          How did it become this?
        </h2>
        <p style={{
          fontSize: '0.9375rem',
          color: '#6B7280',
          margin: 0
        }}>
          An authentic archive of physical notebooks, drawings, and bench experiments. TwinThink does not assume every page belongs to RESIP™; relationships are strictly established by evidence.
        </p>
      </div>

      {/* 1. Invention Journal Notebook Viewer */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0 0 0.2rem 0' }}>
              Invention Journal Archive
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              27 Archival Pages • Curated Provenance
            </span>
          </div>

          {/* Page navigation controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setSelectedPageIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedPageIndex === 0}
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '0.35rem 0.6rem',
                cursor: selectedPageIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedPageIndex === 0 ? 0.4 : 1,
                color: '#111827'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', fontFamily: 'var(--font-mono)' }}>
              Page {selectedPageIndex + 1} of {entries.length || 27}
            </span>

            <button
              onClick={() => setSelectedPageIndex(prev => Math.min(entries.length - 1, prev + 1))}
              disabled={selectedPageIndex === entries.length - 1}
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '0.35rem 0.6rem',
                cursor: selectedPageIndex === entries.length - 1 ? 'not-allowed' : 'pointer',
                opacity: selectedPageIndex === entries.length - 1 ? 0.4 : 1,
                color: '#111827'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Page Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          {entries.map((entry, idx) => {
            const isActive = idx === selectedPageIndex;
            return (
              <button
                key={idx}
                onClick={() => setSelectedPageIndex(idx)}
                style={{
                  background: isActive ? '#111827' : '#F3F4F6',
                  color: isActive ? '#FFFFFF' : '#4B5563',
                  border: '1px solid',
                  borderColor: isActive ? '#111827' : '#E5E7EB',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {String(entry.page).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Archival Scan Window */}
        {currentEntry && (
          <div>
            <div 
              onClick={() => setLightboxOpen(true)}
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.5rem',
                minHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'zoom-in',
                overflow: 'hidden',
                marginBottom: '1.5rem'
              }}
            >
              <img
                src={currentEntry.asset_path}
                alt={currentEntry.archive_caption}
                style={{
                  maxHeight: '440px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                fontSize: '0.75rem',
                color: '#4B5563',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <ZoomIn size={13} />
                Inspect High-Res Scan
              </div>
            </div>

            {/* Provenance & Epistemic Metadata Strip */}
            <div style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>
                    ORIGINAL ARCHIVE CAPTION
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                    {currentEntry.archive_caption}
                  </div>
                </div>

                {/* Relationship Tag */}
                {(() => {
                  const badge = getRelationshipBadge(currentEntry.resip_relationship);
                  return (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
                <div>
                  <span style={{ color: '#6B7280' }}>Source: </span>
                  <strong style={{ color: '#111827' }}>{currentEntry.provenance.source}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7280' }}>Filename: </span>
                  <strong style={{ color: '#111827', fontFamily: 'var(--font-mono)' }}>{currentEntry.filename}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7280' }}>Transcription: </span>
                  <strong style={{ color: '#6B7280' }}>Not yet reviewed</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 2. Physical Workbench Prototyping Section */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              Connected to Twin #0001 → RESIP™
            </span>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0.25rem 0 0 0' }}>
            2026 Lab Workbench Prototyping Evidence
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0.2rem 0 0 0' }}>
            Physical hardware assembly and benchtop validation photos verified directly for Twin #0001.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { img: '/resip/5ae0881d-73ce-47f7-9140-08eb5a136ccf.jpg', label: 'Bistable Snap-Disc Trigger Setup' },
            { img: '/resip/208ea1a2-820f-40c1-8a34-7123342714aa.jpg', label: '54.0°C Exothermic Crystallization' },
            { img: '/resip/5fc3a429-8c83-4088-86ac-eae6484d59d6.jpg', label: '316L Stainless Conduit Tube' },
            { img: '/resip/e1686fcf-d69a-4eb0-803d-59133249da95.jpg', label: 'Silicone Sleeve & Viton Seals' }
          ].map((item, i) => (
            <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ height: '140px', overflow: 'hidden' }}>
                <img src={item.img} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#111827' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentEntry && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(17, 24, 39, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '1.5rem'
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '880px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem', right: '1.25rem',
                background: 'none', border: 'none',
                color: '#9CA3AF', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#111827' }}>
              {currentEntry.archive_caption}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 1.25rem 0' }}>
              Page {currentEntry.page} • {currentEntry.filename}
            </p>

            <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
              <img
                src={currentEntry.asset_path}
                alt={currentEntry.archive_caption}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              />
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#4B5563', lineHeight: 1.5 }}>
              <strong>Provenance Note:</strong> This scan is part of the 27-slide Invention Journal Archive. Relationship status to RESIP™ is recorded as <code>{currentEntry.resip_relationship}</code>.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
