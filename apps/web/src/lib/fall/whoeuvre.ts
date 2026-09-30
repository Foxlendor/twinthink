// A maker's own Whoeuvre as a source for the Fall: the same two questions (what is this, and what
// leads on from it), answered from the Slate's own world, with nothing inferred.
//
// What leads on, and which way:
//   above (where it came from): the group or thing it is part of, and anything it grew from
//   below (what it led to): what it holds (the details underneath), and anything grown from it
//   beside: what was made alongside it in the same group, nearer the closer in time
//   between: what it goes with elsewhere on the Slate (a rare shared name, see relate.ts)
//
// Only what a visitor who is not signed in may actually enter is ever offered: a sealed thing,
// and everything beneath it, is left out entirely (not shown as a closed mark), and so is anything
// on a device, kept, or sample. Nothing here is sent anywhere.

import { Bearing, FallNode, Graph, Strand } from './graph';
import type { IdeaNode } from '../shadowfield/model';
import { relatedTo } from '../shadowfield/relate';
import { AUTHOR } from '../shadowfield/sources/author';

const DAY = 86400000;

/** How close a visitor who is not signed in stands to every group (as on the Slate). */
export const SIGNED_OUT = 0.45;

const PRIVATE = /^(local\/|k\/|sample\/)/;

/** Where on the Slate a thing lives (the Slate's own link form). */
export const slateLink = (path: IdeaNode[]) =>
  `/slate?at=${path
    .slice(1)
    .map((n) => encodeURIComponent(n.id))
    .join('~')}`;

export function createWhoeuvreGraph(world: IdeaNode, opts: { closeness?: (top: IdeaNode) => number } = {}): Graph {
  const closeness = opts.closeness ?? (() => SIGNED_OUT);
  // every thing this visitor may enter, with its path (root first)
  const paths = new Map<string, IdeaNode[]>();
  const grewFrom = new Map<string, string[]>();
  const walk = (node: IdeaNode, path: IdeaNode[]) => {
    for (const c of node.children) {
      if (c.portal || c.void || PRIVATE.test(c.id) || c.ownedBy === 'viewer') continue;
      const p = [...path, c];
      // beneath a sealed thing nothing is perceivable; a sealed thing is never entered
      if (p.length > 2 && c.disclosure > closeness(p[1])) continue;
      if (paths.has(c.id)) continue;
      paths.set(c.id, p);
      walk(c, p);
    }
  };
  paths.set(world.id, [world]);
  walk(world, [world]);
  for (const [id, p] of paths) {
    for (const l of p[p.length - 1].links ?? []) {
      if (l.kind !== 'grew-from' || !paths.has(l.to)) continue;
      grewFrom.set(l.to, [...(grewFrom.get(l.to) ?? []), id]);
    }
  }

  const titleOf = (n: IdeaNode) => (n.id === world.id ? `${AUTHOR.name}'s Whoeuvre` : n.title ?? 'untitled');

  const strandsOf = (id: string): Strand[] => {
    const path = paths.get(id);
    if (!path) return [];
    const node = path[path.length - 1];
    const out = new Map<string, Strand>();
    const add = (n: IdeaNode, bearing: Bearing, why: string, strength: number) => {
      if (n.id === id || !paths.has(n.id)) return;
      const had = out.get(n.id);
      if (!had || had.strength < strength) out.set(n.id, { to: n.id, title: titleOf(n), bearing, why, strength });
    };
    // above: what it is part of, and what it grew from
    if (path.length > 1) add(path[path.length - 2], 'from', 'part of', 0.9);
    for (const l of node.links ?? []) {
      const p = l.kind === 'grew-from' ? paths.get(l.to) : undefined;
      if (p) add(p[p.length - 1], 'from', 'grew from', 0.95);
    }
    // below: the details underneath, and what grew from it
    for (const c of node.children) if (paths.has(c.id)) add(c, 'to', 'inside it', 0.85);
    for (const g of grewFrom.get(id) ?? []) {
      const p = paths.get(g)!;
      add(p[p.length - 1], 'to', 'grew from it', 0.95);
    }
    // beside: made alongside it, the nearer in time the closer
    if (path.length > 1) {
      for (const s of path[path.length - 2].children) {
        if (s.id === id || !paths.has(s.id)) continue;
        const days = Math.abs(s.began - node.began) / DAY;
        add(s, 'beside', days < 1 ? 'made the same day' : 'made alongside', 0.42 + 0.36 * Math.exp(-days / 45));
      }
    }
    // between: what it goes with elsewhere (a rare name they share)
    if (path.length > 1) for (const r of relatedTo(world, path, 3)) add(r.path[r.path.length - 1], 'linked', `goes with (${r.word})`, 0.4);
    return [...out.values()];
  };

  const nodeOf = (id: string): FallNode => {
    const path = paths.get(id);
    if (!path) throw new Error('not here');
    const n = path[path.length - 1];
    const root = n.id === world.id;
    return {
      id,
      title: titleOf(n),
      line: root ? AUTHOR.line : n.line,
      began: root ? undefined : n.began,
      credit: { label: `${AUTHOR.name}'s Whoeuvre`, href: root ? '/slate' : slateLink(path) },
    };
  };

  return {
    strands: (id) => (paths.has(id) ? Promise.resolve(strandsOf(id)) : Promise.reject(new Error('not here'))),
    node: (id) => {
      try {
        return Promise.resolve(nodeOf(id));
      } catch (e) {
        return Promise.reject(e);
      }
    },
    known: (id) => (paths.has(id) ? strandsOf(id) : undefined),
    titleNow: (id) => {
      const p = paths.get(id);
      return p ? titleOf(p[p.length - 1]) : undefined;
    },
  };
}
