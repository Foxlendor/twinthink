'use client';

import React from 'react';
import { Atom, X, Shield, Sparkles, BookOpen, GitBranch, Cpu } from 'lucide-react';
import styles from './RealityEngine.module.css';

interface OmegaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OmegaModal({ isOpen, onClose }: OmegaModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.lightboxBackdrop} onClick={onClose}>
      <div className={styles.omegaModalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Atom size={22} color="#a64dff" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', color: '#e0b3ff', fontWeight: 800 }}>
                OMEGA (MetaConcept) — The Rules of Reality
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#a64dff' }}>TWIN #0000 / FOUNDATIONAL ONTOLOGY</div>
            </div>
          </div>
          <button className={styles.lightboxClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
          <div className={styles.omegaCallout}>
            <strong style={{ color: '#fff' }}>The Core Premise:</strong>
            <p style={{ margin: '0.35rem 0 0 0', color: '#c4b5fd' }}>
              Twin #0000 is not a product—it is the constitutional ontology of TwinThink. It establishes the rules by which any digital twin exists.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.omegaCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00e5a3', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Shield size={14} /> 1. Epistemic Provenance
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#8892b0' }}>
                Every parameter must declare its source: <code style={{ color: '#00e5a3' }}>VERIFIED</code> (benchtop data), <code style={{ color: '#00ccff' }}>EXPERIMENTAL</code> (physics ODE), <code style={{ color: '#ffaa00' }}>ESTIMATED</code> (CAD volume), or <code style={{ color: '#ff4466' }}>ASSUMED</code>.
              </p>
            </div>

            <div className={styles.omegaCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00ccff', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Cpu size={14} /> 2. Living Telemetry
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#8892b0' }}>
                A digital twin is not a 3D picture. It is a coupled system of differential equations executing real physical state transitions in lockstep with physical sensor logs.
              </p>
            </div>

            <div className={styles.omegaCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a64dff', fontWeight: 700, marginBottom: '0.35rem' }}>
                <BookOpen size={14} /> 3. Immutable Journal
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#8892b0' }}>
                Engineering begins with pencil and curiosity. An idea's reality is rooted in its historical sketches, trial failures, and progressive prototypes.
              </p>
            </div>

            <div className={styles.omegaCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffaa00', fontWeight: 700, marginBottom: '0.35rem' }}>
                <GitBranch size={14} /> 4. Fork Lineage
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#8892b0' }}>
                Objects evolve like software branches. Every mutation carries forward ancestral verification while generating new testable hypotheses.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.75rem', background: '#0a101d', borderRadius: '8px', border: '1px solid #1a2744', marginTop: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#00ccff' }}>
              "You are the engineer. We are the memory."
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
