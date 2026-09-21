'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Clock, 
  ChevronRight, 
  Terminal, 
  HelpCircle, 
  CheckCircle2, 
  Flame, 
  Share2,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ThoughtLogEntry {
  id: string;
  timestamp: string;
  topic: string;
  phase: string;
  promptQuestion: string;
  deliberation: string;
  conclusion: string;
  parametersDecided: Array<{ label: string; value: string }>;
}

const INITIAL_LOGS: ThoughtLogEntry[] = [
  {
    id: 'log-01',
    timestamp: '2016-11-04 · R&D Brainstorm',
    topic: 'Heat Transfer Physics: Latent Heat vs. Resistive Heating',
    phase: 'Conceptual Feasibility',
    promptQuestion: 'Can battery-less phase change salts heat liquid fast enough during active drinking flow?',
    deliberation: 'Tested convective heat transfer equation q = m_dot * Cp * ΔT. At 5 mL/sec flow rate of 4°C water, raising temperature to 45°C requires ~850W of instantaneous power. Batteries that size are too heavy and dangerous to submerge in hot drinks. Sodium Acetate Trihydrate (SAT) releases 241 kJ/kg during crystallization. 50g of salt stores ~12 kJ, which provides over 14 seconds of sustained 850W thermal transfer without wires or batteries.',
    conclusion: 'Latent heat release from supercooled sodium acetate trihydrate is mathematically sufficient for instantaneous drinking temperature rise. Resistive battery heating rejected.',
    parametersDecided: [
      { label: 'Enthalpy of Fusion', value: '241 kJ/kg' },
      { label: 'Salt Charge Volume', value: '50.0 grams' },
      { label: 'Latent Capacity', value: '12.05 kJ' }
    ]
  },
  {
    id: 'log-02',
    timestamp: '2026-08-15 · Materials Selection',
    topic: 'Inner Conduit Metallurgy: 316L Stainless Steel vs Copper',
    phase: 'Structural Engineering',
    promptQuestion: 'Copper has much higher thermal conductivity than stainless steel (400 W/m·K vs 16 W/m·K). Why not use copper for the inner straw conduit?',
    deliberation: 'Copper will pit and leech toxic copper ions when exposed to acidic hot beverages like black coffee (pH 4.8) or lemon tea (pH 2.5). Nickel-plated brass also presents lead toxicity and plating flaking concerns under thermal cycling. 316L medical/food-grade stainless steel has passivated molybdenum content that resists acidic leaching completely. Because wall thickness is thin (0.4mm), conduction thermal resistance across the steel wall is only 0.025 K/W, meaning heat transfer is entirely limited by liquid-side convection, not metal conduction.',
    conclusion: '316L stainless steel selected for complete food contact safety and corrosion resistance. Thin 0.4mm wall prevents thermal conduction bottleneck.',
    parametersDecided: [
      { label: 'Material Grade', value: 'AISI 316L Stainless' },
      { label: 'Wall Thickness', value: '0.4 mm ±0.03mm' },
      { label: 'Conduit Inner Dia.', value: '6.0 mm' }
    ]
  },
  {
    id: 'log-03',
    timestamp: '2026-08-28 · Nucleation Trigger Mechanism',
    topic: 'Bistable Snap-Disc Trigger vs Chemical Seed Crystal',
    phase: 'Mechanism Prototyping',
    promptQuestion: 'How to trigger crystallization on demand without introducing foreign chemical nucleation seeds that foul the solution?',
    deliberation: 'Chemical seeds require physical injection and can only be used once. Ultrasonic or piezoelectric triggers require batteries. A convex bistable stainless steel spring disc flexed between fingers creates high localized shear stress (>10^8 Pa) and surface micro-cavitation in the supercooled salt solution. This triggers homogeneous nucleation within 1.2 seconds with zero chemical contamination.',
    conclusion: 'Machined convex bistable snap-disc integrated into bottom base. Provides satisfying tactile click and instant crystallization.',
    parametersDecided: [
      { label: 'Trigger Time', value: '< 1.2 seconds' },
      { label: 'Disc Diameter', value: '12.0 mm' },
      { label: 'Actuation Force', value: '14.5 N (Thumb Click)' }
    ]
  }
];

export default function ThoughtLogsTab() {
  const [logs] = useState<ThoughtLogEntry[]>(INITIAL_LOGS);
  const [selectedLogId, setSelectedLogId] = useState<string>(INITIAL_LOGS[0].id);

  const activeLog = logs.find(l => l.id === selectedLogId) || logs[0];

  return (
    <div style={{ maxWidth: '880px', width: '100%' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.75px',
          marginBottom: '0.4rem'
        }}>
          DEVELOPMENT TRANSCRIPTS &amp; BRAINSTORM SCRATCHPAD
        </div>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          margin: '0 0 0.5rem 0'
        }}>
          Inventor Thought Logs
        </h2>
        <p style={{
          fontSize: '0.9375rem',
          color: '#6B7280',
          margin: 0,
          lineHeight: 1.6
        }}>
          The raw lab scratchpad showing how problems were questioned, edge cases stress-tested, and engineering parameters calculated over time.
        </p>
      </div>

      {/* Main Grid: Sidebar + Selected Log Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 310px) 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Left: Log Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {logs.map(log => {
            const isSelected = log.id === selectedLogId;
            return (
              <button
                key={log.id}
                onClick={() => setSelectedLogId(log.id)}
                style={{
                  background: isSelected ? '#FFFFFF' : '#F9FAFB',
                  border: isSelected ? '2px solid #111827' : '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    {log.phase}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                    {log.id}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', lineHeight: 1.35, marginBottom: '0.35rem' }}>
                  {log.topic}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={11} /> {log.timestamp.split('·')[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Detailed Transcript Box */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
              {activeLog.timestamp}
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: 0 }}>
              {activeLog.topic}
            </h3>
          </div>

          {/* Section 1: Question */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
              Core Inquiry / Hypothesis
            </div>
            <div style={{
              background: '#F9FAFB',
              borderLeft: '3px solid #2563EB',
              padding: '0.85rem 1rem',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#1E293B',
              lineHeight: 1.5
            }}>
              &ldquo;{activeLog.promptQuestion}&rdquo;
            </div>
          </div>

          {/* Section 2: Deliberation */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
              Engineering Deliberation &amp; Edge Cases
            </div>
            <p style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: 1.65,
              margin: 0
            }}>
              {activeLog.deliberation}
            </p>
          </div>

          {/* Section 3: Conclusion */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
              Physical Spec Established
            </div>
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              fontSize: '0.875rem',
              color: '#065F46',
              lineHeight: 1.5,
              fontWeight: 600
            }}>
              {activeLog.conclusion}
            </div>
          </div>

          {/* Parameters Decided */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
              Locked Specification Values
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
              {activeLog.parametersDecided.map((param, idx) => (
                <div key={idx} style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{param.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)' }}>{param.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
