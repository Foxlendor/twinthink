'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Flame, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  ExternalLink, 
  Mail, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  X, 
  ArrowRight,
  Heart,
  Cpu,
  Coffee,
  KeyRound
} from 'lucide-react';

interface CreatorProfileProps {
  params: Promise<{ creator: string }>;
}

export default function CreatorProfilePage({ params }: CreatorProfileProps) {
  const [resolvedCreator, setResolvedCreator] = useState<string>('john');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'notebooks' | 'about'>('portfolio');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSubTier, setSelectedSubTier] = useState<'patron' | 'insider'>('patron');
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryCompany, setInquiryCompany] = useState('');
  const [inquiryType, setInquiryType] = useState('license');
  const [inquiryMessage, setInquiryMessage] = useState('');

  React.useEffect(() => {
    params.then(p => {
      const clean = (p.creator || 'john').replace(/^@/, '');
      setResolvedCreator(clean);
    });
  }, [params]);

  const displayName = resolvedCreator.toLowerCase() === 'john' || resolvedCreator.toLowerCase() === 'coinceit' 
    ? "John Thompson" 
    : `@${resolvedCreator}`;

  const portfolioProjects = [
    {
      id: "0001",
      title: "RESIP™",
      tagline: "Self-heating drink straw for backcountry recreation",
      stage: "Prototype / Evidence-Backed",
      stageColor: "#059669",
      stageBg: "#ECFDF5",
      stageBorder: "#A7F3D0",
      cogs: "$1.38",
      keyMetric: "54.0°C Plateau",
      tested: "4 Verified ScienceFair Tests",
      image: "/resip/208ea1a2-820f-40c1-8a34-7123342714aa.jpg",
      link: "/twins/0001",
      verified: true
    },
    {
      id: "0002",
      title: "BubbleBlock",
      tagline: "Modular phase-change insulation tile with micro-encapsulated salt",
      stage: "Experimental (Testing)",
      stageColor: "#D97706",
      stageBg: "#FFFBEB",
      stageBorder: "#FDE68A",
      cogs: "$2.10",
      keyMetric: "R-6.8 Equivalent",
      tested: "Bench Calibration Pending",
      image: "/resip/5fc3a429-8c83-4088-86ac-eae6484d59d6.jpg",
      link: "/twins/0001?tab=structure",
      verified: false
    },
    {
      id: "0003",
      title: "FerroPen Stylus",
      tagline: "Micro-ferrofluid tactile pressure stylus for frictionless drafting",
      stage: "Conceptual (Notebook Archive)",
      stageColor: "#4B5563",
      stageBg: "#F3F4F6",
      stageBorder: "#E5E7EB",
      cogs: "Est. $0.95",
      keyMetric: "Analog Hall Sensing",
      tested: "2016 Concept Note",
      image: "/journal/003-1-e1628076904523.png",
      link: "/archive",
      verified: false
    }
  ];

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySuccess("Inquiry dispatched directly to the creator. You will receive engineering specs within 24 hours.");
    setShowLicenseModal(false);
    setTimeout(() => setInquirySuccess(null), 6000);
  };

  const handleSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tierName = selectedSubTier === 'patron' ? '$5/mo Notebook Patron' : '$15/mo Lab Insider';
    setSubSuccess(`Subscribed to ${displayName} as a ${tierName}! Welcome to the inner circle.`);
    setShowSubModal(false);
    setTimeout(() => setSubSuccess(null), 6000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#111827' }}>
      <Navbar />

      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
        
        {/* Notification Banners */}
        {subSuccess && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{subSuccess}</span>
          </div>
        )}
        {inquirySuccess && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
            <CheckCircle2 size={18} color="#2563EB" />
            <span>{inquirySuccess}</span>
          </div>
        )}

        {/* 1. Creator Header / Resume Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.75rem'
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Creator Avatar */}
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.25rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '3px solid #FFFFFF'
              }}>
                JT
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.75px', margin: 0, color: '#111827' }}>
                    {displayName}
                  </h1>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <ShieldCheck size={13} /> VERIFIED INVENTOR
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={15} /> Albuquerque, New Mexico
                  </span>
                  <span>•</span>
                  <span>Independent Physical Hardware &amp; Thermodynamics</span>
                  <span>•</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111827' }}>
                    twinth.ink/@{resolvedCreator}
                  </span>
                </div>

                <p style={{ fontSize: '0.9375rem', color: '#4B5563', margin: 0, lineHeight: 1.55, maxWidth: '620px' }}>
                  Turning raw mental sketches into durable, verifiable digital twins. Focused on passive exothermic phase-change chemistry, bistable snap-disc triggers, and passivated food-contact metallurgy.
                </p>
              </div>
            </div>

            {/* Action Buttons (Patreon Subscribe & LinkedIn Hire) */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Sparkles size={16} /> Subscribe ($5/mo)
              </button>

              <button
                onClick={() => setShowLicenseModal(true)}
                style={{
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '1.5px solid #111827',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '100px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Briefcase size={16} /> License / Hire
              </button>
            </div>
          </div>

          {/* Focus Areas Badges */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginRight: '0.5rem' }}>
                Expertise:
              </span>
              {['Thermodynamics', 'Phase-Change Salts (SAT)', 'Bistable Spring Discs', '316L Stainless Fabrication', 'DPP 2027 Compliance'].map(tag => (
                <span key={tag} style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Backer & Verification Stats */}
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem' }}>
              <div><strong style={{ color: '#111827', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>3</strong> <span style={{ color: '#6B7280' }}>Twins</span></div>
              <div><strong style={{ color: '#111827', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>48</strong> <span style={{ color: '#6B7280' }}>Active Backers</span></div>
              <div><strong style={{ color: '#059669', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>100%</strong> <span style={{ color: '#6B7280' }}>Evidence-Backed</span></div>
            </div>
          </div>
        </div>

        {/* 2. Portfolio / Intellectual Resume Section */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem 0' }}>
              Invention Pipeline &amp; Verified Specimen Portfolio
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>
              Physical digital twins preserving complete cognitive lineage from 2016 laboratory sketches to manufactured hardware.
            </p>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {portfolioProjects.map(proj => (
            <div
              key={proj.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ height: '180px', position: 'relative', overflow: 'hidden', background: '#F3F4F6' }}>
                <img
                  src={proj.image}
                  alt={proj.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '0.75rem',
                  background: proj.stageBg,
                  color: proj.stageColor,
                  border: `1px solid ${proj.stageBorder}`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  {proj.stage}
                </div>
              </div>

              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.4rem 0' }}>
                  {proj.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                  {proj.tagline}
                </p>

                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #F3F4F6',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: '#6B7280', display: 'block' }}>Unit COGS</span>
                    <strong style={{ color: '#111827', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{proj.cogs}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280', display: 'block' }}>Key Metric</span>
                    <strong style={{ color: '#111827', fontSize: '0.9rem' }}>{proj.keyMetric}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                    ✓ {proj.tested}
                  </span>
                  <Link
                    href={proj.link}
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: '#111827',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    View Twin →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Subscription Tiers Section (Patreon Model) */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 2.5rem auto' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#B45309',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              fontFamily: 'var(--font-mono)'
            }}>
              PATRON &amp; BRAIN SUBSCRIPTION
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0.5rem 0' }}>
              Subscribe to the Inventor&apos;s Mind
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              Back the human behind the machine. Monthly subscriptions fund raw materials, CNC machining hours, and laboratory chemicals in exchange for insider engineering access.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* $5 Tier */}
            <div style={{
              border: '1.5px solid #E5E7EB',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                $5 <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6B7280' }}>/ month</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
                Notebook Patron
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                For curious thinkers and supporters who want to follow raw ideas as they form in the workshop.
              </p>

              <ul style={{ margin: '0 0 1.5rem 0', paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#4B5563', lineHeight: 1.8 }}>
                <li>Weekly scans of raw handwritten invention notebooks</li>
                <li>Behind-the-scenes bench failure logs &amp; phase change notes</li>
                <li>Early access to new specimen drops before public release</li>
                <li>Supporter badge on all living twin revision ledgers</li>
              </ul>

              <button
                onClick={() => {
                  setSelectedSubTier('patron');
                  setShowSubModal(true);
                }}
                style={{
                  marginTop: 'auto',
                  background: '#F3F4F6',
                  color: '#111827',
                  border: '1px solid #D1D5DB',
                  padding: '0.75rem',
                  borderRadius: '100px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Join Notebook Patron ($5/mo)
              </button>
            </div>

            {/* $15 Tier */}
            <div style={{
              border: '2px solid #111827',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '16px',
                background: '#111827',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                letterSpacing: '0.5px'
              }}>
                MOST POPULAR
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                $15 <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6B7280' }}>/ month</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
                Lab Insider
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                For engineers, makers, and commercial partners who want source code, CAD, and voting rights on new machines.
              </p>

              <ul style={{ margin: '0 0 1.5rem 0', paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#374151', lineHeight: 1.8 }}>
                <li><strong>Everything in $5 tier</strong> plus full 3D .STEP CAD models</li>
                <li>Unmasked BOM supplier quotes and volume discount sheets</li>
                <li>Raw thermocouple telemetry CSV downloads</li>
                <li>Voting power on Generation N+1 alloy forks &amp; tooling priorities</li>
              </ul>

              <button
                onClick={() => {
                  setSelectedSubTier('insider');
                  setShowSubModal(true);
                }}
                style={{
                  marginTop: 'auto',
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '100px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Join Lab Insider ($15/mo)
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Subscribe */}
        {showSubModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowSubModal(false)}>
            <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowSubModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Subscribe to {displayName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Selected Tier: <strong>{selectedSubTier === 'patron' ? '$5/mo Notebook Patron' : '$15/mo Lab Insider'}</strong>
              </p>
              <form onSubmit={handleSubSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Your Name</label>
                  <input type="text" required placeholder="Patron Name" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                  <input type="email" required placeholder="name@domain.com" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ width: '100%', background: '#111827', color: '#FFFFFF', border: 'none', padding: '0.85rem', borderRadius: '100px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Confirm Monthly Subscription →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: License / Hire Drawer */}
        {showLicenseModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowLicenseModal(false)}>
            <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '2.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLicenseModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Briefcase size={16} /> Commercial Licensing &amp; R&amp;D
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Collaborate with {displayName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Direct commercial channel for manufacturing partners, outdoor brands, angel syndicates, or hardware teams looking to license RESIP or hire John for contract R&amp;D.
              </p>

              <form onSubmit={handleInquirySubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Your Name *</label>
                    <input type="text" required value={inquiryName} onChange={e => setInquiryName(e.target.value)} placeholder="Jane Doe" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Company / Entity</label>
                    <input type="text" value={inquiryCompany} onChange={e => setInquiryCompany(e.target.value)} placeholder="Apex Outdoors" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Inquiry Type</label>
                  <select value={inquiryType} onChange={e => setInquiryType(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }}>
                    <option value="license">IP Licensing (RESIP™ Technology)</option>
                    <option value="manufacturing">Contract Manufacturing / Tooling Run</option>
                    <option value="hire">Hire for Physical Hardware R&amp;D</option>
                    <option value="angel">Angel Investment / Commercial Syndicate</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Project Scope / Inquiry Details</label>
                  <textarea rows={3} required value={inquiryMessage} onChange={e => setInquiryMessage(e.target.value)} placeholder="Brief description of your intended application, volume targets, or consulting needs..." style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>

                <button type="submit" style={{ width: '100%', background: '#111827', color: '#FFFFFF', border: 'none', padding: '0.85rem', borderRadius: '100px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Submit Inquiry to Creator →
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
