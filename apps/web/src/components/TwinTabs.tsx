'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TwinData } from '@/lib/types';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Box,
  Clock,
  FileText,
  Folder,
  GitFork,
  Layers,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
  Unlock,
  Award
} from 'lucide-react';
import BehaviorTab from './tabs/BehaviorTab';
import EvidenceTab from './tabs/EvidenceTab';
import HistoryTab from './tabs/HistoryTab';
import LineageTab from './tabs/LineageTab';
import PeerReviewTab from './tabs/PeerReviewTab';
import ThoughtLogsTab from './tabs/ThoughtLogsTab';
import StructureTab from './tabs/StructureTab';
import BomTab from './tabs/BomTab';
import FilesTab from './tabs/FilesTab';
import ClaimInspectorModal from './ClaimInspectorModal';
import AccessModal from './AccessModal';
import PublicConceptPreview from './PublicConceptPreview';
import { usePitchAccess } from '@/lib/usePitchAccess';

interface TwinTabsProps {
  twin: TwinData;
}

export type RealityTabKey =
  | 'object'
  | 'structure'
  | 'bom'
  | 'behavior'
  | 'evidence'
  | 'history'
  | 'thoughtlogs'
  | 'community'
  | 'lineage'
  | 'files';

const allTabs: Array<{ id: RealityTabKey; title: string; subtitle: string; icon: any }> = [
  { id: 'object', title: 'Concept Preview', subtitle: 'What is public?', icon: Box },
  { id: 'structure', title: 'Structure', subtitle: 'Engineering detail', icon: Layers },
  { id: 'bom', title: 'BOM Tree', subtitle: 'Materials & sourcing', icon: GitFork },
  { id: 'behavior', title: 'Behavior', subtitle: 'Functional detail', icon: Activity },
  { id: 'evidence', title: 'Testing & Evidence', subtitle: 'Technical evidence', icon: FileText },
  { id: 'history', title: 'History', subtitle: 'Development record', icon: Clock },
  { id: 'thoughtlogs', title: 'Thought Logs', subtitle: 'Development transcripts', icon: BookOpen },
  { id: 'community', title: 'Peer Review', subtitle: 'Approved community notes', icon: MessageSquare },
  { id: 'lineage', title: 'Lineage', subtitle: 'Derivation history', icon: GitFork },
  { id: 'files', title: 'All Files', subtitle: 'Engineering package', icon: Folder }
];

function RestrictedAccessCard({ 
  onRequestAccess,
  onUnlockWithCode
}: { 
  onRequestAccess: () => void;
  onUnlockWithCode: (code: string) => { success: boolean; message: string };
}) {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onUnlockWithCode(code);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setErrorMsg(null);
    }
  };

  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: '18px',
      background: '#FFFFFF',
      padding: '2.5rem 2rem',
      textAlign: 'center',
      maxWidth: '700px',
      margin: '1rem auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: '#F3F4F6',
        display: 'grid',
        placeItems: 'center',
        margin: '0 auto 1rem'
      }}>
        <LockKeyhole size={24} color="#4B5563" />
      </div>

      <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
        Restricted Engineering Detail
      </h2>
      <p style={{ margin: '0 auto 1.5rem', maxWidth: '520px', color: '#6B7280', lineHeight: 1.6, fontSize: '0.88rem' }}>
        CAD solid models, granular BOM suppliers, manufacturing tooling paths, and laboratory logs remain controlled by the inventor under Private Access protection.
      </p>

      {/* Instant Pitch Pass Unlock Form */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
        borderRadius: '12px',
        padding: '1.25rem',
        maxWidth: '480px',
        margin: '0 auto 1.5rem',
        textAlign: 'left',
        color: '#FFFFFF'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FCD34D', marginBottom: '0.25rem' }}>
          Pitch &amp; Investor Pass
        </div>
        <div style={{ fontSize: '0.72rem', color: '#C7D2FE', marginBottom: '0.75rem' }}>
          Have a pitch invite code? Enter it below to unlock immediately.
        </div>

        <form onSubmit={handleSubmitCode} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={code}
            onChange={e => {
              setCode(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="Try: PITCH2026 or INVESTOR"
            style={{
              flex: 1,
              padding: '0.55rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0B0F19',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)'
            }}
          />
          <button
            type="submit"
            style={{
              background: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '0.55rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Unlock Now
          </button>
        </form>

        {errorMsg && (
          <div style={{ color: '#F87171', fontSize: '0.72rem', marginTop: '0.5rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Quick chip demo helper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.65rem', fontSize: '0.68rem', color: '#94A3B8' }}>
          <span>Demo codes:</span>
          {['PITCH2026', 'INVESTOR', 'FOUNDER'].map(sample => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setCode(sample);
                onUnlockWithCode(sample);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#BFDBFE',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        <button
          onClick={onRequestAccess}
          style={{
            background: 'transparent',
            color: '#111827',
            border: '1px solid #D1D5DB',
            borderRadius: '999px',
            padding: '0.6rem 1.15rem',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          Sign Mutual NDA for Permanent Access
        </button>
      </div>
    </div>
  );
}

export default function TwinTabs({ twin }: TwinTabsProps) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab: RealityTabKey =
    rawTab && allTabs.some(t => t.id === rawTab) ? rawTab as RealityTabKey : 'object';

  const [activeTab, setActiveTab] = useState<RealityTabKey>(initialTab);
  const [inspectedClaim, setInspectedClaim] = useState<string | null>(null);
  const [showDisclosureGate, setShowDisclosureGate] = useState(false);
  const [ndaVaultUnlocked, setNdaVaultUnlocked] = useState(false);

  const { isUnlocked: isPitchUnlocked, activeCode, unlockWithCode, relock } = usePitchAccess();
  const isTechnicalUnlocked = isPitchUnlocked || ndaVaultUnlocked;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && allTabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam as RealityTabKey);
    }
  }, [searchParams]);

  const publicTabs = useMemo(() => {
    const configured = twin.current_version.disclosure?.public_tabs;
    return configured && configured.length > 0 ? configured : ['object'];
  }, [twin.current_version.disclosure]);

  const isPublicTab = publicTabs.includes(activeTab);

  const renderActiveTab = () => {
    if (activeTab === 'object') {
      return (
        <PublicConceptPreview
          twin={twin}
          onRequestAccess={() => setShowDisclosureGate(true)}
        />
      );
    }

    // If tab is restricted and neither pitch code nor NDA vault is unlocked
    if (!isPublicTab && !isTechnicalUnlocked) {
      return (
        <RestrictedAccessCard
          onRequestAccess={() => setShowDisclosureGate(true)}
          onUnlockWithCode={(c) => unlockWithCode(c)}
        />
      );
    }

    if (activeTab === 'structure') {
      return (
        <StructureTab
          twinId={twin.id}
          onInspectClaim={(claimKey) => setInspectedClaim(claimKey)}
        />
      );
    }

    if (activeTab === 'bom') {
      return <BomTab twin={twin} />;
    }

    if (activeTab === 'files') {
      return <FilesTab twin={twin} />;
    }

    if (activeTab === 'behavior') {
      return <BehaviorTab twin={twin} />;
    }

    if (activeTab === 'evidence') {
      return <EvidenceTab twin={twin} onInspectClaim={(claimKey) => setInspectedClaim(claimKey)} />;
    }

    if (activeTab === 'history') {
      return <HistoryTab twin={twin} />;
    }

    if (activeTab === 'thoughtlogs') {
      return <ThoughtLogsTab />;
    }

    if (activeTab === 'community') {
      return <PeerReviewTab twinId={twin.id} />;
    }

    if (activeTab === 'lineage') {
      return <LineageTab twin={twin} />;
    }

    return (
      <RestrictedAccessCard
        onRequestAccess={() => setShowDisclosureGate(true)}
        onUnlockWithCode={(c) => unlockWithCode(c)}
      />
    );
  };

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '2rem 1.75rem 8rem'
    }}>
      <div className="twin-layout" style={{
        display: 'flex',
        gap: '2.5rem',
        alignItems: 'flex-start'
      }}>
        <aside className="twin-sidebar" style={{
          width: '240px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          position: 'sticky',
          top: '5rem'
        }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: '#6B7280',
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              marginBottom: '1rem'
            }}
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>

          <div style={{
            padding: '0.75rem',
            border: '1px solid #BBF7D0',
            background: '#F0FDF4',
            borderRadius: '10px',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#166534',
              letterSpacing: '0.05em'
            }}>
              <ShieldCheck size={13} />
              PUBLIC CONCEPT
            </div>
            <div style={{ fontSize: '0.72rem', color: '#4B5563', marginTop: '0.3rem', lineHeight: 1.4 }}>
              Public access is limited to inventor-approved disclosure.
            </div>
          </div>

          {allTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPublic = publicTabs.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  border: isActive ? '1px solid #E5E7EB' : '1px solid transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Icon size={18} color={isActive ? '#111827' : '#9CA3AF'} style={{ marginTop: '2px' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#111827' : '#4B5563'
                  }}>
                    {item.title}
                    {!isPublic && <LockKeyhole size={11} color="#9CA3AF" />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '1px' }}>
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          {isTechnicalUnlocked && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: '#065F46'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <Unlock size={15} color="#059669" />
                <span>
                  Pitch &amp; Vault Access Active {activeCode ? `(${activeCode})` : ''}: Private Engineering Disclosed
                </span>
              </div>
              <button
                onClick={relock}
                style={{
                  background: 'transparent',
                  border: '1px solid #059669',
                  color: '#059669',
                  borderRadius: '6px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Relock
              </button>
            </div>
          )}

          {/* Universal Twin Identity Bar */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div style={{ minWidth: 0, flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#4B5563',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)'
                }}>
                  TWIN #{twin.id.toUpperCase()}
                </span>
                <span style={{ color: '#D1D5DB' }}>/</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Award size={11} />
                  {twin.status || 'Verified Record'}
                </span>
                {twin.domain && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#4B5563',
                    background: '#F3F4F6',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px'
                  }}>
                    {twin.domain}
                  </span>
                )}
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontFamily: 'var(--font-mono)'
                }}>
                  v{twin.current_version.semver || '1.0.0'}
                </span>
              </div>

              <h1 style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                margin: '0 0 0.25rem',
                color: '#111827',
                letterSpacing: '-0.3px',
                lineHeight: 1.25
              }}>
                {twin.current_version.title}
              </h1>

              <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Creator: <strong style={{ color: '#374151' }}>@{twin.creator || 'johne.boi'}</strong></span>
                <span>•</span>
                <span>License: <strong style={{ color: '#374151' }}>{twin.current_version.license || 'CERN-OHL-S-2.0'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
              <button
                onClick={() => setShowDisclosureGate(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  border: isTechnicalUnlocked ? '1px solid #059669' : '1px solid #111827',
                  background: isTechnicalUnlocked ? '#ECFDF5' : '#111827',
                  color: isTechnicalUnlocked ? '#065F46' : '#FFFFFF',
                  borderRadius: '8px',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s'
                }}
              >
                {isTechnicalUnlocked ? <Unlock size={13} /> : <LockKeyhole size={13} />}
                {isTechnicalUnlocked ? 'Manage Pitch / Vault Pass' : 'Pitch Pass / Technical Access'}
              </button>
            </div>
          </div>

          {renderActiveTab()}
        </main>
      </div>

      <ClaimInspectorModal
        claimKey={inspectedClaim}
        onClose={() => setInspectedClaim(null)}
        twinId={twin.id}
      />

      {showDisclosureGate && (
        <AccessModal
          twinId={twin.id}
          creator={twin.creator || 'inventor'}
          onClose={() => setShowDisclosureGate(false)}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .twin-layout {
            flex-direction: column !important;
          }
          .twin-sidebar {
            width: 100% !important;
            position: relative !important;
            top: 0 !important;
          }
        }
      `}} />
    </div>
  );
}
