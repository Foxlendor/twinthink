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
    line: p.mine ? (p.public ? 'yours, shared with everyone.' : 'yours, only you can see it.') : `by ${p.by}.`,
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
  const others = pub.filter((p) => !p.mine);
  if (others.length) out.push(ring('people', 'from everyone', 'shared by the people who made them.', others.map(node), 0.6, -0.1));
  if (mine.length) out.push(ring('yours', 'yours', 'what you have made here.', mine.map(node), -0.6, -0.2));
  return out;
}
