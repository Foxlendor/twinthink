'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Coffee, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Heart, 
  QrCode, 
  Star, 
  ArrowRight, 
  ShieldCheck, 
  Store,
  ExternalLink,
  Flame,
  X
} from 'lucide-react';

export default function RoundUpPage() {
  const [selectedDonation, setSelectedDonation] = useState<number | 'sub'>(1);
  const [customAmount, setCustomAmount] = useState<string>('5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showStandPreview, setShowStandPreview] = useState(false);

  const handleDonate = (amountDesc: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMessage(`Thank you! Your ${amountDesc} contribution was recorded. 100% goes directly to Albuquerque inventor prototype tooling.`);
      setTimeout(() => setSuccessMessage(null), 6000);
    }, 700);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#111827' }}>
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '2rem 1.25rem 5rem' }}>
        
        {/* Success Alert */}
        {successMessage && (
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#065F46',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <CheckCircle2 size={20} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Counter QR Stand Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#059669',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.75px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <Store size={13} /> LOCAL SHOP COUNTER CHECKOUT
          </span>

          <button
            onClick={() => setShowStandPreview(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <QrCode size={14} /> Shop Stand Mockup
          </button>
        </div>

        {/* Main Headline */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.75px',
            color: '#111827',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.15
          }}>
            Support Independent Inventors &amp; Local Thinkers
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
            Round up your coffee order or spare change to directly fund raw physical inventions, CNC machining, and lab prototypes.
          </p>
        </div>

        {/* 1-Tap Quick Donate Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', textAlign: 'center' }}>
            Choose Round-Up / Tip Amount:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {/* $1 Option */}
            <button
              onClick={() => setSelectedDonation(1)}
              style={{
                background: selectedDonation === 1 ? '#111827' : '#F9FAFB',
                color: selectedDonation === 1 ? '#FFFFFF' : '#111827',
                border: `2px solid ${selectedDonation === 1 ? '#111827' : '#E5E7EB'}`,
                borderRadius: '14px',
                padding: '1rem 0.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>$1</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.2rem' }}>Round Up</div>
            </button>

            {/* $3 Option */}
            <button
              onClick={() => setSelectedDonation(3)}
              style={{
                background: selectedDonation === 3 ? '#111827' : '#F9FAFB',
                color: selectedDonation === 3 ? '#FFFFFF' : '#111827',
                border: `2px solid ${selectedDonation === 3 ? '#111827' : '#E5E7EB'}`,
                borderRadius: '14px',
                padding: '1rem 0.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>$3</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.2rem' }}>Coffee Tip</div>
            </button>

            {/* $5/mo Option */}
            <button
              onClick={() => setSelectedDonation('sub')}
              style={{
                background: selectedDonation === 'sub' ? '#059669' : '#F0FDF4',
                color: selectedDonation === 'sub' ? '#FFFFFF' : '#065F46',
                border: `2px solid ${selectedDonation === 'sub' ? '#059669' : '#A7F3D0'}`,
                borderRadius: '14px',
                padding: '1rem 0.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>$5<span style={{ fontSize: '0.7rem' }}>/mo</span></div>
              <div style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '0.2rem' }}>Patron Sub</div>
            </button>
          </div>

          <button
            onClick={() => handleDonate(selectedDonation === 'sub' ? '$5/mo subscription' : `$${selectedDonation}`)}
            disabled={isProcessing}
            style={{
              width: '100%',
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              padding: '1rem',
              borderRadius: '100px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isProcessing ? 'Processing Round-Up...' : (
              selectedDonation === 'sub' 
                ? 'Subscribe $5/mo to Local Inventor →' 
                : `Round Up $${selectedDonation} Now →`
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#6B7280', fontSize: '0.75rem', marginTop: '1rem' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>100% honest physical hardware fund. Zero corporate fluff.</span>
          </div>
        </div>

        {/* Local Albuquerque Inventor Spotlight */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#B45309', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <MapPin size={13} /> CURRENT LOCAL SPOTLIGHT · ALBUQUERQUE, NM
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#111827',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              flexShrink: 0
            }}>
              JB
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#111827' }}>
                anonymous
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                Building <strong>Redr.ink™</strong> (Self-Heating Drink Straw)
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '1.25rem' }}>
            Original concept formulated during the Alpha R&D Phase, now advancing into first batch modular snap-in cartridges. Every round-up buys raw 316L stainless tubing and laboratory phase-change salts.
          </p>

          <div style={{
            background: '#F9FAFB',
            border: '1px solid #F3F4F6',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Specimen #0001</span>
              <strong style={{ fontSize: '0.875rem', color: '#111827' }}>Redr.ink™ Origin</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
              $0 / $2,500 (Pre-Launch)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              href="/twins/0001"
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid #111827',
                color: '#111827',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem'
              }}
            >
              Inspect Proof (Twin #0001) →
            </Link>
            <Link
              href="/@anonymous"
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '0.65rem',
                borderRadius: '8px',
                background: '#111827',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem'
              }}
            >
              Creator Resume →
            </Link>
          </div>
        </div>

        {/* Modal: Physical Counter Stand Mockup */}
        {showStandPreview && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowStandPreview(false)}>
            <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowStandPreview(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <QrCode size={16} /> Acrylic Counter Stand Concept
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
                The Coffee Shop Win-Win
              </h3>

              <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '1.5rem' }}>
                Local shops get a free, elegant acrylic Google Review stand that boosts 5★ ratings at zero cost. In exchange, the base features TwinThink&apos;s round-up QR code.
              </p>

              {/* Physical Stand Graphic Mock */}
              <div style={{
                background: 'linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%)',
                border: '2px solid #E5E7EB',
                borderRadius: '16px',
                padding: '1.75rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#D97706', marginBottom: '0.5rem' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>
                  Review Us on Google
                </div>

                {/* Simulated QR Code box */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 1rem auto',
                  background: '#FFFFFF',
                  border: '2px solid #111827',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <QrCode size={64} color="#111827" />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#6B7280' }}>SCAN AT REGISTER</span>
                </div>

                <div style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>Twinth.ink / Round-Up</span>
                  <span style={{ color: '#10B981' }}>+ Support Local Creators</span>
                </div>
              </div>

              <button
                onClick={() => setShowStandPreview(false)}
                style={{
                  width: '100%',
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '100px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
