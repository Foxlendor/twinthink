'use client';

import React, { useState } from 'react';
import { TwinData } from '@/lib/types';
import { CheckCircle, Camera, Wrench, ShieldCheck, ZoomIn, X, Clock, User } from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

interface BuildPhotoItem {
  id: string;
  filename: string;
  title: string;
  stage: string;
  date: string;
  operator: string;
  status: 'verified' | 'in_progress';
  description: string;
  specs: string[];
}

const INVENTOR_BUILD_PHOTOS: BuildPhotoItem[] = [
  {
    id: 'build-01',
    filename: '/builds/5ae0881d-73ce-47f7-9140-08eb5a136ccf.jpg',
    title: 'Benchtop Prototyping & Nucleation Trigger Setup',
    stage: 'Phase 1: Physical Trigger Assembly',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Instrumenting the bistable stainless steel spring snap-disc into the sealed sodium acetate jacket for manual exothermic crystallization triggering.',
    specs: ['301 Full-Hard Stainless Spring Disc', '50g Analytical Sodium Acetate Trihydrate', 'Hermetic Seal Ring']
  },
  {
    id: 'build-02',
    filename: '/builds/208ea1a2-820f-40c1-8a34-7123342714aa.jpg',
    title: 'Exothermic Latent Heat Crystallization Verification',
    stage: 'Phase 2: Thermal Yield Testing',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Instantaneous liquid-to-solid phase transition at 54.0°C. Verified 12.05 kJ latent heat release with K-type surface contact probe.',
    specs: ['T_peak: 54.0°C', 'Latent plateau duration: 190s', 'Zero battery/electrical input']
  },
  {
    id: 'build-03',
    filename: '/builds/5fc3a429-8c83-4088-86ac-eae6484d59d6.jpg',
    title: 'Food-Grade 316L Conduit Tube & Internal Chamber',
    stage: 'Phase 3: Core Fluidics Assembly',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Precision 316L stainless steel central conduit tube (6mm ID x 7mm OD). Food-contact safe with conductive wall boundary layer.',
    specs: ['6mm ID / 7mm OD', '316L Stainless Steel', 'Food-contact passivation']
  },
  {
    id: 'build-04',
    filename: '/builds/e1686fcf-d69a-4eb0-803d-59133249da95.jpg',
    title: 'Silicone Thermal Jacket & End-Cap Hermetic Sealing',
    stage: 'Phase 4: Outer Insulation & Ergonomics',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Outer medical-grade silicone sleeve installation with tactile grip ribbing and dual Viton O-ring hermetic retention caps.',
    specs: ['1.5mm wall silicone insulation', 'R_env: 2.20 K/W', 'Thermochromic status cue']
  },
  {
    id: 'build-05',
    filename: '/builds/22689ddc-8da1-4c25-8e0c-ce9420ead2df.jpg',
    title: 'Instrumented Dual-Thermocouple Flow Bench Rig',
    stage: 'Phase 5: Telemetry Calibration Rig',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Calibration flow bench setup measuring inlet fluid temp (T3), chamber wall (T2), and stream outlet (T4) during controlled sip cycles.',
    specs: ['Dual K-type thermocouples', 'Logged via microcontroller @ 10Hz', 'RMSE 1.6°C model correlation']
  },
  {
    id: 'build-06',
    filename: '/builds/5e87b16c-6c85-42f2-9534-ff5eacea8738.jpg',
    title: 'Camp Stove Boiling Water Reset Cycle Test',
    stage: 'Phase 6: Backcountry Reusability',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Recharging the crystallized sodium acetate matrix in boiling water over a camping burner. Complete liquefaction achieved in 8.5 minutes.',
    specs: ['Boil reset time: 8.5 min', 'Sub-freezing supercooling stability', '100% reusable cycle']
  },
  {
    id: 'build-07',
    filename: '/builds/7b631f0f-82d0-4150-a817-d009012ad0a2.jpg',
    title: 'Final Outdoor Prototyping Assembly',
    stage: 'Phase 7: Integrated Field Prototype',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Fully assembled Resip™ Outdoor Edition straw ready for cold backcountry trail validation and user testing.',
    specs: ['Total Weight: 45g', 'BOM Cost: $4.50 USD', 'Solid-State & Battery-Free']
  },
  {
    id: 'build-08',
    filename: '/builds/9f90df24-99e9-45be-94bd-a7b4d6b0bfce.jpg',
    title: 'Component Fit & Tolerance Bench Inspection',
    stage: 'Phase 8: Tolerance Verification',
    date: 'August 2026',
    operator: '@Foxlendor (Creator)',
    status: 'verified',
    description: 'Micrometer inspection of concentricity between outer silicone jacket and inner 316L conduit tube.',
    specs: ['Radial tolerance: ±0.08mm', 'Non-pressurized fluid seal', 'Ready for batch production']
  }
];

export default function BuildsTab({ twin }: TabProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<BuildPhotoItem | null>(null);

  return (
    <div className={styles.tabContentContainer}>
      
      {/* Header & Verification Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Inventor's Physical Build Evidence</h2>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              background: 'rgba(0, 229, 163, 0.15)',
              color: '#00e5a3',
              border: '1px solid rgba(0, 229, 163, 0.3)'
            }}>
              8 VERIFIED PHYSICAL BUILDS
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Real-world photographic log documenting the benchtop assembly, crystallization testing, and hardware prototyping process.
          </p>
        </div>
      </div>

      {/* Grid of Real Inventor Photos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {INVENTOR_BUILD_PHOTOS.map((item) => (
          <div 
            key={item.id}
            onClick={() => setSelectedPhoto(item)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, border-color 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            {/* Image Preview */}
            <div style={{ position: 'relative', width: '100%', height: '180px', background: '#0a0a0c', overflow: 'hidden' }}>
              <img 
                src={item.filename} 
                alt={item.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                color: '#fff',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <ZoomIn size={12} /> Inspect
              </div>
              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                background: 'rgba(0, 229, 163, 0.9)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '3px',
                padding: '0.15rem 0.4rem'
              }}>
                VERIFIED BENCH EVIDENCE
              </div>
            </div>

            {/* Info Card */}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  {item.stage}
                </span>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{item.operator}</span>
                <span>{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Modal Inspector */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setSelectedPhoto(null)}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            maxWidth: '850px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', maxHeight: '480px', background: '#000', textAlign: 'center' }}>
              <img 
                src={selectedPhoto.filename} 
                alt={selectedPhoto.title} 
                style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain' }}
              />
              <button 
                onClick={() => setSelectedPhoto(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {selectedPhoto.stage}
                  </span>
                  <h2 style={{ fontSize: '1.25rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                    {selectedPhoto.title}
                  </h2>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(0, 229, 163, 0.15)',
                  color: '#00e5a3',
                  border: '1px solid rgba(0, 229, 163, 0.3)'
                }}>
                  VERIFIED HARDWARE
                </span>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {selectedPhoto.description}
              </p>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                  Hardware Specs & Test Parameters:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedPhoto.specs.map((s, idx) => (
                    <span key={idx} style={{
                      fontSize: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
