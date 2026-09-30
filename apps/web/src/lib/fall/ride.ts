// The Fall as a current: you are always moving, through relationships, never between pages.
//
// You don't enter tunnels: you are already in one (the relationship you are riding). You don't
// choose things: you steer through relationships. You don't arrive at ideas: you pass through
// them. You don't click to move: you stop to inspect.
//
// A leg of the ride is one relationship, from one subject to the next: a region at either end where
// the tube swells, and the passage between. At the far end the subject's own relationships split
// off as branches (space.ts puts each where its strand does: the strongest nearly straight on, the
// weaker peeling away at their bearings). Leaning toward a branch lets it gradually capture you as
// you near the split; you are committed only when you pass it. With no lean, the main current (the
// strongest relationship) carries you. Momentum carries you; attention changes you; inattention
// eventually lets you settle.
//
// Nothing here decides what connects: the relationships come from the sources underneath.

import { Strand } from './graph';
import { Frame, Opening, V3, add, between, dot, len, rightOf, scale, sub } from './space';

/** One relationship being ridden: from a subject (none, for the way in) to the next. */
export interface Leg {
  from: string | null;
  to: string;
  a: Frame;
  b: Frame;
  path: (t: number) => V3;
  length: number;
  strength: number;
  why?: string;
  /** Crossing between public knowledge and a person's own work. */
  human: boolean;
}

export function legOf(from: string | null, to: string, a: Frame, b: Frame, strength: number, why?: string, human = false): Leg {
  const path = between(a, b);
  let length = 0;
  let prev = path(0);
  for (let i = 1; i <= 32; i++) {
    const p = path(i / 32);
    length += len(sub(p, prev));
    prev = p;
  }
  return { from, to, a, b, path, length: Math.max(0.5, length), strength, why, human };
}

/** The way in: you are already moving when you arrive, a little way up the current into it. */
export function leadIn(at: Frame, to: string): Leg {
  return legOf(null, to, { ...at, p: add(at.p, scale(at.f, -2.6)) }, at, 1);
}

/**
 * The main current at a split: the strongest relationship there. A person's own work is a side
 * current (a thread of credit), taken only by leaning into it, unless nothing else leads on.
 */
export function mainCurrent(openings: Opening[]): Opening | null {
  const knowledge = openings.filter((o) => !o.strand.human);
  const from = knowledge.length ? knowledge : openings;
  let best: Opening | null = null;
  for (const o of from) if (!best || o.strand.strength > best.strand.strength) best = o;
  return best;
}

/** Below this, a lean is no lean: the current decides. */
export const LEAN_DEAD = 0.2;

/** Where a branch lies as you look along the split: right is +x, down is +y. */
export function screenward(fork: Frame, pos: V3): [number, number] {
  const d = sub(pos, fork.p);
  return [dot(d, rightOf(fork)), -dot(d, fork.u)];
}

/**
 * The branch a lean points into: the one lying nearest the lean's direction (within a wide cone).
 * No lean, or nothing that way, and the main current carries you.
 */
export function branchFor(fork: Frame, openings: Opening[], lean: { x: number; y: number }): Opening | null {
  if (Math.hypot(lean.x, lean.y) < LEAN_DEAD) return mainCurrent(openings);
  const want = Math.atan2(lean.y, lean.x);
  let best: Opening | null = null;
  let bestD = 1.25;
  for (const o of openings) {
    const [x, y] = screenward(fork, o.pos);
    if (Math.hypot(x, y) < 1e-3) continue;
    const a = Math.atan2(y, x);
    const d = Math.abs(Math.atan2(Math.sin(a - want), Math.cos(a - want)));
    if (d < bestD) [best, bestD] = [o, d];
  }
  return best ?? mainCurrent(openings);
}

/** How strongly the branch ahead has you (0 to 1): nothing far off, all of it at the split. */
export function captureAt(s: number) {
  const t = Math.max(0, Math.min(1, (s - 0.5) / 0.45));
  return t * t * (3 - 2 * t);
}

/** How crowded a subject is (0 to 1): the more strong relationships meet there, the denser. */
export function densityOf(strands: Strand[] | undefined) {
  if (!strands) return 0.5;
  return Math.min(1, strands.filter((s) => s.strength >= 0.45).length / 10);
}

/** Metres (world units) a second, at an ordinary pace. */
export const CRUISE = 0.85;

/**
 * How fast the current runs at `s` along a leg (a multiple of cruise): slower through a dense
 * region, faster across the gap of a weak relationship.
 */
export function paceAt(s: number, strength: number, density: number) {
  const mid = Math.sin(Math.PI * Math.max(0, Math.min(1, s)));
  const region = 0.55 + 0.35 * (1 - density);
  const gap = 1 + 1.1 * (1 - Math.max(0, Math.min(1, strength)));
  return region + (gap - region) * mid;
}

/**
 * Momentum: speed eases toward what the current asks. Held, it bleeds away at once (a stop begins
 * the moment you hold); let go, the current picks you back up more gently.
 */
export function easeSpeed(v: number, target: number, dt: number, holding: boolean) {
  const tau = target < v ? (holding ? 0.22 : 0.7) : 0.9;
  return v + (target - v) * (1 - Math.exp(-dt / tau));
}

/** Passing this many subjects with no attention at all, the current lets you settle. */
export const SETTLE_AFTER = 3;
/** Where along the leg you settle: inside the next subject, its splits in view. */
export const SETTLE_AT = 0.84;

/** The speed the current allows while settling: less and less, to nothing inside the subject. */
export function settleSpeed(s: number, cruise: number) {
  return cruise * Math.max(0, Math.min(1, (SETTLE_AT - s) / 0.35));
}

/** Where you are along a leg, for what stopping reveals. */
export type Zone = 'leaving' | 'passage' | 'arriving';
export function zoneAt(s: number, hasFrom: boolean): Zone {
  // the way in has no subject behind it: all of it is the approach to where you entered
  if (!hasFrom) return 'arriving';
  if (s < 0.14) return 'leaving';
  return s < 0.6 ? 'passage' : 'arriving';
}
