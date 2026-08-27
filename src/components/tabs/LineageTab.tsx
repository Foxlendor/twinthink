import React from 'react';
import { TwinData } from '@/lib/types';
import { GitFork, ArrowDown } from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

export default function LineageTab({ twin }: TabProps) {
  const { lineage } = twin;

  return (
    <div className={styles.tabContentContainer}>
      <h2 className={styles.sectionTitle}>Invention Lineage</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', fontFamily: 'var(--font-mono)' }}>
        
        {/* Parent Twin */}
        {lineage.parent ? (
          <>
            <div style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', width: '300px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>TWIN #{lineage.parent.parent_twin_id}</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>v{lineage.parent.parent_version}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem 0' }}>
              <div style={{ width: '2px', height: '30px', background: 'var(--border-strong)' }}></div>
              <div style={{ 
                margin: '0.5rem 0', 
                padding: '0.5rem 1rem', 
                background: 'var(--bg-elevated)', 
                border: '1px dashed var(--accent-primary)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                maxWidth: '400px',
                textAlign: 'center'
              }}>
                <span style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.25rem' }}>+ MUTATION</span>
                {lineage.parent.mutation_notes}
              </div>
              <div style={{ width: '2px', height: '30px', background: 'var(--border-strong)' }}></div>
              <ArrowDown size={16} color="var(--border-strong)" style={{ marginTop: '-4px' }} />
            </div>
          </>
        ) : (
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
            Root Invention (No Parent)
          </div>
        )}

        {/* Current Twin */}
        <div style={{ 
          padding: '1.25rem', 
          border: '2px solid var(--accent-primary)', 
          borderRadius: 'var(--radius-md)', 
          background: 'var(--bg-tertiary)', 
          width: '320px', 
          textAlign: 'center',
          boxShadow: '0 0 20px var(--accent-dim)'
        }}>
          <div style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <GitFork size={14} />
            CURRENT TWIN #{twin.id}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>v{twin.current_version.semver}</div>
        </div>

        {/* Descendants Mock */}
        {lineage.descendants && lineage.descendants.length === 0 && (
          <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No forks yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}
