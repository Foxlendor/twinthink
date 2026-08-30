'use client';

import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Download, Box } from 'lucide-react';
import ClaimInspectorModal from '../ClaimInspectorModal';

interface StructureTabProps {
  twinId: string;
  stepDownloadUrl?: string;
  onInspectClaim?: (claimKey: string) => void;
}

export default function StructureTab({ twinId, stepDownloadUrl, onInspectClaim }: StructureTabProps) {
  const [showBomModal, setShowBomModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);

  const explodedParts = [
    {
      name: 'Silicone Body',
      desc: 'Food-grade silicone jacket',
      material: 'Silicone (Shore 40A)'
    },
    {
      name: 'Sodium Acetate Chamber',
      desc: 'Phase change heat storage',
      material: 'NaC2H3O2 · 3H2O'
    },
    {
      name: 'Metal Activation Disc',
      desc: 'Snap to start crystallization',
      material: '301 Full-Hard Stainless'
    },
    {
      name: 'Inner Fluid Conduit',
      desc: 'Transfers heat to drink channel',
      material: '316L Stainless Steel'
    },
    {
      name: 'Mouthpiece Tip',
      desc: 'Comfortable silicone tip',
      material: 'Medical-grade Silicone'
    }
  ];

  const realityDerived = [
    { label: 'Structural', status: 'Verified', color: '#10B981' },
    { label: 'Thermal', status: 'Experimental', color: '#F59E0B' },
    { label: 'Material', status: 'Partial', color: '#F59E0B' },
    { label: 'Safety', status: 'Unvalidated', color: '#EF4444' },
    { label: 'Manufacturing', status: 'Concept', color: '#EF4444' }
  ];

  return (
    <div style={{ maxWidth: '840px', width: '100%' }}>
      
      {/* Tab Section Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.75px',
          marginBottom: '0.4rem'
        }}>
          STRUCTURE
        </div>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          margin: '0 0 0.4rem 0'
        }}>
          What is it made of?
        </h2>
        <p style={{
          fontSize: '0.9375rem',
          color: '#6B7280',
          margin: 0
        }}>
          The physical components that make up RESIP™.
        </p>
      </div>

      {/* Exploded Parts Lineup Banner */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '2rem 1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          width: '100%',
          height: '180px',
          position: 'relative',
          marginBottom: '1.5rem',
          overflow: 'hidden'
        }}>
          <img
            src="/resip_exploded_parts.jpg"
            alt="RESIP™ Exploded Components"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* 5 Component Labels in Lineup */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0.75rem',
          textAlign: 'left'
        }}>
          {explodedParts.map((part, i) => (
            <div key={i}>
              <h4 style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 0.2rem 0',
                lineHeight: 1.2
              }}>
                {part.name}
              </h4>
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                margin: 0,
                lineHeight: 1.3
              }}>
                {part.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 2 Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Left Card: Drilldown List */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowBomModal(true)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #F3F4F6',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#111827',
              textAlign: 'left'
            }}
          >
            <span style={{ fontWeight: 600 }}>Component List</span>
            <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
              9 components <ChevronRight size={14} />
            </span>
          </button>

          <button
            onClick={() => setShowMaterialsModal(true)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #F3F4F6',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#111827',
              textAlign: 'left'
            }}
          >
            <span style={{ fontWeight: 600 }}>Materials</span>
            <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
              5 materials <ChevronRight size={14} />
            </span>
          </button>

          <button
            onClick={() => setShowBomModal(true)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #F3F4F6',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#111827',
              textAlign: 'left'
            }}
          >
            <span style={{ fontWeight: 600 }}>Bill of Materials</span>
            <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
              View BOM ($4.50) <ChevronRight size={14} />
            </span>
          </button>

          {stepDownloadUrl ? (
            <a
              href={stepDownloadUrl}
              download="primary.step"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                fontSize: '0.875rem',
                color: '#111827',
                textDecoration: 'none'
              }}
            >
              <span style={{ fontWeight: 600 }}>3D Model</span>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                Download STEP <Download size={14} />
              </span>
            </a>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              fontSize: '0.875rem',
              color: '#111827'
            }}>
              <span style={{ fontWeight: 600 }}>3D Model</span>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                View in 3D <ChevronRight size={14} />
              </span>
            </div>
          )}
        </div>

        {/* Right Card: Reality State Derived */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#111827',
              margin: '0 0 1rem 0'
            }}>
              Reality State (derived)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {realityDerived.map((r, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#4B5563' }}>{r.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#111827', fontWeight: 500 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.color }} />
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6' }}>
            <button
              onClick={() => onInspectClaim && onInspectClaim('estimated_bom_usd')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#111827',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0
              }}
            >
              View all details
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>

      {/* BOM Detail Modal */}
      {showBomModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(17, 24, 39, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '1.5rem'
        }} onClick={() => setShowBomModal(false)}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '620px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#111827' }}>
              Production Bill of Materials (BOM)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 1.25rem 0' }}>
              Total estimated unit COGS: <strong style={{ color: '#10B981' }}>$4.50 USD</strong> (Target MSRP: $25.00 USD)
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.5rem 0' }}>Part</th>
                  <th style={{ padding: '0.5rem 0' }}>Material</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>316L Stainless Conduit (6mm ID x 220mm)</td>
                  <td style={{ padding: '0.6rem 0', color: '#4B5563' }}>316L Stainless Steel</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>$1.20</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Sodium Acetate Trihydrate (50g Core)</td>
                  <td style={{ padding: '0.6rem 0', color: '#4B5563' }}>NaC2H3O2 · 3H2O</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>$0.65</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Bistable Snap-Disc Trigger</td>
                  <td style={{ padding: '0.6rem 0', color: '#4B5563' }}>301 Full-Hard Stainless</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>$0.35</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Thermochromic Silicone Jacket</td>
                  <td style={{ padding: '0.6rem 0', color: '#4B5563' }}>Medical Silicone</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>$0.85</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Viton End Seals & Retaining Collars</td>
                  <td style={{ padding: '0.6rem 0', color: '#4B5563' }}>Viton Fluoropolymer</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>$1.45</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => setShowBomModal(false)}
                className="button-primary"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials Modal */}
      {showMaterialsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(17, 24, 39, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '1.5rem'
        }} onClick={() => setShowMaterialsModal(false)}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: '#111827' }}>
              Material Specifications
            </h3>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.8 }}>
              <li><strong>Passivated 316L Stainless Steel:</strong> Internal food-contact fluid channel (High thermal conductivity).</li>
              <li><strong>Sodium Acetate Trihydrate (SAT):</strong> Non-toxic phase-change chemical salt (54°C transition).</li>
              <li><strong>Full-Hard 301 Stainless Spring Steel:</strong> Mechanical bistable tactile click disc.</li>
              <li><strong>Food-Grade Silicone (Shore 40A):</strong> Thermal insulating outer sleeve with color-change cue.</li>
              <li><strong>Viton Fluoropolymer O-Rings:</strong> Hermetic fluid seal rated from -20°C to 150°C.</li>
            </ul>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => setShowMaterialsModal(false)}
                className="button-primary"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
