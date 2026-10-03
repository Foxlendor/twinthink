import { describe, expect, it } from 'vitest';
import { RULES, createCore, groupLens, groupOf, hourLens, lensOf, replayLens, type Move, type Rule } from './core';
import { quarterFacing, quarterOf, type Station } from './flight';
import type { IdeaNode } from './model';

const node = (id: string, extra: Partial<IdeaNode> = {}): IdeaNode => ({
  id,
  title: id,
  kind: 'unknown',
  origin: 'real',
  began: 0,
  events: [],
  state: 'alive',
  disclosure: 0,
  children: [],
  x: 0,
  y: 0,
  r: 0.1,
  seed: 1,
  ...extra,
});
const station = (path: IdeaNode[], extra: Partial<Station> = {}) =>
  ({ node: path[path.length - 1], path, depth: path.length - 1, gate: path[path.length - 1].children.length > 0, t: path[path.length - 1].began, ...extra }) as Station;

/** A core whose keepers just write down what they were handed. */
const recorder = (waiting: string[] = []) => {
  const kept: string[] = [];
  const core = createCore({ waiting: (id) => waiting.includes(id) }, (r: Rule, key: string) => kept.push(`${r.keeper} ${r.forget ? '-' : '+'}${r.trace} ${key}`));
  return { core, kept };
};

const root = node('root');
const ring = node('people', { children: [node('p/a'), node('p/b')] });
const thing = station([root, ring, ring.children[0]]);

describe('the core: arriving and staying', () => {
  it('keeps nothing for simply passing through', () => {
    const { core, kept } = recorder();
    core.frame(thing, false, 0);
    core.frame(station([root, ring, ring.children[1]]), false, 5000);
    expect(kept).toEqual([]);
  });

  it('counts stillness from when you last stopped moving (resonance, the shared Fall), not from arriving', () => {
    const { core, kept } = recorder();
    core.frame(thing, false, 0); // arrived, still flying
    core.frame(thing, false, 2500); // still moving
    core.frame(thing, true, 2600); // stopped
    core.frame(thing, true, 5000);
    const shared = () => kept.filter((k) => !k.startsWith('device'));
    expect(shared()).toEqual(['live +station p/a']);
    core.frame(thing, true, 5700);
    expect(shared()).toEqual(['live +station p/a', 'anonymous +resonance p/a']);
    // and the stay itself is a step of your Fall, on this device
    expect(kept).toContain('device +journey p/a');
  });

  it('leaves resonance once a visit, however often you come back', () => {
    const { core, kept } = recorder();
    const other = station([root, ring, ring.children[1]]);
    for (const [s, t] of [[thing, 0], [thing, 3500], [other, 4000], [other, 7500], [thing, 8000], [thing, 12000]] as const) core.frame(s, true, t);
    expect(kept.filter((k) => k.includes('resonance'))).toEqual(['anonymous +resonance p/a', 'anonymous +resonance p/b']);
  });

  it('never sends anything about what lives only on this device, a keep, or what is sealed', () => {
    for (const s of [
      station([root, node('local/x/1')]),
      station([root, node('k/p/a')]),
      station([root, node('sealed', { disclosure: 0.8 }), node('p/in')]),
    ]) {
      const { core, kept } = recorder();
      core.frame(s, true, 0);
      core.frame(s, true, 9000);
      expect(kept.filter((k) => k.startsWith('anonymous'))).toEqual([]);
    }
  });

  it('finds what was waiting after a moment still with it, and only what was waiting', () => {
    const { core, kept } = recorder(['p/a']);
    core.frame(thing, true, 0);
    core.frame(thing, true, 1000);
    expect(kept.some((k) => k.includes('seen'))).toBe(false);
    core.frame(thing, true, 1300);
    expect(kept).toContain('device +seen p/a');
  });

  it('remembers a maker whose ring you stayed in, counted from arriving (the way in is part of the stay)', () => {
    const maker = station([root, node('maker/abc', { children: [node('p/m')] })]);
    const { core, kept } = recorder();
    core.frame(maker, false, 0); // flying in
    core.frame(maker, false, 1400);
    expect(kept.some((k) => k.includes('makers'))).toBe(false);
    core.frame(maker, true, 1600); // landed, 1.6s after it came in front of you
    expect(kept).toContain('device +makers abc');
  });

  it('keeps a fork paused at, and lets it go once you are truly inside it', () => {
    const gate = node('fork/f1', { children: [node('p/inside')] });
    const host = node('p/host', { children: [gate] });
    const { core, kept } = recorder();
    core.frame(station([root, host, gate]), true, 0);
    core.frame(station([root, host, gate]), true, 1300);
    expect(kept).toContain('device +passed fork/f1');
    core.frame(station([root, host, gate, gate.children[0]]), false, 1400);
    expect(kept).toContain('device -passed fork/f1');
  });
});

describe('the core: moves at a moment', () => {
  it('a Lean needs a real choice: a place with two or more paths', () => {
    const { core, kept } = recorder();
    core.move({ kind: 'choose', from: ring, to: ring.children[1] });
    core.move({ kind: 'choose', from: node('lone', { children: [node('only')] }), to: node('only') });
    expect(kept).toEqual(['device +leaned people\u0000p/b', 'device +explored people\u0001p/b', 'device +journey p/b', 'device +journey only']);
  });

  it('turning back out of a fork is pressure, once a visit for each fork', () => {
    const { core, kept } = recorder();
    const f = node('fork/f1');
    const m: Move = { kind: 'turnBack', from: f };
    core.move(m);
    core.move(m);
    core.move({ kind: 'turnBack', from: node('fork/f2') });
    expect(kept).toEqual(['anonymous +pressure fork/f1', 'anonymous +pressure fork/f2']);
  });

  it('every trace a fall leaves names its keeper, and is in this one table', () => {
    for (const r of RULES) expect(['device', 'anonymous', 'live']).toContain(r.keeper);
    expect([...new Set(RULES.map((r) => r.trace))].sort()).toEqual([
      'dew',
      'drop',
      'explored',
      'journey',
      'leaned',
      'makers',
      'passed',
      'pressure',
      'resonance',
      'seen',
      'station',
      'turned',
    ]);
  });

  it('Dew and Drop are said, one or the other, and never leave this device', () => {
    const { core, kept } = recorder();
    const x = node('p/x');
    core.move({ kind: 'react', at: x, carry: true });
    core.move({ kind: 'react', at: x, carry: false });
    expect(kept).toEqual(['device +dew p/x', 'device -drop p/x', 'device +drop p/x', 'device -dew p/x']);
  });

  it('an hour turned into is kept with where it was turned; turning back to the whole is not', () => {
    const { core, kept } = recorder();
    core.move({ kind: 'turn', hour: 2, where: 'music' });
    core.move({ kind: 'turn', hour: null, where: 'music' });
    core.move({ kind: 'turn', hour: 1, where: null });
    expect(kept).toEqual(['device +turned music\u00012', 'device +turned \u00011']);
  });
});

describe('lenses', () => {
  // 6:15 on his clock (UTC-6): 12:15 UTC
  const six = Date.UTC(2026, 8, 20, 12, 15);
  const three = Date.UTC(2026, 8, 20, 9, 0);

  it('the clock face: which quarter a moment falls in, and which quarter a direction faces', () => {
    expect(quarterOf(six)).toBe(2);
    expect(quarterOf(three)).toBe(1);
    expect(quarterOf(Date.UTC(2026, 8, 20, 18, 0))).toBe(0); // noon
    expect(quarterOf(Date.UTC(2026, 8, 20, 16, 20))).toBe(3); // 10:20
    expect([quarterFacing(0, -1), quarterFacing(1, 0), quarterFacing(0, 1), quarterFacing(-1, 0)]).toEqual([0, 1, 2, 3]);
    // with the clock's own spin a quarter turn on, what is now at the top is the 9
    expect(quarterFacing(0, -1, Math.PI / 2)).toBe(3);
  });

  it('turned into an hour, a fall holds only that hour, passing through rings; the Canvas always', () => {
    const inSix = station([root, ring, node('p/six', { began: six })]);
    const inThree = station([root, ring, node('p/three', { began: three })]);
    const inner = node('inner', { children: [node('p/i', { began: six })] });
    const gate = station([root, node('g', { children: [inner] }), inner], { gate: true, t: six });
    const canvas = station([root], { depth: 0 });
    const lens = hourLens(2);
    expect([lens(inSix), lens(inThree), lens(gate), lens(canvas)]).toEqual([false, true, true, false]);
    expect(hourLens(null)(inThree)).toBe(false);
  });

  it('turned into an hour on the Slate, only the groups holding work from around it stay', () => {
    const sixes = node('sixes', { children: [node('s/a', { began: six }), node('s/b', { began: three })] });
    const threes = node('threes', { children: [node('t/a', { began: three })] });
    const door = (g: IdeaNode) => station([root, g], { gate: true });
    expect([hourLens(2)(door(sixes)), hourLens(2)(door(threes))]).toEqual([false, true]);
    expect(hourLens(1)(door(sixes))).toBe(false);
  });

  it('on the Slate you pass its groups, never what is inside them by chance; inside one, only it', () => {
    const songs = node('songs', { children: [node('song/a')] });
    const dance = node('dance', { children: [node('clip/a')] });
    const lone = node('p/lone');
    const s = {
      songs: station([root, songs], { gate: true }),
      song: station([root, songs, songs.children[0]]),
      dance: station([root, dance], { gate: true }),
      clip: station([root, dance, dance.children[0]]),
      lone: station([root, lone]),
      canvas: station([root], { depth: 0 }),
    };
    const shown = (lens: (x: Station) => boolean) => Object.entries(s).filter(([, x]) => !lens(x)).map(([k]) => k);
    expect(shown(groupLens(null))).toEqual(['songs', 'dance', 'lone', 'canvas']);
    expect(shown(groupLens('songs'))).toEqual(['songs', 'song', 'canvas']);
    expect([groupOf(s.clip), groupOf(s.lone), groupOf(s.canvas)]).toEqual(['dance', 'p/lone', null]);
  });

  it('a lens leaves a thing out for any one of its reasons', () => {
    const later = station([root, ring, node('p/late', { began: 5000 })]);
    const lens = lensOf(replayLens(1000), () => false);
    expect(lens(later)).toBe(true);
    expect(lensOf(replayLens(null))(later)).toBe(false);
  });
});
