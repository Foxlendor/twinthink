'use client';

import React from 'react';
import { GitFork, Download } from 'lucide-react';
import { TwinData } from '@/lib/types';
import { getApiUrl } from '@/lib/api';
import TwinViewer from './TwinViewer';
import TwinMetrics from './TwinMetrics';
import styles from './TwinHero.module.css';

interface TwinHeroProps {
  twin: TwinData;
}

export default function TwinHero({ twin }: TwinHeroProps) {
  const apiUrl = getApiUrl();

  return (
    <div className={styles.heroContainer}>
      <div className={styles.viewerSection}>
        <TwinViewer twin={twin} />
      </div>
      <div className={styles.metricsSection}>
        <TwinMetrics properties={twin.current_version.properties} />
        
        <div className={styles.heroActions}>
          <a 
            href={`${apiUrl}/api/twins/${twin.id}/download`} 
            download 
            className="button-secondary" 
            style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
          >
            <Download size={16} />
            Download Bundle
          </a>
          <button 
            className="button-primary" 
            style={{ flex: 1 }}
            onClick={() => alert('Fork functionality coming soon!')}
          >
            <GitFork size={16} />
            Fork Twin
          </button>
        </div>
      </div>
    </div>
  );
}
