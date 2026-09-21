'use client';

import React from 'react';
import { 
  X, 
  HelpCircle, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  ExternalLink,
  Layers,
  Cpu,
  Flame,
  Wrench,
  ShieldCheck
} from 'lucide-react';

export interface RealityDimensionDetail {
  dimensionKey: 'structural' | 'thermal' | 'material' | 'safety' | 'manufacturing' | string;
  name: string;
  status: 'Established' | 'Experimental' | 'Partially Established' | 'Unknown' | 'Conceptual' | string;
  score_pct: number;
  rationale: string;
  source_file?: string | null;
  evidence_paths?: string[];
  criteria?: string | null;
  twinId: string;
}

interface ProvenancePanelProps {
  detail: RealityDimensionDetail | null;
  onClose: () => void;
}

export default function ProvenancePanel({ detail, onClose }: ProvenancePanelProps) {
  if (!detail) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Established':
      case 'Verified':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', icon: CheckCircle2, label: 'ESTABLISHED' };
      case 'Experimental':
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', icon: Layers, label: 'EXPERIMENTAL' };
      case 'Partially Established':
      case 'Partial':
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', icon: AlertTriangle, label: 'PARTIALLY ESTABLISHED' };
      case 'Conceptual':
      case 'Concept':
        return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB', icon: HelpCircle, label: 'CONCEPTUAL' };
      case 'Unknown':
      default:
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', icon: ShieldAlert, label: 'UNKNOWN' };
    }
  };

  const badge = getStatusBadge(detail.status);
  const StatusIcon = badge.icon;

  const getDimensionIcon = (dim: string) => {
    switch (dim.toLowerCase()) {
      case 'structural':
        return Layers;
      case 'thermal':
        return Flame;
      case 'material':
        return Cpu;
      case 'safety':
        return ShieldCheck;
      case 'manufacturing':
        return Wrench;
      default:
        return HelpCircle;
    }
  };

  const DimensionIcon = getDimensionIcon(detail.dimensionKey);

  // Specific automated criteria explanation based on directive
  const getDimensionEvaluationRules = (dim: string) => {
    switch (dim.toLowerCase()) {
      case 'structural':
        return {
          law: 'CAD File Integrity + Complete BOM Vendor Links',
          verifiedRule: 'Parametric STEP CAD solid geometry verified with complete BOM supplier mappings.',
          nextTier: 'To advance: Upload full 3D STEP solid model and attach vendor catalog links for all BOM rows.'
        };
      case 'thermal':
        return {
          law: 'ODE Equations + Telemetry Residuals (RMSE <= 4.0°C)',
          verifiedRule: 'Dynamic math models validated against sensor streams with residual error <= 4.0°C.',
          nextTier: 'To advance: Run benchtop sensor test and achieve calibration RMSE <= 4.0°C.'
        };
      case 'material':
        return {
          law: 'MSDS Sheets + Food/Medical Contact Certifications',
          verifiedRule: 'Material grades cross-referenced against chemical data sheets and regulatory compliance certificates.',
          nextTier: 'To advance: Upload official supplier Material Safety Data Sheets (MSDS) or food/skin contact lab certificates.'
        };
      case 'safety':
        return {
          law: 'Physical Drop, Hydrostatic Pressure, & Biocompatibility Logs',
          verifiedRule: 'Safety remains UNKNOWN until physical drop, pressure, or skin-contact logs are uploaded.',
          nextTier: 'To advance: Upload drop test logs, 2.5 bar hydrostatic pressure records, or dermatological biocompatibility data.'
        };
      case 'manufacturing':
        return {
          law: 'Tooling Definitions (5-Axis CNC G-code, Mold Drafts)',
          verifiedRule: 'Evaluated by CNC machining paths, injection mold drafts, and production tolerances.',
          nextTier: 'To advance: Upload G-code toolpaths, injection mold CAD drafts, or supplier volume quote RFQs.'
        };
      default:
        return {
          law: 'First-Principles Engineering Evidence',
          verifiedRule: 'Strict evidence grounding with cryptographic artifact hashes.',
          nextTier: 'Upload verifiable empirical data files.'
        };
    }
  };

  const rules = getDimensionEvaluationRules(detail.dimensionKey);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          background: '#FFFFFF',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '2rem 2.25rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: '#F3F4F6',
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DimensionIcon size={20} color="#111827" />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.75px', fontFamily: 'var(--font-mono)' }}>
                WHY? PROVENANCE DRAWER
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
                {detail.name}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status & Score Banner */}
        <div style={{
          background: badge.bg,
          border: `1px solid ${badge.border}`,
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: badge.color,
              marginBottom: '0.35rem',
              letterSpacing: '0.5px'
            }}>
              <StatusIcon size={14} />
              {badge.label}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 500 }}>
              Automated Epistemic State
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: badge.color, fontFamily: 'var(--font-mono)' }}>
              {detail.score_pct}%
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
              Completeness
            </div>
          </div>
        </div>

        {/* Section 1: Grounded Rationale */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Current State Rationale
          </h4>
          <p style={{ fontSize: '0.925rem', color: '#1F2937', lineHeight: 1.55, margin: 0 }}>
            {detail.rationale}
          </p>
        </div>

        {/* Section 2: Exact Grounding Source File */}
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.75rem'
        }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.65rem' }}>
            Grounding Source Artifact
          </h4>

          {detail.source_file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '0.75rem 1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={18} color="#2563EB" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                  {detail.source_file}
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                VERIFIED SOURCE
              </span>
            </div>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontStyle: 'italic' }}>
              No primary physical artifact uploaded yet for this dimension.
            </div>
          )}

          {detail.criteria && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.785rem', color: '#4B5563', lineHeight: 1.45 }}>
              <strong>Evaluator Benchmark:</strong> {detail.criteria}
            </div>
          )}
        </div>

        {/* Section 3: Governing Engineering Law */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Automated Evaluation Law
          </h4>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#374151',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
              {rules.law}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              {rules.verifiedRule}
            </div>
          </div>
        </div>

        {/* Section 4: Advance to Next Epistemic Tier */}
        <div style={{
          marginTop: 'auto',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
            How to establish this dimension:
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#1E40AF', lineHeight: 1.5 }}>
            {rules.nextTier}
          </div>
        </div>

      </div>
    </div>
  );
}
