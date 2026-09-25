import type { ShadowProjection } from './model';
import type { FieldSource, ViewerContext } from './source';

/**
 * Client-side cache of the part of the Field the viewer has been near.
 *
 * Children are fetched lazily when something gets large on screen and evicted
 * when the viewer has been far from them for a while, so memory follows where
 * you are, not how big the Field is.
 */

const MAX_CACHED_NODES = 40_000;
const EVICT_AFTER_MS = 20_000;
const MAX_CONCURRENT_REQUESTS = 6;

export class FieldStore {
  readonly nodes = new Map<string, ShadowProjection>();
  private readonly kids = new Map<string, string[]>();
  private readonly pending = new Map<string, Promise<void>>();
  private readonly lastTouched = new Map<string, number>();
  private readonly queue: string[] = [];
  private inFlight = 0;
  private listeners = new Set<() => void>();
  /** When a node became perceivable to this viewer (for the veil to dissolve). */
  readonly revealed = new Map<string, number>();
  /** Bumped whenever cached content changes; the renderer reads it. */
  version = 0;

  constructor(
    readonly source: FieldSource,
    private viewer: ViewerContext
  ) {}

  get rootId() {
    return this.source.rootId;
  }

  async init() {
    const root = await this.source.root(this.viewer);
    this.nodes.set(root.id, root);
    await this.ensureChildren(root.id);
    this.changed();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed() {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }

  get(id: string) {
    return this.nodes.get(id);
  }

  childrenOf(id: string): string[] | undefined {
    const ids = this.kids.get(id);
    if (ids) this.lastTouched.set(id, performance.now());
    return ids;
  }

  isLoaded(id: string) {
    return this.kids.has(id);
  }

  ensureChildren(id: string): Promise<void> {
    if (this.kids.has(id)) return Promise.resolve();
    const existing = this.pending.get(id);
    if (existing) return existing;
    const job = this.source
      .children(id, this.viewer)
      .then((children) => {
        for (const child of children) this.nodes.set(child.id, child);
        this.kids.set(
          id,
          children.map((child) => child.id)
        );
        this.lastTouched.set(id, performance.now());
        this.changed();
      })
      .finally(() => {
        this.pending.delete(id);
      });
    this.pending.set(id, job);
    return job;
  }

  /** Fire-and-forget prefetch used by the renderer; throttled. */
  request(id: string) {
    if (this.kids.has(id) || this.pending.has(id) || this.queue.includes(id)) return;
    this.queue.push(id);
    this.pump();
  }

  private pump() {
    while (this.inFlight < MAX_CONCURRENT_REQUESTS && this.queue.length) {
      const id = this.queue.shift()!;
      this.inFlight += 1;
      this.ensureChildren(id)
        .catch(() => undefined)
        .finally(() => {
          this.inFlight -= 1;
          this.pump();
        });
    }
  }

  /** Loads every ancestor and its siblings so the camera can travel to `id`. */
  async ensurePath(id: string): Promise<string[]> {
    const path = await this.source.path(id, this.viewer);
    for (const node of path) if (!this.nodes.has(node.id)) this.nodes.set(node.id, node);
    for (const node of path.slice(0, -1)) await this.ensureChildren(node.id);
    return path.map((node) => node.id);
  }

  /** Root..id from the cache. Assumes the path is loaded. */
  ancestry(id: string): string[] {
    const out: string[] = [];
    let cursor: ShadowProjection | undefined = this.nodes.get(id);
    while (cursor) {
      out.push(cursor.id);
      cursor = cursor.parentId ? this.nodes.get(cursor.parentId) : undefined;
    }
    return out.reverse();
  }

  /** Nearest Twin boundary at or above `id`. */
  enclosingTwin(id: string): ShadowProjection | null {
    let cursor = this.nodes.get(id);
    while (cursor) {
      if (cursor.isTwin) return cursor;
      cursor = cursor.parentId ? this.nodes.get(cursor.parentId) : undefined;
    }
    return null;
  }

  isInside(id: string, ancestorId: string) {
    let cursor = this.nodes.get(id);
    while (cursor) {
      if (cursor.id === ancestorId) return true;
      cursor = cursor.parentId ? this.nodes.get(cursor.parentId) : undefined;
    }
    return false;
  }

  /**
   * The viewer's relation to a Twin changed (they backed it, came back, were
   * granted access). Re-project the Twin and everything loaded inside it,
   * top-down, keeping old content on screen until the new projection arrives.
   */
  async refreshTwin(twinId: string, viewer: ViewerContext) {
    this.viewer = viewer;
    const twin = this.nodes.get(twinId);
    if (!twin) return;
    if (twin.parentId) {
      const siblings = await this.source.children(twin.parentId, viewer);
      const fresh = siblings.find((node) => node.id === twinId);
      if (fresh) this.nodes.set(twinId, fresh);
    }
    const frontier = [twinId];
    while (frontier.length) {
      const parentId = frontier.shift()!;
      const children = await this.source.children(parentId, viewer);
      for (const child of children) {
        const before = this.nodes.get(child.id);
        if (before && !before.perceivable && child.perceivable) this.revealed.set(child.id, performance.now());
        this.nodes.set(child.id, child);
        // Only re-fetch what was already loaded (including veiled nodes that
        // were loaded as empty); everything else loads lazily as usual.
        if (this.kids.has(child.id)) frontier.push(child.id);
      }
      this.kids.set(
        parentId,
        children.map((child) => child.id)
      );
    }
    this.changed();
  }

  setViewer(viewer: ViewerContext) {
    this.viewer = viewer;
  }

  /** Drop children of parents that have not been near the camera for a while. */
  evict(protectedIds: Set<string>) {
    if (this.nodes.size < MAX_CACHED_NODES) return;
    const now = performance.now();
    const stale = [...this.kids.keys()]
      .filter((id) => !protectedIds.has(id) && now - (this.lastTouched.get(id) ?? 0) > EVICT_AFTER_MS)
      .sort((a, b) => (this.lastTouched.get(a) ?? 0) - (this.lastTouched.get(b) ?? 0));
    for (const parentId of stale) {
      if (this.nodes.size < MAX_CACHED_NODES * 0.7) break;
      this.dropSubtree(parentId);
    }
    this.changed();
  }

  private dropSubtree(parentId: string) {
    const ids = this.kids.get(parentId);
    if (!ids) return;
    this.kids.delete(parentId);
    this.lastTouched.delete(parentId);
    for (const id of ids) {
      this.dropSubtree(id);
      this.nodes.delete(id);
    }
  }
}
