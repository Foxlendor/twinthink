// Assembles the Canvas: the root frame whose children are top-level Shadows.
//
// The public Canvas contains only 'real' and 'local' records: TwinThink's own
// Twin, ideas the inventor cleared from their archive, and the viewer's own.
// Synthetic specimens are a test fixture only and are never served.

import { buildPosted, Posted } from './sources/posted';
import { IdeaNode, findPath } from './model';
import { topologyOf } from './layout';
import { buildTwinThinkTwin } from './sources/twinthink';
import { buildThrowaways } from './sources/archive';
import { buildStarters } from './sources/starters';
import { buildMusic } from './sources/music';
import { buildDance } from './sources/dance';
import { buildMoments, weaveTraces } from './sources/traces';
import { LocalShadow, localShadowNode } from './sources/local';

export const CANVAS_EXTENT = 1;

let twinthink: IdeaNode | null = null;
let throwaways: IdeaNode | null = null;
let starters: IdeaNode[] | null = null;
let music: IdeaNode | null = null;
let dance: IdeaNode | null = null;
let moments: IdeaNode | null = null;
let current: IdeaNode | null = null;
let hexLab: IdeaNode | null = null;

/**
 * The HEX (Human EXperience) Lab: everything he invents, in one ring of his
 * Whoeuvre: what he is building (TwinThink), what is free to build on
 * (redr.ink, TwizzLock), and what he gives away (the throwaways).
 */
function buildHexLab(twinthink: IdeaNode, throwaways: IdeaNode, starters: IdeaNode[]): IdeaNode {
  // inside the Lab's own frame, beside the others (it was a ring of its own on the Slate)
  twinthink.x = -0.34;
  twinthink.y = -0.22;
  const kids = [twinthink, throwaways, ...starters];
  const first = Math.min(...kids.map((k) => k.began));
  return {
    id: 'hex-lab',
    title: 'HEX Lab',
    line: 'his inventions: what he is building, and what he gives away.',
    kind: 'physical',
    origin: 'real',
    began: first,
    events: [{ t: first, kind: 'begin', note: 'the first experiment' }],
    state: 'alive',
    disclosure: 0,
    children: kids,
    x: throwaways.x,
    y: throwaways.y,
    r: 0.0025,
    fixed: true,
    seed: 4391,
  };
}

export function buildWorld(
  local: LocalShadow[],
  posted?: { public: Posted[]; mine: Posted[]; today?: boolean; keeps?: string[]; linked?: Posted[] }
): IdeaNode {
  twinthink ??= buildTwinThinkTwin();
  throwaways ??= buildThrowaways();
  starters ??= buildStarters();
  music ??= buildMusic();
  if (!dance) {
    dance = buildDance();
    // what he shared elsewhere joins the songs and dances it belongs to
    weaveTraces([music, dance]);
  }
  moments ??= buildMoments();
  hexLab ??= buildHexLab(twinthink, throwaways, starters);
  // his Whoeuvre: what he invents, his songs, his dancing, and moments of his life
  const children = [
    music,
    dance,
    moments,
    hexLab,
    ...(posted ? buildPosted(posted.public, posted.mine, posted.today, posted.linked) : []),
    ...local.map(localShadowNode),
  ];
  // your sketchbook: what you kept of others' work, while it is still there to be seen
  if (posted?.keeps?.length) {
    const book = sketchbook(rootNode('canvas', children), posted.keeps);
    if (book) children.push(book);
  }
  const world = rootNode('canvas', children);
  current = world;
  for (const c of children) attachPortals(c);
  return world;
}

/** Copies of what you kept, each remembering where it lives (tap "go to it" to fly there). */
function sketchbook(world: IdeaNode, keeps: string[]): IdeaNode | null {
  const kids: IdeaNode[] = [];
  keeps.forEach((target, i) => {
    const p = findPath(world, target);
    // nothing sealed, private, or on a device is ever kept in view
    if (!p || p.length < 2 || p.some((n) => n.disclosure > 0 || n.id.startsWith('local/') || n.ownedBy === 'viewer')) return;
    const n = p[p.length - 1];
    const from = p.length > 2 ? p[p.length - 2].title : undefined;
    kids.push({
      ...n,
      id: `k/${target}`,
      children: [],
      links: undefined,
      line: from ? `kept from ${from}.` : 'kept.',
      x: Math.cos(i * 2.39996) * 0.5,
      y: Math.sin(i * 2.39996) * 0.5,
      fixed: false,
      r: 0.05,
    });
  });
  if (!kids.length) return null;
  const first = kids.reduce((t, k) => Math.min(t, k.began), Date.now());
  return {
    id: 'sketchbook',
    title: 'your sketchbook',
    line: 'what you kept of others’ work.',
    kind: 'unknown',
    origin: 'real',
    began: first,
    events: [{ t: first, kind: 'begin', note: 'first kept' }],
    state: 'alive',
    disclosure: 0,
    children: kids,
    x: 0.5,
    y: 0.55,
    r: 0.0025,
    fixed: true,
    seed: 7331,
  };
}

/**
 * Nothing ends. Every idea without children gains, on first approach, a small
 * drop that contains the whole Canvas again, so falling inward never stops.
 * The portal's children are read live from the current world.
 */
function attachPortals(node: IdeaNode) {
  if (node.portal) return;
  if (node.children.length) {
    for (const c of node.children) attachPortals(c);
    return;
  }
  if (node.expand) return;
  node.expand = () => {
    if (node.children.some((c) => c.portal)) return;
    const portal: IdeaNode = {
      id: `${node.id}/again`,
      title: 'the slate',
      kind: 'unknown',
      origin: 'real',
      began: node.began,
      events: [],
      state: 'alive',
      disclosure: 0,
      children: [],
      x: 0,
      y: node.media?.length ? 0.78 : node.artifact ? 0.62 : 0.35,
      r: 0.045,
      fixed: true,
      seed: node.seed ^ 0x2545f491,
      portal: true,
    };
    Object.defineProperty(portal, 'children', { get: () => current?.children ?? [], enumerable: false });
    node.children.push(portal);
  };
}

export function rootNode(id: string, children: IdeaNode[]): IdeaNode {
  return {
    id,
    kind: 'unknown',
    origin: 'real',
    began: 0,
    events: [],
    state: 'alive',
    disclosure: 0,
    children,
    x: 0,
    y: 0,
    r: 1,
    seed: 1,
  };
}

/** Deepest node matching a path of ids, for URL restore. */
export function resolvePath(root: IdeaNode, ids: string[]): IdeaNode[] {
  const path = [root];
  let cur = root;
  for (const id of ids) {
    topologyOf(cur);
    const next = cur.children.find((c) => c.id === id);
    if (!next) {
      // an idea that has moved (older links): find it wherever it now lives
      const found = findPath(cur, id);
      if (!found) break;
      path.push(...found.slice(1));
      cur = found[found.length - 1];
      continue;
    }
    path.push(next);
    cur = next;
  }
  return path;
}
