import { describe, expect, it } from 'vitest';
import { isDescription, resolveEntrance } from './enter';

// what Wikipedia's search answered (trimmed), keyed by the request
const ANSWERS: Record<string, { key: string; title: string; description?: string }[]> = {
  'title:Phonograph': [
    { key: 'Phonograph', title: 'Phonograph', description: 'Device for analogue recording of sound' },
    { key: 'Phonograph_record', title: 'Phonograph record', description: 'Disc-shaped analog sound storage medium' },
  ],
  'title:Mercury': [
    { key: 'Mercury', title: 'Mercury', description: 'Topics referred to by the same term' },
    { key: 'Freddie_Mercury', title: 'Freddie Mercury', description: 'British rock singer and songwriter (1946\u20131991)' },
  ],
  'title:Mercury (': [
    { key: 'Mercury_(planet)', title: 'Mercury (planet)', description: 'First planet from the Sun' },
    { key: 'Mercury_(element)', title: 'Mercury (element)', description: 'Chemical element with atomic number 80 (Hg)' },
    { key: 'Mercury(II)_chloride', title: 'Mercury(II) chloride', description: 'Toxic mercury compound' },
    { key: 'Mercury_(mythology)', title: 'Mercury (mythology)', description: 'Roman god of trade, merchants and travel' },
  ],
  'title:phonogr': [{ key: 'Phonograph', title: 'Phonograph', description: 'Device for analogue recording of sound' }],
  'page:early recorded sound': [{ key: 'Sound_recording_and_reproduction', title: 'Sound recording and reproduction' }],
  'title:Qxzv': [],
  'page:Qxzv': [],
};

const asked: string[] = [];
const fake = async (url: string, init?: RequestInit) => {
  const u = new URL(url);
  // Wikipedia's title search ignores case
  const q = u.searchParams.get('q') ?? '';
  const kind = u.pathname.endsWith('/title') ? 'title' : 'page';
  const key = Object.keys(ANSWERS).find((k) => k.toLowerCase() === `${kind}:${q}`.toLowerCase()) ?? `${kind}:${q}`;
  asked.push(key);
  expect(JSON.stringify(init?.headers)).toContain('Api-User-Agent');
  return new Response(JSON.stringify({ pages: ANSWERS[key] ?? [] }), { status: 200 });
};

describe('search chooses where you enter', () => {
  it('takes a name straight to its place, with no list in between', async () => {
    expect(await resolveEntrance('Phonograph', fake)).toEqual({ kind: 'enter', id: 'sample/wiki/Phonograph', title: 'Phonograph' });
    expect(await resolveEntrance('  phonograph ', fake)).toMatchObject({ kind: 'enter', id: 'sample/wiki/Phonograph' });
  });

  it('takes the start of a name to what it begins', async () => {
    expect(await resolveEntrance('phonogr', fake)).toMatchObject({ kind: 'enter', title: 'Phonograph' });
  });

  it('takes a description to the place that best matches it', async () => {
    expect(await resolveEntrance('early recorded sound', fake)).toMatchObject({ kind: 'enter', id: 'sample/wiki/Sound_recording_and_reproduction' });
  });

  it('asks which one only when a name means several things, and offers only the things it names', async () => {
    const r = await resolveEntrance('Mercury', fake);
    expect(r.kind).toBe('choose');
    if (r.kind !== 'choose') return;
    expect(r.options.map((o) => o.title)).toEqual(['Mercury (planet)', 'Mercury (element)', 'Mercury (mythology)']);
    expect(r.options[0]).toMatchObject({ id: 'sample/wiki/Mercury_(planet)', about: 'First planet from the Sun' });
  });

  it('says when there is nothing, or when Wikipedia cannot be reached, and invents nothing', async () => {
    expect(await resolveEntrance('Qxzv', fake)).toEqual({ kind: 'none' });
    expect(await resolveEntrance('', fake)).toEqual({ kind: 'none' });
    expect(await resolveEntrance('Bicycle', async () => new Response('busy', { status: 429 }))).toEqual({ kind: 'unreachable' });
  });

  it('tells a description from a name', () => {
    expect(isDescription('early recorded sound')).toBe(true);
    expect(isDescription('how bicycles evolved over time')).toBe(true);
    expect(isDescription('Michael Jackson')).toBe(false);
    expect(isDescription('Phonograph')).toBe(false);
  });
});
