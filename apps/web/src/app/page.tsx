'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  LockKeyhole, 
  FilePlus2, 
  Key, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Flame, 
  ExternalLink,
  Unlock,
  Users,
  Copy
} from 'lucide-react';
import CreateTwinModal from '@/components/CreateTwinModal';
import BrandLogo from '@/components/BrandLogo';
import BrandVideoBanner from '@/components/BrandVideoBanner';
import CrowdfundingBar from '@/components/CrowdfundingBar';
import { usePitchAccess } from '@/lib/usePitchAccess';

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isUnlocked, activeCode, unlockWithCode, relock } = usePitchAccess();
  const [pitchInput, setPitchInput] = useState('');
  const [pitchStatus, setPitchStatus] = useState<{ msg: string; success: boolean } | null>(null);
  const [copiedPitchLink, setCopiedPitchLink] = useState(false);

  const handlePitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchInput.trim()) return;
    const res = unlockWithCode(pitchInput);
    setPitchStatus({ msg: res.message, success: res.success });
    if (res.success) {
      setPitchInput('');
    }
  };

  const handleCopyPitchLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/twins/twizzlock?pitch=PITCH2026`;
    navigator.clipboard.writeText(url);
    setCopiedPitchLink(true);
    setTimeout(() => setCopiedPitchLink(false), 2500);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        color: '#111827',
        padding: '2rem 1.5rem 6rem'
      }}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        
        {/* Animated Brand Banner */}
        <div style={{ marginBottom: '2.5rem' }}>
          <BrandVideoBanner maxHeight="260px" />
        </div>

        {/* Pitch / Investor Unlock Bar */}
        <div
          style={{
            marginBottom: '3rem',
            background: isUnlocked 
              ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' 
              : 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
            color: isUnlocked ? '#065F46' : '#FFFFFF',
            borderRadius: '20px',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            border: isUnlocked ? '1px solid #A7F3D0' : '1px solid #374151'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isUnlocked ? '#10B981' : 'rgba(255,255,255,0.1)',
                display: 'grid',
                placeItems: 'center',
                color: '#FFFFFF'
              }}
            >
              {isUnlocked ? <Unlock size={22} /> : <Key size={22} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.2px' }}>
                {isUnlocked ? 'Pitch & Investor Pass Active' : 'Pitch & Investor Paywall Bypass'}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.15rem' }}>
                {isUnlocked 
                  ? `Authenticated with code: ${activeCode} — Full Level-3 Vault, CAD & BOMs unlocked`
                  : 'Have a pitch invitation code? Enter it below to unlock all restricted engineering vaults'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {isUnlocked ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleCopyPitchLink}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Copy size={13} /> {copiedPitchLink ? 'Copied Pitch Link!' : 'Share Pitch Link'}
                </button>
                <button
                  onClick={relock}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(6, 95, 70, 0.1)',
                    border: 'none',
                    color: '#065F46',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Re-lock Vault
                </button>
              </div>
            ) : (
              <form onSubmit={handlePitchSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Enter code (e.g. PITCH2026)"
                  value={pitchInput}
                  onChange={(e) => setPitchInput(e.target.value)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    width: '210px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#111827',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Unlock
                </button>
              </form>
            )}
          </div>
        </div>

        {pitchStatus && (
          <div
            style={{
              marginTop: '-2rem',
              marginBottom: '2rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              background: pitchStatus.success ? '#D1FAE5' : '#FEE2E2',
              color: pitchStatus.success ? '#065F46' : '#991B1B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{pitchStatus.msg}</span>
            <button
              onClick={() => setPitchStatus(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section
          style={{
            minHeight: '55vh',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
            alignItems: 'center',
            gap: '4rem',
            marginBottom: '4rem'
          }}
        >
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <BrandLogo height={44} />
            </div>

            <h1
              style={{
                fontSize: 'clamp(3rem, 6.5vw, 5.25rem)',
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
              Explore interactive 3D simulations, verify physics benchmarks, and back real physical prototypes.
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
                href="/twins/twizzlock"
                className="button-primary"
                style={{
                  padding: '0.9rem 1.6rem',
                  borderRadius: '100px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700
                }}
              >
                Launch TwizzLock™ 3D
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/twins/redrink"
                className="button-secondary"
                style={{
                  padding: '0.9rem 1.6rem',
                  borderRadius: '100px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700
                }}
              >
                Launch redr.ink™
                <Flame size={17} color="#EF4444" />
              </Link>

              <button
                onClick={() => setShowCreateModal(true)}
                className="button-secondary"
                style={{
                  padding: '0.9rem 1.6rem',
                  borderRadius: '100px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600
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
                Verified public preview records only. Restricted CAD files, production BOMs, and manufacturing tolerances
                are secured under the Level-3 Dark Capsule vault.
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
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>PUBLIC VERIFIED RECORD</span>
              <span style={{ color: '#10B981' }}>● LIVE ENGINE</span>
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
              Document the concept, simulate the physical behavior, run the bill of materials, and
              separate publicly verifiable evidence from private tooling.
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
                Interactive 3D mechanical simulations
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B82F6' }} />
                Real-time patron crowdfunding & waitlist
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <LockKeyhole size={14} color="#6B7280" />
                Pitch-code bypass for investors & evaluators
              </div>
            </div>
          </div>
        </section>

        {/* Featured Hardware Digital Twins Section */}
        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#4F46E5',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem'
                }}
              >
                PROTOTYPE DIRECTORY
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>
                Featured Hardware Digital Twins
              </h2>
            </div>
            <Link
              href="/archive"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#4F46E5',
                textDecoration: 'none'
              }}
            >
              View Full Archive <ArrowRight size={16} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem'
            }}
          >
            {/* TwizzLock Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #E5E7EB',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    padding: '0.3rem 0.65rem',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                >
                  3D INTERACTIVE TWIN
                </span>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                  ● Public Simulation
                </span>
              </div>

              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.3px' }}>
                TwizzLock™ 2L Volume Sleeve
              </h3>
              <p style={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem', flex: 1 }}>
                Reusable outer compression sleeve that turns standard 2L PET bottles into a sliding piston against a base check valve, collapsing headspace to lock in carbonation.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#F9FAFB',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  fontSize: '0.8rem'
                }}
              >
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>EST. UNIT BOM</div>
                  <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem' }}>$2.10 USD</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>HEADSPACE REDUCTION</div>
                  <div style={{ fontWeight: 800, color: '#10B981', fontSize: '1.05rem' }}>Up to 40%</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>RATED CYCLES</div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>500 Cycles</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>SLEEVE TECH</div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>RF-Welded TPU</div>
                </div>
              </div>

              <Link
                href="/twins/twizzlock"
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  background: '#111827',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Launch 3D Piston Simulator <ArrowRight size={16} />
              </Link>
            </div>

            {/* redr.ink Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #E5E7EB',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    padding: '0.3rem 0.65rem',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                >
                  THERMAL FLUIDICS
                </span>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                  ● Dual-Sim Active
                </span>
              </div>

              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.3px' }}>
                redr.ink™ Modular Straw
              </h3>
              <p style={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem', flex: 1 }}>
                Phase-change reheater straw clip-on using sodium acetate crystallization to restore lukewarm coffee or tea to optimal 44°C drinking temperature without batteries.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#F9FAFB',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  fontSize: '0.8rem'
                }}
              >
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>THERMAL LIFT</div>
                  <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '1.05rem' }}>18°C → 44°C</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>PARASITIC POWER</div>
                  <div style={{ fontWeight: 800, color: '#10B981', fontSize: '1.05rem' }}>0 Watts (Zero)</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>HEAT CARTRIDGE</div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>CH3COONa·3H2O</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>EST. BOM</div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>$1.85 USD</div>
                </div>
              </div>

              <Link
                href="/twins/redrink"
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  background: '#111827',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Launch Thermal Simulator <Flame size={16} color="#EF4444" />
              </Link>
            </div>

            {/* ReSip Origin Record Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #E5E7EB',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    padding: '0.3rem 0.65rem',
                    background: '#F3F4F6',
                    color: '#4B5563',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                >
                  VERIFIED ORIGIN RECORD
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>
                  2016 Science Fair
                </span>
              </div>

              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.3px' }}>
                redr.ink™ Origin (ReSip 2016)
              </h3>
              <p style={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem', flex: 1 }}>
                The original 2016 invention that pioneered passive phase-change reheat tubes. Rebranded and evolved into redr.ink™, formally documented in the public archive to establish verifiable prior art.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#F9FAFB',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  fontSize: '0.8rem'
                }}
              >
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>PROVENANCE YEAR</div>
                  <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem' }}>2016</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>DISCLOSURE LEVEL</div>
                  <div style={{ fontWeight: 800, color: '#4F46E5', fontSize: '1.05rem' }}>Level 1 Public</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>CONDUIT MATERIAL</div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>316L Stainless</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>VAULT STATUS</div>
                  <div style={{ fontWeight: 700, color: '#10B981' }}>Dark Capsule</div>
                </div>
              </div>

              <Link
                href="/twins/0001"
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  background: '#F3F4F6',
                  color: '#111827',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: '1px solid #E5E7EB'
                }}
              >
                View Origin Twin <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Elevated Patron & Community Crowdfunding Platform */}
        <section style={{ marginBottom: '5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#D97706',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '0.75rem'
              }}
            >
              <Sparkles size={13} />
              Community Patron Platform
            </div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.75px', margin: '0 0 0.75rem' }}>
              Back the Future of Physical Innovation
            </h2>
            <p style={{ color: '#4B5563', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              Like Patreon or Buy Me A Coffee, but engineered for real physical prototypes.
              Join the free waitlist or back pilot tooling runs to receive alpha test hardware and vote on feature development.
            </p>
          </div>

          <CrowdfundingBar
            twinId="platform_main"
            twinTitle="TwinThink Open Hardware Pilot Fund"
            goalAmount={5000}
            initialRaised={2150}
            initialBackers={56}
            batchDescription="Funding precision RF welding dies for TwizzLock sleeves and CNC borosilicate tubes for redr.ink thermal cartridges"
            targetMsrp={20}
          />
        </section>

        {/* Platform Architecture & Guarantees */}
        <section
          id="platform"
          style={{
            borderTop: '1px solid #E5E7EB',
            paddingTop: '4rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem'
          }}
        >
          {[
            ['01', 'Document & Simulate', 'Maintain 3D mechanical models, live telemetry, BOM trees, and test revisions together in an immutable record.'],
            ['02', 'Controlled Access & Pitch Codes', 'Choose what is public, shared with investors under instant pitch passes, or sealed in the Level-3 Dark Capsule.'],
            ['03', 'Patron Ledger & Crowd Waitlist', 'Measure real demand before tooling runs with flexible free waitlists, patron pledges, and permanent backer ledgers.']
          ].map(([number, title, description]) => (
            <div key={number}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#9CA3AF',
                  marginBottom: '0.75rem',
                  fontWeight: 700
                }}
              >
                {number}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.55rem', letterSpacing: '-0.2px' }}>
                {title}
              </h3>
              <p style={{ color: '#6B7280', lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>
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

