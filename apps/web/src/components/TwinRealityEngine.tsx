'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Flame, 
  RotateCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Box, 
  Play, 
  FileText, 
  Share2, 
  Download, 
  PlusCircle,
  HelpCircle,
  Eye,
  Sliders
} from 'lucide-react';
import RealitySidebar from './RealitySidebar';
import RealityStateHud from './RealityStateHud';
import CrossSectionCutaway from './CrossSectionCutaway';
import EvidenceHub from './EvidenceHub';
import HistoryJournalTimeline from './HistoryJournalTimeline';
import LineageNetworkGraph from './LineageNetworkGraph';
import OmegaModal from './OmegaModal';
import styles from './RealityEngine.module.css';

interface TwinRealityEngineProps {
  initialTwinId?: string;
}

export default function TwinRealityEngine({ initialTwinId = '0001' }: TwinRealityEngineProps) {
  const [activeLayer, setActiveLayer] = useState<string>('object');
  const [isOmegaOpen, setIsOmegaOpen] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [modelViewerMounted, setModelViewerMounted] = useState<boolean>(false);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    import('@google/model-viewer').then(() => {
      setModelViewerMounted(true);
    });
  }, []);

  const cadPreviewGlb = `/assets/${initialTwinId}/cad/preview.glb`;

  return (
    <div className={styles.engineRoot}>
      {/* 1. REALITY SIDEBAR */}
      <RealitySidebar 
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        onOpenOmega={() => setIsOmegaOpen(true)}
      />

      {/* 2. MAIN WORKSPACE */}
      <main className={styles.mainWorkspace}>
        {/* ENGINE HEADER */}
        <header className={styles.engineHeader}>
          <div className={styles.titleArea}>
            <div className={styles.subTitle}>LIVE AN ENGINEERING RECORD</div>
            <h1 className={styles.mainTitle}>RESIP™ Thermal Drink Straw - Outdoor Edition</h1>
            
            <div className={styles.headerBadges}>
              <span className={styles.badgeTwin}>TWIN #0001</span>
              <span className={styles.badgeExperimental}>
                <AlertTriangle size={13} /> EXPERIMENTAL TWIN
              </span>
            </div>
          </div>

          {/* TOP RIGHT: REALITY STATE HUD & TELEMETRY */}
          <RealityStateHud />
        </header>

        {/* 3. DASHBOARD GRID */}
        <div className={styles.dashboardGrid}>
          {/* COLUMN 1: OBJECT & PHYSICAL ARCHITECTURE */}
          <div className={styles.gridCol}>
            {/* WHAT IS IT? */}
            <div className={`${styles.engineCard} ${styles.whatIsItCard}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.cardHeaderTitle}>WHAT IS IT?</span>
                <span className={styles.badgeSolidState}>Solid-State</span>
              </div>

              <p style={{ fontSize: '0.8125rem', color: '#8892b0', margin: '0.6rem 0', lineHeight: 1.5 }}>
                A reusable self-heating drink straw that warms beverages on-demand using a sodium acetate phase change activation system.
              </p>

              {/* Feature Pills */}
              <div className={styles.featureTagRow}>
                <span className={styles.featurePill}>
                  <RotateCw size={11} /> REUSABLE
                </span>
                <span className={styles.featurePill}>
                  <Box size={11} /> PORTABLE
                </span>
                <span className={styles.featurePill}>
                  <Sparkles size={11} /> ACTIVATED BY SNAP
                </span>
                <span className={styles.featurePill}>
                  <Flame size={11} /> CHEMICAL HEAT
                </span>
                <span className={styles.featurePill}>
                  <ShieldCheck size={11} /> OUTDOOR READY
                </span>
              </div>

              {/* 3D Straw Visualizer Container */}
              <div className={styles.strawViewerArea}>
                {modelViewerMounted ? (
                  React.createElement('model-viewer', {
                    ref: viewerRef,
                    src: cadPreviewGlb,
                    alt: "3D CAD Preview of Resip Straw",
                    "camera-controls": true,
                    "auto-rotate": true,
                    "shadow-intensity": "1",
                    exposure: "1",
                    style: { width: '100%', height: '200px', background: 'transparent' }
                  })
                ) : (
                  <div style={{ color: '#8892b0', fontSize: '0.75rem' }}>Loading 3D Straw Assembly...</div>
                )}
                <button className={styles.viewerBtn} onClick={() => setIs3DMode(!is3DMode)}>
                  <Eye size={12} /> 3D VIEWER
                </button>
              </div>

              {/* Part Breakdown Thumbnails */}
              <div className={styles.partThumbRow}>
                <div className={styles.partThumb}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>BENT TUBE</div>
                  <div>316L Core</div>
                </div>
                <div className={styles.partThumb}>
                  <div style={{ fontWeight: 700, color: '#ff8c00' }}>SAT CORE</div>
                  <div>50g PCM</div>
                </div>
                <div className={styles.partThumb}>
                  <div style={{ fontWeight: 700, color: '#00e5a3' }}>TRIGGER</div>
                  <div>Snap Disc</div>
                </div>
                <div className={styles.partThumb}>
                  <div style={{ fontWeight: 700, color: '#00ccff' }}>JACKET</div>
                  <div>Silicone</div>
                </div>
              </div>
            </div>

            {/* HOW DOES IT WORK? */}
            <div className={styles.engineCard}>
              <span className={styles.cardHeaderTitle}>HOW DOES IT WORK?</span>
              <div className={styles.flowStepsGrid}>
                <div className={styles.flowStepCard}>
                  <div className={styles.flowStepNumber}>1. SNAP</div>
                  <div className={styles.flowStepTitle}>Nucleation</div>
                  <div className={styles.flowStepDesc}>The metal spring disc flexes, seeding crystal nucleation.</div>
                </div>

                <div className={styles.flowStepCard}>
                  <div className={styles.flowStepNumber}>2. CRYSTAL</div>
                  <div className={styles.flowStepTitle}>Phase Change</div>
                  <div className={styles.flowStepDesc}>Supersaturated SAT solution solidifies at 54°C.</div>
                </div>

                <div className={styles.flowStepCard}>
                  <div className={styles.flowStepNumber}>3. HEAT</div>
                  <div className={styles.flowStepTitle}>Enthalpy</div>
                  <div className={styles.flowStepDesc}>Exothermic reaction releases 12.05 kJ latent energy.</div>
                </div>

                <div className={styles.flowStepCard}>
                  <div className={styles.flowStepNumber}>4. WARM</div>
                  <div className={styles.flowStepTitle}>Heat Transfer</div>
                  <div className={styles.flowStepDesc}>Heat conducts across SS tube into moving sip stream.</div>
                </div>
              </div>
            </div>

            {/* KEY SPECIFICATIONS */}
            <div className={styles.engineCard}>
              <span className={styles.cardHeaderTitle}>KEY SPECIFICATIONS</span>
              <div className={styles.specGrid}>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Activation Temp (Est.)</span>
                  <span className={styles.specValue} style={{ color: '#00ccff' }}>54°C (129°F)</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Length / Diameter</span>
                  <span className={styles.specValue}>220 mm / 8 mm OD</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Recharge Temp</span>
                  <span className={styles.specValue}>80–100°C (Boil Reset)</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Outer Material</span>
                  <span className={styles.specValue}>Thermochromic Silicone</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Heat Duration</span>
                  <span className={styles.specValue}>5–10 Minutes Active</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Estimated BOM</span>
                  <span className={styles.specValue} style={{ color: '#00e5a3' }}>$4.50 USD (MSRP $25)</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: STRUCTURE & EVIDENCE */}
          <div className={styles.gridCol}>
            {/* CROSS-SECTION ACTIVATED SCHEMATIC */}
            <CrossSectionCutaway />

            {/* EVIDENCE HUB (TRACEABLE CLAIMS) */}
            <EvidenceHub twinId={initialTwinId} />
          </div>

          {/* COLUMN 3: HISTORY, LINEAGE & SYSTEM ACTIONS */}
          <div className={styles.gridCol}>
            {/* HISTORY TIMELINE & JOURNAL ARCHIVE */}
            <HistoryJournalTimeline />

            {/* LINEAGE GRAPH */}
            <LineageNetworkGraph />

            {/* QUICK ACTIONS & TWIN HEALTH */}
            <div className={styles.engineCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className={styles.cardHeaderTitle}>QUICK ACTIONS & TWIN HEALTH</span>
                <span style={{ fontSize: '0.7rem', color: '#00e5a3', fontWeight: 700 }}>HEALTH: 62%</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button className={styles.navItem} style={{ background: '#080d19' }} onClick={() => setActiveLayer('behavior')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Play size={12} color="#00e5a3" /> Run Simulation
                  </div>
                </button>
                <button className={styles.navItem} style={{ background: '#080d19' }} onClick={() => setActiveLayer('evidence')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <PlusCircle size={12} color="#00ccff" /> Upload Telemetry
                  </div>
                </button>
                <button className={styles.navItem} style={{ background: '#080d19' }} onClick={() => window.open(`/api/twins/${initialTwinId}`, '_blank')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={12} color="#ffaa00" /> Export Twin Package
                  </div>
                </button>
                <button className={styles.navItem} style={{ background: '#080d19' }} onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Share2 size={12} color="#a64dff" /> Share Link
                  </div>
                </button>
              </div>

              <div style={{ background: '#080d19', border: '1px solid #142036', borderRadius: '6px', padding: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.35rem' }}>
                  <span>Epistemic Certainty</span>
                  <span style={{ color: '#00e5a3', fontWeight: 700 }}>62% (Healthy)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#142036', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '62%', height: '100%', background: 'linear-gradient(90deg, #00ccff, #00e5a3)' }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#556677', marginTop: '0.35rem' }}>
                  Healthy but incomplete. Additional physical test logs will increase reality certainty.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. FOOTER ENGINE BANNER */}
        <footer className={styles.engineFooter}>
          <div>
            <span className={styles.footerAxioms}>BUILD • TEST • DOCUMENT • EVOLVE • PRESERVE REALITY</span>
            <div className={styles.footerMission}>
              TwinThink is the engine for mapping the a priori essence of anything.
            </div>
          </div>
          <div style={{ color: '#556677', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>
            "You are the engineer. We are the memory."
          </div>
        </footer>

        {/* OMEGA METACONCEPT MODAL */}
        <OmegaModal isOpen={isOmegaOpen} onClose={() => setIsOmegaOpen(false)} />
      </main>
    </div>
  );
}
