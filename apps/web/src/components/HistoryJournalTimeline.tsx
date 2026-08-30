'use client';

import React, { useState } from 'react';
import { History, BookOpen, ExternalLink, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './RealityEngine.module.css';

interface Milestone {
  date: string;
  phase: string;
  title: string;
  description: string;
  active?: boolean;
}

const MILESTONES: Milestone[] = [
  {
    date: '2016-05',
    phase: 'Idea',
    title: 'Inspiration & Observation',
    description: 'First conceptual idea for an on-demand phase change thermal drink straw during cold winter beverage testing.'
  },
  {
    date: '2016-06',
    phase: 'Concept',
    title: 'Initial Sketches & Notes',
    description: 'Detailed drawings in the physical Inventions Journal mapping concentric annular chambers and click triggers.'
  },
  {
    date: '2016-07',
    phase: 'Prototype v1',
    title: 'First Physical Prototype',
    description: 'Fabrication of the first working sodium acetate benchtop prototype using copper tube and silicone seals.'
  },
  {
    date: '2016-10',
    phase: 'Science Fair',
    title: 'Presented at Science Fair',
    description: 'Regional Science Fair 2016 demonstration of exothermic crystallization enthalpy and temperature rise.'
  },
  {
    date: '2017-01',
    phase: 'Revision v2',
    title: 'Design Improvements',
    description: 'Dual-chamber design improvements, rapid boil reset protocol, and inner stainless core optimization.'
  },
  {
    date: '2026-08',
    phase: 'Outdoor Edition',
    title: 'Durability & Portability Focus',
    description: 'Stripping out electronics down to a 100% solid-state, battery-free $4.50 BOM for backcountry recreation.'
  },
  {
    date: '2026-08',
    phase: 'Current Twin',
    title: 'Digital Twin Established',
    description: 'Authoritative living engineering record with coupled 4-node ODE thermal solver and test telemetry validation.',
    active: true
  }
];

const JOURNAL_PAGES = [
  {
    src: '/journal/003-1-e1628076904523.png',
    title: 'Journal Page 003: Concentric Flow Annulus',
    caption: 'Original 2016 ink sketch detailing the inner drink conduit and outer SAT fluid jacket.'
  },
  {
    src: '/journal/007.png',
    title: 'Journal Page 007: Snap-Disc Nucleator',
    caption: 'Mechanical spring disc trigger mechanism for seed crystal initiation.'
  },
  {
    src: '/journal/014.png',
    title: 'Journal Page 014: Thermal Chamber Bounds',
    caption: 'Dimensioning calculations and volume requirements for 50g SAT latent capacity.'
  },
  {
    src: '/journal/021-e1628076098948.png',
    title: 'Journal Page 021: Rapid Boil Reset Protocol',
    caption: 'Thermodynamics of crystal liquefaction over camp stove boiling bath.'
  },
  {
    src: '/journal/win_20161111_12_01_23_pro.jpg',
    title: 'Science Fair 2016: Presentation Board',
    caption: 'Original science fair presentation demonstrating latent heat crystallization curves.'
  },
  {
    src: '/journal/208ea1a2-820f-40c1-8a34-7123342714aa.jpg',
    title: 'Workbench Physical Prototype & Test Rig',
    caption: 'Physical prototype testing rig with K-type thermocouples and fluid stream injection.'
  }
];

export default function HistoryJournalTimeline() {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone>(MILESTONES[MILESTONES.length - 1]);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; title: string; caption: string } | null>(null);

  return (
    <div className={styles.historyContainer}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={16} color="#00ccff" />
          <span className={styles.cardHeaderTitle}>HISTORY TIMELINE (2016 - 2026)</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#00ccff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <BookOpen size={12} /> VIEW FULL JOURNAL ({JOURNAL_PAGES.length} SCANS)
        </span>
      </div>

      {/* Interactive Timeline Track */}
      <div className={styles.timelineTrack}>
        {MILESTONES.map((m, idx) => (
          <div 
            key={m.date + idx}
            className={`${styles.timelineNode} ${selectedMilestone.date === m.date && selectedMilestone.phase === m.phase ? styles.timelineNodeActive : ''}`}
            onClick={() => setSelectedMilestone(m)}
          >
            <div className={styles.timelineDot} />
            <div className={styles.timelinePhase}>{m.phase}</div>
            <div className={styles.timelineTitle}>{m.title}</div>
            <div className={styles.timelineDate}>{m.date}</div>
          </div>
        ))}
      </div>

      {/* Selected Milestone Context Callout */}
      <div className={styles.milestoneCallout}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
          <strong style={{ color: '#00e5a3', fontSize: '0.8125rem' }}>
            {selectedMilestone.date}: {selectedMilestone.phase} — {selectedMilestone.title}
          </strong>
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#8892b0', lineHeight: 1.45 }}>
          {selectedMilestone.description}
        </p>
      </div>

      {/* Journal Archive Thumbnails Bar */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8892b0', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BookOpen size={13} color="#a64dff" />
          JOURNAL ARCHIVE (EVIDENCE SCANS & SCIENCE FAIR 2016)
        </div>

        <div className={styles.journalThumbGrid}>
          {JOURNAL_PAGES.map((page, i) => (
            <div 
              key={i} 
              className={styles.journalThumbCard}
              onClick={() => setLightboxImg(page)}
            >
              <img src={page.src} alt={page.title} className={styles.journalImg} />
              <div className={styles.journalThumbOverlay}>
                <ZoomIn size={14} color="#fff" />
              </div>
              <div className={styles.journalThumbTitle}>{page.title.split(':')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImg && (
        <div className={styles.lightboxBackdrop} onClick={() => setLightboxImg(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightboxImg(null)}>
              <X size={18} />
            </button>
            <img src={lightboxImg.src} alt={lightboxImg.title} className={styles.lightboxImg} />
            <div className={styles.lightboxMeta}>
              <div style={{ fontWeight: 700, color: '#00ccff', fontSize: '0.9375rem' }}>{lightboxImg.title}</div>
              <div style={{ fontSize: '0.8125rem', color: '#8892b0', marginTop: '0.25rem' }}>{lightboxImg.caption}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
