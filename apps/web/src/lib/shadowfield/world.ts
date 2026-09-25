// Assembles the Canvas: the root frame whose children are top-level Shadows.
//
// The public Canvas contains only 'real' and 'local' records. Synthetic
// specimens exist solely for the separate rehearsal field and are never mixed
// into this world.

import { IdeaNode } from './model';
import { buildTwinThinkTwin } from './sources/twinthink';
import { LocalShadow, localShadowNode } from './sources/local';

export const CANVAS_EXTENT = 1;

let twinthink: IdeaNode | null = null;

export function buildWorld(local: LocalShadow[]): IdeaNode {
  twinthink ??= buildTwinThinkTwin();
  const children = [twinthink, ...local.map(localShadowNode)];
  return rootNode('canvas', children);
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
    const next = cur.children.find((c) => c.id === id);
    if (!next) break;
    path.push(next);
    cur = next;
  }
  return path;
}
