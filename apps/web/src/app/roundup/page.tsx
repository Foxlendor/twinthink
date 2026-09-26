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
  X,
  Coins,
  GitFork,
  Eye,
  TrendingUp,
  Award,
  Layers,
  HelpCircle,
  Ticket
} from 'lucide-react';
import { TWINS_DATABASE } from '@/lib/twinsData';

export default function RoundUpPage() {
  const [selectedTwinId, setSelectedTwinId] = useState<'redrink' | 'twiizzlock' | '0002-iris'>('twiizzlock');
  const [selectedDonation, setSelectedDonation] = useState<number | 'sub'>(5);
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showStandPreview, setShowStandPreview] = useState(false);

  const twinOptions = [
    {
      id: 'twiizzlock' as const,
      name: 'TWIIZZLock™ 2L Volume Sleeve',
      toolingTarget: '$3,500 RF-Welding Die & Piston Tooling',
      funded: '$2,800',
      percent: 80,
      msrp: '$16.99',
      kickbackRate: '2.5% Net Retail Royalty',
      badge: 'Mechanisms'
    },
    {
      id: 'redrink' as const,
      name: 'Redr.ink™ Modular Thermal Straw',
      toolingTarget: '$6,500 316L Lumen & Phase-Change Cartridge Molds',
      funded: '$4,200',
      percent: 64,
      msrp: '$24.99',
      kickbackRate: '3.0% Net Retail Royalty',
      badge: 'Thermal Systems'
    },
    {
      id: '0002-iris' as const,
      name: 'Mechanical Iris Privacy Shutter',
      toolingTarget: '$2,000 Delrin Multi-Cavity Injection Tooling',
      funded: '$1,100',
      percent: 55,
      msrp: '$12.99',
      kickbackRate: '2.0% Net Retail Royalty',
      badge: 'Zero-Fastener Optics'
    }
  ];

  const currentTwin = twinOptions.find(t => t.id === selectedTwinId) || twinOptions[0];

  const numericPledge = selectedDonation === 'sub' ? 5 : Number(selectedDonation) || 5;
  const projectedKickbackMin = (numericPledge * 1.25).toFixed(2);
  const projectedKickbackMax = (numericPledge * 2.5).toFixed(2);

  const handleDonate = (amountDesc: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMessage(`Kickback Token Issued! Your ${amountDesc} pledge for ${currentTwin.name} is anchored. 100% funds raw physical tooling in Albuquerque, with royalty kickbacks linked directly to your wallet.`);
      setTimeout(() => setSuccessMessage(null), 8000);
    }, 700);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#111827' }}>
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2.5rem 1.25rem 6rem' }}>
        
        {/* Success Alert */}
        {successMessage && (
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            color: '#065F46',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 4px 15px rgba(5, 150, 105, 0.1)'
          }}>
            <CheckCircle2 size={22} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>Pledge Anchored in Physical Tooling</div>
              <div style={{ lineHeight: 1.5 }}>{successMessage}</div>
            </div>
          </div>
        )}

        {/* Counter QR Stand Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#059669',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <Store size={14} /> THE GROCERY STORE IP KIOSK
          </span>

          <button
            onClick={() => setShowStandPreview(true)}
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px'
            }}
          >
            <QrCode size={14} /> View Shop Kiosk Mockup
          </button>
        </div>

        {/* Main Headline */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#111827',
            margin: '0 0 0.75rem 0',
            lineHeight: 1.15
          }}>
            The IP Kiosk &amp; Patron Royalty Piggy Bank
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.6, margin: '0 auto', maxWidth: '560px' }}>
            Instead of tax dollars disappearing into anonymous black boxes, put your spare change or paycheck slice into the exact physical inventions you want to see exist.
          </p>
        </div>

        {/* Goldilocks Zone Concept Callout */}
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: '20px',
          padding: '1.75rem',
          color: '#F8FAFC',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 15px 30px -10px rgba(15, 23, 42, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38BDF8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            <Coins size={15} />
            <span>The Goldilocks Zone: Money In = Money Back</span>
          </div>

          <div style={{ fontSize: '1.05rem', fontStyle: 'italic', lineHeight: 1.6, color: '#E2E8F0', marginBottom: '1.25rem' }}>
            &ldquo;Any money you put in to fund a prototype is intended to equal that exact same money coming back to your wallet whenever the product ships, if not more. Everyone is empowered, and good ideas actually get built.&rdquo;
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#93C5FD' }}>
                <Eye size={13} /> Open to See, Back to Build
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.45 }}>
                You never have to pay just to look at the idea. Concept previews are open for anyone to explore.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#6EE7B7' }}>
                <GitFork size={13} /> The Forking Guarantee
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.45 }}>
                If an inventor abandons an idea, anyone in the community has the right to FORK the twin and build it.
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Grant Lottery Treasury Pool */}
        <div style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
          border: '1.5px solid #A7F3D0',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 15px rgba(5, 150, 105, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
              <Ticket size={16} color="#059669" /> MONTHLY INVENTOR GRANT LOTTERY POOL
            </div>
            <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
              Next Drawing: 8 Days
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#065F46', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>
                $6,420
              </span>
              <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>
                in current monthly treasury
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>
              1 Ticket per 50¢ Rounded Up
            </div>
          </div>

          <p style={{ fontSize: '0.825rem', color: '#065F46', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
            Every time a customer rounds up at a register stand or taps to donate, they receive ticket entries into the monthly community draw. At the end of each month, 100% of the pooled treasury is released as a non-dilutive tooling grant to an active hardware inventor on TwinThink.
          </p>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#047857', fontWeight: 600, flexWrap: 'wrap' }}>
            <span>✓ Powered by countertop tap-to-pay &amp; browser extension</span>
            <span>✓ 100% goes directly to physical tooling</span>
          </div>
        </div>

        {/* Step 1: Select Target Twin */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.75rem' }}>
            1. Select Which Invention Your Kiosk Dollars Back:
          </label>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {twinOptions.map(t => {
              const isSelected = selectedTwinId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTwinId(t.id)}
                  style={{
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    border: isSelected ? '2px solid #2563EB' : '1px solid #E5E7EB',
                    borderRadius: '16px',
                    padding: '1.15rem 1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 15px rgba(37, 99, 235, 0.08)' : '0 2px 6px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#111827' }}>{t.name}</strong>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563EB', background: '#DBEAFE', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                      {t.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '0.75rem' }}>
                    Tooling goal: {t.toolingTarget}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ background: '#E5E7EB', borderRadius: '999px', height: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#059669', width: `${t.percent}%`, height: '100%', borderRadius: '999px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>
                    <span>{t.funded} pledged ({t.percent}%)</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{t.kickbackRate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Choose Pledge Amount */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', textAlign: 'center' }}>
            2. Choose Your Kiosk Pledge:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[1, 5, 10].map(amt => (
              <button
                key={amt}
                onClick={() => setSelectedDonation(amt)}
                style={{
                  background: selectedDonation === amt ? '#111827' : '#F9FAFB',
                  color: selectedDonation === amt ? '#FFFFFF' : '#111827',
                  border: `2px solid ${selectedDonation === amt ? '#111827' : '#E5E7EB'}`,
                  borderRadius: '14px',
                  padding: '0.85rem 0.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>${amt}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '0.15rem' }}>Spare Change</div>
              </button>
            ))}

            {/* Monthly Patron */}
            <button
              onClick={() => setSelectedDonation('sub')}
              style={{
                background: selectedDonation === 'sub' ? '#059669' : '#F0FDF4',
                color: selectedDonation === 'sub' ? '#FFFFFF' : '#065F46',
                border: `2px solid ${selectedDonation === 'sub' ? '#059669' : '#A7F3D0'}`,
                borderRadius: '14px',
                padding: '0.85rem 0.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>$5<span style={{ fontSize: '0.65rem' }}>/mo</span></div>
              <div style={{ fontSize: '0.65rem', opacity: 0.9, marginTop: '0.15rem' }}>Patron Sub</div>
            </button>
          </div>

          {/* Goldilocks Kickback Live Projection */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569', marginBottom: '0.25rem' }}>
              <span>Your Kiosk Pledge to {currentTwin.name}:</span>
              <strong style={{ color: '#111827' }}>${numericPledge}.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 800, color: '#059669' }}>
              <span>Projected Batch #1 Kickback to Wallet:</span>
              <span>${projectedKickbackMin} to ${projectedKickbackMax}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.4rem', lineHeight: 1.4 }}>
              * Kickback dividend calculated from 85% creator / 10% prototype royalty pool distribution upon first manufacturing batch shipment.
            </div>
          </div>

          <button
            onClick={() => handleDonate(selectedDonation === 'sub' ? '$5/mo monthly patron' : `$${selectedDonation}`)}
            disabled={isProcessing}
            style={{
              width: '100%',
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              padding: '1.1rem',
              borderRadius: '100px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(17, 24, 39, 0.2)'
            }}
          >
            {isProcessing ? 'Anchoring into Physical Tooling...' : (
              selectedDonation === 'sub' 
                ? 'Back with $5/mo Patron Kickback →' 
                : `Drop $${selectedDonation} into Kiosk →`
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#6B7280', fontSize: '0.75rem', marginTop: '1rem' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>100% direct tooling allocation. Albuquerque R&amp;D proof anchored.</span>
          </div>
        </div>

        {/* Local Albuquerque Inventor Spotlight */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#B45309', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            <MapPin size={13} /> CURRENT FOUNDING INVENTOR SPOTLIGHT · ALBUQUERQUE, NM
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
                johne.boi
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                Building <strong>TWIIZZLock™</strong> and <strong>Redr.ink™</strong> physical prototypes
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Albuquerque benchtop inventor since 2015. Every kiosk pledge buys physical raw materials: 316L surgical stainless tubing, food-safe silicone overmolds, TPU RF-welding dies, and laboratory phase-change salts.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href="/twins/twiizzlock"
              style={{
                flex: '1 1 200px',
                textAlign: 'center',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid #111827',
                color: '#111827',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem'
              }}
            >
              Inspect 3D Twin (TWIIZZLock) →
            </Link>
            <Link
              href="/@johne.boi"
              style={{
                flex: '1 1 200px',
                textAlign: 'center',
                padding: '0.65rem',
                borderRadius: '8px',
                background: '#111827',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem'
              }}
            >
              Inventor Resume (@johne.boi) →
            </Link>
          </div>
        </div>

        {/* Modal: Physical Counter Stand Mockup */}
        {showStandPreview && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '1rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowStandPreview(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase' }}>
                  THE $50 COUNTER STAND HUSTLE
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: '#111827' }}>
                  Dual-Sided Google Review Stand
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                  A win-win physical distribution hack deployed at local Albuquerque coffee shops and restaurants.
                </p>
              </div>

              {/* Dual-Sided Graphic Mockup */}
              <div style={{
                background: '#F9FAFB',
                border: '1.5px solid #E5E7EB',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {/* Side A: Restaurant Google Review */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '0.85rem 0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      SIDE A: VENUE
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.25rem' }}>
                      Google Review
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', lineHeight: 1.3 }}>
                      NFC tap gives venue a 5-star review in 2 seconds. Free for the restaurant owner ($50 saved).
                    </div>
                  </div>

                  {/* Side B: TwinThink IP Kiosk */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #10B981',
                    borderRadius: '12px',
                    padding: '0.85rem 0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      SIDE B: TWINTHINK
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.25rem' }}>
                      Round-Up Kiosk
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', lineHeight: 1.3 }}>
                      Apple Pay / QR tap-to-roundup builds monthly inventor pool &amp; earns royalty kickbacks.
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  color: '#475569',
                  lineHeight: 1.45,
                  textAlign: 'left'
                }}>
                  <strong>Why it works:</strong> Restaurant owners happily place the stand because they get free customer reviews. TwinThink gets permanent countertop real estate in high-traffic checkout lanes to capture micro-patronage!
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
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
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
