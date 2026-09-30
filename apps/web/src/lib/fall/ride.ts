// The Fall as a river: motion is always present; travel is voluntary.
//
// Two states. Traveling: a current carries you through one relationship. Located: you have arrived
// at a subject and stay there until you leave. The environment never stops moving; only you do.
// Arrival gives you permission to do nothing.
//
// Looking is how you steer. Whatever current you look at resolves in order: notice (its name),
// understand (why it connects), and, if you keep looking past that, commit (it begins, slowly, to
// carry you, and carries you on if you keep looking). Look away before you are properly in it and
// you drift back to the subject. Turn around and the passage you arrived through is still there;
// looked at the same way, it carries you back along the path you actually came.
//
// Nothing here decides what connects: the relationships come from the sources underneath.

import { Frame, V3, add, between, cross, dot, len, norm, rightOf, scale, sub } from './space';

/** One relationship, travelled from one subject to the next (none behind, for the way in). */
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
  /** Travelled against the way you first came (retracing). */
  back?: boolean;
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
  return legOf(null, to, { ...at, p: add(at.p, scale(at.f, -3.4)) }, at, 1);
}

const flip = (fr: Frame): Frame => ({ p: fr.p, f: scale(fr.f, -1), u: fr.u });

/** The same relationship the other way: the very path you came by, retraced. */
export function reverseLeg(leg: Leg): Leg {
  if (!leg.from) throw new Error('the way in has nothing behind it');
  return { ...leg, from: leg.to, to: leg.from, a: flip(leg.b), b: flip(leg.a), path: (t) => leg.path(1 - t), back: !leg.back };
}

/** World units a second between subjects, faster across the gap of a weak relationship. */
export const CRUISE = 1.2;
export const paceOf = (strength: number) => 1 + 0.8 * (1 - Math.max(0, Math.min(1, strength)));

/** Where you come to rest at a subject (world units before it), and how far out it begins to slow you. */
export const REST = 0.9;
export const REACH = 2.2;

/** Arriving: full speed outside the subject's reach, falling away inside it, nothing at rest. */
export function arrivalSpeed(left: number, cruise: number) {
  const d = left - REST;
  if (d <= 0) return 0;
  return cruise * Math.min(1, Math.pow(d / REACH, 0.7));
}

/** Momentum: speed eases toward what the current allows (dropping faster than it picks up). */
export function easeSpeed(v: number, target: number, dt: number) {
  const tau = target < v ? 0.25 : 0.6;
  return v + (target - v) * (1 - Math.exp(-dt / tau));
}

/** The point on a leg `left` world units before its end (near enough; the paths are gentle). */
export const sBefore = (leg: Leg, left: number) => Math.max(0, Math.min(1, 1 - left / leg.length));

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Attention, as seconds of looking at one current: first its name (notice), then why it connects
 * (understand), and only well after the reason is legible, a pull (commit). Looking away resets it.
 */
export const NOTICE = [0.25, 0.6] as const;
export const UNDERSTAND = [0.9, 1.5] as const;
export const COMMIT = [2.4, 3.8] as const;
export function attention(t: number) {
  return { name: smooth(NOTICE[0], NOTICE[1], t), why: smooth(UNDERSTAND[0], UNDERSTAND[1], t), pull: smooth(COMMIT[0], COMMIT[1], t) };
}

/** How far you must actually have gone into a current before it has you (world units). */
export const TAKEN = 0.8;

/** Where you are looking, relative to a frame (radians). */
export interface Look {
  yaw: number;
  pitch: number;
}

/** The direction you look, and which way is up, for a frame and a look. */
export function lookAt(fr: Frame, look: Look): { f: V3; u: V3 } {
  const r = rightOf(fr);
  const f1 = norm(add(scale(fr.f, Math.cos(look.yaw)), scale(r, Math.sin(look.yaw))));
  const r1 = norm(cross(f1, fr.u));
  const f = norm(add(scale(f1, Math.cos(look.pitch)), scale(fr.u, Math.sin(look.pitch))));
  return { f, u: norm(cross(r1, f)) };
}

/** The look that points a frame along a direction (so the view does not jump when the frame changes). */
export function lookFor(fr: Frame, d: V3): Look {
  const r = rightOf(fr);
  const dn = norm(d);
  return { yaw: Math.atan2(dot(dn, r), dot(dn, fr.f)), pitch: Math.asin(Math.max(-1, Math.min(1, dot(dn, fr.u)))) };
}

/** The current you are looking at: the one whose mouth is nearest the middle of your view, if close to it. */
export function faced(eye: V3, look: V3, ways: { id: string; mouth: V3 }[], within = 0.3): string | null {
  let best: string | null = null;
  let bestA = within;
  for (const w of ways) {
    const a = Math.acos(Math.max(-1, Math.min(1, dot(norm(sub(w.mouth, eye)), look))));
    if (a < bestA) [best, bestA] = [w.id, a];
  }
  return best;
}
