'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ScreenTransform } from '@/lib/shadowfield/camera';
import { IdeaNode, LifeEvent, SEAL_MARGIN, findPath, lastActivity } from '@/lib/shadowfield/model';
import { topologyOf } from '@/lib/shadowfield/layout';
import { Access, Flight, pan as panCam, stepFlight, transformOfPath, zoomAt } from '@/lib/shadowfield/navigate';
import { Hit, Lens, NIGHT, PAPER_RGB, RenderState, drawSketch, setNight, lifeWord, drawVoidLattice, pulseChain, render, shortDate } from '@/lib/shadowfield/render';
import { restVideos, setFilmRate, setMediaReadyCallback, settleVideos, toggleVideoSound } from '@/lib/shadowfield/media';
import {
  ARRIVE,
  FOCUS,
  FlightCam,
  beginPush,
  Station,
  Stream,
  buildStream,
  focusOf,
  focusZ,
  mod,
  newFlightCam,
  stepFlightCam,
  stepFocus,
  travelled,
  wrapDelta,
} from '@/lib/shadowfield/flight';
import { renderFlight } from '@/lib/shadowfield/flightRender';
import { clamp, hash01, smoothstep } from '@/lib/shadowfield/rng';
import Donate from '@/components/support/Donate';
import { founderPlots } from '@/lib/shadowfield/plots';
import { buildWorld, resolvePath } from '@/lib/shadowfield/world';
import type { Posted } from '@/lib/shadowfield/sources/posted';
import { createLocalStore, LocalShadow, ShadowStore } from '@/lib/shadowfield/sources/local';
import styles from './ShadowField.module.css';

interface Props {
  serif: string;
}

interface Composer {
  mode: 'cast' | 'thought' | 'rewrite' | 'challenge' | 'synthesis' | 'note' | 'story' | 'spark';
  /** For a note left at a seal: the idea it is left at. */
  target?: string;
  /** For dialectic modes: the thought ids this one answers. */
  of?: string[];
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
/** The Canvas's owner, signed in with Google, sees everything on it. */
let ownerSignedIn = false;

function closenessFor(top: IdeaNode, followedSet: Set<string>) {
  if (top.ownedBy === 'viewer' || ownerSignedIn) return 1;
  return followedSet.has(top.id) ? 0.72 : 0.45;
}

const plotCache = new WeakMap<IdeaNode, ReturnType<typeof founderPlots>>();
function plotsFor(world: IdeaNode | null) {
  if (!world) return [];
  let p = plotCache.get(world);
  if (!p) {
    p = founderPlots(world.children);
    plotCache.set(world, p);
  }
  return p;
}

function localIds(node: IdeaNode): { shadowId: string; thoughtId: string | null } | null {
  if (!node.id.startsWith('local/')) return null;
  const [, shadowId, thoughtId] = node.id.split('/');
  return { shadowId, thoughtId: thoughtId ?? null };
}

/** The owned thought a node represents, with its siblings and any unresolved thesis/antithesis pair. */
function dialecticFor(list: LocalShadow[], node: IdeaNode | undefined) {
  const ids = node ? localIds(node) : null;
  if (!ids || !ids.thoughtId) return null;
  const shadow = list.find((v) => v.id === ids.shadowId);
  const me = shadow?.thoughts.find((t) => t.id === ids.thoughtId);
  if (!shadow || !me) return null;
  const siblings = shadow.thoughts.filter((t) => t.parent === me.parent);
  const challenger = siblings.find((t) => t.role === 'antithesis' && t.of?.[0] === me.id);
  const pair: string[] | null =
    me.role === 'antithesis' && me.of?.[0] ? [me.of[0], me.id] : challenger ? [me.id, challenger.id] : null;
  const resolved = pair ? siblings.some((t) => t.role === 'synthesis' && pair.every((p) => t.of?.includes(p))) : false;
  return { shadow, me, siblings, pair: resolved ? null : pair };
}

/** An open spot among siblings, near an anchor, inside the parent's disk. */
function spotNear(siblings: { x: number; y: number }[], ax: number, ay: number, dist: number): [number, number] {
  let best: [number, number] = [ax, ay];
  let bestScore = -Infinity;
  for (let i = 0; i < 48; i++) {
    const ang = (i / 48) * Math.PI * 2;
    const x = ax + Math.cos(ang) * dist;
    const y = ay + Math.sin(ang) * dist;
    const rho = Math.hypot(x, y);
    if (rho > 0.82 || rho < 0.18) continue;
    let d = 1;
    for (const c of siblings) d = Math.min(d, Math.hypot(c.x - x, c.y - y));
    if (d > bestScore) {
      bestScore = d;
      best = [x, y];
    }
  }
  return best;
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

/** The most open spot inside an idea's own frame, for a new thought (no screen needed). */
function openSpotIn(node: IdeaNode): [number, number] {
  let best: [number, number] = [0.4, 0];
  let bestScore = -Infinity;
  for (let i = 0; i < 64; i++) {
    const ang = (i / 64) * Math.PI * 2 + 0.37;
    for (const rho of [0.3, 0.45, 0.6, 0.72]) {
      const x = Math.cos(ang) * rho;
      const y = Math.sin(ang) * rho;
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

/** The throwaway a visitor's own Shadow was taken from, if any. */
function ownedHereFrom(list: LocalShadow[], node: IdeaNode | undefined) {
  const ids = node ? localIds(node) : null;
  return ids ? list.find((l) => l.id === ids.shadowId)?.from ?? null : null;
}

/** One screen height of swipe moves this far along the flight. */
const SWIPE = 2.4;

function hasMedia(node: IdeaNode | undefined, kind: 'audio' | 'video') {
  return !!node?.media?.some((m) => m.kind === kind);
}

function eventLabel(ev: LifeEvent) {
  const d = new Date(ev.t);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${shortDate(ev.t)}, ${time}`;
}

export default function ShadowField({ serif }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const storeRef = useRef<ShadowStore | null>(null);
  const worldRef = useRef<IdeaNode | null>(null);
  const camRef = useRef<Camera | null>(null);
  const lensRef = useRef<Lens>({ closeness: () => 0.5, visited: new Set(), followed: new Set() });
  const hitsRef = useRef<Hit[]>([]);
  const flightRef = useRef<Flight | null>(null);
  const pointerRef = useRef({ x: -1, y: -1, inside: false, t: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const zoomVelRef = useRef({ v: 0, x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef({ active: false, moved: 0, lastT: 0 });
  const pinchRef = useRef<{ d: number; x: number; y: number } | null>(null);
  const hoverRef = useRef<Hit | null>(null);
  const monoRef = useRef('monospace');
  const lastPathKey = useRef('');
  const lastTapRef = useRef({ t: 0, x: 0, y: 0, n: 1 });
  const pulsesRef = useRef(new Map<string, number>());
  // sketching: strokes are drawn in the frame of the owned idea being sketched in
  const sketchRef = useRef<{ nodeId: string; stroke: number[] | null; pointerId?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<HTMLElement | null>(null);
  const modelSrcRef = useRef('');
  // music: one element, routed through Web Audio for depth-based volume and loudness
  const audioRef = useRef<{
    el: HTMLAudioElement;
    gain: GainNode | null;
    analyser: AnalyserNode | null;
    ac: AudioContext | null;
    buf: Uint8Array<ArrayBuffer> | null;
  } | null>(null);
  const playingRef = useRef<{ src: string; path: IdeaNode[]; silentFor: number } | null>(null);
  // replay: progress 0..1 through [from, to]; playing advances it over time
  const replayRef = useRef<{ from: number; to: number; progress: number; playing: boolean; hold: number } | null>(null);
  // the flight: the Canvas as one endless stream you move through (default);
  // the map: the Canvas seen whole, zooming into nested frames
  const modeRef = useRef<'flight' | 'map'>('flight');
  const streamRef = useRef<Stream | null>(null);
  const flightCamRef = useRef<FlightCam>(newFlightCam());
  const hereRef = useRef<Station | null>(null);
  const framesRef = useRef(new Map<string, ScreenTransform>());
  // songs play as you pass them, once a tap has allowed sound; pausing stops that
  const autoplayRef = useRef(true);
  const hereSinceRef = useRef({ id: '', t: 0, tried: false, visited: false });
  // what the flight skips this frame (not perceivable, or not born yet in a replay)
  const skipRef = useRef<(s: Station) => boolean>(() => false);
  // the browser will not play sound until the visitor taps once
  const soundBlockedRef = useRef(true);
  // the hand: when the pointer last moved (the chrome comes back for a reaching hand)
  const handRef = useRef(0);
  const flowRef = useRef({ value: '', movingUntil: 0 });
  const uiBusyRef = useRef(false);

  const [path, setPath] = useState<IdeaNode[]>([]);
  const [view, setView] = useState({ w: 800, h: 600 });
  const [tip, setTip] = useState<Tip | null>(null);
  const [composer, setComposer] = useState<Composer | null>(null);
  const [hinted, setHinted] = useState(true);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [, setVersion] = useState(0);
  const [localList, setLocalList] = useState<LocalShadow[]>([]);
  const [sketching, setSketching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [giving, setGiving] = useState(false);
  const [givingTo, setGivingTo] = useState<string | null>(null);
  const [news, setNews] = useState<{ ids: string[]; title: string; when: string } | null>(null);
  const [replayView, setReplayView] = useState<{ progress: number; t: number; playing: boolean } | null>(null);
  const [mode, setMode] = useState<'flight' | 'map'>('flight');
  // who is looking (Google sign-in, when switched on)
  // night: pale ink on dark paper; a thin place in the web can drop you back through to day
  const [night, setNightState] = useState(false);
  const fallRef = useRef<number | null>(null);
  const prevZRef = useRef<number | null>(null);
  // the clock turns slowly by itself; the compass stops or starts it
  const spinRef = useRef(true);
  const needleRef = useRef<SVGGElement | null>(null);
  const nextDotRef = useRef<SVGCircleElement | null>(null);
  const lapDotRef = useRef<SVGCircleElement | null>(null);
  const compassRef = useRef<{ roll: number; next: number | null } | undefined>(undefined);
  const [notesView, setNotesView] = useState<{ title: string; notes: { t: number; text: string }[] } | null>(null);
  const [me, setMe] = useState<{ enabled: boolean; user: { name: string; owner: boolean } | null } | null>(null);
  // work people have posted, kept on the server (see /api/shadows)
  const postedRef = useRef<{ public: Posted[]; mine: Posted[] }>({ public: [], mine: [] });
  const [posting, setPosting] = useState(false);
  const [posted, setPostedList] = useState<Posted[]>([]);

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

  /** The path in focus: in the flight, what is in front of you; on the map, where the camera is. */
  const focusPath = useCallback((): IdeaNode[] => {
    if (modeRef.current === 'flight') return hereRef.current?.path ?? (worldRef.current ? [worldRef.current] : []);
    return camRef.current?.path ?? [];
  }, []);

  /** Stations this viewer cannot perceive at all (see model.ts, disclosure). */
  const hiddenStation = useCallback((s: Station) => {
    if (s.depth < 2) return false;
    const p = lensRef.current.closeness(s.path[1]);
    if (s.node.disclosure > p + SEAL_MARGIN) return true;
    // beneath a sealed idea nothing is perceivable
    for (let k = 2; k < s.path.length - 1; k++) if (s.path[k].disclosure > p) return true;
    return false;
  }, []);

  const rebuild = useCallback(() => {
    const store = storeRef.current!;
    const list = store.list();
    setLocalList(list);
    const world = buildWorld(list, postedRef.current);
    worldRef.current = world;
    // the flight keeps what is in front of you in front of you
    const oldStream = streamRef.current;
    const oldHere = hereRef.current;
    const stream = buildStream(world);
    streamRef.current = stream;
    const fc = flightCamRef.current;
    const idx = oldHere ? stream.byId.get(oldHere.node.id) : undefined;
    if (oldStream && oldHere && idx !== undefined) {
      const offset = wrapDelta(fc.z, oldHere.z - FOCUS, oldStream.length);
      fc.z = stream.stations[idx].z - FOCUS + offset;
      fc.target = null;
      hereRef.current = stream.stations[idx];
    }
    const cam = camRef.current;
    if (cam) {
      const ids = cam.path.slice(1).map((n) => n.id);
      const np = resolvePath(world, ids);
      const lost = np.length !== cam.path.length;
      cam.path = np;
      if (lost) cam.normalize(access.canEnter);
    }
    setVersion((v) => v + 1);
  }, [access]);

  /** Ripple a change from a node outward through everything that contains it. */
  const ripple = useCallback((nodeId: string) => {
    const world = worldRef.current;
    if (!world) return 0;
    const p = findPath(world, nodeId);
    if (!p) return 0;
    return pulseChain(pulsesRef.current, p, performance.now() / 1000);
  }, []);

  /** Start (or stop) a song; must run inside a tap so browsers allow sound. */
  const toggleSong = useCallback((path: IdeaNode[], auto = false) => {
    const node = path[path.length - 1];
    const media = node.media?.find((m) => m.kind === 'audio');
    if (!media || media.kind !== 'audio') return;
    // a hand on play/pause is final for this arrival: passing never overrides it
    if (!auto) hereSinceRef.current.tried = true;
    let a = audioRef.current;
    if (!a) {
      // passing a song only plays it once the visitor has touched the page
      const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
      if (auto && ua && !ua.hasBeenActive) {
        soundBlockedRef.current = true;
        return;
      }
      const el = new Audio();
      el.preload = 'auto';
      let gain: GainNode | null = null;
      let analyser: AnalyserNode | null = null;
      let ac: AudioContext | null = null;
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ac = new AC();
        const srcNode = ac.createMediaElementSource(el);
        gain = ac.createGain();
        analyser = ac.createAnalyser();
        analyser.fftSize = 256;
        srcNode.connect(gain).connect(analyser).connect(ac.destination);
        void ac.resume();
      } catch {
        gain = null;
        analyser = null;
      }
      a = { el, gain, analyser, ac, buf: analyser ? new Uint8Array(new ArrayBuffer(analyser.fftSize)) : null };
      el.addEventListener('ended', () => {
        playingRef.current = null;
        setPlayingId(null);
      });
      audioRef.current = a;
    }
    if (a.ac && a.ac.state === 'suspended') void a.ac.resume().catch(() => undefined);
    const cur = playingRef.current;
    if (cur && cur.src === media.src) {
      if (auto) return;
      if (a.el.paused) {
        autoplayRef.current = true;
        void a.el.play().catch(() => undefined);
      } else {
        // paused by hand: songs stop playing themselves as you pass, until you play one again
        autoplayRef.current = false;
        a.el.pause();
        playingRef.current = null;
        setPlayingId(null);
      }
      return;
    }
    if (!auto) autoplayRef.current = true;
    a.el.src = media.src;
    const rec = { src: media.src, path, silentFor: 0 };
    playingRef.current = rec;
    setPlayingId(node.id);
    void a.el.play().then(
      () => {
        soundBlockedRef.current = false;
      },
      () => {
        if (playingRef.current !== rec) return; // a newer song has taken over
        playingRef.current = null;
        setPlayingId(null);
        if (!auto) setNotice('tap play to hear it');
        else soundBlockedRef.current = true;
      }
    );
  }, []);

  const flyTo = useCallback((target: IdeaNode[], radius = 0.53) => {
    if (modeRef.current === 'flight') {
      // along the stream to the deepest thing on the path that is on it
      const stream = streamRef.current;
      const fc = flightCamRef.current;
      if (!stream) return;
      let open = target.length;
      for (let i = 2; i < target.length; i++) {
        if (target[i].disclosure > lensRef.current.closeness(target[1])) {
          open = i;
          break;
        }
      }
      for (let i = open - 1; i >= 0; i--) {
        const idx = stream.byId.get(target[i].id);
        if (idx === undefined) continue;
        const s = stream.stations[idx];
        fc.target = s.depth === 0 ? fc.z + wrapDelta(-ARRIVE, fc.z, stream.length) : focusZ(stream, s, fc.z);
        fc.v = 0;
        return;
      }
      return;
    }
    flightRef.current = { target, radius };
    velRef.current = { x: 0, y: 0 };
    zoomVelRef.current.v = 0;
  }, []);

  const flyToIds = useCallback(
    (ids: string[]) => {
      const world = worldRef.current;
      if (!world) return;
      flyTo(resolvePath(world, ids));
    },
    [flyTo]
  );

  // ---------------------------------------------------------------- setup
  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    storeRef.current = createLocalStore(storage);
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
    setLocalList(storeRef.current.list());
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains-mono').trim();
    monoRef.current = mono ? `${mono}, monospace` : 'monospace';

    const world = buildWorld(storeRef.current.list(), postedRef.current);
    worldRef.current = world;
    const cam = new Camera(world);
    camRef.current = cam;
    const stream = buildStream(world);
    streamRef.current = stream;
    setMediaReadyCallback(() => undefined); // the frame loop repaints continuously
    import('@google/model-viewer').catch(() => undefined);
    // exposed for scripted visual checks (e2e); read-only by convention
    (window as unknown as { __shadowField?: unknown }).__shadowField = {
      cam,
      flight: flightCamRef.current,
      stream: () => streamRef.current,
      here: () => hereRef.current?.node.id ?? null,
      flyTo: (ids: string[]) => flyToIds(ids),
      // recordings made frame by frame keep films and songs in time with the frames
      mediaRate: (r: number) => {
        setFilmRate(r);
        const a = audioRef.current;
        if (a) a.el.playbackRate = r;
      },
    };
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    cam.resize(rect.width, rect.height);
    cam.s = Math.min(rect.width, rect.height) * 0.45;

    // restore a journey from the URL: #path=a~b~c&z=..&c=x,y
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const ids = (params.get('path') ?? '').split('~').filter(Boolean);
      if (params.get('view') === 'map') {
        modeRef.current = 'map';
        setMode('map');
      }
      if (ids.length) {
        const p = resolvePath(world, ids);
        // the flight arrives with the deepest thing on the path in front of you
        for (let i = p.length - 1; i >= 1; i--) {
          const idx = stream.byId.get(p[i].id);
          if (idx === undefined) continue;
          flightCamRef.current.z = stream.stations[idx].z - FOCUS;
          break;
        }
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

    // back from giving toward an idea: it ripples, and remembers you are following
    let thanksTimer = 0;
    try {
      const url = new URL(window.location.href);
      const signin = url.searchParams.get('signin');
      if (signin) {
        url.searchParams.delete('signin');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
        setNotice(signin === 'off' ? 'signing in is not switched on yet' : 'that sign-in did not go through; try again');
      }
      const supported = url.searchParams.get('supported');
      if (supported) {
        url.searchParams.delete('supported');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
        const p = findPath(world, supported);
        if (p && p.length > 1) {
          lensRef.current.followed.add(p[1].id);
          writeSet(FOLLOW_KEY, lensRef.current.followed);
          thanksTimer = window.setTimeout(() => {
            setFollowed(new Set(lensRef.current.followed));
            ripple(supported);
            setNotice('thank you. it felt that.');
          }, 1200);
        }
      }
    } catch {
      // ignore malformed URLs
    }

    // news: a recent change inside TwinThink ripples out, and the viewer may go look
    const tw = world.children.find((c) => c.id === 'twinthink');
    const last = tw ? lastActivity(tw) : 0;
    let newsTimer = 0;
    if (tw && Date.now() - last < 3 * 86400000) {
      let latest: IdeaNode[] | null = null;
      let latestT = 0;
      for (const b of tw.children)
        for (const sn of b.children) {
          const t = lastActivity(sn);
          if (t > latestT) {
            latestT = t;
            latest = [b, sn];
          }
        }
      if (latest) {
        const target = latest;
        newsTimer = window.setTimeout(() => {
          const arrives = ripple(target[1].id);
          window.setTimeout(
            () => setNews({ ids: [tw.id, ...target.map((n) => n.id)], title: 'still being made', when: '' }),
            Math.max(0, (arrives - performance.now() / 1000) * 1000)
          );
        }, 1800);
      }
    }
    return () => {
      window.clearTimeout(newsTimer);
      window.clearTimeout(thanksTimer);
    };
  }, [access, flyToIds, ripple]);

  // night or day: the visitor's own choice, or their system's
  useEffect(() => {
    let want = false;
    try {
      const saved = window.localStorage.getItem('twinthink.night.v1');
      want = saved ? saved === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      want = false;
    }
    setNight(want);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNightState(want);
  }, []);

  const toggleNight = () => {
    const on = !NIGHT;
    setNight(on);
    setNightState(on);
    if (on) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    fallRef.current = null;
    try {
      window.localStorage.setItem('twinthink.night.v1', on ? '1' : '0');
    } catch {
      // optional
    }
  };

  // who is looking: signed in with Google, or nobody
  useEffect(() => {
    let live = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        ownerSignedIn = !!d.user?.owner;
        setMe(d);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  /** What people have posted: everyone's shared work, and (signed in) your own. */
  const loadPosted = useCallback(async () => {
    const d = (await fetch('/api/shadows', { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => null)) as { enabled?: boolean; public?: Posted[]; mine?: Posted[] } | null;
    if (!d) return;
    postedRef.current = { public: d.public ?? [], mine: d.mine ?? [] };
    setPosting(!!d.enabled);
    setPostedList([...(d.mine ?? []), ...(d.public ?? []).filter((p) => !p.mine)]);
    if (storeRef.current) rebuild();
  }, [rebuild]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPosted();
  }, [loadPosted, me?.user]);

  /** Change one of your posted Shadows (share it, keep it to yourself) or let it go. */
  const changePosted = async (id: string, change: { public?: boolean } | 'remove' | 'take down') => {
    const remove = change === 'remove' || change === 'take down';
    const res = await fetch(`/api/shadows/${encodeURIComponent(id)}`, {
      method: remove ? 'DELETE' : 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: remove ? undefined : JSON.stringify(change),
    }).catch(() => null);
    if (!res || !res.ok) {
      const d = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      setNotice((d?.error ?? 'that could not be changed').toLowerCase());
      return;
    }
    if (change === 'take down') setNotice('taken down');
    else if (change === 'remove') setNotice(id && posted.find((q) => q.id === id)?.kind === 'story' ? 'taken back' : 'let go');
    else setNotice(change.public ? 'shared with everyone' : 'only you can see it now');
    if (remove) flyTo(focusPath().slice(0, 1));
    await loadPosted();
    ripple(`p/${id}`);
  };

  const signIn = () => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a route handler that redirects to Google needs a full page load
    window.location.assign('/api/auth/google?next=/canvas');
  };

  /** Story time: signed in (so it can be taken back), told without a name. */
  const tellStory = () => {
    if (!me?.user) {
      signIn();
      return;
    }
    const c = camRef.current;
    const w = c?.w ?? 400;
    const h = c?.h ?? 600;
    setComposer({ mode: 'story', x: w / 2 - Math.min(230, w / 2 - 16), y: Math.max(80, h / 2 - 120), lx: 0, ly: 0 });
  };

  const sparkFrom = (storyId: string) => {
    if (!me?.user) {
      signIn();
      return;
    }
    const c = camRef.current;
    setComposer({ mode: 'spark', target: storyId, x: (c?.w ?? 400) / 2 - 140, y: (c?.h ?? 600) - 170, lx: 0, ly: 0 });
  };

  const reportPosted = async (id: string) => {
    const res = await fetch(`/api/shadows/${encodeURIComponent(id)}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'reported from the Canvas' }),
    }).catch(() => null);
    if (res?.status === 401) setNotice('sign in to report');
    else setNotice(res?.ok ? 'thank you, it will be looked at' : 'that could not be sent');
  };

  /** The maker reads the notes left at something's seal. */
  const readNotes = async (node: IdeaNode) => {
    const res = await fetch(`/api/notes?target=${encodeURIComponent(node.id)}`, { cache: 'no-store' }).catch(() => null);
    if (!res || !res.ok) {
      setNotice('notes could not be read');
      return;
    }
    const d = (await res.json()) as { enabled?: boolean; notes?: { t: number; text: string }[] };
    if (d.enabled === false) setNotice('notes are not switched on yet');
    else setNotesView({ title: node.title ?? 'this', notes: d.notes ?? [] });
  };

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    ownerSignedIn = false;
    setMe((m) => (m ? { ...m, user: null } : m));
    setNotice('signed out');
  };

  // leaving the Canvas silences everything; a hidden tab rests the films
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) restVideos();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      restVideos();
      const a = audioRef.current;
      if (a) {
        a.el.pause();
        void a.ac?.close().catch(() => undefined);
        audioRef.current = null;
      }
      playingRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------- frame loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastHash = 0;
    let lastDepthUpdate = 0;

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame);
      const canvas = canvasRef.current;
      const cam = camRef.current;
      const stream = streamRef.current;
      if (!canvas || !cam || !stream) return;
      const dt = Math.min(0.05, (nowMs - last) / 1000);
      last = nowMs;
      const flying = modeRef.current === 'flight';
      const fc = flightCamRef.current;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      cam.resize(rect.width, rect.height);

      // replay: the moment being shown
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
      const skip = (s: Station) => hiddenStation(s) || (cut !== null && s.depth > 0 && s.node.began > cut);
      // a sealed thing is seen (a closed mark) but can never be the thing in front of you
      const closed = (s: Station) => skip(s) || (s.depth > 1 && s.node.disclosure > lensRef.current.closeness(s.path[1]));
      skipRef.current = closed;

      // motion
      if (flying) {
        stepFlightCam(fc, stream, dt, closed);
        // the clock turns by itself: once every three minutes
        if (spinRef.current && !reducedQuery.matches) fc.spin += (dt * Math.PI * 2) / 180;
        // at night, a thin place in the web gives way as you pass through it
        const pz = prevZRef.current;
        prevZRef.current = fc.z;
        if (NIGHT && fallRef.current === null && pz !== null && fc.z > pz) {
          for (const s of stream.stations) {
            if (!s.gate || s.depth < 1 || hash01(s.node.seed, 31) > 0.34 || closed(s)) continue;
            const d0 = wrapDelta(s.z, pz, stream.length);
            const d1 = wrapDelta(s.z, fc.z, stream.length);
            if (d0 > 0 && d1 <= 0) {
              fallRef.current = nowMs;
              break;
            }
          }
        }
      } else {
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
      }

      // what is in front of you
      const here = flying ? focusOf(stream, fc.z, closed) : null;
      hereRef.current = here;

      // music: loudness follows nearness, and a song left far behind stops itself
      let audioState: RenderState['audio'] = null;
      const pl = playingRef.current;
      const au = audioRef.current;
      if (pl && au) {
        let near = 0;
        if (flying) {
          const idx = stream.byId.get(pl.path[pl.path.length - 1].id);
          if (idx !== undefined) {
            // heard as it approaches, full while in front of you, gone soon after it passes
            const dz = wrapDelta(stream.stations[idx].z, fc.z, stream.length);
            near = dz >= FOCUS ? 1 - smoothstep(1.4, 5, dz) : smoothstep(-0.7, 0.35, dz);
          }
        } else {
          const T = transformOfPath(cam, pl.path);
          near = T ? Math.max(0, Math.min(1, (T.s - cam.M * 0.03) / (cam.M * 0.4))) : 0;
        }
        const vol = near * near;
        if (au.gain) au.gain.gain.value = vol;
        else au.el.volume = vol;
        pl.silentFor = vol < 0.01 ? pl.silentFor + dt : 0;
        if (pl.silentFor > (flying ? 1.5 : 4)) {
          au.el.pause();
          playingRef.current = null;
          setPlayingId(null);
        } else {
          let level = 0;
          if (au.analyser && au.buf) {
            au.analyser.getByteTimeDomainData(au.buf);
            let sum = 0;
            for (let i = 0; i < au.buf.length; i++) {
              const v = (au.buf[i] - 128) / 128;
              sum += v * v;
            }
            level = Math.min(1, Math.sqrt(sum / au.buf.length) * 3);
          }
          const d = au.el.duration;
          audioState = { src: pl.src, progress: d > 0 ? au.el.currentTime / d : 0, level };
        }
      }
      // passing a song plays it (after a tap has allowed sound; once per arrival)
      if (here) {
        const since = hereSinceRef.current;
        if (since.id !== here.node.id) hereSinceRef.current = { id: here.node.id, t: nowMs, tried: false, visited: false };
        else if (
          autoplayRef.current &&
          !since.tried &&
          nowMs - since.t > 350 &&
          Math.abs(fc.shown) < 5 &&
          hasMedia(here.node, 'audio') &&
          playingRef.current?.path[playingRef.current.path.length - 1]?.id !== here.node.id
        ) {
          since.tried = true;
          toggleSong(here.path, true);
        }
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const st: RenderState = {
        ctx,
        w: rect.width,
        h: rect.height,
        M: cam.M,
        time: reducedQuery.matches ? 0 : nowMs / 1000,
        reduced: reducedQuery.matches,
        lens: lensRef.current,
        hits: hitsRef.current,
        serif,
        mono: monoRef.current,
        hoverId: hoverRef.current?.kind === 'node' ? hoverRef.current.node.id : null,
        hoverEv: hoverRef.current?.ev ?? null,
        now: cut ?? Date.now(),
        cut,
        clock: nowMs / 1000,
        pulses: pulsesRef.current,
        audio: audioState,
        plots: plotsFor(worldRef.current),
      };
      if (flying) {
        // stillness: the one line under a thing appears only once you have stopped
        const still =
          fc.target !== null || fc.held
            ? 0
            : reducedQuery.matches
              ? Number(fc.idle > 1.6)
              : smoothstep(1.6, 3, fc.idle) * (1 - smoothstep(0.15, 0.4, Math.abs(fc.shown)));
        const fstate: Parameters<typeof renderFlight>[3] = {
          frames: framesRef.current,
          closeness: (s) => (s.depth === 0 ? 1 : lensRef.current.closeness(s.path[1])),
          hidden: skip,
          here: here?.node.id,
          still,
          compass: undefined,
          lineFor: (s) =>
            hasMedia(s.node, 'audio') && soundBlockedRef.current && !playingRef.current ? 'tap to hear it' : s.node.line,
        };
        renderFlight(st, stream, fc, fstate);
        compassRef.current = fstate.compass;
      } else {
        const k = Math.max(0, cam.depth - 2);
        const T = cam.transformAt(k);
        const p = k === 0 ? 1 : lensRef.current.closeness(cam.path[1]);
        render(st, cam.path[k], cam.path.slice(0, k + 1), T, p, k === 0);
        if (cam.node.void) {
          let real = cam.depth;
          while (real > 0 && cam.path[real].void) real--;
          drawVoidLattice(st, cam.transformAt(cam.depth), cam.transformAt(real).s);
        }
      }
      // falling through: day opens from the middle of the night, edged in ink
      if (flying && fallRef.current !== null) {
        const q = Math.min(1, (nowMs - fallRef.current) / 900);
        const e = q * q * (3 - 2 * q);
        const rr = e * Math.hypot(rect.width, rect.height) * 0.6;
        ctx.fillStyle = '#fbfaf7';
        ctx.beginPath();
        ctx.arc(rect.width / 2, rect.height * 0.47, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${PAPER_RGB === '251,250,247' ? '30,28,36' : '232,228,238'},0.5)`;
        for (let i = 0; i < 90; i++) {
          const a = (i / 90) * Math.PI * 2 + e;
          ctx.beginPath();
          ctx.arc(rect.width / 2 + Math.cos(a) * rr, rect.height * 0.47 + Math.sin(a) * rr, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
        if (q >= 1) {
          fallRef.current = null;
          setNight(false);
          setNightState(false);
          document.documentElement.removeAttribute('data-theme');
        }
      }
      // the compass: world-up, where you are in the lap, where the next thing lies
      const comp = compassRef.current;
      if (flying && comp && needleRef.current) {
        needleRef.current.setAttribute('transform', `rotate(${(comp.roll * 180) / Math.PI} 23 23)`);
        const nd = nextDotRef.current;
        if (nd) {
          nd.style.opacity = comp.next === null ? '0' : '1';
          if (comp.next !== null) {
            nd.setAttribute('cx', String(23 + Math.cos(comp.next) * 13));
            nd.setAttribute('cy', String(23 + Math.sin(comp.next) * 13));
          }
        }
        const ld = lapDotRef.current;
        if (ld) {
          const a = (mod(fc.z + ARRIVE, stream.length) / stream.length) * Math.PI * 2 - Math.PI / 2;
          ld.setAttribute('cx', String(23 + Math.cos(a) * 20));
          ld.setAttribute('cy', String(23 + Math.sin(a) * 20));
        }
      }
      settleVideos(st.videos ?? new Set());
      // 3D objects: one live viewer, placed over the largest object in view
      const mv = modelRef.current;
      if (mv) {
        const m = (st.models ?? []).sort((a, b) => b.w - a.w)[0];
        if (m && m.alpha > 0.02) {
          if (modelSrcRef.current !== m.src) {
            modelSrcRef.current = m.src;
            mv.setAttribute('src', m.src);
          }
          mv.style.display = 'block';
          mv.style.pointerEvents = flying ? 'none' : 'auto';
          mv.style.left = `${m.x}px`;
          mv.style.top = `${m.y}px`;
          mv.style.width = `${m.w}px`;
          mv.style.height = `${m.h}px`;
          mv.style.opacity = String(Math.min(1, m.alpha));
        } else if (mv.style.display !== 'none') {
          mv.style.display = 'none';
        }
      }

      const sk = sketchRef.current;
      if (sk?.stroke && sk.stroke.length >= 4) {
        if (flying) {
          const T = framesRef.current.get(sk.nodeId);
          if (T) drawSketch(st, [sk.stroke], T, 1);
        } else {
          const idx = cam.path.findIndex((n) => n.id === sk.nodeId);
          if (idx >= 0) drawSketch(st, [sk.stroke], cam.transformAt(idx), 1);
        }
      }

      // hover
      const ptr = pointerRef.current;
      let hover: Hit | null = null;
      // in the flight things pass under a resting pointer; only a moving hand is pointing
      if (ptr.inside && !dragRef.current.active && (!flying || nowMs - ptr.t < 1500)) {
        if (flying) {
          // hits come nearest first: the thing in front covers what is behind it
          hover = hitsRef.current.find((h) => Math.hypot(h.x - ptr.x, h.y - ptr.y) < h.r) ?? null;
        } else {
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
      }
      const prev = hoverRef.current;
      hoverRef.current = hover;
      // a mark that has grown large enough to carry its own name needs no tooltip
      const named = flying ? cam.M * 0.05 : 5;
      if (hover && hover.node === prev?.node && hover.kind === 'node' && !hover.sealed && hover.size >= named) setTip(null);
      if (hover !== prev && (hover?.node !== prev?.node || hover?.ev !== prev?.ev)) {
        if (!hover) setTip(null);
        else if (hover.kind === 'event' && hover.ev) {
          // a moment, not a message: when, never what
          setTip({ x: hover.x, y: hover.y, title: eventLabel(hover.ev) });
        } else if (hover.node) {
          if (hover.size < named || hover.sealed) {
            setTip({
              x: hover.x,
              y: hover.y,
              title: hover.sealed ? 'something is here' : hover.node.title ?? 'untitled',
              line: hover.sealed ? 'not open to you yet' : hover.node.free ? 'given away' : lifeWord(hover.node, Date.now()),
            });
          } else setTip(null);
        }
      }
      canvas.style.cursor = sketchRef.current ? 'crosshair' : dragRef.current.active ? 'grabbing' : hover ? 'pointer' : 'default';

      // state that the chrome needs (in flight, at most a few times a second)
      const curPath = here ? here.path : cam.path;
      const key = curPath.map((n) => n.id).join('~');
      if (key !== lastPathKey.current && (!flying || nowMs - lastDepthUpdate > 100)) {
        lastPathKey.current = key;
        if (sketchRef.current && !curPath.some((n) => n.id === sketchRef.current?.nodeId)) {
          sketchRef.current = null;
          setSketching(false);
        }
        setPath([...curPath]);
        if (!flying && curPath.length > 1) {
          const top = curPath[1];
          if (!lensRef.current.visited.has(top.id)) {
            lensRef.current.visited.add(top.id);
            writeSet(VISITED_KEY, lensRef.current.visited);
          }
          const ids = localIds(top);
          if (ids && storeRef.current) storeRef.current.visit(ids.shadowId);
        }
      }
      // the buttons and names step back while you move, and while you linger;
      // a reaching hand (or anything open) brings them back at once
      const root = rootRef.current;
      if (root) {
        const f = flowRef.current;
        let flow = '';
        if (flying && !uiBusyRef.current) {
          if (Math.abs(fc.shown) > 0.6) f.movingUntil = nowMs + 900;
          if (nowMs - handRef.current > 700) {
            if (nowMs < f.movingUntil) flow = 'moving';
            else if (fc.idle > 12 && nowMs - handRef.current > 12000) flow = 'rest';
          }
        }
        if (flow !== f.value) {
          f.value = flow;
          if (flow) root.dataset.flow = flow;
          else delete root.dataset.flow;
        }
      }
      // in the flight, passing something is not visiting it: staying a moment is
      const since = hereSinceRef.current;
      if (flying && here && here.path.length > 1 && !since.visited && nowMs - since.t > 1500 && Math.abs(fc.shown) < 1) {
        since.visited = true;
        const top = here.path[1];
        if (!lensRef.current.visited.has(top.id)) {
          lensRef.current.visited.add(top.id);
          writeSet(VISITED_KEY, lensRef.current.visited);
        }
        const ids = localIds(top);
        if (ids && storeRef.current) storeRef.current.visit(ids.shadowId);
      }
      if (nowMs - lastDepthUpdate > 120) {
        lastDepthUpdate = nowMs;
        setView((v) => (v.w === cam.w && v.h === cam.h ? v : { w: cam.w, h: cam.h }));
        const r = replayRef.current;
        if (r && cut !== null) setReplayView({ progress: r.progress, t: cut, playing: r.playing });
      }
      if (nowMs - lastHash > 700 && (flying ? Math.abs(fc.shown) < 1 : !cam.node.void)) {
        lastHash = nowMs;
        const ids = curPath.slice(1).filter((n) => !n.void).map((n) => n.id);
        const where = ids.length ? `path=${ids.map(encodeURIComponent).join('~')}` : '';
        const hash = flying
          ? where
          : [where, ids.length ? `z=${(cam.s / cam.M).toPrecision(4)}&c=${cam.cx.toFixed(5)},${cam.cy.toFixed(5)}` : '', 'view=map']
              .filter(Boolean)
              .join('&');
        if (hash !== window.location.hash.slice(1)) {
          history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [access, serif, hiddenStation, toggleSong]);

  useEffect(() => {
    uiBusyRef.current = !!(composer || giving || givingTo || sketching || replayView || notice);
  }, [composer, giving, givingTo, sketching, replayView, notice]);

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
      if (modeRef.current === 'flight') {
        // scrolling is moving: down (or a pinch outward) carries you forward
        const fc = flightCamRef.current;
        const stream = streamRef.current;
        if (stream) beginPush(fc, stream, skipRef.current);
        if (fc.target !== null) {
          // a scroll takes over from a flight already under way
          fc.target = null;
          fc.v = 0;
        }
        fc.idle = 0;
        const d = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
        const push = e.ctrlKey ? -d * 0.06 : d * 0.018;
        if (push) fc.dir = Math.sign(push);
        fc.v += push;
        dismissHint();
        return;
      }
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
    // listen on the whole field so overlays (3D objects) never swallow depth
    const root: HTMLElement = rootRef.current ?? canvas;
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, [access, dismissHint]);

  const openComposerAt = useCallback(
    (sx: number, sy: number) => {
      const cam = camRef.current;
      if (!cam) return;
      if (modeRef.current === 'flight') {
        // in the flight, a new Shadow joins the Canvas; a thought joins the idea in front of you
        const p = focusPath();
        const node = p[p.length - 1];
        if (!node) return;
        const [lx, ly] = openSpotIn(node);
        if (p.length <= 1) {
          setComposer({ mode: 'cast', x: sx, y: sy, lx, ly });
          return;
        }
        const ids = localIds(node);
        if (ids) setComposer({ mode: 'thought', x: sx, y: sy, lx, ly, shadowId: ids.shadowId, parentId: ids.thoughtId });
        return;
      }
      const [lx, ly] = cam.toLocal(sx, sy);
      if (cam.depth === 0) {
        setComposer({ mode: 'cast', x: sx, y: sy, lx, ly });
        return;
      }
      const ids = localIds(cam.node);
      if (!ids || Math.hypot(lx, ly) > 0.9) return;
      setComposer({ mode: 'thought', x: sx, y: sy, lx, ly, shadowId: ids.shadowId, parentId: ids.thoughtId });
    },
    [focusPath]
  );

  /** Screen point -> coordinates in the frame of the owned idea being sketched in. */
  const sketchPoint = (sx: number, sy: number): [number, number] | null => {
    const cam = camRef.current;
    const sk = sketchRef.current;
    if (!cam || !sk) return null;
    if (modeRef.current === 'flight') {
      const T = framesRef.current.get(sk.nodeId);
      return T ? [(sx - T.ox) / T.s, (sy - T.oy) / T.s] : null;
    }
    const idx = cam.path.findIndex((n) => n.id === sk.nodeId);
    if (idx < 0) return null;
    const T = cam.transformAt(idx);
    return [(sx - T.ox) / T.s, (sy - T.oy) / T.s];
  };

  /** A note for the maker, left at the seal of something not open to you. */
  const openSeal = (node: IdeaNode) => {
    if (node.id.startsWith('local/')) return;
    const c = camRef.current;
    // opened once the tap that asked for it has finished, so its own click does not close it
    window.setTimeout(
      () => setComposer({ mode: 'note', target: node.id, x: (c?.w ?? 400) / 2 - 140, y: (c?.h ?? 600) - 160, lx: 0, ly: 0 }),
      250
    );
  };

  /**
   * Three taps: a knock. The owner, a follower, or whoever made it may go
   * inside (the flight dives to what it holds); anyone else meets its seal.
   */
  const knock = (path: IdeaNode[]) => {
    const node = path[path.length - 1];
    const top = path[1];
    if (!node || !top) return;
    const mineHere = node.id.startsWith('p/') && postedRef.current.mine.some((p) => `p/${p.id}` === node.id);
    const open = ownerSignedIn || mineHere || top.ownedBy === 'viewer' || lensRef.current.followed.has(top.id);
    if (!open) {
      openSeal(node);
      return;
    }
    const inside = travelled(node).sort((a, b) => b.began - a.began);
    ripple(node.id);
    if (!inside.length) {
      setNotice('nothing inside yet');
      return;
    }
    flyTo([...path, inside[0]]);
  };

  /** Sound for a film (from a tap); a song that is playing gives way to it. */
  const filmSound = (src: string, webm?: string) => {
    if (!toggleVideoSound(src, webm)) return;
    const a = audioRef.current;
    if (a && playingRef.current) {
      a.el.pause();
      playingRef.current = null;
      setPlayingId(null);
    }
  };

  /** Between the flight (moving through) and the map (seeing it whole), keeping your place. */
  const switchMode = () => {
    const cam = camRef.current;
    const stream = streamRef.current;
    const world = worldRef.current;
    if (!cam || !stream || !world) return;
    sketchRef.current = null;
    setSketching(false);
    if (modeRef.current === 'flight') {
      const target = hereRef.current?.path ?? [world];
      modeRef.current = 'map';
      setMode('map');
      cam.path = [world];
      cam.cx = 0;
      cam.cy = 0;
      cam.s = cam.M * 0.45;
      if (target.length > 1) flightRef.current = { target, radius: 0.53 };
      return;
    }
    const fc = flightCamRef.current;
    const deepest = [...cam.path].reverse().find((n) => stream.byId.has(n.id));
    const s = deepest ? stream.stations[stream.byId.get(deepest.id)!] : null;
    fc.z = !s || s.depth === 0 ? -ARRIVE : s.z - FOCUS;
    fc.v = 0;
    fc.target = null;
    flightRef.current = null;
    modeRef.current = 'flight';
    setMode('flight');
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (sketchRef.current && e.isPrimary) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pt = sketchPoint(e.clientX - rect.left, e.clientY - rect.top);
      if (pt) {
        e.currentTarget.setPointerCapture(e.pointerId);
        sketchRef.current.stroke = [pt[0], pt[1]];
        sketchRef.current.pointerId = e.pointerId;
        return;
      }
    }
    const rect = e.currentTarget.getBoundingClientRect();
    pointersRef.current.set(e.pointerId, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.currentTarget.setPointerCapture(e.pointerId);
    flightRef.current = null;
    velRef.current = { x: 0, y: 0 };
    handRef.current = performance.now();
    // a tap is what lets the browser play sound
    soundBlockedRef.current = false;
    if (modeRef.current === 'flight') {
      // a touch catches the flight, the way a finger stops a spinning wheel
      const fc = flightCamRef.current;
      const stream = streamRef.current;
      if (stream) beginPush(fc, stream, skipRef.current);
      fc.held = true;
      fc.target = null;
      fc.v = 0;
      fc.idle = 0;
    }
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
    const sk = sketchRef.current;
    if (sk?.stroke && e.pointerId === sk.pointerId) {
      const pt = sketchPoint(x, y);
      if (pt) sk.stroke.push(pt[0], pt[1]);
      return;
    }
    pointerRef.current = { x, y, inside: true, t: performance.now() };
    handRef.current = performance.now();
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x, y });
    const cam = camRef.current;
    if (!cam) return;
    if (modeRef.current === 'flight') {
      const fc = flightCamRef.current;
      const M = Math.min(cam.w, cam.h);
      fc.idle = 0;
      if (pointersRef.current.size >= 2 && pinchRef.current) {
        // spreading two fingers carries you in, pinching carries you back
        const [a, b] = [...pointersRef.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchRef.current.d > 10 && d > 10) {
          const step = Math.log(d / pinchRef.current.d) * 1.8;
          fc.z += step;
          if (Math.abs(step) > 0.002) fc.dir = Math.sign(step);
        }
        pinchRef.current = { d, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        dragRef.current.moved += 20;
        return;
      }
      // up is forward, like scrolling; across is looking around
      const dx = x - prev.x;
      const dy = y - prev.y;
      dragRef.current.moved += Math.abs(dx) + Math.abs(dy);
      const step = (-dy / M) * SWIPE;
      fc.z += step;
      if (Math.abs(step) > 0.002) fc.dir = Math.sign(step);
      fc.wx = clamp(fc.wx - (dx / M) * 0.6, -0.5, 0.5);
      const now = performance.now();
      const dtm = Math.max(1, now - dragRef.current.lastT);
      dragRef.current.lastT = now;
      fc.v = fc.v * 0.5 + (step / (dtm / 1000)) * 0.5;
      return;
    }
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
    const sk = sketchRef.current;
    if (sk?.stroke && e.pointerId === sk.pointerId) {
      const stroke = sk.stroke;
      sk.stroke = null;
      if (stroke.length >= 4) {
        const [, shadowId, thoughtId] = sk.nodeId.split('/');
        const ok = storeRef.current?.addMedia(shadowId, thoughtId ?? null, { kind: 'sketch', strokes: [stroke], t: Date.now() });
        if (ok === false) setNotice('this device is out of room for more drawings');
        rebuild();
      }
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size > 0) return;
    const moved = dragRef.current.moved;
    dragRef.current.active = false;
    const flying = modeRef.current === 'flight';
    const fc = flightCamRef.current;
    if (flying) {
      // let go: the flight carries on with the swipe's speed, unless the finger had stopped
      fc.held = false;
      fc.idle = 0;
      if (performance.now() - dragRef.current.lastT > 90) fc.v = 0;
      fc.v = clamp(fc.v, -40, 40);
    }
    if (performance.now() - dragRef.current.lastT > 80) velRef.current = { x: 0, y: 0 };
    if (moved > 6) return;
    velRef.current = { x: 0, y: 0 };
    if (flying) fc.v = 0;

    const now = performance.now();
    const lastTap = lastTapRef.current;
    const burst = now - lastTap.t < 380 && Math.hypot(lastTap.x - x, lastTap.y - y) < 28;
    const taps = burst ? lastTap.n + 1 : 1;
    const isDouble = taps === 2;
    lastTapRef.current = { t: now, x, y, n: taps };

    const hit = hoverRef.current ?? hitsRef.current.find((h) => Math.hypot(h.x - x, h.y - y) < h.r) ?? null;
    const focused = focusPath();
    // three taps knock: the way in opens for those it is open to; for anyone else, a seal
    if (taps === 3) {
      if (hit && hit.kind === 'node' && hit.size < 1e8) knock(hit.path);
      else if (focused.length > 1) knock(focused);
      return;
    }
    // a sealed thing, touched, offers a note for its maker
    if (hit && hit.kind === 'node' && hit.sealed) {
      openSeal(hit.node);
      return;
    }
    if (hit && hit.kind === 'node' && hasMedia(hit.node, 'audio')) {
      // a song: go to it and let it play (the tap is what allows sound);
      // further taps in the same burst are a knock in the making, not play/pause
      if (taps > 1) return;
      flyTo(hit.path, 0.53);
      autoplayRef.current = true;
      toggleSong(hit.path);
      return;
    }
    const focusedNode = focused[focused.length - 1];
    const film = (n: IdeaNode | undefined) => n?.media?.find((m) => m.kind === 'video');
    if (hit && hit.kind === 'node' && film(hit.node)) {
      // a film: go to it; a tap on it once there gives it sound
      if (focusedNode?.id === hit.node.id) filmSound(film(hit.node)!.src, film(hit.node)!.webm);
      else flyTo(hit.path);
      return;
    }
    if (!hit && hasMedia(focusedNode, 'audio')) {
      if (taps > 1) return;
      autoplayRef.current = true;
      toggleSong([...focused]);
      return;
    }
    if (!hit && film(focusedNode)) {
      filmSound(film(focusedNode)!.src, film(focusedNode)!.webm);
      return;
    }
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
      handRef.current = performance.now();
      const cam = camRef.current;
      if (!cam) return;
      if (modeRef.current === 'flight') {
        const fc = flightCamRef.current;
        const stream = streamRef.current;
        if (!stream) return;
        const go = (dir: 1 | -1) => {
          const z = stepFocus(stream, fc.target ?? fc.z, dir, skipRef.current);
          if (z !== null) {
            fc.target = z;
            fc.v = 0;
          }
        };
        if (['ArrowDown', 'ArrowRight', 'PageDown', '+', '=', 'j'].includes(e.key)) go(1);
        else if (['ArrowUp', 'ArrowLeft', 'PageUp', '-', '_', 'k'].includes(e.key)) go(-1);
        else if (e.key === 'Escape' || e.key === 'Backspace') {
          const p = focusPath();
          if (p.length > 1) flyTo(p.slice(0, -1));
        } else return;
        e.preventDefault();
        dismissHint();
        return;
      }
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
  }, [composer, dismissHint, flyTo, focusPath, hiddenStation]);

  // ---------------------------------------------------------------- actions
  const wander = () => {
    const world = worldRef.current;
    if (!world) return;
    const options = world.children.filter((c) => c.id !== focusPath()[1]?.id);
    const pick = options.length ? options[Math.floor(Math.random() * options.length)] : world.children[0];
    if (pick) flyTo([world, pick]);
  };

  const startReplay = () => {
    const fp = focusPath();
    if (fp.length < 2) return;
    const top = fp[1];
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

  const keepCopy = (shadowId: string) => {
    const record = storeRef.current?.list().find((s) => s.id === shadowId);
    if (!record) return;
    const blob = new Blob(
      [JSON.stringify({ format: 'twinthink.shadow', version: 1, exported: new Date().toISOString(), shadow: record }, null, 2)],
      { type: 'application/json' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shadow-${shadowId}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /**
   * Proof of existence without disclosure: a SHA-256 fingerprint of the whole
   * Shadow, with the time. Revealing the original later proves it matches; the
   * fingerprint alone reveals nothing about the idea.
   */
  const proveMine = async (shadowId: string) => {
    const record = storeRef.current?.list().find((v) => v.id === shadowId);
    if (!record || !crypto?.subtle) return;
    const canonical = JSON.stringify(record, Object.keys(record).sort());
    const full = JSON.stringify(record);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(full));
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const cert = {
      format: 'twinthink.proof',
      version: 1,
      algorithm: 'SHA-256',
      fingerprint: hex,
      fingerprintedAt: new Date().toISOString(),
      createdAt: new Date(record.created).toISOString(),
      howToUse:
        'Keep this certificate and a copy of your Shadow ("keep a copy"). To show you had this idea at this time, reveal the copy: its SHA-256 fingerprint will match this one. The fingerprint alone reveals nothing about the idea. For an independent timestamp, send this fingerprint to yourself by email or to a public timestamping service.',
      canonicalLength: canonical.length,
    };
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `proof-${shadowId}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setNotice('sealed, your proof is saved');
  };

  const toggleSketch = () => {
    const fp = focusPath();
    const node = fp[fp.length - 1];
    if (sketchRef.current) {
      const id = sketchRef.current.nodeId;
      sketchRef.current = null;
      setSketching(false);
      ripple(id);
      return;
    }
    if (!node || !localIds(node)) return;
    if (modeRef.current === 'flight') {
      // hold still in front of it while drawing
      const stream = streamRef.current;
      const here = hereRef.current;
      const fc = flightCamRef.current;
      if (stream && here) fc.target = focusZ(stream, here, fc.z);
      fc.v = 0;
    }
    sketchRef.current = { nodeId: node.id, stroke: null };
    setSketching(true);
  };

  const addImage = async (file: File) => {
    const cam = camRef.current;
    const fp = focusPath();
    const node = fp[fp.length - 1];
    const ids = node ? localIds(node) : null;
    if (!cam || !node || !ids) return;
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('unreadable image'));
        img.src = url;
      });
      const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const src = c.toDataURL('image/jpeg', 0.8);
      const [x, y] = modeRef.current === 'flight' ? openSpotIn(node) : openSpot(cam, node);
      const aspect = c.height / c.width;
      const w = Math.min(0.6, 0.6 / Math.max(1, aspect));
      const ok = storeRef.current?.addMedia(ids.shadowId, ids.thoughtId, { kind: 'image', src, x: x * 0.6, y: y * 0.6, w, aspect });
      if (ok === false) {
        setNotice('this device is out of room for more images (they will live on the server soon)');
        return;
      }
      rebuild();
      ripple(node.id);
    } catch {
      setNotice('that image could not be read');
    }
  };

  /** A Shadow kept on this device goes online (still private), with its thoughts written inside. */
  const putOnline = async (shadowId: string) => {
    const record = storeRef.current?.list().find((v) => v.id === shadowId);
    if (!record) return;
    const body = record.thoughts
      .filter((t) => !t.letGo)
      .map((t) => t.text)
      .join('\n');
    const res = await fetch('/api/shadows', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: record.text, body }),
    }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    if (!res?.ok) {
      setNotice((d?.error ?? 'that could not be kept').toLowerCase());
      return;
    }
    await loadPosted();
    setNotice('online now, only you can see it until you share it');
  };

  /**
   * Taking a throwaway: the visitor gets their own private copy (its name only),
   * which remembers who gave it. A gift ripples; nothing is counted.
   */
  const takeIdea = (node: IdeaNode) => {
    const store = storeRef.current;
    const world = worldRef.current;
    if (!store || !world) return;
    const ring = world.children.find((c) => c.id === 'throwaways');
    store.cast(node.title ?? '', (ring?.x ?? 0.5) * 0.9, (ring?.y ?? 0.3) * 0.9, node.id);
    rebuild();
    ripple(node.id);
    setNotice('yours now, only on this device');
  };

  const toggleFollow = (node: IdeaNode) => {
    const next = new Set(lensRef.current.followed);
    if (next.has(node.id)) next.delete(node.id);
    else {
      next.add(node.id);
      // encouragement is felt: it ripples through the idea
      const fp = focusPath();
      ripple(fp[fp.length - 1]?.id ?? node.id);
    }
    lensRef.current.followed = next;
    writeSet(FOLLOW_KEY, next);
    setFollowed(new Set(next));
  };

  const startDialectic = (mode: 'challenge' | 'synthesis') => {
    const fp = focusPath();
    const d = dialecticFor(storeRef.current?.list() ?? [], fp[fp.length - 1]);
    const cam = camRef.current;
    if (!d || !cam) return;
    setComposer({
      mode,
      x: cam.w / 2 - 140,
      y: cam.h - 150,
      lx: 0,
      ly: 0,
      shadowId: d.shadow.id,
      parentId: d.me.parent,
      of: mode === 'challenge' ? [d.me.id] : d.pair ?? [],
    });
  };

  const submitComposer = (text: string) => {
    const c = composer;
    const store = storeRef.current;
    setComposer(null);
    if (!c || !store) return;
    const value = text.trim();
    if (!value) return;
    if (c.mode === 'story' || c.mode === 'spark') {
      // a story is told to everyone without a name; an idea it sparks is yours, private until shared
      const payload = c.mode === 'story' ? { kind: 'story', body: value } : { title: value, from: c.target };
      fetch('/api/shadows', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        .then(async (res) => {
          const d = (await res.json().catch(() => ({}))) as { shadow?: Posted; error?: string };
          if (!res.ok || !d.shadow) {
            setNotice((d.error ?? 'that could not be kept').toLowerCase());
            return;
          }
          await loadPosted();
          const world = worldRef.current;
          const ringId = c.mode === 'story' ? 'stories' : 'yours';
          const ring = world?.children.find((n) => n.id === ringId);
          const node = ring?.children.find((n) => n.id === `p/${d.shadow!.id}`);
          if (world && ring && node) flyTo([world, ring, node]);
          if (c.mode === 'spark') ripple(`p/${c.target}`);
          setNotice(c.mode === 'story' ? 'told, and no one will know it was you' : 'yours now, only you can see it until you share it');
        })
        .catch(() => setNotice('that could not be kept'));
    } else if (c.mode === 'cast' && posting && me?.user) {
      // signed in: it is kept on the server, private until its maker shares it
      fetch('/api/shadows', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: value }) })
        .then(async (res) => {
          const d = (await res.json().catch(() => ({}))) as { shadow?: Posted; error?: string };
          if (!res.ok || !d.shadow) {
            setNotice((d.error ?? 'that could not be kept').toLowerCase());
            return;
          }
          await loadPosted();
          const world = worldRef.current;
          const yours = world?.children.find((n) => n.id === 'yours');
          const node = yours?.children.find((n) => n.id === `p/${d.shadow!.id}`);
          if (world && yours && node) flyTo([world, yours, node]);
          setNotice('kept, only you can see it until you share it');
        })
        .catch(() => setNotice('that could not be kept'));
    } else if (c.mode === 'cast') {
      const s = store.cast(value, c.lx, c.ly);
      rebuild();
      const world = worldRef.current!;
      const node = world.children.find((n) => n.id === `local/${s.id}`);
      if (node) flyTo([world, node]);
    } else if (c.mode === 'thought' && c.shadowId) {
      const made = store.addThought(c.shadowId, c.parentId ?? null, value, c.lx, c.ly);
      rebuild();
      if (made) ripple(`local/${c.shadowId}/${made.id}`);
    } else if ((c.mode === 'challenge' || c.mode === 'synthesis') && c.shadowId && c.of?.length) {
      const shadow = store.list().find((v) => v.id === c.shadowId);
      if (!shadow) return;
      const siblings = shadow.thoughts.filter((t) => t.parent === (c.parentId ?? null));
      const src = c.of.map((id) => siblings.find((t) => t.id === id)).filter(Boolean) as typeof siblings;
      let ax = src.reduce((n, t) => n + t.x, 0) / Math.max(1, src.length);
      let ay = src.reduce((n, t) => n + t.y, 0) / Math.max(1, src.length);
      if (c.mode === 'synthesis') {
        // a resolution grows outward, beyond the two it draws on
        const r = Math.hypot(ax, ay) || 1;
        ax += (ax / r) * 0.22;
        ay += (ay / r) * 0.22;
      }
      const [x, y] = spotNear(siblings, ax, ay, c.mode === 'challenge' ? 0.3 : 0.12);
      const made = store.addThought(c.shadowId, c.parentId ?? null, value, x, y, {
        role: c.mode === 'challenge' ? 'antithesis' : 'synthesis',
        of: c.of,
      });
      rebuild();
      const cam = camRef.current;
      if (cam && made) {
        // step back into the frame that holds both, so the lines can be seen meeting
        flyTo(focusPath().slice(0, -1));
        ripple(`local/${c.shadowId}/${made.id}`);
      }
    } else if (c.mode === 'note' && c.target) {
      fetch('/api/notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ target: c.target, text: value }) })
        .then(async (res) => {
          if (res.ok) {
            ripple(c.target!);
            setNotice('left for the maker, without your name');
          } else {
            const d = (await res.json().catch(() => ({}))) as { error?: string };
            setNotice(res.status === 503 ? 'notes are not switched on yet' : (d.error ?? 'that note could not be left').toLowerCase());
          }
        })
        .catch(() => setNotice('that note could not be left'));
    } else if (c.mode === 'rewrite' && c.shadowId) {
      store.revise(c.shadowId, c.thoughtId ?? null, value);
      rebuild();
      ripple(c.thoughtId ? `local/${c.shadowId}/${c.thoughtId}` : `local/${c.shadowId}`);
    }
  };

  // the trail skips empty frames and folds long, looping journeys
  const real = path.map((n, i) => ({ n, i })).filter(({ n }) => !n.void);
  const crumbs = real.length > 6 ? [real[0], { n: real[0].n, i: -1 }, ...real.slice(-4)] : real;
  const current = path[path.length - 1];
  // the idea you are inside, if someone else's and public: what support goes toward
  const supportTarget =
    [...path]
      .slice(1)
      .reverse()
      .find((n) => !n.void && !n.portal && !n.ownedBy && !n.id.startsWith('local/') && n.id !== 'throwaways' && !n.id.startsWith('archive/') && !n.id.startsWith('p/') && n.id !== 'people' && n.id !== 'yours' && n.id !== 'stories') ?? null;
  // an idea given away is never followed by an ask for money, nor is a song while it plays
  // nothing given away (songs, starters, throwaways) is ever followed by an ask
  const asking = supportTarget && !path.some((n) => n.free) && playingId !== current?.id ? supportTarget : null;
  const throwaway = current?.id.startsWith('archive/') ? current : null;
  const taken = throwaway ? localList.some((l) => l.from === throwaway.id) : false;
  // a copy taken from his throwaways is the visitor's to keep, but not theirs to prove
  const takenCopy = ownedHereFrom(localList, current);
  const top = path[1];
  const postedHere = current?.id.startsWith('p/') ? posted.find((q) => `p/${q.id}` === current.id) ?? null : null;
  const ownedHere = current ? localIds(current) : null;
  const isFollowed = top ? followed.has(top.id) : false;
  const nearby = current ? (topologyOf(current), current.children) : [];
  const p = top ? closenessFor(top, followed) : 1;

  return (
    <div className={styles.field} ref={rootRef} data-night={night ? '' : undefined}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label={
          mode === 'flight'
            ? 'TwinThink Canvas. Scroll, or swipe up, to move through ideas; tap one to go to it.'
            : 'TwinThink Canvas. Scroll to move closer to an idea, drag to wander.'
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => {
          pointersRef.current.delete(e.pointerId);
          pinchRef.current = null;
          dragRef.current.active = false;
          if (sketchRef.current?.pointerId === e.pointerId) sketchRef.current.stroke = null;
          if (pointersRef.current.size === 0) {
            // the system took the touch (a back swipe, a notification): let the flight go
            const fc = flightCamRef.current;
            fc.held = false;
            fc.v = 0;
            fc.idle = 0;
          }
        }}
        onPointerLeave={() => {
          pointerRef.current.inside = false;
          setTip(null);
        }}
      />

      <Link href="/" className={styles.mark} aria-label="home">
        home
      </Link>

      <button type="button" className={styles.mode} onClick={switchMode}>
        {mode === 'flight' ? 'see it whole' : 'fly through'}
      </button>

      <button type="button" className={styles.night} onClick={toggleNight} aria-pressed={night}>
        {night ? 'day' : 'night'}
      </button>

      {mode === 'flight' && (
        <button
          type="button"
          className={styles.compass}
          onClick={() => {
            spinRef.current = !spinRef.current;
            setNotice(spinRef.current ? 'the clock turns again' : 'the clock holds still');
          }}
          aria-label="Compass: which way is up, where you are, where the next thing is. Tap to stop or start the turning."
        >
          <svg viewBox="0 0 46 46" width="46" height="46" aria-hidden>
            <circle cx="23" cy="23" r="20" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="1 3" />
            <g ref={needleRef}>
              <path d="M23 6 L26 23 L23 21 L20 23 Z" fill="currentColor" fillOpacity="0.75" />
              <path d="M23 40 L26 23 L23 25 L20 23 Z" fill="currentColor" fillOpacity="0.2" />
            </g>
            <circle ref={nextDotRef} cx="23" cy="10" r="2.4" fill="rgb(var(--rose))" />
            <circle ref={lapDotRef} cx="23" cy="3" r="1.8" fill="currentColor" />
          </svg>
        </button>
      )}

      {me?.user ? (
        <button type="button" className={styles.me} onClick={signOut} title="sign out">
          {me.user.name.split(' ')[0]}
        </button>
      ) : me?.enabled ? (
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a route handler that redirects to Google needs a full page load
        <button type="button" className={styles.me} onClick={() => window.location.assign('/api/auth/google?next=/canvas')}>
          sign in
        </button>
      ) : null}

      {ownedHere && <div className={styles.privacy}>private · only on this device</div>}

      <nav className={styles.trail} aria-label="Where you are">
        {crumbs.map(({ n, i }, j) => (
          <React.Fragment key={`${n.id}:${i}`}>
            {j > 0 && <span className={styles.sep}>·</span>}
            {i < 0 ? (
              <span className={styles.sep}>…</span>
            ) : (
              <button
                type="button"
                className={i === path.length - 1 ? styles.here : styles.crumb}
                onClick={() => flyTo(path.slice(0, i + 1))}
              >
                {i === 0 ? 'canvas' : n.portal ? 'the canvas, again' : n.title ?? 'untitled'}
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>


      <div className={styles.actions}>
        {path.length <= 1 && (
          <>
            {(
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
            {posting && me?.enabled && (
              <button type="button" className={styles.quiet} onClick={tellStory}>
                tell a story
              </button>
            )}
            <button type="button" className={styles.quiet} onClick={wander}>
              wander
            </button>
            <button type="button" className={styles.quiet} onClick={() => setGiving((g) => !g)}>
              support his work
            </button>
          </>
        )}
        {top && top.id !== 'throwaways' && (
          <button type="button" className={styles.quiet} onClick={replayView ? stopReplay : startReplay}>
            {replayView ? 'return to now' : 'watch it grow'}
          </button>
        )}
        {current?.media?.some((m) => m.kind === 'audio') && (
          <>
            <button type="button" className={playingId === current.id ? styles.following : styles.quiet} onClick={() => toggleSong([...path])}>
              {playingId === current.id ? 'pause' : 'play'}
            </button>
            {current.free && (
              <a
                className={styles.quiet}
                href={(current.media.find((m) => m.kind === 'audio') as { src: string }).src}
                download
                onClick={() => ripple(current.id)}
              >
                take it, free
              </a>
            )}
          </>
        )}
        {throwaway && (
          <button type="button" className={taken ? styles.following : styles.quiet} onClick={() => takeIdea(throwaway)} disabled={taken}>
            {taken ? 'yours now' : 'take it, free'}
          </button>
        )}
        {asking && (
          <button
            type="button"
            className={givingTo ? styles.following : styles.quiet}
            onClick={() => setGivingTo((g) => (g ? null : asking.id))}
          >
            help it continue
          </button>
        )}
        {top && top.ownedBy !== 'viewer' && (
          <button
            type="button"
            className={isFollowed ? styles.following : styles.quiet}
            onClick={() => toggleFollow(top)}
            aria-pressed={isFollowed}
          >
            {isFollowed ? 'following, you can go a little further' : 'I want to see what happens next'}
          </button>
        )}
        {top?.id === 'stories' && path.length === 2 && (
          <button type="button" className={styles.quiet} onClick={tellStory}>
            tell a story
          </button>
        )}
        {postedHere && postedHere.kind === 'story' && !postedHere.mine && (
          <button type="button" className={styles.quiet} onClick={() => sparkFrom(postedHere.id)}>
            there’s an idea in this
          </button>
        )}
        {postedHere?.mine && (
          <>
            {postedHere.kind !== 'story' && (
              <button type="button" className={postedHere.public ? styles.following : styles.quiet} onClick={() => changePosted(postedHere.id, { public: !postedHere.public })}>
                {postedHere.public ? 'shared, keep it to myself' : 'share it with everyone'}
              </button>
            )}
            <button type="button" className={styles.quiet} onClick={() => current && readNotes(current)}>
              notes
            </button>
            <button type="button" className={styles.quiet} onClick={() => changePosted(postedHere.id, 'remove')}>
              {postedHere.kind === 'story' ? 'take it back' : 'let it go'}
            </button>
          </>
        )}
        {postedHere && !postedHere.mine && (
          <button type="button" className={styles.quiet} onClick={() => reportPosted(postedHere.id)}>
            report
          </button>
        )}
        {postedHere && !postedHere.mine && me?.user?.owner && (
          <button type="button" className={styles.quiet} onClick={() => changePosted(postedHere.id, 'take down')}>
            take down
          </button>
        )}
        {me?.user?.owner && current && path.length > 1 && !ownedHere && !current.id.startsWith('p/') && (
          <button type="button" className={styles.quiet} onClick={() => readNotes(current)}>
            notes
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
                const flying = modeRef.current === 'flight';
                const [lx, ly] = flying ? openSpotIn(current) : openSpot(c, c.node);
                const [sx, sy] = flying ? [c.w / 2 - 130, c.h - 150] : c.toScreen(lx, ly);
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
            <button type="button" className={styles.quiet} onClick={() => fileRef.current?.click()}>
              add an image
            </button>
            <button type="button" className={sketching ? styles.following : styles.quiet} onClick={toggleSketch} aria-pressed={sketching}>
              {sketching ? 'done sketching' : 'sketch'}
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
            {!ownedHere.thoughtId && (
              <button type="button" className={styles.quiet} onClick={() => keepCopy(ownedHere.shadowId)}>
                keep a copy
              </button>
            )}
            {!ownedHere.thoughtId && posting && me?.user && (
              <button type="button" className={styles.quiet} onClick={() => putOnline(ownedHere.shadowId)}>
                put it online
              </button>
            )}
            {!ownedHere.thoughtId && !takenCopy && (
              <button type="button" className={styles.quiet} onClick={() => proveMine(ownedHere.shadowId)}>
                prove it’s mine
              </button>
            )}
            {ownedHere.thoughtId && (
              <button type="button" className={styles.quiet} onClick={() => startDialectic('challenge')}>
                challenge it
              </button>
            )}
            {ownedHere.thoughtId && dialecticFor(localList, current)?.pair && (
              <button type="button" className={styles.quiet} onClick={() => startDialectic('synthesis')}>
                resolve them
              </button>
            )}
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
        </div>
      )}

      {news && path.length <= 1 && (
        <div className={styles.news} role="status">
          <button type="button" className={styles.quiet} onClick={() => { flyToIds(news.ids); setNews(null); }}>
            {news.title}: go see
          </button>
          <button type="button" className={styles.newsClose} aria-label="Dismiss" onClick={() => setNews(null)}>
            ×
          </button>
        </div>
      )}

      {React.createElement('model-viewer', {
        ref: modelRef,
        className: styles.model,
        'camera-controls': true,
        'disable-zoom': true,
        'disable-pan': true,
        'auto-rotate': true,
        'rotation-per-second': '12deg',
        'interaction-prompt': 'none',
        'shadow-intensity': '0.4',
        exposure: '1.05',
        'environment-image': 'neutral',
        style: { display: 'none' },
      })}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) addImage(f);
          e.currentTarget.value = '';
        }}
      />

      {sketching && <div className={styles.hint}>draw with your finger or mouse · scroll still moves you in and out</div>}
      {notice && (
        <div className={styles.news} role="status">
          <span className={styles.quiet}>{notice}</span>
          <button type="button" className={styles.newsClose} aria-label="Dismiss" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}

      {givingTo && supportTarget && supportTarget.id === givingTo && (
        <div className={styles.give}>
          <div className={styles.giveFor}>toward {supportTarget.title ?? 'this idea'}</div>
          <Donate compact shadowId={givingTo} onDone={() => setGivingTo(null)} />
        </div>
      )}

      {giving && path.length <= 1 && (
        <div className={styles.give}>
          <Donate compact onDone={() => setGiving(false)} />
        </div>
      )}

      {notesView && (
        <div className={styles.notes} role="dialog" aria-label={`Notes left at ${notesView.title}`}>
          <div className={styles.notesHead}>
            <span>left at {notesView.title}</span>
            <button type="button" className={styles.newsClose} aria-label="Close" onClick={() => setNotesView(null)}>
              ×
            </button>
          </div>
          {notesView.notes.length === 0 ? (
            <p className={styles.noteText}>nothing left here yet</p>
          ) : (
            notesView.notes.map((n, i) => (
              <p key={i} className={styles.noteText}>
                {n.text}
              </p>
            ))
          )}
        </div>
      )}

      {tip && (
        <div className={styles.tip} style={{ left: tip.x + 14, top: tip.y - 8 }}>
          <div className={styles.tipTitle}>{tip.title}</div>
          {tip.line && <div className={styles.tipLine}>{tip.line}</div>}
        </div>
      )}

      {composer && composer.mode === 'story' && (
        <form
          className={`${styles.composer} ${styles.wide}`}
          style={{
            left: Math.max(16, Math.min(view.w - 476, composer.x)),
            top: Math.max(16, Math.min(view.h - 320, composer.y)),
          }}
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('text') as HTMLTextAreaElement;
            submitComposer(input.value);
          }}
        >
          <textarea
            name="text"
            autoFocus
            rows={7}
            maxLength={4000}
            placeholder="a time you made do with what you had…"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setComposer(null);
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className={styles.composerRow}>
            <span className={styles.composerHint}>told without your name · no one’s real name · nothing that hurts anyone</span>
            <button type="submit" className={styles.composerSend}>
              tell it
            </button>
          </div>
          <button type="button" className={styles.composerHint} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => setComposer(null)}>
            not now
          </button>
        </form>
      )}

      {composer && composer.mode !== 'story' && (
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
            placeholder={
              composer.mode === 'cast'
                ? 'what are you thinking about?'
                : composer.mode === 'thought'
                  ? 'a thought inside it'
                  : composer.mode === 'challenge'
                    ? 'what argues against it?'
                    : composer.mode === 'synthesis'
                      ? 'what holds both?'
                      : composer.mode === 'note'
                        ? 'a note for its maker'
                        : composer.mode === 'spark'
                          ? 'what could be made from it?'
                          : ''
            }
            onKeyDown={(e) => {
              if (e.key === 'Escape') setComposer(null);
            }}
            onBlur={(e) => {
              if (!e.currentTarget.value.trim()) setComposer(null);
            }}
          />
          <span className={styles.composerHint}>
            {composer.mode === 'cast'
              ? posting && me?.user
                ? 'enter to cast · only you see it until you share it'
                : posting && me?.enabled
                  ? 'enter to cast · kept on this device · sign in to share it'
                  : 'enter to cast · kept on this device for now'
              : composer.mode === 'note'
                ? 'sealed · no name is kept · only the maker reads it'
                : composer.mode === 'spark'
                  ? 'enter to keep · yours, private until you share it'
                  : 'enter to keep'}
          </span>
        </form>
      )}

      {!hinted && path.length <= 1 && (
        <div className={styles.hint}>{mode === 'flight' ? 'scroll, or swipe up' : 'scroll toward anything'}</div>
      )}

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
