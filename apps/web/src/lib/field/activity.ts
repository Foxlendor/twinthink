import type { ViewerRelation } from './disclosure';
import type { ViewerContext } from './source';

/**
 * Genuine activity by the person using this device.
 *
 * This is the only 'live' data in the prototype, and it is kept apart from
 * seeded records on purpose: the UI labels it as yours. When accounts exist,
 * the same shape moves server-side (backs and returns become Twin history
 * events owned by an identity).
 */

const BACKS_KEY = 'twinthink-field-backs-v1';
const RETURNS_KEY = 'twinthink-field-returns-v1';

export interface LocalActivity {
  backs: Record<string, string>; // twinId -> ISO time backed
  returns: Record<string, string[]>; // twinId -> distinct days entered (YYYY-MM-DD)
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode). Activity then lasts for the visit.
  }
}

export function loadActivity(): LocalActivity {
  return {
    backs: read<Record<string, string>>(BACKS_KEY, {}),
    returns: read<Record<string, string[]>>(RETURNS_KEY, {}),
  };
}

export function withBack(activity: LocalActivity, twinId: string, now = new Date()): LocalActivity {
  if (activity.backs[twinId]) return activity;
  const next = { ...activity, backs: { ...activity.backs, [twinId]: now.toISOString() } };
  write(BACKS_KEY, next.backs);
  return next;
}

/** Record that the viewer entered a Twin today. Returns the same object when nothing changed. */
export function withEntry(activity: LocalActivity, twinId: string, now = new Date()): LocalActivity {
  const day = now.toISOString().slice(0, 10);
  const days = activity.returns[twinId] ?? [];
  if (days.includes(day)) return activity;
  const next = { ...activity, returns: { ...activity.returns, [twinId]: [...days, day].slice(-60) } };
  write(RETURNS_KEY, next.returns);
  return next;
}

export function relationFrom(activity: LocalActivity, twinId: string): ViewerRelation {
  const days = activity.returns[twinId]?.length ?? 0;
  return {
    isCreator: false,
    backed: Boolean(activity.backs[twinId]),
    // The first day is discovery, not a return.
    returnDays: Math.max(0, days - 1),
  };
}

export function viewerFrom(activity: LocalActivity): ViewerContext {
  return { relationTo: (twinId) => relationFrom(activity, twinId) };
}
