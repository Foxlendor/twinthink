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

const BRANCH_NOTES = (data as { branches?: Record<string, string> }).branches ?? {};

const BRANCH_TITLES: Record<string, { title: string; kind: IdeaNode['kind'] }> = {
  surface: { title: 'the Twin page', kind: 'visual' },
  deploy: { title: 'staying online', kind: 'software' },
  engine: { title: 'the reality engine', kind: 'software' },
  graph: { title: 'structure', kind: 'software' },
  rights: { title: 'identity and rights', kind: 'software' },
  tooling: { title: 'tools for makers', kind: 'software' },
  disclosure: { title: 'what to show, what to keep', kind: 'theory' },
  mark: { title: 'the mark', kind: 'visual' },
  canvas: { title: 'the Canvas', kind: 'visual' },
};

const KIND_MAP: Record<Commit['k'], { kind: EventKind; note: string }> = {
  change: { kind: 'revision', note: 'changed' },
  repair: { kind: 'revision', note: 'repaired' },
  experiment: { kind: 'experiment', note: 'tested' },
  prune: { kind: 'prune', note: 'cut something away' },
};

const DAY = 86400000;

function sessionTitle(t: number) {
  const d = new Date(t);
  const h = d.getHours();
  const part = h < 5 ? 'late night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()}, ${part}`;
}

export function buildTwinThinkTwin(): IdeaNode {
  const commits = (data.commits as Commit[]).map((c) => ({ ...c, ms: Date.parse(c.t) }));
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
    const children: IdeaNode[] = sessions.map((sess) => {
      const s0 = sess[0].ms;
      return {
        id: `twinthink/${b}/${sess[0].h}`,
        title: sessionTitle(s0),
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
        artifact: {
          type: 'story',
          lines: sess.map((c) => ({ t: c.ms, text: c.d ?? KIND_MAP[c.k].note })),
        },
        x: 0,
        y: 0,
        r: 0.05,
        seed: hashString(sess[0].h),
      } satisfies IdeaNode;
    });

    // real content: what the Canvas actually looks like, captured from the build
    if (b === 'canvas') {
      const shot = (file: string, x: number, y: number, caption: string) => ({
        kind: 'image' as const,
        src: `/twinthink/${file}`,
        x,
        y,
        w: 0.46,
        aspect: 250 / 400,
        caption,
      });
      const captured = Date.parse('2026-09-25T17:02:00Z');
      children.push({
        id: 'twinthink/canvas/looks',
        title: 'what it looks like',
        note: 'the Canvas, captured from itself',
        kind: 'visual',
        origin: 'real',
        began: captured,
        events: [{ t: captured, kind: 'evidence', note: 'screenshots of the Canvas' }],
        state: 'alive',
        disclosure: 0,
        children: [],
        media: [
          shot('approach.jpg', -0.25, -0.34, 'approaching: an ink drop'),
          shot('inside.jpg', 0.26, -0.3, 'inside: the branches'),
          shot('branch.jpg', -0.27, 0.08, 'a branch and its sessions'),
          shot('session.jpg', 0.25, 0.12, 'a session, in words'),
        ],
        x: 0,
        y: 0,
        r: 0.05,
        seed: hashString('twinthink/canvas/looks'),
      });
    }

    const last = list[list.length - 1].ms;
    branches.push({
      id: `twinthink/${b}`,
      title: meta.title,
      note: BRANCH_NOTES[b],
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
    note: 'Give an idea a reality before the finished object exists.',
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
