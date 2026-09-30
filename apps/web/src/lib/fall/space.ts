// The space a Fall makes: built from where you went, never laid down in advance.
//
// There is no tunnel here. Each place you reach sits where the strand you followed put it: a
// strong connection is short and nearly straight on, a weak one (a big jump) is long and off to
// one side, in the direction its bearing gives (where it came from above, what it led to below,
// kin at the sides). Arriving turns you toward where you went, so a run of turns the same way
// curls into a spiral, a strong chain drops almost straight, and a jump opens a long empty gap.
// None of that is drawn on purpose: it is what the path does. Going back to somewhere already
// reached on this Fall joins the path to it, instead of placing it again.

import { Bearing, Strand } from './graph';

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Where a place is, which way you face there, and which way is up. */
export interface Frame {
  p: V3;
  f: V3;
  u: V3;
}

export const START: Frame = { p: [0, 0, 0], f: [0, 0, 1], u: [0, 1, 0] };

/** Right, for a frame (forward cross up). */
export const rightOf = (fr: Frame): V3 => norm(cross(fr.f, fr.u));

/** How far a strand runs: short when strong, long when weak (a jump leaves a real gap). */
export function distanceFor(strength: number) {
  const w = Math.max(0, Math.min(1, strength));
  return 1.9 + 4.6 * Math.pow(1 - w, 1.3);
}

/**
 * How far off straight ahead it leads (radians): strong things lie nearer your way, weak ones
 * further out. Never dead ahead: something exactly on your line of sight hides behind where you are.
 */
export function spreadFor(strength: number) {
  const w = Math.max(0, Math.min(1, strength));
  return 0.6 + 0.6 * (1 - w);
}

/** Where on the view a bearing points (radians; 0 is right, a quarter turn is down). */
const BEARING_ANGLE: Record<Bearing, number[]> = {
  // where it came from: above you; what it led to: below; kin at the sides; linked both ways between
  from: [-Math.PI / 2],
  to: [Math.PI / 2],
  beside: [Math.PI, 0],
  linked: [(-3 * Math.PI) / 4, -Math.PI / 4, Math.PI / 4, (3 * Math.PI) / 4],
};

export interface Opening {
  strand: Strand;
  /** Where it lies, in the space. */
  pos: V3;
  /** Its direction on the view (radians). */
  angle: number;
  /** Already reached on this Fall: the strand joins the path back to it. */
  back: boolean;
}

/**
 * The ways on from a place, each where its strand puts it. Several of one bearing fan out around
 * its direction (strongest nearest the middle of it), so none sit on another. `placed` holds
 * where everything already reached on this Fall is.
 */
export function openingsAround(fr: Frame, strands: Strand[], placed?: Map<string, V3>): Opening[] {
  const r = rightOf(fr);
  const byBearing = new Map<Bearing, Strand[]>();
  for (const s of strands) byBearing.set(s.bearing, [...(byBearing.get(s.bearing) ?? []), s]);
  const out: Opening[] = [];
  for (const [b, list] of byBearing) {
    const centres = BEARING_ANGLE[b];
    list.forEach((s, i) => {
      const centre = centres[i % centres.length];
      const k = Math.floor(i / centres.length);
      // fan out: 0, +, -, ++, --
      const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.42;
      const angle = centre + off;
      const back = placed?.get(s.to);
      if (back) {
        out.push({ strand: s, pos: back, angle, back: true });
        return;
      }
      const phi = spreadFor(s.strength);
      const d = distanceFor(s.strength);
      // on the view, right is +x and down is +y, so "down" is away from up
      const lateral = norm(add(scale(r, Math.cos(angle)), scale(fr.u, -Math.sin(angle))));
      const dir = norm(add(scale(fr.f, Math.cos(phi)), scale(lateral, Math.sin(phi))));
      out.push({ strand: s, pos: add(fr.p, scale(dir, d)), angle, back: false });
    });
  }
  return out;
}

/**
 * Arriving somewhere: you now face (mostly) the way you came in, with up carried along the turn
 * (never snapped back upright), so a path that keeps turning one way keeps turning.
 */
export function arrive(from: Frame, at: V3): Frame {
  const dir = sub(at, from.p);
  if (len(dir) < 1e-6) return { ...from, p: at };
  const f = norm(lerp3(from.f, norm(dir), 0.8));
  // carry up across the turn: take out whatever of it now points along the way
  let u = sub(from.u, scale(f, dot(from.u, f)));
  if (len(u) < 1e-4) u = sub(rightOf(from), scale(f, dot(rightOf(from), f)));
  return { p: at, f, u: norm(u) };
}

/** The way between two places: leaving along one's facing, arriving along the other's. */
export function between(a: Frame, b: Frame): (t: number) => V3 {
  const d = len(sub(b.p, a.p));
  const c1 = add(a.p, scale(a.f, d / 3));
  const c2 = sub(b.p, scale(b.f, d / 3));
  return (t: number) => {
    const s = 1 - t;
    return add(add(scale(a.p, s * s * s), scale(c1, 3 * s * s * t)), add(scale(c2, 3 * s * t * t), scale(b.p, t * t * t)));
  };
}

/** A frame part way between two (for the camera while travelling). */
export function blend(a: Frame, b: Frame, t: number, path: (t: number) => V3): Frame {
  const p = path(t);
  const ahead = path(Math.min(1, t + 0.02));
  const behind = path(Math.max(0, t - 0.02));
  const tangent = len(sub(ahead, behind)) > 1e-6 ? norm(sub(ahead, behind)) : norm(lerp3(a.f, b.f, t));
  const f = norm(lerp3(tangent, norm(lerp3(a.f, b.f, t)), 0.35));
  let u = lerp3(a.u, b.u, t);
  u = sub(u, scale(f, dot(u, f)));
  return { p, f, u: norm(u) };
}

/** How long going somewhere takes (s): a close step is quick, a jump takes its time. */
export function travelTime(from: V3, to: V3) {
  return 0.8 + 0.28 * len(sub(to, from));
}

/**
 * The place on this Fall's path. `passed` keeps the ways on that were open there and not taken
 * (so looking back shows the alternatives, not only the route).
 */
export interface Place {
  id: string;
  title: string;
  frame: Frame;
  /** The strand that brought you here (absent at the start). */
  via?: { from: string; why?: string; strength: number; bearing: Bearing };
  passed: { to: string; pos: V3 }[];
}

/** A vantage over the whole path: far enough back and above to hold all of it. */
export function overlook(places: Place[]): { eye: V3; at: V3; up: V3 } {
  if (!places.length) return { eye: [0, 1, -4], at: [0, 0, 0], up: [0, 1, 0] };
  let c: V3 = [0, 0, 0];
  for (const p of places) c = add(c, p.frame.p);
  c = scale(c, 1 / places.length);
  let R = 1.5;
  let f: V3 = [0, 0, 0];
  let u: V3 = [0, 0, 0];
  for (const p of places) {
    R = Math.max(R, len(sub(p.frame.p, c)));
    f = add(f, p.frame.f);
    u = add(u, p.frame.u);
  }
  f = norm(f);
  u = norm(sub(u, scale(f, dot(u, f))));
  const eye = add(c, add(scale(f, -R * 0.9), scale(u, R * 1.35)));
  return { eye, at: c, up: u };
}
