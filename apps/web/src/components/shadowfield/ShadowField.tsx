'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Camera, ScreenTransform } from '@/lib/shadowfield/camera';
import { IdeaNode, LifeEvent, SEAL_MARGIN, findPath, lastActivity } from '@/lib/shadowfield/model';
import { topologyOf } from '@/lib/shadowfield/layout';
import { Access, Flight, pan as panCam, stepFlight, transformOfPath, zoomAt } from '@/lib/shadowfield/navigate';
import { Hit, Lens, NIGHT, PAPER_RGB, RenderState, drawSketch, setNight, lifeWord, drawVoidLattice, pulseChain, render, shortDate } from '@/lib/shadowfield/render';
import { filmsHeard, getVideo, hearFilm, quietFilms, restVideos, setFilmRate, setMediaReadyCallback, settleVideos, toggleVideoSound } from '@/lib/shadowfield/media';
import {
  ARRIVE,
  FOCUS,
  FlightCam,
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
  panAt,
  panBy,
  hopBase,
  hopTo,
  HopKind,
  focusAround,
  settle,
  stopZ,
  quarterFacing,
  type Quarter,
} from '@/lib/shadowfield/flight';
import { VelocityTracker, WheelHops, landingIndex, pxPerStop } from '@/lib/shadowfield/gesture';
import {
  Food,
  Pluck,
  WebMemory,
  admitPlucks,
  beginVisit,
  emptyMemory,
  findFood,
  forgetOnDevice,
  keepOnDevice,
  leanedChildOf,
  lastPluck,
  type DeviceTrace,
  readMemory,
  trembleAt,
  writeMemory,
} from '@/lib/shadowfield/web';
import { edgePaths, renderFlight } from '@/lib/shadowfield/flightRender';
import { createCore, groupLens, groupOf, hourLens, lensOf, replayLens, type Core, type Rule } from '@/lib/shadowfield/core';
import { hash01, smoothstep } from '@/lib/shadowfield/rng';
import Donate from '@/components/support/Donate';
import { founderPlots } from '@/lib/shadowfield/plots';
import { buildWorld, resolvePath } from '@/lib/shadowfield/world';
import type { Posted, PostedFork } from '@/lib/shadowfield/sources/posted';
import { dayOf, wordFor } from '@/lib/shadowfield/prompts';
import type { Phase } from '@/lib/shadowfield/phases';
import { createLocalStore, LocalShadow, ShadowStore } from '@/lib/shadowfield/sources/local';
import styles from './ShadowField.module.css';

interface Props {
  serif: string;
}

interface Composer {
  mode: 'cast' | 'thought' | 'rewrite' | 'challenge' | 'synthesis' | 'note' | 'story' | 'spark' | 'answer' | 'fork' | 'inFork';
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
  /** For 'inFork': which fork the post joins. */
  forkId?: string;
  /** Set when this composer was opened from a Rabi notice's "open a path": which fork's notice sent us here. */
  fromNoticeForkId?: string;
}

interface Tip {
  x: number;
  y: number;
  title: string;
  line?: string;
}

/** A shared Fall, as this account sees it (see /api/shared-falls): an overlay, never its own kind of Fall. */
interface SharedFallState {
  id: string;
  hostName: string;
  hosting: boolean;
  stationId: string | null;
  ended: boolean;
  inviteLink?: string;
  participants: { token: string; name: string; mine: boolean }[];
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

/** Matches GATHERING in lib/shadows/store.ts: once pressure reaches this, it is shown, quietly. */
const GATHERING = 0.5;

function hasMedia(node: IdeaNode | undefined, kind: 'audio' | 'video') {
  return !!node?.media?.some((m) => m.kind === kind);
}

function eventLabel(ev: LifeEvent) {
  const d = new Date(ev.t);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${shortDate(ev.t)}, ${time}`;
}

/** Where camera z sits among a run of stops, as a fractional index. */
function unitAlong(run: number[], z: number) {
  if (z <= run[0]) return 0;
  for (let i = 0; i < run.length - 1; i++) {
    if (z <= run[i + 1]) return i + (z - run[i]) / Math.max(1e-6, run[i + 1] - run[i]);
  }
  return run.length - 1;
}

/** The camera z at a fractional index along a run of stops (held at its ends). */
function zAlong(run: number[], u: number) {
  const c = Math.max(0, Math.min(run.length - 1, u));
  const i = Math.min(run.length - 2, Math.floor(c));
  return run[i] + (run[i + 1] - run[i]) * (c - i);
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
  // in the flight a drag either travels (up and down) or slides the view (it began sideways)
  // a drag: travel (up and down, one thing per stretch of finger) or slide (it began sideways).
  // `run` is the stops around where it began, `u0` where the camera was among them.
  const dragRef = useRef<{
    active: boolean;
    moved: number;
    lastT: number;
    axis: 'travel' | 'slide' | null;
    tx: number;
    ty: number;
    run: number[];
    u0: number;
    resume: number | null;
  }>({ active: false, moved: 0, lastT: 0, axis: null, tx: 0, ty: 0, run: [], u0: 0, resume: null });
  const wheelHopsRef = useRef(new WheelHops());
  const velocityRef = useRef(new VelocityTracker());
  // when the last hop began (ms): quick runs of hops grow lighter
  const lastHopAtRef = useRef(0);
  const keyHopAtRef = useRef(0);
  // arrivals: the last hop and landing seen by the frame loop, when it landed, and a film waiting to be heard
  const seenHopsRef = useRef(0);
  const prevHopAtRef = useRef(0);
  const seenLandedRef = useRef(0);
  const landedAtRef = useRef(0);
  const hearNextRef = useRef<string | null>(null);
  // the web that moves (see web.ts): what this device remembers, what is waiting, and plucks under way
  const webMemRef = useRef<WebMemory>(emptyMemory());
  const foodRef = useRef<Food[]>([]);
  const foodSetRef = useRef<Set<string>>(new Set());
  const foundAtRef = useRef<Map<string, number>>(new Map());
  const plucksRef = useRef<Pluck[]>([]);
  const echoesRef = useRef<Pluck[]>([]);
  const lastPluckRef = useRef<Map<string, number>>(new Map());
  const calmRef = useRef(1);
  const hadFoodRef = useRef(false);
  const holdRef = useRef<{ timer: number; consumed: boolean }>({ timer: 0, consumed: false });
  const findFoodRef = useRef<() => void>(() => undefined);
  // each thing's name phase, kept from frame to frame
  const phasesRef = useRef(new Map<string, Phase>());
  // resonance: how much things resonate (from the server), and what you stayed with this visit
  const resonanceRef = useRef(new Map<string, number>());
  const pressureRef = useRef(new Map<string, number>());
  // presence: in a shared Fall, how many other people are at each thing right now (never a trail)
  const presenceRef = useRef(new Map<string, number>());
  // the one path deliberately leaned at the branch currently in view (device-only, never a trail)
  const leanedRef = useRef(new Set<string>());
  // the core (core.ts): what is in front of you, and the moves you make, run past its rules
  const coreRef = useRef<Core | null>(null);
  const postedSigRef = useRef('');
  // the scroll gesture that carried you onto something waiting (it stops there until a new one begins)
  const foodGestureRef = useRef(-1);
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
  // the clock can turn slowly by itself, but only if asked: tapping the compass starts or stops it
  const spinRef = useRef(false);
  // steering (a mouse, held by the page): you are the drop at the middle; where the hand pushes,
  // the way ahead swings, and pushed far enough toward an hour you turn into it
  // the group you have gone into (null: on the Slate, among its groups)
  const insideRef = useRef<string | null>(null);
  const steerRef = useRef({ on: false, x: 0, y: 0, endedAt: 0, well: null as Quarter | null });
  const [steering, setSteering] = useState(false);
  const canSteer = useSyncExternalStore(
    () => () => undefined,
    () => window.matchMedia('(pointer: fine)').matches && 'requestPointerLock' in HTMLElement.prototype,
    () => false
  );
  const needleRef = useRef<SVGGElement | null>(null);
  const nextDotRef = useRef<SVGCircleElement | null>(null);
  const lapDotRef = useRef<SVGCircleElement | null>(null);
  // the compass's rose dot: where something waits for you
  const foodDotRef = useRef<SVGCircleElement | null>(null);
  // the compass is also a stick: held and pushed, it slides the view any way; the ring shows how far
  const youRef = useRef<SVGCircleElement | null>(null);
  const joyRef = useRef<{ id: number; x0: number; y0: number; dx: number; dy: number; moved: boolean } | null>(null);
  const centreRef = useRef(false);
  const compassRef = useRef<{ roll: number; next: number | null; food: number | null } | undefined>(undefined);
  const [notesView, setNotesView] = useState<{ title: string; notes: { t: number; text: string }[] } | null>(null);
  const [me, setMe] = useState<{ enabled: boolean; user: { name: string; owner: boolean } | null } | null>(null);
  // work people have posted, kept on the server (see /api/shadows)
  const postedRef = useRef<{ public: Posted[]; mine: Posted[]; today?: boolean; keeps?: string[]; linked?: Posted[] }>({ public: [], mine: [] });
  const [keeps, setKeeps] = useState<string[]>([]);
  // a shared link to posted work waits for it to arrive from the server
  const pendingAtRef = useRef<string[] | null>(null);
  const pendingWhoRef = useRef<string | null>(null);
  const pendingInviteRef = useRef<{ forkId: string; token: string } | null>(null);
  const pendingSharedFallRef = useRef<{ id: string; token: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPostedList] = useState<Posted[]>([]);
  const [forkRoom, setForkRoom] = useState<{ used: number; room: number } | null>(null);
  // bumped to ask the existing load-posted effect to run again, without any new code calling it directly
  const [refreshTick, setRefreshTick] = useState(0);
  // shown once, right after opening a fork: the link that lets someone else post inside it
  const [forkInvite, setForkInvite] = useState<{ forkId: string; title: string; link: string } | null>(null);
  // Rabi noticing pressure: shown only to the fork's own maker, never acted on by anything but them
  const [rabiNotice, setRabiNotice] = useState<{ forkId: string; title: string } | null>(null);
  const noticeCheckedRef = useRef(new Set<string>());
  // "Fall with me": an overlay on the Fall you already have, never its own kind of Fall. Only ever
  // the leader's own current place travels between two people; a follower's own position never does.
  const [sharedFall, setSharedFall] = useState<SharedFallState | null>(null);
  const sharedFallLastSeenRef = useRef<string | null>(null);
  // films can be added once the site has a file store for them
  const [filmsOn, setFilmsOn] = useState(false);
  const postPicRef = useRef<HTMLInputElement | null>(null);
  const postFilmRef = useRef<HTMLInputElement | null>(null);
  const mediaForRef = useRef<string | null>(null);

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
    // a flight under way keeps going to the same thing, wherever it now sits
    const going = fc.hop ? fc.hop.to : fc.target;
    const bound = oldStream && going !== null ? focusOf(oldStream, going) : null;
    const idx = oldHere ? stream.byId.get(oldHere.node.id) : undefined;
    const zBefore = fc.z;
    if (oldStream && oldHere && idx !== undefined) {
      const offset = wrapDelta(fc.z, oldHere.z - FOCUS, oldStream.length);
      fc.z = stream.stations[idx].z - FOCUS + offset;
      fc.target = null;
      hereRef.current = stream.stations[idx];
    }
    // what the view was slid by stays where it was
    fc.panZ += fc.z - zBefore;
    prevZRef.current = null;
    const to = bound ? stream.byId.get(bound.node.id) : undefined;
    if (bound && to !== undefined) {
      const z = stopZ(stream, stream.stations[to], fc.z);
      if (fc.hop) {
        fc.hop.to = z;
        fc.hop.e0 = Math.max(Math.abs(z - fc.z), 1e-6);
      } else fc.target = z;
    } else if (fc.hop && oldStream) {
      // what it was going to is gone: come to rest on something
      fc.hop = null;
      settle(fc, stream, skipRef.current);
    }
    findFoodRef.current();
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
    quietFilms();
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
        insideRef.current = groupOf(s);
        fc.target = s.depth === 0 ? fc.z + wrapDelta(-ARRIVE, fc.z, stream.length) : focusZ(stream, s, fc.z);
        // a hop under way keeps its momentum as it turns toward the new place
        if (!fc.hop) fc.v = 0;
        return;
      }
      return;
    }
    flightRef.current = { target, radius };
    velRef.current = { x: 0, y: 0 };
    zoomVelRef.current.v = 0;
  }, []);

  /** Hop the flight to camera z `to`: lighter and quicker in a quick run of hops. */
  const hopFlight = useCallback((to: number, kind: HopKind = 'step', v?: number) => {
    const now = performance.now();
    const gap = (now - lastHopAtRef.current) / 1000;
    lastHopAtRef.current = now;
    // arriving at something waiting for you is a catch: it takes hold like a strike on the web
    const stream = streamRef.current;
    if (stream && kind !== 'threshold' && kind !== 'skim' && foodSetRef.current.has(focusOf(stream, to, skipRef.current).node.id)) kind = 'catch';
    hopTo(flightCamRef.current, to, kind, { gap, v });
  }, []);

  const flyToIds = useCallback(
    (ids: string[]) => {
      const world = worldRef.current;
      if (!world) return;
      flyTo(resolvePath(world, ids));
    },
    [flyTo]
  );

  /**
   * A direct, out-of-sequence pick (a tap, or its screen-reader equivalent) is a choose move; the
   * core keeps it as a Lean where there were several paths. Passing through never calls this.
   */
  const choose = useCallback((path: IdeaNode[]) => {
    if (path.length >= 2) coreRef.current?.move({ kind: 'choose', from: path[path.length - 2], to: path[path.length - 1] });
  }, []);

  /** Going to something you picked; a group picked on the Slate is gone into, to the first thing in it. */
  const goTo = useCallback(
    (path: IdeaNode[], radius?: number) => {
      const stream = streamRef.current;
      const idx = stream?.byId.get(path[path.length - 1].id);
      const door = stream && idx !== undefined && stream.stations[idx].depth === 1 && stream.stations[idx].gate ? stream.stations[idx] : null;
      const going = !!door && modeRef.current === 'flight' && insideRef.current !== door.node.id;
      choose(path);
      flyTo(path, radius);
      const first = going && stream ? stream.stations[idx! + 1] : undefined;
      if (first && first.depth === 2 && first.node.disclosure <= lensRef.current.closeness(first.path[1])) {
        const fc = flightCamRef.current;
        fc.target = focusZ(stream!, first, fc.z);
      }
    },
    [choose, flyTo]
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
    // the web remembers, on this device only, what you have found and when you were last here
    webMemRef.current = beginVisit(readMemory(storage), Date.now());
    writeMemory(storage, webMemRef.current);
    import('@google/model-viewer').catch(() => undefined);
    // exposed for scripted visual checks (e2e); read-only by convention
    (window as unknown as { __shadowField?: unknown }).__shadowField = {
      cam,
      flight: flightCamRef.current,
      stream: () => streamRef.current,
      here: () => hereRef.current?.node.id ?? null,
      steer: () => ({ ...steerRef.current }),
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

    // a shared link (/slate?at=a~b) arrives at what it points to
    try {
      const url = new URL(window.location.href);
      const at = url.searchParams.get('at');
      if (at) {
        url.searchParams.delete('at');
        history.replaceState(null, '', `${url.pathname}${url.search}#path=${at.split('~').map(encodeURIComponent).join('~')}`);
        if (at.includes('p/')) pendingAtRef.current = at.split('~').filter(Boolean);
      }
      // a Whoeuvre link (/whoeuvre/name): their ring, once their work arrives
      const who = url.searchParams.get('who');
      if (who) {
        url.searchParams.delete('who');
        history.replaceState(null, '', `${url.pathname}${url.search}${window.location.hash}`);
        pendingWhoRef.current = who.toLowerCase();
      }
      // a fork's invite link (?fork=<id>&invite=<token>): held until signed in, then spent and
      // dropped from the address bar; left in place so signing in carries it through
      const forkId = url.searchParams.get('fork');
      const invite = url.searchParams.get('invite');
      if (forkId && invite) pendingInviteRef.current = { forkId, token: invite };
      // a "Fall with me" invite (?sharedFall=<id>&invite=<token>): held the same way
      const sharedFallId = url.searchParams.get('sharedFall');
      if (sharedFallId && invite) pendingSharedFallRef.current = { id: sharedFallId, token: invite };
    } catch {
      // ignore malformed links
    }
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

  /** Find what is waiting for you (called whenever the Canvas is rebuilt or posts arrive). */
  const findFoodNow = useCallback(() => {
    const stream = streamRef.current;
    const world = worldRef.current;
    if (!stream || !world) return;
    const closed = skipRef.current;
    const posted = [...postedRef.current.mine, ...postedRef.current.public.filter((p) => !p.mine)];
    const fresh = stream.stations
      .filter((s2) => s2.depth >= 1 && !s2.node.id.startsWith('p/'))
      .map((s2) => ({ id: s2.node.id, began: s2.node.began, ring: s2.path[1]?.id }));
    const foods = findFood({
      posted,
      keeps: postedRef.current.keeps ?? [],
      memory: webMemRef.current,
      today: dayOf(),
      fresh,
      open: (id) => {
        const i = stream.byId.get(id);
        if (i === undefined) return false;
        const s2 = stream.stations[i];
        // never anything sealed (whatever closeness allows), hidden, on a device, yours, or a sketchbook copy
        return (
          !closed(s2) &&
          !id.startsWith('local/') &&
          s2.node.ownedBy !== 'viewer' &&
          !s2.path.some((n) => n.id === 'sketchbook' || n.disclosure > 0)
        );
      },
    });
    const now = performance.now() / 1000;
    for (const f of foods) if (!foundAtRef.current.has(f.id)) foundAtRef.current.set(f.id, now);
    foodRef.current = foods;
    foodSetRef.current = new Set(foods.map((f) => f.id));
    if (foods.length) hadFoodRef.current = true;
  }, []);
  useEffect(() => {
    findFoodRef.current = findFoodNow;
    findFoodNow();
  }, [findFoodNow]);

  /** Found: it no longer trembles, and the web settles a little. */
  const eatFood = useCallback((id: string) => {
    if (!foodSetRef.current.has(id)) return;
    webMemRef.current = keepOnDevice(webMemRef.current, 'seen', id);
    try {
      writeMemory(window.localStorage, webMemRef.current);
    } catch {
      // private browsing: it is remembered for this visit only
    }
    foodRef.current = foodRef.current.filter((f) => f.id !== id);
    foodSetRef.current = new Set(foodRef.current.map((f) => f.id));
    ripple(id);
  }, [ripple]);

  /** Pluck the web yourself: everything still waiting answers once. */
  const pluckWeb = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const fc = flightCamRef.current;
    const now = performance.now() / 1000;
    echoesRef.current = foodRef.current.map((f, i) => {
      const s2 = stream.stations[stream.byId.get(f.id) ?? 0];
      let d = wrapDelta(s2.z, fc.z, stream.length);
      if (d < 0) d += stream.length;
      return { id: f.id, z: fc.z + d, t0: now + i * 0.22, a: 0.55 * f.strength, rose: f.rose };
    });
    if (!foodRef.current.length) setNotice('nothing is waiting');
  }, []);

  /** Go to the nearest thing waiting ahead (a crossing: the view breathes out on the way). */
  const goToFood = useCallback((): boolean => {
    const stream = streamRef.current;
    if (!stream) return false;
    const fc = flightCamRef.current;
    let best: number | null = null;
    let into: string | null = null;
    for (const f of foodRef.current) {
      const i = stream.byId.get(f.id);
      if (i === undefined) continue;
      let z = stopZ(stream, stream.stations[i], hopBase(fc));
      // (the one you are on is not somewhere to go)
      if (Math.abs(z - hopBase(fc)) < 0.05) continue;
      if (z < hopBase(fc)) z += stream.length;
      if (best === null || z < best) {
        best = z;
        into = groupOf(stream.stations[i]);
      }
    }
    // nothing waiting: a fork you passed but never entered is still a turn you can still take
    if (best === null) {
      for (const id of webMemRef.current.passed) {
        const i = stream.byId.get(id);
        if (i === undefined) continue;
        let z = stopZ(stream, stream.stations[i], hopBase(fc));
        if (Math.abs(z - hopBase(fc)) < 0.05) continue;
        if (z < hopBase(fc)) z += stream.length;
        if (best === null || z < best) {
          best = z;
          into = groupOf(stream.stations[i]);
        }
      }
    }
    if (best === null) return false;
    insideRef.current = into;
    hopFlight(best, 'threshold');
    return true;
  }, [hopFlight]);

  /** A tap on the compass: back to the middle if the view was slid; otherwise the clock stops or turns. */
  const tapCompass = (towardFood = false) => {
    const stream = streamRef.current;
    const fc = flightCamRef.current;
    const [px, py] = stream ? panAt(fc, stream.length) : [0, 0];
    if (Math.hypot(px, py) > 0.02) {
      centreRef.current = true;
      return;
    }
    // the rose dot: it takes you to what is waiting (elsewhere on the compass, as before)
    if (towardFood && foodRef.current.length && goToFood()) return;
    spinRef.current = !spinRef.current;
    setNotice(spinRef.current ? 'the clock turns again' : 'the clock holds still');
  };

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
  const loadPosted = useCallback(async (quiet = false) => {
    const d = (await fetch('/api/shadows', { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => null)) as { enabled?: boolean; films?: boolean; public?: Posted[]; mine?: Posted[]; keeps?: string[]; room?: { used: number; room: number } } | null;
    if (!d) return;
    // looking again and finding nothing new changes nothing
    const sig = JSON.stringify(d);
    if (quiet && sig === postedSigRef.current) return;
    postedSigRef.current = sig;
    setFilmsOn(!!d.films);
    setForkRoom(d.room ?? null);
    postedRef.current = { public: d.public ?? [], mine: d.mine ?? [], today: !!d.enabled, keeps: d.keeps ?? [], linked: postedRef.current.linked ?? [] };
    setKeeps(d.keeps ?? []);
    setPosting(!!d.enabled);
    setPostedList([...(d.mine ?? []), ...(d.public ?? []).filter((p) => !p.mine)]);
    if (storeRef.current) rebuild();
    const who = pendingWhoRef.current;
    if (who && worldRef.current) {
      pendingWhoRef.current = null;
      const people = worldRef.current.children.find((n) => n.id === 'people');
      const ring = people?.children.find((n) => (n.title ?? '').toLowerCase() === who);
      if (people && ring) flyTo([worldRef.current, people, ring]);
      else setNotice('their whoeuvre is not shared here yet');
    }
    const at = pendingAtRef.current;
    if (at && worldRef.current) {
      pendingAtRef.current = null;
      // found wherever it lives now (links outlive how the Slate is arranged)
      const last = at[at.length - 1];
      const found = findPath(worldRef.current, last);
      if (found) flyTo(found);
      else if (last.startsWith('p/')) {
        // shared only by its link: ask for it, and it joins "sent to you" for this visit
        void fetch(`/api/shadows/${encodeURIComponent(last.slice(2))}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((d2: { shadow?: Posted } | null) => {
            if (!d2?.shadow || !worldRef.current) {
              setNotice('that is not shared any more');
              return;
            }
            postedRef.current = { ...postedRef.current, linked: [...(postedRef.current.linked ?? []), d2.shadow] };
            setPostedList((l) => [...l.filter((q) => q.id !== d2.shadow!.id), d2.shadow!]);
            rebuild();
            const p2 = worldRef.current && findPath(worldRef.current, last);
            if (p2) flyTo(p2);
          })
          .catch(() => undefined);
      } else {
        const p = resolvePath(worldRef.current, at);
        if (p.length > 1) flyTo(p);
      }
    }
  }, [rebuild, flyTo]);

  useEffect(() => {
    void loadPosted();
  }, [loadPosted, me?.user, refreshTick]);

  // a fork's invite link, held until signed in: spent once, then dropped from the address bar
  useEffect(() => {
    const invite = pendingInviteRef.current;
    if (!invite || !me?.user) return;
    pendingInviteRef.current = null;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('fork');
      url.searchParams.delete('invite');
      history.replaceState(null, '', `${url.pathname}${url.search}${window.location.hash}`);
    } catch {
      // ignore
    }
    fetch(`/api/forks/${encodeURIComponent(invite.forkId)}/join`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: invite.token }),
    })
      .then(async (res) => {
        const dj = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.ok) {
          setNotice('you may post there now');
          setRefreshTick((t) => t + 1);
        } else setNotice((dj.error ?? 'that invitation is not open').toLowerCase());
      })
      .catch(() => setNotice('that invitation is not open'));
  }, [me?.user]);

  // a "Fall with me" invite, held until signed in: spent once, then dropped from the address bar
  useEffect(() => {
    const invite = pendingSharedFallRef.current;
    if (!invite || !me?.user) return;
    pendingSharedFallRef.current = null;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('sharedFall');
      url.searchParams.delete('invite');
      history.replaceState(null, '', `${url.pathname}${url.search}${window.location.hash}`);
    } catch {
      // ignore
    }
    fetch(`/api/shared-falls/${encodeURIComponent(invite.id)}/join`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: invite.token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const dj = (await res.json().catch(() => ({}))) as { error?: string };
          setNotice((dj.error ?? 'that invitation is not open').toLowerCase());
          return;
        }
        const dr = await fetch(`/api/shared-falls/${encodeURIComponent(invite.id)}`, { cache: 'no-store' });
        const d = (await dr.json().catch(() => ({}))) as { sharedFall?: SharedFallState };
        if (d.sharedFall) setSharedFall(d.sharedFall);
      })
      .catch(() => setNotice('that invitation is not open'));
  }, [me?.user]);

  /** Opens a shared Fall, leading it from wherever you already are. */
  const startSharedFall = () => {
    fetch('/api/shared-falls', { method: 'POST' })
      .then(async (res) => {
        const d = (await res.json().catch(() => ({}))) as { sharedFall?: SharedFallState; error?: string };
        if (!res.ok || !d.sharedFall) {
          setNotice((d.error ?? 'that could not be opened').toLowerCase());
          return;
        }
        sharedFallLastSeenRef.current = null;
        setSharedFall(d.sharedFall);
        // from here on the core keeps the leader's place each time they stop; this is where they already are
        const here = hereRef.current?.node.id;
        if (here) {
          void fetch(`/api/shared-falls/${encodeURIComponent(d.sharedFall.id)}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ stationId: here }),
          }).catch(() => undefined);
        }
      })
      .catch(() => setNotice('that could not be opened'));
  };

  /** Leaving never ends your own Fall or history; the leader leaving ends it for the other person too. */
  const leaveSharedFall = () => {
    const id = sharedFall?.id;
    setSharedFall(null);
    if (!id) return;
    void fetch(`/api/shared-falls/${encodeURIComponent(id)}/leave`, { method: 'POST' }).catch(() => undefined);
  };

  // the latest shared-Fall state, for the poll loop below to read without needing to be
  // torn down and rebuilt every time that state changes (it changes almost every tick)
  const sharedFallRef = useRef<SharedFallState | null>(null);
  useEffect(() => {
    sharedFallRef.current = sharedFall;
  }, [sharedFall]);

  // While a shared Fall is open: its leader's place is kept by the core each time they stop (never a
  // follower's own position, never anything but the current place); everyone in it polls for that one
  // field and, if they are following, travels there themselves, on their own spring, at their own pace.
  useEffect(() => {
    const id = sharedFall?.id;
    const hosting = sharedFall?.hosting;
    if (!id) return;
    const timer = window.setInterval(() => {
      if (sharedFallRef.current?.ended) return;
      // both the leader and whoever is following read this back: the leader, to see who has
      // joined or left and whether it has ended; a follower, to travel to where it now is
      fetch(`/api/shared-falls/${encodeURIComponent(id)}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then(async (d: { sharedFall?: SharedFallState } | null) => {
          if (!d?.sharedFall) return;
          const prev = sharedFallRef.current;
          if (
            !prev ||
            prev.ended !== d.sharedFall.ended ||
            prev.stationId !== d.sharedFall.stationId ||
            prev.participants.length !== d.sharedFall.participants.length
          ) {
            setSharedFall(d.sharedFall);
          }
          if (hosting) return; // the leader's own place is never moved by this poll
          const station = d.sharedFall.stationId;
          if (!station || station === sharedFallLastSeenRef.current) return;
          sharedFallLastSeenRef.current = station;
          let world = worldRef.current;
          let target = world && findPath(world, station);
          if (!target) {
            // not (yet) in what this account can see: one refresh before concluding it truly is not
            await loadPosted(true);
            world = worldRef.current;
            target = world && findPath(world, station);
          }
          if (!target) {
            setNotice(`${d.sharedFall.hostName} moved into a path you can't enter`);
            return;
          }
          let open = target.length;
          for (let i = 2; i < target.length; i++) {
            if (target[i].disclosure > lensRef.current.closeness(target[1])) {
              open = i;
              break;
            }
          }
          // never fly past the permitted ancestor: shared reference never overrides this viewer's own disclosure
          flyTo(target.slice(0, open));
          if (open < target.length) setNotice(`${d.sharedFall.hostName} moved into a path you can't enter`);
        })
        .catch(() => undefined);
    }, 800);
    return () => window.clearInterval(timer);
  }, [sharedFall?.id, sharedFall?.hosting, flyTo, loadPosted]);

  // presence, for the flight to draw: never a trail, only how many others are at the current
  // shared place right now (almost always 0 or 1 in V1)
  useEffect(() => {
    const map = new Map<string, number>();
    if (sharedFall && !sharedFall.ended && sharedFall.stationId) {
      const others = sharedFall.participants.filter((p) => !p.mine).length;
      if (others > 0) map.set(sharedFall.stationId, others);
    }
    presenceRef.current = map;
  }, [sharedFall]);

  /** Change one of your posted Shadows (share it, keep it to yourself) or let it go. */
  const changePosted = async (id: string, change: { visibility: 'private' | 'unlisted' | 'public' } | 'remove' | 'take down') => {
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
    else
      setNotice(
        change.visibility === 'public'
          ? 'shared with everyone'
          : change.visibility === 'unlisted'
            ? 'shared only by its link: send it to whoever you choose'
            : 'only you can see it now'
      );
    if (remove) flyTo(focusPath().slice(0, 1));
    await loadPosted();
    ripple(`p/${id}`);
  };

  const signIn = () => {
    // wherever they are (an invite link included) is where they come back to
    const next = encodeURIComponent(window.location.pathname + window.location.search || '/slate');
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a route handler that redirects to Google needs a full page load
    window.location.assign(`/api/auth/google?next=${next}`);
  };

  /** A link to the thing in front of you, which unfolds into its own card wherever it is sent. */
  const shareHere = async (path: IdeaNode[]) => {
    const ids = path.slice(1).filter((n) => !n.void && !n.portal).map((n) => n.id);
    if (!ids.length) return;
    const url = `${window.location.origin}/slate?at=${ids.map(encodeURIComponent).join('~')}`;
    const title = path[path.length - 1]?.title ?? 'the Slate';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice('the link is copied');
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') setNotice(url);
    }
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

  const answerToday = () => {
    if (!me?.user) {
      signIn();
      return;
    }
    const c = camRef.current;
    setComposer({ mode: 'answer', x: (c?.w ?? 400) / 2 - 140, y: (c?.h ?? 600) - 170, lx: 0, ly: 0 });
  };

  const sparkFrom = (storyId: string) => {
    if (!me?.user) {
      signIn();
      return;
    }
    const c = camRef.current;
    setComposer({ mode: 'spark', target: storyId, x: (c?.w ?? 400) / 2 - 140, y: (c?.h ?? 600) - 170, lx: 0, ly: 0 });
  };

  /** A picture or a film joins one of your posted Shadows. */
  const sendMedia = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/shadows/${encodeURIComponent(id)}/media`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    if (!res?.ok) {
      setNotice((d?.error ?? 'that could not be kept').toLowerCase());
      return false;
    }
    await loadPosted();
    ripple(`p/${id}`);
    return true;
  };

  /** A picture, made small enough to keep (about the size of a phone screen). */
  const addPostPicture = async (id: string, file: File) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('unreadable'));
        img.src = url;
      });
      let scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      let data = '';
      // smaller until it fits what a Shadow may keep
      for (let i = 0; i < 4; i++) {
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
        data = c.toDataURL('image/jpeg', 0.8);
        if (data.length * 0.75 < 700_000) break;
        scale *= 0.75;
      }
      URL.revokeObjectURL(url);
      setNotice('keeping the picture…');
      if (await sendMedia(id, { kind: 'image', data, aspect: img.naturalHeight / img.naturalWidth })) setNotice('the picture is in it');
    } catch {
      setNotice('that picture could not be read');
    }
  };

  /** A film: straight from the phone to the file store, then joined to the Shadow with a still of it. */
  const addPostFilm = async (id: string, file: File) => {
    if (file.size > 200 * 1024 * 1024) {
      setNotice('that film is too long; keep it under about three minutes');
      return;
    }
    // its shape, and a still from a second in (if this browser can read it)
    let aspect = 16 / 9;
    let poster: string | undefined;
    const url = URL.createObjectURL(file);
    try {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.src = url;
      await new Promise<void>((res, rej) => {
        v.onloadeddata = () => res();
        v.onerror = () => rej(new Error('unreadable'));
        setTimeout(() => rej(new Error('slow')), 8000);
      });
      aspect = v.videoHeight / v.videoWidth || aspect;
      v.currentTime = Math.min(1, (v.duration || 2) / 3);
      await new Promise<void>((res) => {
        v.onseeked = () => res();
        setTimeout(res, 3000);
      });
      const c = document.createElement('canvas');
      const sc = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
      c.width = Math.round(v.videoWidth * sc);
      c.height = Math.round(v.videoHeight * sc);
      c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
      poster = c.toDataURL('image/jpeg', 0.78);
    } catch {
      poster = undefined;
    } finally {
      URL.revokeObjectURL(url);
    }
    try {
      const { upload } = await import('@vercel/blob/client');
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60) || 'film.mp4';
      const blob = await upload(`films/${id}/${safe}`, file, {
        access: 'public',
        handleUploadUrl: '/api/films',
        clientPayload: id,
        multipart: file.size > 20 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setNotice(`sending the film… ${Math.round(percentage)}%`),
      });
      if (await sendMedia(id, { kind: 'video', url: blob.url, aspect, ...(poster ? { poster } : {}) })) setNotice('the film is in it');
    } catch (e) {
      setNotice(((e as Error)?.message || 'that film could not be sent').toLowerCase());
    }
  };

  /** Your sketchbook: keep what someone else made, or let it go from it. */
  const toggleKeep = async (target: string) => {
    if (!me?.user) {
      signIn();
      return;
    }
    const kept = keeps.includes(target);
    const res = await fetch('/api/keeps', {
      method: kept ? 'DELETE' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target }),
    }).catch(() => null);
    if (!res?.ok) {
      const d = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      setNotice((d?.error ?? 'that could not be kept').toLowerCase());
      return;
    }
    setNotice(kept ? 'let go from your sketchbook' : 'kept in your sketchbook');
    if (!kept) ripple(target);
    await loadPosted();
  };

  const reportPosted = async (id: string) => {
    const res = await fetch(`/api/shadows/${encodeURIComponent(id)}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'reported from the Slate' }),
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

  // what resonates: read now and every ten minutes
  useEffect(() => {
    const read = () =>
      fetch('/api/resonance')
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { levels?: Record<string, number> } | null) => {
          if (d?.levels) resonanceRef.current = new Map(Object.entries(d.levels));
        })
        .catch(() => undefined);
    void read();
    const t = window.setInterval(() => {
      if (!document.hidden) void read();
    }, 600000);
    return () => window.clearInterval(t);
  }, []);

  // where pressure has gathered: read now and every ten minutes, the same as resonance
  useEffect(() => {
    const read = () =>
      fetch('/api/pressure')
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { levels?: Record<string, number> } | null) => {
          if (d?.levels) pressureRef.current = new Map(Object.entries(d.levels));
        })
        .catch(() => undefined);
    void read();
    const t = window.setInterval(() => {
      if (!document.hidden) void read();
    }, 600000);
    return () => window.clearInterval(t);
  }, []);

  // while you are here: remember that you were, and look for new work every two minutes
  useEffect(() => {
    const beat = window.setInterval(() => {
      if (document.hidden) return;
      webMemRef.current = { ...webMemRef.current, left: Date.now() };
      try {
        writeMemory(window.localStorage, webMemRef.current);
      } catch {
        // remembered for this visit only
      }
    }, 60000);
    const look = window.setInterval(() => {
      if (!document.hidden) void loadPosted(true);
    }, 120000);
    return () => {
      window.clearInterval(beat);
      window.clearInterval(look);
    };
  }, [loadPosted]);

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

    // the keepers: where each trace the core's rules keep actually goes
    const keep = (rule: Rule, key: string) => {
      if (rule.keeper === 'device') {
        // finding what was waiting also settles the web
        if (rule.trace === 'seen') return eatFood(key);
        const trace = rule.trace as DeviceTrace;
        webMemRef.current = rule.forget ? forgetOnDevice(webMemRef.current, trace, key) : keepOnDevice(webMemRef.current, trace, key);
        try {
          writeMemory(window.localStorage, webMemRef.current);
        } catch {
          // remembered for this visit only
        }
      } else if (rule.keeper === 'anonymous') {
        void fetch(`/api/${rule.trace}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ target: key }) }).catch(
          () => undefined
        );
      } else if (rule.keeper === 'live') {
        // only a shared Fall's own leader moves it
        const sf = sharedFallRef.current;
        if (!sf?.hosting || sf.ended) return;
        void fetch(`/api/shared-falls/${encodeURIComponent(sf.id)}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ stationId: key }),
        }).catch(() => undefined);
      }
    };
    if (!coreRef.current) coreRef.current = createCore({ waiting: (id) => foodSetRef.current.has(id) }, keep);
    const core = coreRef.current;

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
      // steering: the way ahead swings toward the hand, and an hour pushed far enough toward is turned into
      const steer = steerRef.current;
      const wasWell = steer.well;
      const ease = 1 - Math.exp(-dt * 5);
      fc.bx += ((flying && steer.on ? steer.x : 0) - fc.bx) * ease;
      fc.by += ((flying && steer.on ? steer.y : 0) - fc.by) * ease;
      if (!flying && steer.on) document.exitPointerLock();
      if (!flying || !steer.on) steer.well = null;
      else {
        const m = Math.hypot(steer.x, steer.y);
        const q = quarterFacing(steer.x, steer.y, fc.spin);
        if (steer.well === null) {
          if (m > 0.5) steer.well = q;
        } else if (m < 0.3) steer.well = null;
        else if (q !== steer.well) {
          // a little past the line between two hours before it gives way (no flicker on the line)
          const mid = -Math.PI / 2 + steer.well * (Math.PI / 2) + fc.spin;
          const off = Math.abs(mod(Math.atan2(steer.y, steer.x) - mid + Math.PI, Math.PI * 2) - Math.PI);
          if (off > Math.PI / 4 + 0.14) steer.well = q;
        }
        // held by the page, the pointer is the drop: whatever is at the middle is what it points at
        pointerRef.current = { x: cam.w / 2, y: cam.h * 0.47, inside: true, t: nowMs };
      }
      // this fall's lens: what this viewer may see, a replay's moment, the hour turned into
      const skip = lensOf(hiddenStation, replayLens(cut), groupLens(insideRef.current), hourLens(steer.well));
      // a sealed thing is seen (a closed mark) but can never be the thing in front of you
      const closed = (s: Station) => skip(s) || (s.depth > 1 && s.node.disclosure > lensRef.current.closeness(s.path[1]));
      skipRef.current = closed;
      if (steer.well !== wasWell) {
        core.move({ kind: 'turn', hour: steer.well });
        if (steer.well !== null) {
          // turned into an hour: on, deeper, to the next thing made around it
          const z = stream.stations.some((s) => s.depth > 0 && !closed(s)) ? stepFocus(stream, hopBase(fc), 1, closed) : null;
          if (z !== null) hopTo(fc, z, 'threshold');
          else setNotice(`nothing here from around ${['12', '3', '6', '9'][steer.well]} yet`);
        }
      }

      // motion
      if (flying) {
        stepFlightCam(fc, stream, dt, closed);
        // the compass held and pushed: the view slides that way, faster the further it is pushed
        const joy = joyRef.current;
        if (joy?.moved) {
          const c = camRef.current;
          const m = Math.hypot(joy.dx, joy.dy);
          if (c && m > 3) {
            const rate = (600 * Math.min(1, m / 30)) / m;
            panBy(fc, stream, -joy.dx * rate * dt, -joy.dy * rate * dt, c.w, c.h);
            centreRef.current = false;
          }
        }
        // back to the middle, gently
        if (centreRef.current) {
          const [px, py] = panAt(fc, stream.length);
          const k = Math.exp(-dt * 6);
          fc.wx = px * k;
          fc.wy = py * k;
          fc.panZ = fc.z;
          if (Math.hypot(fc.wx, fc.wy) < 1e-3) {
            fc.wx = fc.wy = 0;
            centreRef.current = false;
          }
        }
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

      // what is in front of you, and whether you are still with it: the core turns it into moves
      const here = flying ? focusOf(stream, fc.z, closed) : null;
      hereRef.current = here;
      // back on the Slate, you are among its groups again; deep in one (however you got there), inside it
      // (only once landed: on the way somewhere, what you pass does not decide where you are)
      if (fc.target === null && !fc.hop) {
        if (here?.depth === 0) insideRef.current = null;
        else if (here && here.depth > 1) insideRef.current = groupOf(here);
      }
      core.frame(here, !!here && !fc.hop && !fc.held, nowMs);

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
      // the web: plucks on their rhythm (quiet while sound plays, while you read, or while a panel is open)
      if (flying) {
        const nowSec = nowMs / 1000;
        const reading = !!here?.node.artifact && nowMs - landedAtRef.current < 8000;
        const hushed = !!playingRef.current || reading || uiBusyRef.current;
        const fresh: Pluck[] = [];
        for (const f of foodRef.current) {
          const i = stream.byId.get(f.id);
          if (i === undefined) continue;
          const t = lastPluck(f.id, foundAtRef.current.get(f.id) ?? nowSec, nowSec);
          if (t === undefined || t <= (lastPluckRef.current.get(f.id) ?? -1)) continue;
          lastPluckRef.current.set(f.id, t);
          if (hushed) continue;
          let d = wrapDelta(stream.stations[i].z, fc.z, stream.length);
          if (d < 0) d += stream.length;
          fresh.push({ id: f.id, z: fc.z + d, t0: t, a: f.strength, rose: f.rose });
        }
        plucksRef.current = admitPlucks([...plucksRef.current, ...fresh], nowSec);
        echoesRef.current = echoesRef.current.filter((p) => nowSec - p.t0 < 3);
        // caught up: once everything that moved has been reached, the tunnel breathes out and goes still
        const calmTo = !foodRef.current.length && hadFoodRef.current ? 0.2 : 1;
        calmRef.current += (calmTo - calmRef.current) * (1 - Math.exp(-dt / 1));
      }
      // setting off: what lies ahead is readied, and a song begins as you come to it
      if (flying && fc.hops !== seenHopsRef.current && fc.hop) {
        seenHopsRef.current = fc.hops;
        // a fall reached the end of a fork and turned back: pressure, anonymous, once a session
        if (fc.hop.kind === 'back' && here) {
          const forkAncestor = here.path.find((n) => n.id.startsWith('fork/'));
          if (forkAncestor && forkAncestor.id !== here.node.id) {
            const nextZ = stepFocus(stream, here.z, 1, closed);
            const nextStation = nextZ === null ? null : focusOf(stream, nextZ, closed);
            const stillInside = nextStation?.path.some((n) => n.id === forkAncestor!.id);
            if (!stillInside) core.move({ kind: 'turnBack', from: forkAncestor });
          }
        }
        // (how long since the hop before: a song begins on the way only outside a quick run)
        const before = prevHopAtRef.current;
        prevHopAtRef.current = nowMs;
        const to = focusOf(stream, fc.hop.to, closed);
        const at = stream.stations.indexOf(to);
        for (const k of [0, 1, 2, -1]) {
          const s2 = stream.stations[(at + k + stream.stations.length) % stream.stations.length];
          for (const m of s2?.node.media ?? []) if (m.kind === 'video') getVideo(m.src, m.webm);
        }
        if (
          autoplayRef.current &&
          fc.hop.kind !== 'skim' &&
          nowMs - before > 900 &&
          hasMedia(to.node, 'audio') &&
          playingRef.current?.path[playingRef.current.path.length - 1]?.id !== to.node.id
        ) {
          hereSinceRef.current = { id: to.node.id, t: nowMs, tried: true, visited: false };
          toggleSong(to.path, true);
        }
      }
      // landing: the line under it writes itself, and (films heard) its film speaks once you stop hopping
      if (fc.landed !== seenLandedRef.current) {
        seenLandedRef.current = fc.landed;
        landedAtRef.current = nowMs;
        hearNextRef.current = filmsHeard() ? (here?.node.id ?? null) : null;
      }
      if (hearNextRef.current && !fc.hop && nowMs - lastHopAtRef.current > 450 && here?.node.id === hearNextRef.current) {
        hearNextRef.current = null;
        const film = here.node.media?.find((m) => m.kind === 'video');
        if (film && film.kind === 'video' && hearFilm(film.src, film.webm)) {
          hereSinceRef.current.tried = true;
          const a = audioRef.current;
          if (a && playingRef.current) {
            a.el.pause();
            playingRef.current = null;
            setPlayingId(null);
          }
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
        // (after a landing it comes quickly: a third of a second, then the line writes itself)
        const sinceLanding = (nowMs - landedAtRef.current) / 1000;
        const landedStill = landedAtRef.current > 0 && here ? smoothstep(0.35, 0.55, sinceLanding) : 0;
        const still =
          fc.target !== null || fc.held || fc.hop
            ? 0
            : reducedQuery.matches
              ? Number(fc.idle > 1.6 || landedStill > 0.5)
              : Math.max(landedStill, smoothstep(1.6, 3, fc.idle)) * (1 - smoothstep(0.15, 0.4, Math.abs(fc.shown)));
        // the line writes itself at a reading pace after a landing
        const written = reducedQuery.matches || landedAtRef.current === 0 ? Infinity : Math.max(0, (sinceLanding - 0.35) * 45);
        const fstate: Parameters<typeof renderFlight>[3] = {
          frames: framesRef.current,
          closeness: (s) => (s.depth === 0 ? 1 : lensRef.current.closeness(s.path[1])),
          hidden: skip,
          here: here?.node.id,
          still,
          compass: undefined,
          phases: phasesRef.current,
          resonance: resonanceRef.current,
          presence: presenceRef.current,
          leaned: leanedRef.current,
          steer: { on: steer.on, facing: steer.well },
          // at a branch, the other paths beside this one: only ones this viewer may actually enter
          edges: edgePaths(here, (n, p) => {
            const idx = stream.byId.get(n.id);
            if (idx === undefined || skip(stream.stations[idx])) return false;
            return n.disclosure <= lensRef.current.closeness(p[1]);
          }),
          dt,
          web: {
            plucks: echoesRef.current.length ? [...plucksRef.current, ...echoesRef.current] : plucksRef.current,
            now: nowMs / 1000,
            food: foodSetRef.current,
            calm: calmRef.current,
          },
          lineFor: (s) => {
            // quiet, felt, never a number: many separate falls have reached this same wall lately
            const gathering = s.node.id.startsWith('fork/') && (pressureRef.current.get(s.node.id) ?? 0) > GATHERING;
            const line = gathering
              ? 'something is gathering here.'
              : hasMedia(s.node, 'audio') && soundBlockedRef.current && !playingRef.current
                ? 'tap to hear it'
                : s.depth === 1 && s.gate && insideRef.current !== s.node.id
                  ? `${s.node.line ? `${s.node.line} ` : ''}tap to go in.`
                  : s.node.line;
            return line && written < line.length ? line.slice(0, Math.floor(written)) : line;
          },
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
        // the needle twitches as a pluck reaches you
        const twitch = plucksRef.current.length ? trembleAt(plucksRef.current, fc.z, fc.z, nowMs / 1000).T * 25 : 0;
        needleRef.current.setAttribute('transform', `rotate(${(comp.roll * 180) / Math.PI + twitch} 23 23)`);
        const fd = foodDotRef.current;
        if (fd) {
          fd.style.opacity = comp.food === null ? '0' : '1';
          if (comp.food !== null) {
            fd.setAttribute('cx', String(23 + Math.cos(comp.food) * 17));
            fd.setAttribute('cy', String(23 + Math.sin(comp.food) * 17));
          }
        }
        const nd = nextDotRef.current;
        if (nd) {
          nd.style.opacity = comp.next === null ? '0' : '1';
          if (comp.next !== null) {
            nd.setAttribute('cx', String(23 + Math.cos(comp.next) * 13));
            nd.setAttribute('cy', String(23 + Math.sin(comp.next) * 13));
          }
        }
        // where the view has been slid to, on screen: the hollow ring leaves the middle
        const yd = youRef.current;
        const cm = camRef.current;
        if (yd && cm) {
          const [px, py] = panAt(fc, stream.length);
          const rc = Math.cos(comp.roll);
          const rs = Math.sin(comp.roll);
          const sx = px * rc - py * rs;
          const sy = px * rs + py * rc;
          const d = Math.hypot(sx, sy);
          const r = d < 1e-4 ? 0 : Math.min(1, d / 1.2) * 14;
          yd.setAttribute('cx', String(23 + (d ? (sx / d) * r : 0)));
          yd.setAttribute('cy', String(23 + (d ? (sy / d) * r : 0)));
          yd.style.opacity = r > 0.5 ? '1' : '0';
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
  }, [access, serif, hiddenStation, toggleSong, eatFood]);

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
        // scrolling hops: a wheel's notch, or one trackpad swipe (its gliding tail never), is one thing
        const fc = flightCamRef.current;
        const stream = streamRef.current;
        if (!stream) return;
        fc.idle = 0;
        const d = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
        const wh = wheelHopsRef.current;
        const dir = wh.push(e.ctrlKey ? -d * 3 : d, e.timeStamp || performance.now(), e.deltaMode !== 0);
        // a scroll that reaches something waiting stops there; a new scroll (after a pause) goes on
        if (dir && wh.gesture === foodGestureRef.current) return;
        if (dir) {
          const z = stepFocus(stream, hopBase(fc), dir, skipRef.current);
          if (z !== null) {
            hopFlight(z, dir < 0 ? 'back' : 'step');
            fc.dir = dir;
            if (foodSetRef.current.has(focusOf(stream, z, skipRef.current).node.id)) foodGestureRef.current = wh.gesture;
          }
        }
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
  }, [access, dismissHint, hopFlight]);

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

  /** A tap (or, steering, a click) at a point: go to what is there, knock, hear, or begin something. */
  const tapAt = (x: number, y: number, only?: Hit | null) => {
    const now = performance.now();
    const lastTap = lastTapRef.current;
    const burst = now - lastTap.t < 380 && Math.hypot(lastTap.x - x, lastTap.y - y) < 28;
    const taps = burst ? lastTap.n + 1 : 1;
    const isDouble = taps === 2;
    lastTapRef.current = { t: now, x, y, n: taps };

    const hit = only !== undefined ? only : (hoverRef.current ?? hitsRef.current.find((h) => Math.hypot(h.x - x, h.y - y) < h.r) ?? null);
    // touching something that was waiting is finding it
    if (hit?.kind === 'node') eatFood(hit.node.id);
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
      choose(hit.path);
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
      else {
        choose(hit.path);
        flyTo(hit.path);
      }
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
      goTo(hit.path, hit.sealed ? 0.12 : 0.53);
      return;
    }
    if (isDouble) openComposerAt(x, y);
  };

  // steering begins when the page holds the pointer, and ends when it lets go (Esc, or leaving the tab)
  useEffect(() => {
    const onChange = () => {
      const s = steerRef.current;
      const on = !!canvasRef.current && document.pointerLockElement === canvasRef.current;
      if (s.on && !on) s.endedAt = performance.now();
      s.on = on;
      s.x = 0;
      s.y = 0;
      if (!on) pointerRef.current.inside = false;
      setSteering(on);
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);
  const startSteering = () => {
    const c = canvasRef.current;
    if (!c) return;
    dismissHint();
    setNotice('move to steer. esc to stop');
    try {
      void Promise.resolve(c.requestPointerLock()).catch(() => setNotice('steering is not available here'));
    } catch {
      setNotice('steering is not available here');
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // steering: the button acts on release, at the middle
    if (steerRef.current.on) return;
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
    let run: number[] = [];
    let u0 = 0;
    let resume: number | null = null;
    if (modeRef.current === 'flight') {
      // a touch catches the flight where it is, and the finger holds it: each stretch of finger is one thing
      const fc = flightCamRef.current;
      const stream = streamRef.current;
      resume = fc.hop ? fc.hop.to : null;
      fc.hop = null;
      fc.held = true;
      fc.target = null;
      fc.v = 0;
      fc.idle = 0;
      if (stream) {
        const [back, ahead] = focusAround(stream, fc.z, skipRef.current);
        const first = back ?? ahead;
        if (first !== null) {
          const behind: number[] = [];
          let z: number | null = first;
          for (let i = 0; i < 6 && z !== null; i++) {
            z = stepFocus(stream, z, -1, skipRef.current);
            if (z !== null) behind.unshift(z);
          }
          const on: number[] = [first];
          z = first;
          for (let i = 0; i < 12 && z !== null; i++) {
            z = stepFocus(stream, z, 1, skipRef.current);
            if (z !== null) on.push(z);
          }
          run = [...behind, ...on];
          u0 = unitAlong(run, fc.z);
        }
      }
    }
    velocityRef.current.reset();
    velocityRef.current.add(performance.now(), e.clientY);
    // holding still on empty paper plucks the web: whatever is waiting answers
    window.clearTimeout(holdRef.current.timer);
    holdRef.current.consumed = false;
    if (modeRef.current === 'flight' && pointersRef.current.size === 1) {
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const onSomething = hitsRef.current.some((h) => Math.hypot(h.x - px, h.y - py) < h.r);
      if (!onSomething) {
        holdRef.current.timer = window.setTimeout(() => {
          if (dragRef.current.active && dragRef.current.moved < 6) {
            holdRef.current.consumed = true;
            pluckWeb();
          }
        }, 450);
      }
    }
    dragRef.current = { active: true, moved: 0, lastT: performance.now(), axis: null, tx: 0, ty: 0, run, u0, resume };
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    dismissHint();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const steer = steerRef.current;
    if (steer.on) {
      // the hand pushes the heading about, within reach: a third of the screen is all the way
      const reach = 0.35 * Math.min(camRef.current?.w ?? 800, camRef.current?.h ?? 800);
      steer.x += e.movementX / reach;
      steer.y += e.movementY / reach;
      const m = Math.hypot(steer.x, steer.y);
      if (m > 1) {
        steer.x /= m;
        steer.y /= m;
      }
      handRef.current = performance.now();
      return;
    }
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
          // a sudden snap of the fingers never throws you further than a thing or two: it stays a walk, not a leap
          const step = Math.max(-1.5, Math.min(1.5, Math.log(d / pinchRef.current.d) * 1.8));
          fc.z += step;
          if (Math.abs(step) > 0.002) fc.dir = Math.sign(step);
        }
        // and two fingers moving together slide the view, which stays where they leave it
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const stream = streamRef.current;
        if (stream) panBy(fc, stream, mx - pinchRef.current.x, my - pinchRef.current.y, cam.w, cam.h);
        pinchRef.current = { d, x: mx, y: my };
        dragRef.current.moved += 20;
        return;
      }
      // up is forward, like scrolling; a drag that begins sideways slides the view
      // instead (any way, then), and it stays where it is left, for reading what runs off
      const dx = x - prev.x;
      const dy = y - prev.y;
      const dr = dragRef.current;
      dr.moved += Math.abs(dx) + Math.abs(dy);
      dr.tx += dx;
      dr.ty += dy;
      let travel = dy;
      if (!dr.axis && Math.hypot(dr.tx, dr.ty) > 8) {
        travel = dr.ty;
        dr.axis = Math.abs(dr.tx) > Math.abs(dr.ty) ? 'slide' : 'travel';
        // the part of the gesture that decided it counts too
        if (dr.axis === 'slide') {
          const stream = streamRef.current;
          if (stream) panBy(fc, stream, dr.tx - dx, dr.ty - dy, cam.w, cam.h);
        }
      }
      if (dr.axis === 'slide') {
        const stream = streamRef.current;
        if (stream) panBy(fc, stream, dx, dy, cam.w, cam.h);
        centreRef.current = false;
        fc.v = 0;
        dr.lastT = performance.now();
        return;
      }
      if (dr.axis !== 'travel') return;
      velocityRef.current.add(performance.now(), e.clientY);
      dr.lastT = performance.now();
      if (dr.run.length > 1) {
        // the finger holds the flight: up the screen is forward, one thing per stretch
        const u = dr.u0 - dr.ty / pxPerStop(cam.h);
        const z = zAlong(dr.run, u);
        if (Math.abs(z - fc.z) > 1e-6) fc.dir = Math.sign(z - fc.z);
        fc.z = z;
      } else {
        fc.z += (-travel / M) * SWIPE;
      }
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
    if (steerRef.current.on) {
      const c = camRef.current;
      // steering, a click is about the thing you are on, never whatever happens to lie far behind it
      const on = hereRef.current;
      const hit = hitsRef.current.find((h) => h.kind === 'node' && h.node.id === on?.node.id) ?? null;
      // a group on the Slate is gone into
      if (!hit && on?.depth === 1 && on.gate && insideRef.current !== on.node.id) goTo(on.path);
      else if (c) tapAt(c.w / 2, c.h * 0.47, hit);
      return;
    }
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
    if (pointersRef.current.size > 0) {
      // a pinch became one finger: the drag carries on from where the camera now is
      const dr = dragRef.current;
      if (modeRef.current === 'flight' && dr.run.length > 1) {
        dr.u0 = unitAlong(dr.run, flightCamRef.current.z);
        dr.tx = 0;
        dr.ty = 0;
        dr.axis = null;
        velocityRef.current.reset();
      }
      return;
    }
    const moved = dragRef.current.moved;
    dragRef.current.active = false;
    const flying = modeRef.current === 'flight';
    const fc = flightCamRef.current;
    if (flying) {
      // let go: a swipe that meant it hops on (a fling, several things); one that did not, back
      fc.held = false;
      fc.idle = 0;
      const dr = dragRef.current;
      fc.v = 0;
      const stream = streamRef.current;
      if (stream && dr.axis === 'travel' && dr.run.length > 1) {
        // let go: it lands on the thing the finger carried it to; a quick flick, one further than it began
        const per = pxPerStop(camRef.current?.h ?? 800);
        const vpx = velocityRef.current.velocity(performance.now());
        const u = dr.u0 - dr.ty / per;
        const idx = landingIndex(dr.u0, u, vpx, dr.ty, dr.run.length);
        const to = dr.run[idx];
        // the hand's speed carries into the hop (in camera units per second)
        const lo = Math.max(0, Math.min(dr.run.length - 2, Math.floor(u)));
        const spacing = Math.abs(dr.run[lo + 1] - dr.run[lo]) || 1;
        hopFlight(to, idx < dr.u0 ? 'back' : 'touch', (-vpx / per) * spacing);
      } else if (stream && dr.axis === 'travel') {
        settle(fc, stream, skipRef.current);
      } else if (stream && moved <= 6 && dr.resume !== null) {
        // a tap mid-hop that touches nothing lets the hop carry on
        hopTo(fc, dr.resume);
      } else if (stream && !fc.hop) {
        settle(fc, stream, skipRef.current);
      }
    }
    if (performance.now() - dragRef.current.lastT > 80) velRef.current = { x: 0, y: 0 };
    window.clearTimeout(holdRef.current.timer);
    if (moved > 6) return;
    velRef.current = { x: 0, y: 0 };
    if (flying) fc.v = 0;
    // the release after plucking the web is only a release
    if (holdRef.current.consumed) {
      holdRef.current.consumed = false;
      return;
    }
    tapAt(x, y);
  };

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (composer) return;
      // the Esc that lets go of steering is only that
      if (e.key === 'Escape' && (document.pointerLockElement || performance.now() - steerRef.current.endedAt < 400)) return;
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
          // a held key skims, at most a thing every 120ms, and stops at what is waiting
          const now = performance.now();
          if (e.repeat && now - keyHopAtRef.current < 120) return;
          if (e.repeat && foodSetRef.current.has(focusOf(stream, hopBase(fc), skipRef.current).node.id)) return;
          keyHopAtRef.current = now;
          const z = stepFocus(stream, hopBase(fc), dir, skipRef.current);
          if (z !== null) {
            hopFlight(z, e.repeat ? 'skim' : dir < 0 ? 'back' : 'step');
            fc.dir = dir;
          }
        };
        const on = hereRef.current;
        if (e.key === ' ') pluckWeb();
        else if (e.key === 'Enter' && on?.depth === 1 && insideRef.current !== on.node.id) {
          // on the Slate, at a group: go into it
          goTo(on.path);
        }
        else if (e.key === 'n') goToFood();
        else if (['ArrowDown', 'ArrowRight', 'PageDown', '+', '=', 'j'].includes(e.key)) go(1);
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
  }, [composer, dismissHint, flyTo, focusPath, goTo, hiddenStation, hopFlight, goToFood, pluckWeb]);

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
    if (c.mode === 'story' || c.mode === 'spark' || c.mode === 'answer') {
      // a story is told to everyone without a name; an idea it sparks is yours, private until shared;
      // an answer to today's word is shared with the others
      const payload = c.mode === 'story' ? { kind: 'story', body: value } : c.mode === 'answer' ? { title: value, answer: true } : { title: value, from: c.target };
      fetch('/api/shadows', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        .then(async (res) => {
          const d = (await res.json().catch(() => ({}))) as { shadow?: Posted; error?: string };
          if (!res.ok || !d.shadow) {
            setNotice((d.error ?? 'that could not be kept').toLowerCase());
            return;
          }
          await loadPosted();
          const world = worldRef.current;
          const ringId = c.mode === 'story' ? 'stories' : c.mode === 'answer' ? 'today' : 'yours';
          const ring = world?.children.find((n) => n.id === ringId);
          const node = ring?.children.find((n) => n.id === `p/${d.shadow!.id}`);
          if (world && ring && node) flyTo([world, ring, node]);
          if (c.mode === 'spark') ripple(`p/${c.target}`);
          setNotice(
            c.mode === 'story'
              ? 'told, and no one will know it was you'
              : c.mode === 'answer'
                ? 'your answer is with the others'
                : 'yours now, only you can see it until you share it'
          );
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
    } else if (c.mode === 'fork' && c.shadowId && me?.user) {
      // opening one is always signed-in and server-kept: others must be able to find it too
      fetch('/api/forks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hostShadowId: c.shadowId, title: value, postAccess: 'invite' }),
      })
        .then(async (res) => {
          const d = (await res.json().catch(() => ({}))) as { fork?: PostedFork; error?: string };
          if (!res.ok || !d.fork) {
            setNotice((d.error ?? 'that could not be opened').toLowerCase());
            return;
          }
          await loadPosted();
          if (d.fork.inviteLink) {
            const link = `${window.location.origin}/slate?fork=${encodeURIComponent(d.fork.id)}&invite=${encodeURIComponent(d.fork.inviteLink)}`;
            setForkInvite({ forkId: d.fork.id, title: d.fork.title, link });
          }
          if (c.fromNoticeForkId) {
            void fetch(`/api/forks/${encodeURIComponent(c.fromNoticeForkId)}/notice`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ event: 'fork_created', createdForkId: d.fork.id }),
            }).catch(() => undefined);
          }
        })
        .catch(() => setNotice('that could not be opened'));
    } else if (c.mode === 'inFork' && c.forkId && me?.user) {
      fetch('/api/shadows', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: value, forkId: c.forkId }) })
        .then(async (res) => {
          const d = (await res.json().catch(() => ({}))) as { shadow?: Posted; error?: string };
          if (!res.ok || !d.shadow) {
            setNotice((d.error ?? 'that could not be kept').toLowerCase());
            return;
          }
          await loadPosted();
          const world = worldRef.current;
          const path = world && findPath(world, `p/${d.shadow.id}`);
          if (path) flyTo(path);
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

  /** Closes (takes no new posts) or reopens a fork of yours; what is inside it is never touched. */
  const toggleFork = (forkId: string, closed: boolean) => {
    fetch(`/api/forks/${encodeURIComponent(forkId)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ closed }),
    })
      .then(async (res) => {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setNotice((d.error ?? 'that could not be changed').toLowerCase());
          return;
        }
        await loadPosted();
        setNotice(closed ? 'closed: what is inside it stays' : 'open again');
      })
      .catch(() => setNotice('that could not be changed'));
  };

  /** Its invite link, copied for sending: whoever opens it may post inside, once they sign in. */
  const copyForkInvite = async (f: PostedFork) => {
    if (!f.inviteLink) return;
    const link = `${window.location.origin}/slate?fork=${encodeURIComponent(f.id)}&invite=${encodeURIComponent(f.inviteLink)}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice('invite link copied');
    } catch {
      setForkInvite({ forkId: f.id, title: f.title, link });
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
      .find((n) => !n.void && !n.portal && !n.ownedBy && !n.id.startsWith('local/') && n.id !== 'throwaways' && !n.id.startsWith('archive/') && !n.id.startsWith('p/') && n.id !== 'people' && n.id !== 'yours' && n.id !== 'stories' && n.id !== 'today' && n.id !== 'sketchbook' && n.id !== 'hex-lab' && n.id !== 'linked' && !n.id.startsWith('k/') && !n.id.startsWith('maker/')) ?? null;
  // an idea given away is never followed by an ask for money, nor is a song while it plays
  // nothing given away (songs, starters, throwaways) is ever followed by an ask
  const asking = supportTarget && !path.some((n) => n.free) && playingId !== current?.id ? supportTarget : null;
  const throwaway = current?.id.startsWith('archive/') ? current : null;
  const taken = throwaway ? localList.some((l) => l.from === throwaway.id) : false;
  // a copy taken from his throwaways is the visitor's to keep, but not theirs to prove
  const takenCopy = ownedHereFrom(localList, current);
  const top = path[1];
  // what anyone may see can be sent: nothing on this device only, nothing private, nothing sealed
  const shareable =
    !!current &&
    path.length > 1 &&
    !path.some((n) => n.id.startsWith('local/') || n.id === 'sketchbook' || n.disclosure > 0) &&
    (!current.id.startsWith('p/') || !!posted.find((q) => `p/${q.id}` === current.id && (q.public || q.visibility === 'unlisted') && !q.hidden));
  const postedHere = current?.id.startsWith('p/') ? posted.find((q) => `p/${q.id}` === current.id) ?? null : null;
  // Rabi noticing: whenever a maker looks at a Shadow of their own, ask once per fork whether
  // real pressure has gathered at it. Only ever tells them; the fork itself is never touched here.
  useEffect(() => {
    for (const f of postedHere?.mine ? (postedHere.forks ?? []) : []) {
      if (!f.mine || noticeCheckedRef.current.has(f.id)) continue;
      noticeCheckedRef.current.add(f.id);
      fetch(`/api/forks/${encodeURIComponent(f.id)}/notice`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { show?: boolean } | null) => {
          if (d?.show) setRabiNotice({ forkId: f.id, title: f.title });
        })
        .catch(() => undefined);
    }
  }, [postedHere?.id, postedHere?.mine, postedHere?.forks]);
  const actOnNotice = (action: 'open_path' | 'leave' | 'watch') => {
    const notice = rabiNotice;
    if (!notice) return;
    setRabiNotice(null);
    // clicking "open a path" only means "take me to the composer": it is not counted as
    // agreement with Rabi until a fork is actually created from there (see submitComposer)
    void fetch(`/api/forks/${encodeURIComponent(notice.forkId)}/notice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(() => undefined);
    if (action !== 'open_path') return;
    // the current end of that fork: opening a path starts a new fork from there
    const world = worldRef.current;
    const forkPath = world && findPath(world, `fork/${notice.forkId}`);
    const forkStation = forkPath?.[forkPath.length - 1];
    const last = forkStation?.children[forkStation.children.length - 1];
    if (!last) return;
    const path = findPath(world!, last.id);
    if (path) flyTo(path);
    const cam = camRef.current;
    if (cam && last.id.startsWith('p/')) {
      setComposer({ mode: 'fork', x: cam.w / 2 - 140, y: cam.h - 150, lx: 0, ly: 0, shadowId: last.id.slice(2), fromNoticeForkId: notice.forkId });
      void fetch(`/api/forks/${encodeURIComponent(notice.forkId)}/notice`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'composer_opened' }),
      }).catch(() => undefined);
    }
  };
  const widen = (e: React.MouseEvent<HTMLButtonElement>) => {
    const v = e.currentTarget.dataset.v;
    if (postedHere && (v === 'private' || v === 'unlisted' || v === 'public')) changePosted(postedHere.id, { visibility: v });
  };
  const ownedHere = current ? localIds(current) : null;
  const isFollowed = top ? followed.has(top.id) : false;
  const nearby = current ? (topologyOf(current), current.children) : [];
  const p = top ? closenessFor(top, followed) : 1;
  // the path you deliberately chose here before, if this is a branch you have leaned at
  const [leanedChild, setLeanedChild] = useState<string | null>(null);
  const parentHere = path.length >= 2 ? path[path.length - 2] : null;
  useEffect(() => {
    const lc = current && current.children.length >= 2 ? leanedChildOf(webMemRef.current, current.id) : null;
    setLeanedChild(lc);
    // and, standing on one of several paths, whichever of them you chose here before (so its edge is marked too)
    const pc = parentHere && parentHere.children.length >= 2 ? leanedChildOf(webMemRef.current, parentHere.id) : null;
    leanedRef.current = new Set([lc, pc].filter((x): x is string => !!x));
  }, [current, parentHere]);

  return (
    <div className={styles.field} ref={rootRef} data-night={night ? '' : undefined}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label={
          mode === 'flight'
            ? 'TwinThink Slate. Scroll, or swipe up, to move through ideas; tap one to go to it.'
            : 'TwinThink Slate. Scroll to move closer to an idea, drag to wander.'
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
            // the system took the touch (a back swipe, a notification): let the flight go, onto something
            const fc = flightCamRef.current;
            fc.held = false;
            fc.v = 0;
            fc.idle = 0;
            const stream = streamRef.current;
            if (stream && modeRef.current === 'flight') settle(fc, stream, skipRef.current);
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
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            joyRef.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false };
          }}
          onPointerMove={(e) => {
            const j = joyRef.current;
            if (!j || j.id !== e.pointerId) return;
            j.dx = e.clientX - j.x0;
            j.dy = e.clientY - j.y0;
            if (Math.hypot(j.dx, j.dy) > 5) j.moved = true;
          }}
          onPointerUp={(e) => {
            const j = joyRef.current;
            joyRef.current = null;
            if (!j || j.id !== e.pointerId || j.moved) return;
            // a tap on (or right by) the rose dot goes to what is waiting
            const fd = foodDotRef.current;
            const r = e.currentTarget.getBoundingClientRect();
            const onDot =
              !!fd &&
              fd.style.opacity === '1' &&
              Math.hypot(e.clientX - r.left - Number(fd.getAttribute('cx')), e.clientY - r.top - Number(fd.getAttribute('cy'))) < 11;
            tapCompass(onDot);
          }}
          onPointerCancel={() => {
            joyRef.current = null;
          }}
          onClick={(e) => {
            // taps are handled on release; this is the keyboard's Enter or Space
            if (e.detail === 0) tapCompass();
          }}
          onKeyDown={(e) => {
            const d: Record<string, [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
            const v = d[e.key];
            const c = camRef.current;
            const stream = streamRef.current;
            if (!v || !c || !stream) return;
            e.preventDefault();
            e.stopPropagation();
            panBy(flightCamRef.current, stream, v[0] * 60, v[1] * 60, c.w, c.h);
            centreRef.current = false;
          }}
          aria-label="Compass: which way is up, where the next thing is, and where you have slid the view. Hold and push it, or use the arrow keys, to slide any way; tap it to come back to the middle, or, in the middle, to stop or start the turning."
        >
          <svg viewBox="0 0 46 46" width="46" height="46" aria-hidden>
            <circle cx="23" cy="23" r="20" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="1 3" />
            <g ref={needleRef}>
              <path d="M23 6 L26 23 L23 21 L20 23 Z" fill="currentColor" fillOpacity="0.75" />
              <path d="M23 40 L26 23 L23 25 L20 23 Z" fill="currentColor" fillOpacity="0.2" />
            </g>
            <circle ref={nextDotRef} cx="23" cy="10" r="2.2" fill="currentColor" fillOpacity="0.55" />
            <circle ref={foodDotRef} cx="23" cy="6" r="2.8" fill="rgb(var(--rose))" style={{ opacity: 0 }} />
            <circle ref={lapDotRef} cx="23" cy="3" r="1.8" fill="currentColor" />
            <circle ref={youRef} cx="23" cy="23" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0 }} />
          </svg>
        </button>
      )}

      {me?.user ? (
        <button type="button" className={styles.me} onClick={signOut} title="sign out">
          {me.user.name.split(' ')[0]}
        </button>
      ) : me?.enabled ? (
        <button type="button" className={styles.me} onClick={signIn}>
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
                {i === 0 ? 'slate' : n.portal ? 'the slate, again' : n.title ?? 'untitled'}
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
              <>
                <button type="button" className={styles.quiet} onClick={answerToday}>
                  today’s word: {wordFor()}
                </button>
                <button type="button" className={styles.quiet} onClick={tellStory}>
                  tell a story
                </button>
              </>
            )}
            <button type="button" className={styles.quiet} onClick={wander}>
              wander
            </button>
            <button type="button" className={styles.quiet} onClick={() => setGiving((g) => !g)}>
              support his work
            </button>
          </>
        )}
        {mode === 'flight' && canSteer && !steering && (
          <button type="button" className={styles.quiet} onClick={startSteering}>
            steer
          </button>
        )}
        {shareable && (
          <button type="button" className={styles.quiet} onClick={() => shareHere([...path])}>
            send it
          </button>
        )}
        {me?.user && !sharedFall && (
          <button type="button" className={styles.quiet} onClick={startSharedFall}>
            Fall with me
          </button>
        )}
        {sharedFall && !sharedFall.ended && (
          <button type="button" className={styles.quiet} onClick={leaveSharedFall}>
            {sharedFall.participants.length <= 1
              ? 'leave (waiting for them to join)'
              : `leave (falling with ${sharedFall.participants.find((p) => !p.mine)?.name ?? sharedFall.hostName})`}
          </button>
        )}
        {posting && me?.enabled && current && shareable && !current.id.startsWith('k/') && !postedHere?.mine && top?.id !== 'sketchbook' && (
          <button type="button" className={keeps.includes(current.id) ? styles.following : styles.quiet} onClick={() => toggleKeep(current.id)}>
            {keeps.includes(current.id) ? 'kept' : 'keep it'}
          </button>
        )}
        {current?.id.startsWith('k/') && (
          <>
            <button
              type="button"
              className={styles.quiet}
              onClick={() => {
                const world = worldRef.current;
                const p = world ? findPath(world, current.id.slice(2)) : null;
                if (p) flyTo(p);
              }}
            >
              go to it
            </button>
            <button type="button" className={styles.quiet} onClick={() => toggleKeep(current.id.slice(2))}>
              let it go from here
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
        {top?.id === 'today' && path.length === 2 && (
          <button type="button" className={styles.quiet} onClick={answerToday}>
            answer it
          </button>
        )}
        {top?.id === 'stories' && path.length === 2 && (
          <button type="button" className={styles.quiet} onClick={tellStory}>
            tell a story
          </button>
        )}
        {postedHere && !postedHere.mine && postedHere.public && (
          <button type="button" className={styles.quiet} onClick={() => sparkFrom(postedHere.id)}>
            {postedHere.kind === 'story' ? 'there’s an idea in this' : 'build on it'}
          </button>
        )}
        {postedHere?.mine && postedHere.kind !== 'story' && (postedHere.media?.length ?? 0) < 6 && (
          <>
            <button
              type="button"
              className={styles.quiet}
              onClick={() => {
                mediaForRef.current = postedHere.id;
                postPicRef.current?.click();
              }}
            >
              add a picture
            </button>
            {filmsOn && (
              <button
                type="button"
                className={styles.quiet}
                onClick={() => {
                  mediaForRef.current = postedHere.id;
                  postFilmRef.current?.click();
                }}
              >
                add a film
              </button>
            )}
          </>
        )}
        {postedHere?.mine && (
          <>
            {postedHere.kind !== 'story' &&
              // how far it goes, widened on purpose: only you, whoever has its link, everyone
              (['private', 'unlisted', 'public'] as const)
                .filter((v) => v !== (postedHere.visibility ?? (postedHere.public ? 'public' : 'private')))
                .map((v) => (
                  <button key={v} type="button" className={styles.quiet} data-v={v} onClick={widen}>
                    {v === 'public' ? 'share it with everyone' : v === 'unlisted' ? 'share it by link' : 'keep it to myself'}
                  </button>
                ))}
            <button type="button" className={styles.quiet} onClick={() => current && readNotes(current)}>
              notes
            </button>
            <button type="button" className={styles.quiet} onClick={() => changePosted(postedHere.id, 'remove')}>
              {postedHere.kind === 'story' ? 'take it back' : 'let it go'}
            </button>
            {postedHere.kind !== 'story' && (forkRoom?.room ?? 1) > 0 && (
              <button
                type="button"
                className={styles.quiet}
                onClick={() => {
                  const cam = camRef.current;
                  if (!cam) return;
                  setComposer({ mode: 'fork', x: cam.w / 2 - 140, y: cam.h - 150, lx: 0, ly: 0, shadowId: postedHere.id });
                }}
              >
                open a space here{forkRoom ? ` (room for ${forkRoom.room} more)` : ''}
              </button>
            )}
          </>
        )}
        {postedHere?.forks?.map(
          (f) =>
            f.mine && (
              <span key={f.id} className={styles.quiet}>
                <button type="button" className={styles.quiet} onClick={() => toggleFork(f.id, !f.closed)}>
                  {f.closed ? `reopen “${f.title}”` : `close “${f.title}”`}
                </button>
                {f.postAccess === 'invite' && !f.closed && (
                  <button type="button" className={styles.quiet} onClick={() => copyForkInvite(f)}>
                    copy its invite link
                  </button>
                )}
              </span>
            )
        )}
        {postedHere?.forks?.map(
          (f) =>
            f.canPost && (
              <button
                key={`post-${f.id}`}
                type="button"
                className={styles.quiet}
                onClick={() => {
                  const cam = camRef.current;
                  if (!cam) return;
                  setComposer({ mode: 'inFork', x: cam.w / 2 - 140, y: cam.h - 150, lx: 0, ly: 0, forkId: f.id });
                }}
              >
                post inside “{f.title}”
              </button>
            )
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
        ref={postPicRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          const id = mediaForRef.current;
          if (f && id) void addPostPicture(id, f);
          e.currentTarget.value = '';
        }}
      />
      <input
        ref={postFilmRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          const id = mediaForRef.current;
          if (f && id) void addPostFilm(id, f);
          e.currentTarget.value = '';
        }}
      />
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

      {forkInvite && (
        <div className={styles.give}>
          <div className={styles.giveFor}>send this to invite someone into “{forkInvite.title}”</div>
          <input
            type="text"
            readOnly
            value={forkInvite.link}
            className={styles.quiet}
            onFocus={(e) => e.currentTarget.select()}
            style={{ width: '100%', background: 'none', border: 'none', font: 'inherit' }}
          />
          <button
            type="button"
            className={styles.quiet}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(forkInvite.link);
                setNotice('invite link copied');
              } catch {
                // the link is already shown to select and copy by hand
              }
            }}
          >
            copy
          </button>
          <button type="button" className={styles.quiet} onClick={() => setForkInvite(null)}>
            done
          </button>
        </div>
      )}

      {sharedFall && !sharedFall.ended && sharedFall.hosting && sharedFall.participants.length <= 1 && sharedFall.inviteLink && (
        <div className={styles.give}>
          <div className={styles.giveFor}>send this to Fall with someone</div>
          <input
            type="text"
            readOnly
            value={`${window.location.origin}/slate?sharedFall=${encodeURIComponent(sharedFall.id)}&invite=${encodeURIComponent(sharedFall.inviteLink)}`}
            className={styles.quiet}
            onFocus={(e) => e.currentTarget.select()}
            style={{ width: '100%', background: 'none', border: 'none', font: 'inherit' }}
          />
          <button
            type="button"
            className={styles.quiet}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/slate?sharedFall=${encodeURIComponent(sharedFall.id)}&invite=${encodeURIComponent(sharedFall.inviteLink!)}`
                );
                setNotice('invite link copied');
              } catch {
                // the link is already shown to select and copy by hand
              }
            }}
          >
            copy
          </button>
          <button type="button" className={styles.quiet} onClick={leaveSharedFall}>
            never mind
          </button>
        </div>
      )}

      {rabiNotice && (
        <div className={styles.give}>
          <div className={styles.giveFor}>a path may be wanted here</div>
          <p className={styles.quiet}>Several recent Falls reached “{rabiNotice.title}” and continued elsewhere.</p>
          <details>
            <summary className={styles.quiet}>why am I seeing this?</summary>
            <p className={styles.quiet}>
              many different visits, not one person returning, have reached the end of this fork lately and turned
              back rather than staying. that is the whole of it: nothing changes here unless you decide something.
            </p>
          </details>
          <button type="button" className={styles.quiet} onClick={() => actOnNotice('open_path')} title="look into it, only actually making a fork counts as agreeing">
            open a path
          </button>
          <button type="button" className={styles.quiet} onClick={() => actOnNotice('leave')} title="I mean this dead end, don't ask again unless it grows much stronger">
            leave it
          </button>
          <button type="button" className={styles.quiet} onClick={() => actOnNotice('watch')} title="don't change anything, tell me if this becomes meaningfully stronger">
            watch
          </button>
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
                        : composer.mode === 'answer'
                          ? `something made of “${wordFor()}”`
                          : composer.mode === 'spark'
                          ? posted.find((q) => q.id === composer.target)?.kind === 'story'
                            ? 'what could be made from it?'
                            : 'what would you make of it?'
                          : composer.mode === 'fork'
                            ? 'what belongs there?'
                            : composer.mode === 'inFork'
                              ? 'what are you leaving here?'
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
                : composer.mode === 'answer'
                  ? 'enter to answer · shared with everyone, under your first name'
                  : composer.mode === 'spark'
                  ? 'enter to keep · yours, private until you share it'
                  : composer.mode === 'fork'
                    ? 'enter to open it · invite-only until you share it wider'
                    : composer.mode === 'inFork'
                      ? 'enter to leave it here · private until you share it'
                      : 'enter to keep'}
          </span>
        </form>
      )}

      {!hinted && path.length <= 1 && (
        <div className={styles.hint}>{mode === 'flight' ? 'scroll, or swipe up' : 'scroll toward anything'}</div>
      )}

      <nav className={styles.srNav} aria-label="Ideas here">
        <p aria-live="polite">
          {current ? (path.length > 1 ? `Inside ${current.title ?? 'an untitled idea'}.` : 'On the Slate.') : ''}
        </p>
        <ul>
          {nearby
            .filter((c) => path.length <= 1 || c.disclosure <= p + SEAL_MARGIN)
            .map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    choose([...path, c]);
                    flyTo([...path, c]);
                  }}
                >
                  {c.disclosure > p && path.length > 1 ? 'something not open yet' : c.title ?? 'untitled'}
                  {c.id === leanedChild ? ' (you leaned here last time)' : ''}
                </button>
              </li>
            ))}
        </ul>
      </nav>

    </div>
  );
}
