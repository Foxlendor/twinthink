'use client';

import React, { useEffect, useState } from 'react';
import styles from './TwinViewer.module.css';
import { Maximize, RotateCcw } from 'lucide-react';

interface TwinViewerProps {
  url?: string;
  fallbackText?: string;
}

export default function TwinViewer({ url, fallbackText = "No 3D preview available" }: TwinViewerProps) {
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
          {/* @ts-ignore - model-viewer is a custom element */}
          <model-viewer
            ref={viewerRef}
            src={url}
            alt="3D Preview of Twin"
            camera-controls
            auto-rotate
            ar
            shadow-intensity="1"
            environment-image="neutral"
            exposure="1"
            className={styles.modelViewer}
            style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}
          >
            <div className={styles.controlsOverlay} slot="poster">
              {/* Custom loading state could go here */}
            </div>
          </model-viewer>
          
          <div className={styles.viewerActions}>
            <button className={styles.iconButton} onClick={handleReset} title="Reset Camera">
              <RotateCcw size={18} />
            </button>
            <button 
              className={styles.iconButton} 
              onClick={() => {
                if (viewerRef.current) {
                  // Basic fullscreen toggle for the container
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
