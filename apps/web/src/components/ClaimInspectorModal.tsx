'use client';

import React from 'react';
import { X, CheckCircle2, ShieldAlert, FileText, ArrowRight, ExternalLink, HelpCircle } from 'lucide-react';

export interface ClaimInfo {
  key: string;
  name: string;
  value: string;
  status: 'CALIBRATED' | 'MEASURED' | 'LITERATURE' | 'ASSUMED' | 'ESTIMATED';
  confidence_pct: number;
  origin: string;
  supported_by: Array<{ name: string; path: string; type: string }>;
  improvement_action: string;
}

export const KNOWN_CLAIMS: Record<string, ClaimInfo> = {
  estimated_bom_usd: {
    key: 'estimated_bom_usd',
    name: 'Estimated Unit BOM',
    value: '$4.50 USD',
    status: 'MEASURED',
    confidence_pct: 88,
    origin: 'Off-the-shelf component pricing from McMaster-Carr, Sigma, and precision spring stampers for 100-unit pilot run.',
    supported_by: [
      { name: 'bom.csv', path: 'bom.csv', type: 'Spreadsheet' },
      { name: 'spec.md', path: 'spec.md', type: 'Specification' }
    ],
    improvement_action: 'Obtain formal high-volume quotes (10,000+ units) from ISO-13485 silicone injection and CNC suppliers.'
  },
  peak_core_temp: {
    key: 'peak_core_temp',
    name: 'Nucleation Activation Temp (T_melt)',
    value: '54.0 °C (129.2 °F)',
    status: 'LITERATURE',
    confidence_pct: 95,
    origin: 'NIST Standard Reference Database & published trihydrate solid-liquid phase equilibrium point.',
    supported_by: [
      { name: 'simulation/pcm.py', path: 'simulation/pcm.py', type: 'ODE Engine' },
      { name: 'simulation/parameters.json', path: 'simulation/parameters.json', type: 'Parameters' },
      { name: 'testing/test-results.csv', path: 'testing/test-results.csv', type: 'Bench Test' }
    ],
    improvement_action: 'Run differential scanning calorimetry (DSC) on the specific supersaturated solution batch.'
  },
  latent_heat_release: {
    key: 'latent_heat_release',
    name: 'Latent Heat Capacity (ΔH_f)',
    value: '12.05 kJ',
    status: 'CALIBRATED',
    confidence_pct: 82,
    origin: 'Calculated from 50g mass multiplied by 241 kJ/kg enthalpy of fusion, calibrated against benchtop cooling curves.',
    supported_by: [
      { name: 'simulation/thermal.py', path: 'simulation/thermal.py', type: 'Physics Engine' },
      { name: 'testing/calibration.json', path: 'testing/calibration.json', type: 'Calibration Data' }
    ],
    improvement_action: 'Measure adiabatic thermal discharge under insulated bomb calorimeter conditions.'
  },
  weight_grams: {
    key: 'weight_grams',
    name: 'Total Straw Mass',
    value: '45.0 grams',
    status: 'MEASURED',
    confidence_pct: 92,
    origin: 'Physical prototype scale weight (220mm length with silicone sleeve and 316L core).',
    supported_by: [
      { name: 'cad/primary.step', path: 'cad/primary.step', type: 'STEP CAD' },
      { name: 'spec.md', path: 'spec.md', type: 'Specification' }
    ],
    improvement_action: 'Weigh fully filled production-sealed chamber with final Viton seals.'
  },
  pcm_core_mass: {
    key: 'pcm_core_mass',
    name: 'PCM Core Charge Mass',
    value: '50.0 grams',
    status: 'ESTIMATED',
    confidence_pct: 75,
    origin: 'Calculated from annular cavity volume in STEP CAD model assuming 1.45 g/cm³ liquid density.',
    supported_by: [
      { name: 'cad/primary.step', path: 'cad/primary.step', type: 'CAD Model' },
      { name: 'simulation/parameters.json', path: 'simulation/parameters.json', type: 'Parameters' }
    ],
    improvement_action: 'Pipette precision mass fill during prototype vacuum chamber sealing.'
  },
  target_retail_msrp: {
    key: 'target_retail_msrp',
    name: 'Target Retail Price (MSRP)',
    value: '$25.00 USD',
    status: 'ESTIMATED',
    confidence_pct: 70,
    origin: 'Retail margin analysis based on $4.50 COGS targeting outdoor recreation distribution (REI, Backcountry, DTC).',
    supported_by: [
      { name: 'spec.md', path: 'spec.md', type: 'Specification' },
      { name: 'README.md', path: 'README.md', type: 'Product Brief' }
    ],
    improvement_action: 'Conduct consumer willingness-to-pay surveys and outdoor retail buyer interviews.'
  }
};

interface ModalProps {
  claimKey: string | null;
  onClose: () => void;
  twinId: string;
}

export default function ClaimInspectorModal({ claimKey, onClose, twinId }: ModalProps) {
  if (!claimKey) return null;

  const claim = KNOWN_CLAIMS[claimKey] || {
    key: claimKey,
    name: claimKey.replace(/_/g, ' ').toUpperCase(),
    value: 'Specified Value',
    status: 'ESTIMATED' as const,
    confidence_pct: 60,
    origin: 'Derived from engineering model manifest.',
    supported_by: [{ name: 'manifest.json', path: 'manifest.json', type: 'Manifest' }],
    improvement_action: 'Perform dedicated empirical testing to establish baseline validation.'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CALIBRATED': return '#00e5a3';
      case 'MEASURED': return '#00ccff';
      case 'LITERATURE': return '#a64dff';
      case 'ASSUMED':
      case 'ESTIMATED': return '#ffaa00';
      default: return 'var(--accent-primary)';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }} onClick={onClose}>
      
      <div style={{
        background: '#0d1117',
        border: '1px solid #252e42',
        borderRadius: 'var(--radius-md)',
        maxWidth: '560px',
        width: '100%',
        padding: '1.75rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <HelpCircle size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            WHY? Claim Provenance Inspector
          </span>
        </div>

        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontWeight: 700 }}>
          {claim.name}
        </h2>
        
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
          {claim.value}
        </div>

        {/* Epistemic Status & Confidence Bar */}
        <div style={{
          background: '#131824',
          border: '1px solid #1f293d',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              EPISTEMIC STATE
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              background: `${getStatusColor(claim.status)}22`,
              color: getStatusColor(claim.status),
              border: `1px solid ${getStatusColor(claim.status)}55`
            }}>
              {claim.status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Empirical Confidence</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{claim.confidence_pct}%</strong>
          </div>

          <div style={{ height: '6px', background: '#0a0d14', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${claim.confidence_pct}%`,
              height: '100%',
              background: getStatusColor(claim.status),
              borderRadius: '3px'
            }} />
          </div>
        </div>

        {/* Origin Explanation */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
            ORIGIN & METHODOLOGY
          </span>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
            {claim.origin}
          </p>
        </div>

        {/* Supporting Evidence Artifacts */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
            SUPPORTING EVIDENCE FILES
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {claim.supported_by.map((art, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.6rem',
                  background: '#131824',
                  border: '1px solid #1f293d',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-primary)'
                }}
              >
                <FileText size={12} />
                <span>{art.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>({art.type})</span>
              </div>
            ))}
          </div>
        </div>

        {/* How to Increase Confidence */}
        <div style={{
          background: 'rgba(0, 229, 163, 0.08)',
          border: '1px solid rgba(0, 229, 163, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.875rem 1rem'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#00e5a3', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
            WHAT WOULD INCREASE CONFIDENCE?
          </span>
          <p style={{ fontSize: '0.8125rem', color: '#e6e6e6', margin: 0, lineHeight: 1.4 }}>
            {claim.improvement_action}
          </p>
        </div>

      </div>
    </div>
  );
}
