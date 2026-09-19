'use client';

import React from 'react';
import { LockKeyhole, ShieldCheck, MousePointer2 } from 'lucide-react';
import { TwinData } from '@/lib/types';
import TwinViewer from './TwinViewer';

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
        height: '360px',
        borderRadius: '14px',
        overflow: 'hidden',
        background: '#F8FAFC',
        border: '1px solid #F3F4F6'
      }}>
        {previewApproved ? (
          <TwinViewer twin={twin} />
        ) : (
          <div style={{
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: '#6B7280',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div>
              <LockKeyhole size={30} style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, color: '#374151' }}>No public preview approved</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                The inventor has not published a public concept representation.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 0.65fr)',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#374151',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.55rem'
          }}>
            What this shows
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.55, color: '#4B5563' }}>
            A simplified representation of the approved concept. It is intended to communicate
            the idea and major functional regions, not provide manufacturing geometry.
          </p>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#374151',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.55rem'
          }}>
            What stays restricted
          </div>
          <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.78rem', color: '#6B7280' }}>
            <div>🔒 Exact manufacturing geometry</div>
            <div>🔒 Full BOM and supplier data</div>
            <div>🔒 Tolerances and production files</div>
          </div>
        </div>
      </div>

      {callouts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginTop: '1rem'
        }}>
          {callouts.map((callout, index) => (
            <div key={index} style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ fontWeight: 750, fontSize: '0.82rem', color: '#111827' }}>
                {index + 1}. {callout.label}
              </div>
              <div style={{ marginTop: '0.3rem', fontSize: '0.76rem', color: '#6B7280', lineHeight: 1.45 }}>
                {callout.description}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '1rem',
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
