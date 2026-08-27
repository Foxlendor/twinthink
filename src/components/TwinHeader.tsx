'use client';

import React from 'react';
import { GitFork, Download } from 'lucide-react';
import { TwinData } from '@/lib/types';
import styles from './TwinHeader.module.css';

interface TwinHeaderProps {
  twin: TwinData;
}

export default function TwinHeader({ twin }: TwinHeaderProps) {
  const version = twin.current_version;

  return (
    <div className={styles.headerContainer}>
      <div className={styles.topRow}>
        <div className={styles.titleSection}>
          <div className={styles.twinId}>TWIN #{twin.id}</div>
          <h1 className={styles.title}>{version.title}</h1>
        </div>
        <div className={styles.actionSection}>
          <button 
            className="button-primary"
            onClick={() => alert(`Forking Twin #${twin.id} functionality coming soon!`)}
          >
            <GitFork size={18} />
            FORK TWIN
          </button>
          <button 
            className="button-secondary"
            onClick={() => alert(`Downloading Twin #${twin.id} bundle...`)}
          >
            <Download size={18} />
            DOWNLOAD
          </button>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.creator}>@{twin.creator}</span>
        <span className={styles.divider}>•</span>
        <span className={styles.version}>v{version.semver}</span>
        <span className={styles.divider}>•</span>
        <span className={styles.license}>{version.license}</span>
      </div>

      {twin.lineage.parent && (
        <div className={styles.lineageInfo}>
          <GitFork size={14} />
          Forked from Twin #{twin.lineage.parent.parent_twin_id}
        </div>
      )}
    </div>
  );
}
