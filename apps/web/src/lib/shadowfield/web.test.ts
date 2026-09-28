import { describe, expect, it } from 'vitest';
import {
  FOOD_MAX,
  PostedLike,
  admitPlucks,
  beginVisit,
  emptyMemory,
  findFood,
  markMaker,
  markSeen,
  plucksFor,
  readMemory,
  trembleAt,
  wave,
  writeMemory,
} from './web';

const DAY = '2026-09-27';
const post = (p: Partial<PostedLike> & { id: string }): PostedLike => ({ public: true, mine: false, created: 1000, ...p });
const all = () => true;

describe('the web that moves: what counts as food', () => {
  it('work built on yours, or on what you kept, plucks hardest, in rose', () => {
    const f = findFood({
      posted: [post({ id: 'mine', mine: true }), post({ id: 'a', from: 'mine' }), post({ id: 'b', from: 'kept1' })],
      keeps: ['p/kept1'],
      memory: emptyMemory(),
      today: DAY,
      open: all,
    });
    expect(f.map((x) => [x.id, x.why, x.rose])).toEqual([
      ['p/a', 'built-on-yours', true],
      ['p/b', 'built-on-kept', true],
    ]);
  });

  it('a first visit trembles only for today’s word (nothing is “new” to someone new)', () => {
    const f = findFood({
      posted: [post({ id: 'x', created: 5 }), post({ id: 't', day: DAY })],
      keeps: [],
      memory: emptyMemory(),
      today: DAY,
      fresh: [{ id: 'music/new', began: 99 }],
      open: all,
    });
    expect(f.map((x) => x.id)).toEqual(['p/t']);
  });

  it('never your own, never private, hidden, sealed or seen', () => {
    const memory = markSeen(emptyMemory(), 'p/seen');
    const f = findFood({
      posted: [
        post({ id: 'own', mine: true, day: DAY }),
        post({ id: 'priv', public: false, day: DAY }),
        post({ id: 'hid', hidden: true, day: DAY }),
        post({ id: 'sealed', day: DAY }),
        post({ id: 'seen', day: DAY }),
      ],
      keeps: [],
      memory,
      today: DAY,
      open: (id) => id !== 'p/sealed',
    });
    expect(f).toEqual([]);
  });

  it('new work by a maker you stayed with, and what is new since you were here', () => {
    let memory = markMaker(emptyMemory(), 'mk1');
    memory = { ...memory, since: 500 };
    const f = findFood({
      posted: [post({ id: 'm', maker: 'mk1', created: 900 }), post({ id: 'old', maker: 'mk1', created: 100 })],
      keeps: [],
      memory,
      today: DAY,
      fresh: [{ id: 'music/a', began: 800, ring: 'music' }, ...['1', '2', '3', '4'].map((k) => ({ id: `moment/${k}`, began: 900, ring: 'moments' }))],
      open: all,
    });
    expect(f.map((x) => [x.id, x.why])).toEqual([
      ['p/m', 'maker'],
      ['music/a', 'new'],
      ['moments', 'new'],
    ]);
  });

  it('no more than a handful tremble at once', () => {
    const posted = Array.from({ length: 30 }, (_, i) => post({ id: `t${i}`, day: DAY }));
    expect(findFood({ posted, keeps: [], memory: emptyMemory(), today: DAY, open: all })).toHaveLength(FOOD_MAX);
  });
});

describe('the web that moves: plucks and waves', () => {
  it('plucks come often at first, then settle into a slow hum', () => {
    const t = plucksFor('p/a', 100, 200).map((x) => x - 100);
    const off = t[0];
    expect(t.map((x) => +(x - off).toFixed(3))).toEqual([0, 2.5, 5, 10, 20, 40, 70]);
    expect(off).toBeGreaterThanOrEqual(0);
    expect(off).toBeLessThan(1.5);
  });

  it('a wave travels toward you and dies away', () => {
    expect(wave(1, 7, 10, 10)).toBe(0); // not yet arrived 7 units away
    expect(Math.abs(wave(1, 7, 11.03, 10))).toBeGreaterThan(0.05);
    expect(wave(1, 0, 12, 10)).toBe(0); // long gone
  });

  it('only the stretch between you and the food trembles', () => {
    const plucks = [{ id: 'p/a', z: 10, t0: 0, a: 1, rose: true }];
    expect(trembleAt(plucks, 12, 0, 0.5).T).toBe(0); // beyond it
    expect(trembleAt(plucks, -3, 0, 2).T).toBe(0); // behind you
    const near = trembleAt(plucks, 9, 0, 1 / 7 + 0.03);
    expect(Math.abs(near.T)).toBeGreaterThan(0);
    expect(near.rose).toBe(true);
  });

  it('no more than three at a time, never too strong together', () => {
    const live = Array.from({ length: 6 }, (_, i) => ({ id: `${i}`, z: 1, t0: i * 0.1, a: 0.6, rose: false }));
    const got = admitPlucks(live, 1);
    expect(got.length).toBeLessThanOrEqual(3);
    expect(got.reduce((s, p) => s + p.a, 0)).toBeLessThanOrEqual(1.2);
  });
});

describe('the web that moves: what the device remembers', () => {
  it('holds only ids and times, and measures “new” from the visit before', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    let m = beginVisit(readMemory(storage), 1000);
    expect(m.since).toBe(0);
    m = markSeen(markMaker(m, 'abc123'), 'p/x');
    writeMemory(storage, m);
    const later = beginVisit(readMemory(storage), 1000 + 31 * 60 * 1000);
    expect(later.since).toBe(1000);
    const raw = JSON.parse([...mem.values()][0]);
    expect(Object.keys(raw).sort()).toEqual(['left', 'makers', 'passed', 'seen', 'since']);
    for (const v of Object.values(raw)) {
      if (Array.isArray(v)) for (const x of v) expect(typeof x).toBe('string');
      else expect(typeof v).toBe('number');
    }
  });

  it('a fork paused at is kept until it is truly entered, so a way back to it survives', async () => {
    const { markPassed, clearPassed } = await import('./web');
    let m = emptyMemory();
    m = markPassed(m, 'fork/f1');
    expect(m.passed).toEqual(['fork/f1']);
    // pausing at it again is not a second turn not taken
    m = markPassed(m, 'fork/f1');
    expect(m.passed).toEqual(['fork/f1']);
    m = markPassed(m, 'fork/f2');
    expect(m.passed).toEqual(['fork/f1', 'fork/f2']);
    // entering it (or letting it go) is the only thing that clears it
    m = clearPassed(m, 'fork/f1');
    expect(m.passed).toEqual(['fork/f2']);
  });
});

describe('the review’s cases (web)', () => {
  it('the last pluck is known without listing them all', async () => {
    const { lastPluck } = await import('./web');
    for (const now of [100, 101, 103, 107, 141.9, 200, 5000]) {
      const all = plucksFor('p/a', 100, now);
      expect(lastPluck('p/a', 100, now)).toBe(all[all.length - 1]);
    }
  });

  it('a ring with a lot new trembles only for what may be seen', () => {
    const f = findFood({
      posted: [],
      keeps: [],
      memory: { ...emptyMemory(), since: 10 },
      today: DAY,
      fresh: ['1', '2', '3', '4'].map((k) => ({ id: `sealed/${k}`, began: 50, ring: 'twinthink' })),
      open: (id) => !id.startsWith('sealed/'),
    });
    expect(f).toEqual([]);
  });
});
