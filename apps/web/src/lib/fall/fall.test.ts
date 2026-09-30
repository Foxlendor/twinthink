import { describe, expect, it } from 'vitest';
import { Strand, chooseOpenings, undash } from './graph';
import { START, arrive, distanceFor, dot, len, norm, openingsAround, overlook, spreadFor, sub } from './space';
import { Row, WIKI_PREFIX, createWikiGraph, firstSentence, strandsFrom, titleOf, wikiId } from './wiki';

// real rows, as DBpedia answered the step query for Phonograph (trimmed)
const PHONOGRAPH: Row[] = [
  { b: 'http://dbpedia.org/resource/Phonograph_cylinder', label: 'Phonograph cylinder', shared: 4, out: [], in: [] },
  { b: 'http://dbpedia.org/resource/Turntablism', label: 'Turntablism', shared: 3, out: [], in: [] },
  { b: 'http://dbpedia.org/resource/Phonautograph', label: 'Phonautograph', shared: 1, out: [], in: [] },
  { b: 'http://dbpedia.org/resource/Thomas_Edison', label: 'Thomas Edison', shared: 1, out: [], in: ['knownFor'] },
  { b: 'http://dbpedia.org/resource/Amplifier', label: 'Amplifier', shared: 0, out: [], in: [] },
  { b: 'http://dbpedia.org/resource/File:Something.jpg', shared: 0, out: [], in: [] },
];

const s = (to: string, strength: number, bearing: Strand['bearing'] = 'beside'): Strand => ({ to, title: to, strength, bearing });

describe('strands, from what DBpedia says', () => {
  const strands = strandsFrom(PHONOGRAPH);
  const by = (name: string) => strands.find((x) => x.to === `${WIKI_PREFIX}${name}`)!;

  it('says why, in plain words, and which way it leads', () => {
    // Edison is known for the phonograph: where it came from
    expect(by('Thomas_Edison')).toMatchObject({ bearing: 'from', why: 'known for it', title: 'Thomas Edison' });
    // filed under the same categories: kin, beside it
    expect(by('Phonograph_cylinder')).toMatchObject({ bearing: 'beside', why: 'filed with' });
    // only linked both ways: between
    expect(by('Amplifier')).toMatchObject({ bearing: 'linked', why: 'linked both ways' });
  });

  it('is stronger the more is shared, strongest of all when a relation is stated', () => {
    expect(by('Phonograph_cylinder').strength).toBeGreaterThan(by('Phonautograph').strength);
    expect(by('Phonautograph').strength).toBeGreaterThan(by('Amplifier').strength);
    expect(by('Thomas_Edison').strength).toBeGreaterThan(by('Turntablism').strength);
  });

  it('never opens a file, a category or anything that is not an article', () => {
    expect(strands.some((x) => x.to.includes(':'))).toBe(false);
  });

  it("keeps DBpedia's own name for a thing as its id, always a sample", () => {
    expect(wikiId('Thomas Edison')).toBe('sample/wiki/Thomas_Edison');
    expect(titleOf('sample/wiki/Jason_%22Human_Kebab%22_Parsons')).toBe('Jason "Human Kebab" Parsons');
    expect(strands.every((x) => x.to.startsWith('sample/'))).toBe(true);
  });
});

describe('the house rule on dashes', () => {
  it('keeps the words, with commas and "to" instead of long dashes', () => {
    expect(undash('The phonograph \u2014 a device \u2014 records sound')).toBe('The phonograph, a device, records sound');
    expect(undash('1877\u20131890')).toBe('1877 to 1890');
    expect(firstSentence('A phonograph is a device. It was invented in 1877.')).toBe('A phonograph is a device.');
  });
});

describe('which ways open from a place', () => {
  it('keeps where it came from and what it led to, even when kin are stronger', () => {
    const open = chooseOpenings([s('a', 0.9), s('b', 0.85), s('c', 0.8), s('d', 0.75), s('e', 0.7), s('f', 0.65), s('g', 0.6), s('from', 0.4, 'from'), s('to', 0.3, 'to')], 7);
    expect(open.map((o) => o.to)).toContain('from');
    expect(open.map((o) => o.to)).toContain('to');
    expect(open).toHaveLength(7);
  });
});

describe('the space a path makes', () => {
  it('puts strong connections close and nearly ahead, weak ones far and to the side', () => {
    expect(distanceFor(0.95)).toBeLessThan(distanceFor(0.4));
    expect(spreadFor(0.95)).toBeLessThan(spreadFor(0.4));
    const [strong, weak] = openingsAround(START, [s('strong', 0.95), s('weak', 0.35)]);
    const d = (p: [number, number, number]) => len(sub(p, START.p));
    expect(d(strong.pos)).toBeLessThan(d(weak.pos));
    const ahead = (p: [number, number, number]) => dot(norm(sub(p, START.p)), START.f);
    expect(ahead(strong.pos)).toBeGreaterThan(ahead(weak.pos));
  });

  it('puts where it came from above you and what it led to below', () => {
    const [from] = openingsAround(START, [s('x', 0.6, 'from')]);
    const [to] = openingsAround(START, [s('y', 0.6, 'to')]);
    expect(dot(from.pos, START.u)).toBeGreaterThan(0);
    expect(dot(to.pos, START.u)).toBeLessThan(0);
  });

  it('joins the path back to a place already reached, instead of placing it again', () => {
    const [o] = openingsAround(START, [s('old', 0.6)], new Map([['old', [5, 5, 5]]]));
    expect(o.back).toBe(true);
    expect(o.pos).toEqual([5, 5, 5]);
  });

  it('turns you toward where you went, so turning the same way again and again curls', () => {
    let fr = START;
    const headings: number[] = [];
    for (let i = 0; i < 6; i++) {
      const [o] = openingsAround(fr, [s(`k${i}`, 0.5, 'beside')]);
      fr = arrive(fr, o.pos);
      headings.push(Math.atan2(fr.f[0], fr.f[2]));
    }
    // always kin to the same side: the heading keeps swinging one way (it curls, it does not zigzag)
    const turns = headings.slice(1).map((h, i) => Math.sign(Math.atan2(Math.sin(h - headings[i]), Math.cos(h - headings[i]))));
    expect(new Set(turns).size).toBe(1);
    // and up stays square to the way you face
    expect(Math.abs(dot(fr.f, fr.u))).toBeLessThan(1e-6);
  });

  it('can look back over the whole path from somewhere that holds all of it', () => {
    const places = [0, 1, 2].map((i) => ({ id: `p${i}`, title: `p${i}`, frame: { ...START, p: [i * 2, 0, i * 3] as [number, number, number] }, passed: [] }));
    const o = overlook(places);
    for (const p of places) expect(len(sub(p.frame.p, o.eye))).toBeGreaterThan(len(sub(o.at, o.eye)) * 0.5);
  });
});

describe('the Wikipedia source', () => {
  it('answers from the snapshot without asking anyone', async () => {
    const asked: string[] = [];
    const g = createWikiGraph({
      fetch: async (u) => {
        asked.push(u);
        return new Response('{}', { status: 500 });
      },
      snapshot: { taken: '2026-09-30', nodes: { Phonograph: { rows: PHONOGRAPH, summary: { title: 'Phonograph', extract: 'A phonograph is a device for recording sound. More.' } } } },
    });
    const strands = await g.strands('sample/wiki/Phonograph');
    expect(strands.length).toBeGreaterThan(3);
    const n = await g.node('sample/wiki/Phonograph');
    expect(n).toMatchObject({ title: 'Phonograph', line: 'A phonograph is a device for recording sound.' });
    expect(n.credit?.license).toBe('CC BY-SA 4.0');
    expect(asked).toEqual([]);
  });

  it('says it cannot be reached, and invents nothing, when the source fails', async () => {
    const g = createWikiGraph({ fetch: async () => new Response('busy', { status: 503 }) });
    await expect(g.strands('sample/wiki/Bicycle')).rejects.toThrow();
    await expect(g.node('sample/wiki/Bicycle')).rejects.toThrow();
  });

  it('asks gently: never more than two at a time, and names the site to Wikipedia', async () => {
    let now = 0;
    let most = 0;
    const heads: (HeadersInit | undefined)[] = [];
    const g = createWikiGraph({
      fetch: async (u, init) => {
        now++;
        most = Math.max(most, now);
        if (u.includes('wikipedia')) heads.push(init?.headers);
        await new Promise((r) => setTimeout(r, 5));
        now--;
        return new Response(JSON.stringify({ results: { bindings: [] }, title: 'X' }), { status: 200 });
      },
    });
    await Promise.all(['A', 'B', 'C', 'D', 'E'].map((t) => g.strands(`sample/wiki/${t}`)));
    await g.node('sample/wiki/A');
    expect(most).toBeLessThanOrEqual(2);
    expect(JSON.stringify(heads[0])).toContain('Api-User-Agent');
  });
});
