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
  ShieldCheck
} from 'lucide-react';

import BehaviorTab from './tabs/BehaviorTab';
import EvidenceTab from './tabs/EvidenceTab';
import HistoryTab from './tabs/HistoryTab';
import LineageTab from './tabs/LineageTab';
import PeerReviewTab from './tabs/PeerReviewTab';
import ThoughtLogsTab from './tabs/ThoughtLogsTab';
import ClaimInspectorModal from './ClaimInspectorModal';
import DisclosureGateModal from './DisclosureGateModal';
import PublicConceptPreview from './PublicConceptPreview';

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

function RestrictedAccessCard({ onRequestAccess }: { onRequestAccess: () => void }) {
  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: '18px',
      background: '#FFFFFF',
      padding: '3rem 2rem',
      textAlign: 'center',
      maxWidth: '700px',
      margin: '1rem auto'
    }}>
      <LockKeyhole size={30} color="#6B7280" style={{ marginBottom: '0.85rem' }} />
      <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800 }}>
        Restricted technical detail
      </h2>
      <p style={{ margin: '0 auto 1.25rem', maxWidth: '520px', color: '#6B7280', lineHeight: 1.6, fontSize: '0.88rem' }}>
        This section is not part of the public concept disclosure. Engineering drawings,
        complete BOM data, source files, and other sensitive material remain controlled by
        the inventor.
      </p>
      <button
        onClick={onRequestAccess}
        style={{
          background: '#111827',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '999px',
          padding: '0.7rem 1.15rem',
          fontWeight: 700,
          fontSize: '0.8rem',
          cursor: 'pointer'
        }}
      >
        Request Technical Access
      </button>
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

    if (!isPublicTab) {
      return <RestrictedAccessCard onRequestAccess={() => setShowDisclosureGate(true)} />;
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

    return <RestrictedAccessCard onRequestAccess={() => setShowDisclosureGate(true)} />;
  };

  return (
    <div style={{
      maxWidth: '1120px',
      margin: '0 auto',
      padding: '2rem 1.5rem 6rem'
    }}>
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        alignItems: 'flex-start'
      }}>
        <aside style={{
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid #E5E7EB',
            flexWrap: 'wrap'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#6B7280',
              fontFamily: 'var(--font-mono)'
            }}>
              PUBLIC TWIN / {twin.id}
            </div>
            <button
              onClick={() => setShowDisclosureGate(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '1px solid #111827',
                background: '#FFFFFF',
                color: '#111827',
                borderRadius: '999px',
                padding: '0.5rem 0.8rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <LockKeyhole size={13} />
              Request Technical Access
            </button>
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
        <DisclosureGateModal
          twinId={twin.id}
          creator={twin.creator || 'inventor'}
          onClose={() => setShowDisclosureGate(false)}
        />
      )}
    </div>
  );
}
