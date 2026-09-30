// Where you enter: search as a doorway into the space, never a list to browse.
//
// Search chooses where you enter. The Fall determines where you go.
//
// A name ("Phonograph", "Michael Jackson") goes straight to that article. A description ("early
// recorded sound", "how bicycles evolved") goes to the article that best matches it. Only when a
// name means several things ("Mercury") is there a choice, a short one, and it is gone as soon as
// one is chosen. Asked of Wikipedia from the visitor's browser, once per search (never per key),
// naming the site; nothing is sent to our server.

import { undash } from './graph';
import { AGENT, wikiId } from './wiki';

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export type Entrance =
  | { kind: 'enter'; id: string; title: string }
  | { kind: 'choose'; options: { id: string; title: string; about?: string }[] }
  | { kind: 'none' }
  | { kind: 'unreachable' };

interface Page {
  key: string;
  title: string;
  description?: string | null;
}

const DISAMBIGUATION = /^topics referred to by the same term$/i;
const API = 'https://en.wikipedia.org/w/rest.php/v1/search';

const same = (a: string, b: string) => a.trim().toLowerCase().replace(/_/g, ' ') === b.trim().toLowerCase().replace(/_/g, ' ');
const isDisambiguation = (p: Page) => !!p.description && DISAMBIGUATION.test(p.description);
const enter = (p: Page): Entrance => ({ kind: 'enter', id: wikiId(p.key), title: undash(p.title) });

/** Looks like a description of something rather than its name: several words, mostly lower case. */
export function isDescription(q: string) {
  const words = q.trim().split(/\s+/);
  if (words.length >= 4) return true;
  return words.length >= 2 && words.every((w) => w === w.toLowerCase());
}

export async function resolveEntrance(query: string, f: Fetch = (u, i) => fetch(u, i)): Promise<Entrance> {
  const q = query.trim().slice(0, 120);
  if (!q) return { kind: 'none' };
  const ask = async (kind: 'title' | 'page', text: string, limit: number): Promise<Page[]> => {
    const res = await f(`${API}/${kind}?q=${encodeURIComponent(text)}&limit=${limit}`, { headers: { 'Api-User-Agent': AGENT } });
    if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
    return ((await res.json()) as { pages?: Page[] }).pages ?? [];
  };
  try {
    // a description: the article that best matches it
    if (isDescription(q)) {
      const best = (await ask('page', q, 5)).find((p) => !isDisambiguation(p));
      return best ? enter(best) : { kind: 'none' };
    }
    const titles = await ask('title', q, 8);
    const exact = titles.find((p) => same(p.title, q) || same(p.key, q));
    if (exact && !isDisambiguation(exact)) return enter(exact);
    if (exact) {
      // a name that means several things: a short choice, of the things it names
      const variants = (await ask('title', `${exact.title} (`, 10)).filter((p) => p.title.startsWith(`${exact.title} (`) && !isDisambiguation(p));
      const options = (variants.length ? variants : titles.filter((p) => p !== exact && !isDisambiguation(p))).slice(0, 6);
      if (options.length === 1) return enter(options[0]);
      if (options.length) return { kind: 'choose', options: options.map((p) => ({ id: wikiId(p.key), title: undash(p.title), about: p.description ? undash(p.description) : undefined })) };
    }
    // the start of a name: the article it begins
    const first = titles.find((p) => !isDisambiguation(p));
    if (first && first.title.toLowerCase().startsWith(q.toLowerCase())) return enter(first);
    // otherwise, read as a description after all
    const best = (await ask('page', q, 5)).find((p) => !isDisambiguation(p));
    return best ? enter(best) : first ? enter(first) : { kind: 'none' };
  } catch {
    return { kind: 'unreachable' };
  }
}
