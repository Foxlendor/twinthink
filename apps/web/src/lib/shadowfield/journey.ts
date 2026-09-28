// Your Fall, in order: where you stopped and what you chose, one visit at a time, kept on this
// device only. It is what a recap replays ("Your Fall"), and a way back to a path left open.
//
// Semantic steps only (never camera frames, timing of hesitation, or anything inferred): a place
// you stayed with, or a path you chose, with the hour you had turned into, and the other ways that
// were actually open to you there at that moment. Nothing here is ever sent anywhere. Older
// records that only kept sets (explored paths) are not given an order they never had.

export interface Step {
  /** When (ms). Kept for order, never shown as a number. */
  t: number;
  /** The thing (stable content id). */
  at: string;
  /** Stayed with it, or chose it among several paths. */
  how: 'stay' | 'choose';
  /** The hour turned into at the time (0 to 3), if any. */
  hour?: number;
  /** The other ways that were open here, then (ids only, already limited to what you could enter). */
  open?: string[];
}

export interface Journey {
  id: string;
  began: number;
  steps: Step[];
}

export interface Journeys {
  current: Journey;
  /** The Falls before this one, newest first. */
  past: Journey[];
}

export const JOURNEY_KEY = 'twinthink.journeys.v1';
const MAX_STEPS = 300;
const MAX_PAST = 5;

const newJourney = (now: number): Journey => ({ id: `${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`, began: now, steps: [] });

const cleanStep = (x: unknown): Step | null => {
  const s = x as Partial<Step> | null;
  if (!s || typeof s.at !== 'string' || typeof s.t !== 'number' || (s.how !== 'stay' && s.how !== 'choose')) return null;
  return {
    t: s.t,
    at: s.at,
    how: s.how,
    ...(typeof s.hour === 'number' && s.hour >= 0 && s.hour <= 3 ? { hour: s.hour } : {}),
    ...(Array.isArray(s.open) ? { open: s.open.filter((o): o is string => typeof o === 'string').slice(0, 12) } : {}),
  };
};

const cleanJourney = (x: unknown): Journey | null => {
  const j = x as Partial<Journey> | null;
  if (!j || typeof j.id !== 'string' || typeof j.began !== 'number' || !Array.isArray(j.steps)) return null;
  return { id: j.id, began: j.began, steps: j.steps.map(cleanStep).filter((s): s is Step => !!s).slice(-MAX_STEPS) };
};

/** A new visit begins a new Fall; the last one (if it went anywhere) joins the ones before. */
export function beginJourney(storage: Pick<Storage, 'getItem'> | null, now: number): Journeys {
  let past: Journey[] = [];
  try {
    const raw = storage?.getItem(JOURNEY_KEY);
    if (raw) {
      const d = JSON.parse(raw) as { current?: unknown; past?: unknown };
      const cur = cleanJourney(d.current);
      past = (Array.isArray(d.past) ? d.past.map(cleanJourney).filter((j): j is Journey => !!j) : []).slice(0, MAX_PAST);
      if (cur && cur.steps.length) past = [cur, ...past].slice(0, MAX_PAST);
    }
  } catch {
    past = [];
  }
  return { current: newJourney(now), past };
}

export function writeJourneys(storage: Pick<Storage, 'setItem'> | null, j: Journeys) {
  try {
    storage?.setItem(JOURNEY_KEY, JSON.stringify(j));
  } catch {
    // no room, or not allowed: this Fall is remembered for this visit only
  }
}

/** One more step. Staying again with the thing you just stayed with is not a new step. */
export function addStep(j: Journeys, step: Step): Journeys {
  const steps = j.current.steps;
  const last = steps[steps.length - 1];
  if (last && last.at === step.at && last.how === step.how) return j;
  return { ...j, current: { ...j.current, steps: [...steps, step].slice(-MAX_STEPS) } };
}

/** Forget every Fall kept here. */
export function forgetJourneys(now: number): Journeys {
  return { current: newJourney(now), past: [] };
}

export interface Recap {
  /** The route, in the order it happened (consecutive repeats folded). */
  route: Step[];
  /**
   * A path left open: offered to you somewhere on this Fall, still open to you now, and never
   * reached on it. The most recent such one (the freshest turn not taken). Null if there is none.
   */
  leftOpen: { id: string; at: string } | null;
}

/**
 * What a recap shows, derived only from the recorded steps. `mayEnter` is checked now, at showing
 * time: something that has since become closed to you is never offered, or named.
 */
export function recapOf(journey: Journey, mayEnter: (id: string) => boolean): Recap {
  const route: Step[] = [];
  for (const s of journey.steps) if (route[route.length - 1]?.at !== s.at) route.push(s);
  const reached = new Set(journey.steps.map((s) => s.at));
  let leftOpen: Recap['leftOpen'] = null;
  for (let i = journey.steps.length - 1; i >= 0 && !leftOpen; i--) {
    const s = journey.steps[i];
    for (const o of s.open ?? []) {
      if (!reached.has(o) && mayEnter(o)) {
        leftOpen = { id: o, at: s.at };
        break;
      }
    }
  }
  return { route, leftOpen };
}
