'use client';

import React from 'react';
import { GitFork, Download, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { TwinData } from '@/lib/types';
import { getApiUrl } from '@/lib/api';
import styles from './TwinHeader.module.css';

interface TwinHeaderProps {
  twin: TwinData;
}

export default function TwinHeader({ twin }: TwinHeaderProps) {
  const version = twin.current_version;
  const apiUrl = getApiUrl();

  return (
    <div className={styles.headerContainer}>
      <div className={styles.topRow}>
        <div className={styles.titleSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--accent-primary), #00e5a3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)'
            }}>
              Twin #{twin.id}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#00e5a3',
              background: 'rgba(0, 229, 163, 0.1)',
              border: '1px solid rgba(0, 229, 163, 0.3)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Award size={12} />
              LIVING ENGINEERING RECORD
            </span>
          </div>

          <h1 className={styles.title} style={{ fontSize: '2rem', letterSpacing: '-0.5px', marginBottom: '0.2rem' }}>
            RESIP™
          </h1>
          <div style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            A self-heating drink straw for backcountry recreation
          </div>
        </div>

        <div className={styles.actionSection}>
          <a 
            href={`${apiUrl}/api/twins/${twin.id}/download`}
            download
            className="button-secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            DOWNLOAD BUNDLE
          </a>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.creator}>Creator: @{twin.creator}</span>
        <span className={styles.divider}>•</span>
        <span className={styles.version}>v{version.version || version.semver || '1.0.0'}</span>
        <span className={styles.divider}>•</span>
        <span className={styles.license}>{version.license}</span>
        <span className={styles.divider}>•</span>
        <span style={{ color: 'var(--text-muted)' }}>Status: <strong>PROTOTYPE / EVIDENCE-BACKED</strong></span>
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
