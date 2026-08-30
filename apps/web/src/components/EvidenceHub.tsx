'use client';

import React, { useState } from 'react';
import { FileCheck, FileCode, Database, FileSpreadsheet, Box, ChevronRight, ExternalLink } from 'lucide-react';
import styles from './RealityEngine.module.css';

interface ClaimItem {
  id: string;
  name: string;
  file: string;
  type: string;
  status: 'VERIFIED' | 'EXPERIMENTAL' | 'ESTIMATED' | 'ASSUMED';
  date: string;
  details: string;
}

const EVIDENCE_ITEMS: ClaimItem[] = [
  {
    id: 'claim-1',
    name: 'FEA Thermal Simulation',
    file: 'simulation/model.py',
    type: 'Python Physics ODE',
    status: 'EXPERIMENTAL',
    date: '2026-08-28',
    details: 'Calculates latent heat release at 54°C plateau and convective sip heat flux dT/dt.'
  },
  {
    id: 'claim-2',
    name: 'Activation Test Data',
    file: 'testing/test-results.csv',
    type: 'Thermocouple Telemetry',
    status: 'EXPERIMENTAL',
    date: '2026-08-28',
    details: 'Microcontroller dual-channel K-type thermocouple bench logging (RMSE = 1.6°C).'
  },
  {
    id: 'claim-3',
    name: 'Material Properties',
    file: 'simulation/parameters.json',
    type: 'Thermophysical Data',
    status: 'VERIFIED',
    date: '2026-08-28',
    details: 'SAT density 1.45 g/cm³, latent heat 241 kJ/kg, 316L SS thermal conductivity 16.3 W/m·K.'
  },
  {
    id: 'claim-4',
    name: 'CAD Model (STEP)',
    file: 'cad/primary.step',
    type: '3D Parasolid Geometry',
    status: 'VERIFIED',
    date: '2026-08-28',
    details: 'Exact 220mm straw CAD with 6.0mm ID inner conduit and 8.0mm OD silicone jacket.'
  },
  {
    id: 'claim-5',
    name: 'Engineering Drawings',
    file: 'spec.md',
    type: 'Technical Specification',
    status: 'VERIFIED',
    date: '2026-08-28',
    details: 'Tolerance bounds, food-contact certifications, and snap-disc deformation specs.'
  },
  {
    id: 'claim-6',
    name: 'Test Calibration Engine',
    file: 'testing/calibration.json',
    type: 'Residual Error Analysis',
    status: 'EXPERIMENTAL',
    date: '2026-08-28',
    details: 'Automated RMSE, MAE, and R² (0.942) correlation matrix between test & simulation.'
  }
];

export default function EvidenceHub({ twinId = '0001' }: { twinId?: string }) {
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return '#00e5a3';
      case 'EXPERIMENTAL': return '#00ccff';
      case 'ESTIMATED': return '#ffaa00';
      case 'ASSUMED': return '#ff4466';
      default: return '#8892b0';
    }
  };

  return (
    <div className={styles.evidenceContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck size={16} color="#00ccff" />
          <span className={styles.cardHeaderTitle}>EVIDENCE HUB (TRACEABLE CLAIMS)</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#00ccff', cursor: 'pointer' }}>VIEW ALL ({EVIDENCE_ITEMS.length})</span>
      </div>

      <div className={styles.evidenceList}>
        {EVIDENCE_ITEMS.map((item) => (
          <div 
            key={item.id} 
            className={`${styles.evidenceRow} ${selectedClaim?.id === item.id ? styles.evidenceRowActive : ''}`}
            onClick={() => setSelectedClaim(selectedClaim?.id === item.id ? null : item)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
              <FileCode size={14} color="#a64dff" style={{ flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {item.file}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <span 
                className={styles.claimStatusBadge}
                style={{ 
                  color: getStatusColor(item.status), 
                  borderColor: `${getStatusColor(item.status)}40`,
                  background: `${getStatusColor(item.status)}12`
                }}
              >
                {item.status}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#556677', fontFamily: 'var(--font-mono)' }}>
                {item.date}
              </span>
              <ChevronRight size={13} color="#556677" />
            </div>
          </div>
        ))}
      </div>

      {selectedClaim && (
        <div className={styles.claimDetailModal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>{selectedClaim.name}</span>
            <span style={{ fontSize: '0.6875rem', color: getStatusColor(selectedClaim.status), fontWeight: 700 }}>
              {selectedClaim.status}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#8892b0', margin: '0.25rem 0 0.5rem 0', lineHeight: 1.4 }}>
            {selectedClaim.details}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#00ccff', fontFamily: 'var(--font-mono)' }}>
              Source: {selectedClaim.file}
            </span>
          </div>
        </div>
      )}

      {/* Epistemic Legend Bar */}
      <div className={styles.epistemicLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#00e5a3' }} />
          <span><strong>VERIFIED</strong> (Tested/Measured)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#00ccff' }} />
          <span><strong>EXPERIMENTAL</strong> (Model/Partial)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#ffaa00' }} />
          <span><strong>ESTIMATED</strong> (Engineering Est.)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#ff4466' }} />
          <span><strong>ASSUMED</strong> (Hypothesis)</span>
        </div>
      </div>
    </div>
  );
}
