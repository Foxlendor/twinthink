// TwinThink's own Twin, built from the real git history of this repository.
// See scripts/build_twinthink_continuity.mjs. Only timestamps, short hashes,
// categories and event kinds are stored; commit messages are never included.

import data from './twinthink-continuity.json';
import { IdeaNode, LifeEvent, EventKind } from '../model';
import { hashString } from '../rng';

interface Commit {
  h: string;
  t: string;
  b: string;
  k: 'change' | 'repair' | 'experiment' | 'prune';
  /** Hand-written plain-language note (scripts/twinthink_notes.json). */
  d?: string;
}


// Each part is named for what it is for, cut from the project's own
// description of it (continuity.branches), never for how it is built.
const BRANCH_TITLES: Record<string, { title: string; kind: IdeaNode['kind'] }> = {
  surface: { title: 'how one idea is shown', kind: 'visual' },
  deploy: { title: 'staying online', kind: 'software' },
  engine: { title: 'proving what an idea does', kind: 'software' },
  graph: { title: 'what an object is made of', kind: 'software' },
  rights: { title: 'who owns an idea', kind: 'software' },
  tooling: { title: 'tools for makers', kind: 'software' },
  disclosure: { title: 'what to show, what to keep', kind: 'theory' },
  canvas: { title: 'this place', kind: 'visual' },
};

/** The name-and-logo work lives inside how one idea is shown: no ring is named after a logo. */
const FOLD: Record<string, string> = { mark: 'surface' };

const KIND_MAP: Record<Commit['k'], { kind: EventKind; note: string }> = {
  change: { kind: 'revision', note: 'changed' },
  repair: { kind: 'revision', note: 'repaired' },
  experiment: { kind: 'experiment', note: 'tested' },
  prune: { kind: 'prune', note: 'cut something away' },
};

const DAY = 86400000;

/** Minutes east of UTC written in a commit's own timestamp (e.g. -06:00 -> -360). */
function offsetOf(t: string): number | null {
  const m = /([+-])(\d\d):(\d\d)$/.exec(t);
  if (!m) return null;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * A working session named by the hours it was lived, on his own clock, never
 * by a date: "one morning", "all through the night", "back again, one evening".
 * The hour comes from each commit's own offset; commits stamped +00:00 were
 * made from a cloud machine, so they borrow his latest own-clock offset.
 */
function sessionTitle(first: { ms: number; off: number }, lastMs: number, back: boolean) {
  const h = new Date(first.ms + first.off * 60000).getUTCHours();
  const night = h >= 21 || h < 5;
  const long = lastMs - first.ms > 3 * 3600000;
  const base =
    long && night
      ? 'all through the night'
      : h < 5
        ? 'past midnight'
        : h < 12
          ? 'one morning'
          : h < 17
            ? 'one afternoon'
            : h < 21
              ? 'one evening'
              : 'one night';
  return back ? `back again, ${base}` : base;
}

export function buildTwinThinkTwin(): IdeaNode {
  let own = -360;
  const commits = (data.commits as Commit[]).map((c) => {
    const o = offsetOf(c.t);
    if (o !== null && o !== 0) own = o;
    return { ...c, b: FOLD[c.b] ?? c.b, ms: Date.parse(c.t), off: o === null || o === 0 ? own : o };
  });
  const began = commits[0].ms;
  const newest = commits[commits.length - 1].ms;

  const byBranch = new Map<string, typeof commits>();
  for (const c of commits) {
    if (!byBranch.has(c.b)) byBranch.set(c.b, []);
    byBranch.get(c.b)!.push(c);
  }

  const branches: IdeaNode[] = [];
  for (const [b, list] of byBranch) {
    const meta = BRANCH_TITLES[b] ?? { title: b, kind: 'unknown' as const };
    const events: LifeEvent[] = list.map((c, i) => ({
      t: c.ms,
      kind: i === 0 ? 'begin' : KIND_MAP[c.k].kind,
      note: c.d ?? (i === 0 ? 'first appeared' : KIND_MAP[c.k].note),
    }));
    // dormancy and return, where the history shows it
    for (let i = 1; i < list.length; i++) {
      if (list[i].ms - list[i - 1].ms > 10 * DAY) {
        events.push({ t: list[i - 1].ms + 1000, kind: 'dormant', note: 'went quiet' });
        events.push({ t: list[i].ms - 1000, kind: 'revival', note: 'came back to it' });
      }
    }
    events.sort((a, b2) => a.t - b2.t);

    // sessions: bursts of work separated by more than six hours
    const sessions: (typeof commits)[] = [];
    for (const c of list) {
      const cur = sessions[sessions.length - 1];
      if (cur && c.ms - cur[cur.length - 1].ms < 6 * 3600000) cur.push(c);
      else sessions.push([c]);
    }
    const children: IdeaNode[] = sessions.map((sess, k) => {
      const s0 = sess[0].ms;
      const back = k > 0 && s0 - sessions[k - 1][sessions[k - 1].length - 1].ms > 10 * DAY;
      return {
        id: `twinthink/${b}/${sess[0].h}`,
        title: sessionTitle(sess[0], sess[sess.length - 1].ms, back),
        kind: meta.kind,
        origin: 'real',
        began: s0,
        events: sess.map((c, i) => ({
          t: c.ms,
          kind: i === 0 ? 'begin' : KIND_MAP[c.k].kind,
          note: c.d ?? KIND_MAP[c.k].note,
        })),
        state: 'alive',
        disclosure: 0,
        children: [],
        x: 0,
        y: 0,
        r: 0.05,
        seed: hashString(sess[0].h),
      } satisfies IdeaNode;
    });

    const last = list[list.length - 1].ms;
    branches.push({
      id: `twinthink/${b}`,
      title: meta.title,
      kind: meta.kind,
      origin: 'real',
      began: list[0].ms,
      events,
      state: newest - last > 14 * DAY ? 'dormant' : 'alive',
      disclosure: 0,
      summarizes: true,
      children,
      x: 0,
      y: 0,
      r: 0.05,
      seed: hashString(b),
    });
  }

  return {
    id: 'twinthink',
    title: 'TwinThink',
    kind: 'software',
    origin: 'real',
    began,
    events: [{ t: began, kind: 'begin', note: 'first commit' }],
    state: 'alive',
    disclosure: 0,
    children: branches,
    x: 0.21,
    y: -0.14,
    r: 0.0025,
    fixed: true,
    seed: hashString('twinthink'),
  };
}
