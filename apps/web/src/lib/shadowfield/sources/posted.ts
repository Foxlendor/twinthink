// Shadows people have posted (kept on the server). Public ones join everyone's
// Canvas in one ring; a signed-in maker also sees their own, public or not.

import { IdeaNode } from '../model';
import { hashString } from '../rng';

export interface Posted {
  id: string;
  by: string;
  title: string;
  body: string;
  public: boolean;
  created: number;
  updated: number;
  mine: boolean;
  /** A story is told without a name; ideas it sparks remember it. */
  kind?: 'shadow' | 'story';
  from?: string | null;
  sparks?: number;
  /** Yours, taken down: only you see it. */
  hidden?: boolean;
}

function lineFor(p: Posted) {
  if (p.mine && p.hidden) return 'yours, taken down; only you can see it now.';
  if (p.kind === 'story') {
    if (p.mine) return 'yours, told without your name.';
    const n = p.sparks ?? 0;
    return n ? `told without a name. it has sparked ${n === 1 ? 'an idea' : `${n} ideas`}.` : 'told without a name.';
  }
  const who = p.mine ? (p.public ? 'yours, shared with everyone.' : 'yours, only you can see it.') : `by ${p.by}.`;
  return p.from ? `${who} sparked by a story.` : who;
}

function node(p: Posted, i: number): IdeaNode {
  return {
    id: `p/${p.id}`,
    title: p.title,
    kind: 'unknown',
    origin: 'real',
    began: p.created,
    events: [
      { t: p.created, kind: 'begin', note: 'posted' },
      ...(p.updated > p.created + 1000 ? [{ t: p.updated, kind: 'revision' as const, note: 'changed' }] : []),
    ],
    state: 'alive',
    disclosure: 0,
    children: [],
    artifact: p.body ? { type: 'text', body: p.body } : undefined,
    line: lineFor(p),
    x: Math.cos(i * 2.39996) * 0.5,
    y: Math.sin(i * 2.39996) * 0.5,
    r: 0.05,
    seed: hashString(p.id),
  };
}

function ring(id: string, title: string, line: string, kids: IdeaNode[], x: number, y: number): IdeaNode {
  const first = kids.reduce((t, k) => Math.min(t, k.began), Date.now());
  return {
    id,
    title,
    line,
    kind: 'unknown',
    origin: 'real',
    began: first,
    events: [{ t: first, kind: 'begin', note: 'first posted' }],
    state: 'alive',
    disclosure: 0,
    children: kids,
    x,
    y,
    r: 0.0025,
    fixed: true,
    seed: hashString(id),
  };
}

/** The rings for posted work: everyone's public Shadows, and (signed in) your own. */
export function buildPosted(pub: Posted[], mine: Posted[]): IdeaNode[] {
  const out: IdeaNode[] = [];
  const isStory = (p: Posted) => p.kind === 'story';
  const stories = [...mine.filter(isStory), ...pub.filter((p) => isStory(p) && !p.mine)].sort((a, b) => b.created - a.created);
  const others = pub.filter((p) => !p.mine && !isStory(p));
  mine = mine.filter((p) => !isStory(p));
  if (stories.length) out.push(ring('stories', 'story time', 'true stories of making do, told without names.', stories.map(node), 0.1, 0.65));
  if (others.length) out.push(ring('people', 'from everyone', 'shared by the people who made them.', others.map(node), 0.6, -0.1));
  if (mine.length) out.push(ring('yours', 'yours', 'what you have made here.', mine.map(node), -0.6, -0.2));
  return out;
}
