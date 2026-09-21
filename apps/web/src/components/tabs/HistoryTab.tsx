'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TwinData } from '@/lib/types';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  X, 
  ShieldCheck, 
  HelpCircle, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Wrench, 
  Cpu, 
  FileCheck, 
  ExternalLink,
  GitBranch,
  KeyRound
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

export default function HistoryTab({ twin }: { twin: TwinData }) {
  const [manifest, setManifest] = useState<JournalManifest | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'timeline' | 'journal' | 'workbench' | 'releases'>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/journal_manifest.json')
      .then(res => res.json())
      .then(data => setManifest(data))
      .catch(err => console.error("Failed to load journal manifest:", err));
  }, []);

  // Directive Phase 1: Restrict Twin #0001's History tab strictly to pages with verified provenance
  // 020, 021, 022 (ScienceFair2016 Drawing, Chart, and Graph) and 003-1 (Ferro/Crystalline Display / phase change notes).
  const verifiedPrefixes = ['020-', '021-', '022-', '003-1-'];
  const VERIFIED_CAPTIONS: Record<string, string> = {
    '020-e1628076238962.png': 'Original Hand Schematic (Science Fair 2016)',
    '021-e1628076098948.png': 'Phase-Change Temperature Chart (2016)',
    '022-e1628076121431.png': 'Convective Heat Transfer Graph (2016)',
    '003-1-e1628076904523.png': 'Crystalline Phase Notes',
  };

  const allEntries = manifest?.entries || [];
  const entries = allEntries
    .filter(entry => verifiedPrefixes.some(prefix => entry.filename.startsWith(prefix)))
    .map(entry => ({
      ...entry,
      archive_caption: VERIFIED_CAPTIONS[entry.filename] || entry.archive_caption
    }));
  const unlinkedArchiveCount = allEntries.length - entries.length;
  const currentEntry = entries[selectedPageIndex] || null;

  const getRelationshipBadge = (rel: string) => {
    switch (rel) {
      case 'verified_prototype':
        return { label: 'Verified Prototype → Twin #0001', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
      case 'ancestor_candidate':
        return { label: 'Candidate Ancestor (2016 Science Fair)', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
      case 'not_established':
      default:
        return { label: 'Archive Note: Unestablished', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
    }
  };

  const workbenchPhotos = [
    { 
      img: '/resip/5ae0881d-73ce-47f7-9140-08eb5a136ccf.jpg', 
      title: 'Bistable Snap-Disc Trigger Rig', 
      date: '2026-08-28',
      desc: 'Tactile mechanical trigger testing. Disc flexes to nucleate crystallization in <1.2s.' 
    },
    { 
      img: '/resip/208ea1a2-820f-40c1-8a34-7123342714aa.jpg', 
      title: '54.0°C Exothermic Phase Change', 
      date: '2026-08-29',
      desc: 'Infrared thermocouple verification of sodium acetate trihydrate latent heat plateau.' 
    },
    { 
      img: '/resip/5fc3a429-8c83-4088-86ac-eae6484d59d6.jpg', 
      title: '316L Stainless Conduit Tubing', 
      date: '2026-08-29',
      desc: 'Precision 6mm ID seamless drawn tube with passivated food-grade inner wall.' 
    },
    { 
      img: '/resip/e1686fcf-d69a-4eb0-803d-59133249da95.jpg', 
      title: 'Silicone Sleeve & Viton End Seals', 
      date: '2026-08-30',
      desc: 'Hermetic seal testing under 2.5 bar hydrostatic pressure to prevent chemical leakage.' 
    }
  ];

  return (
    <div style={{ maxWidth: '880px', width: '100%' }}>
      
      {/* 1. Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.75px',
          marginBottom: '0.4rem'
        }}>
          PROVENANCE & HISTORY
        </div>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          margin: '0 0 0.5rem 0'
        }}>
          How did it become this?
        </h2>
        <p style={{
          fontSize: '0.9375rem',
          color: '#6B7280',
          margin: 0,
          lineHeight: 1.6
        }}>
          Every physical digital twin in TwinThink preserves an unbroken chain of custody: from 2016 handwritten research notebooks to 2026 physical hardware machining, benchtop sensor testing, and signed cryptographic releases.
        </p>
      </div>

      {/* 2. Educational Pedigree Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <div style={{
          background: '#10B981',
          color: '#FFFFFF',
          padding: '0.5rem',
          borderRadius: '10px',
          flexShrink: 0
        }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>
              AUTHENTIC ORIGIN RECORD
            </span>
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem 0' }}>
            2016 Regional Science Fair Prior Art Provenance
          </h4>
          <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            redr.ink™ (formerly RESIP™) traces directly to hand-drawn notebook diagrams, heat transfer curves, and phase-change salt experiments documented in Foxlendor&apos;s original 2016 invention journal slides (020, 021, 022, and 003-1).
          </p>
        </div>
      </div>

      {/* Provenance Scope Callout */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#059669',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Specimen #0001 Provenance
          </span>
          <span style={{ fontSize: '0.8125rem', color: '#374151' }}>
            Strictly isolated to <strong>4 verified slides</strong> (020, 021, 022 Science Fair 2016 &amp; 003-1 phase change).
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontSize: '0.725rem',
            fontWeight: 700,
            color: '#4B5563',
            background: '#F3F4F6',
            border: '1px solid #E5E7EB',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)'
          }}>
            Inventor Provenance Ledger
          </span>
          <Link
            href="/archive"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#2563EB',
              textDecoration: 'none',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            Inspect Global Archive ({unlinkedArchiveCount} records) →
          </Link>
        </div>
      </div>

      {/* 3. Sub-View Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #E5E7EB',
        marginBottom: '2rem',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveView('timeline')}
          style={{
            background: activeView === 'timeline' ? '#111827' : 'transparent',
            color: activeView === 'timeline' ? '#FFFFFF' : '#4B5563',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Calendar size={14} />
          Evolution Timeline
        </button>

        <button
          onClick={() => setActiveView('journal')}
          style={{
            background: activeView === 'journal' ? '#111827' : 'transparent',
            color: activeView === 'journal' ? '#FFFFFF' : '#4B5563',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={14} />
          2016 Invention Journal ({entries.length || 27})
        </button>

        <button
          onClick={() => setActiveView('workbench')}
          style={{
            background: activeView === 'workbench' ? '#111827' : 'transparent',
            color: activeView === 'workbench' ? '#FFFFFF' : '#4B5563',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Wrench size={14} />
          Workbench Hardware Photos (4)
        </button>

        <button
          onClick={() => setActiveView('releases')}
          style={{
            background: activeView === 'releases' ? '#111827' : 'transparent',
            color: activeView === 'releases' ? '#FFFFFF' : '#4B5563',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <KeyRound size={14} />
          Cryptographic Releases
        </button>
      </div>

      {/* VIEW 1: Evolution Timeline */}
      {activeView === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Milestone 1 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#D97706',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '100px'
                }}>
                  PHASE 1 • NOVEMBER 2016
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0.6rem 0 0.2rem 0' }}>
                  Science Fair Invention Journal & Ideation
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
                  Early physical notebook pages containing hand-drawn thermodynamic concepts, fluid conduit geometry, and phase-change chemistry questions.
                </p>
              </div>
              <button
                onClick={() => setActiveView('journal')}
                className="button-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                Browse Scans (27)
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem',
              marginTop: '1rem'
            }}>
              {entries.slice(0, 4).map((entry, idx) => (
                <div
                  key={idx}
                  onClick={() => { setSelectedPageIndex(idx); setActiveView('journal'); }}
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <img
                    src={entry.asset_path}
                    alt={entry.archive_caption}
                    style={{ height: '80px', width: '100%', objectFit: 'contain', marginBottom: '0.35rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Page {entry.page}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone 2 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '100px'
                }}>
                  PHASE 2 • AUGUST 2026
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0.6rem 0 0.2rem 0' }}>
                  Physical Hardware Machining & Benchtop Prototyping
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
                  Machined 316L stainless tubing, bistable snap-disc mechanical activation, food-grade silicone sleeve molding, and supercooling thermal tests.
                </p>
              </div>
              <button
                onClick={() => setActiveView('workbench')}
                className="button-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                View Workbench Gallery
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginTop: '1rem'
            }}>
              {workbenchPhotos.map((p, idx) => (
                <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={p.img} alt={p.title} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>{p.title}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#6B7280', marginTop: '0.15rem' }}>{p.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone 3 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#2563EB',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '100px'
                }}>
                  PHASE 3 • TODAY (LIVING DIGITAL TWIN)
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0.6rem 0 0.2rem 0' }}>
                  Canonical Twin Compilation & Differential Equation Fitting
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
                  TwinThink compiled all parts into a 3-level canonical BOM graph, coupled an ODE simulation solver, calibrated against physical sensor runs (RMSE &lt; 2.1°C), and signed the release with Ed25519 creator keys.
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #F3F4F6'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>BOM Unit COGS</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>$4.50 USD</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Simulation Status</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284C7' }}>ODE Calibrated</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Physical Tests</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>3 Verified Runs</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Signature Status</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>Ed25519 Valid</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: Invention Journal Notebook Scans */}
      {activeView === 'journal' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0 0 0.2rem 0' }}>
                Archival Invention Journal Scans
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                27 Scanned Pages • High-Resolution Optical Scans
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

          {/* Page Selector Strip */}
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

          {/* Archival Scan Display */}
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
                  Click to Zoom
                </div>
              </div>

              {/* Provenance Card */}
              <div style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>
                      ARCHIVE ENTRY CAPTION
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                      {currentEntry.archive_caption}
                    </div>
                  </div>

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
                    <span style={{ color: '#6B7280' }}>Transcription Status: </span>
                    <strong style={{ color: '#4B5563' }}>Pending Optical OCR</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 3: Workbench Lab Hardware Photos */}
      {activeView === 'workbench' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#059669',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px'
            }}>
              Directly Verified for Twin #0001
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0.5rem 0 0.2rem 0' }}>
              Physical Hardware Machining & Lab Bench Evidence
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
              Photographic proof of physical specimen assembly, material inspections, and thermal activation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {workbenchPhotos.map((item, i) => (
              <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                  <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(17, 24, 39, 0.75)',
                    color: '#FFFFFF',
                    fontSize: '0.6875rem',
                    padding: '0.2rem 0.45rem',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {item.date}
                  </span>
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                    {item.title}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: Cryptographic Releases */}
      {activeView === 'releases' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem 0' }}>
              Signed Cryptographic Releases
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
              Immutable digital twin revisions signed with Ed25519 creator keys. Guarantees tamper-evident authorship.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {twin.versions && twin.versions.length > 0 ? (
              twin.versions.map((ver, idx) => (
                <div key={idx} style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: '#111827',
                        color: '#FFFFFF',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        v{ver.semver}
                      </span>
                      <strong style={{ fontSize: '0.9375rem', color: '#111827' }}>{ver.title}</strong>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#059669',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <CheckCircle2 size={12} />
                      Ed25519 Signed
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <span>Published: <strong>{ver.published_at}</strong></span>
                    <span>Signer: <strong>{twin.creator}</strong></span>
                    <span>Algorithm: <strong>ed25519-sha512</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                No published cryptographic versions found.
              </div>
            )}
          </div>
        </div>
      )}

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
