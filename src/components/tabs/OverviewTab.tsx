import React from 'react';
import { TwinData } from '@/lib/types';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

export default function OverviewTab({ twin }: TabProps) {
  return (
    <div className={styles.tabContentContainer}>
      <h2 className={styles.sectionTitle}>{twin.current_version.title}</h2>
      
      <div className={styles.contentBlock}>
        <p className={styles.summary}>{twin.current_version.summary}</p>
        
        {twin.lineage.parent && (
          <div className={styles.mutationBlock}>
            <h3 className={styles.subTitle}>Mutation Notes</h3>
            <p className={styles.mutationText}>{twin.lineage.parent.mutation_notes}</p>
          </div>
        )}
        
        <div className={styles.mutationBlock}>
          <h3 className={styles.subTitle}>License</h3>
          <p className={styles.mutationText}>{twin.current_version.license}</p>
        </div>
      </div>
    </div>
  );
}
