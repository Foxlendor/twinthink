/**
 * TwinThink Field model.
 *
 * The Canvas is one recursive structure. Every thing you can move toward is a
 * FieldNode. A node that carries `twin` is a Twin boundary: it has its own
 * identity, creator, backers and disclosure policy, and everything inside it
 * inherits that context until another Twin boundary is crossed. That is how an
 * idea contains ideas: a component of an invention can itself be a Twin.
 *
 * Containment is a tree (children). Everything that is not containment —
 * revisions, forks, convergence, supporting evidence — is a Relationship.
 *
 * Positions are part of the model, not the renderer: a child occupies a disk
 * (x, y, r) inside its parent's local unit disk. Stable positions are what make
 * the Canvas a place people can return to rather than a feed that reshuffles.
 */

export type NodeKind =
  | 'canvas' // the root of everything
  | 'domain' // a territory: music, engineering, writing, ...
  | 'constellation' // one creator's cluster of Twins inside a territory
  | 'twin' // an idea someone is living with
  | 'facet' // a major region of an idea (origin, mechanism, open questions, ...)
  | 'branch' // a line of thought that split off
  | 'thought'
  | 'component'
  | 'experiment'
  | 'question'
  | 'revision'
  | 'evidence'
  | 'media'
  | 'dead_end';

/** How the Shadow looks when it has collapsed into a speck. */
export type ShadowGlyph = 'physical' | 'audio' | 'writing' | 'software' | 'visual' | 'unknown';

/** Where a record came from. Seeded data must never pass as genuine activity. */
export type Origin =
  | 'seeded' // believable demo data generated or authored for the prototype
  | 'record' // derived from an existing Twin record in this repository / API
  | 'live'; // genuine activity by a real person (currently: this device)

export type HistoryEventType =
  | 'began'
  | 'revised'
  | 'branched'
  | 'dead_end'
  | 'returned' // the creator came back and worked on it
  | 'visited' // someone else came back to look again
  | 'evidence'
  | 'dormant'
  | 'revived'
  | 'split'
  | 'converged'
  | 'realized'; // it became a real-world thing

export interface HistoryEvent {
  type: HistoryEventType;
  /** ISO timestamp. */
  at: string;
  /** Node the event concerns, when it is not the node that owns the history. */
  nodeId?: string;
  note?: string;
  origin: Origin;
}

export type RelationshipType =
  | 'revises' // this node is a later version of target
  | 'branched_from'
  | 'converges_with'
  | 'supports' // evidence supporting target
  | 'contradicts'
  | 'depends_on'
  | 'descends_from'; // a descendant Twin

export interface Relationship {
  type: RelationshipType;
  targetId: string;
}

export type EvidenceMedium = 'audio' | 'image' | 'text' | 'measurement' | 'file' | 'video' | 'code';

export interface EvidenceRef {
  medium: EvidenceMedium;
  label: string;
  /** Optional in-repo link (e.g. an existing Twin record page). */
  href?: string;
  /** For measurements: a small series to draw. */
  series?: number[];
  capturedAt?: string;
}

/**
 * Twin identity. Present only on nodes that are Twin boundaries.
 * Counters that need a server (backers, visitors) are carried as numbers so the
 * seed and a real API can supply them the same way.
 */
export interface TwinIdentity {
  title: string;
  creator: string;
  /** A sentence from the creator, in their voice. Not a pitch. */
  note: string;
  began: string;
  backers: number;
  /** Distinct people who came back to it after first discovering it. */
  returners: number;
  /** Existing full Twin record, if one exists (e.g. /twins/twizzlock). */
  recordHref?: string;
}

export interface FieldNode {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  glyph: ShadowGlyph;
  title: string;
  /** One or two lines; shown only when the node is large enough on screen. */
  gist?: string;
  /** Longer body, shown only when you are inside a leaf. */
  body?: string;

  /** Local placement inside the parent's unit disk. */
  x: number;
  y: number;
  r: number;
  /**
   * The sibling this grew out of (a revision grows from what it revises, an
   * alternative from what it branched from). Undefined: it grew from the
   * parent's own point. This is what gives a field its forks.
   */
  grewFrom?: string;

  /**
   * Disclosure depth d(x) in [0, 1]. The node is perceivable by a viewer with
   * closeness p to the enclosing Twin when d <= p. Never shown to people.
   */
  d: number;

  /** Hint for procedural density before children are loaded. */
  childCount: number;
  /** Filled by the store once loaded; ids in layout order. */
  childIds?: string[];

  history: HistoryEvent[];
  relationships: Relationship[];
  evidence: EvidenceRef[];

  twin?: TwinIdentity;
  origin: Origin;
}

/** What the renderer is allowed to know about a node for a given viewer. */
export interface ShadowProjection {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  glyph: ShadowGlyph;
  x: number;
  y: number;
  r: number;
  grewFrom?: string;
  childCount: number;
  /** false: the viewer is not close enough yet. Only shape and vitality remain. */
  perceivable: boolean;
  vitality: number;
  life: LifeState;
  title?: string;
  gist?: string;
  body?: string;
  history?: HistoryEvent[];
  relationships?: Relationship[];
  evidence?: EvidenceRef[];
  twin?: TwinIdentity;
  origin: Origin;
  isTwin: boolean;
}

export type LifeState = 'new' | 'growing' | 'active' | 'branching' | 'dormant' | 'revived' | 'converging' | 'realized' | 'ended';

export const DAY_MS = 86_400_000;
