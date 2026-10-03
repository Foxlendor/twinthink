// A uniform grid over a frame's children, so culling and picking stay cheap
// when a field holds tens of thousands of Shadows. Built lazily per node.

import { IdeaNode } from './model';

const CELLS = 64;
const EXTENT = 1.3;

export interface SpatialIndex {
  query(x0: number, y0: number, x1: number, y1: number, out: IdeaNode[]): IdeaNode[];
}

const cache = new WeakMap<IdeaNode, SpatialIndex>();

export function spatialIndex(node: IdeaNode): SpatialIndex {
  let idx = cache.get(node);
  if (idx && (idx as unknown as { n: number }).n === node.children.length) return idx;
  const cells: IdeaNode[][] = Array.from({ length: CELLS * CELLS }, () => []);
  const cellOf = (v: number) => Math.max(0, Math.min(CELLS - 1, Math.floor(((v + EXTENT) / (2 * EXTENT)) * CELLS)));
  let maxR = 0;
  for (const c of node.children) {
    cells[cellOf(c.y) * CELLS + cellOf(c.x)].push(c);
    if (c.r > maxR) maxR = c.r;
  }
  idx = {
    query(x0, y0, x1, y1, out) {
      out.length = 0;
      const pad = maxR * 1.5;
      const cx0 = cellOf(x0 - pad);
      const cx1 = cellOf(x1 + pad);
      const cy0 = cellOf(y0 - pad);
      const cy1 = cellOf(y1 + pad);
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) {
          const cell = cells[cy * CELLS + cx];
          for (let i = 0; i < cell.length; i++) out.push(cell[i]);
        }
      return out;
    },
  };
  (idx as unknown as { n: number }).n = node.children.length;
  cache.set(node, idx);
  return idx;
}
