// Shadows people have posted (kept on the server). Public ones join everyone's
// Canvas in one ring; a signed-in maker also sees their own, public or not.

import { IdeaNode, Media } from '../model';
import { hashString } from '../rng';
import { dayOf, wordFor } from '../prompts';

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
  /** How far it is shared: only its maker, whoever has its link, or everyone. */
  visibility?: 'private' | 'unlisted' | 'public';
  /** Gathers one maker's work (a key that never leads back to them); empty for stories. */
  maker?: string;
  /** For an answer to the day's word: that day. */
  day?: string | null;
  /** Pictures and films its maker added (height over width). */
  media?: ({ kind: 'image'; src: string; aspect: number } | { kind: 'video'; src: string; poster?: string; aspect: number })[];
  /** What it was built on (a story or someone's Shadow), while that is shared. */
  parent?: { title: string; kind: 'shadow' | 'story'; by: string } | null;
  /** Yours, taken down: only you see it. */
  hidden?: boolean;
  /** The fork it was posted inside, if any (sharing still follows the usual rule). */
  forkId?: string | null;
  /** The forks open inside this Shadow, if any. */
  forks?: PostedFork[];
}

/** A fork: a named space open inside a Shadow, for others to travel into and, by its own rule, post inside. */
export interface PostedFork {
  id: string;
  hostShadowId: string;
  title: string;
  postAccess: 'anyone' | 'invite';
  closed: boolean;
  created: number;
  mine: boolean;
  canPost: boolean;
  inviteLink?: string;
}

const short = (t: string) => (t.length > 36 ? t.slice(0, 34).replace(/\s+\S*$/, '') + '…' : t);

function lineFor(p: Posted) {
  if (p.mine && p.hidden) return 'yours, taken down; only you can see it now.';
  if (p.kind === 'story') {
    if (p.mine) return 'yours, told without your name.';
    // what grew from it is told, never counted
    return (p.sparks ?? 0) > 0 ? 'told without a name. others have built on it.' : 'told without a name.';
  }
  const who = p.mine
    ? p.public
      ? 'yours, shared with everyone.'
      : p.visibility === 'unlisted'
        ? 'yours, shared only by its link.'
        : 'yours, only you can see it.'
    : `by ${p.by}.`;
  // credit runs back along the chain: what it was built on, and who made that
  const on = p.parent
    ? p.parent.kind === 'story'
      ? ' sparked by a story.'
      : ` built on ${p.parent.by ? `${p.parent.by}’s ` : ''}“${short(p.parent.title)}”.`
    : p.from
      ? ' built on something no longer shared.'
      : '';
  const grew = !p.mine && (p.sparks ?? 0) > 0 ? ' others have built on it.' : '';
  return `${who}${on}${grew}`;
}

/** Its pictures and films laid side by side, the first in the middle; films signed by their maker. */
function mediaOf(p: Posted): Media[] | undefined {
  const list = p.media ?? [];
  if (!list.length) return undefined;
  const n = list.length;
  const w = n === 1 ? 1.25 : n === 2 ? 0.95 : 0.7;
  return list.map((m, i): Media => {
    const x = (i - (n - 1) / 2) * w * 1.08;
    const ww = m.aspect > 1 ? w * Math.min(1, 1.3 / m.aspect) : w;
    return m.kind === 'image'
      ? { kind: 'image', src: m.src, x, y: 0, w: ww, aspect: m.aspect }
      : { kind: 'video', src: m.src, poster: m.poster ?? '', x, y: 0, w: ww, aspect: m.aspect, by: p.by || undefined };
  });
}

/** The one line under a fork's name: what it is, and whether it still takes new posts. */
function forkLine(f: PostedFork): string {
  if (f.closed) return 'closed now: what was made here stays.';
  if (f.mine) return f.postAccess === 'anyone' ? 'open to anyone signed in.' : 'open by invitation.';
  return 'a space opened here.';
}

/** A fork, as a gate: what is posted inside it are its children, the same shape as anywhere else. */
function forkNode(f: PostedFork, kids: IdeaNode[], i: number): IdeaNode {
  const first = kids.length ? Math.min(...kids.map((k) => k.began)) : f.created;
  return {
    id: `fork/${f.id}`,
    title: f.title,
    kind: 'unknown',
    origin: 'real',
    began: first,
    events: [{ t: f.created, kind: 'begin', note: 'opened' }],
    state: f.closed ? 'dormant' : 'alive',
    disclosure: 0,
    children: kids,
    line: forkLine(f),
    x: Math.cos(i * 2.39996) * 0.4,
    y: Math.sin(i * 2.39996) * 0.4,
    r: 0.04,
    seed: hashString(f.id),
  };
}

/** What one Shadow posted `p` looks like, given `byFork`: everyone's Shadows, grouped by which fork (if any) holds them. */
function node(p: Posted, i: number, byFork: Map<string, Posted[]>): IdeaNode {
  const forks = (p.forks ?? []).map((f, k) => forkNode(f, (byFork.get(f.id) ?? []).map((c, j) => node(c, j, byFork)), k));
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
    children: forks,
    // its words are what is shown until it has pictures or films; then those are
    artifact: p.body && !p.media?.length ? { type: 'text', body: p.body } : undefined,
    media: mediaOf(p),
    line: lineFor(p),
    links: p.parent && p.from ? [{ to: `p/${p.from}`, kind: 'grew-from' as const }] : undefined,
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

/**
 * The rings for posted work: today's word and its answers (when posting is
 * on), everyone's public Shadows, and (signed in) your own.
 */
export function buildPosted(pub: Posted[], mine: Posted[], today = false, linked: Posted[] = []): IdeaNode[] {
  const out: IdeaNode[] = [];
  // what is posted inside a fork lives only there, never also loose at the top level
  const byFork = new Map<string, Posted[]>();
  for (const p of [...pub, ...mine, ...linked]) {
    if (!p.forkId) continue;
    byFork.set(p.forkId, [...(byFork.get(p.forkId) ?? []), p]);
  }
  const at = (p: Posted, i: number) => node(p, i, byFork);
  pub = pub.filter((p) => !p.forkId);
  mine = mine.filter((p) => !p.forkId);
  linked = linked.filter((p) => !p.forkId);
  // what someone sent you by its link (shared only that way): here for this visit, in its own ring
  const known = new Set([...pub, ...mine].map((p) => p.id));
  const sent = linked.filter((p) => !known.has(p.id));
  if (sent.length) out.push(ring('linked', 'sent to you', 'shared with you by its link.', sent.map(at), 0.35, 0.7));
  const day = dayOf();
  const isToday = (p: Posted) => p.day === day;
  if (today) {
    const answers = [...mine.filter(isToday), ...pub.filter((p) => isToday(p) && !p.mine)].sort((a, b) => b.created - a.created);
    const r = ring('today', wordFor(day), 'today’s word. make something of it.', answers.map(at), -0.1, -0.7);
    // it begins with the day, so it is always the newest thing on the Canvas
    r.began = Math.max(r.began, Date.parse(`${day}T00:00:00Z`));
    out.push(r);
    pub = pub.filter((p) => !isToday(p));
    mine = mine.filter((p) => !isToday(p));
  }
  const isStory = (p: Posted) => p.kind === 'story';
  const stories = [...mine.filter(isStory), ...pub.filter((p) => isStory(p) && !p.mine)].sort((a, b) => b.created - a.created);
  const others = pub.filter((p) => !p.mine && !isStory(p));
  mine = mine.filter((p) => !isStory(p));
  if (stories.length) out.push(ring('stories', 'story time', 'true stories of making do, told without names.', stories.map(at), 0.1, 0.65));
  if (others.length) {
    // one ring for each maker, holding what they have shared: flying in is visiting them
    const byMaker = new Map<string, Posted[]>();
    for (const p of others) {
      const k = p.maker || `one/${p.id}`;
      byMaker.set(k, [...(byMaker.get(k) ?? []), p]);
    }
    const makers = [...byMaker.entries()].map(([k, list], i) => {
      const r = ring(`maker/${k}`, list[0].by || 'someone', list.length > 1 ? 'their whoeuvre: what they have shared.' : 'their whoeuvre: what they shared.', list.map(at), 0, 0);
      r.fixed = false;
      r.r = 0.05;
      r.x = Math.cos(i * 2.39996) * 0.5;
      r.y = Math.sin(i * 2.39996) * 0.5;
      // newest work first
      r.began = Math.max(...list.map((p) => p.created));
      return r;
    });
    out.push(ring('people', 'from everyone', 'shared by the people who made them.', makers, 0.6, -0.1));
  }
  if (mine.length) out.push(ring('yours', 'your whoeuvre', 'what you have left here.', mine.map(at), -0.6, -0.2));
  return out;
}
