import { describe, expect, it } from 'vitest';
import type { IdeaNode } from '../shadowfield/model';
import { chooseOpenings } from './graph';
import { BRIDGES } from './bridges';
import { joinSources } from './sources';
import { createWhoeuvreGraph } from './whoeuvre';
import { createWikiGraph } from './wiki';

const node = (id: string, children: IdeaNode[] = [], extra: Partial<IdeaNode> = {}): IdeaNode => ({
  id,
  title: id,
  kind: 'unknown',
  origin: 'real',
  began: 0,
  events: [],
  state: 'alive',
  disclosure: 0,
  children,
  x: 0,
  y: 0,
  r: 0.1,
  seed: 1,
  ...extra,
});

// a made-up Whoeuvre and made-up bridges, for this test only
const lamp = node('lamp', [], { title: 'a lamp that listens' });
const hidden = node('hidden', [], { disclosure: 0.9 });
const world = node('canvas', [node('lab', [lamp, hidden])]);
const PHONO = {
  taken: 't',
  nodes: {
    Phonograph: {
      rows: [
        { b: 'http://dbpedia.org/resource/A', label: 'A', shared: 4, out: [], in: [] },
        { b: 'http://dbpedia.org/resource/B', label: 'B', shared: 4, out: [], in: [] },
        { b: 'http://dbpedia.org/resource/C', label: 'C', shared: 4, out: [], in: [] },
        { b: 'http://dbpedia.org/resource/D', label: 'D', shared: 4, out: [], in: [] },
        { b: 'http://dbpedia.org/resource/E', label: 'E', shared: 4, out: [], in: [] },
        { b: 'http://dbpedia.org/resource/F', label: 'F', shared: 4, out: [], in: [] },
        { b: 'http://dbpedia.org/resource/G', label: 'G', shared: 4, out: [], in: [] },
        { b: 'http://dbpedia.org/resource/H', label: 'H', shared: 4, out: [], in: [] },
      ],
    },
  },
};
const offline = async () => new Response('offline', { status: 503 });
const wiki = createWikiGraph({ fetch: offline, snapshot: PHONO });
const who = createWhoeuvreGraph(world);
const bridges = [
  { piece: 'lamp', article: 'Phonograph', why: 'it answers the same question' },
  { piece: 'hidden', article: 'Phonograph', why: 'private' },
];

describe('knowledge and human work in one space', () => {
  const g = joinSources(wiki, who, bridges, 'someone');

  it('shows a thread of credit from an article to the piece its maker tied to it', async () => {
    const s = await g.strands('sample/wiki/Phonograph');
    const human = s.filter((x) => x.human);
    expect(human.map((x) => x.to)).toEqual(['lamp']);
    expect(human[0].why).toBe('someone made this: it answers the same question');
  });

  it('never draws a thread to a piece that is not open to everyone', async () => {
    const s = await g.strands('sample/wiki/Phonograph');
    expect(s.some((x) => x.to === 'hidden')).toBe(false);
  });

  it('never lets knowledge crowd a person out of the ways on', async () => {
    const s = await g.strands('sample/wiki/Phonograph');
    expect(s.length).toBeGreaterThan(7);
    expect(chooseOpenings(s).some((x) => x.human)).toBe(true);
  });

  it('leads from the piece back to the article, and on through the Whoeuvre', async () => {
    const s = await g.strands('lamp');
    expect(s.find((x) => x.to === 'sample/wiki/Phonograph')).toMatchObject({ bearing: 'from', why: 'it answers the same question' });
    expect(s.some((x) => x.to === 'lab')).toBe(true);
    expect((await g.node('lamp')).title).toBe('a lamp that listens');
  });

  it('holds no bridges until the maker writes them', () => {
    expect(BRIDGES).toEqual([]);
  });
});
