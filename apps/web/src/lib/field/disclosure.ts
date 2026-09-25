import { continuityOf } from './continuity';
import type { FieldNode, ShadowProjection } from './model';

/**
 * Progressive disclosure (Shadow Protocol):
 *
 *   each element x of a Twin has a disclosure depth d(x) in [0, 1]
 *   a viewer has a closeness p to that Twin
 *   x is perceivable when d(x) <= p
 *
 * Distance to the Twin decreasing means permitted information increasing. The
 * spatial part (how big it is on screen) is handled by the renderer; this file
 * is the permission part. People never see these numbers: they just notice they
 * can go further than before.
 *
 * `project` is the only way node content reaches the renderer. It is written so
 * that a server can run it unchanged and send only projections to the client;
 * today the seed source runs it in the browser (see docs/XYZ_NAVIGATION.md).
 */

/** Anyone can perceive this much of a public Twin. */
export const PUBLIC_CLOSENESS = 0.34;
/** Backing: "I want to see what happens next." It brings you a little closer. */
export const BACKING_CLOSENESS = 0.2;
/** Coming back on different days brings you closer, slowly, with a ceiling. */
export const RETURN_CLOSENESS_STEP = 0.035;
export const RETURN_CLOSENESS_MAX = 0.12;

export interface ViewerRelation {
  isCreator: boolean;
  backed: boolean;
  /** Distinct days this viewer came back into the Twin. */
  returnDays: number;
  /** Explicit grant (capability token, NDA, collaborator), 0..1. */
  granted?: number;
}

export function closeness(relation: ViewerRelation): number {
  if (relation.isCreator) return 1;
  const earned =
    PUBLIC_CLOSENESS +
    (relation.backed ? BACKING_CLOSENESS : 0) +
    Math.min(RETURN_CLOSENESS_MAX, relation.returnDays * RETURN_CLOSENESS_STEP);
  return Math.min(1, Math.max(earned, relation.granted ?? 0));
}

export function isPerceivable(d: number, p: number) {
  return d <= p + 1e-9;
}

export function project(node: FieldNode, p: number, now = Date.now()): ShadowProjection {
  const c = continuityOf(node, now);
  const base: ShadowProjection = {
    id: node.id,
    parentId: node.parentId,
    kind: node.kind,
    glyph: node.glyph,
    x: node.x,
    y: node.y,
    r: node.r,
    grewFrom: node.grewFrom,
    childCount: node.childCount,
    perceivable: isPerceivable(node.d, p),
    vitality: c.vitality,
    life: c.life,
    origin: node.origin,
    isTwin: Boolean(node.twin),
  };
  if (!base.perceivable) return base;
  return {
    ...base,
    title: node.title,
    gist: node.gist,
    body: node.body,
    history: node.history,
    relationships: node.relationships,
    evidence: node.evidence,
    twin: node.twin,
  };
}
