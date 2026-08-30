'use client';

import React from 'react';
import { TwinData } from '@/lib/types';
import { 
  Zap, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Compass, 
  CheckCircle2, 
  Camera, 
  RefreshCw, 
  ChevronRight,
  Droplets
} from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

const FEATURED_PHOTOS = [
  {
    src: '/builds/7b631f0f-82d0-4150-a817-d009012ad0a2.jpg',
    title: 'The Kinetic "Slide-and-Clack" Tension Prototype',
    desc: 'Dual coaxial barrels mounted over stretchy blue silicone straw. Pulling and releasing racks the barrels together like a slide-hammer to shock-nucleate the internal bladder.'
  },
  {
    src: '/builds/208ea1a2-820f-40c1-8a34-7123342714aa.jpg',
    title: 'DIY Hot Ice Supersaturation Synthesis',
    desc: 'Boiling down white vinegar + sodium bicarbonate precursors to form supersaturated sodium acetate trihydrate solution.'
  },
  {
    src: '/builds/5fc3a429-8c83-4088-86ac-eae6484d59d6.jpg',
    title: 'Bistable Spring Snap-Disc Forming',
    desc: 'Forming dome-shaped aluminum spring discs with center friction slits to serve as kinetic anvil shock triggers.'
  },
  {
    src: '/builds/22689ddc-8da1-4c25-8e0c-ce9420ead2df.jpg',
    title: 'Dual-Barrel Slide Tension Assembly',
    desc: 'Testing mechanical alignment and spring rebound force across the central silicone drinking core.'
  }
];

export default function OverviewTab({ twin }: TabProps) {
  return (
    <div className={styles.tabContentContainer}>
      
      {/* Hero Overview Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 20, 30, 0.95) 0%, rgba(8, 11, 18, 0.98) 100%)',
        border: '1px solid #1f2b40',
        borderRadius: 'var(--radius-md)',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            background: 'rgba(0, 204, 255, 0.15)',
            color: '#00ccff',
            border: '1px solid rgba(0, 204, 255, 0.3)'
          }}>
            PATENT-PENDING KINETIC MECHANISM
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>OUTDOOR & BACKCOUNTRY TRAIL EDITION</span>
        </div>

        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0.75rem 0', lineHeight: 1.3 }}>
          Resip™: The Battery-Free Kinetic Thermal Drink Straw
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0, maxWidth: '850px' }}>
          {twin.current_version.summary}
        </p>

        {/* 3 Core Value Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #162033'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Zap size={22} color="#00ccff" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.875rem', display: 'block' }}>1. Rack-to-Heat Mechanism</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.4, display: 'block', marginTop: '0.2rem' }}>
                Pull back and release the coaxial barrel like a slide-hammer. Elastic silicone snaps the barrels together, sending a kinetic shockwave into the sodium acetate bladder to initiate instant 54°C phase-change.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Flame size={22} color="#ffaa00" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.875rem', display: 'block' }}>2. Convective Heat-on-Demand</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.4, display: 'block', marginTop: '0.2rem' }}>
                Warms cold trail or river water (5°C $\rightarrow$ 20°C+) as fluid draws through the central conduit. Releases 12.05 kJ of latent enthalpy without batteries or open flame.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <RefreshCw size={22} color="#00e5a3" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.875rem', display: 'block' }}>3. Camp Stove Boil Reset</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.4, display: 'block', marginTop: '0.2rem' }}>
                Submerge in boiling water over a Jetboil or campfire for 8–10 minutes to melt the crystal matrix back to a liquid state with infinite recharge cycles.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Life Physical Inventor Process Evidence */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.125rem', margin: 0, color: 'var(--text-primary)' }}>
              Inventor Workbench Evidence Log
            </h2>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            background: 'rgba(0, 229, 163, 0.15)',
            color: '#00e5a3',
            border: '1px solid rgba(0, 229, 163, 0.3)'
          }}>
            VERIFIED PHYSICAL PROVENANCE
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          TwinThink anchors digital models in physical reality. Below is photographic evidence from the inventor's lab documenting the creation of the kinetic tension slide mechanism, supersaturation chemistry, and benchtop testing:
        </p>

        {/* Photo Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}>
          {FEATURED_PHOTOS.map((p, idx) => (
            <div key={idx} style={{
              background: '#0a0d14',
              border: '1px solid #161c2b',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden'
            }}>
              <div style={{ width: '100%', height: '160px', background: '#000', overflow: 'hidden' }}>
                <img 
                  src={p.src} 
                  alt={p.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '0.875rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                  {p.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Economics & Unit Pricing */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
          Hardware Unit Economics & Manufacturing Profile
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
          Stripping all delicate electronics and servos down to a mechanical, solid-state build creates an aggressive margin profile:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ padding: '1rem', background: '#0a0d14', borderRadius: 'var(--radius-sm)', border: '1px solid #161c2b' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Unit Bill of Materials (COGS)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>$4.50 USD</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low-part-count mechanical build</span>
          </div>

          <div style={{ padding: '1rem', background: '#0a0d14', borderRadius: 'var(--radius-sm)', border: '1px solid #161c2b' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Target Retail Price (MSRP)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00e5a3', marginTop: '0.2rem' }}>$25.00 USD</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impulse price point at REI / DTC</span>
          </div>

          <div style={{ padding: '1rem', background: '#0a0d14', borderRadius: 'var(--radius-sm)', border: '1px solid #161c2b' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gross Margin Profile</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a64dff', marginTop: '0.2rem' }}>82% DTC</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>55% Outdoor wholesale margin</span>
          </div>
        </div>
      </div>

    </div>
  );
}
