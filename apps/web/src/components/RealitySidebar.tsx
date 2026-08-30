'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  Activity, 
  FileCheck2, 
  Clock, 
  GitFork, 
  Compass, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  FlaskConical,
  Atom,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import styles from './RealityEngine.module.css';

interface SidebarProps {
  activeLayer: string;
  setActiveLayer: (layer: string) => void;
  onOpenOmega: () => void;
  onOpenSearch?: () => void;
}

export default function RealitySidebar({ 
  activeLayer, 
  setActiveLayer, 
  onOpenOmega 
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.brandContainer}>
        <div className={styles.brandLogo}>
          <Box size={22} color="#00ccff" />
          <span className={styles.brandTitle}>TWINTH.INK</span>
        </div>
        <div className={styles.brandTagline}>GIVE AN IDEA A REALITY</div>
      </div>

      {/* Explore Section */}
      <div className={styles.navSection}>
        <div className={styles.navSectionHeader}>EXPLORE</div>
        <button 
          className={`${styles.navItem} ${activeLayer === 'object' ? styles.active : ''}`}
          onClick={() => setActiveLayer('object')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={styles.activeDot} />
            <span style={{ fontWeight: 700, color: '#fff' }}>RESIP™</span>
          </div>
          <span className={styles.twinIdBadge}>Twin #0001</span>
        </button>

        {/* Reality Layers Submenu */}
        <div className={styles.layerSubmenu}>
          <button 
            className={`${styles.layerSubItem} ${activeLayer === 'object' ? styles.subActive : ''}`}
            onClick={() => setActiveLayer('object')}
          >
            <Box size={14} /> OVERVIEW
          </button>
          <button 
            className={`${styles.layerSubItem} ${activeLayer === 'structure' ? styles.subActive : ''}`}
            onClick={() => setActiveLayer('structure')}
          >
            <Layers size={14} /> STRUCTURE
          </button>
          <button 
            className={`${styles.layerSubItem} ${activeLayer === 'behavior' ? styles.subActive : ''}`}
            onClick={() => setActiveLayer('behavior')}
          >
            <Activity size={14} /> BEHAVIOR
          </button>
          <button 
            className={`${styles.layerSubItem} ${activeLayer === 'evidence' ? styles.subActive : ''}`}
            onClick={() => setActiveLayer('evidence')}
          >
            <FileCheck2 size={14} /> EVIDENCE
          </button>
          <button 
            className={`${styles.layerSubItem} ${activeLayer === 'history' ? styles.subActive : ''}`}
            onClick={() => setActiveLayer('history')}
          >
            <Clock size={14} /> HISTORY
          </button>
          <button 
            className={`${styles.layerSubItem} ${activeLayer === 'lineage' ? styles.subActive : ''}`}
            onClick={() => setActiveLayer('lineage')}
          >
            <GitFork size={14} /> LINEAGE
          </button>
        </div>
      </div>

      {/* System Tools */}
      <div className={styles.navSection}>
        <div className={styles.navSectionHeader}>SYSTEM</div>
        <button className={styles.navItem} onClick={() => setActiveLayer('behavior')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Compass size={15} color="#00e5a3" />
            <span>God's Eye (Telemetry)</span>
          </div>
        </button>
        <button className={styles.navItem} onClick={() => setActiveLayer('lineage')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <SlidersHorizontal size={15} color="#00ccff" />
            <span>Compare Forks</span>
          </div>
        </button>
        <button className={styles.navItem} onClick={() => setActiveLayer('evidence')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FlaskConical size={15} color="#ffaa00" />
            <span>Physical Experiments</span>
          </div>
        </button>
      </div>

      {/* Core Philosophy Engine */}
      <div className={styles.navSection}>
        <div className={styles.navSectionHeader}>CORE</div>
        <button className={`${styles.navItem} ${styles.omegaItem}`} onClick={onOpenOmega}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Atom size={16} color="#a64dff" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e0b3ff' }}>OMEGA (MetaConcept)</div>
              <div style={{ fontSize: '0.7rem', color: '#a64dff' }}>The Rules of Reality</div>
            </div>
          </div>
          <ChevronRight size={14} color="#a64dff" />
        </button>
      </div>

      {/* Footer Engine Block */}
      <div className={styles.sidebarFooter}>
        <div className={styles.footerBox}>
          <div className={styles.cubeWireframe}>
            <div className={styles.cubeInner}></div>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            TWINTH.INK ENGINE
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            "We don't just store data. We preserve reality."
          </div>
          <div style={{ fontSize: '0.65rem', color: '#444', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            © TwinThink Engine v1.0.0
          </div>
        </div>
      </div>
    </aside>
  );
}
