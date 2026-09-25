import { closeness, isPerceivable, project } from '../disclosure';
import { growthLayout, layoutDisks, type Disk, type GrowthItem } from '../layout';
import {
  DAY_MS,
  type EvidenceRef,
  type FieldNode,
  type HistoryEvent,
  type HistoryEventType,
  type NodeKind,
  type Origin,
  type Relationship,
  type ShadowProjection,
  type TwinIdentity,
} from '../model';
import { between, intBetween, pick, rngFor, shuffled, type Rng } from '../rng';
import type { FieldSource, ViewerContext } from '../source';
import { AUTHORED_CONSTELLATIONS, type AuthoredSpec } from './authored';
import { recordOverlay } from './records';
import { CREATOR_NOTES, DOMAINS, KIND_GISTS, KIND_TEMPLATES, handleFrom, type DomainKey, type DomainVocab, type FacetTemplate } from './vocab';

/**
 * A deterministic, lazily generated Field.
 *
 * Nothing is generated until someone gets close to it, so the Field can be
 * made arbitrarily large (`scale`) without cost up front. Hand-authored
 * journeys and existing Twin records are woven in at fixed places.
 *
 * Every node produced here is origin 'seeded' or 'record'. Nothing here is
 * genuine user activity.
 */

export const ROOT_ID = 'canvas';

interface Meta {
  domain: DomainKey;
  /** Depth below the nearest Twin boundary (0 = the Twin itself), -1 outside any Twin. */
  depth: number;
  spec?: AuthoredSpec;
  facet?: FacetTemplate;
  /** Latest moment anything inside this Twin changed (dormant Twins stop early). */
  activeUntil: number;
  began: number;
  constellationHandle?: string;
}

interface Draft {
  node: Omit<FieldNode, 'x' | 'y' | 'r'>;
  meta: Meta;
  /** Preferred radius multiplier (authored constellations are larger). */
  weight?: number;
}

export interface SeedOptions {
  now?: number;
  /** Multiplies the number of creator constellations per territory. */
  scale?: number;
}

const vocabOf = (key: DomainKey) => DOMAINS.find((domain) => domain.key === key)!;

export class SeedSource implements FieldSource {
  readonly rootId = ROOT_ID;
  readonly now: number;
  private readonly scale: number;
  private readonly raw = new Map<string, FieldNode>();
  private readonly meta = new Map<string, Meta>();
  private readonly kids = new Map<string, string[]>();
  private readonly recordNodes = new Map<string, string>();

  constructor(options: SeedOptions = {}) {
    this.now = options.now ?? Date.now();
    this.scale = Math.max(0.05, options.scale ?? 1);

    for (const constellation of AUTHORED_CONSTELLATIONS) {
      for (const twin of constellation.twins) {
        if (twin.record) this.recordNodes.set(twin.record, `${ROOT_ID}/${constellation.domain}/${constellation.handle}/${twin.slug}`);
      }
    }

    const began = this.now - 3600 * DAY_MS;
    this.raw.set(ROOT_ID, {
      id: ROOT_ID,
      parentId: null,
      kind: 'canvas',
      glyph: 'unknown',
      title: 'Canvas',
      x: 0,
      y: 0,
      r: 1,
      d: 0,
      childCount: DOMAINS.length,
      history: [{ type: 'began', at: new Date(began).toISOString(), origin: 'seeded' }],
      relationships: [],
      evidence: [],
      origin: 'seeded',
    });
    this.meta.set(ROOT_ID, { domain: 'abstract', depth: -1, activeUntil: this.now, began });
  }

  // ---------------------------------------------------------------- FieldSource

  async root(viewer: ViewerContext) {
    return this.projectFor(this.raw.get(ROOT_ID)!, viewer);
  }

  async children(parentId: string, viewer: ViewerContext): Promise<ShadowProjection[]> {
    const parent = this.rawNode(parentId);
    if (!parent) return [];
    // Server-side rule: you cannot look inside what you cannot perceive.
    if (!isPerceivable(parent.d, this.closenessAt(parentId, viewer))) return [];
    return this.rawChildren(parentId).map((child) => this.projectFor(child, viewer));
  }

  async path(id: string, viewer: ViewerContext): Promise<ShadowProjection[]> {
    const ids = ancestry(id);
    const out: ShadowProjection[] = [];
    for (const nodeId of ids) {
      const node = this.rawNode(nodeId);
      if (!node) break;
      const projection = this.projectFor(node, viewer);
      out.push(projection);
      if (!projection.perceivable) break;
    }
    return out;
  }

  async randomTwin(seed: number, viewer: ViewerContext): Promise<string | null> {
    const rng = rngFor('random', seed);
    // A quarter of random journeys land on a hand-authored Twin, so the
    // prototype's deepest paths are discoverable without knowing where they are.
    if (rng() < 0.25) {
      const constellation = pick(rng, AUTHORED_CONSTELLATIONS);
      const twin = pick(rng, constellation.twins);
      return `${ROOT_ID}/${constellation.domain}/${constellation.handle}/${twin.slug}`;
    }
    for (let attempt = 0; attempt < 12; attempt++) {
      const domain = pick(rng, this.rawChildren(ROOT_ID));
      const constellation = pick(rng, this.rawChildren(domain.id));
      const twins = this.rawChildren(constellation.id);
      if (!twins.length) continue;
      const twin = pick(rng, twins);
      if (this.projectFor(twin, viewer).perceivable) return twin.id;
    }
    return null;
  }

  // ------------------------------------------------------------------ internals

  /** For tests and tools: the raw node, ignoring disclosure. */
  rawNode(id: string): FieldNode | undefined {
    const cached = this.raw.get(id);
    if (cached) return cached;
    const cut = id.lastIndexOf('/');
    if (cut <= 0) return undefined;
    const parentId = id.slice(0, cut);
    if (!this.rawNode(parentId)) return undefined;
    this.rawChildren(parentId);
    return this.raw.get(id);
  }

  rawChildren(parentId: string): FieldNode[] {
    const cached = this.kids.get(parentId);
    if (cached) return cached.map((id) => this.raw.get(id)!);
    const parent = this.rawNode(parentId);
    if (!parent) return [];
    const drafts = this.draftChildren(parent, this.meta.get(parentId)!);
    let disks: Disk[];
    if (parent.kind === 'canvas') disks = layoutDisks(drafts.length, parentId, 'territory');
    else if (parent.kind === 'domain') {
      disks = layoutDisks(drafts.length, parentId, 'scatter');
      this.makeRoomForAuthored(drafts, disks);
    } else {
      // An idea's structure grows: in the order things began, each from the
      // point or the earlier sibling it came out of.
      drafts.sort((a, b) => a.meta.began - b.meta.began);
      const items = this.attach(drafts, parentId);
      disks = growthLayout(items, parentId);
      items.forEach((item, index) => {
        if (item.from >= 0) drafts[index].node.grewFrom = drafts[item.from].node.id;
      });
    }

    const ids: string[] = [];
    drafts.forEach((draft, index) => {
      const disk = disks[index];
      const node: FieldNode = { ...draft.node, x: disk.x, y: disk.y, r: disk.r * (draft.weight ?? 1) };
      this.raw.set(node.id, node);
      this.meta.set(node.id, draft.meta);
      ids.push(node.id);
    });
    // Keep the planned count honest: renderers draw `childCount` specks before loading.
    parent.childCount = ids.length;
    this.kids.set(parentId, ids);
    return ids.map((id) => this.raw.get(id)!);
  }

  /**
   * Which earlier sibling each child grew out of. Authored and record
   * relationships decide it when present; procedural children sometimes fork
   * from an earlier sibling, and that fork is recorded as a real relationship.
   */
  private attach(drafts: Draft[], parentId: string): GrowthItem[] {
    const index = new Map(drafts.map((draft, i) => [draft.node.id, i]));
    const rng = rngFor(parentId, 'attach');
    return drafts.map((draft, i) => {
      const weight = Math.min(1, (draft.node.history.length + draft.node.childCount * 2) / 24);
      for (const rel of draft.node.relationships) {
        if (rel.type !== 'revises' && rel.type !== 'branched_from' && rel.type !== 'descends_from') continue;
        const j = index.get(rel.targetId);
        if (j !== undefined && j < i) return { from: j, weight };
      }
      const procedural = !draft.meta.spec && draft.meta.depth >= 2 && i > 0;
      const chance: Partial<Record<NodeKind, number>> = { revision: 0.75, dead_end: 0.55, experiment: 0.4, branch: 0.45, thought: 0.2, evidence: 0.3, question: 0.15 };
      if (procedural && rng() < (chance[draft.node.kind] ?? 0)) {
        const candidates = drafts.slice(0, i).map((d, j) => ({ d, j })).filter(({ d }) => d.node.kind !== 'dead_end');
        if (candidates.length) {
          const { d, j } = candidates[Math.min(candidates.length - 1, Math.floor(Math.pow(rng(), 0.6) * candidates.length))];
          draft.node.relationships.push({ type: draft.node.kind === 'revision' ? 'revises' : 'branched_from', targetId: d.node.id });
          return { from: j, weight };
        }
      }
      return { from: -1, weight };
    });
  }

  /** Authored constellations sit at the centre of their territory; clear space around them. */
  private makeRoomForAuthored(drafts: Draft[], disks: { x: number; y: number; r: number }[]) {
    drafts.forEach((draft, index) => {
      if (!draft.weight || draft.weight === 1) return;
      const big = { ...disks[index], r: disks[index].r * draft.weight };
      disks.forEach((disk, other) => {
        if (other === index) return;
        const distance = Math.hypot(disk.x - big.x, disk.y - big.y);
        if (distance < big.r + disk.r) {
          const push = (big.r + disk.r - distance + 0.004) / Math.max(distance, 1e-6);
          disk.x += (disk.x - big.x) * push;
          disk.y += (disk.y - big.y) * push;
        }
      });
    });
  }

  private closenessAt(id: string, viewer: ViewerContext) {
    let cursor = this.raw.get(id);
    while (cursor) {
      if (cursor.twin) return closeness(viewer.relationTo(cursor.id));
      cursor = cursor.parentId ? this.raw.get(cursor.parentId) : undefined;
    }
    return 1; // territories and constellations are public places
  }

  private projectFor(node: FieldNode, viewer: ViewerContext) {
    return project(node, this.closenessAt(node.id, viewer), this.now);
  }

  private iso(daysAgo: number) {
    return new Date(this.now - daysAgo * DAY_MS).toISOString();
  }

  // ------------------------------------------------------------------ drafting

  private draftChildren(parent: FieldNode, meta: Meta): Draft[] {
    if (parent.kind === 'canvas') return DOMAINS.map((domain) => this.domainDraft(domain));
    if (parent.kind === 'domain') return this.constellationDrafts(parent, meta);
    if (parent.kind === 'constellation') return this.twinDrafts(parent, meta);

    const spec = meta.spec;
    const drafts: Draft[] = [];
    if (spec?.children) {
      spec.children.forEach((child) => drafts.push(this.fromSpec(child, parent, meta)));
    }
    if (spec?.record) {
      const overlay = recordOverlay(spec.record, this.now, (recordId) => this.recordNodes.get(recordId) ?? null);
      overlay?.facets.forEach((facet) => drafts.push(this.fromSpec(facet, parent, meta)));
    }
    const authoredCount = drafts.length;
    const planned = spec?.children ? authoredCount + (spec.extra ?? 0) : parent.childCount;
    for (let i = authoredCount; i < planned; i++) drafts.push(this.proceduralDraft(parent, meta, i));
    return drafts;
  }

  private domainDraft(domain: DomainVocab): Draft {
    const id = `${ROOT_ID}/${domain.key}`;
    const size = Math.max(1, Math.round(domain.size * this.scale));
    const began = this.now - 3000 * DAY_MS;
    return {
      node: {
        id,
        parentId: ROOT_ID,
        kind: 'domain',
        glyph: domain.glyph,
        title: domain.title,
        d: 0,
        childCount: size,
        history: [{ type: 'began', at: new Date(began).toISOString(), origin: 'seeded' }],
        relationships: [],
        evidence: [],
        origin: 'seeded',
      },
      meta: { domain: domain.key, depth: -1, activeUntil: this.now, began },
    };
  }

  private constellationDrafts(parent: FieldNode, meta: Meta): Draft[] {
    const authored = AUTHORED_CONSTELLATIONS.filter((c) => c.domain === meta.domain);
    const drafts: Draft[] = [];
    for (const constellation of authored) {
      const began = this.now - constellation.began * DAY_MS;
      drafts.push({
        node: {
          id: `${parent.id}/${constellation.handle}`,
          parentId: parent.id,
          kind: 'constellation',
          glyph: parent.glyph,
          title: constellation.handle,
          d: 0,
          childCount: constellation.twins.length + constellation.extra,
          history: [{ type: 'began', at: new Date(began).toISOString(), origin: 'seeded' }],
          relationships: [],
          evidence: [],
          origin: 'seeded',
        },
        meta: { domain: meta.domain, depth: -1, activeUntil: this.now, began, constellationHandle: constellation.handle, spec: { slug: constellation.handle, kind: 'constellation', title: constellation.handle, began: constellation.began, children: constellation.twins, extra: constellation.extra } },
        weight: 1.9,
      });
    }
    for (let i = drafts.length; i < parent.childCount; i++) {
      const rng = rngFor(parent.id, 'constellation', i);
      const handle = handleFrom(rng);
      const began = this.now - between(rng, 30, 2400) * DAY_MS;
      drafts.push({
        node: {
          id: `${parent.id}/c${i}`,
          parentId: parent.id,
          kind: 'constellation',
          glyph: parent.glyph,
          title: handle,
          d: 0,
          childCount: 1 + Math.floor(Math.pow(rng(), 2.2) * 13),
          history: [{ type: 'began', at: new Date(began).toISOString(), origin: 'seeded' }],
          relationships: [],
          evidence: [],
          origin: 'seeded',
        },
        meta: { domain: meta.domain, depth: -1, activeUntil: this.now, began, constellationHandle: handle },
      });
    }
    return drafts;
  }

  private twinDrafts(parent: FieldNode, meta: Meta): Draft[] {
    const drafts: Draft[] = [];
    const authored = meta.spec?.children ?? [];
    for (const spec of authored) drafts.push(this.fromSpec(spec, parent, meta));
    const titles = shuffled(rngFor(parent.id, 'titles'), vocabOf(meta.domain).twinTitles);
    for (let i = drafts.length; i < parent.childCount; i++) drafts.push(this.proceduralTwin(parent, meta, i, titles[i % titles.length]));
    return drafts;
  }

  // ----------------------------------------------------------- authored specs

  private fromSpec(spec: AuthoredSpec, parent: FieldNode, parentMeta: Meta): Draft {
    const id = `${parent.id}/${spec.slug}`;
    const origin: Origin = spec.origin ?? 'seeded';
    const isTwin = Boolean(spec.twin);
    const depth = isTwin ? 0 : parentMeta.depth + 1;
    const overlay = spec.record ? recordOverlay(spec.record, this.now, (recordId) => this.recordNodes.get(recordId) ?? null) : null;

    const events: HistoryEvent[] = (spec.events ?? [['began', spec.began] as [HistoryEventType, number]]).map(([type, days, note]) => ({
      type,
      at: this.iso(days),
      note,
      origin,
    }));
    if (overlay) for (const [type, days, note] of overlay.events) events.push({ type, at: this.iso(days), note, origin: 'record' });
    events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

    const relationships: Relationship[] = (spec.rel ?? []).map(([type, target]) => ({
      type,
      targetId: target.includes('/') ? target : `${parent.id}/${target}`,
    }));
    if (overlay) for (const [type, targetId] of overlay.relationships) relationships.push({ type, targetId });

    let twin: TwinIdentity | undefined;
    if (spec.twin) {
      const earliest = Math.min(...events.map((event) => Date.parse(event.at)));
      twin = {
        title: spec.title,
        creator: spec.twin.creator,
        note: spec.twin.note,
        began: new Date(Math.min(earliest, this.now - spec.began * DAY_MS)).toISOString(),
        backers: spec.twin.backers,
        returners: spec.twin.returners,
        recordHref: overlay?.recordHref,
      };
    }

    const plannedChildren = spec.children
      ? spec.children.length + (spec.extra ?? 0) + (overlay?.facets.length ?? 0)
      : spec.record
        ? overlay?.facets.length ?? 0
        : this.plannedCount(spec.kind, depth, isTwin, rngFor(id, 'count'));

    const began = this.now - spec.began * DAY_MS;
    return {
      node: {
        id,
        parentId: parent.id,
        kind: spec.kind,
        glyph: spec.glyph ?? parent.glyph,
        title: spec.title,
        gist: spec.gist,
        body: spec.body ?? overlay?.summary,
        d: spec.d ?? defaultDisclosure(spec.kind, depth),
        childCount: plannedChildren,
        history: events,
        relationships,
        evidence: spec.evidence ?? [],
        twin,
        origin,
      },
      meta: {
        domain: parentMeta.domain,
        depth,
        spec: spec.record && !spec.children ? { ...spec, children: [] } : spec,
        facet: spec.kind === 'facet' ? facetFor(parentMeta.domain, spec.title) : parentMeta.facet,
        activeUntil: this.now,
        began,
        constellationHandle: parentMeta.constellationHandle,
      },
    };
  }

  // ------------------------------------------------------------- procedural

  private plannedCount(kind: NodeKind, depth: number, isTwin: boolean, rng: Rng) {
    if (isTwin) return intBetween(rng, 3, 6);
    if (kind === 'evidence' || kind === 'media') return 0;
    if (depth === 1) return intBetween(rng, 2, 6);
    if (depth === 2) {
      switch (kind) {
        case 'experiment':
        case 'component':
        case 'branch':
          return intBetween(rng, 1, 4);
        case 'dead_end':
        case 'question':
        case 'thought':
        case 'revision':
          return intBetween(rng, 0, 2);
        default:
          return 0;
      }
    }
    if (depth === 3) return kind === 'revision' || kind === 'experiment' || kind === 'component' ? intBetween(rng, 0, 2) : 0;
    return 0;
  }

  private proceduralTwin(parent: FieldNode, parentMeta: Meta, index: number, title: string): Draft {
    const id = `${parent.id}/t${index}`;
    const rng = rngFor(id);
    const ageDays = Math.floor(4 + Math.pow(rng(), 1.6) * 1500);
    const revisions = Math.min(Math.floor(1 + Math.pow(rng(), 1.4) * 96), Math.ceil(ageDays * 1.2));
    const returners = Math.floor(Math.pow(rng(), 2.1) * 5400);
    const backers = Math.floor(Math.pow(rng(), 2.8) * 980);
    const began = this.now - ageDays * DAY_MS;
    // A quarter of ideas go quiet for a while; some of those come back.
    const dormant = rng() < 0.25 && ageDays > 260;
    const revived = dormant && rng() < 0.45;
    const activeUntil = dormant && !revived ? this.now - between(rng, 200, Math.max(210, ageDays * 0.6)) * DAY_MS : this.now - between(rng, 0, 20) * DAY_MS;
    const history = this.twinHistory(rng, began, activeUntil, revisions, dormant, revived);
    const note = pick(rng, CREATOR_NOTES);
    const creator = parentMeta.constellationHandle ?? parent.title;
    const childCount = intBetween(rng, 3, 6);

    return {
      node: {
        id,
        parentId: parent.id,
        kind: 'twin',
        glyph: parent.glyph,
        title,
        d: rng() < 0.08 ? between(rng, 0.4, 0.52) : between(rng, 0.06, 0.24),
        childCount,
        history,
        relationships: [],
        evidence: [],
        twin: { title, creator, note, began: new Date(began).toISOString(), backers, returners },
        origin: 'seeded',
      },
      meta: { domain: parentMeta.domain, depth: 0, activeUntil, began, constellationHandle: creator },
    };
  }

  private twinHistory(rng: Rng, began: number, until: number, revisions: number, dormant: boolean, revived: boolean): HistoryEvent[] {
    const span = Math.max(DAY_MS, until - began);
    const events: HistoryEvent[] = [{ type: 'began', at: new Date(began).toISOString(), origin: 'seeded' }];
    const add = (type: HistoryEventType, at: number, note?: string) => events.push({ type, at: new Date(Math.min(at, this.now)).toISOString(), note, origin: 'seeded' });

    // Work comes in bursts, not a steady drip.
    const bursts = Array.from({ length: intBetween(rng, 2, 6) }, () => began + rng() * span);
    const sample = () => {
      const centre = bursts[Math.floor(rng() * bursts.length)];
      return Math.min(until, Math.max(began, centre + (rng() - 0.5) * span * 0.12));
    };
    for (let i = 0; i < revisions; i++) add('revised', sample());
    const creatorReturns = Math.round(revisions * between(rng, 0.3, 0.7));
    for (let i = 0; i < creatorReturns; i++) add('returned', sample());
    const branches = intBetween(rng, 0, 4);
    for (let i = 0; i < branches; i++) add('branched', sample());
    const deadEnds = intBetween(rng, 0, 3);
    for (let i = 0; i < deadEnds; i++) add('dead_end', sample());
    const evidence = intBetween(rng, 0, 5);
    for (let i = 0; i < evidence; i++) add('evidence', sample());
    for (let i = 0; i < intBetween(rng, 0, 4); i++) add('visited', began + rng() * (this.now - began));
    if (dormant) {
      add('dormant', until + 30 * DAY_MS);
      if (revived) {
        const back = this.now - between(rng, 5, 80) * DAY_MS;
        add('revived', back);
        for (let i = 0; i < intBetween(rng, 2, 8); i++) add('revised', back + rng() * (this.now - back));
      }
    }
    if (rng() < 0.03) add('realized', until);
    if (rng() < 0.12) add('converged', sample());
    events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    return events;
  }

  private proceduralDraft(parent: FieldNode, parentMeta: Meta, index: number): Draft {
    const vocab = vocabOf(parentMeta.domain);
    const id = `${parent.id}/n${index}`;
    const rng = rngFor(id);
    const isTwinBoundary = Boolean(parent.twin) || parentMeta.depth === 0;
    const depth = isTwinBoundary ? 1 : parentMeta.depth + 1;
    const start = Math.max(parentMeta.began, parentMeta.began + 1);
    const end = Math.max(start + DAY_MS, parentMeta.activeUntil);
    const began = start + Math.pow(rng(), 0.9) * (end - start) * 0.92;

    let kind: NodeKind;
    let title: string;
    let gist: string | undefined;
    let body: string | undefined;
    let facet = parentMeta.facet;
    let evidence: EvidenceRef[] = [];

    if (depth === 1) {
      const facets = shuffled(rngFor(parent.id, 'facets'), vocab.facets);
      facet = facets[index % facets.length];
      kind = 'facet';
      title = facet.title;
      gist = facet.gist;
    } else {
      kind = depth === 2 ? pick(rng, facet?.kinds ?? ['thought']) : childKind(parent.kind, depth, rng);
      if (kind === 'evidence' || kind === 'media') {
        const source = pick(rng, vocab.evidence);
        title = source.label + (rng() < 0.5 ? ' — ' + pick(rng, vocab.nouns) : '');
        body = pick(rng, vocab.observations);
        evidence = [
          {
            medium: source.medium,
            label: source.label,
            series: source.medium === 'measurement' ? walk(rng, 14) : undefined,
          },
        ];
      } else {
        title = fill(pick(rng, KIND_TEMPLATES[kind] ?? ['{Noun}']), vocab, rng, index);
        gist = pick(rng, KIND_GISTS[kind] ?? ['']);
        if (depth >= 3) body = pick(rng, vocab.observations);
      }
    }

    // Occasionally a part of an idea becomes an idea of its own.
    const becomesTwin = depth === 2 && (kind === 'component' || kind === 'branch' || kind === 'experiment') && rng() < 0.05;
    let twin: TwinIdentity | undefined;
    if (becomesTwin) {
      const collaborator = rng() < 0.4;
      twin = {
        title,
        creator: collaborator ? handleFrom(rng) : parentMeta.constellationHandle ?? 'unknown',
        note: collaborator ? 'Someone else picked this part up and kept going with it.' : 'This part started asking its own questions.',
        began: new Date(began).toISOString(),
        backers: Math.floor(Math.pow(rng(), 3) * 120),
        returners: Math.floor(Math.pow(rng(), 2.4) * 600),
      };
    }

    const history = this.subHistory(rng, kind, began, end);
    const d = kind === 'facet' ? facetDisclosure(rng) : itemDisclosure(rng, depth);

    return {
      node: {
        id,
        parentId: parent.id,
        kind,
        glyph: parent.glyph,
        title,
        gist,
        body,
        d,
        childCount: this.plannedCount(kind, twin ? 0 : depth, Boolean(twin), rngFor(id, 'count')),
        history,
        relationships: [],
        evidence,
        twin,
        origin: 'seeded',
      },
      meta: {
        domain: parentMeta.domain,
        depth: twin ? 0 : depth,
        facet,
        activeUntil: end,
        began,
        constellationHandle: parentMeta.constellationHandle,
      },
    };
  }

  private subHistory(rng: Rng, kind: NodeKind, began: number, end: number): HistoryEvent[] {
    const events: HistoryEvent[] = [{ type: 'began', at: new Date(began).toISOString(), origin: 'seeded' }];
    const at = () => new Date(began + rng() * Math.max(DAY_MS, end - began)).toISOString();
    const revisions =
      kind === 'component' ? intBetween(rng, 1, 5) : kind === 'facet' ? intBetween(rng, 2, 8) : kind === 'experiment' || kind === 'branch' ? intBetween(rng, 1, 3) : intBetween(rng, 0, 1);
    for (let i = 0; i < revisions; i++) events.push({ type: 'revised', at: at(), origin: 'seeded' });
    if (kind === 'evidence' || kind === 'media') events.push({ type: 'evidence', at: new Date(began).toISOString(), origin: 'seeded' });
    events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    if (kind === 'dead_end') events.push({ type: 'dead_end', at: new Date(Date.parse(events[events.length - 1].at) + DAY_MS).toISOString(), origin: 'seeded' });
    return events;
  }
}

// ----------------------------------------------------------------- helpers

export function ancestry(id: string): string[] {
  const parts = id.split('/');
  return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
}

function facetFor(domain: DomainKey, title: string): FacetTemplate | undefined {
  return vocabOf(domain).facets.find((facet) => facet.title === title) ?? vocabOf(domain).facets[0];
}

function defaultDisclosure(kind: NodeKind, depth: number) {
  if (kind === 'twin' || kind === 'domain' || kind === 'constellation') return 0.1;
  return Math.min(0.6, 0.1 + Math.max(0, depth - 1) * 0.1);
}

/** Most facets are public; some need backing; a few are the creator’s alone. */
function facetDisclosure(rng: Rng) {
  const roll = rng();
  if (roll < 0.12) return between(rng, 0.8, 0.95);
  if (roll < 0.28) return between(rng, 0.4, 0.52);
  return between(rng, 0.08, 0.28);
}

function itemDisclosure(rng: Rng, depth: number) {
  const roll = rng();
  if (roll < 0.08) return between(rng, 0.8, 0.95);
  if (roll < (depth >= 3 ? 0.42 : 0.28)) return between(rng, 0.36, depth >= 3 ? 0.64 : 0.52);
  return between(rng, 0.12, 0.33);
}

const CHILD_KINDS: Partial<Record<NodeKind, NodeKind[]>> = {
  experiment: ['evidence', 'revision', 'dead_end', 'thought'],
  component: ['revision', 'experiment', 'evidence', 'question'],
  branch: ['thought', 'experiment', 'revision', 'dead_end'],
  question: ['thought', 'evidence'],
  dead_end: ['evidence', 'thought'],
  revision: ['evidence', 'media'],
  thought: ['evidence', 'question'],
};

function childKind(parentKind: NodeKind, depth: number, rng: Rng): NodeKind {
  if (depth >= 4) return rng() < 0.7 ? 'evidence' : 'media';
  return pick(rng, CHILD_KINDS[parentKind] ?? ['thought']);
}

const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function fill(template: string, vocab: DomainVocab, rng: Rng, index: number) {
  const noun = pick(rng, vocab.nouns);
  const adj = pick(rng, vocab.adjectives);
  return template
    .replace('{noun}', noun)
    .replace('{Noun}', cap(noun))
    .replace('{adj}', adj)
    .replace('{Adj}', cap(adj))
    .replace('{approach}', pick(rng, vocab.approaches))
    .replace('{k}', String(2 + (index % 6)));
}

function walk(rng: Rng, length: number) {
  let value = 40 + rng() * 60;
  const drift = (rng() - 0.5) * 6;
  return Array.from({ length }, () => {
    value = Math.max(1, value + drift + (rng() - 0.5) * 10);
    return Math.round(value * 10) / 10;
  });
}
