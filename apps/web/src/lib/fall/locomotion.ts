// Moving in the Fall: two states.
//
// Traveling: a current carries you through one relationship, from one subject to the next.
// Located: you have arrived at a subject and stay there until you choose to leave. The
// environment keeps moving; only you do not. Arrival gives you permission to do nothing.
//
// Where you look is your lean. Whatever current you look at resolves in order: notice (its name),
// understand (why it connects), and, if you keep looking past that, commit (it begins, slowly, to
// carry you). Look away before it has you and you drift back to the subject. The current you
// arrived through is still behind you; turn around and it carries you the other way in exactly
// the same manner (it is just Traveling, in the opposite direction).
//
// Nothing here decides what connects: the relationships come from the sources underneath.

import { Frame, V3, add, between, cross, dot, len, norm, rightOf, scale, sub } from './space';

/** The path of one current: a relationship from one subject to the next (none before the way in). */
export interface CurrentPath {
  from: string | null;
  to: string;
  a: Frame;
  b: Frame;
  path: (t: number) => V3;
  length: number;
  strength: number;
  why?: string;
  /** Between public knowledge and a person's own work (a rose current). */
  human: boolean;
  /** Travelled opposite to the way it was first travelled. */
  reversed?: boolean;
}

export function currentPath(from: string | null, to: string, a: Frame, b: Frame, strength: number, why?: string, human = false): CurrentPath {
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

/** The way in: you are already Traveling when you enter, a little way before the subject. */
export function entryPath(at: Frame, to: string): CurrentPath {
  return currentPath(null, to, { ...at, p: add(at.p, scale(at.f, -3.4)) }, at, 1);
}

const flip = (fr: Frame): Frame => ({ p: fr.p, f: scale(fr.f, -1), u: fr.u });

/** The same current, the other way: the very path, travelled in the opposite direction. */
export function reversePath(c: CurrentPath): CurrentPath {
  if (!c.from) throw new Error('the way in has nothing before it');
  return { ...c, from: c.to, to: c.from, a: flip(c.b), b: flip(c.a), path: (t) => c.path(1 - t), reversed: !c.reversed };
}

/** Whether two current paths are the same relationship travelled in opposite directions. */
export const isReverseOf = (a: CurrentPath, b: CurrentPath) => a.from === b.to && a.to === b.from;

/** World units a second while Traveling, faster across a weak relationship. */
export const CRUISE = 1.2;
export const paceOf = (strength: number) => 1 + 0.8 * (1 - Math.max(0, Math.min(1, strength)));

/** Where you come to rest at a subject (world units before it), and how far out arriving begins to slow you. */
export const REST = 0.9;
export const REACH = 2.2;

/** Arriving: full speed outside a subject's reach, slowing inside it, nothing at rest. */
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

/** The point on a current `left` world units before its end (near enough; the paths are gentle). */
export const sBefore = (c: CurrentPath, left: number) => Math.max(0, Math.min(1, 1 - left / c.length));

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

/** How far into a current you must be before it has you (world units); before that you can drift back. */
export const COMMITTED_AFTER = 0.8;

/** Where you look, relative to a frame (radians). */
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

/** The current you are looking at: the one whose target is nearest the middle of your view, if close to it. */
export function lookedAt(eye: V3, look: V3, targets: { id: string; target: V3 }[], within = 0.3): string | null {
  let best: string | null = null;
  let bestA = within;
  for (const c of targets) {
    const a = Math.acos(Math.max(-1, Math.min(1, dot(norm(sub(c.target, eye)), look))));
    if (a < bestA) [best, bestA] = [c.id, a];
  }
  return best;
}
