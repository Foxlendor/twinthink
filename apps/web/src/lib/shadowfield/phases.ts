// Semantic phases: a thing shows more of itself as you come near.
//
// Far off it is only a presence (a mark in the web); nearer, its name; in
// front of you, its line and what it holds. A name comes in once it is near
// enough (ENTER) and only goes once it is clearly behind that (EXIT), so
// nothing flickers at the edge. And only a few names are ever written at
// once: depth should lighten what you have to hold in mind, not add to it.

/** How near (0..1) a thing must come for its name to appear, and how far it must fall back for it to go. */
export const ENTER = 0.42;
export const EXIT = 0.28;

/** At most this many names at once (the thing in front of you always among them). */
export const NAME_BUDGET = 5;

export interface Phase {
  /** Whether its name is in. */
  on: boolean;
  /** How present its name is now (eases toward on or off). */
  a: number;
}

/** One frame of a thing's name phase, from how near it is (0..1). */
export function stepPhase(p: Phase | undefined, near: number, dt: number): Phase {
  const on = p ? (p.on ? near > EXIT : near >= ENTER) : near >= ENTER;
  const from = p?.a ?? (on ? 1 : 0);
  // in quickly and decisively, out a little more gently
  const rate = on ? 9 : 5;
  const a = from + ((on ? 1 : 0) - from) * (1 - Math.exp(-rate * Math.max(0, dt)));
  return { on, a: Math.abs(a - (on ? 1 : 0)) < 1e-3 ? (on ? 1 : 0) : a };
}

/**
 * Which names are written: the nearest first, up to the budget; the thing in
 * front of you always.
 */
export function withinBudget<T extends { near: number; here?: boolean }>(names: T[], budget = NAME_BUDGET): T[] {
  const sorted = [...names].sort((a, b) => Number(!!b.here) - Number(!!a.here) || b.near - a.near);
  return sorted.slice(0, budget);
}
