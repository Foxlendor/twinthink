'use client';

import React, { useState } from 'react';
import { TwinData } from '@/lib/types';
import styles from './TwinTabs.module.css';

// Tabs
import OverviewTab from './tabs/OverviewTab';
import SimulationTab from './tabs/SimulationTab';
import TestsTab from './tabs/TestsTab';
import BomTab from './tabs/BomTab';
import FilesTab from './tabs/FilesTab';
import LineageTab from './tabs/LineageTab';
import BuildsTab from './tabs/BuildsTab';

interface TwinTabsProps {
  twin: TwinData;
}

export default function TwinTabs({ twin }: TwinTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulation' | 'tests' | 'bom' | 'files' | 'lineage' | 'builds'>('overview');

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabList}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          OVERVIEW
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'simulation' ? styles.active : ''}`}
          onClick={() => setActiveTab('simulation')}
        >
          SIMULATION
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'tests' ? styles.active : ''}`}
          onClick={() => setActiveTab('tests')}
          style={{ color: activeTab === 'tests' ? '#00e5a3' : undefined }}
        >
          TESTS
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'bom' ? styles.active : ''}`}
          onClick={() => setActiveTab('bom')}
        >
          BOM
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'files' ? styles.active : ''}`}
          onClick={() => setActiveTab('files')}
        >
          FILES
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'lineage' ? styles.active : ''}`}
          onClick={() => setActiveTab('lineage')}
        >
          LINEAGE
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'builds' ? styles.active : ''}`}
          onClick={() => setActiveTab('builds')}
        >
          BUILDS
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'overview' && <OverviewTab twin={twin} />}
        {activeTab === 'simulation' && <SimulationTab twin={twin} />}
        {activeTab === 'tests' && <TestsTab twin={twin} />}
        {activeTab === 'bom' && <BomTab twin={twin} />}
        {activeTab === 'files' && <FilesTab twin={twin} />}
        {activeTab === 'lineage' && <LineageTab twin={twin} />}
        {activeTab === 'builds' && <BuildsTab twin={twin} />}
      </div>
    </div>
  );
}
