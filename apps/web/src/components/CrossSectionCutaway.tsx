'use client';

import React from 'react';
import styles from './RealityEngine.module.css';

export default function CrossSectionCutaway() {
  return (
    <div className={styles.cutawayContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span className={styles.cardHeaderTitle}>CROSS-SECTION (ACTIVATED)</span>
        <span className={styles.badgeSolidState}>Mechanical Core</span>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        {/* SVG Cutaway Diagram */}
        <div style={{ width: '130px', height: '180px', position: 'relative', flexShrink: 0 }}>
          <svg viewBox="0 0 130 180" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="satActiveGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff4500" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#ff8c00" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ff4500" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="ssCoreGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8892b0" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#8892b0" />
              </linearGradient>
              <linearGradient id="outerSilGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2a3b5c" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1a263d" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Bent Straw Body Contour */}
            {/* Outer Silicone */}
            <path 
              d="M 50 170 L 50 70 Q 50 35 85 20 L 105 12" 
              fill="none" 
              stroke="url(#outerSilGrad)" 
              strokeWidth="38" 
              strokeLinecap="round" 
            />

            {/* SAT Annular PCM Chamber */}
            <path 
              d="M 50 165 L 50 70 Q 50 38 83 24 L 100 17" 
              fill="none" 
              stroke="url(#satActiveGrad)" 
              strokeWidth="26" 
              strokeLinecap="round" 
            />

            {/* Stainless Steel Fluid Wall */}
            <path 
              d="M 50 165 L 50 70 Q 50 42 80 28 L 98 20" 
              fill="none" 
              stroke="url(#ssCoreGrad)" 
              strokeWidth="14" 
              strokeLinecap="round" 
            />

            {/* Fluid Conduit Bore (Moving Drink Stream) */}
            <path 
              d="M 50 165 L 50 70 Q 50 44 78 30 L 95 23" 
              fill="none" 
              stroke="#0a101d" 
              strokeWidth="8" 
              strokeLinecap="round" 
            />

            {/* Snap Disc Trigger Icon */}
            <circle cx="50" cy="115" r="7" fill="#00e5a3" stroke="#fff" strokeWidth="1.5" />
            <path d="M 46 115 Q 50 112 54 115" stroke="#000" strokeWidth="1.5" fill="none" />

            {/* End Cap Seals */}
            <rect x="33" y="162" width="34" height="6" rx="2" fill="#556677" />
          </svg>
        </div>

        {/* Callout Pointer List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem', flex: 1 }}>
          <div className={styles.calloutItem}>
            <span className={styles.calloutDot} style={{ background: '#00e5a3' }} />
            <div>
              <strong style={{ color: '#00e5a3' }}>Metal Disc (Activated)</strong>
              <div style={{ color: '#8892b0', fontSize: '0.6875rem' }}>301 stainless bistable spring disc</div>
            </div>
          </div>

          <div className={styles.calloutItem}>
            <span className={styles.calloutDot} style={{ background: '#00ccff' }} />
            <div>
              <strong style={{ color: '#00ccff' }}>Outer Silicone Layer</strong>
              <div style={{ color: '#8892b0', fontSize: '0.6875rem' }}>Thermochromic thermal insulation</div>
            </div>
          </div>

          <div className={styles.calloutItem}>
            <span className={styles.calloutDot} style={{ background: '#ff8c00' }} />
            <div>
              <strong style={{ color: '#ff8c00' }}>Sodium Acetate Chamber</strong>
              <div style={{ color: '#8892b0', fontSize: '0.6875rem' }}>50g SAT latent enthalpy core (54°C)</div>
            </div>
          </div>

          <div className={styles.calloutItem}>
            <span className={styles.calloutDot} style={{ background: '#e2e8f0' }} />
            <div>
              <strong style={{ color: '#e2e8f0' }}>Drink Channel (Inner Bore)</strong>
              <div style={{ color: '#8892b0', fontSize: '0.6875rem' }}>316L Food-contact central conduit</div>
            </div>
          </div>

          <div className={styles.calloutItem}>
            <span className={styles.calloutDot} style={{ background: '#8892b0' }} />
            <div>
              <strong style={{ color: '#8892b0' }}>Seal Barrier</strong>
              <div style={{ color: '#8892b0', fontSize: '0.6875rem' }}>Hermetic Viton compression rings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
