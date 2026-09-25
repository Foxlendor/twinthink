import { DAY_MS, type FieldNode, type HistoryEvent, type LifeState } from './model';

/**
 * Continuity: evidence that somebody has lived with an idea.
 *
 * Everything here is derived from history events, never typed in by hand, so
 * the same derivation works for seeded data, existing Twin records, and live
 * activity. Popularity is deliberately a minor input: repeated return and
 * material change matter more than a count of people.
 */
export interface Continuity {
  began: number;
  lastChange: number;
  revisions: number;
  branches: number;
  deadEnds: number;
  creatorReturns: number;
  /** Seeded + recorded visits by other people (a Twin also carries a returners total). */
  visits: number;
  evidence: number;
  realized: boolean;
  stillChanging: boolean;
  life: LifeState;
  /** 0..1 — how alive it is right now. Drives the pulse, never a ranking. */
  vitality: number;
}

const CHANGE_EVENTS = new Set<HistoryEvent['type']>([
  'began',
  'revised',
  'branched',
  'returned',
  'evidence',
  'revived',
  'converged',
  'split',
  'realized',
]);

export function continuityOf(node: Pick<FieldNode, 'history' | 'evidence' | 'kind' | 'twin'>, now = Date.now()): Continuity {
  let began = node.twin ? Date.parse(node.twin.began) : Number.POSITIVE_INFINITY;
  let lastChange = Number.NEGATIVE_INFINITY;
  let revisions = 0;
  let branches = 0;
  let deadEnds = 0;
  let creatorReturns = 0;
  let visits = 0;
  let evidence = node.evidence.length;
  let realized = false;
  let lastRevived = Number.NEGATIVE_INFINITY;
  let lastDormant = Number.NEGATIVE_INFINITY;
  let lastConverged = Number.NEGATIVE_INFINITY;
  let recentBranches = 0;

  for (const event of node.history) {
    const at = Date.parse(event.at);
    if (!Number.isFinite(at)) continue;
    if (at < began) began = at;
    if (CHANGE_EVENTS.has(event.type) && at > lastChange) lastChange = at;
    switch (event.type) {
      case 'revised':
        revisions += 1;
        break;
      case 'branched':
      case 'split':
        branches += 1;
        if (now - at < 90 * DAY_MS) recentBranches += 1;
        break;
      case 'dead_end':
        deadEnds += 1;
        break;
      case 'returned':
        creatorReturns += 1;
        break;
      case 'visited':
        visits += 1;
        break;
      case 'evidence':
        evidence += 1;
        break;
      case 'realized':
        realized = true;
        break;
      case 'revived':
        lastRevived = Math.max(lastRevived, at);
        break;
      case 'dormant':
        lastDormant = Math.max(lastDormant, at);
        break;
      case 'converged':
        lastConverged = Math.max(lastConverged, at);
        break;
    }
  }

  if (!Number.isFinite(began)) began = now;
  if (!Number.isFinite(lastChange)) lastChange = began;

  const sinceChange = (now - lastChange) / DAY_MS;
  const age = Math.max(1, (now - began) / DAY_MS);
  const stillChanging = sinceChange < 45;

  let life: LifeState;
  if (node.kind === 'dead_end') life = 'ended';
  else if (realized) life = 'realized';
  else if (lastDormant > lastRevived && sinceChange > 60) life = 'dormant';
  else if (sinceChange > 200) life = 'dormant';
  else if (lastRevived > Number.NEGATIVE_INFINITY && now - lastRevived < 90 * DAY_MS) life = 'revived';
  else if (lastConverged > Number.NEGATIVE_INFINITY && now - lastConverged < 60 * DAY_MS) life = 'converging';
  else if (recentBranches >= 2) life = 'branching';
  else if (age < 21) life = 'new';
  else if (sinceChange < 30 && revisions + creatorReturns > 6) life = 'active';
  else life = 'growing';

  // Recency dominates; sustained density of change is the second signal.
  const recency = Math.exp(-sinceChange / 60);
  const density = Math.min(1, ((revisions + creatorReturns + branches * 2 + evidence) / Math.sqrt(age)) * 0.35);
  let vitality = recency * 0.62 + density * 0.38;
  if (life === 'dormant' || life === 'ended') vitality *= 0.35;

  return {
    began,
    lastChange,
    revisions,
    branches,
    deadEnds,
    creatorReturns,
    visits,
    evidence,
    realized,
    stillChanging,
    life,
    vitality: Math.max(0, Math.min(1, vitality)),
  };
}

export function ago(timestamp: number, now = Date.now()) {
  const days = Math.max(0, Math.round((now - timestamp) / DAY_MS));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return days + ' days ago';
  if (days < 365) return Math.max(1, Math.round(days / 30.4)) + ' months ago';
  const years = days / 365;
  return (years < 2 ? years.toFixed(1) : Math.round(years)) + ' years ago';
}

/** Human words for a life state. No scores, no tiers. */
export function lifeWords(life: LifeState) {
  switch (life) {
    case 'new':
      return 'just appeared';
    case 'growing':
      return 'growing';
    case 'active':
      return 'changing right now';
    case 'branching':
      return 'branching';
    case 'dormant':
      return 'resting';
    case 'revived':
      return 'came back to life';
    case 'converging':
      return 'threads coming together';
    case 'realized':
      return 'became a real thing';
    case 'ended':
      return 'a path that stopped here';
  }
}
