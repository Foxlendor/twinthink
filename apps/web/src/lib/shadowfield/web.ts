// The web that moves.
//
// A spider knows there is food because the web moves. Here, the ink web
// trembles where something is waiting that concerns you, so you feel it
// before you see it: work built on yours, or on something you kept; new work
// by a maker you stayed with; answers to today's word; and, more faintly,
// whatever is new since you were last here. Views and popularity never move
// it. Nothing about what you looked at leaves your device.
//
// Pure (no DOM): what counts as food, when the web is plucked, and how a
// pluck travels toward you.

import { hash01 } from './rng';

export const WEB_KEY = 'twinthink.web.v1';
/** How long away before this counts as a new visit (ms). */
export const VISIT_GAP = 30 * 60 * 1000;
/**
 * What this device keeps (the core's 'device' keeper): each trace a list of keys, newest last,
 * and at most this many. Ids and times only; never sent anywhere.
 *
 *   seen    food already found (so it no longer trembles)
 *   makers  makers (by their key) whose ring you stayed in, or kept from
 *   passed  forks come near but not entered: a way back to a turn not yet taken
 *   leaned  a deliberate choice at a branch, as `parentId\u0000childId`: one per parent, a later
 *           choice there replaces it, and never made from simply passing through
 */
export const DEVICE = { seen: 600, makers: 60, passed: 60, leaned: 60, explored: 300, turned: 120, dew: 400, drop: 400 } as const;
export type DeviceTrace = keyof typeof DEVICE;
const TRACES = Object.keys(DEVICE) as DeviceTrace[];

/** What this device remembers: when you were here, and its traces. */
export type WebMemory = {
  /** When the visit before this one ended (0: this is the first). */
  since: number;
  /** When this device was last here. */
  left: number;
} & Record<DeviceTrace, string[]>;

export function emptyMemory(): WebMemory {
  return { since: 0, left: 0, ...(Object.fromEntries(TRACES.map((t) => [t, [] as string[]])) as Record<DeviceTrace, string[]>) };
}

export function readMemory(storage: Pick<Storage, 'getItem'> | null): WebMemory {
  try {
    const raw = storage?.getItem(WEB_KEY);
    if (!raw) return emptyMemory();
    const m = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const out = emptyMemory();
    out.since = typeof m.since === 'number' ? m.since : 0;
    out.left = typeof m.left === 'number' ? m.left : 0;
    for (const t of TRACES) {
      const list = m[t];
      out[t] = Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(-DEVICE[t]) : [];
    }
    return out;
  } catch {
    return emptyMemory();
  }
}

export function writeMemory(storage: Pick<Storage, 'setItem'> | null, m: WebMemory) {
  try {
    const out: Record<string, unknown> = { since: m.since, left: m.left };
    for (const t of TRACES) out[t] = m[t].slice(-DEVICE[t]);
    storage?.setItem(WEB_KEY, JSON.stringify(out));
  } catch {
    // no room, or not allowed: the web simply forgets
  }
}

/** Arriving: if you were away long enough, what is new is measured from when you last left. */
export function beginVisit(m: WebMemory, now: number): WebMemory {
  if (m.left === 0) return { ...m, since: 0, left: now };
  if (now - m.left > VISIT_GAP) return { ...m, since: m.left, left: now };
  return { ...m, left: now };
}

export function remember(list: string[], id: string, max: number) {
  return list.includes(id) ? list : [...list, id].slice(-max);
}

/** Keep a key under one of this device's traces. A key `place\u0000choice` replaces any earlier choice at that place. */
export function keepOnDevice(m: WebMemory, trace: DeviceTrace, key: string): WebMemory {
  const cut = key.indexOf('\u0000');
  const list = cut < 0 ? m[trace] : m[trace].filter((e) => !e.startsWith(key.slice(0, cut + 1)));
  return { ...m, [trace]: remember(list, key, DEVICE[trace]) };
}

/** Let a key go (a turn not yet taken, once it is taken). */
export function forgetOnDevice(m: WebMemory, trace: DeviceTrace, key: string): WebMemory {
  return { ...m, [trace]: m[trace].filter((e) => e !== key) };
}

/** Which child was chosen at this parent, last time (null if none was, or it wasn't a real branch). */
export function leanedChildOf(m: WebMemory, parentId: string): string | null {
  const prefix = parentId + '\u0000';
  const e = m.leaned.find((x) => x.startsWith(prefix));
  return e ? e.slice(prefix.length) : null;
}

/** Every path taken from a place, not only the last. */
export function exploredFrom(m: WebMemory, parentId: string): Set<string> {
  const prefix = parentId + '\u0001';
  return new Set(m.explored.filter((x) => x.startsWith(prefix)).map((x) => x.slice(prefix.length)));
}

/** The hours turned into in a place (a group's id, or '' for the Slate). */
export function turnedIn(m: WebMemory, where: string | null): Set<number> {
  const prefix = (where ?? '') + '\u0001';
  return new Set(m.turned.filter((x) => x.startsWith(prefix)).map((x) => Number(x.slice(prefix.length))));
}

/** Posted work, as the Canvas receives it (only what food needs). */
export interface PostedLike {
  id: string;
  public: boolean;
  mine: boolean;
  created: number;
  from?: string | null;
  maker?: string;
  day?: string | null;
  hidden?: boolean;
}

export type FoodWhy = 'built-on-yours' | 'built-on-kept' | 'maker' | 'today' | 'new';

export interface Food {
  /** The Canvas id of what is waiting. */
  id: string;
  /** How hard it plucks the web (0..1). */
  strength: number;
  /** Rose, when it is about something of yours. */
  rose: boolean;
  why: FoodWhy;
}

const STRENGTH: Record<FoodWhy, number> = {
  'built-on-yours': 0.9,
  'built-on-kept': 0.75,
  maker: 0.6,
  today: 0.6,
  new: 0.3,
};

/** At most this many things tremble at once: more would only be noise. */
export const FOOD_MAX = 12;

/**
 * What is waiting for you. `posted` is shared and your own work; `keeps` your
 * sketchbook (Canvas ids); `fresh` other things on the Canvas with when they
 * began (for "new since you were here"), `open(id)` whether it may be seen at
 * all (never sealed, hidden or on a device).
 */
export function findFood(input: {
  posted: PostedLike[];
  keeps: string[];
  memory: WebMemory;
  today: string;
  fresh?: { id: string; began: number; ring?: string }[];
  open: (id: string) => boolean;
}): Food[] {
  const { posted, keeps, memory, today } = input;
  const seen = new Set(memory.seen);
  const mine = new Set(posted.filter((p) => p.mine).map((p) => p.id));
  const kept = new Set(keeps.filter((k) => k.startsWith('p/')).map((k) => k.slice(2)));
  const makers = new Set(memory.makers);
  const best = new Map<string, Food>();
  const offer = (id: string, why: FoodWhy) => {
    if (seen.has(id) || !input.open(id)) return;
    const f = { id, strength: STRENGTH[why], rose: why === 'built-on-yours' || why === 'built-on-kept', why };
    const had = best.get(id);
    if (!had || had.strength < f.strength) best.set(id, f);
  };
  for (const p of posted) {
    if (p.mine || !p.public || p.hidden) continue;
    const id = `p/${p.id}`;
    if (p.from && mine.has(p.from)) offer(id, 'built-on-yours');
    else if (p.from && kept.has(p.from)) offer(id, 'built-on-kept');
    if (p.maker && makers.has(p.maker) && p.created > memory.since) offer(id, 'maker');
    if (p.day === today) offer(id, 'today');
    if (memory.since > 0 && p.created > memory.since) offer(id, 'new');
  }
  // what else is new since you were here: faintly, and a ring with a lot new trembles once at its gate
  if (memory.since > 0) {
    const byRing = new Map<string, string[]>();
    for (const f of input.fresh ?? []) {
      if (f.began <= memory.since || !input.open(f.id)) continue;
      const k = f.ring ?? f.id;
      byRing.set(k, [...(byRing.get(k) ?? []), f.id]);
    }
    for (const [ring, ids] of byRing) {
      if (ids.length > 3) offer(ring, 'new');
      else for (const id of ids) offer(id, 'new');
    }
  }
  return [...best.values()].sort((a, b) => b.strength - a.strength).slice(0, FOOD_MAX);
}

/** When a food plucks the web, in seconds after it was found: often at first, then a slow hum. */
export const PLUCKS = [0, 2.5, 5, 10, 20, 40];
export const HUM = 30;

/** The pluck times for one food found at `found` (seconds), up to `until`. */
export function plucksFor(id: string, found: number, until: number): number[] {
  const off = hash01(hashId(id), 3) * 1.5;
  const out: number[] = [];
  for (const p of PLUCKS) {
    const t = found + off + p;
    if (t <= until) out.push(t);
  }
  for (let t = found + off + PLUCKS[PLUCKS.length - 1] + HUM; t <= until; t += HUM) out.push(t);
  return out;
}

/** How fast a pluck travels along the web toward you (track units per second). */
export const WAVE_SPEED = 7;

/**
 * The web's trembling at distance `d` (track units, from the food toward you)
 * at time `t` for a pluck at `t0` of strength `a`: a quick shiver that
 * travels to you and dies away.
 */
export function wave(a: number, d: number, t: number, t0: number): number {
  const tau = t - t0 - Math.abs(d) / WAVE_SPEED;
  if (tau < 0 || tau > 1.2) return 0;
  return a * Math.exp(-Math.abs(d) / 6) * Math.sin(2 * Math.PI * 8 * tau) * Math.exp(-5 * tau);
}

/** A stable number for an id. */
export function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A pluck under way: where (the food's place along the track, ahead of you), when, how hard, whether rose. */
export interface Pluck {
  id: string;
  z: number;
  t0: number;
  a: number;
  rose: boolean;
}

/** At most three plucks at a time, and together never too strong. */
export function admitPlucks(live: Pluck[], now: number): Pluck[] {
  const active = live.filter((p) => now - p.t0 < 3).sort((a, b) => b.t0 - a.t0);
  const out: Pluck[] = [];
  let total = 0;
  for (const p of active) {
    if (out.length >= 3 || total + p.a > 1.2) continue;
    out.push(p);
    total += p.a;
  }
  return out;
}

/**
 * The web's trembling at place z along the track now, from all plucks under
 * way, while the camera is at `camZ`. Returns the displacement and whether
 * the strongest part of it is rose.
 */
export function trembleAt(plucks: Pluck[], z: number, camZ: number, now: number): { T: number; rose: boolean } {
  let T = 0;
  let rose = false;
  let most = 0;
  for (const p of plucks) {
    // the wave runs from the food back toward you: only the stretch between you and it
    const d = p.z - z;
    if (z < camZ - 0.2 || d < -0.5) continue;
    const w = wave(p.a, d, now, p.t0);
    T += w;
    if (Math.abs(w) > most) {
      most = Math.abs(w);
      rose = p.rose;
    }
  }
  return { T, rose };
}

/** The latest pluck time at or before `now` for a food found at `found` (undefined before the first). */
export function lastPluck(id: string, found: number, now: number): number | undefined {
  const off = hash01(hashId(id), 3) * 1.5;
  const since = now - (found + off);
  if (since < 0) return undefined;
  const last = PLUCKS[PLUCKS.length - 1];
  if (since < last) {
    let t = 0;
    for (const p of PLUCKS) if (p <= since) t = p;
    return found + off + t;
  }
  return found + off + last + Math.floor((since - last) / HUM) * HUM;
}
