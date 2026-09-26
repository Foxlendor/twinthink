// Traces: things johne.boi made and shared elsewhere, carried onto the Canvas
// as his own dated words. Each one is woven into what it belongs to (a song,
// his dancing); the rest become moments along his timeline.
//
// Rules:
// - Only posts from accounts their owner has linked may appear. Linking an
//   account is the owner's permission. johne.boi linked his on 2026-09-25.
// - Shown: his words and the moment. Never shown: images, or where a post was
//   first published (no platform names, no logos). The source is kept here
//   only so each trace can be checked.
// - Nothing is invented: times are decoded from each post's own id, which
//   carries the moment it was created, and words are copied as he wrote them.

import { IdeaNode } from '../model';
import { hashString } from '../rng';

/** Accounts the owner has linked. Only their posts may become traces. */
export const LINKED_ACCOUNTS = [
  { platform: 'instagram', handle: 'johne.boi' },
  { platform: 'tiktok', handle: 'siu3d' },
  { platform: 'discord', handle: '.siu3d' },
] as const;

export interface Trace {
  /** The post's own id on the platform it came from. */
  id: string;
  platform: (typeof LINKED_ACCOUNTS)[number]['platform'];
  /** The account that published it, checked against LINKED_ACCOUNTS. */
  owner: string;
  /** When it was made, decoded from its id. */
  at: string;
  /** His words, exactly as written. Empty when he wrote none. */
  words: string;
  /** Canvas id of what it belongs to. Without one, it is a moment. */
  belongsTo?: string;
}

// Checked 2026-09-25: owner read from each post's public page; time decoded from its id.
export const TRACES: Trace[] = [
  { id: 'ChFx8JwpSC3', platform: 'instagram', owner: 'johne.boi', at: '2022-08-10T19:14:04Z', words: 'GMFB' },
  { id: 'C8ot6S0RsGg', platform: 'instagram', owner: 'johne.boi', at: '2024-06-25T10:59:55Z', words: 'ıuɐp #SIU3d', belongsTo: 'dance' },
  { id: 'DFE84eyO5xA', platform: 'instagram', owner: 'johne.boi', at: '2025-01-21T06:20:38Z', words: 'lol' },
  { id: 'DFtuMlmO3se', platform: 'instagram', owner: 'johne.boi', at: '2025-02-06T02:21:10Z', words: 'terrified' },
  { id: 'DGCl2kyOAL-', platform: 'instagram', owner: 'johne.boi', at: '2025-02-14T04:52:18Z', words: 'lol\n#meme' },
  { id: 'DGEkNcCyNTR', platform: 'instagram', owner: 'johne.boi', at: '2025-02-14T23:16:26Z', words: '', belongsTo: 'dance' },
  { id: 'DIXiYV3uwx8', platform: 'instagram', owner: 'johne.boi', at: '2025-04-13T01:08:48Z', words: 'crazy April 11th' },
  { id: 'DTmwFKkjmNa', platform: 'instagram', owner: 'johne.boi', at: '2026-01-17T08:42:28Z', words: '⏸️⏸️⏪️🕹🔎?' },
  { id: 'DWbpTnkji1l', platform: 'instagram', owner: 'johne.boi', at: '2026-03-28T14:45:48Z', words: 'new ink! #47' },
  { id: 'DcBm0YtvV-Y', platform: 'instagram', owner: 'johne.boi', at: '2026-08-14T15:12:10Z', words: 'go subscribe to my new channel youtube.com/@willyjuankuh' },
  {
    id: 'DdKHMNLPJSt',
    platform: 'instagram',
    owner: 'johne.boi',
    at: '2026-09-11T19:00:22Z',
    words: 'a conversation with my inner most thoughts on love to love by love.\n\n#rap #2000semo #trapmusic\n#soultrap\n\nthanks to the producer who made the beat @thellewis',
    belongsTo: 'music',
  },
  { id: 'DdQXMEwPyDP', platform: 'instagram', owner: 'johne.boi', at: '2026-09-14T05:15:36Z', words: 'GOD KNOWS EVERY1 of my CRHYMES', belongsTo: 'music/crhymes' },
];

/** Whether a trace comes from an account its owner has linked. */
export function isLinked(t: Pick<Trace, 'platform' | 'owner'>): boolean {
  return LINKED_ACCOUNTS.some((a) => a.platform === t.platform && a.handle.toLowerCase() === t.owner.toLowerCase());
}

const firstLine = (words: string) => words.split('\n').find((l) => l.trim())?.trim() ?? '';

/** A few words from the post, for a name: never longer than a glance. */
function nameOf(t: Trace): string {
  const line = firstLine(t.words);
  if (!line) return 'untitled';
  return line.length > 44 ? line.slice(0, 42).replace(/\s+\S*$/, '') + '…' : line;
}

function when(t: Trace): string {
  return new Date(t.at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).toLowerCase();
}

/** Events a trace adds to the strand of what it belongs to. */
function eventOf(t: Trace) {
  const line = firstLine(t.words);
  return { t: Date.parse(t.at), kind: 'evidence' as const, note: line ? `shared: “${nameOf(t)}”` : 'shared' };
}

/**
 * Weave traces into the ideas they belong to: each becomes a moment on that
 * idea's strand, and an idea whose trace is older than its record now begins
 * where the trace does.
 */
export function weaveTraces(roots: IdeaNode[]) {
  const byId = new Map<string, IdeaNode>();
  const parentOf = new Map<IdeaNode, IdeaNode>();
  const visit = (n: IdeaNode) => {
    byId.set(n.id, n);
    for (const c of n.children) {
      parentOf.set(c, n);
      visit(c);
    }
  };
  roots.forEach(visit);
  for (const t of TRACES) {
    if (!t.belongsTo || !isLinked(t)) continue;
    const node = byId.get(t.belongsTo);
    if (!node || node.events.some((e) => e.t === Date.parse(t.at))) continue;
    const e = eventOf(t);
    node.events = [...node.events, e].sort((a, b) => a.t - b.t);
    node.began = Math.min(node.began, e.t);
    // siblings kept in the order they began stay in that order
    const parent = parentOf.get(node);
    if (parent) parent.children.sort((a, b) => a.began - b.began);
  }
}

/** Moments: what he shared that belongs to nothing else yet, oldest first. */
export function buildMoments(): IdeaNode {
  const loose = TRACES.filter((t) => !t.belongsTo && isLinked(t)).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const children: IdeaNode[] = loose.map((t) => {
    const at = Date.parse(t.at);
    return {
      id: `moment/${t.id}`,
      title: nameOf(t),
      kind: 'visual',
      origin: 'real',
      began: at,
      events: [{ t: at, kind: 'begin', note: 'shared' }],
      state: 'alive',
      disclosure: 0,
      line: when(t),
      artifact: t.words.trim() ? { type: 'text', body: t.words.trim() } : undefined,
      children: [],
      x: 0,
      y: 0,
      r: 0.05,
      seed: hashString(t.id),
    };
  });
  const first = children.length ? children[0].began : Date.now();
  return {
    id: 'moments',
    title: 'moments',
    line: 'what he shared, as he said it.',
    kind: 'visual',
    origin: 'real',
    began: first,
    events: [{ t: first, kind: 'begin', note: 'first thing shared' }],
    state: 'alive',
    disclosure: 0,
    children,
    x: -0.24,
    y: -0.52,
    r: 0.0025,
    fixed: true,
    seed: hashString('moments'),
  };
}
