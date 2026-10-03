// Currents and their neighbours: the sideways geometry of the Fall.
//
// A current is the run of the track that one holder's contents make: the Slate's own run of
// groups, a group's run of things, a fork's run inside a Shadow. Falling changes your depth along
// the current you are in. Leaning crosses into a neighbouring current and keeps that depth: 43%
// of the way through one, you arrive 43% of the way through the other. Crossing is never
// progress.
//
// Whether two currents are neighbours is decided by a relationship between them, and only by
// that: a creator's authored dimensions, and until those exist, the relationships the Slate
// already holds (what a holder holds, what holds it, what sits beside it, what goes with it, a
// dialectic link). Two things made at a similar hour are not neighbours for it. The hour decides
// only where on the rim a neighbour waits.
//
// Each edge belongs to one dimension. Creators will author dimensions separately; visitors meet
// them together: leaning left or right crosses one, leaning up or down crosses the other.

import { FOCUS, clockAngle, mod, wrapDelta, travelled, type Station, type Stream } from './flight';
import type { IdeaNode } from './model';
import { relatedTo } from './relate';

/** The two sideways dimensions a visitor can cross; depth is the third, and is the fall itself. */
export type Dimension = 'x' | 'y';

export interface Current {
  /** The holder's id (the Slate's own id for its run of groups). */
  id: string;
  holder: IdeaNode;
  /** Root first, ending in the holder. */
  path: IdeaNode[];
  station: Station;
  /** The run on the track: from the holder's own ring to where what it holds ends. */
  z0: number;
  z1: number;
}

/** Why two currents are neighbours. Authored kinds will join these; none is ever "made at a similar time". */
export type Reason = 'holds' | 'held-by' | 'beside' | 'goes-with' | 'link' | (string & {});

export interface Neighbour {
  current: Current;
  dimension: Dimension;
  reason: Reason;
  /** The subject that makes them neighbours: its hour places the neighbour on the rim. */
  via: IdeaNode;
  /** Where on the rim it waits (radians, 12 at the top), kept apart from the others in its dimension. */
  angle: number;
}

/** Until creators author dimensions: what a thing is beside crosses left and right; what holds it, or it holds, crosses up and down. */
export function defaultDimension(reason: Reason): Dimension {
  return reason === 'holds' || reason === 'held-by' ? 'y' : 'x';
}

/** Every current on the track, by holder id. */
export function currentsOf(stream: Stream): Map<string, Current> {
  const out = new Map<string, Current>();
  for (const s of stream.stations) {
    if (!s.gate) continue;
    out.set(s.node.id, { id: s.node.id, holder: s.node, path: s.path, station: s, z0: s.z, z1: s.end });
  }
  return out;
}

/** The current you are in: the one whose contents the thing in front of you belongs to (the Slate's own, at its groups). */
export function currentAt(currents: Map<string, Current>, here: Station | null | undefined): Current | null {
  if (!here) return null;
  if (here.depth === 0) return currents.get(here.node.id) ?? null;
  const holder = here.path[here.path.length - 2];
  return (holder && currents.get(holder.id)) ?? null;
}

/**
 * The current you are in, by where you are: the deepest run whose span holds the point in front of
 * the camera. At a holder's own ring you are already in its run (the cell you occupy, not the one
 * you look at), so its neighbours are the ones that matter.
 */
export function currentAtZ(stream: Stream, currents: Map<string, Current>, camZ: number): Current | null {
  let best: Current | null = null;
  for (const c of currents.values()) {
    const span = c.z1 - c.z0;
    const d = wrapDelta(camZ + FOCUS, c.z0, stream.length);
    const inside = span <= 1e-9 ? Math.abs(d) < 1e-6 : d >= -1e-6 && d <= span + 1e-6;
    if (inside && (!best || c.path.length > best.path.length)) best = c;
  }
  return best ?? currents.get(stream.stations[0].node.id) ?? null;
}

/** How far along a current the thing in front of the camera is, 0 at its ring, 1 at its end. */
export function fractionOf(stream: Stream, current: Current, camZ: number): number {
  const span = current.z1 - current.z0;
  if (span <= 1e-9) return 0;
  const focus = current.z0 + wrapDelta(camZ + FOCUS, current.z0, stream.length);
  return Math.max(0, Math.min(1, (focus - current.z0) / span));
}

/** The camera z that puts the same fraction of another current in front of you: depth kept, no progress made. */
export function crossZ(stream: Stream, to: Current, fraction: number, camZ: number): number {
  const t = Math.max(0, Math.min(1, fraction));
  const focus = to.z0 + t * (to.z1 - to.z0);
  return camZ + wrapDelta(focus - FOCUS, camZ, stream.length);
}

const QUARTER = Math.PI / 2;
const centres: Record<Dimension, number[]> = { x: [0, Math.PI], y: [-QUARTER, QUARTER] };

/**
 * Where a neighbour waits: at the hour of what joins you, held within its dimension's own sides of
 * the rim (left and right for one, top and bottom for the other) so a lean in that direction
 * finds it.
 */
export function rimAngle(hour: number, dimension: Dimension): number {
  let best = centres[dimension][0];
  let off = Infinity;
  for (const c of centres[dimension]) {
    const d = mod(hour - c + Math.PI, Math.PI * 2) - Math.PI;
    if (Math.abs(d) < off) [best, off] = [c, Math.abs(d)];
  }
  const d = mod(hour - best + Math.PI, Math.PI * 2) - Math.PI;
  const keep = QUARTER / 2 - 0.12;
  return best + Math.max(-keep, Math.min(keep, d));
}

export interface NeighbourOptions {
  /** Whether this viewer may enter a holder (its disclosure, what a lens hides). */
  open?: (n: IdeaNode, path: IdeaNode[]) => boolean;
  /** Which dimension a reason crosses; creators will set this, the default stands in. */
  dimensionOf?: (reason: Reason) => Dimension;
  /** How many neighbours a dimension shows at once. */
  max?: number;
}

const cache = new WeakMap<Stream, Map<string, Neighbour[]>>();

/**
 * The currents beside the one you are in, from anywhere along it. Each is here for a reason that
 * is a relationship, never a time; the same current is listed once, for the first reason found.
 */
export function neighboursOf(stream: Stream, currents: Map<string, Current>, from: Current, root: IdeaNode, opts: NeighbourOptions = {}): Neighbour[] {
  const byStream = cache.get(stream) ?? new Map<string, Neighbour[]>();
  cache.set(stream, byStream);
  const key = `${from.id}|${opts.max ?? 8}`;
  const known = byStream.get(key);
  if (known && !opts.open) return known;

  const open = opts.open ?? (() => true);
  const dim = opts.dimensionOf ?? defaultDimension;
  const found: Neighbour[] = [];
  const seen = new Set<string>([from.id]);
  const add = (current: Current | undefined, reason: Reason, via: IdeaNode) => {
    if (!current || seen.has(current.id) || !open(current.holder, current.path)) return;
    seen.add(current.id);
    const dimension = dim(reason);
    found.push({ current, dimension, reason, via, angle: rimAngle(clockAngle(via.began), dimension) });
  };

  // what holds this current, and what it holds
  const parent = from.path[from.path.length - 2];
  if (parent) add(currents.get(parent.id), 'held-by', from.holder);
  for (const c of travelled(from.holder)) if (travelled(c).length) add(currents.get(c.id), 'holds', c);
  // what sits beside it under the same holder
  if (parent) for (const c of travelled(parent)) if (c.id !== from.id && travelled(c).length) add(currents.get(c.id), 'beside', c);
  // what its things go with elsewhere (a shared name or tag), and what they are linked to
  for (const thing of travelled(from.holder)) {
    const path = [...from.path, thing];
    for (const r of relatedTo(root, path, 4)) {
      const holder = r.path[r.path.length - 2];
      if (holder) add(currents.get(holder.id), 'goes-with', r.path[r.path.length - 1]);
    }
    for (const l of thing.links ?? []) {
      const to = travelled(from.holder).find((c) => c.id === l.to);
      if (to && travelled(to).length) add(currents.get(to.id), 'link', to);
    }
  }

  // kept apart around each dimension's sides of the rim, nearest the hour each was placed at
  const max = opts.max ?? 8;
  const out: Neighbour[] = [];
  for (const d of ['x', 'y'] as Dimension[]) {
    const ofDim = found.filter((n) => n.dimension === d).slice(0, max).sort((a, b) => a.angle - b.angle);
    const gap = Math.min(0.45, Math.PI / Math.max(1, ofDim.length));
    for (let i = 1; i < ofDim.length; i++) if (ofDim[i].angle - ofDim[i - 1].angle < gap) ofDim[i].angle = ofDim[i - 1].angle + gap;
    out.push(...ofDim);
  }
  if (!opts.open) byStream.set(key, out);
  return out;
}

/** Which dimension a lean is in: left or right crosses one, up or down the other; neither, in the middle. */
export function leanDimension(x: number, y: number, roll = 0): Dimension | null {
  if (Math.hypot(x, y) < 0.3) return null;
  const a = Math.atan2(y, x) - roll;
  const toward12or6 = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a));
  return toward12or6 ? 'y' : 'x';
}

/** The neighbour a lean faces, within its own dimension, or null. */
export function neighbourFacing(neighbours: Neighbour[], x: number, y: number, roll = 0): Neighbour | null {
  const d = leanDimension(x, y, roll);
  if (!d) return null;
  const a = Math.atan2(y, x) - roll;
  let best: Neighbour | null = null;
  let off = Infinity;
  for (const n of neighbours) {
    if (n.dimension !== d) continue;
    const dd = Math.abs(Math.atan2(Math.sin(a - n.angle), Math.cos(a - n.angle)));
    if (dd < off) [best, off] = [n, dd];
  }
  return off < 0.7 ? best : null;
}
