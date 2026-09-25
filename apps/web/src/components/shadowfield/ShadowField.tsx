'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera } from '@/lib/shadowfield/camera';
import { IdeaNode, LifeEvent, SEAL_MARGIN } from '@/lib/shadowfield/model';
import { topologyOf } from '@/lib/shadowfield/layout';
import { Access, Flight, pan as panCam, stepFlight, zoomAt } from '@/lib/shadowfield/navigate';
import { Hit, Lens, RenderState, continuityLine, render, shortDate } from '@/lib/shadowfield/render';
import { buildWorld, resolvePath } from '@/lib/shadowfield/world';
import { createLocalStore, ShadowStore } from '@/lib/shadowfield/sources/local';
import styles from './ShadowField.module.css';

interface Props {
  serif: string;
  /** Optional world override (the rehearsal field). */
  worldFactory?: () => IdeaNode;
  rehearsal?: boolean;
}

interface Composer {
  mode: 'cast' | 'thought' | 'rewrite';
  x: number;
  y: number;
  lx: number;
  ly: number;
  shadowId?: string;
  parentId?: string | null;
  thoughtId?: string | null;
  initial?: string;
}

interface Tip {
  x: number;
  y: number;
  title: string;
  line?: string;
}

const FOLLOW_KEY = 'twinthink.following.v1';
const VISITED_KEY = 'twinthink.visited.v1';
const HINT_KEY = 'twinthink.hinted.v1';

function readSet(key: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // optional
  }
}

/** Viewer closeness p for a top-level Twin (see model.ts, disclosure). */
function closenessFor(top: IdeaNode, followedSet: Set<string>) {
  if (top.ownedBy === 'viewer') return 1;
  return followedSet.has(top.id) ? 0.72 : 0.45;
}

function localIds(node: IdeaNode): { shadowId: string; thoughtId: string | null } | null {
  if (!node.id.startsWith('local/')) return null;
  const [, shadowId, thoughtId] = node.id.split('/');
  return { shadowId, thoughtId: thoughtId ?? null };
}

/** The most open visible spot inside the current frame, for a new thought. */
function openSpot(cam: Camera, node: IdeaNode): [number, number] {
  let best: [number, number] = [0.4, 0];
  let bestScore = -Infinity;
  for (let i = 0; i < 64; i++) {
    const ang = (i / 64) * Math.PI * 2 + 0.37;
    for (const rho of [0.3, 0.45, 0.6, 0.72]) {
      const x = Math.cos(ang) * rho;
      const y = Math.sin(ang) * rho;
      const [sx, sy] = cam.toScreen(x, y);
      if (sx < 60 || sy < 60 || sx > cam.w - 280 || sy > cam.h - 100) continue;
      let d = 1;
      for (const c of node.children) d = Math.min(d, Math.hypot(c.x - x, c.y - y) - c.r);
      const score = d - Math.abs(rho - 0.5) * 0.3 + Math.sin(i * 12.9898) * 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = [x, y];
      }
    }
  }
  return best;
}

function eventLabel(ev: LifeEvent) {
  const d = new Date(ev.t);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${shortDate(ev.t)}, ${time}`;
}

export default function ShadowField({ serif, worldFactory, rehearsal = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const storeRef = useRef<ShadowStore | null>(null);
  const worldRef = useRef<IdeaNode | null>(null);
  const camRef = useRef<Camera | null>(null);
  const lensRef = useRef<Lens>({ closeness: () => 0.5, visited: new Set(), followed: new Set() });
  const hitsRef = useRef<Hit[]>([]);
  const flightRef = useRef<Flight | null>(null);
  const pointerRef = useRef({ x: -1, y: -1, inside: false });
  const velRef = useRef({ x: 0, y: 0 });
  const zoomVelRef = useRef({ v: 0, x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef({ active: false, moved: 0, lastT: 0 });
  const pinchRef = useRef<{ d: number; x: number; y: number } | null>(null);
  const hoverRef = useRef<Hit | null>(null);
  const monoRef = useRef('monospace');
  const lastPathKey = useRef('');
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 });
  // replay: progress 0..1 through [from, to]; playing advances it over time
  const replayRef = useRef<{ from: number; to: number; progress: number; playing: boolean; hold: number } | null>(null);

  const [path, setPath] = useState<IdeaNode[]>([]);
  const [depthPos, setDepthPos] = useState(0);
  const [view, setView] = useState({ w: 800, h: 600 });
  const [tip, setTip] = useState<Tip | null>(null);
  const [composer, setComposer] = useState<Composer | null>(null);
  const [hinted, setHinted] = useState(true);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [, setVersion] = useState(0);
  const [replayView, setReplayView] = useState<{ progress: number; t: number; playing: boolean } | null>(null);

  const access: Access = useMemo(
    () => ({
      canEnter: (n: IdeaNode) => {
        const cam = camRef.current;
        if (!cam) return true;
        if (cam.depth === 0) return true;
        const p = lensRef.current.closeness(cam.path[1]);
        return n.disclosure <= p;
      },
      closenessAt: (p: IdeaNode[]) => (p.length > 1 ? lensRef.current.closeness(p[1]) : 1),
    }),
    []
  );

  const rebuild = useCallback(() => {
    const store = storeRef.current!;
    const world = worldFactory ? worldFactory() : buildWorld(store.list());
    worldRef.current = world;
    const cam = camRef.current;
    if (cam) {
      const ids = cam.path.slice(1).map((n) => n.id);
      const np = resolvePath(world, ids);
      const lost = np.length !== cam.path.length;
      cam.path = np;
      if (lost) cam.normalize(access.canEnter);
    }
    setVersion((v) => v + 1);
  }, [access, worldFactory]);

  const flyToIds = useCallback((ids: string[]) => {
    const world = worldRef.current;
    if (!world) return;
    flightRef.current = { target: resolvePath(world, ids), radius: 0.53 };
  }, []);

  // ---------------------------------------------------------------- setup
  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    storeRef.current = createLocalStore(rehearsal ? null : storage);
    const followedSet = readSet(FOLLOW_KEY);
    lensRef.current = {
      closeness: (top: IdeaNode) => closenessFor(top, lensRef.current.followed),
      visited: readSet(VISITED_KEY),
      followed: followedSet,
    };
    let wasHinted = false;
    try {
      wasHinted = window.localStorage.getItem(HINT_KEY) === '1';
    } catch {
      wasHinted = false;
    }
    // hydrate per-device state once, after mount (localStorage is client-only)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFollowed(new Set(followedSet));
    setHinted(wasHinted);
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains-mono').trim();
    monoRef.current = mono ? `${mono}, monospace` : 'monospace';

    const world = worldFactory ? worldFactory() : buildWorld(storeRef.current.list());
    worldRef.current = world;
    const cam = new Camera(world);
    camRef.current = cam;
    // exposed for scripted visual checks (e2e); read-only by convention
    (window as unknown as { __shadowField?: unknown }).__shadowField = { cam, flyTo: (ids: string[]) => flyToIds(ids) };
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    cam.resize(rect.width, rect.height);
    cam.s = Math.min(rect.width, rect.height) * 0.45;

    // restore a journey from the URL: #path=a~b~c&z=..&c=x,y
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const ids = (params.get('path') ?? '').split('~').filter(Boolean);
      if (ids.length) {
        const p = resolvePath(world, ids);
        const z = Number(params.get('z') ?? '0.5');
        const [x, y] = (params.get('c') ?? '0,0').split(',').map(Number);
        cam.path = p;
        cam.s = cam.M * (Number.isFinite(z) && z > 0 ? z : 0.5);
        cam.cx = Number.isFinite(x) ? x : 0;
        cam.cy = Number.isFinite(y) ? y : 0;
        cam.normalize(access.canEnter);
      }
    } catch {
      // ignore malformed hashes
    }
    setVersion((v) => v + 1);
  }, [access, flyToIds, rehearsal, worldFactory]);

  // ---------------------------------------------------------------- frame loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastHash = 0;
    let lastDepthUpdate = 0;

    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame);
      const canvas = canvasRef.current;
      const cam = camRef.current;
      if (!canvas || !cam) return;
      const dt = Math.min(0.05, (nowMs - last) / 1000);
      last = nowMs;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      cam.resize(rect.width, rect.height);

      // motion
      if (flightRef.current) {
        if (stepFlight(cam, flightRef.current, access, dt)) flightRef.current = null;
      } else if (!dragRef.current.active) {
        const v = velRef.current;
        if (Math.abs(v.x) + Math.abs(v.y) > 0.05) {
          panCam(cam, v.x * dt * 60, v.y * dt * 60, access);
          const decay = Math.pow(0.9, dt * 60);
          v.x *= decay;
          v.y *= decay;
        }
      }
      const zv = zoomVelRef.current;
      if (Math.abs(zv.v) > 0.0004) {
        const step = zv.v * Math.min(1, dt * 14);
        zoomAt(cam, zv.x, zv.y, Math.exp(step), access);
        zv.v -= step;
      }

      const rp = replayRef.current;
      let cut: number | null = null;
      if (rp) {
        if (rp.playing) {
          rp.progress = Math.min(1, rp.progress + dt / 14);
          if (rp.progress >= 1) {
            rp.hold += dt;
            if (rp.hold > 1.6) {
              replayRef.current = null;
              setReplayView(null);
            }
          }
        }
        if (replayRef.current) {
          // ease so the first moments of an idea are not rushed
          const e = rp.progress < 1 ? Math.pow(rp.progress, 1.35) : 1;
          cut = rp.from + (rp.to - rp.from) * e;
        }
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const k = Math.max(0, cam.depth - 2);
      const T = cam.transformAt(k);
      const startPath = cam.path.slice(0, k + 1);
      const p = k === 0 ? 1 : lensRef.current.closeness(cam.path[1]);
      const st: RenderState = {
        ctx,
        w: rect.width,
        h: rect.height,
        M: cam.M,
        time: nowMs / 1000,
        lens: lensRef.current,
        hits: hitsRef.current,
        serif,
        mono: monoRef.current,
        hoverId: hoverRef.current?.kind === 'node' ? hoverRef.current.node.id : null,
        hoverEv: hoverRef.current?.ev ?? null,
        now: cut ?? Date.now(),
        cut,
      };
      render(st, cam.path[k], startPath, T, p, k === 0);

      // hover
      const ptr = pointerRef.current;
      let hover: Hit | null = null;
      if (ptr.inside && !dragRef.current.active) {
        let best = Infinity;
        for (const h of hitsRef.current) {
          const d = Math.hypot(h.x - ptr.x, h.y - ptr.y);
          const bias = h.kind === 'event' ? 0.7 : 1;
          if (d < h.r && d * bias < best) {
            best = d * bias;
            hover = h;
          }
        }
      }
      const prev = hoverRef.current;
      hoverRef.current = hover;
      if (hover !== prev && (hover?.node !== prev?.node || hover?.ev !== prev?.ev)) {
        if (!hover) setTip(null);
        else if (hover.kind === 'event' && hover.ev) {
          setTip({ x: hover.x, y: hover.y, title: hover.ev.note ?? hover.ev.kind, line: eventLabel(hover.ev) });
        } else if (hover.node) {
          // marks large enough to carry their own label need no tooltip
          if (hover.size < 5 || hover.sealed) {
            setTip({
              x: hover.x,
              y: hover.y,
              title: hover.sealed ? 'something is here' : hover.node.title ?? 'untitled',
              line: hover.sealed ? 'not open to you yet' : continuityLine(hover.node, Date.now()),
            });
          } else setTip(null);
        }
      }
      canvas.style.cursor = dragRef.current.active ? 'grabbing' : hover ? 'pointer' : 'default';

      // state that the chrome needs
      const key = cam.path.map((n) => n.id).join('~');
      if (key !== lastPathKey.current) {
        lastPathKey.current = key;
        setPath([...cam.path]);
        if (cam.depth >= 1) {
          const top = cam.path[1];
          if (!lensRef.current.visited.has(top.id)) {
            lensRef.current.visited.add(top.id);
            writeSet(VISITED_KEY, lensRef.current.visited);
          }
          const ids = localIds(top);
          if (ids && storeRef.current) storeRef.current.visit(ids.shadowId);
        }
      }
      if (nowMs - lastDepthUpdate > 120) {
        lastDepthUpdate = nowMs;
        const fit = Math.log(Math.min(cam.w, cam.h) * 0.45);
        setDepthPos(Math.max(0, Math.min(1, (cam.logZ() - fit) / 19)));
        setView((v) => (v.w === cam.w && v.h === cam.h ? v : { w: cam.w, h: cam.h }));
        const r = replayRef.current;
        if (r && cut !== null) setReplayView({ progress: r.progress, t: cut, playing: r.playing });
      }
      if (!rehearsal && nowMs - lastHash > 700) {
        lastHash = nowMs;
        const ids = cam.path.slice(1).map((n) => n.id);
        const hash = ids.length
          ? `path=${ids.map(encodeURIComponent).join('~')}&z=${(cam.s / cam.M).toPrecision(4)}&c=${cam.cx.toFixed(5)},${cam.cy.toFixed(5)}`
          : '';
        if (hash !== window.location.hash.slice(1)) {
          history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [access, rehearsal, serif]);

  // ---------------------------------------------------------------- input
  const dismissHint = useCallback(() => {
    if (hinted) return;
    setHinted(true);
    try {
      window.localStorage.setItem(HINT_KEY, '1');
    } catch {
      // optional
    }
  }, [hinted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      if (!cam) return;
      flightRef.current = null;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const unit = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? rect.height : 1;
      const dy = e.deltaY * unit;
      const dx = e.deltaX * unit;
      if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy) * 1.2) {
        panCam(cam, -dx, 0, access);
        return;
      }
      const strength = e.ctrlKey ? 0.012 : 0.0023;
      const amount = Math.max(-0.6, Math.min(0.6, -dy * strength));
      const zv = zoomVelRef.current;
      zv.v += amount;
      zv.x = x;
      zv.y = y;
      dismissHint();
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [access, dismissHint]);

  const flyTo = useCallback((target: IdeaNode[], radius = 0.53) => {
    flightRef.current = { target, radius };
    velRef.current = { x: 0, y: 0 };
    zoomVelRef.current.v = 0;
  }, []);

  const openComposerAt = useCallback(
    (sx: number, sy: number) => {
      const cam = camRef.current;
      if (!cam || rehearsal) return;
      const [lx, ly] = cam.toLocal(sx, sy);
      if (cam.depth === 0) {
        setComposer({ mode: 'cast', x: sx, y: sy, lx, ly });
        return;
      }
      const ids = localIds(cam.node);
      if (!ids || Math.hypot(lx, ly) > 0.9) return;
      setComposer({ mode: 'thought', x: sx, y: sy, lx, ly, shadowId: ids.shadowId, parentId: ids.thoughtId });
    },
    [rehearsal]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointersRef.current.set(e.pointerId, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.currentTarget.setPointerCapture(e.pointerId);
    flightRef.current = null;
    velRef.current = { x: 0, y: 0 };
    dragRef.current = { active: true, moved: 0, lastT: performance.now() };
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    dismissHint();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointerRef.current = { x, y, inside: true };
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x, y });
    const cam = camRef.current;
    if (!cam) return;
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      panCam(cam, mx - pinchRef.current.x, my - pinchRef.current.y, access);
      if (pinchRef.current.d > 10) zoomAt(cam, mx, my, d / pinchRef.current.d, access);
      pinchRef.current = { d, x: mx, y: my };
      dragRef.current.moved += 20;
      return;
    }
    const dx = x - prev.x;
    const dy = y - prev.y;
    dragRef.current.moved += Math.abs(dx) + Math.abs(dy);
    panCam(cam, dx, dy, access);
    const now = performance.now();
    const dtm = Math.max(1, now - dragRef.current.lastT);
    dragRef.current.lastT = now;
    velRef.current = { x: (dx / dtm) * 16, y: (dy / dtm) * 16 };
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size > 0) return;
    const moved = dragRef.current.moved;
    dragRef.current.active = false;
    if (performance.now() - dragRef.current.lastT > 80) velRef.current = { x: 0, y: 0 };
    if (moved > 6) return;
    velRef.current = { x: 0, y: 0 };

    const now = performance.now();
    const lastTap = lastTapRef.current;
    const isDouble = now - lastTap.t < 320 && Math.hypot(lastTap.x - x, lastTap.y - y) < 24;
    lastTapRef.current = { t: now, x, y };

    const hit = hoverRef.current ?? hitsRef.current.find((h) => Math.hypot(h.x - x, h.y - y) < h.r) ?? null;
    if (hit && hit.kind === 'node') {
      flyTo(hit.path, hit.sealed ? 0.12 : 0.53);
      return;
    }
    if (isDouble) openComposerAt(x, y);
  };

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (composer) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const cam = camRef.current;
      if (!cam) return;
      const cx = cam.w / 2;
      const cy = cam.h / 2;
      if (e.key === '+' || e.key === '=') zoomVelRef.current = { v: 0.5, x: cx, y: cy };
      else if (e.key === '-' || e.key === '_') zoomVelRef.current = { v: -0.5, x: cx, y: cy };
      else if (e.key === 'ArrowLeft') velRef.current.x += 6;
      else if (e.key === 'ArrowRight') velRef.current.x -= 6;
      else if (e.key === 'ArrowUp') velRef.current.y += 6;
      else if (e.key === 'ArrowDown') velRef.current.y -= 6;
      else if (e.key === 'Escape' || e.key === 'Backspace') {
        if (cam.depth > 0) flyTo(cam.path.slice(0, cam.depth));
      } else return;
      e.preventDefault();
      dismissHint();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [composer, dismissHint, flyTo]);

  // ---------------------------------------------------------------- actions
  const wander = () => {
    const world = worldRef.current;
    if (!world) return;
    const options = world.children.filter((c) => c.id !== camRef.current?.path[1]?.id);
    const pick = options.length ? options[Math.floor(Math.random() * options.length)] : world.children[0];
    if (pick) flyTo([world, pick]);
  };

  const startReplay = () => {
    const cam = camRef.current;
    if (!cam || cam.depth < 1) return;
    const top = cam.path[1];
    const to = Date.now();
    replayRef.current = { from: top.began - 3600000, to, progress: 0, playing: true, hold: 0 };
    setReplayView({ progress: 0, t: top.began, playing: true });
  };

  const stopReplay = () => {
    replayRef.current = null;
    setReplayView(null);
  };

  const scrubReplay = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = replayRef.current;
    if (!r) return;
    const rect = e.currentTarget.getBoundingClientRect();
    r.progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    r.playing = false;
    r.hold = 0;
  };

  const toggleFollow = (node: IdeaNode) => {
    const next = new Set(lensRef.current.followed);
    if (next.has(node.id)) next.delete(node.id);
    else next.add(node.id);
    lensRef.current.followed = next;
    writeSet(FOLLOW_KEY, next);
    setFollowed(new Set(next));
  };

  const submitComposer = (text: string) => {
    const c = composer;
    const store = storeRef.current;
    setComposer(null);
    if (!c || !store) return;
    const value = text.trim();
    if (!value) return;
    if (c.mode === 'cast') {
      const s = store.cast(value, c.lx, c.ly);
      rebuild();
      const world = worldRef.current!;
      const node = world.children.find((n) => n.id === `local/${s.id}`);
      if (node) flyTo([world, node]);
    } else if (c.mode === 'thought' && c.shadowId) {
      store.addThought(c.shadowId, c.parentId ?? null, value, c.lx, c.ly);
      rebuild();
    } else if (c.mode === 'rewrite' && c.shadowId) {
      store.revise(c.shadowId, c.thoughtId ?? null, value);
      rebuild();
    }
  };

  const current = path[path.length - 1];
  const top = path[1];
  const ownedHere = current ? localIds(current) : null;
  const isFollowed = top ? followed.has(top.id) : false;
  const nearby = current ? (topologyOf(current), current.children) : [];
  const p = top ? closenessFor(top, followed) : 1;

  return (
    <div className={styles.field}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="TwinThink Canvas. Scroll to move closer to an idea, drag to wander."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => {
          pointersRef.current.delete(e.pointerId);
          pinchRef.current = null;
          dragRef.current.active = false;
        }}
        onPointerLeave={() => {
          pointerRef.current.inside = false;
          setTip(null);
        }}
      />

      <Link href="/" className={styles.mark} aria-label="TwinThink home">
        twinthink
      </Link>

      <nav className={styles.trail} aria-label="Where you are">
        {path.map((n, i) => (
          <React.Fragment key={n.id}>
            {i > 0 && <span className={styles.sep}>·</span>}
            <button
              type="button"
              className={i === path.length - 1 ? styles.here : styles.crumb}
              onClick={() => flyTo(path.slice(0, i + 1))}
            >
              {i === 0 ? (rehearsal ? 'rehearsal field' : 'canvas') : n.title ?? 'untitled'}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className={styles.depth} aria-hidden>
        <div className={styles.depthLine} />
        <div className={styles.depthDot} style={{ top: `${depthPos * 100}%` }} />
      </div>

      <div className={styles.actions}>
        {path.length <= 1 && (
          <>
            {!rehearsal && (
              <button
                type="button"
                className={styles.quiet}
                onClick={() => {
                  const c = camRef.current;
                  if (c) openComposerAt(c.w / 2, c.h / 2);
                }}
              >
                cast a shadow
              </button>
            )}
            <button type="button" className={styles.quiet} onClick={wander}>
              wander
            </button>
          </>
        )}
        {top && (
          <button type="button" className={styles.quiet} onClick={replayView ? stopReplay : startReplay}>
            {replayView ? 'return to now' : 'watch it grow'}
          </button>
        )}
        {top && top.ownedBy !== 'viewer' && (
          <button
            type="button"
            className={isFollowed ? styles.following : styles.quiet}
            onClick={() => toggleFollow(top)}
            aria-pressed={isFollowed}
          >
            {isFollowed ? 'following — you can go a little further' : 'I want to see what happens next'}
          </button>
        )}
        {ownedHere && current && (
          <>
            <button
              type="button"
              className={styles.quiet}
              onClick={() => {
                const c = camRef.current;
                if (!c) return;
                // place a new thought in the most open visible space
                const [lx, ly] = openSpot(c, c.node);
                const [sx, sy] = c.toScreen(lx, ly);
                setComposer({
                  mode: 'thought',
                  x: Math.max(40, Math.min(c.w - 260, sx)),
                  y: Math.max(60, Math.min(c.h - 80, sy)),
                  lx,
                  ly,
                  shadowId: ownedHere.shadowId,
                  parentId: ownedHere.thoughtId,
                });
              }}
            >
              add a thought
            </button>
            <button
              type="button"
              className={styles.quiet}
              onClick={() => {
                const c = camRef.current;
                if (!c) return;
                setComposer({
                  mode: 'rewrite',
                  x: c.w / 2 - 130,
                  y: c.h - 150,
                  lx: 0,
                  ly: 0,
                  shadowId: ownedHere.shadowId,
                  thoughtId: ownedHere.thoughtId,
                  initial: current.artifact?.type === 'text' ? current.artifact.body : current.note ?? current.title ?? '',
                });
              }}
            >
              rewrite
            </button>
            {ownedHere.thoughtId && (
              <button
                type="button"
                className={styles.quiet}
                onClick={() => {
                  storeRef.current?.letGo(ownedHere.shadowId, ownedHere.thoughtId!);
                  rebuild();
                }}
              >
                {current.state === 'abandoned' ? 'take it back' : 'let it go'}
              </button>
            )}
          </>
        )}
      </div>

      {replayView && (
        <div className={styles.replay}>
          <div
            className={styles.replayTrack}
            role="slider"
            aria-label="Moment in this idea's life"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(replayView.progress * 100)}
            tabIndex={0}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              scrubReplay(e);
            }}
            onPointerMove={(e) => {
              if (e.buttons) scrubReplay(e);
            }}
            onKeyDown={(e) => {
              const r = replayRef.current;
              if (!r) return;
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                r.playing = false;
                r.progress = Math.max(0, Math.min(1, r.progress + (e.key === 'ArrowLeft' ? -0.02 : 0.02)));
                e.stopPropagation();
              } else if (e.key === ' ') {
                r.playing = !r.playing;
                e.preventDefault();
              }
            }}
          >
            <div className={styles.replayFill} style={{ width: `${replayView.progress * 100}%` }} />
          </div>
          <div className={styles.replayDate}>
            {new Date(replayView.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()}
            {' · '}
            {new Date(replayView.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
          </div>
        </div>
      )}

      {tip && (
        <div className={styles.tip} style={{ left: tip.x + 14, top: tip.y - 8 }}>
          <div className={styles.tipTitle}>{tip.title}</div>
          {tip.line && <div className={styles.tipLine}>{tip.line}</div>}
        </div>
      )}

      {composer && (
        <form
          className={styles.composer}
          style={{
            left: Math.max(16, Math.min(view.w - 300, composer.x - 8)),
            top: Math.max(16, Math.min(view.h - 90, composer.y - 18)),
          }}
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('text') as HTMLInputElement;
            submitComposer(input.value);
          }}
        >
          <input
            name="text"
            autoFocus
            maxLength={280}
            defaultValue={composer.initial ?? ''}
            placeholder={composer.mode === 'cast' ? 'what are you thinking about?' : composer.mode === 'thought' ? 'a thought inside it' : ''}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setComposer(null);
            }}
            onBlur={(e) => {
              if (!e.currentTarget.value.trim()) setComposer(null);
            }}
          />
          <span className={styles.composerHint}>
            {composer.mode === 'cast' ? 'enter to cast · kept on this device for now' : 'enter to keep'}
          </span>
        </form>
      )}

      {rehearsal && <div className={styles.note}>synthetic specimens for testing scale · not human ideas</div>}

      {!hinted && path.length <= 1 && <div className={styles.hint}>scroll toward anything</div>}

      <nav className={styles.srNav} aria-label="Ideas here">
        <p aria-live="polite">
          {current ? (path.length > 1 ? `Inside ${current.title ?? 'an untitled idea'}.` : 'On the Canvas.') : ''}
        </p>
        <ul>
          {nearby
            .filter((c) => path.length <= 1 || c.disclosure <= p + SEAL_MARGIN)
            .map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => flyTo([...path, c])}>
                  {c.disclosure > p && path.length > 1 ? 'something not open yet' : c.title ?? 'untitled'}
                </button>
              </li>
            ))}
        </ul>
      </nav>

    </div>
  );
}
