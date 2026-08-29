import React from 'react';
import { TwinData } from '@/lib/types';
import TwinViewer from './TwinViewer';
import TwinMetrics from './TwinMetrics';
import styles from './TwinHero.module.css';

interface TwinHeroProps {
  twin: TwinData;
}

export default function TwinHero({ twin }: TwinHeroProps) {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.viewerSection}>
        <TwinViewer twin={twin} />
      </div>
      <div className={styles.metricsSection}>
        <TwinMetrics properties={twin.current_version.properties} />
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <a 
            href={`http://127.0.0.1:8001/api/twins/${twin.id}/download`} 
            download 
            className="button-secondary" 
            style={{ flex: 1, textAlign: 'center', padding: '1rem', textDecoration: 'none' }}
          >
            Download Bundle
          </a>
          <button 
            className="button-primary" 
            style={{ flex: 1, padding: '1rem' }}
            onClick={() => alert('Fork functionality coming soon!')}
          >
            Fork Twin
          </button>
        </div>
      </div>
    </div>
  );
}
