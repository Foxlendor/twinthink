'use client';

import React, { useEffect, useState } from 'react';
import styles from './TwinViewer.module.css';
import { Maximize, RotateCcw, Code, Network, FileText } from 'lucide-react';
import { TwinData } from '@/lib/types';
import { getApiUrl } from '@/lib/api';


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
  
  const ontologyClass = twin.current_version.ontology_class;

  // 1. If it's a PhysicalObject, try to render the 3D model
  if (ontologyClass === 'PhysicalObject') {
    const glbAsset = twin.current_version.assets.find(a => a.relative_path.endsWith('.glb'));
    const apiUrl = getApiUrl();
    const url = glbAsset ? `${apiUrl}/api/twins/${twin.id}/assets/${glbAsset.relative_path}` : undefined;
    
    if (!url) {
      return (
        <div className={styles.viewerContainer}>
          <div className={styles.emptyState}>{fallbackText}</div>
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
              style: { width: '100%', height: '100%', backgroundColor: '#1a1a1a' }
            }, (
              <div className={styles.controlsOverlay} slot="poster">
              </div>
            ))}
            
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
      <div className={styles.viewerContainer} style={{ backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', overflow: 'hidden', position: 'relative' }}>
        {/* Pulsing core effect */}
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,0,255,0.8) 0%, rgba(0,0,0,0) 70%)', animation: 'pulse 4s infinite alternate' }} />
        
        <style>{`
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 1; }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
        
        <Network size={80} color="#a64dff" style={{ zIndex: 1, animation: 'spin 20s linear infinite' }} />
        <h1 style={{ zIndex: 1, color: '#fff', marginTop: '2rem', letterSpacing: '4px', textTransform: 'uppercase', textShadow: '0 0 10px #a64dff' }}>{twin.current_version.title}</h1>
        <p style={{ zIndex: 1, maxWidth: '60%', textAlign: 'center', color: '#aaa', fontStyle: 'italic', marginTop: '1rem' }}>
          {twin.current_version.summary}
        </p>
        
        <div style={{ zIndex: 1, marginTop: '3rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {twin.current_version.relationships?.map((rel, i) => (
            <div key={i} style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(166,77,255,0.3)', borderRadius: '8px', fontSize: '1rem', backdropFilter: 'blur(4px)' }}>
              <span style={{ color: '#a64dff', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', display: 'block', marginBottom: '0.5rem' }}>{rel.type}</span>
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
      <div className={styles.viewerContainer} style={{ backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        {ontologyClass === 'Software' ? <Code size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} /> : <Network size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />}
        <h2 style={{ color: '#eee', marginBottom: '0.5rem' }}>{ontologyClass} Twin</h2>
        <p style={{ maxWidth: '60%', textAlign: 'center' }}>
          Visualizing semantic relationships and properties for <strong>{twin.current_version.title}</strong>.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {twin.current_version.relationships?.map((rel, i) => (
            <div key={i} style={{ padding: '0.5rem 1rem', background: '#333', borderRadius: '4px', fontSize: '0.9rem' }}>
              <span style={{ color: '#aaa' }}>{rel.type}</span> &rarr; {rel.target_twin_id}
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
