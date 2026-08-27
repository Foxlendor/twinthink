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
        <TwinViewer url={twin.current_version.cad_glb_key ? twin.current_version.assets.find(a => a.relative_path === 'cad/preview.glb')?.url : undefined} />
      </div>
      <div className={styles.metricsSection}>
        <TwinMetrics metrics={twin.current_version.metrics} />
      </div>
    </div>
  );
}
