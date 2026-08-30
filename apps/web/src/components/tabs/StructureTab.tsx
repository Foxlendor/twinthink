'use client';

import React from 'react';
import styles from './Tabs.module.css';
import { Download, Layers, ShieldCheck, Box } from 'lucide-react';

interface StructureTabProps {
  twinId: string;
  stepDownloadUrl?: string;
  onInspectClaim: (claimKey: string) => void;
}

export default function StructureTab({ twinId, stepDownloadUrl, onInspectClaim }: StructureTabProps) {
  const bomItems = [
    {
      part: '316L Stainless Conduit',
      spec: '6.0mm ID × 7.0mm OD × 220mm (Food-Contact)',
      material: '316L Stainless Steel',
      qty: 1,
      cost: '$1.20',
      total: '$1.20',
      supplier: 'McMaster-Carr #8988K42'
    },
    {
      part: 'Sodium Acetate Trihydrate (SAT)',
      spec: '50g sealed supersaturated aqueous charge',
      material: 'NaC2H3O2 · 3H2O',
      qty: 1,
      cost: '$0.65',
      total: '$0.65',
      supplier: 'Bulk Chemical Source #SAT-50G-PRO'
    },
    {
      part: 'Bistable Snap-Disc Trigger',
      spec: '0.15mm thickness × 12mm dia. tactile disc',
      material: '301 Full-Hard Stainless',
      qty: 1,
      cost: '$0.35',
      total: '$0.35',
      supplier: 'Precision Stamping #SNAP-301-12'
    },
    {
      part: 'Thermochromic Insulation Jacket',
      spec: '1.5mm wall overmold (Orange status shift)',
      material: 'Food-Grade Silicone',
      qty: 1,
      cost: '$0.85',
      total: '$0.85',
      supplier: 'Silicone Molding #SIL-JKT-120'
    },
    {
      part: 'Hermetic End Caps & O-Rings',
      spec: 'Dual radial Viton chamber seals & nozzle',
      material: 'Viton / Food-Grade Poly',
      qty: 2,
      cost: '$0.725',
      total: '$1.45',
      supplier: 'CNC Prototyping #EC-VIT-02'
    }
  ];

  return (
    <div className={styles.tabContent}>
      {/* CAD / Engineering Geometry Callout */}
      <div className={styles.section} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Box size={16} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Authoritative CAD Solid Model (STEP AP214)
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Parametric multi-body solid geometry with verified wall thicknesses, fluid conduit, and chamber seals.
          </p>
        </div>

        {stepDownloadUrl && (
          <a
            href={stepDownloadUrl}
            download="primary.step"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--accent-primary)',
              color: '#000',
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Download size={14} />
            Download STEP CAD
          </a>
        )}
      </div>

      {/* Bill of Materials Table */}
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Production Bill of Materials (BOM)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              100-Unit Pilot Sourcing Run
            </span>
          </div>

          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem 0.8rem',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Total Estimated COGS</span>
            <strong style={{ fontSize: '1.125rem', color: '#00e5a3', fontFamily: 'var(--font-mono)' }}>$4.50 USD</strong>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Component</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Specification</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Material</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Unit</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {bomItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.part}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.supplier}</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{item.spec}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{item.material}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{item.qty}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{item.cost}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#00e5a3', fontFamily: 'var(--font-mono)' }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Section Geometry & Material Specifications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <div className={styles.section} style={{ margin: 0 }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Radial Annular Tolerances
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li><strong>Inner Fluid Bore:</strong> 6.0 mm ID (Optimized draw resistance)</li>
            <li><strong>Stainless Wall:</strong> 0.5 mm (Rapid thermal conduction)</li>
            <li><strong>PCM Jacket Cavity:</strong> 13.0 mm OD × 180 mm Active Length</li>
            <li><strong>Silicone Insulation:</strong> 1.5 mm Wall (Thermochromic status cue)</li>
            <li><strong>Total Exterior Diameter:</strong> 16.0 mm</li>
          </ul>
        </div>

        <div className={styles.section} style={{ margin: 0 }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Food-Contact & Compliance
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li><strong>Fluid Path:</strong> 100% Passivated 316L Stainless Steel</li>
            <li><strong>Core Seal:</strong> Dual Viton Fluoropolymer O-rings (Hermetic)</li>
            <li><strong>PCM Isolation:</strong> Zero fluid-contact risk (Secondary chamber)</li>
            <li><strong>Cleaning Protocol:</strong> Dishwasher safe / Camp-stove boil reset</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
