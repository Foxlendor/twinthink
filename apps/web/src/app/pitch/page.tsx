'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Key, 
  Unlock, 
  Lock, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  ArrowRight,
  Eye,
  Award,
  Layers
} from 'lucide-react';
import { usePitchAccess, DEFAULT_PITCH_CODES } from '@/lib/usePitchAccess';
import { TWINS_DATABASE } from '@/lib/twinsData';

export default function PitchAccessPage() {
  const { isUnlocked, activeCode, unlockWithCode, relock, createPitchCode } = usePitchAccess();
  const [pitchInput, setPitchInput] = useState('');
  const [pitchStatus, setPitchStatus] = useState<{ msg: string; success: boolean } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<string | null>(null);

  const portfolioTwins = [
    TWINS_DATABASE['redrink'],
    TWINS_DATABASE['twiizzlock'],
    TWINS_DATABASE['0001']
  ].filter(Boolean);

  const handlePitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchInput.trim()) return;
    const res = unlockWithCode(pitchInput);
    setPitchStatus({ msg: res.message, success: res.success });
    if (res.success) {
      setPitchInput('');
    }
  };

  const handleCopyLink = (path: string, code: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${path}?pitch=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(path);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = createPitchCode(customCodeInput);
    setNewlyCreatedCode(code);
    setCustomCodeInput('');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'transparent',
        color: '#111827',
        padding: '3.5rem 1.75rem 8rem'
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Header Breadcrumb & Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '0.3rem 0.75rem', marginBottom: '1rem' }}>
            <Sparkles size={13} />
            PRIVATE ACCESS · INVESTOR &amp; PARTNER SUITE
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.03em', color: '#111827' }}>
            Pitch &amp; Technical Discovery Portal
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#4B5563', margin: 0, lineHeight: 1.6, maxWidth: '750px' }}>
            TwinThink implements cryptographic key envelopes to protect unpatented CAD geometries, manufacturing toolpaths, and granular supplier pricing during investor meetings.
          </p>
        </div>

        {/* Authentication Bar Card */}
        <div
          style={{
            marginBottom: '3rem',
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '2rem',
            border: isUnlocked ? '1px solid #10B981' : '1px solid #E5E7EB',
            boxShadow: '0 10px 35px rgba(0,0,0,0.04)',
            transition: 'border-color 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 320px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: isUnlocked ? '#ECFDF5' : '#F3F4F6',
                  border: isUnlocked ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                  display: 'grid',
                  placeItems: 'center',
                  color: isUnlocked ? '#059669' : '#4B5563',
                  flexShrink: 0
                }}
              >
                {isUnlocked ? <Unlock size={24} /> : <Key size={24} />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.2px' }}>
                  {isUnlocked ? `Pitch Pass Active (${activeCode})` : 'Private Pitch Pass Required'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '0.2rem' }}>
                  {isUnlocked
                    ? 'All proprietary BOM supplier lines, tolerancing, and STEP files are currently decrypted.'
                    : 'Enter an invitation code or test token to unlock the complete portfolio in 1-click.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isUnlocked ? (
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <button
                    onClick={relock}
                    style={{
                      padding: '0.6rem 1.15rem',
                      borderRadius: '8px',
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#DC2626',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Lock Session
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePitchSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="e.g. PITCH2026 or INVESTOR"
                    value={pitchInput}
                    onChange={(e) => setPitchInput(e.target.value)}
                    style={{
                      padding: '0.65rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      width: '230px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      background: '#111827',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Unlock All Twins
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Verification Chip Presets */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#6B7280' }}>
            <span style={{ fontWeight: 600 }}>Quick Verification Codes:</span>
            {DEFAULT_PITCH_CODES.slice(0, 5).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setPitchInput(c);
                  unlockWithCode(c);
                }}
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {pitchStatus && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                background: pitchStatus.success ? '#ECFDF5' : '#FEF2F2',
                color: pitchStatus.success ? '#065F46' : '#991B1B',
                border: pitchStatus.success ? '1px solid #A7F3D0' : '1px solid #FCA5A5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{pitchStatus.msg}</span>
              <button
                onClick={() => setPitchStatus(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Portfolio Showcase Grid */}
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.3px' }}>
                Active Confidential Portfolio
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6B7280' }}>
                Digital twins available for physical review and term-sheet evaluations.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isUnlocked ? '#059669' : '#6B7280', background: isUnlocked ? '#ECFDF5' : '#F3F4F6', padding: '0.3rem 0.75rem', borderRadius: '999px', border: isUnlocked ? '1px solid #A7F3D0' : '1px solid #E5E7EB' }}>
              {isUnlocked ? '✓ Vault Unlocked' : '🔒 Restricted Mode'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {portfolioTwins.map(twin => {
              const urlSlug = `/twins/${twin.id}`;
              const isCopied = copiedLink === urlSlug;
              return (
                <div
                  key={twin.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                        TWIN #{twin.id.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isUnlocked ? '#059669' : '#4B5563', background: isUnlocked ? '#ECFDF5' : '#F3F4F6', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {isUnlocked ? 'DECRYPTED' : 'CAPSULE LOCKED'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.4rem', lineHeight: 1.3 }}>
                      {twin.current_version.title}
                    </h3>

                    <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                      {twin.current_version.summary.substring(0, 115)}...
                    </p>

                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Domain:</span>
                        <span style={{ fontWeight: 600 }}>{twin.domain || 'Engineering'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Estimated BOM:</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>
                          ${twin.current_version.properties.find(p => p.key.includes('bom'))?.value || '2.10'} USD
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>CAD Solids:</span>
                        <span style={{ fontWeight: 600 }}>
                          {isUnlocked ? 'Unlocked (.STEP / STL)' : 'Protected (Pitch Pass)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={isUnlocked ? `${urlSlug}?pitch=${activeCode || 'PITCH2026'}` : urlSlug}
                      style={{
                        flex: 1,
                        background: '#111827',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {isUnlocked ? <Unlock size={14} /> : <Eye size={14} />}
                      {isUnlocked ? 'Open Full Twin' : 'View Twin'}
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(urlSlug, activeCode || 'PITCH2026')}
                      title="Copy 1-Click Pitch URL"
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: '#F3F4F6',
                        border: '1px solid #D1D5DB',
                        color: '#374151',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      {isCopied ? 'Copied' : 'Share'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Founder Link Generator & One-Time Token Controls */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Award size={20} color="#2563EB" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Creator Tools: Issue 1-Click Invite Pass
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 1.5rem', maxWidth: '700px' }}>
            Pitching to an investor or corporate partner? Generate a custom, one-click pitch code. Sending the link automatically injects the capability token so your recipient lands directly on the decrypted engineering records without entering passwords.
          </p>

          <form onSubmit={handleGenerateCode} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Custom code name (optional, e.g. SEQUOIA26)"
              value={customCodeInput}
              onChange={e => setCustomCodeInput(e.target.value)}
              style={{
                flex: '1 1 250px',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Generate Pitch Invite
            </button>
          </form>

          {newlyCreatedCode && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8' }}>Ready To Send:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#1E3A8A' }}>
                  Code: {newlyCreatedCode}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyLink('/pitch', newlyCreatedCode)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #93C5FD',
                  color: '#1D4ED8',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Copy size={13} /> Copy 1-Click Meeting Link
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
