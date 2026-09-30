// The Fall, formed by relationships: what a thing is, and the strands leading on from it.
//
// A source (Wikipedia and DBpedia for the preview examples; a maker's own Whoeuvre later) answers
// two questions and nothing else: what is this thing, and what leads on from it, how strongly and
// why. The space (space.ts) is built only from those answers: nothing here is laid out on a fixed
// track, and nothing is invented to fill a gap. If a source cannot be reached, it says so and
// the Fall shows nothing in its place.

export interface FallNode {
  /** Stable id. Anything that is not a maker's own work begins "sample/" (it never reaches the server). */
  id: string;
  title: string;
  /** One sentence about it, from the source itself (never written by us). */
  line?: string;
  /** When it was first made (ms), if the source knows. */
  began?: number;
  /** Where it comes from, and on what terms. */
  credit?: { label: string; href: string; license?: string; licenseHref?: string; data?: { label: string; href: string } };
}

/**
 * Which way a strand leads, as the source states it: toward where this thing came from (who
 * made it, what it grew from), toward what it led to (what it made, what grew from it), or to
 * kin beside it (filed together, named together, linked both ways).
 */
export type Bearing = 'from' | 'to' | 'beside' | 'linked';

export interface Strand {
  to: string;
  title: string;
  bearing: Bearing;
  /** Why it leads there, in the source's own terms, in plain words ("known for", "filed with"). */
  why?: string;
  /** How strongly the two are connected (0 to 1): close and clear when strong, far and faint when weak. */
  strength: number;
  /**
   * How it lies in the space, when that is more than its bearing: a `succession` (one version
   * becoming the next) runs almost straight on, so a run of them closes into a tunnel; `across` (it
   * contradicts this) lies far over a gap; `outside` (someone else's work that pulled this way)
   * comes in from far off; `faded` (left behind, abandoned for something else) is drawn thin.
   */
  shape?: 'succession' | 'across' | 'outside' | 'faded';
  /** A person's own work, met inside the knowledge it relates to: drawn as a thread of credit. */
  human?: boolean;
}

export interface Graph {
  /** What leads on from a thing, strongest first. Rejects when the source cannot be reached. */
  strands(id: string): Promise<Strand[]>;
  /** What a thing is. Rejects when the source cannot be reached. */
  node(id: string): Promise<FallNode>;
  /** A thing's name, when the source can say at once (without asking anyone). */
  titleNow?(id: string): string | undefined;
  /** Already known, without asking again (for drawing what lies a step ahead). */
  known?(id: string): Strand[] | undefined;
}

/**
 * The few ways on worth opening from one place: the strongest, but never all from one bearing
 * when others exist (so where something came from and what it led to are both there to see).
 */
export function chooseOpenings(strands: Strand[], max = 7): Strand[] {
  const sorted = [...strands].sort((a, b) => b.strength - a.strength || a.title.localeCompare(b.title));
  const out: Strand[] = [];
  const take = (s: Strand) => {
    if (out.length < max && !out.some((o) => o.to === s.to)) out.push(s);
  };
  // a person's own work is never crowded out by knowledge
  for (const s of sorted) if (s.human) take(s);
  // the strongest of each bearing first, then the strongest of the rest
  for (const b of ['from', 'to', 'beside', 'linked'] as Bearing[]) {
    const first = sorted.find((s) => s.bearing === b);
    if (first) take(first);
  }
  for (const s of sorted) take(s);
  return out.sort((a, b) => b.strength - a.strength || a.title.localeCompare(b.title));
}

/** House rule: no long dashes on the site. Text from a source keeps its words, with commas instead. */
export function undash(text: string): string {
  return text
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[\u2013\u2014]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}
