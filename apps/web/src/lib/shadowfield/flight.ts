// The flight: the Canvas as one endless stream that you move through in depth.
//
// Scrolling does not move a page past you; it moves you. Every idea, song,
// object and thought is a station on a track that runs away from the viewer.
// Ahead, things are small and gathered near the vanishing point; moving toward
// them they grow, resolve into what they are, and slide out past the edges of
// the screen, behind you.
//
// The track walks the Canvas's own structure: an idea, then everything inside
// it, then the next idea. An idea that holds others is a ring you pass through.
// Newest comes first, so moving forward is also moving back through time, and
// the distance between two things is the time between them: a burst of work is
// a dense stretch, a long silence is a long empty one. After the oldest thing on
// the Canvas the track reaches the Canvas again, so there is no end either way.

import { IdeaNode, lastActivity } from './model';
import { hash01 } from './rng';

/** Distance ahead (track units) at which a thing is in focus: fully itself. */
export const FOCUS = 1;
/** Nearest distance still drawn; nearer than this a thing is behind you. */
export const NEAR = 0.06;
/** Farthest distance drawn: beyond it things are finer than the ink's grain. */
export const FAR = 14;
/** Where a visitor arrives: the Canvas's own ring, a little ahead. */
export const ARRIVE = 1.6;

const DAY = 86400000;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Radius of the Canvas's own ring, and of an idea that holds others (depth 1). */
const ROOT_R = 0.8;
const GATE_R = 0.5;
/** Each ring inside another is this much narrower. */
const NEST = 0.8;
/** A plain idea, and one carrying something to see or hear, take different room. */
const LEAF_R = 0.2;
const CONTENT_R = 0.3;
/** How far from the line of travel things float, and how far the camera leans toward them. */
const ORBIT = 0.32;
const LEAN = 0.55;
/** A pause entering and leaving a ring, so a ring never sits on what it holds. */
const ENTER_GAP = 0.5;
const EXIT_GAP = 0.45;

export interface Station {
  i: number;
  node: IdeaNode;
  /** Root first. */
  path: IdeaNode[];
  depth: number;
  /** Holds other ideas: a ring you pass through into what it holds. */
  gate: boolean;
  z: number;
  /** For rings: where what it holds ends. */
  end: number;
  x: number;
  y: number;
  r: number;
  /** When this thing began. */
  t: number;
  /** Silence before it (ms): the thread thins across long quiet stretches. */
  quiet: number;
}

export interface Stream {
  stations: Station[];
  /** One lap: after it, the track begins again. */
  length: number;
  byId: Map<string, number>;
}

/** Children that can be travelled to: never the Canvas-again portals or empty frames. */
export function travelled(node: IdeaNode): IdeaNode[] {
  return node.children.filter((c) => !c.portal && !c.void);
}

/** Distance between two neighbours on the track: the time between them. */
export function spacing(gapMs: number): number {
  const days = Math.abs(gapMs) / DAY;
  return Math.min(3, 1.1 + 0.25 * Math.log2(1 + days));
}

function hasContent(n: IdeaNode) {
  return !!(n.media?.length || n.artifact);
}

/**
 * The real silence between two things: the time between their lives, which is
 * nothing if one was still being worked on when the other began.
 */
export function silence(a: IdeaNode, b: IdeaNode): number {
  const a1 = Math.max(a.began, lastActivity(a));
  const b1 = Math.max(b.began, lastActivity(b));
  return Math.max(0, Math.max(a.began, b.began) - Math.min(a1, b1));
}

const cache = new WeakMap<IdeaNode, Stream>();

export function buildStream(root: IdeaNode): Stream {
  const hit = cache.get(root);
  if (hit) return hit;
  const stations: Station[] = [];
  const rootStation: Station = {
    i: 0,
    node: root,
    path: [root],
    depth: 0,
    gate: true,
    z: 0,
    end: 0,
    x: 0,
    y: 0,
    r: ROOT_R,
    t: 0,
    quiet: 0,
  };
  stations.push(rootStation);
  let z = 0;
  let prev: IdeaNode | null = null;

  const walk = (node: IdeaNode, path: IdeaNode[], depth: number) => {
    // newest first; ties keep their order
    const kids = travelled(node)
      .map((c, k) => ({ c, k }))
      .sort((a, b) => b.c.began - a.c.began || a.k - b.k)
      .map(({ c }) => c);
    const turn = hash01(node.seed, 7) * Math.PI * 2;
    kids.forEach((c, k) => {
      const gap = prev === null ? 0 : silence(prev, c);
      z += spacing(gap) + (k === 0 ? ENTER_GAP : 0);
      const gate = travelled(c).length > 0;
      const ang = turn + k * GOLDEN;
      const s: Station = {
        i: stations.length,
        node: c,
        path: [...path, c],
        depth,
        gate,
        z,
        end: z,
        x: gate ? 0 : Math.cos(ang) * ORBIT,
        y: gate ? 0 : Math.sin(ang) * ORBIT,
        r: gate ? GATE_R * Math.pow(NEST, depth - 1) : hasContent(c) ? CONTENT_R : LEAF_R,
        t: c.began,
        quiet: gap,
      };
      stations.push(s);
      prev = c;
      if (gate) {
        walk(c, s.path, depth + 1);
        z += EXIT_GAP;
        s.end = z;
      }
    });
  };
  walk(root, [root], 1);
  const length = z + spacing(0) + ENTER_GAP;
  rootStation.end = length;
  const byId = new Map<string, number>();
  for (const s of stations) if (!byId.has(s.node.id)) byId.set(s.node.id, s.i);
  const stream = { stations, length, byId };
  cache.set(root, stream);
  return stream;
}

// ---------------------------------------------------------------------------
// Positions on a loop. The camera's z is any real number; stations repeat
// every lap.

export function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

/** Signed distance from `from` to the nearest repeat of `z`, in (-L/2, L/2]. */
export function wrapDelta(z: number, from: number, L: number) {
  let d = mod(z - from, L);
  if (d > L / 2) d -= L;
  return d;
}

/** Every distance ahead of the camera, within [lo, hi], at which a repeat of `z` sits. */
export function aheadCopies(z: number, camZ: number, L: number, lo: number, hi: number): number[] {
  const out: number[] = [];
  const k0 = Math.ceil((camZ + lo - z) / L);
  const k1 = Math.floor((camZ + hi - z) / L);
  for (let k = k0; k <= k1; k++) out.push(z + k * L - camZ);
  return out;
}

/** Index of the last station at or before z (mod L). */
function indexAt(stream: Stream, z: number) {
  const zm = mod(z, stream.length);
  const st = stream.stations;
  let lo = 0;
  let hi = st.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (st[mid].z <= zm) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function smooth(t: number) {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
}

/**
 * Where the camera leans, sideways, at track position camZ: toward whatever is
 * coming into focus, so it arrives near the middle and then slides away.
 */
export function leanAt(stream: Stream, camZ: number): [number, number] {
  const st = stream.stations;
  const L = stream.length;
  const i = indexAt(stream, camZ + FOCUS);
  const a = st[i];
  const b = st[(i + 1) % st.length];
  const za = a.z;
  const zb = i + 1 < st.length ? b.z : b.z + L;
  const u = smooth((mod(camZ + FOCUS, L) - za) / Math.max(1e-6, zb - za));
  const ax = a.gate ? 0 : a.x * LEAN;
  const ay = a.gate ? 0 : a.y * LEAN;
  const bx = b.gate ? 0 : b.x * LEAN;
  const by = b.gate ? 0 : b.y * LEAN;
  return [ax + (bx - ax) * u, ay + (by - ay) * u];
}

// ---------------------------------------------------------------------------
// The camera.

export interface FlightCam {
  /** Position along the track. */
  z: number;
  /** Speed along the track (units per second); positive is forward. */
  v: number;
  /** Sideways wander from dragging across (track units); springs back. */
  wx: number;
  wy: number;
  /** A place being flown to (camera z), if any. */
  target: number | null;
  /** Seconds since the viewer last moved it. */
  idle: number;
  /** A finger or button is holding it. */
  held: boolean;
  /** Which way the viewer last pushed (1 forward, -1 back, 0 not yet): where it comes to rest. */
  dir: number;
  /** How fast it is actually moving (flights included): what the ink streaks with. */
  shown: number;
}

export function newFlightCam(): FlightCam {
  return { z: -ARRIVE, v: 0, wx: 0, wy: 0, target: null, idle: 0, held: false, dir: 0, shown: 0 };
}

/** Speed is let go of gradually: a flick carries you through many things. */
const FRICTION = 2.6;
const MAX_V = 60;

/** Camera z that puts a station in focus, nearest to where the camera is. */
export function focusZ(stream: Stream, s: Station, camZ: number) {
  const f = s.z - FOCUS;
  return camZ + wrapDelta(f, camZ, stream.length);
}

/** Camera z of the nearest place where something is in focus. */
export function nearestFocus(stream: Stream, camZ: number, skip?: (s: Station) => boolean): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  for (const s of stream.stations) {
    if (skip?.(s)) continue;
    const d = wrapDelta(s.z - FOCUS, camZ, stream.length);
    if (Math.abs(d) < bestD) {
      bestD = Math.abs(d);
      best = camZ + d;
    }
  }
  return best;
}

/** The next (dir 1) or previous (dir -1) place where something is in focus. */
export function stepFocus(stream: Stream, camZ: number, dir: 1 | -1, skip?: (s: Station) => boolean): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  for (const s of stream.stations) {
    if (skip?.(s)) continue;
    let d = wrapDelta(s.z - FOCUS, camZ, stream.length);
    if (dir > 0 && d <= 0.05) d += stream.length;
    if (dir < 0 && d >= -0.05) d -= stream.length;
    if (Math.abs(d) < bestD) {
      bestD = Math.abs(d);
      best = camZ + d;
    }
  }
  return best;
}

/** The nearest places behind and ahead of z where something is in focus. */
export function focusAround(stream: Stream, camZ: number, skip?: (s: Station) => boolean): [number | null, number | null] {
  let back = -Infinity;
  let ahead = Infinity;
  for (const s of stream.stations) {
    if (skip?.(s)) continue;
    const d = wrapDelta(s.z - FOCUS, camZ, stream.length);
    if (d <= 0 && d > back) back = d;
    if (d >= 0 && d < ahead) ahead = d;
  }
  return [back === -Infinity ? null : camZ + back, ahead === Infinity ? null : camZ + ahead];
}

/**
 * Where a coasting camera comes to rest: the next thing in the direction it
 * was pushed, if that is near; otherwise whatever is very near; in a long
 * empty stretch, nowhere (the silence is left as it is).
 */
export function restingPlace(stream: Stream, camZ: number, dir: number, skip?: (s: Station) => boolean): number | null {
  const [back, ahead] = focusAround(stream, camZ, skip);
  const db = back === null ? Infinity : camZ - back;
  const da = ahead === null ? Infinity : ahead - camZ;
  const REACH = 0.9;
  const NEARBY = 0.55;
  if (dir > 0) return da < REACH ? ahead : db < NEARBY ? back : null;
  if (dir < 0) return db < REACH ? back : da < NEARBY ? ahead : null;
  if (db <= da) return db < NEARBY ? back : null;
  return da < NEARBY ? ahead : null;
}

export function stepFlightCam(cam: FlightCam, stream: Stream, dt: number, skip?: (s: Station) => boolean) {
  cam.idle += dt;
  if (cam.target !== null) {
    const d = cam.target - cam.z;
    const k = 1 - Math.exp(-dt * 4.5);
    cam.z += d * k;
    cam.v = 0;
    cam.shown = dt > 0 ? (d * k) / dt : 0;
    if (Math.abs(d) < 0.002) {
      cam.z = cam.target;
      cam.target = null;
      cam.shown = 0;
    }
    return;
  }
  if (!cam.held) {
    cam.v = Math.max(-MAX_V, Math.min(MAX_V, cam.v));
    cam.z += cam.v * dt;
    cam.v *= Math.exp(-dt * FRICTION);
    if (Math.abs(cam.v) < 0.02) cam.v = 0;
    // coming to rest, something settles into focus (a soft pull, never a snap)
    if (Math.abs(cam.v) < 0.45 && cam.idle > 0.2) {
      const f = restingPlace(stream, cam.z, cam.dir, skip);
      if (f !== null) cam.z += (f - cam.z) * (1 - Math.exp(-dt * 3));
    }
    const k = Math.exp(-dt * 2.4);
    cam.wx *= k;
    cam.wy *= k;
  }
  cam.shown = cam.v;
}

// ---------------------------------------------------------------------------
// Seeing.

export interface View {
  /** Camera position along the track and sideways. */
  z: number;
  x: number;
  y: number;
  /** Pixels per track unit at distance 1. */
  F: number;
  /** Vanishing point on screen. */
  cx: number;
  cy: number;
}

/**
 * Pixels per track unit at distance 1: the shorter side, but on a tall phone
 * (or a wide screen) enough of the longer side that things in focus fill it.
 */
export function flightScale(w: number, h: number) {
  return Math.max(Math.min(w, h), 0.6 * Math.max(w, h));
}

export function viewOf(stream: Stream, cam: FlightCam, w: number, h: number): View {
  const M = flightScale(w, h);
  const [lx, ly] = leanAt(stream, cam.z);
  // at speed the field of view widens a little, as if pulled forward
  const rush = smooth((Math.abs(cam.shown) - 3) / 20);
  return { z: cam.z, x: lx + cam.wx, y: ly + cam.wy, F: M * (1 - 0.16 * rush), cx: w / 2, cy: h * 0.47 };
}

/** Screen position and scale (pixels per unit) of a point dz ahead of the camera. */
export function project(v: View, x: number, y: number, dz: number): [number, number, number] {
  const k = v.F / dz;
  return [v.cx + (x - v.x) * k, v.cy + (y - v.y) * k, k];
}

/**
 * The thing in focus: whatever sits nearest the focus distance ahead. Between
 * things, the innermost ring you are inside.
 */
export function focusOf(stream: Stream, camZ: number, skip?: (s: Station) => boolean): Station {
  const L = stream.length;
  let best: Station | null = null;
  let bestD = Infinity;
  for (const s of stream.stations) {
    if (s.depth === 0 || skip?.(s)) continue;
    const dz = mod(s.z - camZ, L);
    if (dz < 0.42 || dz > 1.75) continue;
    const d = Math.abs(dz - FOCUS) * (s.gate ? 1.25 : 1);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  if (best) return best;
  // inside: the deepest ring already passed whose contents are still ahead
  let inside: Station = stream.stations[0];
  for (const s of stream.stations) {
    if (!s.gate || s.depth === 0 || skip?.(s)) continue;
    const zm = mod(camZ + FOCUS, L);
    if (s.z <= zm && zm < s.end && s.depth > inside.depth) inside = s;
  }
  return inside;
}
