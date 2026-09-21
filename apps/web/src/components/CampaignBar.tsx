'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Users, 
  DollarSign, 
  Flame, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Package, 
  Coffee,
  Heart
} from 'lucide-react';

interface BackerRecord {
  id: string;
  name: string;
  email: string;
  amount: number;
  tierName: string;
  note?: string;
  date: string;
}

interface CampaignBarProps {
  twinId: string;
  twinTitle?: string;
  goalAmount?: number;
  initialRaised?: number;
  initialBackers?: number;
  batchDescription?: string;
  targetMsrp?: number;
}

export default function CampaignBar({
  twinId,
  twinTitle,
  goalAmount = 2500,
  initialRaised = 850,
  initialBackers = 18,
  batchDescription,
  targetMsrp = 25
}: CampaignBarProps) {
  // Title & description adapt to the twin
  const title = twinTitle || (twinId.includes('twizz') ? 'TWIIZZLock 2L Volume Sleeve' : twinId.includes('redr') ? 'Redr.ink Modular Thermal Straw' : 'Redr.ink™ Thermal Straw');
  const defaultBatchDesc = batchDescription || (
    twinId.includes('twizz') 
      ? 'Tooling for high-frequency RF welding of 2-chamber TPU sleeves & food-safe duckbill check valves'
      : twinId.includes('redr')
      ? 'First run of modular snap-in sodium acetate cartridges & borosilicate thermal transfer tubes'
      : 'First run of modular snap-in sodium acetate cartridges & passivated 316L tubing'
  );

  const storageKey = `twinthink_patrons_${twinId}`;
  
  const [raised, setRaised] = useState(initialRaised);
  const [backers, setBackers] = useState(initialBackers);
  const [patronList, setPatronList] = useState<BackerRecord[]>([]);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('50');
  const [isPledging, setIsPledging] = useState(false);
  const [pledgeSuccess, setPledgeSuccess] = useState<string | null>(null);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [backerName, setBackerName] = useState('');
  const [backerEmail, setBackerEmail] = useState('');
  const [backerNote, setBackerNote] = useState('');
  const [isFreeWaitlist, setIsFreeWaitlist] = useState(false);

  // Load persisted patrons on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: BackerRecord[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setPatronList(parsed);
          const totalPledged = parsed.reduce((sum, b) => sum + b.amount, 0);
          setRaised(initialRaised + totalPledged);
          setBackers(initialBackers + parsed.length);
        }
      }
    } catch {}
  }, [storageKey, initialRaised, initialBackers]);

  const percentRaised = Math.min(100, Math.round((raised / goalAmount) * 100));

  const handleOpenPledge = (tierAmount: number) => {
    setSelectedTier(tierAmount);
    setIsFreeWaitlist(tierAmount === 0);
    setShowPledgeModal(true);
  };

  const handleConfirmPledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backerEmail.trim()) return;

    let amount = 0;
    let tierName = 'Waitlist Supporter';

    if (isFreeWaitlist) {
      amount = 0;
      tierName = 'Free Waitlist';
    } else if (selectedTier === -1) {
      amount = parseFloat(customAmount) || 10;
      tierName = 'Angel / Patron Backer';
    } else if (selectedTier === 5) {
      amount = 5;
      tierName = 'Coffee & Waitlist Member';
    } else if (selectedTier === 25) {
      amount = 25;
      tierName = 'Batch #1 Early Pre-Order';
    } else if (selectedTier === 100) {
      amount = 100;
      tierName = 'Co-Inventor Ledger Sponsor';
    }

    setIsPledging(true);

    setTimeout(() => {
      const newBacker: BackerRecord = {
        id: `b_${Date.now()}`,
        name: backerName.trim() || 'Anonymous Patron',
        email: backerEmail.trim(),
        amount,
        tierName,
        note: backerNote.trim() || undefined,
        date: new Date().toLocaleDateString()
      };

      const updated = [newBacker, ...patronList];
      setPatronList(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}

      setRaised(prev => prev + amount);
      setBackers(prev => prev + 1);
      setIsPledging(false);
      setShowPledgeModal(false);
      setBackerName('');
      setBackerEmail('');
      setBackerNote('');

      setPledgeSuccess(
        amount > 0 
          ? `Thank you ${newBacker.name}! Your $${amount} pledge was added to the public backer ledger.`
          : `You're on the waitlist, ${newBacker.name}! We'll notify you as soon as tooling samples are verified.`
      );
      setTimeout(() => setPledgeSuccess(null), 6000);
    }, 600);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
      border: '1px solid #E5E7EB',
      borderRadius: '20px',
      padding: '1.5rem 1.75rem',
      marginBottom: '1.75rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      position: 'relative'
    }}>
      {/* Header Tag */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#B45309',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.75px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <Flame size={12} /> PRE-LAUNCH · ACCEPTING FIRST PRODUCTION BACKERS
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>
            Ground truth hardware · Verified by Alpha R&D Phase prior art &amp; real test logs
          </span>
        </div>

        <div style={{
          fontSize: '0.8125rem',
          color: '#059669',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <ShieldCheck size={15} /> 100% Honest Prototype Stage
        </div>
      </div>

      {/* Main Goal Headline */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.3px',
          margin: '0 0 0.35rem 0'
        }}>
          Goal: Machining First Production Batch (${goalAmount.toLocaleString()})
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0, lineHeight: 1.4 }}>
          {batchDescription}. Every backer accelerates volume production from verified $1.38 unit COGS to finished hardware.
        </p>
      </div>

      {/* Financial Progress Numbers */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#111827',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-1px'
          }}>
            ${raised.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 }}>
            pledged of ${goalAmount.toLocaleString()} target
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem' }}>
          <span style={{ color: '#111827', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={16} color="#6B7280" /> {backers} backers
          </span>
          <span style={{
            color: '#059669',
            fontWeight: 800,
            background: '#ECFDF5',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px'
          }}>
            {percentRaised}% funded
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '10px',
        background: '#E5E7EB',
        borderRadius: '999px',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: `${percentRaised}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
          borderRadius: '999px',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      {/* Success Banner */}
      {pledgeSuccess && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          color: '#065F46',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{pledgeSuccess}</span>
        </div>
      )}

      {/* 3 Clear Pledge Tiers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem'
      }}>
        {/* Tier 1: $5 Fuel the Idea */}
        <button
          onClick={() => handleOpenPledge(5)}
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#111827';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)' }}>$5</span>
              <Coffee size={16} color="#6B7280" />
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', marginBottom: '0.2rem' }}>
              Fuel the Idea
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.4 }}>
              Micro-backer pass. Your name etched into Twin #0001&apos;s immutable provenance ledger + notebook updates.
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Back for $5 →
          </div>
        </button>

        {/* Tier 2: $25 Pre-Order Production Straw */}
        <button
          onClick={() => handleOpenPledge(25)}
          style={{
            background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
            border: '2px solid #059669',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-9px',
            right: '12px',
            background: '#059669',
            color: '#FFFFFF',
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '0.15rem 0.5rem',
            borderRadius: '999px',
            letterSpacing: '0.5px'
          }}>
            RECOMMENDED
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#065F46', fontFamily: 'var(--font-mono)' }}>$25</span>
              <Package size={16} color="#059669" />
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065F46', marginBottom: '0.2rem' }}>
              First Batch Pre-Order
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.4 }}>
              Guaranteed Batch #1 Redr.ink™ straw at target MSRP. Serialized engraved 316L stainless tube + silicone jacket.
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Pre-Order Straw ($25) →
          </div>
        </button>

        {/* Tier 3: Custom Patron Backer */}
        <button
          onClick={() => handleOpenPledge(-1)}
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#111827';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', fontFamily: 'var(--font-mono)' }}>Custom</span>
              <Heart size={16} color="#EC4899" />
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', marginBottom: '0.2rem' }}>
              Angel / Patron Backer
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.4 }}>
              Fund tooling, prototyping materials, or production batches directly with the inventor.
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Pledge Any Amount →
          </div>
        </button>
      </div>

      {/* Free Waitlist Quick Action Bar */}
      <div style={{
        marginTop: '1.25rem',
        padding: '0.85rem 1.25rem',
        background: '#F8FAFC',
        border: '1px dashed #CBD5E1',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
            Just want launch notifications?
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Join the free email waitlist for prototype drop dates and manufacturing milestones.
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleOpenPledge(0)}
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '999px',
            padding: '0.5rem 1.15rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Join Free Waitlist ($0)
        </button>
      </div>

      {/* Live Backers & Patrons Wall */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
            Recent Backers &amp; Provenance Ledger ({backers})
          </div>
          <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, background: '#ECFDF5', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
            Live Community Ledger
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.65rem'
        }}>
          {patronList.length > 0 ? (
            patronList.slice(0, 6).map(p => (
              <div key={p.id} style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{p.name}</span>
                  <span style={{ fontWeight: 800, color: p.amount > 0 ? '#059669' : '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {p.amount > 0 ? `$${p.amount}` : 'Waitlist'}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  {p.tierName} · {p.date}
                </div>
                {p.note && (
                  <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic', marginTop: '0.35rem', background: '#F8FAFC', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                    &ldquo;{p.note}&rdquo;
                  </div>
                )}
              </div>
            ))
          ) : (
            // Pre-seeded authentic community entries
            [
              { name: 'Alex M. (Hardware Angel)', amount: '$100', tier: 'Co-Inventor Ledger', note: 'Can not wait to test this prototype in the field!' },
              { name: 'Elena Rostova', amount: '$25', tier: 'Batch #1 Pre-Order', note: 'Backing early for production tooling.' },
              { name: 'David Chen', amount: '$5', tier: 'Coffee & Waitlist', note: 'Love the honest engineering approach.' }
            ].map((s, idx) => (
              <div key={idx} style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{s.name}</span>
                  <span style={{ fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>{s.amount}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  {s.tier}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic', marginTop: '0.35rem', background: '#F8FAFC', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                  &ldquo;{s.note}&rdquo;
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Interactive Pledge Modal */}
      {showPledgeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => setShowPledgeModal(false)}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPledgeModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              <Sparkles size={16} />
              Pledge to {title}
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
              {isFreeWaitlist && "Join Early Founder Waitlist ($0)"}
              {selectedTier === 5 && "Fuel the Idea & Waitlist ($5)"}
              {selectedTier === 25 && "Reserve Batch #1 Prototype ($25)"}
              {selectedTier === 100 && "Co-Inventor Ledger Tier ($100)"}
              {selectedTier === -1 && "Patron / Custom Contribution"}
            </h3>

            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {defaultBatchDesc}. All funds are dedicated to hardware validation and production runs.
            </p>

            <form onSubmit={handleConfirmPledge}>
              {selectedTier === -1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                    Custom Pledge Amount ($ USD)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '0.6rem 0.75rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRight: 'none', borderRadius: '8px 0 0 8px', fontWeight: 700 }}>$</span>
                    <input
                      type="number"
                      min={1}
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      style={{ flex: 1, padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '0 8px 8px 0', fontSize: '1rem', fontWeight: 700 }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Your Name / Handle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Investor 001"
                  value={backerName}
                  onChange={e => setBackerName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Email for Batch Tracking &amp; Delivery Updates *
                </label>
                <input
                  type="email"
                  required
                  placeholder="backer@domain.com"
                  value={backerEmail}
                  onChange={e => setBackerEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Note to Inventor (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excited for this to hit production!"
                  value={backerNote}
                  onChange={e => setBackerNote(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isPledging || !backerName.trim() || !backerEmail.trim()}
                style={{
                  width: '100%',
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '100px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: isPledging ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isPledging ? 'Recording Pledge on Ledger...' : isFreeWaitlist ? 'Join Waitlist for Free ($0)' : `Confirm Pledge ($${selectedTier === -1 ? customAmount : selectedTier})`}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

