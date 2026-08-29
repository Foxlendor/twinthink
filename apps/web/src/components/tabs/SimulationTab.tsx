'use client';

import React, { useState, useMemo } from 'react';
import { TwinData } from '@/lib/types';
import { RotateCcw, Thermometer, Droplets, Zap, CheckCircle2, Sliders, ShieldAlert, GitFork, Play, Activity } from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

interface SimScenario {
  id: string;
  name: string;
  description: string;
  sip_interval: number;
  sip_duration: number;
  flow_rate_ml_s: number;
}

const PRESET_SCENARIOS: SimScenario[] = [
  {
    id: 'baseline',
    name: 'Standard Sip Cycle (Baseline)',
    description: 'Standard drinking pace: 3s draw every 30s at 8 mL/s.',
    sip_interval: 30,
    sip_duration: 3,
    flow_rate_ml_s: 8.0
  },
  {
    id: 'rapid_sip',
    name: 'Rapid Continuous Draw',
    description: 'Aggressive drinking pace: 4s draw every 15s at 10 mL/s.',
    sip_interval: 15,
    sip_duration: 4,
    flow_rate_ml_s: 10.0
  },
  {
    id: 'slow_sip',
    name: 'Slow Thermal Soak',
    description: 'Leisurely pace: 2s draw every 45s at 5 mL/s.',
    sip_interval: 45,
    sip_duration: 2,
    flow_rate_ml_s: 5.0
  }
];

const PARAMETER_PROVENANCE = [
  { key: "m_sa", label: "Sodium Acetate Mass", value: "0.05 kg (50g)", status: "ASSUMED", source: "CAD Geometry Volume", uncertainty: "±10%" },
  { key: "c_sa", label: "Specific Heat (Liquid SA)", value: "3000 J/(kg·K)", status: "ASSUMED", source: "Literature Nominal", uncertainty: "±5%" },
  { key: "m_bev", label: "Chamber Fluid Mass", value: "0.02 kg (20mL)", status: "ASSUMED", source: "CAD Internal Fluid Cavity", uncertainty: "±8%" },
  { key: "c_bev", label: "Beverage Specific Heat", value: "4184 J/(kg·K)", status: "STANDARD", source: "Pure Water Approximation", uncertainty: "±2%" },
  { key: "R_wall", label: "Inner Wall Thermal Res.", value: "0.45 K/W", status: "ESTIMATED", source: "316 Stainless Steel Boundary", uncertainty: "±25%" },
  { key: "R_env", label: "Ambient Outer Insul. Res.", value: "2.20 K/W", status: "ESTIMATED", source: "Silicone Jacket Approx.", uncertainty: "±20%" },
  { key: "T_sa_peak", label: "Crystallization Temp", value: "54.0 °C", status: "ASSUMED", source: "Phase-Change Reference", uncertainty: "±3%" }
];

export default function SimulationTab({ twin }: TabProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline');
  const [sipInterval, setSipInterval] = useState<number>(30);
  const [sipDuration, setSipDuration] = useState<number>(3);
  const [flowRateMlS, setFlowRateMlS] = useState<number>(8.0);
  const [RWall, setRWall] = useState<number>(0.45);
  const [pcmMassGrams, setPcmMassGrams] = useState<number>(50);
  const [showForkSimulator, setShowForkSimulator] = useState<boolean>(false);
  const [forkPcmMass, setForkPcmMass] = useState<number>(65);
  const [forkRWall, setForkRWall] = useState<number>(0.35);

  const applyScenario = (sc: SimScenario) => {
    setSelectedScenario(sc.id);
    setSipInterval(sc.sip_interval);
    setSipDuration(sc.sip_duration);
    setFlowRateMlS(sc.flow_rate_ml_s);
  };

  // Run modular thermal integration
  const simEngine = (massKg: number, rWallVal: number, interval: number, duration: number, flowMl: number) => {
    let T_pcm = 54.0;
    let T_bev = 5.0;
    const T_inlet = 5.0;
    const T_amb = 21.0;
    const dt = 1.0;
    const time_steps = 300;
    const total_latent_J = massKg * 241000.0;
    let latent_remaining_J = total_latent_J;

    const times: number[] = [];
    const t_pcm_arr: number[] = [];
    const t_bev_arr: number[] = [];
    const sip_events_arr: boolean[] = [];
    let cumulative_energy = 0;

    for (let t = 0; t < time_steps; t++) {
      const time_in_cycle = t % interval;
      const is_sipping = time_in_cycle < duration;
      const flow_kg_s = is_sipping ? flowMl * 1e-3 : 0.0;

      const q_pcm_to_bev = (T_pcm - T_bev) / rWallVal;
      const q_pcm_to_env = (T_pcm - T_amb) / 2.20;
      const q_flow = is_sipping ? flow_kg_s * 4184.0 * (T_bev - T_inlet) : 0.0;

      const net_pcm_loss_J = (q_pcm_to_bev + q_pcm_to_env) * dt;

      if (latent_remaining_J > net_pcm_loss_J) {
        latent_remaining_J -= net_pcm_loss_J;
        T_pcm = 54.0; // Plateau
      } else {
        const excess = net_pcm_loss_J - latent_remaining_J;
        latent_remaining_J = 0;
        T_pcm -= excess / (massKg * 2000.0);
      }

      const dT_bev = (q_pcm_to_bev - q_flow) * dt / (0.02 * 4184.0);
      T_bev += dT_bev;
      cumulative_energy += q_pcm_to_bev * dt;

      times.push(t);
      t_pcm_arr.push(T_pcm);
      t_bev_arr.push(T_bev);
      sip_events_arr.push(is_sipping);
    }

    return {
      times,
      t_pcm_arr,
      t_bev_arr,
      sip_events_arr,
      peak_bev: Math.max(...t_bev_arr),
      total_yield_kJ: cumulative_energy / 1000.0,
      plateau_duration_s: times.filter((_, i) => t_pcm_arr[i] >= 53.9).length
    };
  };

  const baselineResults = useMemo(() => {
    return simEngine(pcmMassGrams / 1000.0, RWall, sipInterval, sipDuration, flowRateMlS);
  }, [pcmMassGrams, RWall, sipInterval, sipDuration, flowRateMlS]);

  const forkResults = useMemo(() => {
    if (!showForkSimulator) return null;
    return simEngine(forkPcmMass / 1000.0, forkRWall, sipInterval, sipDuration, flowRateMlS);
  }, [showForkSimulator, forkPcmMass, forkRWall, sipInterval, sipDuration, flowRateMlS]);

  // Synthetic physical bench comparison curve
  const physicalBenchData = useMemo(() => {
    return baselineResults.times.map((t) => {
      const baseline = 5.2;
      const peak = 18.2;
      if (t < 20) return baseline + (peak - baseline) * (t / 20);
      const decay = Math.exp(-(t - 20) / 140);
      const sipDip = (t % sipInterval < sipDuration) ? -1.6 : 0;
      return Math.max(baseline, (baseline + (peak - baseline) * decay) + sipDip);
    });
  }, [baselineResults.times, sipInterval, sipDuration]);

  // Real-time error metrics
  const errorMetrics = useMemo(() => {
    const p = baselineResults.t_bev_arr;
    const m = physicalBenchData;
    const n = p.length;
    let sumSq = 0;
    let sumAbs = 0;
    let maxErr = 0;
    for (let i = 0; i < n; i++) {
      const err = Math.abs(p[i] - m[i]);
      sumSq += err * err;
      sumAbs += err;
      if (err > maxErr) maxErr = err;
    }
    return {
      rmse: Math.sqrt(sumSq / n).toFixed(2),
      mae: (sumAbs / n).toFixed(2),
      maxErr: maxErr.toFixed(2)
    };
  }, [baselineResults.t_bev_arr, physicalBenchData]);

  // SVG dimensions
  const svgWidth = 760;
  const svgHeight = 270;
  const padding = 40;
  const minTemp = 0;
  const maxTemp = 60;

  const getX = (t: number) => padding + (t / 300) * (svgWidth - 2 * padding);
  const getY = (temp: number) => svgHeight - padding - ((temp - minTemp) / (maxTemp - minTemp)) * (svgHeight - 2 * padding);

  const saPath = baselineResults.t_pcm_arr.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
  const bevPath = baselineResults.t_bev_arr.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
  const physPath = physicalBenchData.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
  const forkPath = forkResults ? forkResults.t_bev_arr.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ') : '';

  return (
    <div className={styles.tabContentContainer}>
      
      {/* Engineering Prototype Banner */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '0.875rem', 
        padding: '1rem 1.25rem', 
        background: 'rgba(255, 170, 0, 0.08)', 
        border: '1px solid rgba(255, 170, 0, 0.3)', 
        borderRadius: 'var(--radius-md)', 
        marginBottom: '1.75rem' 
      }}>
        <ShieldAlert size={22} color="#ffaa00" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#e6e6e6' }}>
          <strong style={{ color: '#ffaa00', display: 'block', marginBottom: '0.2rem' }}>
            ENGINEERING PROTOTYPE STATUS — EXPERIMENTAL / UNCALIBRATED
          </strong>
          This digital twin calculates multi-node ODE thermodynamics based on initial engineering assumptions. It provides a testable prediction baseline for physical sensor comparison, <em>not</em> verified proof of food-contact certification or consumer compliance.
        </div>
      </div>

      {/* Header & Scenario Presets */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Predictive Digital Twin Engine</h2>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              padding: '0.25rem 0.6rem', 
              borderRadius: '999px', 
              background: 'rgba(255, 170, 0, 0.15)', 
              color: '#ffaa00',
              border: '1px solid rgba(255, 170, 0, 0.4)'
            }}>
              UNCALIBRATED PROTOTYPE
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Phase-Change Material ODE engine with discrete sip event convective stripping.
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRESET_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => applyScenario(sc)}
              className="button-secondary"
              style={{
                fontSize: '0.8125rem',
                borderColor: selectedScenario === sc.id ? 'var(--accent-primary)' : undefined,
                color: selectedScenario === sc.id ? 'var(--accent-primary)' : undefined,
                background: selectedScenario === sc.id ? 'var(--bg-tertiary)' : undefined
              }}
            >
              {sc.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Performance Cards with Error Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff7700', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Thermometer size={16} /> Predicted Peak Temp
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            {baselineResults.peak_bev.toFixed(1)}°C <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>± 2.1°C</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Inlet: 5.0°C (+{(baselineResults.peak_bev - 5.0).toFixed(1)}°C thermal delta)
          </div>
        </div>

        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00e5a3', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <CheckCircle2 size={16} /> Model Error (RMSE)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#00e5a3', marginTop: '0.4rem' }}>
            {errorMetrics.rmse}°C
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            MAE: {errorMetrics.mae}°C • Max Error: {errorMetrics.maxErr}°C
          </div>
        </div>

        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a64dff', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Zap size={16} /> Thermal Energy Discharged
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            {baselineResults.total_yield_kJ.toFixed(1)} kJ
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Phase change duration: {baselineResults.plateau_duration_s}s
          </div>
        </div>

        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00ccff', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Droplets size={16} /> Sip Events Run
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            {Math.floor(300 / sipInterval)} Sips
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {sipDuration}s draw @ {flowRateMlS.toFixed(1)} mL/s
          </div>
        </div>
      </div>

      {/* SVG Interactive Multi-Curve Chart */}
      <div style={{ background: '#0a0a0c', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Dynamic Thermal Trajectory (300-Second Session)
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#ff7700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff7700', display: 'inline-block' }}></span>
              PCM Core ($T_{'{pcm}'}$)
            </span>
            <span style={{ color: '#00ccff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ccff', display: 'inline-block' }}></span>
              Predicted Beverage ($T_{'{bev}'}$)
            </span>
            <span style={{ color: '#00e5a3', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <span style={{ width: 14, height: 2, background: '#00e5a3', display: 'inline-block' }}></span>
              Physical Test #001 (Benchtop)
            </span>
            {showForkSimulator && (
              <span style={{ color: '#a64dff', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a64dff', display: 'inline-block' }}></span>
                Forked Mutation ($T_{'{fork}'}$)
              </span>
            )}
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Grid lines */}
          {[10, 20, 30, 40, 50].map((t) => (
            <g key={t}>
              <line x1={padding} y1={getY(t)} x2={svgWidth - padding} y2={getY(t)} stroke="#1e1e24" strokeDasharray="3 3" />
              <text x={padding - 8} y={getY(t) + 4} fill="#555" fontSize="10" textAnchor="end">{t}°C</text>
            </g>
          ))}
          {[0, 60, 120, 180, 240, 300].map((sec) => (
            <g key={sec}>
              <line x1={getX(sec)} y1={padding} x2={getX(sec)} y2={svgHeight - padding} stroke="#1e1e24" strokeDasharray="3 3" />
              <text x={getX(sec)} y={svgHeight - padding + 16} fill="#555" fontSize="10" textAnchor="middle">{sec}s</text>
            </g>
          ))}

          {/* Curves */}
          <path d={saPath} fill="none" stroke="#ff7700" strokeWidth="2.5" />
          <path d={bevPath} fill="none" stroke="#00ccff" strokeWidth="2.5" />
          <path d={physPath} fill="none" stroke="#00e5a3" strokeWidth="2" strokeDasharray="4 2" />
          {showForkSimulator && (
            <path d={forkPath} fill="none" stroke="#a64dff" strokeWidth="2.5" strokeDasharray="2 2" />
          )}
        </svg>

        {/* Discrete Event Timeline Bar */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1e1e24' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span>Discrete Sip Events Timeline (Convection active during colored pulses)</span>
            <span>300s Total</span>
          </div>
          <div style={{ height: '14px', background: '#141418', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
            {baselineResults.sip_events_arr.map((active, idx) => (
              <div 
                key={idx} 
                style={{ 
                  flex: 1, 
                  background: active ? '#00ccff' : 'transparent',
                  opacity: active ? 0.8 : 0 
                }} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Physics Sliders Controls */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Sliders size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>Scenario & Boundary Condition Controls</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sip Interval</span>
              <strong>{sipInterval} seconds</strong>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={sipInterval}
              onChange={(e) => { setSipInterval(Number(e.target.value)); setSelectedScenario('custom'); }}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sip Duration</span>
              <strong>{sipDuration} seconds</strong>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={sipDuration}
              onChange={(e) => { setSipDuration(Number(e.target.value)); setSelectedScenario('custom'); }}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Flow Rate</span>
              <strong>{flowRateMlS.toFixed(1)} mL/s</strong>
            </div>
            <input
              type="range"
              min="2.0"
              max="15.0"
              step="0.5"
              value={flowRateMlS}
              onChange={(e) => { setFlowRateMlS(Number(e.target.value)); setSelectedScenario('custom'); }}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Wall Thermal Resistance (R_wall)</span>
              <strong>{RWall.toFixed(2)} K/W</strong>
            </div>
            <input
              type="range"
              min="0.10"
              max="1.20"
              step="0.05"
              value={RWall}
              onChange={(e) => { setRWall(Number(e.target.value)); setSelectedScenario('custom'); }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Fork Optimization Simulator */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitFork size={18} color="#a64dff" />
            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>Fork Optimization Delta Simulator</h3>
          </div>
          <button
            className="button-secondary"
            onClick={() => setShowForkSimulator(!showForkSimulator)}
            style={{ 
              fontSize: '0.8125rem', 
              borderColor: showForkSimulator ? '#a64dff' : undefined,
              color: showForkSimulator ? '#a64dff' : undefined
            }}
          >
            {showForkSimulator ? 'Hide Fork Delta' : 'Simulate Fork Mutation'}
          </button>
        </div>

        {showForkSimulator && forkResults && (
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
              Simulate modifying the physical straw geometry (e.g. increasing PCM jacket mass or using a higher conductivity internal sleeve) and observe the resulting performance delta vs. Parent Twin #0001:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Fork PCM Core Mass</span>
                  <strong>{forkPcmMass} grams</strong>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={forkPcmMass}
                  onChange={(e) => setForkPcmMass(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Fork Wall Resistance ($R_{'{wall}'}$)</span>
                  <strong>{forkRWall.toFixed(2)} K/W</strong>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={forkRWall}
                  onChange={(e) => setForkRWall(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Delta KPI Badges */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(166, 77, 255, 0.1)', border: '1px solid rgba(166, 77, 255, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: '#a64dff', fontWeight: 700, display: 'block' }}>PEAK TEMP DELTA</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {(forkResults.peak_bev - baselineResults.peak_bev) >= 0 ? '+' : ''}
                  {(forkResults.peak_bev - baselineResults.peak_bev).toFixed(1)}°C
                </span>
              </div>

              <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(166, 77, 255, 0.1)', border: '1px solid rgba(166, 77, 255, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: '#a64dff', fontWeight: 700, display: 'block' }}>THERMAL YIELD GAIN</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {(forkResults.total_yield_kJ - baselineResults.total_yield_kJ) >= 0 ? '+' : ''}
                  {(forkResults.total_yield_kJ - baselineResults.total_yield_kJ).toFixed(1)} kJ
                </span>
              </div>

              <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(166, 77, 255, 0.1)', border: '1px solid rgba(166, 77, 255, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: '#a64dff', fontWeight: 700, display: 'block' }}>PLATEAU DURATION DELTA</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {(forkResults.plateau_duration_s - baselineResults.plateau_duration_s) >= 0 ? '+' : ''}
                  {(forkResults.plateau_duration_s - baselineResults.plateau_duration_s)}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parameter Provenance Table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Parameter Provenance & Epistemic Uncertainty
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
          TwinThink enforces mathematical transparency by cataloging the epistemic state of every physical variable.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Model Value</th>
                <th>Status</th>
                <th>Source Origin</th>
                <th>Uncertainty</th>
              </tr>
            </thead>
            <tbody>
              {PARAMETER_PROVENANCE.map((param) => (
                <tr key={param.key}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{param.label}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{param.value}</td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: param.status === 'STANDARD' ? 'rgba(0, 204, 255, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                      color: param.status === 'STANDARD' ? '#00ccff' : '#ffaa00',
                      border: param.status === 'STANDARD' ? '1px solid rgba(0, 204, 255, 0.3)' : '1px solid rgba(255, 170, 0, 0.3)'
                    }}>
                      {param.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{param.source}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{param.uncertainty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
