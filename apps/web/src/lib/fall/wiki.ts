// Real examples, from Wikipedia and DBpedia, for private previews only.
//
// Everything here is fetched in the visitor's browser and kept there: nothing reaches our server,
// and every id begins "sample/" so no keeper, trace or shared Fall ever takes it. Every title,
// sentence and connection comes from Wikipedia (text under CC BY-SA 4.0, credited on every place)
// or DBpedia (the connections, and why they exist). Nothing is made up: if either cannot be
// reached, the caller is told and shows nothing in its place.
//
// Gentle with both: at most two requests at a time, an Api-User-Agent naming the site, and
// answers kept on this device for a week (DBpedia's data changes only between its releases).

import { Bearing, FallNode, Graph, Strand, undash } from './graph';

export const WIKI_PREFIX = 'sample/wiki/';
const AGENT = 'TwinThink-preview/0.1 (https://twinth.ink)';
const WEEK = 7 * 86400000;

/** The starting places, as in the brief: a few real, well connected articles. */
export const WIKI_STARTS = ['Phonograph', 'Breakdancing', 'Bicycle', 'Animation', 'Notebook'];

// an id keeps DBpedia's own name for the thing, exactly as DBpedia writes it
export const wikiId = (title: string) => `${WIKI_PREFIX}${title.replace(/ /g, '_')}`;
const local = (id: string) => id.slice(WIKI_PREFIX.length);
const decoded = (id: string) => {
  try {
    return decodeURIComponent(local(id));
  } catch {
    return local(id);
  }
};
export const titleOf = (id: string) => decoded(id).replace(/_/g, ' ');
const resource = (id: string) => `http://dbpedia.org/resource/${local(id)}`;

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

// which way a DBpedia property leads, seen from here, and in what words
// (A is here, B the other; "out" is A p B, "in" is B p A)
const FROM_OUT: Record<string, string> = {
  foundedBy: 'founded by',
  founder: 'founded by',
  creator: 'made by',
  author: 'written by',
  inventor: 'invented by',
  designer: 'designed by',
  developer: 'developed by',
  producer: 'produced by',
  director: 'directed by',
  manufacturer: 'made by',
  architect: 'designed by',
  composer: 'composed by',
  writer: 'written by',
  parent: 'parent',
  influencedBy: 'influenced by',
  namedAfter: 'named after',
  basedOn: 'based on',
  stylisticOrigin: 'grew from',
};
const TO_OUT: Record<string, string> = {
  knownFor: 'known for',
  notableWork: 'work',
  product: 'makes',
  child: 'child',
  influenced: 'influenced',
  derivative: 'led to',
};
// the same relations, stated from the other end
const FROM_IN: Record<string, string> = {
  knownFor: 'known for it',
  notableWork: 'their work',
  product: 'made by',
  child: 'parent',
  influenced: 'influenced it',
  derivative: 'grew from',
};
const TO_IN: Record<string, string> = {
  foundedBy: 'founded',
  founder: 'founded',
  creator: 'made',
  author: 'wrote',
  inventor: 'invented',
  designer: 'designed',
  developer: 'developed',
  producer: 'produced',
  director: 'directed',
  manufacturer: 'made',
  architect: 'designed',
  composer: 'composed',
  writer: 'wrote',
  parent: 'child',
  influencedBy: 'influenced',
  namedAfter: 'named after it',
  basedOn: 'led to',
  stylisticOrigin: 'led to',
};
const words = (p: string) => p.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

/** One DBpedia answer about a neighbour, as the step query returns it. */
export interface Row {
  b: string;
  label?: string;
  shared: number;
  out: string[];
  in: string[];
}

/** From the rows of the step query to strands: bearing, the reason in words, and how strong. */
export function strandsFrom(rows: Row[]): Strand[] {
  const out: Strand[] = [];
  for (const r of rows) {
    const name = r.b.replace('http://dbpedia.org/resource/', '');
    if (!name || name.includes(':') || /[<>"\s{}|\\^`]/.test(name)) continue;
    let bearing: Bearing = r.shared > 0 ? 'beside' : 'linked';
    let why: string | undefined = r.shared > 0 ? 'filed with' : 'linked both ways';
    let typed = false;
    const pick = (b: Bearing, w: string) => {
      // a stated relation says more than kinship: from and to outrank beside
      if (!typed || (bearing === 'beside' && b !== 'beside')) {
        bearing = b;
        why = w;
        typed = true;
      }
    };
    for (const p of r.out) {
      if (FROM_OUT[p]) pick('from', FROM_OUT[p]);
      else if (TO_OUT[p]) pick('to', TO_OUT[p]);
      else pick('beside', words(p));
    }
    for (const p of r.in) {
      if (FROM_IN[p]) pick('from', FROM_IN[p]);
      else if (TO_IN[p]) pick('to', TO_IN[p]);
      else pick('beside', words(p));
    }
    const strength = Math.min(1, 0.35 + Math.min(0.36, 0.12 * r.shared) + (typed ? 0.3 : 0));
    const to = `${WIKI_PREFIX}${name}`;
    out.push({ to, title: undash(r.label || titleOf(to)), bearing, why, strength });
  }
  return out;
}

/** The step query: everything linked both ways with this article, with shared categories and stated relations. */
export function stepQuery(id: string) {
  const a = `<${resource(id)}>`;
  return `PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?b ?label (COUNT(DISTINCT ?c) AS ?shared) (GROUP_CONCAT(DISTINCT ?to; separator=" ") AS ?out) (GROUP_CONCAT(DISTINCT ?ti; separator=" ") AS ?in) WHERE {
  ${a} dbo:wikiPageWikiLink ?b . ?b dbo:wikiPageWikiLink ${a} .
  FILTER(STRSTARTS(STR(?b), "http://dbpedia.org/resource/") && !CONTAINS(STRAFTER(STR(?b), "resource/"), ":"))
  OPTIONAL { ?b rdfs:label ?label FILTER(lang(?label) = "en") }
  OPTIONAL { ${a} dct:subject ?c . ?b dct:subject ?c }
  OPTIONAL { ${a} ?po ?b FILTER(STRSTARTS(STR(?po), "http://dbpedia.org/ontology/") && ?po NOT IN (dbo:wikiPageWikiLink, dbo:wikiPageRedirects, dbo:wikiPageDisambiguates)) BIND(STRAFTER(STR(?po), "ontology/") AS ?to) }
  OPTIONAL { ?b ?pi ${a} FILTER(STRSTARTS(STR(?pi), "http://dbpedia.org/ontology/") && ?pi NOT IN (dbo:wikiPageWikiLink, dbo:wikiPageRedirects, dbo:wikiPageDisambiguates)) BIND(STRAFTER(STR(?pi), "ontology/") AS ?ti) }
} GROUP BY ?b ?label ORDER BY DESC(?shared) LIMIT 60`;
}

/** The first sentence of a summary (a place shows one line, never a page). */
export function firstSentence(text: string) {
  const t = undash(text);
  const m = t.match(/^(.{20,}?[.!?])(\s+[A-Z(]|$)/);
  return (m ? m[1] : t).slice(0, 240);
}

/** Ask DBpedia for one step: everything linked both ways with a thing, as rows (one per neighbour). */
export async function fetchRows(id: string, f: Fetch): Promise<Row[]> {
  const url = `https://dbpedia.org/sparql?query=${encodeURIComponent(stepQuery(id))}&format=${encodeURIComponent('application/sparql-results+json')}`;
  const res = await f(url, { headers: { Accept: 'application/sparql-results+json' } });
  if (!res.ok) throw new Error(`DBpedia ${res.status}`);
  const d = (await res.json()) as { results: { bindings: Record<string, { value: string }>[] } };
  // a neighbour with several English labels comes back once per label: keep it once
  const byB = new Map<string, Row>();
  for (const b of d.results.bindings) {
    const row: Row = {
      b: b.b.value,
      label: b.label?.value,
      shared: Number(b.shared?.value ?? 0),
      out: (b.out?.value ?? '').split(' ').filter(Boolean),
      in: (b.in?.value ?? '').split(' ').filter(Boolean),
    };
    const had = byB.get(row.b);
    if (!had) byB.set(row.b, row);
    else
      byB.set(row.b, {
        ...had,
        label: had.label ?? row.label,
        shared: Math.max(had.shared, row.shared),
        out: [...new Set([...had.out, ...row.out])],
        in: [...new Set([...had.in, ...row.in])],
      });
  }
  return [...byB.values()];
}

export interface Summary {
  title: string;
  extract?: string;
  page?: string;
  began?: number;
}

/** Ask Wikipedia what a thing is (its summary) and when its article was first written. */
export async function fetchSummary(id: string, f: Fetch): Promise<Summary> {
  const title = decoded(id);
  const res = await f(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { 'Api-User-Agent': AGENT } });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  const s = (await res.json()) as { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
  let began: number | undefined;
  try {
    const h = await f(
      `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=${encodeURIComponent(title)}&rvlimit=1&rvdir=newer&rvprop=timestamp&format=json&formatversion=2&origin=*`,
      { headers: { 'Api-User-Agent': AGENT } }
    );
    if (h.ok) {
      const q = (await h.json()) as { query?: { pages?: { revisions?: { timestamp?: string }[] }[] } };
      const ts = q.query?.pages?.[0]?.revisions?.[0]?.timestamp;
      if (ts) began = Date.parse(ts);
    }
  } catch {
    // no date: it simply has none shown
  }
  return { title: s.title ?? titleOf(id), extract: s.extract, page: s.content_urls?.desktop?.page, began };
}

/**
 * A snapshot of real answers, taken ahead of time (scripts/wiki-snapshot.ts), so the first steps
 * from each start need no wait. Keyed by DBpedia's own name for the thing. Past its edge, the
 * Fall asks the sources live.
 */
export interface Snapshot {
  taken: string;
  nodes: Record<string, { rows?: Row[]; summary?: Summary }>;
}

export function createWikiGraph(opts: { fetch?: Fetch; storage?: Pick<Storage, 'getItem' | 'setItem'> | null; now?: () => number; snapshot?: Snapshot | null } = {}): Graph {
  const f: Fetch = opts.fetch ?? ((u, i) => fetch(u, i));
  const now = opts.now ?? (() => Date.now());
  const memo = new Map<string, unknown>();
  const pending = new Map<string, Promise<unknown>>();
  // at most two requests at a time
  let running = 0;
  const waiting: (() => void)[] = [];
  const slot = async <T,>(job: () => Promise<T>): Promise<T> => {
    if (running >= 2) await new Promise<void>((r) => waiting.push(r));
    running++;
    try {
      return await job();
    } finally {
      running--;
      waiting.shift()?.();
    }
  };
  const kept = <T,>(key: string, get: () => Promise<T>): Promise<T> => {
    if (memo.has(key)) return Promise.resolve(memo.get(key) as T);
    const inFlight = pending.get(key);
    if (inFlight) return inFlight as Promise<T>;
    try {
      const raw = opts.storage?.getItem(`twinthink.fall.wiki.v1:${key}`);
      if (raw) {
        const d = JSON.parse(raw) as { t: number; v: T };
        if (now() - d.t < WEEK) {
          memo.set(key, d.v);
          return Promise.resolve(d.v);
        }
      }
    } catch {
      // nothing kept here, or not allowed: ask again
    }
    const p = slot(get).then((v) => {
      memo.set(key, v);
      pending.delete(key);
      try {
        opts.storage?.setItem(`twinthink.fall.wiki.v1:${key}`, JSON.stringify({ t: now(), v }));
      } catch {
        // no room: kept for this visit only
      }
      return v;
    });
    p.catch(() => pending.delete(key));
    pending.set(key, p);
    return p;
  };

  const snap = (id: string) => opts.snapshot?.nodes[local(id)];

  const strands = (id: string) => {
    const rows = snap(id)?.rows;
    if (rows) {
      const v = strandsFrom(rows).filter((s) => s.to !== id);
      memo.set(`s:${id}`, v);
      return Promise.resolve(v);
    }
    // DBpedia's public endpoint is often slow or busy: one more try, after a pause, before giving up
    return kept(`s:${id}`, async () => {
      let rows: Row[];
      try {
        rows = await fetchRows(id, f);
      } catch {
        await new Promise((r) => setTimeout(r, 2500));
        rows = await fetchRows(id, f);
      }
      return strandsFrom(rows).filter((s) => s.to !== id);
    });
  };

  const toNode = (id: string, s: Summary): FallNode => {
    const name = undash(s.title);
    return {
      id,
      title: name,
      line: s.extract ? firstSentence(s.extract) : undefined,
      began: s.began,
      credit: {
        label: `Wikipedia: ${name}`,
        href: s.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(decoded(id))}`,
        license: 'CC BY-SA 4.0',
        licenseHref: 'https://creativecommons.org/licenses/by-sa/4.0/',
        data: { label: 'DBpedia', href: `https://dbpedia.org/page/${local(id)}` },
      },
    };
  };

  const node = (id: string) => {
    const s = snap(id)?.summary;
    if (s) return Promise.resolve(toNode(id, s));
    return kept(`n:${id}`, async () => toNode(id, await fetchSummary(id, f)));
  };

  return {
    strands,
    node,
    known: (id) => memo.get(`s:${id}`) as Strand[] | undefined,
  };
}
