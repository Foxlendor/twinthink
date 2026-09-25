// Assembles the Canvas: the root frame whose children are top-level Shadows.
//
// The public Canvas contains only 'real' and 'local' records: TwinThink's own
// Twin, ideas the inventor cleared from their archive, and the viewer's own.
// Synthetic specimens are a test fixture only and are never served.

import { IdeaNode } from './model';
import { topologyOf } from './layout';
import { buildTwinThinkTwin } from './sources/twinthink';
import { buildArchiveShadows } from './sources/archive';
import { LocalShadow, localShadowNode } from './sources/local';

export const CANVAS_EXTENT = 1;

let twinthink: IdeaNode | null = null;
let archive: IdeaNode[] | null = null;
let current: IdeaNode | null = null;

export function buildWorld(local: LocalShadow[]): IdeaNode {
  twinthink ??= buildTwinThinkTwin();
  archive ??= buildArchiveShadows();
  const children = [twinthink, ...archive, ...local.map(localShadowNode)];
  const world = rootNode('canvas', children);
  current = world;
  for (const c of children) attachPortals(c);
  return world;
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
      title: 'the canvas',
      kind: 'unknown',
      origin: 'real',
      began: node.began,
      events: [],
      state: 'alive',
      disclosure: 0,
      children: [],
      x: 0,
      y: node.artifact ? 0.62 : 0.35,
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
    if (!next) break;
    path.push(next);
    cur = next;
  }
  return path;
}
