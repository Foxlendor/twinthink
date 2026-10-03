import { describe, expect, it } from 'vitest';
import { JOURNEY_KEY, addStep, beginJourney, forgetJourneys, recapOf, writeJourneys } from './journey';

const store = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe('your Fall, in order', () => {
  it('replays in the order it happened, folding repeats, and never invents order for what had none', () => {
    let j = beginJourney(null, 1);
    for (const [t, at, how] of [[2, 'a', 'stay'], [3, 'a', 'stay'], [4, 'b', 'choose'], [5, 'b', 'stay'], [6, 'c', 'stay']] as const) j = addStep(j, { t, at, how });
    expect(recapOf(j.current, () => true).route.map((s) => s.at)).toEqual(['a', 'b', 'c']);
    expect(recapOf(beginJourney(null, 1).current, () => true)).toEqual({ route: [], leftOpen: null });
  });

  it('a path left open was really offered on this Fall, is open to you now, and was never reached', () => {
    let j = beginJourney(null, 1);
    j = addStep(j, { t: 1, at: 'x', how: 'stay', open: ['y', 'z'] });
    j = addStep(j, { t: 2, at: 'y', how: 'choose' });
    j = addStep(j, { t: 3, at: 'q', how: 'stay', open: ['sealed'] });
    // y was reached; sealed is closed to you now: z is the one left open
    expect(recapOf(j.current, (id) => id !== 'sealed').leftOpen).toEqual({ id: 'z', at: 'x' });
    expect(recapOf(j.current, () => false).leftOpen).toBeNull();
  });

  it('is kept on this device, a new visit starts a new Fall, the last ones are kept, and it can all be forgotten', () => {
    const s = store();
    let j = beginJourney(s, 1);
    j = addStep(j, { t: 2, at: 'a', how: 'stay' });
    writeJourneys(s, j);
    const next = beginJourney(s, 10);
    expect(next.current.steps).toEqual([]);
    expect(next.past.map((p) => p.steps.map((x) => x.at))).toEqual([['a']]);
    // a visit that went nowhere does not push the others out
    writeJourneys(s, next);
    expect(beginJourney(s, 20).past).toHaveLength(1);
    expect(forgetJourneys(30)).toMatchObject({ past: [], current: { steps: [] } });
    // nothing but ids, times, how, an hour and ids of other ways
    s.m.set(JOURNEY_KEY, JSON.stringify({ current: { id: 'x', began: 1, steps: [{ t: 1, at: 'a', how: 'stay', secret: 'no' }, { t: 'bad' }] } }));
    expect(beginJourney(s, 40).past[0].steps).toEqual([{ t: 1, at: 'a', how: 'stay' }]);
  });
});
