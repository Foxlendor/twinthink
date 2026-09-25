// Topology: how the inside of an idea is arranged.
//
// Children are placed outward by time (earlier thoughts sit closer to the
// origin), biased toward one growth direction so an idea reads as something
// that grew rather than a radial diagram. Each child is reached by a strand
// whose shape, density and gaps come from that child's real history.

import { IdeaNode, LifeEvent, lastActivity, countEvents } from './model';
import { hash01, hashString, noise1, clamp } from './rng';

export interface StrandMark {
  u: number;
  ev: LifeEvent;
}

export interface Twig {
  u: number;
  side: 1 | -1;
  len: number;
  ev: LifeEvent;
}

export interface Strand {
  /** Sampled polyline in the node frame: x0,y0,x1,y1,... */
  pts: Float64Array;
  /** Cumulative length at each sample. */
  cum: Float64Array;
  len: number;
  /** 0 = scattered points, 1 = continuous silk. */
  coherence: number;
  /** Fraction of the strand (from its end) over which it tapers into nothing. */
  taper: number;
  child: IdeaNode | null;
  gaps: [number, number][];
  marks: StrandMark[];
  twigs: Twig[];
  weight: number;
  seed: number;
  /** Time span the strand represents (epoch ms): birth of the child to its latest activity. */
  t0: number;
  t1: number;
}

/** Arc fraction reached by a strand at time t. */
export function strandU(s: Strand, t: number) {
  return clamp((t - s.t0) / Math.max(s.t1 - s.t0, 1), 0, 1);
}

export interface Topology {
  strands: Strand[];
  /** Strands sorted most important first (revealed first as Z increases). */
  order: number[];
}

const SAMPLES = 72;
const DAY = 86400000;

const cache = new WeakMap<IdeaNode, Topology>();

export function topologyOf(node: IdeaNode): Topology {
  let topo = cache.get(node);
  if (!topo) {
    topo = buildTopology(node);
    cache.set(node, topo);
  }
  return topo;
}

/** Position children inside a node's frame. Mutates x/y/r of non-fixed children. */
export function placeChildren(node: IdeaNode) {
  const kids = node.children;
  if (!kids.length) return;
  const seed = node.seed;
  const t0 = node.began;
  const t1 = Math.max(lastActivity(node), t0 + DAY);
  const growth = hash01(seed, 7) * Math.PI * 2;
  const sorted = [...kids].sort((a, b) => a.began - b.began);

  sorted.forEach((c, i) => {
    const weight = Math.log1p(countEvents(c) + c.children.length * 2);
    if (!c.fixed) c.r = clamp(0.03 + 0.012 * weight, 0.03, 0.068);
    if (c.fixed) return;
    const tf = clamp((c.began - t0) / (t1 - t0), 0, 1);
    const rho = 0.3 + 0.5 * tf + (hash01(c.seed, 1) - 0.5) * 0.12;
    // fan around the growth direction, alternating sides, never a full circle
    const side = i % 2 === 0 ? 1 : -1;
    const spread = 0.35 + 1.25 * ((i + 1) / (sorted.length + 1));
    const ang = growth + side * spread * (0.6 + 0.5 * hash01(c.seed, 2)) + (hash01(c.seed, 3) - 0.5) * 0.3;
    c.x = Math.cos(ang) * rho;
    c.y = Math.sin(ang) * rho;
  });

  // relax overlaps
  for (let iter = 0; iter < 60; iter++) {
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i];
        const b = kids[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        const min = a.r + b.r + 0.09;
        if (d < min) {
          const push = (min - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          if (!a.fixed) {
            a.x -= ux * push;
            a.y -= uy * push;
          }
          if (!b.fixed) {
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }
    }
    for (const c of kids) {
      if (c.fixed) continue;
      const d = Math.hypot(c.x, c.y);
      const max = 0.92 - c.r;
      if (d > max) {
        c.x *= max / d;
        c.y *= max / d;
      }
      if (d < 0.2) {
        const k = 0.2 / (d || 1e-6);
        c.x *= k;
        c.y *= k;
      }
    }
  }
}

function samplePath(ax: number, ay: number, bx: number, by: number, seed: number, wander: number): Float64Array {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / dist;
  const ny = dx / dist;
  const out = new Float64Array(SAMPLES * 2);
  for (let i = 0; i < SAMPLES; i++) {
    const u = i / (SAMPLES - 1);
    const env = Math.sin(Math.PI * u);
    const bend =
      noise1(u * 2.2, seed) * 0.16 * dist * env * wander +
      noise1(u * 6.5, seed + 11) * 0.035 * dist * env * wander;
    const along = noise1(u * 3.1, seed + 5) * 0.03 * dist * env;
    out[i * 2] = ax + dx * u + nx * bend + (dx / dist) * along;
    out[i * 2 + 1] = ay + dy * u + ny * bend + (dy / dist) * along;
  }
  return out;
}

function cumulative(pts: Float64Array) {
  const n = pts.length / 2;
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    cum[i] = cum[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
  }
  return cum;
}

/** Point and unit tangent at arc-length fraction u of a strand. */
export function strandAt(s: Strand, u: number): [number, number, number, number] {
  const target = clamp(u, 0, 1) * s.len;
  const cum = s.cum;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1e-9;
  const f = (target - cum[lo]) / seg;
  const x0 = s.pts[lo * 2];
  const y0 = s.pts[lo * 2 + 1];
  const x1 = s.pts[hi * 2];
  const y1 = s.pts[hi * 2 + 1];
  const tx = (x1 - x0) / seg;
  const ty = (y1 - y0) / seg;
  return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, tx, ty];
}

function timeline(events: LifeEvent[], t0: number, t1: number) {
  const span = Math.max(t1 - t0, DAY);
  return (t: number) => clamp((t - t0) / span, 0, 1);
}

function buildTopology(node: IdeaNode): Topology {
  placeChildren(node);
  const strands: Strand[] = [];
  const sorted = [...node.children].sort((a, b) => a.began - b.began);

  for (const c of sorted) {
    const seed = hashString(c.id) ^ node.seed;
    const evs = [...c.events].sort((a, b) => a.t - b.t);
    const t0 = c.began;
    const t1 = Math.max(lastActivity(c), t0 + DAY);
    const toU = timeline(evs, t0, t1);

    // A later thought may fork off an earlier strand heading the same way.
    let ax = 0;
    let ay = 0;
    let forkFrom: Strand | null = null;
    const ang = Math.atan2(c.y, c.x);
    for (const s of strands) {
      if (!s.child) continue;
      const sa = Math.atan2(s.child.y, s.child.x);
      let da = Math.abs(ang - sa);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < 0.55 && s.child.began < c.began) {
        forkFrom = s;
        break;
      }
    }
    if (forkFrom) {
      const [fx, fy] = strandAt(forkFrom, 0.35 + 0.3 * hash01(seed, 4));
      ax = fx;
      ay = fy;
    } else {
      const a0 = hash01(seed, 5) * Math.PI * 2;
      ax = Math.cos(a0) * 0.012;
      ay = Math.sin(a0) * 0.012;
    }
    // strands end at the rim of the child, not at its centre
    const ex = c.x - (c.x - ax) * (c.r * 0.9) / (Math.hypot(c.x - ax, c.y - ay) || 1);
    const ey = c.y - (c.y - ay) * (c.r * 0.9) / (Math.hypot(c.x - ax, c.y - ay) || 1);
    const pts = samplePath(ax, ay, ex, ey, seed, 1);
    const cum = cumulative(pts);

    const gaps: [number, number][] = [];
    // explicit dormancy
    let dormantAt: number | null = null;
    for (const e of evs) {
      if (e.kind === 'dormant') dormantAt = toU(e.t);
      if (e.kind === 'revival' && dormantAt !== null) {
        gaps.push([dormantAt, toU(e.t)]);
        dormantAt = null;
      }
    }
    // silence between events is also visible
    const span = t1 - t0;
    for (let i = 1; i < evs.length; i++) {
      const gap = evs[i].t - evs[i - 1].t;
      if (gap > Math.max(6 * DAY, span * 0.22)) gaps.push([toU(evs[i - 1].t) + 0.01, toU(evs[i].t) - 0.01]);
    }

    const marks: StrandMark[] = [];
    const twigs: Twig[] = [];
    evs.forEach((e, i) => {
      const u = toU(e.t);
      if (e.kind === 'prune' || e.kind === 'failure') {
        twigs.push({ u, side: hash01(seed, i + 40) > 0.5 ? 1 : -1, len: 0.05 + 0.07 * hash01(seed, i + 60), ev: e });
      }
      if (e.kind !== 'return') marks.push({ u, ev: e });
    });

    const coherence = clamp(1 - Math.exp(-evs.length / 5), 0.12, 1);
    strands.push({
      pts,
      cum,
      len: cum[cum.length - 1],
      coherence,
      taper: c.state === 'abandoned' ? 0.55 : 0,
      child: c,
      gaps,
      marks,
      twigs,
      weight: countEvents(c) + c.children.length * 3 + (c.state === 'abandoned' ? -2 : 0),
      seed,
      t0,
      t1,
    });
  }

  const order = strands.map((_, i) => i).sort((a, b) => strands[b].weight - strands[a].weight);
  return { strands, order };
}
