// The Shadow Field data model.
//
// Every idea is an IdeaNode. A node owns a local coordinate frame: its own
// disk has radius 1 in that frame, and each child sits at (x, y) with radius r
// measured in the parent's frame. Recursion (a Twin containing Twins) is the
// same structure repeated, which is what makes semantic zoom unbounded.
//
// Internal disclosure model (engineering only, never shown to viewers):
// each node carries a disclosure depth d in [0, 1]. A viewer with closeness p
// may enter/name a node when d <= p, and may perceive that it exists (a sealed
// point) when d <= p + SEAL_MARGIN.

export type IdeaKind = 'physical' | 'music' | 'writing' | 'software' | 'visual' | 'theory' | 'unknown';

export type EventKind =
  | 'begin'
  | 'revision'
  | 'experiment'
  | 'evidence'
  | 'failure'
  | 'prune'
  | 'dormant'
  | 'revival'
  | 'return';

export interface LifeEvent {
  t: number; // epoch ms
  kind: EventKind;
  note?: string;
}

/** Where a record came from. Only 'real' and 'local' may appear on the public Canvas. */
export type Origin = 'real' | 'local' | 'synthetic';

export type LifeState = 'alive' | 'dormant' | 'abandoned' | 'realized';

export type Artifact =
  | { type: 'text'; body: string }
  | { type: 'story'; lines: { t: number; text: string }[] };

export interface IdeaNode {
  id: string;
  title?: string;
  note?: string;
  kind: IdeaKind;
  origin: Origin;
  began: number;
  /** Events on the strand that leads into this node, oldest first. */
  events: LifeEvent[];
  state: LifeState;
  /** Disclosure depth d in [0, 1]. */
  disclosure: number;
  children: IdeaNode[];
  artifact?: Artifact;
  /** Placement in the parent frame. If fixed, layout keeps it. */
  x: number;
  y: number;
  r: number;
  fixed?: boolean;
  seed: number;
  /** Id of the local record this node edits, when the viewer owns it. */
  ownedBy?: 'viewer';
  /** True when the children's events are a finer breakdown of this node's own events. */
  summarizes?: boolean;
  /** An empty frame opened while zooming into blank space (keeps precision unbounded). */
  void?: boolean;
  /**
   * Relationships to sibling ideas (same parent): a challenge (antithesis of
   * 'to') or a resolution (synthesis drawing on 'to').
   */
  links?: { to: string; kind: 'challenges' | 'resolves' }[];
  /** A way back into the Canvas from the end of a path: its children are the Canvas's. */
  portal?: boolean;
  /** Builds children on first approach (large synthetic fields). Called once by layout. */
  expand?: () => void;
  /** Aggregate continuity signals (for Shadows seen from far away). */
  signals?: {
    returns?: number;
    followers?: number;
  };
}

export const SEAL_MARGIN = 0.3;

export function lastActivity(node: IdeaNode): number {
  let t = node.began;
  for (const e of node.events) if (e.t > t) t = e.t;
  for (const c of node.children) {
    if (c.portal) continue;
    const ct = lastActivity(c);
    if (ct > t) t = ct;
  }
  return t;
}

const STRUCTURAL = new Set(['dormant', 'revival', 'return']);

/** Number of real changes in a node's life (not double counting summaries). */
export function countEvents(node: IdeaNode): number {
  let n = 0;
  for (const e of node.events) if (!STRUCTURAL.has(e.kind)) n++;
  if (node.summarizes) return n;
  for (const c of node.children) if (!c.portal) n += countEvents(c);
  return n;
}

export function findPath(root: IdeaNode, id: string): IdeaNode[] | null {
  if (root.id === id) return [root];
  for (const c of root.children) {
    if (c.portal) continue; // a portal holds the Canvas again; never recurse into it
    const p = findPath(c, id);
    if (p) return [root, ...p];
  }
  return null;
}

/** Size of an idea's web: how many ideas it holds, at any depth (portals excluded). */
export function webSize(node: IdeaNode): number {
  let n = 1;
  for (const c of node.children) if (!c.portal && !c.void) n += webSize(c);
  return n;
}

/**
 * How far (in Canvas units) a change in this Shadow ripples across the Canvas.
 * A bigger web reaches further. Position on the Canvas is closeness of topic,
 * so the ripple touches the ideas nearest to it first.
 */
export function rippleReach(node: IdeaNode): number {
  return Math.min(0.9, 0.08 + 0.035 * Math.sqrt(webSize(node)));
}

/** Other Shadows a ripple from `source` reaches, nearest first. */
export function reachedBy(source: IdeaNode, field: IdeaNode[]): IdeaNode[] {
  const reach = rippleReach(source);
  return field
    .filter((c) => c !== source && Math.hypot(c.x - source.x, c.y - source.y) <= reach)
    .sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y));
}
