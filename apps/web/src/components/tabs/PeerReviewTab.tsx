'use client';

import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Wrench, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  UserCheck,
  HelpCircle,
  Award
} from 'lucide-react';

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
    replyDate: 'September 13, 2026'
  },
  {
    id: 'pr-2',
    author: 'Dr. Elena Rostova',
    role: 'Materials Engineer',
    roleTagColor: '#111827',
    date: 'September 14, 2026',
    category: 'SAT Latent Heat Stability',
    comment: 'The 54.0°C plateau in your thermocouple logs matches published SAT equilibrium cleanly. What thickening agent are you using to prevent phase separation across repeated supercooling cycles?',
    inventorReply: 'Using 1.5 wt% food-grade sodium carboxymethyl cellulose (CMC) as a gelling stabilizer. Over 50 benchtop thermal cycles logged with zero incongruent melting or crystal precipitation.',
    replyDate: 'September 15, 2026'
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
    replyDate: 'September 17, 2026'
  }
];

export default function PeerReviewTab({ twinId }: { twinId: string }) {
  const [reviews, setReviews] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<FeedbackItem['role']>('Machinist / Fabricator');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;

    const newReview: FeedbackItem = {
      id: `pr-${Date.now()}`,
      author: name,
      role: role,
      roleTagColor: role === 'Machinist / Fabricator' ? '#2563EB' : role === 'Materials Engineer' ? '#111827' : '#059669',
      date: 'Today',
      category: category || 'General Technical Review',
      comment: comment
    };

    setReviews([newReview, ...reviews]);
    setName('');
    setCategory('');
    setComment('');
    setShowForm(false);
    setSubmittedMessage('Your review has been logged to the specimen community ledger. Thank you for your peer input!');
    setTimeout(() => setSubmittedMessage(null), 5000);
  };

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
          PEER SCRUTINY &amp; BACKER VOICES
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.5px',
              margin: '0 0 0.5rem 0'
            }}>
              Community Feedback &amp; Peer Review
            </h2>
            <p style={{
              fontSize: '0.9375rem',
              color: '#6B7280',
              margin: 0,
              lineHeight: 1.6
            }}>
              Direct technical critiques, machinist tooling notes, and backer questions. Real peer review from engineers, makers, and backers.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '100px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <MessageSquare size={14} />
            {showForm ? 'Cancel Submission' : 'Leave Peer Review / Note'}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {submittedMessage && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          color: '#065F46',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* Interactive Submission Drawer */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '16px',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 1rem 0' }}>
            Submit Technical Review or Tooling Feedback
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                Your Name / Organization *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. CNC Operator (Lathes)"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                Peer Role *
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as FeedbackItem['role'])}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  background: '#FFFFFF'
                }}
              >
                <option value="Machinist / Fabricator">Machinist / Fabricator</option>
                <option value="Materials Engineer">Materials Engineer</option>
                <option value="Backer">Production Backer</option>
                <option value="Collaborator">Collaborator / Mentor</option>
                <option value="Visitor">Visitor</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                Topic / Technical Domain
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g., CNC Tooling, Seal Integrity, Phase Change Salts, Pre-Order Specs"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
              Feedback / Question / Technical Constraint *
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share concrete technical feedback, machining constraints, or questions regarding the BOM and test logs..."
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '0.6rem 1.2rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#111827',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              Post to Ledger
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {reviews.map(item => (
          <div
            key={item.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            {/* Header row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#F3F4F6',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {item.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#111827', display: 'block' }}>
                    {item.author}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {item.date} · {item.category}
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: item.roleTagColor,
                background: `${item.roleTagColor}12`,
                border: `1px solid ${item.roleTagColor}33`,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)'
              }}>
                {item.role}
              </span>
            </div>

            {/* Comment Body */}
            <p style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: 1.6,
              margin: '0 0 1rem 0'
            }}>
              {item.comment}
            </p>

            {/* Inventor Reply */}
            {item.inventorReply && (
              <div style={{
                background: '#F9FAFB',
                borderLeft: '3px solid #111827',
                borderRadius: '0 8px 8px 0',
                padding: '0.85rem 1.15rem',
                marginTop: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827' }}>
                    anonymous (Inventor)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                    · {item.replyDate}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: 0, lineHeight: 1.55 }}>
                  {item.inventorReply}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
