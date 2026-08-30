'use client';

import React, { useState } from 'react';
import { TwinData } from '@/lib/types';
import styles from './TwinTabs.module.css';
import { getApiUrl } from '@/lib/api';

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
  const [activeTab, setActiveTab] = useState<RealityTabKey>('object');
  const [inspectedClaim, setInspectedClaim] = useState<string | null>(null);

  const apiUrl = getApiUrl();
  const stepAsset = twin.current_version.assets.find(a => a.entrypoint_name === 'cad_step');
  const stepDownloadUrl = stepAsset ? `${apiUrl}/api/twins/${twin.id}/assets/${stepAsset.relative_path}` : undefined;

  return (
    <div className={styles.tabsContainer}>
      {/* Reality Protocol Navigation Tabs */}
      <div className={styles.tabList} style={{ borderBottom: '2px solid #1f293d', paddingBottom: '0.25rem' }}>
        <button 
          className={`${styles.tab} ${activeTab === 'object' ? styles.active : ''}`}
          onClick={() => setActiveTab('object')}
        >
          OBJECT
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'structure' ? styles.active : ''}`}
          onClick={() => setActiveTab('structure')}
        >
          STRUCTURE
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'behavior' ? styles.active : ''}`}
          onClick={() => setActiveTab('behavior')}
          style={{ color: activeTab === 'behavior' ? '#3b82f6' : undefined }}
        >
          BEHAVIOR
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'evidence' ? styles.active : ''}`}
          onClick={() => setActiveTab('evidence')}
          style={{ color: activeTab === 'evidence' ? '#00e5a3' : undefined }}
        >
          EVIDENCE
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          HISTORY
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'lineage' ? styles.active : ''}`}
          onClick={() => setActiveTab('lineage')}
        >
          LINEAGE
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'files' ? styles.active : ''}`}
          onClick={() => setActiveTab('files')}
          style={{ fontSize: '0.75rem', opacity: 0.7 }}
        >
          RAW ASSETS
        </button>
      </div>
      
      {/* Tab Panels */}
      <div className={styles.tabContent} style={{ paddingTop: '1.5rem' }}>
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
        {activeTab === 'behavior' && <BehaviorTab twin={twin} />}
        {activeTab === 'evidence' && (
          <EvidenceTab 
            twin={twin} 
            onInspectClaim={(claimKey) => setInspectedClaim(claimKey)} 
          />
        )}
        {activeTab === 'history' && <HistoryTab twin={twin} />}
        {activeTab === 'lineage' && <LineageTab twin={twin} />}
        {activeTab === 'files' && <FilesTab twin={twin} />}
      </div>

      {/* Interactive WHY? Claim Inspector Modal */}
      <ClaimInspectorModal
        claimKey={inspectedClaim}
        onClose={() => setInspectedClaim(null)}
        twinId={twin.id}
      />
    </div>
  );
}
