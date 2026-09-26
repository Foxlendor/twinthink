'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Building2, 
  Sparkles, 
  Cpu, 
  Coins, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Filter, 
  ShieldCheck, 
  Award, 
  FileText, 
  Layers, 
  ExternalLink, 
  Clock, 
  Flame, 
  Ticket, 
  Store, 
  X, 
  Send,
  Zap,
  HelpCircle,
  TrendingUp,
  GitFork
} from 'lucide-react';

interface BountyItem {
  id: string;
  sponsorName: string;
  sponsorBadge: string;
  sponsorLogoText: string;
  title: string;
  problemStatement: string;
  specifications: string[];
  rewardAmount: string;
  rewardType: 'Fixed Bounty + Dev Contract' | 'Milestone Prize Pool' | 'Tooling Grant & License';
  daysLeft: number;
  submissionsCount: number;
  category: 'Thermal & Fluid Dynamics' | 'Mechanisms & Kinematics' | 'Materials & Polymers' | 'Optics & Sensing';
  verifiedTwinRef?: string;
  winningCriteria: string;
}

export default function BountiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBountyModal, setActiveBountyModal] = useState<BountyItem | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [showPostBountyModal, setShowPostBountyModal] = useState(false);
  const [thinkTankName, setThinkTankName] = useState('');
  const [submissionTwinUrl, setSubmissionTwinUrl] = useState('');
  const [submissionPitch, setSubmissionPitch] = useState('');

  const bounties: BountyItem[] = [
    {
      id: 'bounty-intel-001',
      sponsorName: 'Intel Labs Hardware Architecture',
      sponsorBadge: 'Enterprise Sponsor',
      sponsorLogoText: 'INTC',
      title: 'Ultra-Thin Passive Microchannel Vapor Chamber (<0.6mm)',
      problemStatement: 'Current generation mobile compute envelopes require dissipating 120W+ heat flux from monolithic silicon dies without active fans or noisy pumps. Traditional sintered copper heat pipes exceed our 0.8mm z-height budget.',
      specifications: [
        'Z-Height thickness < 0.60mm across active contact plane',
        'Effective thermal conductivity > 4,500 W/m·K under 45°C-85°C delta',
        'Proof of hermetic seal reliability under 5,000 thermal cycles (-20°C to 110°C)',
        'Parametric 3D CAD (.STEP) and calibrated thermal simulation twin required'
      ],
      rewardAmount: '$75,000',
      rewardType: 'Fixed Bounty + Dev Contract',
      daysLeft: 18,
      submissionsCount: 14,
      category: 'Thermal & Fluid Dynamics',
      winningCriteria: 'Lowest simulated thermal resistance (K/W) validated against experimental benchmark dataset with verifiable BOM manufacturing cost under $4.20/unit.'
    },
    {
      id: 'bounty-dyson-002',
      sponsorName: 'Dyson Advanced Aerodynamics',
      sponsorBadge: 'Featured Corporate',
      sponsorLogoText: 'DYSN',
      title: 'Zero-Acoustic Vortex Impeller Blade with Passive Boundary Suction',
      problemStatement: 'High-RPM centrifugal impellers generate tonal blade-pass frequencies in the 1.2 kHz to 4.8 kHz hearing range. We seek a novel impeller blade geometry utilizing passive boundary layer micro-perforations to eliminate turbulent vortex shedding.',
      specifications: [
        'Acoustic SPL reduction > 4.5 dBA at 110,000 RPM compared to benchmark aluminum impeller',
        'Volumetric flow rate >= 32 L/sec at 18 kPa static pressure head',
        'Capable of single-shot PEEK injection molding or DMLS titanium additive manufacturing',
        'Open digital twin with stress tensor analysis and kinematic balancing graph'
      ],
      rewardAmount: '$50,000',
      rewardType: 'Milestone Prize Pool',
      daysLeft: 27,
      submissionsCount: 9,
      category: 'Mechanisms & Kinematics',
      winningCriteria: 'Best noise-to-pressure ratio evaluated on digital twin flow simulation, followed by physical wind tunnel validation at Wiltshire labs.'
    },
    {
      id: 'bounty-3m-003',
      sponsorName: '3M Advanced Materials R&D',
      sponsorBadge: 'Materials Partner',
      sponsorLogoText: '3M',
      title: 'Food-Safe Thermally Reversible Adhesive for Closed-Loop Beverage Vessels',
      problemStatement: 'Circular economy beverage containers require hermetic seals that remain impermeable to carbonated beverages during consumer use, yet completely debond on demand at 65°C in municipal washing facilities without toxic solvent residues.',
      specifications: [
        'Burst pressure resistance > 4.5 bar at 20°C-40°C ambient temperatures',
        'Complete clean-peel debonding within 15 seconds at 65°C water bath immersion',
        'FDA 21 CFR 175.105 and EU 10/2011 food contact compliance verified',
        'Material specification sheet and cost model for high-speed continuous roll application'
      ],
      rewardAmount: '$40,000',
      rewardType: 'Tooling Grant & License',
      daysLeft: 34,
      submissionsCount: 7,
      category: 'Materials & Polymers',
      winningCriteria: 'Validated phase-transition peel strength curve submitted via TwinThink material spec graph with verified supply chain sourcing.'
    },
    {
      id: 'bounty-tesla-004',
      sponsorName: 'Tesla Energy Megapack Engineering',
      sponsorBadge: 'Grid Storage Sponsor',
      sponsorLogoText: 'TSLA',
      title: 'Passively Actuated Thermal Runaway Isolation Flap for LFP Utility Racks',
      problemStatement: 'In the rare event of battery cell overtemperature, utility storage enclosures require a purely passive (zero sensor or electrical power requirement) mechanical flap that slams shut to starve oxygen and redirect hot gases away from adjacent module strings.',
      specifications: [
        'Purely passive shape-memory alloy (SMA) or bimetallic actuator latching mechanism',
        'Trigger response time < 800ms upon gas temperature reaching 140°C',
        'Withstands 850°C direct flame front for minimum 15 minutes without structural burn-through',
        'Zero-maintenance 20-year operational lifespan in outdoor desert conditions'
      ],
      rewardAmount: '$100,000',
      rewardType: 'Fixed Bounty + Dev Contract',
      daysLeft: 12,
      submissionsCount: 21,
      category: 'Mechanisms & Kinematics',
      winningCriteria: 'Reliability under thermal cycling and failure-mode kinematic proof modeled in TwinThink physics engine.'
    }
  ];

  const filteredBounties = bounties.filter(b => {
    const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.sponsorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSubmittingThinkTank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thinkTankName.trim()) return;

    setSubmissionSuccess(`Think Tank "${thinkTankName}" has officially entered digital twin submission for "${activeBountyModal?.title}". The corporate engineering evaluation team has received your encrypted dossier.`);
    setTimeout(() => {
      setSubmissionSuccess(null);
      setActiveBountyModal(null);
      setThinkTankName('');
      setSubmissionTwinUrl('');
      setSubmissionPitch('');
    }, 4500);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#111827' }}>
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
        
        {/* Top Header & Context */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#2563EB',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <Briefcase size={13} /> CORPORATE R&amp;D CHALLENGES &amp; THINK TANKS
            </span>
            <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>
              The Indeed for Hard Engineering Problems
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontWeight: 900,
            color: '#111827',
            letterSpacing: '-0.03em',
            margin: '0 0 1rem 0',
            lineHeight: 1.15
          }}>
            Solve Industry Bounties. Backed by Real Capital.
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#4B5563',
            maxWidth: '820px',
            lineHeight: 1.6,
            margin: 0
          }}>
            Corporations like Intel, Dyson, and 3M post their hardest mechanical, thermal, and materials bottlenecks on TwinThink. Independent inventors and multidisciplinary think-tanks submit verified digital twins. Corporate engineering teams evaluate every solution, pick the winning design, and fund the bounty.
          </p>
        </div>

        {/* The 3 Pillars of Invention Funding on TwinThink */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          color: '#FFFFFF',
          marginBottom: '3rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#10B981',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-mono)'
          }}>
            THE TWINTHINK CAPITAL PROTOCOL
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem 0', letterSpacing: '-0.02em' }}>
            Three Paths to Real Invention Funding
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* Pillar 1 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ background: '#3B82F6', color: '#FFF', borderRadius: '50%', width: '24px', height: '24px', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 900 }}>1</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Direct Crowdfunding</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                Peer-to-peer micro-backing and the <strong>Goldilocks Zone</strong>. Backers pledge $5-$25 towards prototype tooling and receive pro-rata retail royalty kickbacks back into their wallet when products ship.
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#60A5FA', fontWeight: 700 }}>
                100% Free Public Viewing · Goldilocks Kickbacks
              </div>
            </div>

            {/* Pillar 2 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid #10B981',
              borderRadius: '16px',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '14px',
                background: '#10B981',
                color: '#064E3B',
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                Current Hub
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ background: '#10B981', color: '#064E3B', borderRadius: '50%', width: '24px', height: '24px', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 900 }}>2</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF' }}>Corporate R&amp;D Bounties</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#E5E7EB', margin: 0, lineHeight: 1.5 }}>
                Enterprises post high-stakes engineering bottlenecks instead of hiring costly internal R&amp;D divisions. Multidisciplinary think tanks submit digital twins. Winner takes the escrowed funding.
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#34D399', fontWeight: 700 }}>
                $30k to $100k Bounties · Think-Tank Collaboration
              </div>
            </div>

            {/* Pillar 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ background: '#F59E0B', color: '#FFF', borderRadius: '50%', width: '24px', height: '24px', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 900 }}>3</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>POS Roundups &amp; Monthly Pool</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                Countertop QR review stands deployed across local coffee shops and restaurants. Spare change from Apple Pay tap-to-pay builds a monthly grant pool awarded by lottery ticket to an active hardware inventor.
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                <Link href="/roundup" style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 700, textDecoration: 'none' }}>
                  Explore Counter Stand &amp; Monthly Pool →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            padding: '0.5rem 0.85rem',
            flex: '1 1 300px',
            maxWidth: '460px'
          }}>
            <Search size={16} color="#9CA3AF" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text"
              placeholder="Search problem, company, or physics domain..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.875rem',
                color: '#111827',
                background: 'transparent'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Post Bounty Button */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowPostBountyModal(true)}
              style={{
                background: '#111827',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Building2 size={16} />
              Post Corporate Problem ($ Escrow)
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          {['All', 'Thermal & Fluid Dynamics', 'Mechanisms & Kinematics', 'Materials & Polymers'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? '#111827' : '#FFFFFF',
                color: selectedCategory === cat ? '#FFFFFF' : '#4B5563',
                border: `1px solid ${selectedCategory === cat ? '#111827' : '#E5E7EB'}`,
                borderRadius: '999px',
                padding: '0.4rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bounty Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredBounties.map(bounty => (
            <div 
              key={bounty.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '20px',
                padding: '1.75rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563EB';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#1E293B'
                    }}>
                      {bounty.sponsorLogoText}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{bounty.sponsorName}</span>
                        <span style={{ fontSize: '0.65rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {bounty.sponsorBadge}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0.2rem 0 0 0' }}>
                        {bounty.title}
                      </h2>
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
                      {bounty.rewardAmount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600 }}>
                      {bounty.rewardType}
                    </div>
                  </div>
                </div>

                {/* Problem Statement */}
                <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                  {bounty.problemStatement}
                </p>

                {/* Core Specifications */}
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #F3F4F6',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                    Key Engineering Specifications Required:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.4rem' }}>
                    {bounty.specifications.slice(0, 3).map((spec, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Action Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #F3F4F6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.78rem', color: '#6B7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} color="#9CA3AF" />
                    <strong>{bounty.daysLeft} days</strong> left to submit
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} color="#9CA3AF" />
                    <strong>{bounty.submissionsCount} Think Tanks</strong> competing
                  </span>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                    {bounty.category}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setActiveBountyModal(bounty)}
                    style={{
                      background: '#111827',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.6rem 1.15rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    Assemble Think Tank &amp; Submit Twin
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Submit Think Tank Digital Twin Solution */}
        {activeBountyModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 120,
            padding: '1rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '600px',
              width: '100%',
              padding: '2.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <button
                onClick={() => setActiveBountyModal(null)}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563EB', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                <Sparkles size={14} /> SUBMIT TO {activeBountyModal.sponsorName}
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
                {activeBountyModal.title}
              </h2>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                  {activeBountyModal.rewardAmount}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                  escrowed for winning Digital Twin submission
                </span>
              </div>

              {submissionSuccess ? (
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  color: '#065F46',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle2 size={24} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>Digital Twin Submission Recorded</div>
                    <div>{submissionSuccess}</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmittingThinkTank}>
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.8rem',
                    color: '#475569',
                    lineHeight: 1.45
                  }}>
                    <strong>Corporate Evaluation Rule:</strong> {activeBountyModal.winningCriteria}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                      Think Tank / Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sandia Thermal Dynamics Cohort"
                      value={thinkTankName}
                      onChange={e => setThinkTankName(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                      TwinThink Digital Twin Link or ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. /twins/twiizzlock or did:twin:johne.boi/0001"
                      value={submissionTwinUrl}
                      onChange={e => setSubmissionTwinUrl(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.25rem' }}>
                      Must contain parametric 3D CAD, hierarchical BOM, and calibrated physics simulations.
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                      Executive Engineering Summary &amp; Simulation Delta
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Explain how your CAD geometry and material selection solve the corporate bottleneck at the targeted unit cost..."
                      value={submissionPitch}
                      onChange={e => setSubmissionPitch(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#111827',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.85rem',
                      borderRadius: '100px',
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Submit Think Tank Solution to Corporate Evaluator
                    <Send size={15} />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Post Corporate Bounty */}
        {showPostBountyModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 120,
            padding: '1rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '2.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowPostBountyModal(false)}
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

              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                ENTERPRISE R&amp;D ESCROW
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
                Post an Engineering Challenge
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Hiring full-time R&amp;D engineers costs $250k+/year with uncertain outcomes. Post your bottleneck on TwinThink, escrow a targeted bounty ($10k-$250k), and let specialized independent think tanks deliver working physical digital twins.
              </p>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.8rem',
                color: '#334155',
                lineHeight: 1.5,
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: '#0F172A' }}>Enterprise Workflow:</div>
                <div>1. Deposit bounty reward into protocol escrow (Stripe or Wire).</div>
                <div>2. Specify CAD constraints, thermal/kinematic limits, and target unit cost.</div>
                <div>3. Review interactive 3D digital twins and simulation proofs in your private portal.</div>
                <div>4. Select winning team and execute IP assignment or licensing covenant.</div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  href="/pitch"
                  onClick={() => setShowPostBountyModal(false)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: '#111827',
                    color: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '100px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Contact Enterprise Desk →
                </Link>
                <button
                  onClick={() => setShowPostBountyModal(false)}
                  style={{
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '100px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
