'use client';

import React, { useState } from 'react';
import { Key, Unlock, Copy } from 'lucide-react';
import { usePitchAccess } from '@/lib/usePitchAccess';

export default function PitchAccessPage() {
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
    const url = `${window.location.origin}/twins/twiizzlock?pitch=PITCH2026`;
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
        padding: '4rem 1.5rem 6rem'
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem', letterSpacing: '-1px' }}>
          Pitch & Investor Access
        </h1>
        
        {/* Pitch / Investor Unlock Bar (Light Minimalist Theme) */}
        <div
          style={{
            marginBottom: '3rem',
            background: '#FFFFFF',
            color: '#111827',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            border: isUnlocked ? '1px solid #10B981' : '1px solid #E5E7EB'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isUnlocked ? '#ECFDF5' : '#F3F4F6',
                border: isUnlocked ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                display: 'grid',
                placeItems: 'center',
                color: isUnlocked ? '#059669' : '#4B5563'
              }}
            >
              {isUnlocked ? <Unlock size={22} /> : <Key size={22} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.2px' }}>
                {isUnlocked ? 'Pitch & Investor Pass Active' : 'Restricted Access'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '0.2rem' }}>
                {isUnlocked 
                  ? `Authenticated with code: ${activeCode} — Full private records unlocked.`
                  : 'Have a pitch invitation code? Enter it below to unlock all private engineering records.'}
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
                    border: '1px solid #D1D5DB',
                    color: '#111827',
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
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Re-lock Access
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
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#111827',
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
                    background: '#111827',
                    color: '#FFFFFF',
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
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
