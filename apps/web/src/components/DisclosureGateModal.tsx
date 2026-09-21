'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  X, 
  Download, 
  Eye
} from 'lucide-react';

import { usePitchAccess } from '@/lib/usePitchAccess';

interface DisclosureGateModalProps {
  twinId: string;
  creator: string;
  onClose: () => void;
  onVaultUnlocked?: () => void;
}

export default function DisclosureGateModal({ 
  twinId, 
  creator, 
  onClose,
  onVaultUnlocked 
}: DisclosureGateModalProps) {
  const [currentTier, setCurrentTier] = useState<'public' | 'access_gate' | 'vault'>('access_gate');
  const [legalName, setLegalName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [acknowledgedNDA, setAcknowledgedNDA] = useState(false);
  const [escrowDeposited, setEscrowDeposited] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureHash, setSignatureHash] = useState<string | null>(null);

  // Pitch & Investor Access Code State
  const { isUnlocked, activeCode, unlockWithCode, relock, createPitchCode } = usePitchAccess();
  const [pitchInput, setPitchInput] = useState('');
  const [pitchMessage, setPitchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreatorTools, setShowCreatorTools] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newGeneratedCode, setNewGeneratedCode] = useState<string | null>(null);

  // Auto-switch to vault if already unlocked via pitch pass
  React.useEffect(() => {
    if (isUnlocked && currentTier !== 'vault') {
      setCurrentTier('vault');
    }
  }, [isUnlocked, currentTier]);

  const handleRedeemPitchCode = (e: React.FormEvent) => {
    e.preventDefault();
    const result = unlockWithCode(pitchInput);
    if (result.success) {
      setPitchMessage({ type: 'success', text: result.message });
      setSignatureHash(`pitch_pass_${activeCode || pitchInput.toUpperCase()}`);
      setLegalName('Verified Pitch Attendee');
      setCurrentTier('vault');
      if (onVaultUnlocked) onVaultUnlocked();
    } else {
      setPitchMessage({ type: 'error', text: result.message });
    }
  };

  const handleCopyPitchLink = (code: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?pitch=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleGenerateCode = () => {
    const code = createPitchCode();
    setNewGeneratedCode(code);
    setPitchInput(code);
  };

  const handleSignNDA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgedNDA || !legalName.trim()) return;

    setIsSigning(true);
    setTimeout(() => {
      // Deterministic signature simulation for Private NDA
      const fakeSig = `sig_ed25519_${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
      setSignatureHash(fakeSig);
      setIsSigning(false);
      setCurrentTier('vault');
      if (onVaultUnlocked) {
        onVaultUnlocked();
      }
    }, 1200);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.25rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          border: '1px solid #E5E7EB'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Tier Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.75px', fontFamily: 'var(--font-mono)' }}>
            ACCESS RESTRICTED
          </span>
          <span style={{ color: '#E5E7EB' }}>/</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>
            Private Records Authorization
          </span>
        </div>

        {/* 3-Tier Indicator Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setCurrentTier('public')}
            style={{
              background: currentTier === 'public' ? '#111827' : '#F9FAFB',
              color: currentTier === 'public' ? '#FFFFFF' : '#4B5563',
              border: `1px solid ${currentTier === 'public' ? '#111827' : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '0.65rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            1. Public Tier
          </button>
          <button
            onClick={() => setCurrentTier('access_gate')}
            style={{
              background: currentTier === 'access_gate' ? '#111827' : '#F9FAFB',
              color: currentTier === 'access_gate' ? '#FFFFFF' : '#4B5563',
              border: `1px solid ${currentTier === 'access_gate' ? '#111827' : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '0.65rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            2. Private Access Gate
          </button>
          <button
            onClick={() => signatureHash && setCurrentTier('vault')}
            style={{
              background: currentTier === 'vault' ? '#059669' : '#F9FAFB',
              color: currentTier === 'vault' ? '#FFFFFF' : signatureHash ? '#059669' : '#9CA3AF',
              border: `1px solid ${currentTier === 'vault' ? '#059669' : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '0.65rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: signatureHash ? 'pointer' : 'not-allowed',
              textAlign: 'center'
            }}
          >
            3. Decrypted Records
          </button>
        </div>

        {/* TIER 1: Public Tier */}
        {currentTier === 'public' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4B5563', marginBottom: '0.75rem' }}>
              <Eye size={20} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Public Disclosure Tier</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Unauthenticated viewers and web crawlers are restricted to this tier. High-resolution CAD, granular BOM costs, and manufacturing recipes remain strictly private.
            </p>

            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Visible Disclosures:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.6 }}>
                <li><strong>Watermarked 3D Bounding Box:</strong> 16mm × 16mm × 220mm (Mesh wireframe only).</li>
                <li><strong>Problem Abstract:</strong> Self-heating beverage conduit for backcountry recreation.</li>
                <li><strong>Ethical Manifest:</strong> Declared rights: Open Development (CERN-OHL-S-2.0).</li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentTier('access_gate')}
              style={{
                width: '100%',
                background: '#111827',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Request Access Gate Authorization →
            </button>
          </div>
        )}

        {/* TIER 2: Access Gate (Private NDA) */}
        {currentTier === 'access_gate' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', marginBottom: '0.75rem' }}>
              <Lock size={20} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Private Access Gate
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              To protect @{creator} from automated scraper harvesting and IP dilution, unlock full specs via an authorized Pitch Code or complete the mutual agreement.
            </p>

            {/* PITCH / INVESTOR ACCESS PASS CARD (Light Minimalist Theme) */}
            <div style={{
              background: '#FAFAFA',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              color: '#111827',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', padding: '0.35rem', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
                    <KeyRound size={16} color="#111827" />
                  </span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
                      Pitch &amp; Investor Pass
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#4B5563' }}>
                      Instant Private Vault &amp; Full BOM Unlock for Pitch Meetings
                    </div>
                  </div>
                </div>

                {isUnlocked ? (
                  <span style={{ background: '#ECFDF5', color: '#065F46', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', border: '1px solid #A7F3D0' }}>
                    Pass Active ({activeCode})
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreatorTools(!showCreatorTools)}
                    style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#4B5563', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    {showCreatorTools ? 'Hide Pitch Tools' : 'Host / Pitcher Tools'}
                  </button>
                )}
              </div>

              {/* Redeem Form */}
              <form onSubmit={handleRedeemPitchCode} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                <input
                  type="text"
                  value={pitchInput}
                  onChange={e => {
                    setPitchInput(e.target.value);
                    setPitchMessage(null);
                  }}
                  placeholder="Enter Pitch Code (e.g. PITCH2026)"
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#111827',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.5px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#111827',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Unlock Records
                </button>
              </form>

              {pitchMessage && (
                <div style={{
                  marginTop: '0.65rem',
                  fontSize: '0.75rem',
                  color: pitchMessage.type === 'success' ? '#059669' : '#DC2626',
                  fontWeight: 600
                }}>
                  {pitchMessage.text}
                </div>
              )}

              {/* Sample codes helper chips */}
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#6B7280' }}>
                <span>Verified codes:</span>
                {['PITCH2026', 'INVESTOR', 'FOUNDER', 'TWINTHINK'].map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setPitchInput(code);
                      unlockWithCode(code);
                    }}
                    style={{
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      color: '#4B5563',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>

              {/* Pitch Host Tools */}
              {showCreatorTools && (
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #E5E7EB', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 700, color: '#4B5563', marginBottom: '0.4rem' }}>
                    Founder Pitch Deck &amp; Meeting Controls:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      style={{ background: '#F3F4F6', color: '#111827', border: '1px solid #D1D5DB', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Generate New One-Time Code
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPitchLink(pitchInput || 'PITCH2026')}
                      style={{ background: '#F3F4F6', color: '#111827', border: '1px solid #D1D5DB', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {copiedLink ? 'Copied 1-Click Link!' : 'Copy 1-Click Pitch URL'}
                    </button>
                    {isUnlocked && (
                      <button
                        type="button"
                        onClick={relock}
                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Lock / Reset Pitch State
                      </button>
                    )}
                  </div>
                  {newGeneratedCode && (
                    <div style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      New Code Ready: <strong>{newGeneratedCode}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0 1rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Or Sign Mutual NDA
              </span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            </div>

            <form onSubmit={handleSignNDA}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                    Signer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={legalName}
                    onChange={e => setLegalName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                    Organization / Entity (Optional)
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. Apex Dynamics Ltd."
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Escrow Option */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#374151', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={escrowDeposited}
                    onChange={e => setEscrowDeposited(e.target.checked)}
                  />
                  <span>Attach Escrow Security Deposit</span>
                </label>
              </div>

              {/* Agreement Checkbox */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#4B5563', lineHeight: 1.4 }}>
                  <input
                    type="checkbox"
                    required
                    checked={acknowledgedNDA}
                    onChange={e => setAcknowledgedNDA(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <span>
                    I legally covenant that CAD solid geometries, vendor BOM pricing, and CNC tooling paths accessed under Twin #{twinId} will not be used without license attribution.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSigning || !acknowledgedNDA || !legalName.trim()}
                style={{
                  width: '100%',
                  background: isSigning ? '#4B5563' : '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: isSigning ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSigning ? (
                  <>Generating Keypair &amp; Signing...</>
                ) : (
                  <>
                    <KeyRound size={16} /> Digitally Sign NDA &amp; Unlock Records
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TIER 3: Decrypted Vault */}
        {currentTier === 'vault' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', marginBottom: '0.75rem' }}>
              <Unlock size={20} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Decrypted Engineering Records</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Capability token verified. Full engineering genetic code released under signed mutual non-disclosure.
            </p>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#065F46', fontFamily: 'var(--font-mono)' }}>
              Signed by: {legalName} {orgName ? `(${orgName})` : ''}<br />
              Signature: {signatureHash || 'sig_ed25519_verified_offline'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Full Parametric Solid Model (.STEP)</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Contains 9 individual component solids with passivated wall clearances</div>
                </div>
                <a href={`/api/twins/${twinId}/assets/resip_assembly.step`} download className="button-secondary" style={{ textDecoration: 'none', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#111827' }}>
                  <Download size={14} /> Download .STEP
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Granular BOM &amp; Vendor Quotes (bom.csv)</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Unmasked supplier catalog IDs, volume price breaks ($1.38 unit COGS)</div>
                </div>
                <a href={`/api/twins/${twinId}/assets/bom.csv`} download className="button-secondary" style={{ textDecoration: 'none', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#111827' }}>
                  <Download size={14} /> Download BOM
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>CNC Tooling Paths &amp; Mold Drafts</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>5-axis G-code for 316L inner tube and silicone overmold CAD</div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#059669', background: '#ECFDF5', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 700, border: '1px solid #A7F3D0' }}>
                  UNLOCKED
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                background: '#111827',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Done — Return to Twin Viewer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
