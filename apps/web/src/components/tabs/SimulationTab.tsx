'use client';

import React, { useState, useMemo } from 'react';
import { TwinData } from '@/lib/types';
import { Activity, Play, RotateCcw, Download, Cpu, Thermometer, Droplets, Zap } from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

interface SimParams {
  mass_sa: number;      // kg
  c_sa: number;         // J/(kg*K)
  mass_bev: number;     // kg
  c_bev: number;        // J/(kg*K)
  R_wall: number;       // K/W
  R_env: number;        // K/W
  T_sa_peak: number;    // °C
  T_inlet: number;      // °C
  T_env: number;        // °C
  sip_duration: number; // s
  sip_interval: number; // s
  peak_flow: number;    // kg/s
  time_steps: number;   // s
}

const DEFAULT_PARAMS: SimParams = {
  mass_sa: 0.05,
  c_sa: 3000,
  mass_bev: 0.02,
  c_bev: 4184,
  R_wall: 0.45,
  R_env: 2.2,
  T_sa_peak: 54.0,
  T_inlet: 5.0,
  T_env: 21.0,
  sip_duration: 3,
  sip_interval: 15,
  peak_flow: 0.006,
  time_steps: 300
};

export default function SimulationTab({ twin }: TabProps) {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);

  // Run dynamic Euler simulation on client when sliders change
  const simulationResults = useMemo(() => {
    let T_sa = params.T_sa_peak;
    let T_bev = params.T_inlet;
    const dt = 1.0;

    const times: number[] = [];
    const t_sa_arr: number[] = [];
    const t_bev_arr: number[] = [];
    const sipping_arr: boolean[] = [];
    let cumulative_energy = 0;

    for (let t = 0; t < params.time_steps; t++) {
      const time_in_cycle = t % params.sip_interval;
      const is_sipping = time_in_cycle < params.sip_duration;

      const q_to_bev = (T_sa - T_bev) / params.R_wall;
      const q_to_env = (T_sa - params.T_env) / params.R_env;
      const q_flow = is_sipping ? params.peak_flow * params.c_bev * (T_bev - params.T_inlet) : 0.0;

      const dT_sa = (-q_to_bev - q_to_env) * dt / (params.mass_sa * params.c_sa);
      const dT_bev = (q_to_bev - q_flow) * dt / (params.mass_bev * params.c_bev);

      T_sa += dT_sa;
      T_bev += dT_bev;
      cumulative_energy += q_to_bev * dt;

      times.push(t);
      t_sa_arr.push(T_sa);
      t_bev_arr.push(T_bev);
      sipping_arr.push(is_sipping);
    }

    const peak_bev = Math.max(...t_bev_arr);
    const final_sa = t_sa_arr[t_sa_arr.length - 1];

    return {
      times,
      t_sa_arr,
      t_bev_arr,
      sipping_arr,
      peak_bev,
      final_sa,
      total_energy_kj: cumulative_energy / 1000
    };
  }, [params]);

  // Generate SVG path coordinates
  const svgWidth = 700;
  const svgHeight = 260;
  const padding = 40;

  const minTemp = 0;
  const maxTemp = 60;

  const getX = (t: number) => padding + (t / params.time_steps) * (svgWidth - 2 * padding);
  const getY = (temp: number) => svgHeight - padding - ((temp - minTemp) / (maxTemp - minTemp)) * (svgHeight - 2 * padding);

  const saPath = simulationResults.t_sa_arr.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
  const bevPath = simulationResults.t_bev_arr.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');

  return (
    <div className={styles.tabContentContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Thermodynamic Digital Twin</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Multi-node lumped capacitance thermal ODE model with intermittent convective flow dynamics.
          </p>
        </div>
        <button
          className="button-secondary"
          onClick={() => setParams(DEFAULT_PARAMS)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
        >
          <RotateCcw size={14} /> Reset Model
        </button>
      </div>

      {/* Physics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff7700', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Thermometer size={16} /> Peak Beverage Temp
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {simulationResults.peak_bev.toFixed(1)}°C
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Inlet: {params.T_inlet}°C (+{(simulationResults.peak_bev - params.T_inlet).toFixed(1)}°C gain)
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a64dff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Zap size={16} /> Thermal Energy Delivered
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {simulationResults.total_energy_kj.toFixed(1)} kJ
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Cumulative heat transferred to liquid
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00cc88', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Droplets size={16} /> Sipping Dynamics
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {Math.floor(params.time_steps / params.sip_interval)} Sips
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {params.sip_duration}s draw every {params.sip_interval}s
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div style={{ background: '#0a0a0c', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Predicted Temperature Trajectory (5-Minute Discharge)
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#ff7700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff7700', display: 'inline-block' }}></span>
              Sodium Acetate Core (T_sa)
            </span>
            <span style={{ color: '#00ccff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ccff', display: 'inline-block' }}></span>
              Chamber Liquid (T_bev)
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto' }}>
          {/* Grid lines */}
          {[10, 20, 30, 40, 50].map((t) => (
            <g key={t}>
              <line x1={padding} y1={getY(t)} x2={svgWidth - padding} y2={getY(t)} stroke="#222" strokeDasharray="3 3" />
              <text x={padding - 8} y={getY(t) + 4} fill="#666" fontSize="10" textAnchor="end">{t}°C</text>
            </g>
          ))}
          {[0, 60, 120, 180, 240, 300].map((sec) => (
            <g key={sec}>
              <line x1={getX(sec)} y1={padding} x2={getX(sec)} y2={svgHeight - padding} stroke="#222" strokeDasharray="3 3" />
              <text x={getX(sec)} y={svgHeight - padding + 16} fill="#666" fontSize="10" textAnchor="middle">{sec}s</text>
            </g>
          ))}

          {/* Lines */}
          <path d={saPath} fill="none" stroke="#ff7700" strokeWidth="2.5" />
          <path d={bevPath} fill="none" stroke="#00ccff" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Physics Sliders */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Live Model Parameters & Calibration Controls</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>Sip Frequency (Interval)</span>
              <strong>{params.sip_interval} seconds</strong>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={params.sip_interval}
              onChange={(e) => setParams({ ...params, sip_interval: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>Sip Duration</span>
              <strong>{params.sip_duration} seconds</strong>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={params.sip_duration}
              onChange={(e) => setParams({ ...params, sip_duration: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>Inner Wall Thermal Resistance (R_wall)</span>
              <strong>{params.R_wall.toFixed(2)} K/W</strong>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={params.R_wall}
              onChange={(e) => setParams({ ...params, R_wall: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>Peak Sipping Flow Rate</span>
              <strong>{(params.peak_flow * 1000).toFixed(1)} mL/s</strong>
            </div>
            <input
              type="range"
              min="0.002"
              max="0.015"
              step="0.001"
              value={params.peak_flow}
              onChange={(e) => setParams({ ...params, peak_flow: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
