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
    name: 'Estimated Unit BOM (COGS)',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CALIBRATED':
      case 'MEASURED':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
      case 'LITERATURE':
        return { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' };
      case 'ASSUMED':
      case 'ESTIMATED':
      default:
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
    }
  };

  const badge = getStatusBadge(claim.status);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(17, 24, 39, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }} onClick={onClose}>
      
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        maxWidth: '540px',
        width: '100%',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
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
            color: '#9CA3AF',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
            CLAIM PROVENANCE
          </span>
        </div>

        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem 0', color: '#111827', fontWeight: 700 }}>
          {claim.name}
        </h2>
        
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
          {claim.value}
        </div>

        {/* Epistemic Status & Confidence Bar */}
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>
              EPISTEMIC STATE
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`
            }}>
              {claim.status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
            <span style={{ color: '#4B5563' }}>Empirical Confidence</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#111827' }}>{claim.confidence_pct}%</strong>
          </div>

          <div style={{ height: '5px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${claim.confidence_pct}%`,
              height: '100%',
              background: badge.color,
              borderRadius: '3px'
            }} />
          </div>
        </div>

        {/* Origin Explanation */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
            ORIGIN & METHODOLOGY
          </span>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#4B5563', margin: 0 }}>
            {claim.origin}
          </p>
        </div>

        {/* Supporting Evidence Artifacts */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
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
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#111827'
                }}
              >
                <FileText size={12} color="#6B7280" />
                <span>{art.name}</span>
                <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>({art.type})</span>
              </div>
            ))}
          </div>
        </div>

        {/* How to Increase Confidence */}
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '10px',
          padding: '0.875rem 1rem'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
            WHAT WOULD INCREASE CONFIDENCE?
          </span>
          <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: 1.4 }}>
            {claim.improvement_action}
          </p>
        </div>

      </div>
    </div>
  );
}
