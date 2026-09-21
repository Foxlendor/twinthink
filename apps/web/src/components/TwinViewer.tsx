'use client';

import React, { useEffect, useState } from 'react';
import styles from './TwinViewer.module.css';
import { Maximize, RotateCcw, Code, Network, FileText } from 'lucide-react';
import { TwinData } from '@/lib/types';
import { getApiUrl } from '@/lib/api';
import TwizzLockViewer from '@/components/twizzlock/TwizzLockViewer';
import RedrinkViewer from '@/components/redrink/RedrinkViewer';


interface TwinViewerProps {
  twin: TwinData;
  fallbackText?: string;
}

export default function TwinViewer({ twin, fallbackText = "No preview available" }: TwinViewerProps) {
  const [mounted, setMounted] = useState(false);
  const viewerRef = React.useRef<any>(null);

  useEffect(() => {
    // Dynamically import model-viewer on the client to avoid SSR issues
    import('@google/model-viewer').then(() => {
      setMounted(true);
    });
  }, []);

  const handleReset = () => {
    if (viewerRef.current) {
      viewerRef.current.cameraOrbit = "0deg 75deg 105%";
    }
  };

  const normId = (twin.id || '').toLowerCase();
  if (normId === 'twiizzlock' || normId === '0002') {
    return <TwizzLockViewer />;
  }
  if (normId === 'redrink' || normId === 'Redr.ink' || normId === '0003') {
    return <RedrinkViewer />;
  }
  
  const ontologyClass = twin.current_version.ontology_class;

  // 1. Physical objects only render assets explicitly approved as public previews.
  // A generic GLB is never treated as safe merely because it exists.
  if (ontologyClass === 'PhysicalObject') {
    const glbAsset = twin.current_version.assets.find(
      a => a.relative_path.toLowerCase().endsWith('.glb') &&
        a.publication_scope === 'public_preview'
    );
    const apiUrl = getApiUrl();
    const url = glbAsset ? `${apiUrl}/api/twins/${twin.id}/assets/${glbAsset.relative_path}` : undefined;
    
    if (!url) {
      return (
        <div className={styles.viewerContainer}>
          <div className={styles.emptyState}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                No public concept preview
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                A 3D asset must be explicitly approved as a public preview before it can render here.
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.viewerContainer}>
        {mounted ? (
          <div className={styles.viewerWrapper}>
            {/* Bypass TS type checking for custom element */}
            {React.createElement('model-viewer', {
              ref: viewerRef,
              src: url,
              alt: `3D Preview of ${twin.current_version.title}`,
              "camera-controls": true,
              "auto-rotate": true,
              ar: true,
              "shadow-intensity": "1",
              "environment-image": "neutral",
              exposure: "1",
              className: styles.modelViewer,
              style: { width: '100%', height: '100%', backgroundColor: '#F8FAFC' }
            }, (
              <div className={styles.controlsOverlay} slot="poster">
              </div>
            ))}
            
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              zIndex: 2,
              background: 'rgba(255,255,255,0.94)',
              border: '1px solid #E5E7EB',
              borderRadius: '999px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.66rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#166534'
            }}>
              CONCEPT PREVIEW · PUBLIC
            </div>

            <div className={styles.viewerActions}>
              <button className={styles.iconButton} onClick={handleReset} title="Reset Camera">
                <RotateCcw size={18} />
              </button>
              <button 
                className={styles.iconButton} 
                onClick={() => {
                  if (viewerRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      viewerRef.current.parentElement?.requestFullscreen();
                    }
                  }
                }}
                title="Fullscreen"
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.loadingState}>Loading 3D Viewer...</div>
        )}
      </div>
    );
  }
  
  // 2. The MetaConcept (Omega Twin)
  if (ontologyClass === 'MetaConcept') {
    return (
      <div className={styles.viewerContainer} style={{ backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', overflow: 'hidden', position: 'relative' }}>
        {/* Pulsing core effect */}
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(255,255,255,0) 70%)', animation: 'pulse 4s infinite alternate' }} />
        
        <style>{`
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 1; }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
        
        <Network size={80} color="#111827" style={{ zIndex: 1, animation: 'spin 20s linear infinite' }} />
        <h1 style={{ zIndex: 1, color: 'var(--text-primary)', marginTop: '2rem', letterSpacing: '2px', textTransform: 'uppercase' }}>{twin.current_version.title}</h1>
        <p style={{ zIndex: 1, maxWidth: '60%', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '1rem' }}>
          {twin.current_version.summary}
        </p>
        
        <div style={{ zIndex: 1, marginTop: '3rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {twin.current_version.relationships?.map((rel, i) => (
            <div key={i} style={{ padding: '1rem 2rem', background: '#FFFFFF', border: '1px solid #DDD6FE', borderRadius: '8px', fontSize: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ color: '#111827', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{rel.type}</span>
              <strong>{rel.target_twin_id}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // 3. If it's Software or a Concept, render a semantic view placeholder
  if (ontologyClass === 'Software' || ontologyClass === 'Concept') {
    return (
      <div className={styles.viewerContainer} style={{ backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        {ontologyClass === 'Software' ? <Code size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} /> : <Network size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />}
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{ontologyClass} Twin</h2>
        <p style={{ maxWidth: '60%', textAlign: 'center' }}>
          Visualizing semantic relationships and properties for <strong>{twin.current_version.title}</strong>.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {twin.current_version.relationships?.map((rel, i) => (
            <div key={i} style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{rel.type}</span> &rarr; <strong style={{ color: 'var(--text-primary)' }}>{rel.target_twin_id}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Fallback for Documents or Person etc
  return (
    <div className={styles.viewerContainer} style={{ backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#888' }}>
        <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5, margin: '0 auto' }} />
        <p>{ontologyClass} Preview not yet implemented.</p>
      </div>
    </div>
  );
}
