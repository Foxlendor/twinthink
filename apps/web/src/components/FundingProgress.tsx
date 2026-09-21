'use client';

import React, { useState } from 'react';
import { 
  Magnet, 
  Zap, 
  Sparkles, 
  CloudFog, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface FundingProgressProps {
  twinId: string;
  targetMsrp?: number;
}

export default function FundingProgress({ twinId, targetMsrp = 25 }: FundingProgressProps) {
  const [activeModal, setActiveModal] = useState<'alloy' | 'shear' | 'spark' | 'ether' | null>(null);
  const [sparkCount, setSparkCount] = useState<number>(342);
  const [shearCount, setShearCount] = useState<number>(14);
  const [alloyCount, setAlloyCount] = useState<number>(29);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Form states
  const [alloyText, setAlloyText] = useState('');
  const [alloyType, setAlloyType] = useState('tolerance');
  const [shearText, setShearText] = useState('');
  const [shearCategory, setShearCategory] = useState('thermal_leak');
  const [pledgeUnits, setPledgeUnits] = useState(1);

  const handleAlloySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alloyText.trim()) return;
    setAlloyCount(prev => prev + 1);
    setSubmittedMessage(`Alloy bonded: ${alloyType.toUpperCase()} upgrade recorded.`);
    setActiveModal(null);
    setAlloyText('');
    setTimeout(() => setSubmittedMessage(null), 4000);
  };

  const handleShearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shearText.trim()) return;
    setShearCount(prev => prev + 1);
    setSubmittedMessage(`Shear stress recorded: Fault marker dropped for ${shearCategory}.`);
    setActiveModal(null);
    setShearText('');
    setTimeout(() => setSubmittedMessage(null), 4000);
  };

  const handleSparkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSparkCount(prev => prev + pledgeUnits);
    setSubmittedMessage(`Demand manifested! ${pledgeUnits} unit pledge recorded at $${targetMsrp} MSRP.`);
    setActiveModal(null);
    setTimeout(() => setSubmittedMessage(null), 4000);
  };

  const handleEtherSubmit = () => {
    setSubmittedMessage("Idea dissolution logged. Concept vote returned to the unformed pool.");
    setActiveModal(null);
    setTimeout(() => setSubmittedMessage(null), 4000);
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '20px',
      padding: '1.25rem 1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top HUD Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            color: '#4B5563',
            textTransform: 'uppercase',
            letterSpacing: '0.75px',
            fontFamily: 'var(--font-mono)'
          }}>
            KINETIC FORGE
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic' }}>
            Engineering Actions (No Vanity Likes)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
          <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Magnet size={13} /> {alloyCount} Alloys
          </span>
          <span style={{ color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Zap size={13} /> {shearCount} Stress Faults
          </span>
          <span style={{ color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={13} /> {sparkCount} ($25 MSRP Pledges)
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {submittedMessage && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '10px',
          padding: '0.6rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.8125rem',
          color: '#065F46',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* The 4 Kinetic Forge Triggers (Alloy, Shear, Spark, Ether) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem'
      }}>
        {/* 1. ALLOY */}
        <button
          onClick={() => setActiveModal('alloy')}
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Swipe Right / Click to contribute an atomic engineering upgrade"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <div style={{ background: '#DCFCE7', padding: '0.3rem', borderRadius: '6px', color: '#15803D' }}>
              <Magnet size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#166534', letterSpacing: '0.5px' }}>
              ALLOY
            </span>
            <span style={{ fontSize: '0.65rem', color: '#16A34A', marginLeft: 'auto', fontWeight: 600 }}>
              SWIPE RIGHT →
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#15803D', lineHeight: 1.4 }}>
            <strong>Bond New Matter:</strong> Attach tighter tolerance, insulation, or fork Gen N+1.
          </div>
        </button>

        {/* 2. SHEAR */}
        <button
          onClick={() => setActiveModal('shear')}
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Swipe Left / Click to drop a stress load or failure marker"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <div style={{ background: '#FEE2E2', padding: '0.3rem', borderRadius: '6px', color: '#B91C1C' }}>
              <Zap size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991B1B', letterSpacing: '0.5px' }}>
              SHEAR
            </span>
            <span style={{ fontSize: '0.65rem', color: '#DC2626', marginLeft: 'auto', fontWeight: 600 }}>
              ← SWIPE LEFT
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991B1B', lineHeight: 1.4 }}>
            <strong>Apply Stress Load:</strong> Drop fault marker (thermal leak, fatigue limit, toxic risk).
          </div>
        </button>

        {/* 3. SPARK */}
        <button
          onClick={() => setActiveModal('spark')}
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Swipe Up / Click to pledge at target MSRP ($25)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <div style={{ background: '#FEF3C7', padding: '0.3rem', borderRadius: '6px', color: '#B45309' }}>
              <Sparkles size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400E', letterSpacing: '0.5px' }}>
              SPARK
            </span>
            <span style={{ fontSize: '0.65rem', color: '#D97706', marginLeft: 'auto', fontWeight: 600 }}>
              ↑ SWIPE UP
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400E', lineHeight: 1.4 }}>
            <strong>Manifest Demand:</strong> Pledge buy at ${targetMsrp} target MSRP to prove commercial index.
          </div>
        </button>

        {/* 4. ETHER */}
        <button
          onClick={() => setActiveModal('ether')}
          style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Swipe Down / Click to pass back to unformed idea pool"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <div style={{ background: '#F3F4F6', padding: '0.3rem', borderRadius: '6px', color: '#4B5563' }}>
              <CloudFog size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#374151', letterSpacing: '0.5px' }}>
              ETHER
            </span>
            <span style={{ fontSize: '0.65rem', color: '#6B7280', marginLeft: 'auto', fontWeight: 600 }}>
              ↓ SWIPE DOWN
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.4 }}>
            <strong>Dissolve:</strong> Release back into the dark unformed concept sea.
          </div>
        </button>
      </div>

      {/* Modal: ALLOY (Bond New Matter) */}
      {activeModal === 'alloy' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setActiveModal(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Magnet size={20} /> ALLOY: Bond New Matter
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Contribute an atomic physical upgrade to this Twin. Propose tighter tolerances, material swaps, or a Gen N+1 fork.
            </p>
            <form onSubmit={handleAlloySubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Upgrade Dimension</label>
                <select value={alloyType} onChange={e => setAlloyType(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}>
                  <option value="tolerance">Tighter Machining Tolerance (±0.02mm)</option>
                  <option value="insulation">Aerogel / Vacuum Outer Insulation Layer</option>
                  <option value="material">Passivated Titanium Tube Upgrade</option>
                  <option value="fork">Fork Generation N+1 Branch</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Specification & Engineering Notes</label>
                <textarea rows={3} value={alloyText} onChange={e => setAlloyText(e.target.value)} placeholder="Describe proposed specification, CAD modifications, or vendor source..." required style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ width: '100%', background: '#166534', color: '#FFFFFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                Bond Alloy Upgrade →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: SHEAR (Apply Stress Load) */}
      {activeModal === 'shear' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setActiveModal(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991B1B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} /> SHEAR: Apply Stress Load
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Drop an engineering Fault Marker. Highlight unaddressed thermal leaks, fatigue failure limits, toxic degradation, or regulatory hurdles.
            </p>
            <form onSubmit={handleShearSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Stress Category</label>
                <select value={shearCategory} onChange={e => setShearCategory(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}>
                  <option value="thermal_leak">Thermal Leak / Excessive Dissipation</option>
                  <option value="fatigue_limit">Mechanical Fatigue / Seal Wear</option>
                  <option value="toxic_degradation">Chemical Leaching / Food Contact Hazard</option>
                  <option value="regulatory">EU DPP / FDA Medical Device Classification</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>Failure Mode Description</label>
                <textarea rows={3} value={shearText} onChange={e => setShearText(e.target.value)} placeholder="State exact failure mechanism, pressure threshold, or missing test log..." required style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ width: '100%', background: '#991B1B', color: '#FFFFFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                Drop Fault Marker →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: SPARK (Manifest Demand) */}
      {activeModal === 'spark' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setActiveModal(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} /> SPARK: Manifest Demand
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Prove commercial demand. Pledge to purchase when physical manufacturing tooling opens at the target price of <strong>${targetMsrp} USD</strong>.
            </p>
            <form onSubmit={handleSparkSubmit}>
              <div style={{ marginBottom: '1.5rem', background: '#FEF3C7', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78350F', marginBottom: '0.5rem' }}>Pledge Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="number" min={1} max={100} value={pledgeUnits} onChange={e => setPledgeUnits(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #D97706', fontSize: '1rem', fontWeight: 700 }} />
                  <span style={{ fontSize: '0.9rem', color: '#78350F', fontWeight: 600 }}>
                    = ${(pledgeUnits * targetMsrp).toFixed(2)} USD Target Volume Commitment
                  </span>
                </div>
              </div>
              <button type="submit" style={{ width: '100%', background: '#B45309', color: '#FFFFFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                Record Commercial Demand Pledge →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ETHER (Dissolve) */}
      {activeModal === 'ether' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setActiveModal(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <CloudFog size={40} color="#6B7280" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
              Dissolve to Ether?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Pass this specimen back into the unformed dark pool. Your signal indicates this machine does not yet warrant atomic crystallization.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setActiveModal(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#FFFFFF', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEtherSubmit} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none', background: '#374151', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}>Confirm Dissolve</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
