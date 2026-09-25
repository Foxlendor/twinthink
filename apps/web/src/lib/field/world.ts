import type { Geometry, GeometryLookup } from './camera';
import type { Disk } from './layout';
import type { FieldWorld } from './renderer';
import type { FieldStore } from './store';

/** Presents the store as camera geometry and as the renderer's world. */
export class StoreWorld implements GeometryLookup, FieldWorld {
  constructor(private readonly store: FieldStore) {}

  get(id: string) {
    return this.store.get(id);
  }

  geo(id: string): Geometry | undefined {
    const node = this.store.get(id);
    return node ? { parentId: node.parentId, x: node.x, y: node.y, r: node.r } : undefined;
  }

  childIds(id: string) {
    return this.store.childrenOf(id);
  }

  canEnter(id: string) {
    return Boolean(this.store.get(id)?.perceivable);
  }

  request(id: string) {
    this.store.request(id);
  }

  revealedAt(id: string) {
    return this.store.revealed.get(id);
  }

  ancestor(id: string, levels: number) {
    let cursor = id;
    for (let i = 0; i < levels; i++) {
      const parent = this.store.get(cursor)?.parentId;
      if (!parent) break;
      cursor = parent;
    }
    return cursor;
  }

  /** Where node `id` sits, expressed in the local frame of `frameId`. */
  diskInFrame(id: string, frameId: string): Disk | null {
    const a = this.store.ancestry(id);
    const f = this.store.ancestry(frameId);
    if (!a.length || !f.length || a[0] !== f[0]) return null;
    let shared = 0;
    while (shared < a.length && shared < f.length && a[shared] === f[shared]) shared++;
    const up = (path: string[]) => {
      let x = 0;
      let y = 0;
      let r = 1;
      for (let i = path.length - 1; i >= shared; i--) {
        const g = this.store.get(path[i]);
        if (!g) return null;
        x = g.x + g.r * x;
        y = g.y + g.r * y;
        r = g.r * r;
      }
      return { x, y, r };
    };
    const node = up(a);
    const frame = up(f);
    if (!node || !frame) return null;
    return { x: (node.x - frame.x) / frame.r, y: (node.y - frame.y) / frame.r, r: node.r / frame.r };
  }
}
