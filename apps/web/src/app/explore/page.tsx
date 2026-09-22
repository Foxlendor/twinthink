'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Database, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye, 
  Sparkles, 
  Layers, 
  Scale, 
  CreditCard, 
  Coffee, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Coins, 
  GitFork, 
  CheckCircle2, 
  Sliders, 
  Maximize2,
  FileCode,
  Share2,
  Info
} from 'lucide-react';
import { TWINS_DATABASE } from '@/lib/twinsData';
import AccessModal from '@/components/AccessModal';
import RedrinkViewer from '@/components/redrink/RedrinkViewer';
import PistonViewer from '@/components/twizzlock/PistonViewer';

export default function ExplorePage() {
  const twins = Object.values(TWINS_DATABASE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'reel' | 'grid'>('reel');
  const [selectedLicenseFilter, setSelectedLicenseFilter] = useState<string>('All');
  const [unlockedTwins, setUnlockedTwins] = useState<Record<string, boolean>>({});
  const [activeAccessModalTwin, setActiveAccessModalTwin] = useState<string | null>(null);
  const [privacyLevelByTwin, setPrivacyLevelByTwin] = useState<Record<string, number>>({
    'twiizzlock': 0,
    'redrink': 0,
    '0001': 0,
    '0002-iris': 0
  });

  const activeTwin = twins[currentIndex] || twins[0];
  const activeLevel = privacyLevelByTwin[activeTwin.id] ?? 0;
  const isTwinUnlocked = !!unlockedTwins[activeTwin.id];

  // Keyboard navigation for TikTok-style stream
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'reel') return;
      if (activeAccessModalTwin) return; // Don't intercept when modal is open

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setCurrentIndex(prev => (prev < twins.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : twins.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [twins.length, viewMode, activeAccessModalTwin]);

  const setPrivacyLevel = (twinId: string, level: number) => {
    setPrivacyLevelByTwin(prev => ({ ...prev, [twinId]: level }));
    if (level === 2 && !unlockedTwins[twinId]) {
      setActiveAccessModalTwin(twinId);
    }
  };

  const handleUnlockTwin = (twinId: string) => {
    setUnlockedTwins(prev => ({ ...prev, [twinId]: true }));
    setPrivacyLevelByTwin(prev => ({ ...prev, [twinId]: 2 }));
    setActiveAccessModalTwin(null);
  };

  // Shadow Wireframe Schematics for Level 0
  const renderShadowTwin = (twinId: string) => {
    if (twinId.includes('redr') || twinId === '0001') {
      return (
        <div style={{
          width: '100%',
          height: '360px',
          background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px dashed rgba(56, 189, 248, 0.4)'
        }}>
          {/* Subtle Grid Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.6
          }} />

          {/* SVG Shadow Blueprint of Thermal Straw */}
          <svg width="240" height="240" viewBox="0 0 100 240" style={{ position: 'relative', zIndex: 2 }}>
            <rect x="30" y="20" width="40" height="200" rx="8" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 2" />
            <rect x="42" y="10" width="16" height="220" rx="4" fill="none" stroke="#60A5FA" strokeWidth="2" />
            <circle cx="50" cy="90" r="10" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="50" y="94" fill="#F59E0B" fontSize="9" textAnchor="middle" fontFamily="monospace">PCM</text>
            <line x1="20" y1="50" x2="42" y2="50" stroke="#94A3B8" strokeWidth="1" />
            <line x1="20" y1="170" x2="42" y2="170" stroke="#94A3B8" strokeWidth="1" />
            <text x="16" y="53" fill="#94A3B8" fontSize="7" textAnchor="end" fontFamily="monospace">Lumen</text>
            <text x="16" y="173" fill="#94A3B8" fontSize="7" textAnchor="end" fontFamily="monospace">Buffer</text>
          </svg>

          {/* Shadow Watermark Notice */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '999px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.72rem',
            color: '#38BDF8',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            zIndex: 3
          }}>
            <Eye size={12} /> LEVEL 0 · UNPATENTABLE SHADOW TWIN (PUBLIC PREVIEW)
          </div>
        </div>
      );
    }

    if (twinId.includes('twizz')) {
      return (
        <div style={{
          width: '100%',
          height: '360px',
          background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px dashed rgba(16, 185, 129, 0.4)'
        }}>
          {/* Subtle Grid Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.6
          }} />

          {/* SVG Shadow Blueprint of 2L Bottle Sleeve & Piston */}
          <svg width="240" height="240" viewBox="0 0 120 240" style={{ position: 'relative', zIndex: 2 }}>
            <path d="M 45 20 L 75 20 L 75 40 L 95 70 L 95 200 L 25 200 L 25 70 L 45 40 Z" fill="none" stroke="#34D399" strokeWidth="1.5" strokeDasharray="4 2" />
            <line x1="25" y1="130" x2="95" y2="130" stroke="#FBBF24" strokeWidth="2" strokeDasharray="2 2" />
            <circle cx="60" cy="210" r="8" fill="none" stroke="#10B981" strokeWidth="1.5" />
            <text x="60" y="213" fill="#10B981" fontSize="8" textAnchor="middle" fontFamily="monospace">VALVE</text>
            <text x="60" y="125" fill="#FBBF24" fontSize="8" textAnchor="middle" fontFamily="monospace">COLLAPSIBLE LINE</text>
          </svg>

          {/* Shadow Watermark Notice */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '999px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.72rem',
            color: '#34D399',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            zIndex: 3
          }}>
            <Eye size={12} /> LEVEL 0 · UNPATENTABLE SHADOW TWIN (PUBLIC PREVIEW)
          </div>
        </div>
      );
    }

    // Default Shadow Blueprint for other inventions (Iris, etc.)
    return (
      <div style={{
        width: '100%',
        height: '360px',
        background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1.5px dashed rgba(244, 63, 94, 0.4)'
      }}>
        <svg width="220" height="220" viewBox="0 0 100 100" style={{ position: 'relative', zIndex: 2 }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#FB7185" strokeWidth="2" strokeDasharray="3 3" />
          <polygon points="50,15 80,35 80,65 50,85 20,65 20,35" fill="none" stroke="#FDA4AF" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="16" fill="none" stroke="#F43F5E" strokeWidth="2" />
        </svg>

        <div style={{
          position: 'absolute',
          bottom: '16px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '999px',
          padding: '0.35rem 0.85rem',
          fontSize: '0.72rem',
          color: '#FDA4AF',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          zIndex: 3
        }}>
          <Eye size={12} /> LEVEL 0 · UNPATENTABLE SHADOW TWIN (PUBLIC PREVIEW)
        </div>
      </div>
    );
  };

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', padding: '2rem 1.5rem 6rem', color: '#111827' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Top Explorer Navigation & View Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                DISCOVERY STREAM
              </span>
              <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                Copyleft &amp; Creative Commons Shadow Twins
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Hardware Idea Reel.
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* View Mode Switcher */}
            <div style={{
              display: 'flex',
              background: '#F3F4F6',
              padding: '0.25rem',
              borderRadius: '10px',
              border: '1px solid #E5E7EB'
            }}>
              <button
                onClick={() => setViewMode('reel')}
                style={{
                  background: viewMode === 'reel' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'reel' ? '#111827' : '#6B7280',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: viewMode === 'reel' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                TikTok Reel
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'grid' ? '#111827' : '#6B7280',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Catalog Grid
              </button>
            </div>
          </div>
        </div>

        {/* REEL MODE (TikTok-Style Vertical Idea Stream) */}
        {viewMode === 'reel' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 56px',
            gap: '1.25rem',
            alignItems: 'start'
          }}>
            {/* Main Interactive Reel Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #E5E7EB',
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}>
              {/* Specimen Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      color: '#2563EB',
                      fontFamily: 'var(--font-mono)',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      ID: {activeTwin.id.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>
                      Inventor: <strong style={{ color: '#111827' }}>@{activeTwin.creator}</strong>
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#F3F4F6', color: '#4B5563', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                      {activeTwin.domain}
                    </span>
                  </div>

                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color: '#111827',
                    margin: '0 0 0.4rem 0',
                    letterSpacing: '-0.02em'
                  }}>
                    {activeTwin.current_version.title}
                  </h2>

                  <p style={{ fontSize: '0.9rem', color: '#4B5563', margin: 0, lineHeight: 1.5, maxWidth: '720px' }}>
                    {activeTwin.current_version.summary}
                  </p>
                </div>

                {/* License & Copyleft Badge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#F0FDF4',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: '0.35rem'
                  }}>
                    <Scale size={13} />
                    <span>{activeTwin.current_version.license || 'CERN-OHL-S-2.0 Copyleft'}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                    Creative Commons Attribution Ready
                  </div>
                </div>
              </div>

              {/* 4 Levels of Privacy & Security Slider */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sliders size={14} color="#059669" />
                    <span>Privacy &amp; Security Level:</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Click any level to toggle preview depth
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {/* Level 0: Shadow Twin */}
                  <button
                    onClick={() => setPrivacyLevel(activeTwin.id, 0)}
                    style={{
                      background: activeLevel === 0 ? '#1E293B' : '#FFFFFF',
                      color: activeLevel === 0 ? '#FFFFFF' : '#334155',
                      border: `1.5px solid ${activeLevel === 0 ? '#1E293B' : '#E2E8F0'}`,
                      borderRadius: '10px',
                      padding: '0.65rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      <Eye size={12} color={activeLevel === 0 ? '#38BDF8' : '#64748B'} />
                      <span>Level 0: Shadow Twin</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.3 }}>
                      Unpatentable schematic. Free public preview.
                    </div>
                  </button>

                  {/* Level 1: Coffee Backer */}
                  <button
                    onClick={() => setPrivacyLevel(activeTwin.id, 1)}
                    style={{
                      background: activeLevel === 1 ? '#0F766E' : '#FFFFFF',
                      color: activeLevel === 1 ? '#FFFFFF' : '#334155',
                      border: `1.5px solid ${activeLevel === 1 ? '#0F766E' : '#E2E8F0'}`,
                      borderRadius: '10px',
                      padding: '0.65rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      <Coffee size={12} color={activeLevel === 1 ? '#5EEAD4' : '#64748B'} />
                      <span>Level 1: $5 Patron</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.3 }}>
                      Benchtop test telemetry &amp; kickback ledger.
                    </div>
                  </button>

                  {/* Level 2: Card-Verified AVS Vault */}
                  <button
                    onClick={() => setPrivacyLevel(activeTwin.id, 2)}
                    style={{
                      background: activeLevel === 2 ? '#2563EB' : '#FFFFFF',
                      color: activeLevel === 2 ? '#FFFFFF' : '#334155',
                      border: `1.5px solid ${activeLevel === 2 ? '#2563EB' : '#E2E8F0'}`,
                      borderRadius: '10px',
                      padding: '0.65rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      {isTwinUnlocked ? <Unlock size={12} color="#93C5FD" /> : <Lock size={12} color={activeLevel === 2 ? '#93C5FD' : '#EF4444'} />}
                      <span>Level 2: 3D Solid ($0 Auth)</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.3 }}>
                      Stripe card-matched AVS &amp; P2P NDA solid model.
                    </div>
                  </button>

                  {/* Level 3: Commercial License */}
                  <button
                    onClick={() => {
                      setPrivacyLevel(activeTwin.id, 3);
                      setActiveAccessModalTwin(activeTwin.id);
                    }}
                    style={{
                      background: activeLevel === 3 ? '#7C3AED' : '#FFFFFF',
                      color: activeLevel === 3 ? '#FFFFFF' : '#334155',
                      border: `1.5px solid ${activeLevel === 3 ? '#7C3AED' : '#E2E8F0'}`,
                      borderRadius: '10px',
                      padding: '0.65rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      <Coins size={12} color={activeLevel === 3 ? '#C4B5FD' : '#64748B'} />
                      <span>Level 3: Commercial</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.3 }}>
                      Full tooling G-code &amp; 85% creator royalty.
                    </div>
                  </button>
                </div>
              </div>

              {/* Main Visual Presentation Canvas */}
              <div style={{ marginBottom: '1.5rem' }}>
                {activeLevel === 0 && (
                  <div>
                    {renderShadowTwin(activeTwin.id)}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B', marginTop: '0.65rem' }}>
                      <span>GNU Copyleft Public Preview · Unpatentable silhouette protects creator IP</span>
                      <button 
                        onClick={() => setPrivacyLevel(activeTwin.id, 2)}
                        style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Unlock High-Fidelity 3D Solid ($0 Card Auth) →
                      </button>
                    </div>
                  </div>
                )}

                {activeLevel === 1 && (
                  <div style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #0F766E',
                    borderRadius: '16px',
                    padding: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0F766E', fontWeight: 800, fontSize: '0.85rem' }}>
                        <Coffee size={16} /> Level 1: Benchtop Test Telemetry &amp; Patron Ledger
                      </div>
                      <span style={{ fontSize: '0.72rem', background: '#CCFBF1', color: '#0F766E', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                        Witnessed Provenance
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      {activeTwin.current_version.properties.slice(0, 4).map(p => (
                        <div key={p.key} style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{p.label}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                            {p.value} {p.unit}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#334155', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
                      Backing this invention with a $5 coffee patron pass gives you permanent attribution on the immutable provenance ledger and enters you into the Goldilocks retail kickback pool upon first production run.
                    </p>

                    <Link 
                      href={`/roundup`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '100px',
                        fontSize: '0.8125rem',
                        fontWeight: 700
                      }}
                    >
                      Pledge $5 to Albuquerque Tooling Run →
                    </Link>
                  </div>
                )}

                {activeLevel >= 2 && (
                  <div>
                    {isTwinUnlocked ? (
                      <div>
                        {/* High-Fidelity 3D / Simulation View */}
                        <div style={{
                          border: '2px solid #2563EB',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          background: '#F8FAFC',
                          padding: '1rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563EB', fontWeight: 800, fontSize: '0.85rem' }}>
                              <Unlock size={16} /> Level 2: High-Fidelity Parametric Twin (Decrypted)
                            </div>
                            <span style={{ fontSize: '0.72rem', background: '#DBEAFE', color: '#1E40AF', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
                              Stripe AVS Cardholder Matched
                            </span>
                          </div>

                          {activeTwin.id.includes('redr') ? (
                            <RedrinkViewer />
                          ) : activeTwin.id.includes('twizz') ? (
                            <PistonViewer />
                          ) : (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                              <Layers size={48} color="#2563EB" style={{ margin: '0 auto 1rem auto' }} />
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                                Parametric STEP Solid Decrypted
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '440px', margin: '0.5rem auto 1.5rem' }}>
                                Calibrated mesh, tolerance stack-up, and manufacturing drawings unlocked under your signed P2P Mutual NDA.
                              </div>
                              <Link
                                href={`/twins/${activeTwin.id}`}
                                style={{
                                  background: '#111827',
                                  color: '#FFFFFF',
                                  textDecoration: 'none',
                                  padding: '0.65rem 1.25rem',
                                  borderRadius: '100px',
                                  fontSize: '0.8125rem',
                                  fontWeight: 700
                                }}
                              >
                                View Full Engineering Dossier →
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Locked Gate Banner */
                      <div style={{
                        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                        borderRadius: '16px',
                        padding: '2.5rem 2rem',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.12)'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(37, 99, 235, 0.2)',
                          border: '1px solid #3B82F6',
                          display: 'grid',
                          placeItems: 'center',
                          margin: '0 auto 1rem auto'
                        }}>
                          <Lock size={26} color="#60A5FA" />
                        </div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                          High-Fidelity 3D Parametric Solid Locked
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '520px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                          The verified 3D CAD model, manufacturing tolerances, and full assembly tree are protected behind Stripe AVS card verification and our mutual P2P Non-Disclosure Agreement.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setActiveAccessModalTwin(activeTwin.id)}
                            style={{
                              background: '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '0.75rem 1.5rem',
                              borderRadius: '100px',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <CreditCard size={15} /> Authenticate Card ($0) &amp; Sign NDA
                          </button>
                          <button
                            onClick={() => handleUnlockTwin(activeTwin.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#E2E8F0',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              padding: '0.75rem 1.25rem',
                              borderRadius: '100px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            1-Click Sandbox Unlock
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #F3F4F6'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Link
                    href={`/twins/${activeTwin.id}`}
                    style={{
                      background: '#111827',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '100px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    Open Full Twin Dossier
                    <ArrowRight size={14} />
                  </Link>

                  <Link
                    href={`/roundup`}
                    style={{
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                      textDecoration: 'none',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '100px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Coins size={14} color="#059669" />
                    Back Tooling in IP Kiosk
                  </Link>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>
                  Specimen {currentIndex + 1} of {twins.length} · Use ↑ / ↓ keys or sidebar arrows
                </div>
              </div>
            </div>

            {/* Vertical TikTok-Style Navigation Sidebar */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              position: 'sticky',
              top: '5rem'
            }}>
              <button
                onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : twins.length - 1))}
                aria-label="Previous Twin"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1.5px solid #E5E7EB',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                  color: '#111827'
                }}
              >
                <ChevronUp size={20} />
              </button>

              {twins.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentIndex(idx)}
                  title={t.current_version.title}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: currentIndex === idx ? '#111827' : '#FFFFFF',
                    color: currentIndex === idx ? '#FFFFFF' : '#4B5563',
                    border: `1.5px solid ${currentIndex === idx ? '#111827' : '#E5E7EB'}`,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  0{idx + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentIndex(prev => (prev < twins.length - 1 ? prev + 1 : 0))}
                aria-label="Next Twin"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1.5px solid #E5E7EB',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                  color: '#111827'
                }}
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>
        )}

        {/* CATALOG GRID MODE */}
        {viewMode === 'grid' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem'
            }}>
              {twins.map(twin => (
                <div
                  key={twin.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                        {twin.id.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: '#F0FDF4', color: '#065F46', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        {twin.current_version.license || 'CERN-OHL-S-2.0'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#111827' }}>
                      {twin.current_version.title}
                    </h3>

                    <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                      {twin.current_version.summary.substring(0, 110)}...
                    </p>

                    <div style={{
                      background: '#F8FAFC',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      color: '#64748B',
                      marginBottom: '1rem'
                    }}>
                      <strong>Security:</strong> Level 0 Shadow Free · Level 2 3D Solid Card-Protected
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/twins/${twin.id}`}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        background: '#111827',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}
                    >
                      Open Twin →
                    </Link>
                    <button
                      onClick={() => {
                        setActiveAccessModalTwin(twin.id);
                      }}
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Verify ID ($0)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: AccessModal for Stripe Card Verification & NDA */}
        {activeAccessModalTwin && (
          <AccessModal
            twinId={activeAccessModalTwin}
            creator="johne.boi"
            onClose={() => setActiveAccessModalTwin(null)}
            onVaultUnlocked={() => handleUnlockTwin(activeAccessModalTwin)}
          />
        )}

      </div>
    </main>
  );
}
