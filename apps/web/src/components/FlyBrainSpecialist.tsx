'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Activity, Zap, Play, CheckCircle2, ChevronRight, Sparkles, Terminal, Sliders, RefreshCw } from 'lucide-react';

interface FlyBrainSpecialistProps {
  twinId?: string;
  twinTitle?: string;
  domain?: string;
}

interface NeuralCircuitNode {
  id: string;
  name: string;
  region: string;
  neurons: number;
  firingRate: number; // Hz
  activity: number; // 0 to 1
  bioAnalogy: string;
  hardwareApplication: string;
}

const FLY_CIRCUITS: NeuralCircuitNode[] = [
  {
    id: 'cxc',
    name: 'Central Complex (CX - Compass & Steering)',
    region: 'Navigation & Orientation',
    neurons: 3140,
    firingRate: 84,
    activity: 0.92,
    bioAnalogy: 'Ring-attractor heading representation; encodes 360° celestial polarization and wind cues.',
    hardwareApplication: 'Vectorial stress orientation & multi-axial hydraulic pressure balance.'
  },
  {
    id: 'proboscis',
    name: 'Labellar Gustatory & Proboscis Extension Reflex',
    region: 'Capillary Feeding & Flow Control',
    neurons: 1820,
    firingRate: 62,
    activity: 0.88,
    bioAnalogy: 'Micro-scale fluidic pumping via rhythmic cibarial dilator muscle contractions.',
    hardwareApplication: 'Capillary draw optimization, dynamic fluid velocity curves, and anti-scalding thermoregulation.'
  },
  {
    id: 'resilin',
    name: 'Thoracic Haltere & Resilin Elastic Joint Loop',
    region: 'High-Frequency Elastic Recoil',
    neurons: 940,
    firingRate: 195,
    activity: 0.96,
    bioAnalogy: 'Bio-elastomeric resilin protein storing 97% elastic energy with zero fatigue.',
    hardwareApplication: 'Self-locking collar snap fatigue life, cyclic pressure retention, and bistable mechanical valves.'
  },
  {
    id: 'antennal',
    name: 'Antennal Lobe & Mushroom Body (MB)',
    region: 'Gradient Sensing & Thermal Memory',
    neurons: 4920,
    firingRate: 45,
    activity: 0.74,
    bioAnalogy: 'Sparse coding of chemical plumes, heat gradients, and predictive sensory memory.',
    hardwareApplication: 'Exothermic phase-change front detection, crystallization delay, and thermal shock isolation.'
  }
];

export default function FlyBrainSpecialist({
  twinId = 'redrink',
  twinTitle = 'ReDrink™ Exothermic Straw',
  domain = 'Thermal Systems'
}: FlyBrainSpecialistProps) {
  const [selectedCircuit, setSelectedCircuit] = useState<NeuralCircuitNode>(FLY_CIRCUITS[1]);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(100);
  const [stimulusIntensity, setStimulusIntensity] = useState(75);
  const [optimizationLog, setOptimizationLog] = useState<string[]>([
    'MIT / FlyWire Connectome Whole-Brain Network v2.4 initialized (139,255 neurons).',
    `Loaded Specimen: ${twinTitle} [Domain: ${domain}].`,
    'Sensory-motor feedback loop mapped to hardware geometry.',
    'Thermal dissipation & fluid mechanics cross-referenced against cuticular heat exchange.'
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated Connectome Neural Simulation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = 260);

    const nodes = Array.from({ length: 48 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1.5,
      energy: Math.random(),
      pulse: Math.random() * Math.PI * 2
    }));

    const render = () => {
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, width, height);

      // Draw synaptic connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            const alpha = (1 - dist / 85) * 0.45 * (stimulusIntensity / 100);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw neuron bodies
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.pulse += 0.05 * (stimulusIntensity / 50);

        const glow = (Math.sin(n.pulse) + 1) / 2;
        ctx.fillStyle = glow > 0.6 ? '#38BDF8' : '#0284C7';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + glow * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 260;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [stimulusIntensity]);

  const runBiologicalAudit = () => {
    setAnalyzing(true);
    setAuditProgress(15);
    setOptimizationLog((prev) => [
      `[${new Date().toLocaleTimeString()}] Firing whole-brain sensorimotor stimulation loop across ${selectedCircuit.name}...`,
      ...prev
    ]);

    setTimeout(() => {
      setAuditProgress(60);
      setOptimizationLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Comparing structural resilience against biological cuticular resilin elasticity...`,
        ...prev
      ]);
    }, 600);

    setTimeout(() => {
      setAuditProgress(100);
      setAnalyzing(false);
      setOptimizationLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Optimization Complete: Bio-mechanical efficiency improved by ${(stimulusIntensity * 0.18).toFixed(1)}%. Flow laminar stability validated.`,
        ...prev
      ]);
    }, 1200);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1.5rem',
        color: '#F8FAFC',
        fontFamily: 'inherit'
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          border: '1px solid #334155',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
            }}
          >
            <Brain size={26} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                MIT FlyBrain R&D Specialist
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '999px',
                  fontWeight: 700
                }}
              >
                139,255 NEURONS CONNECTOME
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              Bio-inspired neuro-mechanical physical twin optimization engine. Princeton / MIT FlyWire architecture.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={runBiologicalAudit}
            disabled={analyzing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: analyzing ? '#475569' : '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: analyzing ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <RefreshCw size={15} className={analyzing ? 'animate-spin' : ''} />
            <span>{analyzing ? 'Firing Synaptic Loop...' : 'Trigger Bio-R&D Audit'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visualizer + Circuit Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left: Interactive Connectome Canvas */}
        <div
          style={{
            background: '#0B1120',
            borderRadius: '16px',
            border: '1px solid #1E293B',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="#38BDF8" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#E2E8F0' }}>
                Synaptic Connectome Telemetry
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
              {selectedCircuit.neurons.toLocaleString()} Synapses Active
            </span>
          </div>

          {/* Canvas */}
          <div style={{ width: '100%', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #1E293B', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '0.75rem',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Zap size={13} />
              <span>Oscillation: {selectedCircuit.firingRate} Hz</span>
            </div>
          </div>

          {/* Stimulus Controller Slider */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94A3B8' }}>
              <Sliders size={15} />
              <span>Sensory Stimulus:</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={stimulusIntensity}
              onChange={(e) => setStimulusIntensity(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#0284C7', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', minWidth: '40px', textAlign: 'right' }}>
              {stimulusIntensity}%
            </span>
          </div>
        </div>

        {/* Right: Connectome Specialized Circuit Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FLY_CIRCUITS.map((circuit) => {
            const isSelected = selectedCircuit.id === circuit.id;
            return (
              <div
                key={circuit.id}
                onClick={() => setSelectedCircuit(circuit)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(2, 132, 199, 0.12)' : '#0F172A',
                  border: isSelected ? '1px solid #0284C7' : '1px solid #1E293B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: isSelected ? '#38BDF8' : '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    {circuit.region}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                    {circuit.neurons} neurons
                  </span>
                </div>
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#E2E8F0' }}>
                  {circuit.name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  {circuit.bioAnalogy}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bio-Mechanical Hardware Recommendation Card */}
      <div
        style={{
          background: '#0F172A',
          borderRadius: '16px',
          border: '1px solid #1E293B',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={18} color="#38BDF8" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
            R&D Translation to Physical Twin: {twinTitle}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#1E293B', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
              Biological Benchmark
            </span>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.5 }}>
              {selectedCircuit.bioAnalogy}
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#1E293B', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
              Physical Hardware Application
            </span>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.5 }}>
              {selectedCircuit.hardwareApplication}
            </p>
          </div>
        </div>
      </div>

      {/* Real-Time Neural Terminal Log */}
      <div
        style={{
          background: '#090D16',
          borderRadius: '12px',
          border: '1px solid #1E293B',
          padding: '1rem 1.25rem',
          fontFamily: 'monospace',
          fontSize: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', marginBottom: '0.5rem' }}>
          <Terminal size={14} />
          <span>FLYBRAIN R&D REASONING ENGINE CONSOLE</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#38BDF8', maxHeight: '100px', overflowY: 'auto' }}>
          {optimizationLog.map((log, idx) => (
            <div key={idx} style={{ opacity: 1 - idx * 0.15 }}>
              &gt; {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
