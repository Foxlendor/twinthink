'use client';

import React, { useState } from 'react';
import { TwinData } from '@/lib/types';
import { GitFork, ArrowDown, Sparkles, Sliders, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from './Tabs.module.css';

interface LineageTabProps {
  twin: TwinData;
}

export default function LineageTab({ twin }: LineageTabProps) {
  // Mutation Simulator state
  const [pcmMassG, setPcmMassG] = useState<number>(50);
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(0.5);
  const [insulationWallMm, setInsulationWallMm] = useState<number>(1.5);
  const [simulated, setSimulated] = useState<boolean>(false);

  // Computed simulation deltas
  const baselineEnthalpy = 12.05; // kJ
  const baselineWeight = 45.0; // g
  const baselineCost = 4.50; // USD

  const mutatedEnthalpy = (pcmMassG * 0.241).toFixed(2);
  const deltaEnthalpy = ((Number(mutatedEnthalpy) - baselineEnthalpy) / baselineEnthalpy * 100).toFixed(1);
  
  const mutatedWeight = (30 + pcmMassG * 0.3).toFixed(1);
  const deltaWeight = ((Number(mutatedWeight) - baselineWeight) / baselineWeight * 100).toFixed(1);

  const mutatedCost = (4.50 + (pcmMassG - 50) * 0.013 + (wallThicknessMm - 0.5) * 0.4).toFixed(2);

  return (
    <div className={styles.tabContent}>
      {/* Concept Lineage Header */}
      <div style={{
        background: '#131824',
        border: '1px solid #1f293d',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <GitFork size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            IDEATION LINEAGE & FORK ENGINE
          </span>
        </div>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
          Where Did This Idea Come From, and What Can It Become?
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Every digital twin records its genetic lineage. Fork this baseline to mutate physical parameters, run the ODE simulation on the new physics matrix, and produce a child revision.
        </p>
      </div>

      {/* Lineage Tree Visualization */}
      <div className={styles.section} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0' }}>
        
        {/* Ancestor Concept Node */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.875rem 1.5rem',
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CONCEPT ANCESTOR (2016)</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Phase Change Beverage Reheating Calorimeter</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Benchtop glass rig with supersaturated sodium acetate core</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.75rem 0' }}>
          <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
          <div style={{
            padding: '0.35rem 0.8rem',
            background: 'rgba(0, 102, 255, 0.1)',
            border: '1px dashed var(--accent-primary)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-mono)'
          }}>
            + INVENTIONS JOURNAL MUTATION (2021): Annular Conduit + Snap-Disc Trigger
          </div>
          <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
          <ArrowDown size={14} color="var(--text-muted)" style={{ marginTop: '-4px' }} />
        </div>

        {/* Current Canonical Twin Node */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 229, 163, 0.1) 100%)',
          border: '2px solid var(--accent-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 2rem',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 0 30px rgba(0, 102, 255, 0.15)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00e5a3', letterSpacing: '0.5px' }}>CURRENT CANONICAL SPECIMEN</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            RESIP™ — Twin #0001 (Outdoor Edition)
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            50g SAT Core • 316L Food-Grade Conduit • $4.50 BOM • Calibrated ODE Engine
          </div>
        </div>

      </div>

      {/* Interactive Fork & Parameter Mutation Simulator */}
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fork & Re-Simulate Mutation Engine
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Evaluate parameter mutations before generating child Twin #0002
            </span>
          </div>

          <button
            onClick={() => setSimulated(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#00e5a3',
              color: '#000',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Play size={14} fill="#000" />
            Run Fork Simulation
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          {/* Sliders */}
          <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>PCM Core Mass</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{pcmMassG} g</strong>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                step={5}
                value={pcmMassG}
                onChange={(e) => { setPcmMassG(Number(e.target.value)); setSimulated(true); }}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span>30g (Ultralight)</span>
                <span>50g (Baseline)</span>
                <span>100g (Expedition)</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Inner Conduit Wall (316L)</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{wallThicknessMm} mm</strong>
              </div>
              <input
                type="range"
                min={0.3}
                max={1.2}
                step={0.1}
                value={wallThicknessMm}
                onChange={(e) => { setWallThicknessMm(Number(e.target.value)); setSimulated(true); }}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span>0.3mm (High Flux)</span>
                <span>0.5mm (Baseline)</span>
                <span>1.2mm (Heavy Duty)</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Silicone Outer Insulation</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{insulationWallMm} mm</strong>
              </div>
              <input
                type="range"
                min={1.0}
                max={3.0}
                step={0.25}
                value={insulationWallMm}
                onChange={(e) => { setInsulationWallMm(Number(e.target.value)); setSimulated(true); }}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span>1.0mm (Slim)</span>
                <span>1.5mm (Baseline)</span>
                <span>3.0mm (Alpine Insulated)</span>
              </div>
            </div>

          </div>

          {/* Mutation Impact Radar */}
          <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Projected Genetic Deltas vs Baseline
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Latent Enthalpy Yield</span>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#00e5a3', fontSize: '0.9375rem' }}>{mutatedEnthalpy} kJ</strong>
                    <span style={{ fontSize: '0.7rem', color: Number(deltaEnthalpy) >= 0 ? '#00e5a3' : '#ff5555', marginLeft: '0.4rem' }}>
                      ({Number(deltaEnthalpy) >= 0 ? `+${deltaEnthalpy}` : deltaEnthalpy}%)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Assembly Mass</span>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{mutatedWeight} g</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                      ({Number(deltaWeight) >= 0 ? `+${deltaWeight}` : deltaWeight}%)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Estimated Unit COGS</span>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>${mutatedCost} USD</strong>
                  </div>
                </div>

              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#131824', borderRadius: 'var(--radius-sm)', border: '1px solid #1f293d' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '0.2rem' }}>
                READY TO SPAWN CHILD REVISION
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                This mutation can be packaged into a standalone digital twin bundle preserving ancestor provenance.
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
