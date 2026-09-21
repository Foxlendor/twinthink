'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, ShieldCheck, Lock, Unlock, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';

interface TwizzLockViewerProps {
  onUnlockRequest?: () => void;
}

const defaultState = {
  liquid: 1.20,
  maxVolume: 2.00,
  compression: 0,
  locked: false,
  fizz: 1.0,
  hours: 0,
  strokes: 0
};

type TwizzLockState = typeof defaultState;

export default function TwizzLockViewer({ onUnlockRequest }: TwizzLockViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const [state, setState] = useState<TwizzLockState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('twizzlock_simulation_state');
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return defaultState;
  });

  const [lastStrokeStyle, setLastStrokeStyle] = useState('—');
  const [lastAgitationLoss, setLastAgitationLoss] = useState(0);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('twizzlock_simulation_state', JSON.stringify(state));
    } catch {}
  }, [state]);

  const getCurrentVolume = (comp = state.compression) => {
    return state.maxVolume * (1 - comp * 0.55);
  };

  const getHeadspace = (comp = state.compression) => {
    return Math.max(0, getCurrentVolume(comp) - state.liquid);
  };

  const pump = (strokeDurationMs?: number) => {
    if (state.locked) return;

    let style = 'Manual (tap)';
    let loss = 0;

    if (typeof strokeDurationMs === 'number') {
      // Fast violent stroke (<60ms) knocks out up to 5% CO2
      const violence = Math.max(0, Math.min(1, (350 - strokeDurationMs) / 300));
      loss = violence * 0.05;
      style = violence > 0.55 ? 'Aggressive (Turbulent)' : (violence > 0.15 ? 'Brisk' : 'Smooth (Controlled)');
    }

    setLastStrokeStyle(style);
    setLastAgitationLoss(loss);

    setState(prev => {
      const nextComp = Math.min(0.85, prev.compression + 0.07);
      const nextFizz = Math.max(0, prev.fizz - loss);
      return {
        ...prev,
        strokes: prev.strokes + 1,
        compression: nextComp,
        fizz: nextFizz
      };
    });
  };

  const toggleLock = () => {
    setState(prev => ({
      ...prev,
      locked: !prev.locked
    }));
  };

  const advanceTime = (hrs: number) => {
    setState(prev => {
      const curVol = prev.maxVolume * (1 - prev.compression * 0.55);
      const head = Math.max(0, curVol - prev.liquid);
      const decayRate = 0.010 + (head * 0.032);
      const nextFizz = Math.max(0, prev.fizz - decayRate * hrs);
      return {
        ...prev,
        hours: prev.hours + hrs,
        fizz: nextFizz
      };
    });
  };

  const resetTwin = () => {
    setState(defaultState);
    setLastStrokeStyle('—');
    setLastAgitationLoss(0);
  };

  // Three.js Scene Setup & Animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight || 440;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Lights
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(3, 5, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
    fill.position.set(-4, -2, -3);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0x666677, 0.7));

    const bottleGroup = new THREE.Group();
    scene.add(bottleGroup);

    const BOTTLE_HALF_H = 1.5;
    const LIQUID_GEO_H = 1.8;

    // Translucent Compression Sleeve
    const bagGeo = new THREE.CylinderGeometry(1.35, 1.5, 3.6, 24, 1, true);
    const bagMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.16,
      roughness: 0.3,
      metalness: 0,
      side: THREE.DoubleSide
    });
    const bagMesh = new THREE.Mesh(bagGeo, bagMat);
    scene.add(bagMesh);

    // Bottle body (PET)
    const bodyGeo = new THREE.CylinderGeometry(1.0, 1.15, BOTTLE_HALF_H * 2, 24);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xdfe6f2,
      transparent: true,
      opacity: 0.35,
      roughness: 0.15,
      transmission: 0.3,
      thickness: 0.3
    });
    const bottleBody = new THREE.Mesh(bodyGeo, bodyMat);
    bottleGroup.add(bottleBody);

    // Liquid mesh
    const liquidGeo = new THREE.CylinderGeometry(0.95, 1.1, LIQUID_GEO_H, 24);
    liquidGeo.translate(0, LIQUID_GEO_H / 2, 0);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      roughness: 0.2,
      transparent: true,
      opacity: 0.88
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    bottleGroup.add(liquidMesh);

    // Dynamic Bubbles
    const bubblePool: THREE.Mesh[] = [];
    const bubbleGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xfff2e0, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 28; i++) {
      const b = new THREE.Mesh(bubbleGeo, bubbleMat.clone());
      b.userData = { phase: Math.random(), speed: 0.25 + Math.random() * 0.35, r: Math.random() * 0.6 };
      const ang = Math.random() * Math.PI * 2;
      b.position.x = Math.cos(ang) * b.userData.r;
      b.position.z = Math.sin(ang) * b.userData.r;
      bottleGroup.add(b);
      bubblePool.push(b);
    }

    // Neck & Cap
    const neckGeo = new THREE.CylinderGeometry(0.25, 0.32, 0.6, 16);
    const neck = new THREE.Mesh(neckGeo, bodyMat);
    neck.position.y = BOTTLE_HALF_H + 0.3;
    bottleGroup.add(neck);

    const capGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = BOTTLE_HALF_H + 0.7;
    bottleGroup.add(cap);

    // Clickable Retainer Strap
    const retGeo = new THREE.TorusGeometry(1.28, 0.1, 12, 32);
    const retMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4, transparent: true, opacity: 0 });
    const retainerMesh = new THREE.Mesh(retGeo, retMat);
    retainerMesh.rotation.x = Math.PI / 2;
    retainerMesh.position.y = -0.55;
    retainerMesh.visible = false;
    scene.add(retainerMesh);

    // Camera & Orbit state
    let rotY = 0.5;
    let rotX = -0.15;
    let dist = 6.0;
    let displayComp = state.compression;
    let pumpTravel = 0;
    let pumpSpring = 0;
    let pointerMode: 'orbit' | 'pump' | null = null;
    let lastX = 0;
    let lastY = 0;
    let downY = 0;
    let pumpStartTime = 0;

    camera.position.set(0, 0, dist);

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const hitTest = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);

      const targets: THREE.Object3D[] = [];
      if (retainerMesh.visible) targets.push(retainerMesh);
      targets.push(bottleBody, liquidMesh, neck, cap);

      const hits = raycaster.intersectObjects(targets);
      if (!hits.length) return 'background';
      return (hits[0].object === retainerMesh) ? 'retainer' : 'bottle';
    };

    // Event Handlers
    const onStart = (x: number, y: number) => {
      downY = y;
      lastX = x;
      lastY = y;
      const hit = hitTest(x, y);
      if (hit === 'retainer') {
        pointerMode = null;
        toggleLock();
        return;
      }
      pointerMode = (hit === 'bottle') ? 'pump' : 'orbit';
      if (pointerMode === 'pump') pumpStartTime = performance.now();
    };

    const onMove = (x: number, y: number) => {
      if (pointerMode === 'orbit') {
        rotY += (x - lastX) * 0.008;
        rotX = Math.max(-0.8, Math.min(0.8, rotX + (y - lastY) * 0.006));
      } else if (pointerMode === 'pump') {
        const dy = y - downY;
        pumpTravel = Math.max(0, Math.min(1, dy / 90));
      }
      lastX = x;
      lastY = y;
    };

    const onEnd = () => {
      if (pointerMode === 'pump' && pumpTravel > 0.55) {
        const duration = Math.max(60, performance.now() - pumpStartTime);
        pump(duration);
      }
      pointerMode = null;
      pumpTravel = 0;
    };

    const handleMouseDown = (e: MouseEvent) => onStart(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleMouseUp = () => onEnd();

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    };
    const handleTouchEnd = () => onEnd();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      dist = Math.max(3.5, Math.min(10, dist + e.deltaY * 0.003));
    };

    const el = renderer.domElement;
    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('wheel', handleWheel, { passive: false });

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      displayComp += (state.compression - displayComp) * 0.1;
      pumpSpring += (pumpTravel - pumpSpring) * 0.25;

      const scaleY = 1 - displayComp * 0.42;
      const scaleXZ = 1 + displayComp * 0.04;
      const newHalfH = BOTTLE_HALF_H * scaleY;

      bottleBody.scale.set(scaleXZ, scaleY, scaleXZ);
      bottleBody.position.y = -BOTTLE_HALF_H + newHalfH - pumpSpring * 0.35;

      neck.position.y = -BOTTLE_HALF_H + newHalfH * 2 + 0.3 - pumpSpring * 0.35;
      cap.position.y = neck.position.y + 0.4;

      const curVol = state.maxVolume * (1 - state.compression * 0.55);
      const liquidFrac = curVol > 0 ? Math.min(1, state.liquid / curVol) : 0;
      const liquidHeight = liquidFrac * newHalfH * 2;
      liquidMesh.scale.set(scaleXZ, liquidHeight / LIQUID_GEO_H, scaleXZ);
      liquidMesh.position.y = -BOTTLE_HALF_H - pumpSpring * 0.35;

      // Bubbles
      const liquidBottom = liquidMesh.position.y;
      const visibleCount = Math.round(bubblePool.length * Math.max(0.05, state.fizz));
      const t = performance.now() * 0.001;
      bubblePool.forEach((b, i) => {
        const show = i < visibleCount && liquidHeight > 0.08;
        b.visible = show;
        if (!show) return;
        const cycle = ((t * b.userData.speed) + b.userData.phase) % 1;
        b.position.y = liquidBottom + cycle * liquidHeight;
        b.scale.setScalar(0.6 + 0.4 * Math.sin(cycle * Math.PI));
        (b.material as THREE.MeshBasicMaterial).opacity = (0.3 + 0.5 * state.fizz) * Math.sin(Math.min(1, cycle * 3)) * 0.9 + 0.1;
      });

      // Bag expansion & Retainer visibility
      bagMesh.scale.set(1 + displayComp * 0.06, 1, 1 + displayComp * 0.06);
      const canLock = state.compression > 0.04 || state.locked;
      retainerMesh.visible = canLock;
      (retainerMesh.material as THREE.MeshStandardMaterial).opacity = state.locked ? 1 : 0.35;
      retainerMesh.scale.set(1 + displayComp * 0.04, 1, 1 + displayComp * 0.04);

      camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX);
      camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX);
      camera.position.y = dist * Math.sin(rotX) + 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight || 440;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [state]);

  const estPressure = (2.2 + state.compression * 1.6).toFixed(1);
  const sealScore = Math.max(0, 100 - Math.round(state.strokes * 1.3));

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.3px' }}>
              Twi<span style={{ display: 'inline-block', transform: 'scaleX(-1) skewX(-12deg)', color: '#3B82F6' }}>z</span><span style={{ display: 'inline-block', transform: 'scaleX(-1) skewX(-12deg)', color: '#3B82F6' }}>z</span>Lock™ 3D Twin
            </h2>
            <span style={{
              background: state.locked ? '#ECFDF5' : '#EFF6FF',
              color: state.locked ? '#059669' : '#2563EB',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              textTransform: 'uppercase'
            }}>
              {state.locked ? 'Locked' : 'Open'}
            </span>
          </div>
          <div style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            3D interactive twin, bottle-as-piston kinematics, and bubble agitation physics.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '0.35rem 0.75rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} /> Full 3D Physics
          </span>
        </div>
      </div>

      {/* Main 3D Stage & Telemetry Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.25fr 1fr',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {/* 3D Scene Viewport */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 25%, #1E293B, #0F172A)',
            minHeight: '440px',
            touchAction: 'none',
            cursor: 'grab'
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            fontSize: '11px',
            color: '#94A3B8',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            padding: '4px 10px',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            Drag bottle downward to pump · Click green band to lock · Drag space to orbit
          </div>
        </div>

        {/* Telemetry & Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              onClick={() => pump()}
              style={{
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Pump Stroke (Tap)
            </button>
            <button
              onClick={toggleLock}
              style={{
                background: state.locked ? '#EF4444' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {state.locked ? <Lock size={13} /> : <Unlock size={13} />}
              {state.locked ? 'Unlock Retainer' : 'Lock Retainer'}
            </button>
            <button
              onClick={() => advanceTime(6)}
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              +6h
            </button>
            <button
              onClick={() => advanceTime(24)}
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              +24h
            </button>
            <button
              onClick={resetTwin}
              style={{
                background: 'transparent',
                color: '#94A3B8',
                border: '1px solid #E2E8F0',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem'
          }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Remaining Liquid</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{state.liquid.toFixed(2)} L</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Headspace Volume</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{getHeadspace().toFixed(2)} L</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Volume Reduction</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)' }}>{Math.round(state.compression * 100)}%</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Pump Strokes</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{state.strokes}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Internal Pressure</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{estPressure} atm</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Seal Integrity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{sealScore}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Last Stroke Velocity</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>{lastStrokeStyle}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Agitation Loss</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: lastAgitationLoss > 0 ? '#DC2626' : '#059669', fontFamily: 'var(--font-mono)' }}>
                {Math.round(lastAgitationLoss * 100)}%
              </div>
            </div>

            <div style={{ gridColumn: '1/-1', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                  Estimated Dissolved CO2 ({state.hours}h elapsed)
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(state.fizz * 100)}%
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '999px', background: '#E2E8F0', marginTop: '0.4rem', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #10B981, #059669)',
                  width: `${Math.round(state.fizz * 100)}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill of Materials Table */}
      <div style={{ marginTop: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 0.85rem' }}>
          Bill of Materials (BOM) &amp; Landed Unit COGS ($2.10)
        </h3>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.65rem 0.85rem' }}>Component</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Material / Spec</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Qty</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Est. Unit Cost</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Sourcing Note</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Outer Sleeve Body</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>TPU-coated ripstop nylon, 2-chamber</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>1</td>
                <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$0.85</td>
                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>Standard dry-bag RF weld suppliers</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Seal Collar</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>Silicone, Shore 40A, molded collar</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>1</td>
                <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$0.35</td>
                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>Injection-molded silicone tooling</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Check Valve</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>Duckbill check valve, food-safe TPE</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>1</td>
                <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$0.22</td>
                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>Off-the-shelf medical valve stock</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Retainer Cinch Strap</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>25mm Nylon webbing + quick-release buckle</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>1</td>
                <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$0.40</td>
                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>Commercial buckle hardware vendor</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Packaging &amp; Card</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>Recyclable kraft sleeve + instruction card</td>
                <td style={{ padding: '0.65rem 0.85rem' }}>1</td>
                <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$0.28</td>
                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B' }}>Eco-friendly soy ink packaging</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0', fontWeight: 800 }}>
                <td colSpan={3} style={{ padding: '0.65rem 0.85rem' }}>Target Total Landed Unit COGS</td>
                <td style={{ padding: '0.65rem 0.85rem', color: '#059669', fontFamily: 'var(--font-mono)' }}>$2.10</td>
                <td style={{ padding: '0.65rem 0.85rem', color: '#64748B', fontWeight: 500 }}>Target Retail MSRP: $14.99–$18.99</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Open Engineering Question Card */}
      <div style={{
        marginTop: '1.5rem',
        background: '#FEFCE8',
        border: '1.5px solid #FDE047',
        borderRadius: '14px',
        padding: '1.25rem',
        color: '#713F12'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
          <AlertTriangle size={17} color="#CA8A04" />
          Open Community Engineering Question: Agitation Penalty vs. Headspace Savings
        </div>
        <div style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#854D0E' }}>
          Agitating a carbonated beverage nucleates micro-bubbles and temporarily accelerates CO₂ escape from solution (which is why shaking a bottle makes it fizz over).
          A rapid, forceful pump stroke on TWIIZZLock could locally accelerate fizz loss even while it shrinks the headspace that protects it long-term.
          Smooth, slow strokes largely avoid this penalty, but physical testing is required to map the exact threshold curves.
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <a
            href="https://github.com/Foxlendor/twinthink/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#854D0E',
              fontWeight: 700,
              fontSize: '0.8rem',
              textDecoration: 'underline'
            }}
          >
            Propose a dampener or view test curves on GitHub <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
