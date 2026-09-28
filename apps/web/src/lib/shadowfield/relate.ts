// What a thing goes with, elsewhere on the Slate: a dance to the song it is danced to, a post to
// the project it is about. Things in the same group are already together; this finds the ones in
// other groups that share a rare word (a name, a tag), never a common one. Pure (no DOM).

import type { IdeaNode } from './model';

export interface Related {
  path: IdeaNode[];
  /** The word they share, as it is written on the other one. */
  word: string;
}

/**
 * Ordinary words never connect things, however rarely they happen to appear here: only names and
 * tags do (a word with a digit in it, or one that is not ordinary English).
 */
const ORDINARY = new Set(
  (
    'about above after again against also another around away back because been before being below between both came cant come could does doing done down during each even every ever first from have having here into just keep kept know last left like little look made make many more most much must name near need never next night noon once only other over own part same says shared share should show since some still such take than that their them then there these they thing things this those through time today together under until upon very want well were what when where which while will with within without work would year your yours ' +
    'morning afternoon evening midnight past back again january february march april june july august september october november december monday tuesday wednesday thursday friday saturday sunday ' +
    'johne johneboi idea ideas song songs dance dancing moment moments exists came became roots what why'
  ).split(' ')
);

const words = (n: IdeaNode) =>
  `${n.title ?? ''} ${n.line ?? ''}`
    .toLowerCase()
    .normalize('NFKD')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !ORDINARY.has(w));

/** A word is rare if few things carry it: a name, not "night" or "what". */
const RARE = 3;

const cache = new WeakMap<IdeaNode, Map<string, IdeaNode[][]>>();

function index(root: IdeaNode) {
  const hit = cache.get(root);
  if (hit) return hit;
  const byWord = new Map<string, IdeaNode[][]>();
  const walk = (n: IdeaNode, path: IdeaNode[]) => {
    for (const c of n.children) {
      if (c.portal || c.void || c.disclosure > 0) continue;
      const p = [...path, c];
      for (const w of new Set(words(c))) {
        const list = byWord.get(w) ?? [];
        list.push(p);
        byWord.set(w, list);
      }
      walk(c, p);
    }
  };
  walk(root, [root]);
  cache.set(root, byWord);
  return byWord;
}

/**
 * Up to `max` things in other groups that share a rare word with `path`'s last thing (a word, or
 * one containing the other, such as "iu3d" in "siu3d"). Nearest-in-meaning first: fewest carriers.
 */
export function relatedTo(root: IdeaNode, path: IdeaNode[], max = 2): Related[] {
  const here = path[path.length - 1];
  const group = path[1]?.id;
  if (!here || !group || path.length < 3) return [];
  const byWord = index(root);
  const found = new Map<string, { r: Related; weight: number }>();
  for (const w of new Set(words(here))) {
    for (const [other, carriers] of byWord) {
      // the same name, or one inside the other when it is a coined one (has a digit): iu3d, siu3d
      if (other !== w && !(/\d/.test(w) && /\d/.test(other) && (other.includes(w) || w.includes(other)))) continue;
      if (carriers.length > RARE) continue;
      for (const p of carriers) {
        const n = p[p.length - 1];
        // across groups only, and between things, not between groups themselves
        if (p[1]?.id === group || n.id === here.id || p.length < 3) continue;
        const prev = found.get(n.id);
        if (!prev || carriers.length < prev.weight) found.set(n.id, { r: { path: p, word: other }, weight: carriers.length });
      }
    }
  }
  return [...found.values()]
    .sort((a, b) => a.weight - b.weight || a.r.path.length - b.r.path.length)
    .slice(0, max)
    .map((x) => x.r);
}
