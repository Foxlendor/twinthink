'use client';

import React, { useState, useMemo } from 'react';
import { BookOpen, Clock, ChevronDown, ChevronRight, Sparkles, Search, Plus, CheckCircle2, AlertTriangle, ListTree, Wand2, X } from 'lucide-react';
import {
  refineQuestion,
  generateSubQuestions,
  extractVerifiableClaims,
  INVENTION_LOG_TEMPLATE,
  PATTERNS,
} from '@/lib/promptPatterns';

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
    timestamp: '2016-11-04 · Science Fair Brainstorm',
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

const ALL_PHASES = ['All', ...Array.from(new Set(INITIAL_LOGS.map(l => l.phase)))];

// ─── New Log Wizard ──────────────────────────────────────────────────────────

function NewLogWizard({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState(INVENTION_LOG_TEMPLATE);
  return (
    <div style={{
      background: '#FFFFFF', border: '2px solid #111827', borderRadius: '16px',
      padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '0.25rem' }}>
            TEMPLATE PATTERN · PLACEHOLDERS IN [BRACKETS]
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            New Thought Log
          </h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>
      <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
        Replace each <strong>[CAPITALIZED PLACEHOLDER]</strong> with your invention's specific values. Preserve the structure.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={10}
        style={{
          width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB',
          fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', lineHeight: 1.65,
          background: '#F9FAFB', resize: 'vertical'
        }}
      />
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
          Discard
        </button>
        <button style={{ background: '#111827', border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
          Save Log
        </button>
      </div>
    </div>
  );
}

// ─── Pattern Panel per Log ───────────────────────────────────────────────────

type ActivePanel = 'refine' | 'subquestions' | 'claims' | 'outline' | null;

function PatternPanel({ log, onClose }: { log: ThoughtLogEntry; onClose: () => void }) {
  const [active, setActive] = useState<ActivePanel>(null);

  const refinedQ = useMemo(() => refineQuestion(log.promptQuestion), [log.promptQuestion]);
  const subQs = useMemo(() => generateSubQuestions(log.topic), [log.topic]);
  const claims = useMemo(() => extractVerifiableClaims(log.deliberation), [log.deliberation]);
  const outlineItems = useMemo(() => [
    `1. Define the operating envelope and constraints for ${log.topic}`,
    `2. Survey existing approaches and their documented failure modes`,
    `3. Derive or look up key physical/chemical constants governing the mechanism`,
    `4. Build a quantitative feasibility model (equations + numbers)`,
    `5. Identify the 2–3 most likely failure modes and stress-test each`,
    `6. State the physical specification or decision with locked parameter values`,
  ], [log.topic]);

  const panels: { id: ActivePanel; label: string; icon: React.ReactNode; patternId: string }[] = [
    { id: 'refine', label: 'Refine Question', icon: <Wand2 size={13} />, patternId: 'Question Refinement' },
    { id: 'subquestions', label: 'Drill Down', icon: <ListTree size={13} />, patternId: 'Sub-question Decomposer' },
    { id: 'claims', label: 'Verify Claims', icon: <CheckCircle2 size={13} />, patternId: 'Fact Verification' },
    { id: 'outline', label: 'Investigation Outline', icon: <BookOpen size={13} />, patternId: 'Outline Expander' },
  ];

  return (
    <div style={{ marginTop: '1rem', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Tab row */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E7EB', background: '#F3F4F6' }}>
        {panels.map(p => (
          <button
            key={p.id}
            onClick={() => setActive(active === p.id ? null : p.id)}
            title={`Pattern: ${p.patternId}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.55rem 0.85rem', fontSize: '0.75rem', fontWeight: 700,
              border: 'none', borderRight: '1px solid #E5E7EB', cursor: 'pointer',
              background: active === p.id ? '#FFFFFF' : 'transparent',
              color: active === p.id ? '#111827' : '#6B7280',
              borderBottom: active === p.id ? '2px solid #111827' : '2px solid transparent',
            }}
          >
            {p.icon} {p.label}
          </button>
        ))}
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', padding: '0.55rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Panel content */}
      {active === 'refine' && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
            Refined Hypothesis · Question Refinement Pattern
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>
            A more precise, falsifiable version of the core inquiry — with success defined by a measurable, bounded outcome.
          </p>
          <div style={{ background: '#FFFFFF', border: '1px solid #DDD6FE', borderLeft: '3px solid #7C3AED', borderRadius: '0 8px 8px 0', padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#1E293B', fontWeight: 600, lineHeight: 1.55 }}>
            "{refinedQ}"
          </div>
        </div>
      )}

      {active === 'subquestions' && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
            Supporting Sub-questions · Sub-question Decomposer Pattern
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>
            Each sub-question independently answers a piece of the main inquiry. Combine the answers to reach the overall conclusion.
          </p>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {subQs.map((q, i) => (
              <li key={i} style={{ fontSize: '0.8375rem', color: '#374151', lineHeight: 1.55 }}>{q}</li>
            ))}
          </ol>
        </div>
      )}

      {active === 'claims' && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
            Verifiable Claims · Fact Verification Pattern
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>
            These are the fundamental facts inside the deliberation. If any are incorrect, the conclusion is undermined.
          </p>
          {claims.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', fontStyle: 'italic' }}>No numerically-bounded claims detected in this entry.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {claims.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={13} color="#D97706" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {active === 'outline' && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
            Investigation Outline · Outline Expander Pattern
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>
            A structured inquiry sequence for this topic. Click any step to expand it into a fuller sub-outline.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {outlineItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.45rem 0.65rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <ChevronRight size={12} color="#9CA3AF" style={{ marginTop: '3px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ThoughtLogsTab() {
  const [logs] = useState<ThoughtLogEntry[]>(INITIAL_LOGS);
  const [selectedLogId, setSelectedLogId] = useState<string>(INITIAL_LOGS[0].id);
  const [activePhase, setActivePhase] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [showNewLog, setShowNewLog] = useState(false);
  const [openPatternPanel, setOpenPatternPanel] = useState<string | null>(null);

  const activeLog = logs.find(l => l.id === selectedLogId) || logs[0];

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const phaseMatch = activePhase === 'All' || l.phase === activePhase;
      const searchMatch = !searchText || l.topic.toLowerCase().includes(searchText.toLowerCase()) || l.promptQuestion.toLowerCase().includes(searchText.toLowerCase());
      return phaseMatch && searchMatch;
    });
  }, [logs, activePhase, searchText]);

  return (
    <div style={{ maxWidth: '880px', width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '0.4rem' }}>
          DEVELOPMENT TRANSCRIPTS &amp; BRAINSTORM SCRATCHPAD
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', margin: '0 0 0.4rem 0' }}>
              Inventor Thought Logs
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              The raw lab scratchpad — problems questioned, edge cases stress-tested, engineering parameters calculated.
            </p>
          </div>
          <button
            onClick={() => setShowNewLog(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#111827', color: '#FFFFFF', border: 'none',
              borderRadius: '100px', padding: '0.6rem 1.15rem',
              fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={14} /> New Log
          </button>
        </div>
      </div>

      {/* Filter Pattern — phase chips + search */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {ALL_PHASES.map(phase => (
          <button
            key={phase}
            onClick={() => setActivePhase(phase)}
            style={{
              padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 700,
              border: activePhase === phase ? '1.5px solid #111827' : '1px solid #E5E7EB',
              borderRadius: '100px', cursor: 'pointer',
              background: activePhase === phase ? '#111827' : '#FFFFFF',
              color: activePhase === phase ? '#FFFFFF' : '#6B7280',
            }}
          >
            {phase}
          </button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.35rem 0.75rem', marginLeft: 'auto' }}>
          <Search size={13} color="#9CA3AF" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search logs…"
            style={{ border: 'none', background: 'transparent', fontSize: '0.8125rem', color: '#374151', outline: 'none', width: '140px' }}
          />
        </div>
      </div>

      {/* Template Wizard (Template Pattern) */}
      {showNewLog && <NewLogWizard onClose={() => setShowNewLog(false)} />}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 310px) 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>

        {/* Left: Log Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredLogs.length === 0 && (
            <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', textAlign: 'center', padding: '1rem 0' }}>No logs match this filter.</p>
          )}
          {filteredLogs.map(log => {
            const isSelected = log.id === selectedLogId;
            return (
              <button
                key={log.id}
                onClick={() => { setSelectedLogId(log.id); setOpenPatternPanel(null); }}
                style={{
                  background: isSelected ? '#FFFFFF' : '#F9FAFB',
                  border: isSelected ? '2px solid #111827' : '1px solid #E5E7EB',
                  borderRadius: '12px', padding: '1rem', textAlign: 'left',
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
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                {activeLog.timestamp}
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                {activeLog.topic}
              </h3>
            </div>

            {/* Core Inquiry */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                Core Inquiry / Hypothesis
              </div>
              <div style={{ background: '#F9FAFB', borderLeft: '3px solid #2563EB', padding: '0.85rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '0.9rem', fontWeight: 600, color: '#1E293B', lineHeight: 1.5 }}>
                &ldquo;{activeLog.promptQuestion}&rdquo;
              </div>
            </div>

            {/* Deliberation */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                Engineering Deliberation &amp; Edge Cases
              </div>
              <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.65, margin: 0 }}>
                {activeLog.deliberation}
              </p>
            </div>

            {/* Conclusion */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                Physical Spec Established
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#065F46', lineHeight: 1.5, fontWeight: 600 }}>
                {activeLog.conclusion}
              </div>
            </div>

            {/* Parameters */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Locked Specification Values
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                {activeLog.parametersDecided.map((param, idx) => (
                  <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{param.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)' }}>{param.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Panel trigger bar */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={() => setOpenPatternPanel(p => p === activeLog.id ? null : activeLog.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: openPatternPanel === activeLog.id ? '#F3F4F6' : 'transparent',
                  border: '1px solid #E5E7EB', borderRadius: '8px',
                  padding: '0.5rem 0.9rem', fontSize: '0.75rem', fontWeight: 700,
                  color: '#6B7280', cursor: 'pointer',
                }}
              >
                <Sparkles size={13} color="#7C3AED" />
                AI Prompt Patterns
                {openPatternPanel === activeLog.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            </div>
          </div>

          {/* Pattern Panel */}
          {openPatternPanel === activeLog.id && (
            <PatternPanel log={activeLog} onClose={() => setOpenPatternPanel(null)} />
          )}
        </div>
      </div>

      {/* Patterns legend at bottom */}
      <div style={{ marginTop: '2.5rem', borderTop: '1px solid #F3F4F6', paddingTop: '1.5rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '0.75rem' }}>
          ACTIVE PROMPT PATTERNS IN THIS TAB
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['filter', 'template', 'question-refinement', 'sub-questions', 'fact-verification', 'outline-expander'].map(pid => {
            const p = PATTERNS.find(x => x.id === pid);
            if (!p) return null;
            return (
              <span key={pid} title={p.twinThinkUse} style={{ fontSize: '0.7rem', color: '#6B7280', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '100px', padding: '0.2rem 0.65rem', cursor: 'help' }}>
                {p.name}
              </span>
            );
          })}
        </div>
      </div>

    </div>
  );
}
