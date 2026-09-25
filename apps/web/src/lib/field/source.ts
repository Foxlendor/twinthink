import type { ViewerRelation } from './disclosure';
import type { ShadowProjection } from './model';

/**
 * Who is looking. A source asks this for the relation to a Twin and computes
 * closeness itself, so a server implementation can ignore the client's claim
 * and use authenticated identity, backs and capability grants instead.
 */
export interface ViewerContext {
  relationTo(twinId: string): ViewerRelation;
}

/**
 * Where the Field comes from. Every method is async and returns projections
 * only (never raw nodes), so the seed source can be swapped for an HTTP source
 * backed by the Twin API without touching the camera, store or renderer.
 *
 * A source must:
 *  - return stable ids and stable (x, y, r) placements
 *  - return [] for the children of a node the viewer cannot perceive
 *  - order children by when they began (the ring then reads as time)
 */
export interface FieldSource {
  readonly rootId: string;
  root(viewer: ViewerContext): Promise<ShadowProjection>;
  children(parentId: string, viewer: ViewerContext): Promise<ShadowProjection[]>;
  /** Root..id inclusive. Used for deep links and long flights. */
  path(id: string, viewer: ViewerContext): Promise<ShadowProjection[]>;
  /** A random Twin somewhere in the Field, for undirected discovery. */
  randomTwin(seed: number, viewer: ViewerContext): Promise<string | null>;
}
