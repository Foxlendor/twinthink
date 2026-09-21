'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Sparkles, RotateCcw, Play, CheckCircle2, ShieldCheck, Thermometer, Layers, Info } from 'lucide-react';

interface RedrinkViewerProps {
  onUnlockRequest?: () => void;
}

export default function RedrinkViewer({ onUnlockRequest }: RedrinkViewerProps) {
  const canvasWithRef = useRef<HTMLCanvasElement>(null);
  const canvasPlainRef = useRef<HTMLCanvasElement>(null);

  const [state, setState] = useState({
    inlet: 18,
    outWith: 18,
    outPlain: 18,
    heat: 1.0,
    active: false,
    crystal: 0,
    sips: 0
  });

  const triggerCartridge = () => {
    if (state.heat <= 0) return;
    setState(prev => ({
      ...prev,
      active: true,
      crystal: Math.min(1, prev.crystal + 0.22)
    }));
  };

  const sip = () => {
    setState(prev => {
      const nextSips = prev.sips + 1;
      const plainTemp = prev.inlet;

      if (!prev.active || prev.heat <= 0) {
        return {
          ...prev,
          sips: nextSips,
          outPlain: plainTemp,
          outWith: prev.inlet,
          active: prev.heat > 0 ? prev.active : false
        };
      }

      // Progressive heat release based on crystal propagation and remaining enthalpy
      const power = 14 * prev.heat * (0.35 + 0.65 * prev.crystal);
      const rawTemp = prev.inlet + power;

      // Passive mouth-temperature buffer limits drinking temperature to safe 41°C
      const limitedOut = Math.min(41, rawTemp);
      const nextHeat = Math.max(0, prev.heat - 0.035);

      return {
        ...prev,
        sips: nextSips,
        outPlain: plainTemp,
        outWith: limitedOut,
        heat: nextHeat,
        active: nextHeat > 0
      };
    });
  };

  const flow = (seconds: number) => {
    const steps = Math.max(1, Math.round(seconds / 2.5));
    for (let i = 0; i < steps; i++) {
      sip();
    }
  };

  const resetTwin = () => {
    setState({
      inlet: 18,
      outWith: 18,
      outPlain: 18,
      heat: 1.0,
      active: false,
      crystal: 0,
      sips: 0
    });
  };

  // Draw Straw Routine
  const drawStraw = (ctx: CanvasRenderingContext2D, isHeated: boolean) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.32;
    const top = 35;
    const bottom = h - 35;
    const len = bottom - top;

    // Outer translucent wall
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, bottom);
    ctx.stroke();

    // Inner lumen background
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(cx, top + 10);
    ctx.lineTo(cx, bottom - 10);
    ctx.stroke();

    // Fluid Temperature color inside lumen
    const t = isHeated ? state.outWith : state.outPlain;
    const tNorm = Math.min(1, Math.max(0, (t - 18) / 23));
    const r = Math.round(80 + 175 * tNorm);
    const g = Math.round(140 - 60 * tNorm);
    const b = Math.round(180 - 120 * tNorm);

    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(cx, top + 12);
    ctx.lineTo(cx, bottom - 12);
    ctx.stroke();

    // Cartridge Zone (only on the modular Redr.ink straw)
    if (isHeated) {
      const cartTop = top + len * 0.36;
      const cartH = len * 0.32;

      // Cartridge boundary
      ctx.fillStyle = state.active 
        ? `rgba(249, 115, 22, ${0.25 + 0.5 * state.heat})` 
        : 'rgba(100, 116, 139, 0.35)';
      ctx.fillRect(cx - 30, cartTop, 60, cartH);

      // Exothermic crystal wave visualization
      if (state.active && state.crystal > 0) {
        const waveH = cartH * state.crystal;
        ctx.fillStyle = `rgba(255, 215, 130, ${0.55 * state.heat})`;
        ctx.fillRect(cx - 30, cartTop + cartH - waveH, 60, waveH);
      }

      ctx.strokeStyle = state.active ? '#F97316' : '#64748B';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 30, cartTop, 60, cartH);

      // Cartridge Label
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('Modular Cartridge', cx + 42, cartTop + cartH * 0.45);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(state.active ? 'Crystallizing (Exothermic)' : 'Supercooled Sol', cx + 42, cartTop + cartH * 0.45 + 14);

      // Mouthpiece Limiter
      ctx.fillStyle = '#10B981';
      ctx.fillRect(cx - 15, top + 15, 30, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillText('Limiter (41°C)', cx + 42, top + 26);
    }

    // Anatomical labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('Mouthpiece', cx + 42, top + 8);
    ctx.fillText('Drink Inlet', cx + 42, bottom);
  };

  useEffect(() => {
    if (canvasWithRef.current) {
      const ctx = canvasWithRef.current.getContext('2d');
      if (ctx) drawStraw(ctx, true);
    }
    if (canvasPlainRef.current) {
      const ctx = canvasPlainRef.current.getContext('2d');
      if (ctx) drawStraw(ctx, false);
    }
  }, [state]);

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.3px' }}>
              Redr.ink™ Twin
            </h2>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase' }}>
              Simulation Mode
            </span>
          </div>
          <div style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Interactive dual-tube comparative thermal model with passive mouth-temperature limiter.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '0.35rem 0.75rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} /> Differentiated Patent Art
          </span>
        </div>
      </div>

      {/* Dual Canvas Stage */}
      <div 
        className="redrink-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
      }}>
        {/* Left: Redr.ink */}
        <div style={{
          background: '#0F172A',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #1E293B',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F97316', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={15} /> With Redr.ink Modular Cartridge
            </span>
            <span style={{ fontSize: '0.7rem', color: state.active ? '#34D399' : '#94A3B8', fontFamily: 'var(--font-mono)' }}>
              {state.active ? 'ACTIVE REHEAT' : 'READY'}
            </span>
          </div>
          <canvas ref={canvasWithRef} width={380} height={280} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px', background: '#090D16' }} />
        </div>

        {/* Right: Plain Control */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #E2E8F0',
          color: '#0F172A'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>
              Plain Unheated Straw (Control)
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
              NO HEAT TRANSFER
            </span>
          </div>
          <canvas ref={canvasPlainRef} width={380} height={280} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px', background: '#F1F5F9' }} />
        </div>
      </div>

      {/* Interactive Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <button
          onClick={triggerCartridge}
          disabled={state.heat <= 0}
          style={{
            background: state.heat <= 0 ? '#9CA3AF' : '#F97316',
            color: '#FFFFFF',
            border: 'none',
            padding: '0.65rem 1.15rem',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: state.heat <= 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
          }}
        >
          <Flame size={15} /> Trigger Cartridge Snap-Disc
        </button>

        <button
          onClick={sip}
          style={{
            background: '#111827',
            color: '#FFFFFF',
            border: 'none',
            padding: '0.65rem 1.15rem',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Sip Once
        </button>

        <button
          onClick={() => flow(15)}
          style={{
            background: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            padding: '0.65rem 1.15rem',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          +15s Continuous Flow
        </button>

        <button
          onClick={resetTwin}
          style={{
            background: 'transparent',
            color: '#6B7280',
            border: '1px solid #D1D5DB',
            padding: '0.65rem 1rem',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <RotateCcw size={14} /> Boil &amp; Reset Cartridge
        </button>
      </div>

      {/* Real-time Telemetry Stats Grid */}
      <div 
        className="redrink-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.75rem'
      }}>
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Inlet Liquid</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)' }}>{state.inlet} °C</div>
        </div>

        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#1D4ED8', textTransform: 'uppercase', fontWeight: 700 }}>Mouthpiece (Redr.ink)</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1D4ED8', fontFamily: 'var(--font-mono)' }}>{Math.round(state.outWith)} °C</div>
          <div style={{ fontSize: '0.65rem', color: '#2563EB' }}>Limiter active (41° max)</div>
        </div>

        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Outlet (Plain)</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>{state.outPlain} °C</div>
        </div>

        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Latent Enthalpy</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)' }}>{Math.round(state.heat * 100)}%</div>
        </div>

        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Sips Drawn</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)' }}>{state.sips}</div>
        </div>

        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Cartridge</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: state.heat <= 0 ? '#DC2626' : (state.active ? '#D97706' : '#059669'), marginTop: '0.2rem' }}>
            {state.heat <= 0 ? 'Spent' : (state.active ? 'Active' : 'Ready')}
          </div>
        </div>
      </div>

      {/* Specifications & Prior Art Differentiation Callout */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '1.25rem',
        fontSize: '0.85rem',
        lineHeight: 1.6,
        color: '#475569'
      }}>
        <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <Info size={16} color="#3B82F6" />
          Prior Art Differentiation &amp; Invention Claims:
        </div>
        <div>
          Unlike basic monolithic heating straws (e.g. 2013 Chinese utility patent CN203762794U which dumps all thermal energy instantaneously and scalds at 50°C+), 
          <strong> Redr.ink™</strong> introduces three critical mechanical innovations:
        </div>
        <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
          <li><strong>Modular Snap-In Slug:</strong> The user boils only the removable 25g cartridge to reset, keeping the drinking straw permanent and dishwasher safe.</li>
          <li><strong>Progressive Crystallization Geometry:</strong> Internal micro-baffles meter the crystallization speed across 8–12 sips rather than an immediate solid plug.</li>
          <li><strong>Passive Mouth-Temp Limiter:</strong> A calibrated silicone buffer zone limits mouth contact liquid to 41°C max, preventing lip and throat burns.</li>
        </ul>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 500px) {
          .redrink-stage {
            grid-template-columns: 1fr !important;
          }
          .redrink-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}
