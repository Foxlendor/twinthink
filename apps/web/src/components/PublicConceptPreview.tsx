'use client';

import React from 'react';
import { LockKeyhole, ShieldCheck, MousePointer2 } from 'lucide-react';
import { TwinData } from '@/lib/types';
import TwinViewer from './TwinViewer';
import CampaignBar from './CampaignBar';

interface PublicConceptPreviewProps {
  twin: TwinData;
  onRequestAccess?: () => void;
}

export default function PublicConceptPreview({ twin, onRequestAccess }: PublicConceptPreviewProps) {
  const disclosure = twin.current_version.disclosure;
  const callouts = disclosure?.callouts || [];
  const previewApproved = disclosure?.public_preview_approved === true;

  return (
    <section
      aria-label="Public concept preview"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '20px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 18px rgba(17,24,39,0.04)'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#166534',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '999px',
            padding: '0.3rem 0.65rem'
          }}>
            <ShieldCheck size={13} />
            CONCEPT PREVIEW · PUBLIC
          </div>
          <h2 style={{
            margin: '0.7rem 0 0.25rem',
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.4px'
          }}>
            {twin.current_version.title}
          </h2>
          <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.5, maxWidth: '650px', fontSize: '0.9rem' }}>
            {twin.current_version.summary}
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#6B7280',
          fontSize: '0.72rem',
          fontWeight: 600
        }}>
          <MousePointer2 size={14} />
          Rotate · Zoom · Inspect
        </div>
      </div>

      <div style={{
        minHeight: '480px',
        borderRadius: '16px',
        overflow: 'visible',
        background: 'transparent',
        marginBottom: '1.25rem'
      }}>
        {previewApproved ? (
          <TwinViewer twin={twin} />
        ) : (
          <div style={{
            minHeight: '360px',
            display: 'grid',
            placeItems: 'center',
            color: '#6B7280',
            textAlign: 'center',
            padding: '3rem 2rem',
            background: '#F8FAFC',
            border: '1px solid #E5E7EB',
            borderRadius: '16px'
          }}>
            <div>
              <LockKeyhole size={32} style={{ margin: '0 auto 0.75rem', color: '#9CA3AF' }} />
              <div style={{ fontWeight: 700, color: '#374151', fontSize: '1rem' }}>No public preview approved</div>
              <div style={{ fontSize: '0.825rem', marginTop: '0.35rem', color: '#6B7280', maxWidth: '380px' }}>
                The inventor has not published an open concept representation for this twin.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="concept-info-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
        gap: '1.25rem',
        marginTop: '1.25rem'
      }}>
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '14px',
          padding: '1.25rem'
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#374151',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.55rem'
          }}>
            What this shows
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: '#4B5563' }}>
            A simplified representation of the approved concept. It is intended to communicate
            the idea and major functional regions, not provide manufacturing geometry.
          </p>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '14px',
          padding: '1.25rem'
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#374151',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.55rem'
          }}>
            What stays restricted
          </div>
          <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.8rem', color: '#6B7280' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔒</span> <span>Exact manufacturing geometry</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔒</span> <span>Full BOM and supplier data</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔒</span> <span>Tolerances and production files</span>
            </div>
          </div>
        </div>
      </div>

      {callouts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '1.25rem'
        }}>
          {callouts.map((callout, index) => (
            <div key={index} style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '1.1rem 1.25rem',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '50%', 
                  background: '#EFF6FF', 
                  color: '#2563EB', 
                  fontSize: '0.72rem', 
                  fontWeight: 800 
                }}>
                  {index + 1}
                </span>
                {callout.label}
              </div>
              <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.55 }}>
                {callout.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Benchtop Prototype Batch & Tooling Crowdfund */}
      <div style={{ marginTop: '1.5rem' }}>
        <CampaignBar
          twinId={twin.id}
          twinTitle={twin.current_version?.title}
          targetMsrp={
            typeof twin.current_version?.properties?.find(p => p.key?.includes('msrp'))?.value === 'number'
              ? (twin.current_version.properties.find(p => p.key.includes('msrp'))!.value as number)
              : 25
          }
        />
      </div>

      <div style={{
        padding: '1rem',
        borderRadius: '12px',
        background: '#F8FAFC',
        border: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontWeight: 750, fontSize: '0.85rem' }}>Need the engineering package?</div>
          <div style={{ color: '#6B7280', fontSize: '0.76rem', marginTop: '0.2rem' }}>
            Technical access is controlled by inventor consent and the applicable agreement.
          </div>
        </div>
        <button
          onClick={onRequestAccess}
          style={{
            background: '#111827',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '999px',
            padding: '0.65rem 1rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Request Technical Access
        </button>
      </div>

      {disclosure?.public_note && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#9CA3AF' }}>
          {disclosure.public_note}
        </div>
      )}
    </section>
  );
}
