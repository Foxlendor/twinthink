'use client';

import React, { useEffect, useRef } from 'react';
import { Activity, Flame, ShieldAlert, Zap, Radio } from 'lucide-react';
import styles from './RealityEngine.module.css';

interface RealityStateProps {
  internalTempC?: number;
  heatReleaseW?: number;
  solutionState?: string;
  timeElapsed?: string;
}

export default function RealityStateHud({
  internalTempC = 52.7,
  heatReleaseW = 18.3,
  solutionState = "CRYSTALLIZING",
  timeElapsed = "03:42"
}: RealityStateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animate Radar Circle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = 24;

      // Concentric circles
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // Rotating Radar Beam
      const sweepX = cx + Math.cos(angle) * r;
      const sweepY = cy + Math.sin(angle) * r;
      ctx.strokeStyle = '#00e5a3';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Blip
      ctx.fillStyle = '#00e5a3';
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      angle += 0.04;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={styles.hudContainer}>
      {/* REALITY STATE CARD */}
      <div className={styles.realityCard}>
        <div className={styles.realityHeader}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', color: '#8892b0' }}>
            REALITY STATE (GOD'S EYE)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <canvas ref={canvasRef} width={60} height={60} className={styles.radarCanvas} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {/* Structural */}
            <div className={styles.meterRow}>
              <span className={styles.meterLabel}>STRUCTURAL</span>
              <div className={styles.meterBarContainer}>
                <div className={styles.meterFill} style={{ width: '100%', background: '#00e5a3' }} />
              </div>
              <span className={styles.meterStatus} style={{ color: '#00e5a3' }}>VERIFIED</span>
            </div>

            {/* Thermal */}
            <div className={styles.meterRow}>
              <span className={styles.meterLabel}>THERMAL</span>
              <div className={styles.meterBarContainer}>
                <div className={styles.meterFill} style={{ width: '60%', background: '#00ccff' }} />
              </div>
              <span className={styles.meterStatus} style={{ color: '#00ccff' }}>EXPERIMENTAL</span>
            </div>

            {/* Material */}
            <div className={styles.meterRow}>
              <span className={styles.meterLabel}>MATERIAL</span>
              <div className={styles.meterBarContainer}>
                <div className={styles.meterFill} style={{ width: '50%', background: '#a64dff' }} />
              </div>
              <span className={styles.meterStatus} style={{ color: '#a64dff' }}>PARTIAL</span>
            </div>

            {/* Safety */}
            <div className={styles.meterRow}>
              <span className={styles.meterLabel}>SAFETY</span>
              <div className={styles.meterBarContainer}>
                <div className={styles.meterFill} style={{ width: '30%', background: '#ffaa00' }} />
              </div>
              <span className={styles.meterStatus} style={{ color: '#ffaa00' }}>UNVALIDATED</span>
            </div>

            {/* Manufacturing */}
            <div className={styles.meterRow}>
              <span className={styles.meterLabel}>MANUFACTURING</span>
              <div className={styles.meterBarContainer}>
                <div className={styles.meterFill} style={{ width: '20%', background: '#556677' }} />
              </div>
              <span className={styles.meterStatus} style={{ color: '#8892b0' }}>CONCEPT</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE TELEMETRY TICKER */}
      <div className={styles.telemetryCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Radio size={13} color="#00e5a3" style={{ animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8892b0' }}>LIVE TELEMETRY (MODEL)</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#556677', fontFamily: 'var(--font-mono)' }}>Updated: 5 sec ago</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <div className={styles.telemetryStat}>
            <span className={styles.statLabel}>Internal Temp (°C)</span>
            <div className={styles.statValue} style={{ color: '#00ccff' }}>
              {internalTempC.toFixed(1)} <span className={styles.statSub}>RISING</span>
            </div>
            {/* Sparkline mini wave */}
            <svg viewBox="0 0 60 18" style={{ width: '100%', height: 16 }}>
              <path d="M 0 15 Q 15 12 30 7 T 60 3" fill="none" stroke="#00ccff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className={styles.telemetryStat}>
            <span className={styles.statLabel}>Heat Release (W)</span>
            <div className={styles.statValue} style={{ color: '#00e5a3' }}>
              {heatReleaseW.toFixed(1)} <span className={styles.statSub}>STEADY</span>
            </div>
            <svg viewBox="0 0 60 18" style={{ width: '100%', height: 16 }}>
              <path d="M 0 16 L 15 8 L 30 10 L 45 4 L 60 5" fill="none" stroke="#00e5a3" strokeWidth="1.5" />
            </svg>
          </div>

          <div className={styles.telemetryStat}>
            <span className={styles.statLabel}>Solution State</span>
            <div className={styles.statValue} style={{ color: '#ffaa00', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              {solutionState}
            </div>
            <span style={{ fontSize: '0.65rem', color: '#00ccff', fontWeight: 600 }}>ACTIVE NUCLEATION</span>
          </div>

          <div className={styles.telemetryStat}>
            <span className={styles.statLabel}>Time Elapsed</span>
            <div className={styles.statValue} style={{ color: '#a64dff' }}>
              {timeElapsed}
            </div>
            <svg viewBox="0 0 60 18" style={{ width: '100%', height: 16 }}>
              <path d="M 0 14 Q 20 6 40 12 T 60 4" fill="none" stroke="#a64dff" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
