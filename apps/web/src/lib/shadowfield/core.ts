// The core the Slate is built from.
//
// A person falls through things made in time, and what they do leaves traces that are felt,
// never counted. Everything on the Slate is made of five parts, and a new idea is one more of
// one of them:
//
//   thing   something made, at a moment. The moment is both its hour on the clock face and its
//           depth in the fall: newest first, older deeper.              (model.ts, flight.ts)
//   lens    which things this fall holds: what this viewer may see, a replay's moment, the
//           hour turned into. Any one reason is enough to leave a thing out.   (lensOf, below)
//   move    the only way anything changes: arrive, stay, choose, turn back, turn.  (Move, below)
//   keeper  where a move's trace lives, declared once per trace: this device, anonymous, or
//           shared live. Nothing a fall leaves is kept anywhere else.         (RULES, below)
//   mark    how a trace is felt: dew, "something is gathering", a glint, a rose fleck, an hour
//           written darker. Never a number.                               (flightRender.ts)
//
// A new idea should cost one row in RULES, one lens, or one mark. If it is none of these, it
// needs a sixth part, and that is a decision, not a detail. (Making things, and a maker's own
// decisions about them, such as posting, opening a fork or answering Rabi, are things and
// actions the server keeps under its own rules: store.ts. This is the fall.)
//
// Pure (no DOM): the page reports what is in front of you each frame and the moves it sees; the
// core decides what is kept, and hands each trace to the page's keepers.

import type { IdeaNode } from './model';
import { quarterOf, type Quarter, type Station } from './flight';

// ---------------------------------------------------------------------------
// Moves.

export type Move =
  /** Something came in front of you. */
  | { kind: 'arrive'; at: Station }
  /** You are with it, not moving: still this long, and this long since it came in front of you (ms). */
  | { kind: 'stay'; at: Station; still: number; since: number }
  /** Out of sequence, you picked one of several paths (never from simply passing through). */
  | { kind: 'choose'; from: IdeaNode; to: IdeaNode }
  /** You reached the end of a fork and went back out of it. */
  | { kind: 'turnBack'; from: IdeaNode }
  /** You turned toward an hour (null: back to the whole of the fall), in a group (null: on the Slate). */
  | { kind: 'turn'; hour: Quarter | null; where: string | null }
  /** Said of a thing: I would carry this forward (Dew), or I would not (Drop). */
  | { kind: 'react'; at: IdeaNode; carry: boolean };

// ---------------------------------------------------------------------------
// Keepers and rules.

/** Where a trace lives. Every trace names exactly one. */
export type Keeper =
  /** This device only: ids and times, never sent anywhere (web.ts). */
  | 'device'
  /** The server, as a one-way mark of who and the day, gathered, never shown as a number. */
  | 'anonymous'
  /** The server, overwritten in place while it lasts (a shared Fall's current place). */
  | 'live';

/** What the page knows that the rules need (and nothing more). */
export interface Context {
  /** Whether something is waiting for this viewer (it trembles on the web). */
  waiting: (id: string) => boolean;
}

export interface Rule {
  /** The trace it leaves, and who keeps it. */
  trace: string;
  keeper: Keeper;
  /** Keeping it, or letting it go (a turn not taken is let go once it is taken). */
  forget?: boolean;
  /** The move that leaves it. */
  on: Move['kind'];
  /** Whether this move leaves it. */
  when: (m: Move, c: Context) => boolean;
  /** What it is kept under. */
  key: (m: Move) => string;
  /** At most once each time something comes in front of you, once a visit, or every time. */
  once: 'arrival' | 'visit' | 'always';
}

const at = (m: Move) => (m.kind === 'arrive' || m.kind === 'stay' ? m.at : null);
/** Still with it this long (ms), counted from when you last stopped moving. */
const stilled = (m: Move, ms: number) => m.kind === 'stay' && m.still >= ms;
/** With it this long (ms) since it came in front of you, and not moving now. */
const stayed = (m: Move, ms: number) => m.kind === 'stay' && m.since >= ms;
/** What may leave a trace outside this device: on the Slate for anyone (not a device's own, a keep, or sealed). */
const shared = (s: Station) =>
  !s.node.id.startsWith('local/') && !s.node.id.startsWith('k/') && !s.path.some((n) => n.disclosure > 0 || n.id.startsWith('sample/'));
/** The fork a thing is inside (not the gate itself). */
const forkAround = (s: Station) => s.path.find((n) => n.id.startsWith('fork/') && n.id !== s.node.id);

/**
 * The spine. Every trace the Slate keeps is one row: on this move, when this holds, keep this,
 * with this keeper. Read top to bottom, this is everything a fall leaves behind.
 */
export const RULES: Rule[] = [
  {
    // found: staying a moment with something waiting for you settles its trembling
    trace: 'seen',
    keeper: 'device',
    on: 'stay',
    when: (m, c) => stilled(m, 1200) && c.waiting(at(m)!.node.id),
    key: (m) => at(m)!.node.id,
    once: 'arrival',
  },
  {
    // a maker whose ring you stayed in: their new work will stir the web
    trace: 'makers',
    keeper: 'device',
    on: 'stay',
    when: (m) => stayed(m, 1500) && at(m)!.node.id.startsWith('maker/'),
    key: (m) => at(m)!.node.id.slice('maker/'.length),
    once: 'arrival',
  },
  {
    // a fork paused at, not entered: a way back to it, if it was left for later
    trace: 'passed',
    keeper: 'device',
    on: 'stay',
    when: (m) => stayed(m, 1200) && at(m)!.node.id.startsWith('fork/'),
    key: (m) => at(m)!.node.id,
    once: 'arrival',
  },
  {
    // truly inside a fork (looking at something it holds): it is no longer a turn not taken
    trace: 'passed',
    keeper: 'device',
    forget: true,
    on: 'arrive',
    when: (m) => !!forkAround(at(m)!),
    key: (m) => forkAround(at(m)!)!.id,
    once: 'arrival',
  },
  {
    // staying with something a while is part of its resonance: a mark of the day, nothing more
    trace: 'resonance',
    keeper: 'anonymous',
    on: 'stay',
    when: (m) => stilled(m, 3000) && at(m)!.depth > 0 && shared(at(m)!),
    key: (m) => at(m)!.node.id,
    once: 'visit',
  },
  {
    // many separate falls reaching the same wall and turning back: pressure
    trace: 'pressure',
    keeper: 'anonymous',
    on: 'turnBack',
    when: () => true,
    key: (m) => (m.kind === 'turnBack' ? m.from.id : ''),
    once: 'visit',
  },
  {
    // a deliberate pick among several paths: a Lean (one per place; a later one replaces it)
    trace: 'leaned',
    keeper: 'device',
    on: 'choose',
    when: (m) => m.kind === 'choose' && m.from.children.length >= 2,
    key: (m) => (m.kind === 'choose' ? `${m.from.id}\u0000${m.to.id}` : ''),
    once: 'always',
  },
  {
    // every path chosen at a branch, kept alongside the last one: a record of what you explored
    trace: 'explored',
    keeper: 'device',
    on: 'choose',
    when: (m) => m.kind === 'choose' && m.from.children.length >= 2,
    key: (m) => (m.kind === 'choose' ? `${m.from.id}\u0001${m.to.id}` : ''),
    once: 'always',
  },
  {
    // an hour turned into, in a place: a way back to it, and to the hours not taken there
    trace: 'turned',
    keeper: 'device',
    on: 'turn',
    when: (m) => m.kind === 'turn' && m.hour !== null,
    key: (m) => (m.kind === 'turn' ? `${m.where ?? ''}\u0001${m.hour}` : ''),
    once: 'always',
  },
  // your Fall, in order (journey.ts): a place stayed with, and a path chosen. On this device only;
  // the page adds the hour you had turned into and the other ways open there, and nothing else
  {
    trace: 'journey',
    keeper: 'device',
    on: 'stay',
    when: (m) => stayed(m, 1200) && at(m)!.depth > 0,
    key: (m) => at(m)!.node.id,
    once: 'arrival',
  },
  {
    trace: 'journey',
    keeper: 'device',
    on: 'choose',
    when: () => true,
    key: (m) => (m.kind === 'choose' ? m.to.id : ''),
    once: 'always',
  },
  // Dew and Drop: said, never inferred from passing, leaving or not choosing. One or the other.
  // Kept on this device only for now: who else may see them is not yet decided (spec D-07).
  ...(['dew', 'drop'] as const).flatMap((trace): Rule[] => [
    {
      trace,
      keeper: 'device',
      on: 'react',
      when: (m) => m.kind === 'react' && m.carry === (trace === 'dew'),
      key: (m) => (m.kind === 'react' ? m.at.id : ''),
      once: 'always',
    },
    {
      trace: trace === 'dew' ? 'drop' : 'dew',
      keeper: 'device',
      forget: true,
      on: 'react',
      when: (m) => m.kind === 'react' && m.carry === (trace === 'dew'),
      key: (m) => (m.kind === 'react' ? m.at.id : ''),
      once: 'always',
    },
  ]),
  {
    // in a shared Fall, where its leader has stopped is where the Fall is (kept only if leading)
    trace: 'station',
    keeper: 'live',
    on: 'stay',
    when: (m) => stilled(m, 400),
    key: (m) => at(m)!.node.id,
    once: 'arrival',
  },
];

// ---------------------------------------------------------------------------
// The core at work.

export interface Core {
  /** A move seen by the page (choose, turn back, turn). */
  move: (m: Move) => void;
  /** Each frame: what is in front of you, and whether you are still (not flying, not held). */
  frame: (here: Station | null, still: boolean, now: number) => void;
}

/**
 * The core for one visit: turns what is in front of you into arrivals and stays, runs every move
 * past the rules, and hands each trace to `keep` (the page's keepers), at most as often as its
 * rule allows.
 */
export function createCore(context: Context, keep: (rule: Rule, key: string, m: Move) => void, rules: Rule[] = RULES): Core {
  let here: string | null = null;
  let arrived = 0;
  let stillSince = 0;
  const thisArrival = new Set<Rule>();
  const thisVisit = new Map<Rule, Set<string>>();
  const move = (m: Move) => {
    for (const r of rules) {
      if (r.on !== m.kind || !r.when(m, context)) continue;
      const key = r.key(m);
      if (r.once === 'arrival') {
        if (thisArrival.has(r)) continue;
        thisArrival.add(r);
      } else if (r.once === 'visit') {
        const kept = thisVisit.get(r) ?? new Set<string>();
        if (kept.has(key)) continue;
        kept.add(key);
        thisVisit.set(r, kept);
      }
      keep(r, key, m);
    }
  };
  return {
    move,
    frame(at, still, now) {
      const id = at?.node.id ?? null;
      if (id !== here) {
        here = id;
        arrived = now;
        stillSince = now;
        thisArrival.clear();
        if (at) move({ kind: 'arrive', at });
      }
      if (!at) return;
      if (!still) {
        stillSince = now;
        return;
      }
      move({ kind: 'stay', at, still: now - stillSince, since: now - arrived });
    },
  };
}

// ---------------------------------------------------------------------------
// Lenses: each a reason a thing is not in this fall.

export type Hide = (s: Station) => boolean;

/** A fall's lens: any one of its reasons is enough to leave a thing out. */
export const lensOf =
  (...reasons: Hide[]): Hide =>
  (s) =>
    reasons.some((r) => r(s));

/** A replay's moment: nothing made after it (the Canvas itself always). */
export const replayLens =
  (cut: number | null): Hide =>
  (s) =>
    cut !== null && s.depth > 0 && s.node.began > cut;

/**
 * Where you are. On the Slate, you fall past its groups (a maker's songs, his dancing, a Twin
 * and what grew from it), never into what is inside them by chance. Inside one, the fall holds
 * only that group, and its end brings you back up to the Slate, not on into whatever group
 * happens to be next in time.
 */
export const groupLens =
  (inside: string | null): Hide =>
  (s) =>
    s.depth > 0 && (inside === null ? s.depth > 1 : s.path[1].id !== inside);

/** The group (or thing on the Slate) something belongs to; null for the Slate itself. */
export const groupOf = (s: Station) => (s.depth > 0 ? s.path[1].id : null);

const holds = new WeakMap<IdeaNode, number>();
/** Which hours a group holds work from (a bit for each quarter). */
function hoursIn(n: IdeaNode): number {
  const known = holds.get(n);
  if (known !== undefined) return known;
  const kids = n.children.filter((c) => !c.portal && !c.void);
  const bits = kids.length ? kids.reduce((b, c) => b | hoursIn(c), 0) : 1 << quarterOf(n.began);
  holds.set(n, bits);
  return bits;
}

/**
 * The hour turned into: only things made around it, falling through them one after another.
 * On the Slate, only the groups holding work from around that hour; inside one, rings within it
 * are passed through, not stopped at. (The Slate itself always.)
 */
export const hourLens =
  (hour: Quarter | null): Hide =>
  (s) =>
    hour !== null &&
    s.depth > 0 &&
    (s.depth === 1 && s.gate ? (hoursIn(s.node) & (1 << hour)) === 0 : s.gate || quarterOf(s.t) !== hour);
