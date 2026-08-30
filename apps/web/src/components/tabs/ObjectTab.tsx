'use client';

import React from 'react';
import styles from './Tabs.module.css';
import TwinViewer from '../TwinViewer';
import { TwinData } from '@/lib/types';
import { ShieldCheck, Flame, Cpu, Compass, HelpCircle, Layers, Award } from 'lucide-react';

interface ObjectTabProps {
  twin: TwinData;
  onInspectClaim: (claimKey: string) => void;
}

export default function ObjectTab({ twin, onInspectClaim }: ObjectTabProps) {
  // Derived Reality State metrics
  const realityScores = [
    { label: 'Structural Geometry', pct: 100, status: 'VERIFIED (STEP+GLB)', color: '#00e5a3' },
    { label: 'Thermal Dynamics', pct: 85, status: 'CALIBRATED (ODE+TESTS)', color: '#00e5a3' },
    { label: 'Material Provenance', pct: 75, status: 'PARTIAL (NIST+316L)', color: '#ffaa00' },
    { label: 'Empirical Evidence', pct: 68, status: 'BENCHTOP SENSORS', color: '#ffaa00' },
    { label: 'Manufacturing Ready', pct: 35, status: 'PILOT BOM ($4.50)', color: '#ff5555' }
  ];

  return (
    <div className={styles.tabContent}>
      {/* Living Specimen Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(0, 229, 163, 0.05) 100%)',
        border: '1px solid rgba(0, 102, 255, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Award size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Twin #{twin.id} / Canonical Specimen
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            RESIP™ — Self-Heating Drink Straw (Outdoor Edition)
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Solid-state, battery-free thermal exchange straw. Releases 12.05 kJ latent crystallization enthalpy on-demand via mechanical snap-disc trigger.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.875rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Reality State</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#00e5a3', fontFamily: 'var(--font-mono)' }}>72.6%</div>
          </div>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.875rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Epistemic Grade</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>EXPERIMENTAL</div>
          </div>
        </div>
      </div>

      {/* 3D CAD Viewer + Reality Radar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* CAD Viewer Card */}
        <div className={styles.section} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Interactive 3D Assembly CAD
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>preview.glb</span>
          </div>

          <div style={{ height: '340px', background: '#070a0f', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
            <TwinViewer twin={twin} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Central 316L Core (Silver)</span>
            <span>SAT Phase-Change Core (Amber)</span>
            <span>Silicone Jacket (Slate)</span>
          </div>
        </div>

        {/* Derived Reality State Breakdown */}
        <div className={styles.section} style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Derived Reality State Score
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evidence-Weighted</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {realityScores.map((score, idx) => (
              <div key={idx} style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{score.label}</strong>
                  <span style={{ fontSize: '0.75rem', color: score.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {score.status} ({score.pct}%)
                  </span>
                </div>
                <div style={{ height: '6px', background: '#0a0d14', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${score.pct}%`, height: '100%', background: score.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 170, 0, 0.08)', border: '1px solid rgba(255, 170, 0, 0.25)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: '#ffaa00', fontWeight: 700, marginBottom: '0.2rem' }}>
              ⚠ EPISTEMIC TRANSPARENCY NOTICE
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              This digital twin distinguishes what is proven from what is simulated. Click any property to inspect its underlying evidence.
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Core Properties (With WHY? Triggers) */}
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Traceable Physical Properties (Click Any For Evidence)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
            [WHY?] Inspector Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div 
            onClick={() => onInspectClaim('peak_core_temp')}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Activation Temp</span>
              <HelpCircle size={14} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>54.0 °C</div>
            <div style={{ fontSize: '0.65rem', color: '#a64dff', fontWeight: 700, marginTop: '0.25rem' }}>LITERATURE (NIST)</div>
          </div>

          <div 
            onClick={() => onInspectClaim('latent_heat_release')}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enthalpy Capacity</span>
              <HelpCircle size={14} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>12.05 kJ</div>
            <div style={{ fontSize: '0.65rem', color: '#00e5a3', fontWeight: 700, marginTop: '0.25rem' }}>CALIBRATED (ODE)</div>
          </div>

          <div 
            onClick={() => onInspectClaim('estimated_bom_usd')}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Unit BOM</span>
              <HelpCircle size={14} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$4.50 USD</div>
            <div style={{ fontSize: '0.65rem', color: '#00ccff', fontWeight: 700, marginTop: '0.25rem' }}>MEASURED (SUPPLIERS)</div>
          </div>

          <div 
            onClick={() => onInspectClaim('target_retail_msrp')}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target MSRP</span>
              <HelpCircle size={14} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$25.00 USD</div>
            <div style={{ fontSize: '0.65rem', color: '#ffaa00', fontWeight: 700, marginTop: '0.25rem' }}>ESTIMATED (MARGIN)</div>
          </div>

        </div>
      </div>

    </div>
  );
}
