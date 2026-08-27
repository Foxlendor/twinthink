'use client';

import React from 'react';
import { TwinData } from '@/lib/types';
import { CheckCircle, AlertCircle } from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

export default function BuildsTab({ twin }: TabProps) {
  // Mock data for community builds
  const builds = [
    {
      id: 1,
      user: 'alexmaker',
      version: '1.0.0',
      status: 'verified',
      notes: 'Evidence submitted. Test results available.',
      date: '2 days ago'
    },
    {
      id: 2,
      user: 'somebody',
      version: '1.0.0',
      status: 'unverified',
      notes: '"I built this"',
      date: '5 hours ago'
    }
  ];

  return (
    <div className={styles.tabContentContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className={styles.sectionTitle}>Community Builds</h2>
        <button 
          className="button-secondary" 
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          onClick={() => alert('Submit Build functionality coming soon!')}
        >
          Submit Build
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {builds.map(build => (
          <div key={build.id} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            padding: '1.25rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            borderLeft: build.status === 'verified' ? '3px solid var(--success)' : '3px solid var(--warning)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {build.status === 'verified' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                    <CheckCircle size={16} /> VERIFIED BUILD
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--warning)', fontWeight: 600, fontSize: '0.875rem' }}>
                    <AlertCircle size={16} /> UNVERIFIED
                  </div>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{build.date}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>@{build.user}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>built v{build.version}</span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0, fontStyle: build.status === 'unverified' ? 'italic' : 'normal' }}>
              {build.notes}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
