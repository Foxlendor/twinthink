'use client';

import React, { useState } from 'react';
import { TwinData } from '@/lib/types';
import styles from './Tabs.module.css';
import { Calendar, Camera, BookOpen, FlaskConical, ZoomIn, X, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface HistoryTabProps {
  twin: TwinData;
}

interface HistoryItem {
  id: string;
  year: string;
  era: string;
  title: string;
  category: 'LAB_BENCH' | 'JOURNAL_DRAWING' | 'SCIENCE_FAIR_2016';
  image: string;
  summary: string;
  details: string[];
}

const HISTORY_ARCHIVE: HistoryItem[] = [
  {
    id: 'resip-01',
    year: '2026',
    era: 'Current Physical Prototype',
    title: 'Benchtop Prototyping & Nucleation Snap-Disc',
    category: 'LAB_BENCH',
    image: '/resip/5ae0881d-73ce-47f7-9140-08eb5a136ccf.jpg',
    summary: 'Instrumenting the bistable 301 stainless snap-disc into the sealed sodium acetate jacket for mechanical nucleation triggering.',
    details: ['301 Full-Hard Stainless Spring Disc', '50g Analytical Sodium Acetate Trihydrate', 'Bistable mechanical click']
  },
  {
    id: 'resip-02',
    year: '2026',
    era: 'Current Physical Prototype',
    title: 'Exothermic Phase-Change Yield Verification',
    category: 'LAB_BENCH',
    image: '/resip/208ea1a2-820f-40c1-8a34-7123342714aa.jpg',
    summary: 'Instantaneous liquid-to-solid phase transition at 54.0°C. Verified 12.05 kJ latent heat release with contact thermocouple.',
    details: ['T_peak: 54.0°C', 'Latent plateau: 190s', '100% Battery-free']
  },
  {
    id: 'resip-03',
    year: '2026',
    era: 'Current Physical Prototype',
    title: 'Food-Grade 316L Conduit Tube & Seals',
    category: 'LAB_BENCH',
    image: '/resip/5fc3a429-8c83-4088-86ac-eae6484d59d6.jpg',
    summary: 'Precision 316L stainless steel central conduit tube (6mm ID x 7mm OD). Food-contact safe with conductive boundary layer.',
    details: ['6mm ID / 7mm OD', '316L Stainless Steel', 'Food-contact passivation']
  },
  {
    id: 'resip-04',
    year: '2026',
    era: 'Current Physical Prototype',
    title: 'Silicone Thermal Jacket & End-Cap Assembly',
    category: 'LAB_BENCH',
    image: '/resip/e1686fcf-d69a-4eb0-803d-59133249da95.jpg',
    summary: 'Outer medical-grade silicone sleeve with tactile grip ribbing and dual Viton O-ring hermetic retention caps.',
    details: ['1.5mm wall silicone insulation', 'R_env: 2.20 K/W', 'Thermochromic status cue']
  },
  {
    id: 'journal-01',
    year: '2021',
    era: 'Inventions Journal Era',
    title: 'Original Fluid Dynamics & Annular Heat Transfer Sketches',
    category: 'JOURNAL_DRAWING',
    image: '/history/003-1-e1628076904523.png',
    summary: 'Early invention notebook schematics detailing the concentric annular liquid core surrounded by an exothermic phase-change matrix.',
    details: ['Concentric annular heat exchanger', 'Laminar liquid flow channel', 'Enthalpy discharge calculations']
  },
  {
    id: 'journal-02',
    year: '2021',
    era: 'Inventions Journal Era',
    title: 'Mechanical Nucleation Triggers & Cavitation Studies',
    category: 'JOURNAL_DRAWING',
    image: '/history/004-e1628077057909.png',
    summary: 'Exploration of mechanical agitation, acoustic cavitation, and bistable spring discs to initiate crystallization without batteries.',
    details: ['Mechanical seed crystal release', 'Acoustic shock wave geometry', 'Bistable diaphragm action']
  },
  {
    id: 'journal-03',
    year: '2021',
    era: 'Inventions Journal Era',
    title: 'Thermal Insulation & Mouthpiece Geometry',
    category: 'JOURNAL_DRAWING',
    image: '/history/005-e1628076851640.png',
    summary: 'Cross-sectional drawings exploring dual-wall vacuum vs silicone overmolds to prevent exterior heat loss.',
    details: ['Thermal boundary layer minimization', 'Ergonomic lip guard', 'Sub-millimeter radial tolerances']
  },
  {
    id: 'sf-01',
    year: '2016',
    era: 'Science Fair Experiments',
    title: 'Thermocouple Calibration & Cooling Curves',
    category: 'SCIENCE_FAIR_2016',
    image: '/history/win_20161111_11_57_11_pro.jpg',
    summary: 'First benchtop calorimetric measurements of supersaturated sodium acetate crystallization cooling curves.',
    details: ['Calorimeter test rig', 'Supercooling stability logs', '54°C plateau validation']
  },
  {
    id: 'sf-02',
    year: '2016',
    era: 'Science Fair Experiments',
    title: 'Thermal Mass & Heat Exchange Optimization Test Sheets',
    category: 'SCIENCE_FAIR_2016',
    image: '/history/win_20161111_12_01_23_pro.jpg',
    summary: 'Empirical testing of varying fluid flow rates against PCM core mass, recorded during the 2016 regional science fair.',
    details: ['Flow velocity vs Delta T', 'Enthalpy balance sheets', 'Original empirical foundation']
  }
];

export default function HistoryTab({ twin }: HistoryTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lightboxImage, setLightboxImage] = useState<HistoryItem | null>(null);

  const filtered = selectedCategory === 'ALL'
    ? HISTORY_ARCHIVE
    : HISTORY_ARCHIVE.filter(item => item.category === selectedCategory);

  return (
    <div className={styles.tabContent}>
      {/* Historical Lineage Header */}
      <div style={{
        background: '#131824',
        border: '1px solid #1f293d',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Clock size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            EVOLUTIONARY LINEAGE & EVIDENCE ARCHIVE
          </span>
        </div>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
          From 2016 Science Fair Experiments to a Living Digital Twin
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          TwinThink is built on authentic empirical history. Browse the verified 10-year lineage of sketches, science fair notebooks, and physical workbench prototypes that substantiate Twin #0001.
        </p>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Artifacts' },
            { id: 'LAB_BENCH', label: '2026 Lab Workbench Prototyping' },
            { id: 'JOURNAL_DRAWING', label: '2021 Inventions Journal Drawings' },
            { id: 'SCIENCE_FAIR_2016', label: '2016 Science Fair Test Logs' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: selectedCategory === cat.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat.id ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Evidence Artifacts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map(item => (
          <div
            key={item.id}
            onClick={() => setLightboxImage(item)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ height: '200px', background: '#0a0d14', position: 'relative', overflow: 'hidden' }}>
              <img
                src={item.image}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(4px)',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)'
              }}>
                {item.year} • {item.era}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '0.75rem',
                right: '0.75rem',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '0.3rem',
                borderRadius: '4px',
                color: '#fff'
              }}>
                <ZoomIn size={14} />
              </div>
            </div>

            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 1rem 0', flex: 1 }}>
                {item.summary}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {item.details.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.65rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '3px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              background: '#0d1117',
              border: '1px solid #252e42',
              borderRadius: 'var(--radius-md)',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {lightboxImage.year} • {lightboxImage.era}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              {lightboxImage.title}
            </h2>

            <div style={{ background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem', textAlign: 'center' }}>
              <img
                src={lightboxImage.image}
                alt={lightboxImage.title}
                style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain' }}
              />
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              {lightboxImage.summary}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {lightboxImage.details.map((d, i) => (
                <span key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#131824', border: '1px solid #1f293d', borderRadius: '4px', color: 'var(--accent-primary)' }}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
