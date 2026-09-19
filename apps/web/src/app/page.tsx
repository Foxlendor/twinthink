'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  MapPin, 
  Store, 
  CheckCircle2, 
  Sparkles,
  FileCode,
  Activity,
  DollarSign,
  X
} from 'lucide-react';
import CreateTwinModal from '@/components/CreateTwinModal';

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [pledgeSuccess, setPledgeSuccess] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [heroVisualMode, setHeroVisualMode] = useState<'schematic' | 'cad'>('schematic');
  const [modelViewerMounted, setModelViewerMounted] = useState(false);

  React.useEffect(() => {
    import('@google/model-viewer').then(() => {
      setModelViewerMounted(true);
    });
  }, []);

  const handleQuickBack = (projectName: string, amount: number) => {
    setPledgeSuccess(`Pledge confirmed: $${amount} added to ${projectName}!`);
    setTimeout(() => setPledgeSuccess(null), 5000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubSuccess("Subscribed to John Thompson ($5/mo)! Thank you for supporting independent hardware.");
    setShowSubModal(false);
    setTimeout(() => setSubSuccess(null), 6000);
  };

  return (
    <main className="container" style={{ padding: '4rem 1.5rem 6rem 1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Success Notification Banners */}
      {pledgeSuccess && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          color: '#065F46',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.9375rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
        }}>
          <CheckCircle2 size={20} color="#059669" />
          <span>{pledgeSuccess}</span>
        </div>
      )}

      {subSuccess && (
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          color: '#1E40AF',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.9375rem',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
        }}>
          <CheckCircle2 size={20} color="#2563EB" />
          <span>{subSuccess}</span>
        </div>
      )}

      {/* 1. TOP BANNER: The Original Vision */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        alignItems: 'center',
        gap: '3rem',
        marginBottom: '5.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(2.75rem, 5vw, 3.85rem)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.08,
            color: '#111827',
            marginBottom: '1.25rem'
          }}>
            Give an idea<br />a reality.
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: '#4B5563',
            lineHeight: 1.6,
            maxWidth: '460px',
            marginBottom: '2rem'
          }}>
            A living digital record for things people imagine, build, and test.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Link
              href="/twins/0001"
              className="button-primary"
              style={{ padding: '0.85rem 1.75rem', borderRadius: '100px', fontSize: '0.9375rem', textDecoration: 'none' }}
            >
              Explore
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="button-secondary"
              style={{ padding: '0.85rem 1.75rem', borderRadius: '100px', fontSize: '0.9375rem' }}
            >
              Create Twin
            </button>
          </div>

          <Link
            href="#platform"
            style={{
              fontSize: '0.875rem',
              color: '#374151',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none'
            }}
          >
            Learn more about TwinThink →
          </Link>
        </div>

        {/* Authentic Engineering Hero Showcase */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            padding: '1.25rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            {/* Toggle header between 2016 Schematic and 3D CAD */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <div style={{ display: 'flex', gap: '0.35rem', background: '#F3F4F6', padding: '0.2rem', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setHeroVisualMode('schematic')}
                  style={{
                    background: heroVisualMode === 'schematic' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: heroVisualMode === 'schematic' ? 700 : 500,
                    color: heroVisualMode === 'schematic' ? '#111827' : '#6B7280',
                    cursor: 'pointer',
                    boxShadow: heroVisualMode === 'schematic' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  2016 Schematic
                </button>
                <button
                  type="button"
                  onClick={() => setHeroVisualMode('cad')}
                  style={{
                    background: heroVisualMode === 'cad' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: heroVisualMode === 'cad' ? 700 : 500,
                    color: heroVisualMode === 'cad' ? '#111827' : '#6B7280',
                    cursor: 'pointer',
                    boxShadow: heroVisualMode === 'cad' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Live 3D CAD
                </button>
              </div>

              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                VERIFIED PROVENANCE
              </span>
            </div>

            {/* Visual Canvas */}
            {heroVisualMode === 'schematic' ? (
              <div style={{
                width: '100%',
                height: '340px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#FAFAFA',
                backgroundImage: 'radial-gradient(#E5E7EB 1.5px, transparent 1.5px)',
                backgroundSize: '18px 18px',
                border: '1px solid #F3F4F6',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem'
              }}>
                <img
                  src="/resip_schematic_2016.png"
                  alt="Original 2016 Science Fair Schematic (020)"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'contrast(1.08)'
                  }}
                />

                {/* Callout Badges */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#111827',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>
                  ① 316L Coaxial Conduit
                </div>

                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '12px',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#059669',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>
                  ② 54°C Latent Phase Change
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#B45309',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>
                  ③ Bimetal Snap-Disc
                </div>
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '340px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#F9FAFB',
                border: '1px solid #F3F4F6',
                position: 'relative'
              }}>
                {modelViewerMounted ? (
                  React.createElement('model-viewer', {
                    src: '/resip_preview.glb',
                    alt: 'Interactive 3D CAD model of RESIP straw',
                    'camera-controls': true,
                    'auto-rotate': true,
                    'shadow-intensity': '1',
                    'environment-image': 'neutral',
                    style: { width: '100%', height: '100%' }
                  })
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '0.85rem' }}>
                    Loading 3D CAD...
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#FFFFFF',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Interactive 3D CAD · Drag to rotate
                </div>
              </div>
            )}

            {/* Provenance footer info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.85rem',
              paddingTop: '0.6rem',
              borderTop: '1px solid #F3F4F6',
              fontSize: '0.75rem',
              color: '#6B7280'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                Specimen #0001 · Primary Prior Art
              </span>
              <Link
                href="/twins/0001?tab=history"
                style={{
                  color: '#2563EB',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                Inspect Provenance →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION 1: LIVE BUILDS & INVENTIONS (Crowdfunding Feed) */}
      <section id="builds" style={{ marginBottom: '5.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1.75rem',
          borderBottom: '1px solid #E5E7EB',
          paddingBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.5px',
              margin: '0 0 0.25rem 0'
            }}>
              Live Builds &amp; Inventions
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
              Real projects with verifiable test data, CAD specs, and active batch funding.
            </p>
          </div>

          <Link
            href="/twins/0001"
            style={{
              fontSize: '0.875rem',
              color: '#2563EB',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            View Specimen #0001 →
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '1.75rem'
        }}>
          
          {/* Card 1: RESIP™ Self-Heating Straw */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#059669',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.5px'
              }}>
                PROTOTYPE · 2016 SCIENCE FAIR VERIFIED
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                Twin #0001
              </span>
            </div>

            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#F3F4F6',
              marginBottom: '1.25rem'
            }}>
              <img
                src="/resip/208ea1a2-820f-40c1-8a34-7123342714aa.jpg"
                alt="RESIP Straw"
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem 0' }}>
              <Link href="/twins/0001" style={{ color: '#111827', textDecoration: 'none' }}>
                RESIP™ Thermal Straw
              </Link>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1.25rem 0', flex: 1 }}>
              First tooling batch of CNC bimetal snap-discs &amp; passivated 316L tubing. Passive 54.0°C plateau with zero batteries.
            </p>

            {/* Funding Progress Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                  $0 <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>of $2,500 target</span>
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 700 }}>
                  Pre-Launch · Accepting First Production Backers
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', background: '#10B981', borderRadius: '999px' }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href="/twins/0001"
                style={{
                  flex: 1,
                  background: '#111827',
                  color: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                Pre-order Straw — $25
              </Link>
              <Link
                href="/twins/0001"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Inspect Twin →
              </Link>
            </div>
          </div>

          {/* Card 2: BubbleBlock */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#D97706',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.5px'
              }}>
                THERMAL INSULATION · EXPERIMENTAL
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                Twin #0002
              </span>
            </div>

            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#F3F4F6',
              marginBottom: '1.25rem'
            }}>
              <img
                src="/resip/5fc3a429-8c83-4088-86ac-eae6484d59d6.jpg"
                alt="BubbleBlock Tile"
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem 0' }}>
              <Link href="/twins/0001?tab=structure" style={{ color: '#111827', textDecoration: 'none' }}>
                BubbleBlock Tile
              </Link>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1.25rem 0', flex: 1 }}>
              Modular phase-change thermal tile for backcountry gear. Micro-encapsulated salt hydrate R-6.8 equivalent barrier.
            </p>

            {/* Funding Progress Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                  $0 <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>of $1,200 target</span>
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#D97706', fontWeight: 700 }}>
                  Pre-Launch · Open for Backers
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', background: '#F59E0B', borderRadius: '999px' }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleQuickBack("BubbleBlock", 15)}
                style={{
                  flex: 1,
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                Back Tile — $15
              </button>
              <Link
                href="/twins/0001?tab=structure"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Specs
              </Link>
            </div>
          </div>

          {/* Card 3: FerroPen Stylus */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#6B7280',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.5px'
              }}>
                MICRO-FLUIDIC · CONCEPT NOTE
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                Twin #0003
              </span>
            </div>

            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#F3F4F6',
              marginBottom: '1.25rem'
            }}>
              <img
                src="/journal/003-1-e1628076904523.png"
                alt="FerroPen Concept"
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem 0' }}>
              <Link href="/archive" style={{ color: '#111827', textDecoration: 'none' }}>
                FerroPen Stylus
              </Link>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1.25rem 0', flex: 1 }}>
              Micro-ferrofluid haptic pressure stylus for frictionless tablet drafting with continuous analog Hall-effect sensing.
            </p>

            {/* Status Indicator */}
            <div style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem',
              color: '#6B7280',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Stage: Bench Concept</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>Pending Lab Run</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href="/archive"
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '1.5px solid #111827',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                View Concept →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SECTION 2: MEET THE THINKERS (Inventor Resume / Patreon Layer) */}
      <section style={{ marginBottom: '5.5rem' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '1.75rem'
          }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)'
              }}>
                JT
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                    John Thompson
                  </h3>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <ShieldCheck size={12} /> VERIFIED INVENTOR
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6B7280', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} /> Albuquerque, New Mexico
                  </span>
                  <span>•</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111827' }}>
                    twinth.ink/@john
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href="/@john"
                style={{
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '1.5px solid #D1D5DB',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '100px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                View Inventor Resume
              </Link>

              <button
                onClick={() => setShowSubModal(true)}
                style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '100px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Sparkles size={15} /> Support $5/mo
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1.25rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Focus &amp; Specialties
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', marginTop: '0.2rem' }}>
                Thermodynamics · Bistable Mechanisms · Hardware
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Pipeline Portfolio
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', marginTop: '0.2rem' }}>
                3 Inventions · Pre-Launch (Accepting Backers)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Verification
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#059669', marginTop: '0.2rem' }}>
                Grounding: 2016 Science Fair Prior Art
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 3: FROM FIRST SKETCH TO PHYSICAL REALITY */}
      <section id="platform" style={{ marginBottom: '5.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#111827',
            letterSpacing: '-0.5px',
            margin: '0 0 0.5rem 0'
          }}>
            From first sketch to physical reality.
          </h2>
          <p style={{ fontSize: '1rem', color: '#6B7280', maxWidth: '640px', margin: '0 auto', lineHeight: 1.55 }}>
            Document the idea. Show the work. Gather feedback. Find backers. Connect with manufacturers.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Step 1 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '2rem 1.75rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#2563EB',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              marginBottom: '1rem'
            }}>
              01
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
              Showcase Your Prototype
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.55, margin: 0 }}>
              Post your technical drawings, BOM specifications, and test logs. Prove real-world engineering with verifiable bench data.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '2rem 1.75rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#059669',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              marginBottom: '1rem'
            }}>
              02
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
              Control Confidential Specs
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.55, margin: 0 }}>
              Keep sensitive CAD geometries, proprietary formulas, and vendor tooling files locked behind a standard mutual NDA gate.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '2rem 1.75rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#D97706',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              marginBottom: '1rem'
            }}>
              03
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
              Get Funded &amp; Licensed
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.55, margin: 0 }}>
              Collect pre-orders toward your first production batch, receive monthly patron subscriptions, or negotiate commercial licensing.
            </p>
          </div>
        </div>
      </section>

      {/* 5. SECTION 4: LOCAL COUNTER PARTNERS (Retail Round-Up Banner) */}
      <section style={{
        background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.75rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#34D399',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-mono)'
          }}>
            <Store size={12} /> LOCAL SHOP COMMUNITY NETWORK
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem 0', letterSpacing: '-0.3px' }}>
            Bring TwinThink to your local counter.
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#D1D5DB', margin: 0, lineHeight: 1.5 }}>
            We provide local coffee shops, bakeries, and stores with custom acrylic Google Review stands at zero cost. In return, customers can round up their change to support local independent inventors.
          </p>
        </div>

        <Link
          href="/roundup"
          style={{
            background: '#FFFFFF',
            color: '#111827',
            padding: '0.9rem 1.75rem',
            borderRadius: '100px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
          }}
        >
          Request Stand →
        </Link>
      </section>

      {/* Create Twin Modal */}
      {showCreateModal && (
        <CreateTwinModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Subscription Modal for John Thompson */}
      {showSubModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <button
              onClick={() => setShowSubModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>✨</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Support John Thompson
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Your $5/month directly funds raw prototype materials, snap-disc machining, and lab bench testing in Albuquerque, NM.
            </p>

            <form onSubmit={handleSubscribe}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jane Maker"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.9rem',
                  borderRadius: '100px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                Confirm $5/mo Subscription →
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
