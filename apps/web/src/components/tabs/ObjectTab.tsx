'use client';

import React from 'react';
import TwinViewer from '../TwinViewer';
import { TwinData } from '@/lib/types';
import { ChevronRight, ArrowRight, HelpCircle } from 'lucide-react';

interface ObjectTabProps {
  twin: TwinData;
  onInspectClaim?: (claimKey: string) => void;
}

export default function ObjectTab({ twin, onInspectClaim }: ObjectTabProps) {
  const realityScores = [
    { label: 'Structural Geometry', status: 'Verified', color: '#10B981' },
    { label: 'Thermal Dynamics', status: 'Experimental', color: '#F59E0B' },
    { label: 'Material Provenance', status: 'Partial', color: '#F59E0B' },
    { label: 'Empirical Evidence', status: 'Benchtop Calibrated', color: '#10B981' },
    { label: 'Manufacturing Ready', status: 'Pilot BOM ($4.50)', color: '#EF4444' }
  ];

  return (
    <div style={{ maxWidth: '840px', width: '100%' }}>
      
      {/* Section Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.75px',
          marginBottom: '0.4rem'
        }}>
          OBJECT
        </div>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          margin: '0 0 0.4rem 0'
        }}>
          What is it?
        </h2>
        <p style={{
          fontSize: '0.9375rem',
          color: '#6B7280',
          margin: 0
        }}>
          Resip is a reusable thermal drink straw designed to warm beverages on-demand using sodium acetate phase-change heat.
        </p>
      </div>

      {/* 3D Model / Visual Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
            Interactive 3D Assembly
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
            preview.glb
          </span>
        </div>

        <div style={{
          height: '320px',
          background: '#F9FAFB',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <TwinViewer twin={twin} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#6B7280',
          marginTop: '0.75rem'
        }}>
          <span>Central 316L Core</span>
          <span>SAT Exothermic Matrix</span>
          <span>Silicone Outer Sleeve</span>
        </div>
      </div>

      {/* Traceable Claims Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 1rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Core Physical Properties
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          
          <div
            onClick={() => onInspectClaim && onInspectClaim('peak_core_temp')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Activation Temp</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)' }}>54.0 °C</div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.35rem' }}>Literature (NIST)</div>
          </div>

          <div
            onClick={() => onInspectClaim && onInspectClaim('latent_heat_release')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Enthalpy Capacity</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)' }}>12.05 kJ</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.35rem' }}>Calibrated (ODE)</div>
          </div>

          <div
            onClick={() => onInspectClaim && onInspectClaim('estimated_bom_usd')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Unit BOM (COGS)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)' }}>$4.50 USD</div>
            <div style={{ fontSize: '0.7rem', color: '#3B82F6', marginTop: '0.35rem' }}>Measured (Suppliers)</div>
          </div>

          <div
            onClick={() => onInspectClaim && onInspectClaim('target_retail_msrp')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Target Retail (MSRP)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)' }}>$25.00 USD</div>
            <div style={{ fontSize: '0.7rem', color: '#F59E0B', marginTop: '0.35rem' }}>Estimated (Margin)</div>
          </div>

        </div>
      </div>

    </div>
  );
}
