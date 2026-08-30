'use client';

import React from 'react';
import { GitFork, ArrowRight } from 'lucide-react';
import styles from './RealityEngine.module.css';

export default function LineageNetworkGraph() {
  return (
    <div className={styles.lineageContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitFork size={16} color="#00ccff" />
          <span className={styles.cardHeaderTitle}>LINEAGE GRAPH</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#8892b0' }}>INTERACTIVE MAP</span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 450 180" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="lineOriginGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00e5a3" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00ccff" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="lineForkGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00ccff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffaa00" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Lines from Origins to RESIP */}
          <line x1="85" y1="40" x2="225" y2="90" stroke="url(#lineOriginGrad)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="85" y1="90" x2="225" y2="90" stroke="url(#lineOriginGrad)" strokeWidth="2" />
          <line x1="85" y1="140" x2="225" y2="90" stroke="url(#lineOriginGrad)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Lines from RESIP to Descendants */}
          <line x1="225" y1="90" x2="365" y2="40" stroke="url(#lineForkGrad)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="225" y1="90" x2="365" y2="90" stroke="url(#lineForkGrad)" strokeWidth="2" />
          <line x1="225" y1="90" x2="365" y2="140" stroke="url(#lineForkGrad)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* ORIGIN NODES (Left) */}
          {/* 1. Thermal Storage */}
          <rect x="15" y="24" width="105" height="32" rx="16" fill="#0c1d1a" stroke="#00e5a3" strokeWidth="1" />
          <text x="67" y="44" fill="#00e5a3" fontSize="9" fontWeight="600" textAnchor="middle">Thermal Storage Concepts</text>

          {/* 2. Phase Change Research */}
          <rect x="15" y="74" width="105" height="32" rx="16" fill="#0c1d1a" stroke="#00e5a3" strokeWidth="1" />
          <text x="67" y="94" fill="#00e5a3" fontSize="9" fontWeight="600" textAnchor="middle">Phase Change Research</text>

          {/* 3. Outdoor Needs */}
          <rect x="15" y="124" width="105" height="32" rx="16" fill="#0c1d1a" stroke="#00e5a3" strokeWidth="1" />
          <text x="67" y="144" fill="#00e5a3" fontSize="9" fontWeight="600" textAnchor="middle">Outdoor Gear Needs</text>

          {/* CENTER CANONICAL NODE: RESIP Twin #0001 */}
          <circle cx="225" cy="90" r="34" fill="#0b172a" stroke="#00ccff" strokeWidth="2.5" />
          <circle cx="225" cy="90" r="38" fill="none" stroke="rgba(0, 204, 255, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
          <text x="225" y="86" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle">RESIP™</text>
          <text x="225" y="100" fill="#00ccff" fontSize="8" fontWeight="600" textAnchor="middle">Twin #0001</text>

          {/* DESCENDANT NODES (Right) */}
          {/* 1. Revision #0002 */}
          <rect x="330" y="24" width="105" height="32" rx="16" fill="#1f180c" stroke="#ffaa00" strokeWidth="1" />
          <text x="382" y="39" fill="#ffaa00" fontSize="9" fontWeight="600" textAnchor="middle">Revision #0002</text>
          <text x="382" y="49" fill="#8892b0" fontSize="7" textAnchor="middle">(Planned Multi-Sip)</text>

          {/* 2. Experiment #0003 */}
          <rect x="330" y="74" width="105" height="32" rx="16" fill="#1c102a" stroke="#a64dff" strokeWidth="1" />
          <text x="382" y="89" fill="#a64dff" fontSize="9" fontWeight="600" textAnchor="middle">Experiment #0003</text>
          <text x="382" y="99" fill="#8892b0" fontSize="7" textAnchor="middle">(Durability 100+ Cycles)</text>

          {/* 3. Alternative Design #0004 */}
          <rect x="330" y="124" width="105" height="32" rx="16" fill="#1f180c" stroke="#ffaa00" strokeWidth="1" />
          <text x="382" y="139" fill="#ffaa00" fontSize="9" fontWeight="600" textAnchor="middle">Alternative Design</text>
          <text x="382" y="149" fill="#8892b0" fontSize="7" textAnchor="middle">(Coffee Travel Edition)</text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.6875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5a3' }} />
          <span style={{ color: '#8892b0' }}>ORIGIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ccff' }} />
          <span style={{ color: '#8892b0' }}>INFLUENCED BY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a64dff' }} />
          <span style={{ color: '#8892b0' }}>CONTAINS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffaa00' }} />
          <span style={{ color: '#8892b0' }}>CAN PRODUCE</span>
        </div>
      </div>
    </div>
  );
}
