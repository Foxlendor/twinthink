'use client';

import React, { useState, useMemo } from 'react';
import {
  MessageSquare, CheckCircle2, Sparkles, ChevronRight,
  ArrowRight, Eye, GitBranch
} from 'lucide-react';
import { PERSONAS, type Persona, MATERIAL_ALTERNATIVES, type MaterialAlternative, PATTERNS } from '@/lib/promptPatterns';

interface FeedbackItem {
  id: string;
  author: string;
  role: 'Machinist / Fabricator' | 'Materials Engineer' | 'Backer' | 'Collaborator' | 'Visitor';
  roleTagColor: string;
  date: string;
  category: string;
  comment: string;
  inventorReply?: string;
  replyDate?: string;
  /** Keywords triggering alternatives lookup */
  alternativeKeywords?: string[];
}

const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'pr-1',
    author: 'Marcus Vance',
    role: 'Machinist / Fabricator',
    roleTagColor: '#2563EB',
    date: 'September 12, 2026',
    category: 'Tooling & Tolerances',
    comment: 'Are you planning on gun-drilling the 316L inner bore from solid rod or using precision drawn seamless tubing? Seamless drawn tubing with ±0.03mm wall tolerance will save 40% in spindle time and keep the Viton seal concentric.',
    inventorReply: 'We sourced precision seamless drawn 316L tubing (0.236 in ID). This eliminates gun drilling entirely and matches the Viton O-ring seat specification in the STEP CAD model.',
    replyDate: 'September 13, 2026',
    alternativeKeywords: ['316L', 'stainless'],
  },
  {
    id: 'pr-2',
    author: 'Dr. Elena Rostova',
    role: 'Materials Engineer',
    roleTagColor: '#7C3AED',
    date: 'September 14, 2026',
    category: 'SAT Latent Heat Stability',
    comment: 'The 54.0°C plateau in your thermocouple logs matches published SAT equilibrium cleanly. What thickening agent are you using to prevent phase separation across repeated supercooling cycles?',
    inventorReply: 'Using 1.5 wt% food-grade sodium carboxymethyl cellulose (CMC) as a gelling stabilizer. Over 50 benchtop thermal cycles logged with zero incongruent melting or crystal precipitation.',
    replyDate: 'September 15, 2026',
    alternativeKeywords: ['sodium acetate', 'pcm'],
  },
  {
    id: 'pr-3',
    author: 'Dave Miller',
    role: 'Backer',
    roleTagColor: '#059669',
    date: 'September 16, 2026',
    category: 'Field Usability',
    comment: 'Backed the $25 pre-order tier for the first production run. Will the silicone outer sleeve insulate enough to hold the straw comfortably with bare fingers in freezing mountain weather?',
    inventorReply: 'Outer silicone sleeve surface stabilizes at 36°C (feels like a comfortable hand warmer), fully protecting lips and fingers while liquid flows through heated to ~48-50°C.',
    replyDate: 'September 17, 2026',
  }
];

// Map persona id to which categories they would prioritize
const PERSONA_CATEGORY_WEIGHT: Record<string, string[]> = {
  investor: ['Tooling & Tolerances', 'Field Usability'],
  machinist: ['Tooling & Tolerances'],
  safety: ['SAT Latent Heat Stability', 'Field Usability'],
  enduser: ['Field Usability'],
  chemist: ['SAT Latent Heat Stability'],
};

function PersonaContextCard({ persona }: { persona: Persona }) {
  return (
    <div style={{
      background: `${persona.color}08`,
      border: `1.5px solid ${persona.color}33`,
      borderLeft: `4px solid ${persona.color}`,
      borderRadius: '0 10px 10px 0',
      padding: '0.85rem 1.15rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <Eye size={13} color={persona.color} />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: persona.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Viewing as: {persona.label}
        </span>
      </div>
      <p style={{ fontSize: '0.8125rem', color: '#374151', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
        {persona.lens}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {persona.focusAreas.map(area => (
          <span key={area} style={{ fontSize: '0.6875rem', color: persona.color, background: `${persona.color}12`, border: `1px solid ${persona.color}30`, borderRadius: '4px', padding: '0.1rem 0.45rem', fontFamily: 'var(--font-mono)' }}>
            {area}
          </span>
        ))}
      </div>
    </div>
  );
}

function AlternativesPanel({ alternatives }: { alternatives: MaterialAlternative[] }) {
  return (
    <div style={{ marginTop: '0.75rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '0.6rem 0.85rem', background: '#F3F4F6', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <GitBranch size={12} color="#6B7280" />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Alternative Approaches · Alternatives Pattern
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {alternatives.map((alt, i) => (
          <div key={i} style={{ padding: '0.75rem 0.85rem', borderBottom: i < alternatives.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.8375rem', fontWeight: 700, color: '#111827' }}>{alt.name}</span>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: alt.suitability === 'high' ? '#059669' : alt.suitability === 'medium' ? '#D97706' : '#DC2626',
                  background: alt.suitability === 'high' ? '#ECFDF5' : alt.suitability === 'medium' ? '#FFFBEB' : '#FEF2F2',
                  border: `1px solid ${alt.suitability === 'high' ? '#A7F3D0' : alt.suitability === 'medium' ? '#FDE68A' : '#FECACA'}`,
                  borderRadius: '4px', padding: '0.1rem 0.4rem',
                }}>
                  {alt.suitability.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>{alt.costFactor}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <div>
                {alt.pros.map((p, j) => (
                  <div key={j} style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#059669', fontSize: '0.75rem', flexShrink: 0 }}>+</span>
                    <span style={{ fontSize: '0.75rem', color: '#374151', lineHeight: 1.4 }}>{p}</span>
                  </div>
                ))}
              </div>
              <div>
                {alt.cons.map((c, j) => (
                  <div key={j} style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#DC2626', fontSize: '0.75rem', flexShrink: 0 }}>−</span>
                    <span style={{ fontSize: '0.75rem', color: '#374151', lineHeight: 1.4 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PeerReviewTab({ twinId }: { twinId: string }) {
  const [reviews, setReviews] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<FeedbackItem['role']>('Machinist / Fabricator');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(new Set());

  const selectedPersona = useMemo(
    () => PERSONAS.find(p => p.id === selectedPersonaId) ?? null,
    [selectedPersonaId]
  );

  const filteredReviews = useMemo(() => {
    if (!selectedPersonaId) return reviews;
    const prioritized = PERSONA_CATEGORY_WEIGHT[selectedPersonaId] ?? [];
    if (prioritized.length === 0) return reviews;
    return [...reviews].sort((a, b) => {
      const aP = prioritized.includes(a.category) ? 0 : 1;
      const bP = prioritized.includes(b.category) ? 0 : 1;
      return aP - bP;
    });
  }, [reviews, selectedPersonaId]);

  // Tail prompt: open questions = reviews without an inventor reply
  const openQuestions = useMemo(() => reviews.filter(r => !r.inventorReply), [reviews]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;
    const newReview: FeedbackItem = {
      id: `pr-${Date.now()}`,
      author: name,
      role,
      roleTagColor: role === 'Machinist / Fabricator' ? '#2563EB' : role === 'Materials Engineer' ? '#7C3AED' : '#059669',
      date: 'Today',
      category: category || 'General Technical Review',
      comment,
    };
    setReviews([newReview, ...reviews]);
    setName(''); setCategory(''); setComment('');
    setShowForm(false);
    setSubmittedMessage('Your review has been logged to the specimen community ledger. Thank you for your peer input!');
    setTimeout(() => setSubmittedMessage(null), 5000);
  };

  const toggleAlternatives = (id: string) => {
    setExpandedAlternatives(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ maxWidth: '880px', width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '0.4rem' }}>
          PEER SCRUTINY &amp; BACKER VOICES
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', margin: '0 0 0.5rem 0' }}>
              Community Feedback &amp; Peer Review
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              Direct technical critiques, machinist tooling notes, and backer questions. Real peer review from engineers, makers, and backers.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: '100px', padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <MessageSquare size={14} />
            {showForm ? 'Cancel Submission' : 'Leave Peer Review / Note'}
          </button>
        </div>
      </div>

      {/* Persona Lens selector (Persona Pattern) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={12} color="#7C3AED" /> Persona Lens Pattern
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          <button
            onClick={() => setSelectedPersonaId(null)}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, border: !selectedPersonaId ? '1.5px solid #111827' : '1px solid #E5E7EB', borderRadius: '100px', cursor: 'pointer', background: !selectedPersonaId ? '#111827' : '#FFFFFF', color: !selectedPersonaId ? '#FFFFFF' : '#6B7280' }}
          >
            All Voices
          </button>
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPersonaId(prev => prev === p.id ? null : p.id)}
              style={{
                padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 700,
                border: selectedPersonaId === p.id ? `1.5px solid ${p.color}` : '1px solid #E5E7EB',
                borderRadius: '100px', cursor: 'pointer',
                background: selectedPersonaId === p.id ? p.color : '#FFFFFF',
                color: selectedPersonaId === p.id ? '#FFFFFF' : '#6B7280',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Persona context card */}
      {selectedPersona && <PersonaContextCard persona={selectedPersona} />}

      {/* Success Notification */}
      {submittedMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '0.85rem 1.25rem', color: '#065F46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '2px solid #E5E7EB', borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 1rem 0' }}>
            Submit Technical Review or Tooling Feedback
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>Your Name / Organization *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Sarah Chen (CNC Lathes)" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>Peer Role *</label>
              <select value={role} onChange={e => setRole(e.target.value as FeedbackItem['role'])} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', background: '#FFFFFF' }}>
                <option value="Machinist / Fabricator">Machinist / Fabricator</option>
                <option value="Materials Engineer">Materials Engineer</option>
                <option value="Backer">Production Backer</option>
                <option value="Collaborator">Collaborator / Mentor</option>
                <option value="Visitor">Visitor</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>Topic / Technical Domain</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., CNC Tooling, Seal Integrity, Phase Change Salts" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }} />
            </div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>Feedback / Question / Technical Constraint *</label>
            <textarea required rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share concrete technical feedback, machining constraints, or questions regarding the BOM and test logs..." style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', lineHeight: 1.5, fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: '#111827', border: 'none', borderRadius: '8px', padding: '0.6rem 1.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>Post to Ledger</button>
          </div>
        </form>
      )}

      {/* Review List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredReviews.map(item => {
          const alts = item.alternativeKeywords
            ? item.alternativeKeywords.flatMap(kw => {
                const k = kw.toLowerCase();
                if (k.includes('316') || k.includes('stainless')) return MATERIAL_ALTERNATIVES['316l'] ?? [];
                if (k.includes('sodium acetate') || k.includes('pcm')) return MATERIAL_ALTERNATIVES['sodium acetate'] ?? [];
                return [];
              })
            : [];
          const hasAlts = alts.length > 0;

          return (
            <div key={item.id} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F3F4F6', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                    {item.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#111827', display: 'block' }}>{item.author}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.date} · {item.category}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedPersona && PERSONA_CATEGORY_WEIGHT[selectedPersona.id]?.includes(item.category) && (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: selectedPersona.color, background: `${selectedPersona.color}12`, border: `1px solid ${selectedPersona.color}30`, borderRadius: '100px', padding: '0.15rem 0.5rem' }}>
                      Priority for {selectedPersona.label}
                    </span>
                  )}
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.roleTagColor, background: `${item.roleTagColor}12`, border: `1px solid ${item.roleTagColor}33`, padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    {item.role}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, margin: '0 0 0.75rem 0' }}>
                {item.comment}
              </p>

              {/* Alternatives toggle (Alternatives Pattern) */}
              {hasAlts && (
                <button
                  onClick={() => toggleAlternatives(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', cursor: 'pointer', marginBottom: '0.5rem' }}
                >
                  <GitBranch size={12} />
                  {expandedAlternatives.has(item.id) ? 'Hide' : 'Show'} Alternative Approaches
                </button>
              )}
              {hasAlts && expandedAlternatives.has(item.id) && <AlternativesPanel alternatives={alts} />}

              {/* Inventor Reply */}
              {item.inventorReply && (
                <div style={{ background: '#F9FAFB', borderLeft: '3px solid #111827', borderRadius: '0 8px 8px 0', padding: '0.85rem 1.15rem', marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827' }}>johne.boi (Inventor)</span>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>· {item.replyDate}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: 0, lineHeight: 1.55 }}>{item.inventorReply}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tail Prompt Pattern — open questions + next action */}
      <div style={{ marginTop: '2.5rem', borderTop: '2px solid #F3F4F6', paddingTop: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={14} color="#7C3AED" />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tail Prompt Pattern · Open Questions &amp; Next Actions
          </span>
        </div>

        {openQuestions.length === 0 ? (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '0.85rem 1.15rem', fontSize: '0.875rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            All peer questions have received inventor replies. No open threads.
          </div>
        ) : (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', color: '#92400E', fontWeight: 600, margin: '0 0 0.65rem 0' }}>
              {openQuestions.length} question{openQuestions.length > 1 ? 's' : ''} still need{openQuestions.length === 1 ? 's' : ''} an inventor reply:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
              {openQuestions.map(q => (
                <div key={q.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <ArrowRight size={13} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>
                    <strong>{q.author}</strong> asked: "{q.comment.slice(0, 120)}{q.comment.length > 120 ? '…' : ''}"
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#92400E', fontWeight: 700 }}>
              <ChevronRight size={14} /> What is your next reply to the community?
            </div>
          </div>
        )}
      </div>

      {/* Patterns legend */}
      <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '0.5rem' }}>
          ACTIVE PROMPT PATTERNS IN THIS TAB
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['persona', 'alternatives', 'tail-prompt', 'filter'].map(pid => {
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
