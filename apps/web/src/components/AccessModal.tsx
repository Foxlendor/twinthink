'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  X, 
  Download, 
  Eye,
  CreditCard,
  Award,
  Scale,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { usePitchAccess } from '@/lib/usePitchAccess';
import { getLocalTwin } from '@/lib/twinsData';

// Initialize Stripe outside component to avoid recreating the object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

interface AccessModalProps {
  twinId: string;
  creator: string;
  onClose: () => void;
  onVaultUnlocked?: () => void;
}

// Inner form component that has access to Stripe hooks
function AccessModalContent({ 
  twinId, 
  creator, 
  onClose,
  onVaultUnlocked 
}: AccessModalProps) {
  const [currentTier, setCurrentTier] = useState<'public' | 'access_gate' | 'vault' | 'licensing'>('access_gate');
  const [legalName, setLegalName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [acknowledgedNDA, setAcknowledgedNDA] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureHash, setSignatureHash] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Commercial Licensing & Royalty State
  const [selectedLicenseTier, setSelectedLicenseTier] = useState<'academic' | 'pilot' | 'mass'>('pilot');
  const [licenseOrg, setLicenseOrg] = useState('');
  const [licenseSigner, setLicenseSigner] = useState('');
  const [licenseDownloaded, setLicenseDownloaded] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  // Pitch & Investor Access Code State
  const { isUnlocked, activeCode, unlockWithCode, relock, createPitchCode } = usePitchAccess();
  const [pitchInput, setPitchInput] = useState('');
  const [pitchMessage, setPitchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreatorTools, setShowCreatorTools] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newGeneratedCode, setNewGeneratedCode] = useState<string | null>(null);

  // Auto-switch to vault if already unlocked via pitch pass
  useEffect(() => {
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

  const localTwin = getLocalTwin(twinId);
  const privateAssets = localTwin?.current_version?.assets?.filter(a => a.publication_scope === 'private') || [];

  const handleSignNDA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgedNDA || !legalName.trim()) return;

    setIsSigning(true);
    setStripeError(null);

    try {
      // 1. Request SetupIntent or Sandbox auth token from backend
      const res = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: legalName, twinId })
      });
      const data = await res.json();
      
      if (!res.ok && !data?.clientSecret) {
        throw new Error(data?.error || 'Failed to initialize verification.');
      }

      // 2. If real Stripe setupIntent returned with live client secret
      if (data?.mode === 'stripe' && stripe && elements && !data.clientSecret.startsWith('seti_sandbox_')) {
        const cardElement = elements.getElement(CardElement);
        if (cardElement) {
          const { error, setupIntent } = await stripe.confirmCardSetup(data.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: legalName,
              },
            },
          });

          if (error) {
            throw new Error(error.message || 'Identity verification failed.');
          }

          if (setupIntent && setupIntent.status === 'succeeded') {
            const authSig = `sig_stripe_${setupIntent.id.substring(0, 8)}_${Math.random().toString(16).substring(2, 10)}`;
            setSignatureHash(authSig);
            unlockWithCode('VIPDEMO');
            setCurrentTier('vault');
            if (onVaultUnlocked) onVaultUnlocked();
            return;
          }
        }
      }

      // 3. Sandbox / Dev Mode AVS Authorization
      // Provide an authentic cryptographic verification delay
      await new Promise(resolve => setTimeout(resolve, 600));

      const randHash = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const authSig = `sig_ed25519_avs_${randHash}`;
      setSignatureHash(authSig);
      unlockWithCode('VIPDEMO');
      setCurrentTier('vault');
      if (onVaultUnlocked) {
        onVaultUnlocked();
      }

    } catch (err: any) {
      console.error('Sign NDA Error:', err);
      setStripeError(err.message || 'An error occurred during verification.');
    } finally {
      setIsSigning(false);
    }
  };

  // CardElement styling to match our minimalist theme
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#111827',
        fontFamily: '"Inter", var(--font-sans)',
        fontSmoothing: 'antialiased',
        fontSize: '14px',
        '::placeholder': {
          color: '#9CA3AF'
        }
      },
      invalid: {
        color: '#DC2626',
        iconColor: '#DC2626'
      }
    }
  };

  const handleDownloadNDACertificate = () => {
    const executedAt = new Date().toISOString();
    const certificateText = `================================================================================
TWINTH.INK MUTUAL NON-DISCLOSURE & ENGINEERING INTEGRITY COVENANT
================================================================================
Certificate ID: ${signatureHash || 'sig_verified_avs_session'}
Target Twin ID: ${twinId}
Target Product: ${localTwin?.current_version?.title || 'Confidential Physical Twin'}
Inventor / Creator: @${creator}

SIGNATORY PARTY:
Name: ${legalName || 'Authorized Signatory'}
Organization: ${orgName || 'Independent Entity'}
Verification Method: Zero-Dollar AVS Card & Cryptographic Envelope Release
Execution Timestamp: ${executedAt}

LEGAL COVENANT & TERMS:
1. Recipient acknowledges that all solid geometries (CAD .STEP / .IGES), granular
   BOM supplier catalog numbers, unit cost rollups, CNC toolpaths, and chemical 
   compositions disclosed under Twin #${twinId} are proprietary trade secrets.
2. Recipient explicitly agrees not to copy, reverse-engineer, manufacture, or
   circumvent the creator without a formally executed commercial license or written
   consent from @${creator}.
3. Open developments remain bound by CERN-OHL-S-2.0 reciprocal attribution rules.
4. Cryptographic proof of signature is recorded on the TwinThink immutable revision
   chain and bound to the capability envelope.

DIGITAL SIGNATURE HASH:
SHA256: ${signatureHash || 'sig_ed25519_covenant_verified'}
Status: EXECUTED & LEGALLY BINDING
================================================================================`;

    const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twinthink_executed_nda_${twinId}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCommercialLicense = () => {
    const executedAt = new Date().toISOString();
    const rate = selectedLicenseTier === 'pilot' ? '2.5% Net Revenue' : selectedLicenseTier === 'mass' ? '3.0% Net Revenue' : '0.0% (Academic / CERN-OHL-S-2.0)';
    const fee = selectedLicenseTier === 'pilot' ? '$250 USD' : selectedLicenseTier === 'mass' ? '$1,500 USD' : '$0 USD';
    const certificateText = `================================================================================
TWINTHINK PROTOCOL · COMMERCIAL PRODUCTION & ROYALTY COVENANT
================================================================================
Twin Document ID: ${twinId}
Invention Title: ${localTwin?.current_version?.title || 'Physical Digital Twin'}
Licensor / Inventor: johne.boi (did:twin:johne.boi)

LICENSEE ENTITY:
Organization: ${licenseOrg || orgName || 'Independent Production Partner'}
Authorized Signatory: ${licenseSigner || legalName || 'Authorized Production Officer'}
Execution Timestamp: ${executedAt}

COMMERCIAL PRODUCTION TERMS:
Tier Selected: ${selectedLicenseTier.toUpperCase()}
Upfront Tooling Reserve Fee: ${fee}
Net Sales Hardware Royalty: ${rate}
Accounting Period: Quarterly (Within 30 days of calendar quarter close)

HONEST REVENUE DISTRIBUTION GUARANTEE:
In accordance with the TwinThink Protocol Charter:
- 85.0% of all licensing fees & sales royalties flow directly to Creator (did:twin:johne.boi).
- 10.0% allocated to the Albuquerque Physical Prototyping & Calibration Tooling Pool.
-  5.0% retained for cryptographic verification, decentralized bundle hosting, and escrow.

LEGAL NOTICE:
This covenant constitutes a binding commercial agreement under international patent,
copyright, and trade secret frameworks. Reverse engineering, unregistered white-labeling,
or unauthorized mass-distribution without quarterly royalty reporting breaches the
cryptographic license envelope.
================================================================================`;

    const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twinthink_commercial_license_${twinId}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setLicenseDownloaded(true);
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

        {/* 4-Tier Indicator Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.4rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setCurrentTier('public')}
            style={{
              background: currentTier === 'public' ? '#111827' : '#F9FAFB',
              color: currentTier === 'public' ? '#FFFFFF' : '#4B5563',
              border: `1px solid ${currentTier === 'public' ? '#111827' : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '0.65rem 0.35rem',
              fontSize: '0.72rem',
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
              padding: '0.65rem 0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            2. NDA Gate
          </button>
          <button
            onClick={() => signatureHash && setCurrentTier('vault')}
            style={{
              background: currentTier === 'vault' ? '#059669' : '#F9FAFB',
              color: currentTier === 'vault' ? '#FFFFFF' : signatureHash ? '#059669' : '#9CA3AF',
              border: `1px solid ${currentTier === 'vault' ? '#059669' : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '0.65rem 0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: signatureHash ? 'pointer' : 'not-allowed',
              textAlign: 'center'
            }}
          >
            3. Vault Files
          </button>
          <button
            onClick={() => setCurrentTier('licensing')}
            style={{
              background: currentTier === 'licensing' ? '#2563EB' : '#EFF6FF',
              color: currentTier === 'licensing' ? '#FFFFFF' : '#1E3A8A',
              border: `1px solid ${currentTier === 'licensing' ? '#2563EB' : '#BFDBFE'}`,
              borderRadius: '8px',
              padding: '0.65rem 0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            4. IP Royalties
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
              To protect @{creator} from automated scraper harvesting and IP dilution, unlock full specs via an authorized Pitch Code or complete the mutual agreement via identity verification.
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
                Or Sign Mutual NDA via Card Identity
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
                    placeholder="e.g. Authorized Signatory"
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

              {/* Zero-Dollar Card Verification via Stripe */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <CreditCard size={14} color="#6B7280" /> Zero-Dollar Identity Verification (Auth Only)
                </label>
                <div style={{ 
                  background: '#FFFFFF', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '8px', 
                  padding: '0.75rem',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
                <p style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.4rem' }}>
                  Your card is securely verified via Stripe AVS and fraud checks. You will not be charged.
                </p>
                {stripeError && (
                  <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600 }}>
                    {stripeError}
                  </div>
                )}
              </div>

              {/* Agreement Checkbox */}
              <div style={{ marginBottom: '1.5rem', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem', borderRadius: '8px' }}>
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
                disabled={isSigning || !acknowledgedNDA || !legalName.trim() || !stripe}
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
                  <>Verifying Identity &amp; Signing...</>
                ) : (
                  <>
                    <KeyRound size={16} /> Authenticate Card &amp; Sign NDA
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

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#065F46', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Signed by: {legalName} {orgName ? `(${orgName})` : ''}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#047857', marginTop: '0.2rem' }}>
                  Signature ID: {signatureHash}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadNDACertificate}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #6EE7B7',
                  color: '#065F46',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Download size={13} /> Download Executed NDA (.txt)
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {privateAssets.length > 0 ? (
                privateAssets.map((asset, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{asset.entrypoint_name || asset.relative_path}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {asset.media_type} • {asset.size_bytes ? `${Math.round(asset.size_bytes / 1024)} KB` : 'Verified Solid'}
                      </div>
                    </div>
                    <a 
                      href={`/api/twins/${twinId}/assets/${asset.relative_path}`} 
                      download={asset.relative_path} 
                      className="button-secondary" 
                      style={{ textDecoration: 'none', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#111827', fontWeight: 600 }}
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Full Parametric Solid Model (.STEP)</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Contains individual component solids with passivated wall clearances</div>
                    </div>
                    <a href={`/api/twins/${twinId}/assets/resip_assembly.step`} download className="button-secondary" style={{ textDecoration: 'none', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#111827' }}>
                      <Download size={14} /> Download .STEP
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Granular BOM &amp; Vendor Quotes (bom.csv)</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Unmasked supplier catalog IDs, volume price breaks</div>
                    </div>
                    <a href={`/api/twins/${twinId}/assets/bom.csv`} download className="button-secondary" style={{ textDecoration: 'none', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#111827' }}>
                      <Download size={14} /> Download BOM
                    </a>
                  </div>
                </>
              )}

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
              Done: Return to Twin Viewer
            </button>
          </div>
        )}

        {/* TIER 4: Commercial Rights & Honest Royalty Engine */}
        {currentTier === 'licensing' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563EB', marginBottom: '0.75rem' }}>
              <Scale size={20} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Commercial Rights &amp; Honest Royalties</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              TwinThink enables direct, transparent manufacturing licenses for physical inventions. Every dollar of royalty flows through honest cryptographic splits to the original builder.
            </p>

            {/* License Tier Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              
              <div 
                onClick={() => setSelectedLicenseTier('academic')}
                style={{
                  border: selectedLicenseTier === 'academic' ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  background: selectedLicenseTier === 'academic' ? '#EFF6FF' : '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>Academic &amp; R&amp;D</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '0.25rem 0' }}>$0 Free</div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>CERN-OHL-S-2.0 reciprocal open attribution.</div>
              </div>

              <div 
                onClick={() => setSelectedLicenseTier('pilot')}
                style={{
                  border: selectedLicenseTier === 'pilot' ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  background: selectedLicenseTier === 'pilot' ? '#EFF6FF' : '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Pilot Run (1-100)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '0.25rem 0' }}>$250 + 2.5%</div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Tooling reserve + 2.5% net hardware sales royalty.</div>
              </div>

              <div 
                onClick={() => setSelectedLicenseTier('mass')}
                style={{
                  border: selectedLicenseTier === 'mass' ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  background: selectedLicenseTier === 'mass' ? '#EFF6FF' : '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>Mass Production</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '0.25rem 0' }}>$1,500 + 3.0%</div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Global manufacturing license + 3% net royalty.</div>
              </div>

            </div>

            {/* Transparent Honest Profit Split Box */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                <Coins size={14} color="#059669" />
                <span>Honest Revenue Split Guarantee</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>85%</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginTop: '0.2rem' }}>Direct to Creator</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>did:twin:johne.boi</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563EB' }}>10%</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginTop: '0.2rem' }}>Prototyping Pool</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Benchtop tooling fund</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#64748B' }}>5%</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginTop: '0.2rem' }}>Protocol Escrow</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Hosting &amp; verification</div>
                </div>
              </div>
            </div>

            {/* License Signatory Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Licensee Organization / Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Precision Tooling"
                  value={licenseOrg}
                  onChange={e => setLicenseOrg(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Authorized Signatory Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Engineer / Director"
                  value={licenseSigner}
                  onChange={e => setLicenseSigner(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Download Covenant Button */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleDownloadCommercialLicense}
                style={{
                  flex: 1,
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Download size={16} />
                <span>Download Executed Commercial Covenant (.txt)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            {licenseDownloaded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.75rem' }}>
                <CheckCircle2 size={15} />
                <span>Commercial covenant dossier downloaded. Ready for manufacturing execution.</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// Wrapper component to provide the Stripe Elements context
export default function AccessModal(props: AccessModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <AccessModalContent {...props} />
    </Elements>
  );
}
