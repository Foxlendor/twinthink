'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TwinData } from '@/lib/types';
import { getApiUrl } from '@/lib/api';
import { 
  Box, 
  Layers, 
  Activity, 
  FileText, 
  Clock, 
  GitFork, 
  Folder, 
  ArrowLeft, 
  ChevronDown,
  Download
} from 'lucide-react';

// Reality Protocol Tabs
import ObjectTab from './tabs/ObjectTab';
import StructureTab from './tabs/StructureTab';
import BehaviorTab from './tabs/BehaviorTab';
import EvidenceTab from './tabs/EvidenceTab';
import HistoryTab from './tabs/HistoryTab';
import LineageTab from './tabs/LineageTab';
import FilesTab from './tabs/FilesTab';

// WHY? Claim Inspector Modal
import ClaimInspectorModal from './ClaimInspectorModal';

interface TwinTabsProps {
  twin: TwinData;
}

export type RealityTabKey = 'object' | 'structure' | 'behavior' | 'evidence' | 'history' | 'lineage' | 'files';

export default function TwinTabs({ twin }: TwinTabsProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as RealityTabKey) || 'structure';
  
  const [activeTab, setActiveTab] = useState<RealityTabKey>(initialTab);
  const [inspectedClaim, setInspectedClaim] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as RealityTabKey;
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const apiUrl = getApiUrl();
  const stepAsset = twin.current_version.assets.find(a => a.entrypoint_name === 'cad_step');
  const stepDownloadUrl = stepAsset ? `${apiUrl}/api/twins/${twin.id}/assets/${stepAsset.relative_path}` : undefined;

  const sidebarItems: Array<{ id: RealityTabKey; title: string; subtitle: string; icon: any }> = [
    { id: 'object', title: 'Object', subtitle: 'What is it?', icon: Box },
    { id: 'structure', title: 'Structure', subtitle: 'What is it made of?', icon: Layers },
    { id: 'behavior', title: 'Behavior', subtitle: 'What does it do?', icon: Activity },
    { id: 'evidence', title: 'Evidence', subtitle: 'What supports it?', icon: FileText },
    { id: 'history', title: 'History', subtitle: 'How did it become this?', icon: Clock },
    { id: 'lineage', title: 'Lineage', subtitle: 'Where did it come from?', icon: GitFork },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '2.5rem',
      maxWidth: '1120px',
      margin: '0 auto',
      padding: '2rem 1.5rem 6rem 1.5rem',
      alignItems: 'flex-start'
    }}>
      
      {/* 1. Left Sidebar Navigation */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        position: 'sticky',
        top: '5rem'
      }}>
        {/* Back Link */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: '#6B7280',
            fontWeight: 500,
            textDecoration: 'none',
            padding: '0.5rem 0.75rem',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        {/* Protocol Nav Items */}
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
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
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? '#111827' : '#9CA3AF'} style={{ marginTop: '2px' }} />
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#111827' : '#4B5563'
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9CA3AF',
                  marginTop: '1px'
                }}>
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}

        <div style={{ height: '1px', background: '#E5E7EB', margin: '0.75rem 0.5rem' }} />

        {/* Raw Files */}
        <button
          onClick={() => setActiveTab('files')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.75rem',
            borderRadius: '8px',
            background: activeTab === 'files' ? '#FFFFFF' : 'transparent',
            border: activeTab === 'files' ? '1px solid #E5E7EB' : '1px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            color: activeTab === 'files' ? '#111827' : '#6B7280',
            fontSize: '0.8125rem',
            fontWeight: 500
          }}
        >
          <Folder size={16} />
          All Files
        </button>
      </aside>

      {/* 2. Main Content Area */}
      <main style={{ flex: 1, minWidth: 0 }}>
        
        {/* Top Breadcrumb & View Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#6B7280',
            fontFamily: 'var(--font-mono)'
          }}>
            Twin #{twin.id} &nbsp;/&nbsp; <strong style={{ color: '#111827' }}>RESIP™</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href={`${apiUrl}/api/twins/${twin.id}/download`}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                color: '#374151',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              <Download size={13} />
              Bundle
            </a>
          </div>
        </div>

        {/* Tab View Container */}
        <div>
          {activeTab === 'object' && (
            <ObjectTab 
              twin={twin} 
              onInspectClaim={(claimKey) => setInspectedClaim(claimKey)} 
            />
          )}

          {activeTab === 'structure' && (
            <StructureTab 
              twinId={twin.id} 
              stepDownloadUrl={stepDownloadUrl} 
              onInspectClaim={(claimKey) => setInspectedClaim(claimKey)} 
            />
          )}

          {activeTab === 'behavior' && (
            <BehaviorTab twin={twin} />
          )}

          {activeTab === 'evidence' && (
            <EvidenceTab 
              twin={twin} 
              onInspectClaim={(claimKey) => setInspectedClaim(claimKey)} 
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab twin={twin} />
          )}

          {activeTab === 'lineage' && (
            <LineageTab twin={twin} />
          )}

          {activeTab === 'files' && (
            <FilesTab twin={twin} />
          )}
        </div>

      </main>

      {/* WHY? Provenance Modal */}
      <ClaimInspectorModal
        claimKey={inspectedClaim}
        onClose={() => setInspectedClaim(null)}
        twinId={twin.id}
      />
    </div>
  );
}
