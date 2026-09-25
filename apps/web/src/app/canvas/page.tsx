'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Heart, Minus, Plus, Shuffle, X } from 'lucide-react';

type ShadowKind = 'physical' | 'audio' | 'writing' | 'software' | 'visual' | 'unknown';

type Shadow = {
  id: number;
  x: number;
  y: number;
  kind: ShadowKind;
  ageDays: number;
  revisions: number;
  returners: number;
  backers: number;
  activity: number;
  clarity: number;
  note: string;
};

const WORLD_SIZE = 2400;
const SHADOW_COUNT = 1400;

const notes = [
  'I keep coming back because there is still something here I have not solved.',
  'This started as a mistake and became the part I could not stop thinking about.',
  'I am trying to make the simplest version real before I explain the rest.',
  'I have rebuilt this enough times to know the first version was not the point.',
  'This is still early. I only want to know if someone else feels the pull.',
  'I noticed a pattern and I am still trying to understand what it wants to become.',
  'There is a working piece here, but I do not want to reveal the whole shape yet.',
  'I would rather show the trail than promise what this becomes.',
];

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeShadows(): Shadow[] {
  const random = mulberry32(474747);
  const kinds: ShadowKind[] = ['physical', 'audio', 'writing', 'software', 'visual', 'unknown'];

  return Array.from({ length: SHADOW_COUNT }, (_, index) => {
    const ageDays = Math.floor(4 + Math.pow(random(), 1.6) * 1500);
    const revisions = Math.floor(1 + Math.pow(random(), 1.4) * 96);
    const returners = Math.floor(Math.pow(random(), 2.1) * 5400);
    const backers = Math.floor(Math.pow(random(), 2.8) * 980);
    const activity = Math.min(1, (revisions / 100) * 0.55 + (returners / 5400) * 0.45);
    const clarity = Math.min(0.8, 0.06 + revisions / 420 + Math.log10(backers + 1) / 8);

    return {
      id: index + 1,
      x: 50 + random() * (WORLD_SIZE - 100),
      y: 50 + random() * (WORLD_SIZE - 100),
      kind: kinds[Math.floor(random() * kinds.length)],
      ageDays,
      revisions,
      returners,
      backers,
      activity,
      clarity,
      note: notes[Math.floor(random() * notes.length)],
    };
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: value >= 10000 ? 'compact' : 'standard' }).format(value);
}

function ageLabel(days: number) {
  if (days < 30) return days + ' days ago';
  if (days < 365) return Math.max(1, Math.round(days / 30)) + ' months ago';
  const years = days / 365;
  return (years < 2 ? years.toFixed(1) : Math.round(years)) + ' years ago';
}

function lifeState(shadow: Shadow) {
  if (shadow.revisions > 70 && shadow.returners > 900) return 'branching';
  if (shadow.activity > 0.55) return 'active';
  if (shadow.revisions > 16) return 'growing';
  return 'quiet';
}

export default function ShadowCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const initialFitRef = useRef(false);

  const shadows = useMemo(makeShadows, []);
  const [lensOn, setLensOn] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(0.36);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [backedIds, setBackedIds] = useState<Set<number>>(new Set());

  const selected = selectedId ? shadows.find((shadow) => shadow.id === selectedId) ?? null : null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('twinthink-backed-shadows');
      if (raw) setBackedIds(new Set(JSON.parse(raw) as number[]));
    } catch {
      // Local backing state is optional.
    }
  }, []);

  const persistBacks = useCallback((next: Set<number>) => {
    setBackedIds(next);
    try {
      window.localStorage.setItem('twinthink-backed-shadows', JSON.stringify([...next]));
    } catch {
      // The prototype still works when storage is unavailable.
    }
  }, []);

  const screenPoint = useCallback(
    (shadow: Shadow) => ({
      x: shadow.x * zoom + offset.x,
      y: shadow.y * zoom + offset.y,
    }),
    [offset.x, offset.y, zoom]
  );

  const centerOn = useCallback(
    (shadow: Shadow, nextZoom = Math.max(zoom, 1.5)) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setZoom(nextZoom);
      setOffset({
        x: rect.width / 2 - shadow.x * nextZoom,
        y: rect.height / 2 - shadow.y * nextZoom,
      });
      setSelectedId(shadow.id);
    },
    [zoom]
  );

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);

        if (!initialFitRef.current) {
          const fit = Math.min(rect.width, rect.height) / WORLD_SIZE;
          const firstZoom = Math.max(0.22, fit * 0.96);
          setZoom(firstZoom);
          setOffset({
            x: (rect.width - WORLD_SIZE * firstZoom) / 2,
            y: (rect.height - WORLD_SIZE * firstZoom) / 2,
          });
          initialFitRef.current = true;
        }
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = '#fdfdfb';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const gridStep = 120 * zoom;
      if (gridStep > 28) {
        const startX = ((offset.x % gridStep) + gridStep) % gridStep;
        const startY = ((offset.y % gridStep) + gridStep) % gridStep;
        ctx.strokeStyle = lensOn ? 'rgba(17,24,39,0.035)' : 'rgba(17,24,39,0.018)';
        ctx.lineWidth = 1;
        for (let x = startX; x < rect.width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rect.height);
          ctx.stroke();
        }
        for (let y = startY; y < rect.height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(rect.width, y);
          ctx.stroke();
        }
      }

      for (const shadow of shadows) {
        const sx = shadow.x * zoom + offset.x;
        const sy = shadow.y * zoom + offset.y;
        if (sx < -24 || sy < -24 || sx > rect.width + 24 || sy > rect.height + 24) continue;

        const backed = backedIds.has(shadow.id);
        const selectedNow = shadow.id === selectedId;
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.0015 + shadow.id * 0.67);
        const life = shadow.activity * (0.35 + pulse * 0.65);
        const baseSize = Math.max(0.75, Math.min(5.5, zoom * 2.35));
        const size = baseSize + (lensOn ? life * 2.4 : life * 0.45) + (backed ? 1.1 : 0);

        const publicAlpha = 0.018 + shadow.clarity * 0.055;
        const lensAlpha = 0.12 + shadow.clarity * 0.55 + (backed ? 0.12 : 0);
        ctx.fillStyle = 'rgba(17,24,39,' + (lensOn ? lensAlpha : publicAlpha) + ')';

        if (lensOn && shadow.kind === 'audio') {
          ctx.fillRect(sx - size * 0.55, sy - size * 1.7, Math.max(1, size * 0.65), size * 3.4);
          ctx.fillRect(sx + size * 0.25, sy - size, Math.max(1, size * 0.45), size * 2);
        } else if (lensOn && shadow.kind === 'writing') {
          ctx.fillRect(sx - size, sy - size * 0.45, size * 2, Math.max(1, size * 0.5));
        } else if (lensOn && shadow.kind === 'software') {
          ctx.fillRect(sx - size, sy - size, size * 2, size * 2);
          ctx.fillStyle = '#fdfdfb';
          ctx.fillRect(sx - size * 0.35, sy - size * 0.35, size * 0.7, size * 0.7);
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }

        if (lensOn && zoom > 0.75 && shadow.revisions > 18) {
          const trailLength = Math.min(24, 3 + shadow.revisions / 4);
          ctx.strokeStyle = 'rgba(17,24,39,' + (0.03 + shadow.activity * 0.08) + ')';
          ctx.lineWidth = Math.max(0.5, Math.min(1.2, zoom * 0.55));
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - trailLength * zoom * 0.6, sy + Math.sin(shadow.id) * trailLength * zoom * 0.22);
          ctx.stroke();
        }

        if (selectedNow) {
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(10, size + 8), 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(17,24,39,0.62)';
          ctx.lineWidth = 1.25;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(16, size + 15 + pulse * 4), 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(17,24,39,' + (0.08 + pulse * 0.08) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      frameRef.current = window.requestAnimationFrame(draw);
    },
    [backedIds, lensOn, offset.x, offset.y, selectedId, shadows, zoom]
  );

  useEffect(() => {
    frameRef.current = window.requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  const pickShadowAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const threshold = Math.max(10, 15 / Math.max(zoom, 0.2));
      let best: Shadow | null = null;
      let bestDistance = threshold * threshold;

      for (const shadow of shadows) {
        const point = screenPoint(shadow);
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = shadow;
        }
      }

      return best;
    },
    [screenPoint, shadows, zoom]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    movedRef.current = 0;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - lastPointerRef.current.x;
    const dy = event.clientY - lastPointerRef.current.y;
    movedRef.current += Math.abs(dx) + Math.abs(dy);
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    setOffset((current) => ({ x: current.x + dx, y: current.y + dy }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (movedRef.current < 8) {
      const picked = pickShadowAt(event.clientX, event.clientY);
      if (picked) {
        setSelectedId(picked.id);
        if (!lensOn) setLensOn(true);
      }
    }
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;
    const factor = event.deltaY > 0 ? 0.88 : 1.14;
    const nextZoom = Math.max(0.16, Math.min(7, zoom * factor));

    setZoom(nextZoom);
    setOffset({
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom,
    });
  };

  const randomShadow = () => {
    const shadow = shadows[Math.floor(Math.random() * shadows.length)];
    setLensOn(true);
    centerOn(shadow, Math.max(1.7, zoom));
  };

  const adjustZoom = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const worldX = (centerX - offset.x) / zoom;
    const worldY = (centerY - offset.y) / zoom;
    const nextZoom = Math.max(0.16, Math.min(7, zoom * factor));
    setZoom(nextZoom);
    setOffset({
      x: centerX - worldX * nextZoom,
      y: centerY - worldY * nextZoom,
    });
  };

  const backSelected = () => {
    if (!selected || backedIds.has(selected.id)) return;
    const next = new Set(backedIds);
    next.add(selected.id);
    persistBacks(next);
  };

  const backedSelected = selected ? backedIds.has(selected.id) : false;
  const shownBackers = selected ? selected.backers + (backedSelected ? 1 : 0) : 0;

  return (
    <main style={{ minHeight: 'calc(100vh - 64px)', background: '#fdfdfb', color: '#111827' }}>
      <section
        style={{
          height: 'calc(100vh - 64px)',
          minHeight: 620,
          position: 'relative',
          overflow: 'hidden',
          background: '#fdfdfb',
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="TwinThink Shadow Canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onWheel={handleWheel}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            touchAction: 'none',
            cursor: 'grab',
          }}
        />

        <div style={{ position: 'absolute', top: 28, left: 28, maxWidth: 480, pointerEvents: 'none' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: 10,
            }}
          >
            TwinThink Canvas · prototype
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3.6rem)',
              lineHeight: 0.98,
              letterSpacing: '-0.055em',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Something is here.
          </h1>
          <p style={{ maxWidth: 410, marginTop: 12, fontSize: '0.9rem', lineHeight: 1.55, color: '#6b7280' }}>
            Move through the blank. Use the Lens when you want to see which ideas have a history.
          </p>
        </div>

        <div
          style={{
            position: 'absolute',
            right: selected ? 388 : 24,
            top: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'right 180ms ease',
          }}
        >
          <button type="button" onClick={() => setLensOn((current) => !current)} style={controlButton(lensOn)} aria-pressed={lensOn}>
            {lensOn ? <EyeOff size={16} /> : <Eye size={16} />}
            {lensOn ? 'Hide Lens' : 'Use Lens'}
          </button>
          <button type="button" onClick={randomShadow} style={controlButton(false)}>
            <Shuffle size={16} />
            Random
          </button>
        </div>

        <div style={{ position: 'absolute', left: 24, bottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => adjustZoom(0.8)} style={roundButton()} aria-label="Zoom out">
            <Minus size={16} />
          </button>
          <div
            style={{
              minWidth: 74,
              textAlign: 'center',
              padding: '8px 10px',
              borderRadius: 999,
              border: '1px solid rgba(17,24,39,0.08)',
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(10px)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: '#6b7280',
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <button type="button" onClick={() => adjustZoom(1.25)} style={roundButton()} aria-label="Zoom in">
            <Plus size={16} />
          </button>
        </div>

        <div
          style={{
            position: 'absolute',
            right: selected ? 388 : 24,
            bottom: 24,
            maxWidth: 360,
            padding: '10px 13px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.76)',
            border: '1px solid rgba(17,24,39,0.07)',
            backdropFilter: 'blur(12px)',
            color: '#6b7280',
            fontSize: '0.75rem',
            lineHeight: 1.45,
            transition: 'right 180ms ease',
          }}
        >
          {lensOn
            ? 'The Lens exposes continuity, not the protected idea. Zoom closer or choose a living mark.'
            : 'At public distance the Canvas is intentionally close to blank.'}
        </div>

        {selected && (
          <aside
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 'min(364px, 92vw)',
              height: '100%',
              background: 'rgba(255,255,255,0.96)',
              borderLeft: '1px solid #ececec',
              backdropFilter: 'blur(18px)',
              padding: '24px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-18px 0 50px rgba(17,24,39,0.045)',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Close shadow"
              style={{
                alignSelf: 'flex-end',
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid #ececec',
                background: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              <X size={15} />
            </button>

            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: '#9ca3af',
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                }}
              >
                Shadow {String(selected.id).padStart(4, '0')} · {lifeState(selected)}
              </div>

              <h2 style={{ margin: '14px 0 0', fontSize: '1.85rem', letterSpacing: '-0.04em', lineHeight: 1.05, fontWeight: 650 }}>
                Untitled
              </h2>

              <p style={{ margin: '22px 0 0', fontSize: '1.02rem', lineHeight: 1.65, color: '#374151' }}>
                “{selected.note}”
              </p>
            </div>

            <div
              style={{
                marginTop: 30,
                borderTop: '1px solid #eeeeeb',
                borderBottom: '1px solid #eeeeeb',
                padding: '18px 0',
                display: 'grid',
                gap: 13,
              }}
            >
              <EvidenceLine label="Started" value={ageLabel(selected.ageDays)} />
              <EvidenceLine label="Changed" value={selected.revisions + ' times'} />
              <EvidenceLine label="People who returned" value={formatNumber(selected.returners)} />
              <EvidenceLine label="Want the next step" value={formatNumber(shownBackers)} />
            </div>

            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 8,
                }}
              >
                What backing means
              </div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.84rem', lineHeight: 1.55 }}>
                You are not buying or rating it. You are leaving one durable signal: you want to see what happens next.
              </p>
            </div>

            <button
              type="button"
              disabled={backedSelected}
              onClick={backSelected}
              style={{
                marginTop: 28,
                width: '100%',
                minHeight: 48,
                borderRadius: 14,
                border: backedSelected ? '1px solid #d1d5db' : '1px solid #111827',
                background: backedSelected ? '#f7f7f5' : '#111827',
                color: backedSelected ? '#6b7280' : '#fff',
                fontWeight: 650,
                fontSize: '0.9rem',
                cursor: backedSelected ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Heart size={16} fill={backedSelected ? 'currentColor' : 'none'} />
              {backedSelected ? 'Backed · come back later' : 'Back this'}
            </button>

            {backedSelected && (
              <p style={{ margin: '12px 0 0', color: '#6b7280', fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.45 }}>
                Your Lens now renders this Shadow a little closer on this device.
              </p>
            )}

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 34,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: '#b1b5bd',
                lineHeight: 1.5,
              }}
            >
              Prototype data only. The interaction is real; these continuity records are seeded demo records until the Canvas is wired to live Twins.
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}

function EvidenceLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'baseline' }}>
      <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{label}</span>
      <strong style={{ color: '#374151', fontSize: '0.82rem', fontWeight: 600, textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function controlButton(active: boolean): React.CSSProperties {
  return {
    minHeight: 40,
    padding: '0 14px',
    borderRadius: 999,
    border: active ? '1px solid #111827' : '1px solid rgba(17,24,39,0.09)',
    background: active ? '#111827' : 'rgba(255,255,255,0.82)',
    color: active ? '#fff' : '#374151',
    backdropFilter: 'blur(10px)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(17,24,39,0.04)',
  };
}

function roundButton(): React.CSSProperties {
  return {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '1px solid rgba(17,24,39,0.08)',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(10px)',
    display: 'grid',
    placeItems: 'center',
    color: '#4b5563',
    cursor: 'pointer',
  };
}
