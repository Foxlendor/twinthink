import { describe, expect, it } from 'vitest';
import { VelocityTracker, WheelHops, landing, pxPerStop } from './gesture';

const run = (deltas: number[], every = 16, lineMode = false) => {
  const w = new WheelHops();
  let t = 1000;
  let hops = 0;
  for (const d of deltas) {
    if (w.push(d, t, lineMode)) hops++;
    t += every;
  }
  return hops;
};

describe('scrolling hops', () => {
  it('one trackpad swipe, swell and tail, is one hop', () => {
    expect(run([2, 8, 20, 34, 40, 38, 30, 22, 15, 10, 7, 5, 3, 2, 1])).toBe(1);
  });

  it('five wheel notches are five hops', () => {
    expect(run([100, 100, 100, 100, 100], 150)).toBe(5);
    expect(run([99, 99, 99, 99, 99], 150, true)).toBe(5);
  });

  it('a long steady push hops again, each needing more', () => {
    const h = run(Array(50).fill(20));
    expect(h).toBeGreaterThanOrEqual(2);
    expect(h).toBeLessThanOrEqual(3);
  });

  it('turning the other way starts over at once', () => {
    const w = new WheelHops();
    expect(w.push(30, 0)).toBe(1);
    expect(w.push(-30, 20)).toBe(-1);
  });
});

describe('letting go of a swipe', () => {
  const stop = pxPerStop(844);

  it('a slight, slow nudge goes back', () => {
    expect(landing(20 / stop, -300, -20)).toBe(0);
  });

  it('a quick short flick goes exactly one on', () => {
    expect(landing(30 / stop, -400, -30)).toBe(1);
    expect(landing(-30 / stop, 400, 30)).toBe(-1);
  });

  it('a slow long drag lands where it was carried', () => {
    expect(landing(2.6, -50, -2.6 * stop)).toBe(3);
    expect(landing(2.15, -50, -2.15 * stop)).toBe(2);
  });

  it('a finger that rested before letting go has no speed', () => {
    const v = new VelocityTracker();
    v.add(0, 0);
    v.add(16, 10);
    v.add(32, 20);
    expect(v.velocity(40)).toBeCloseTo(625, -1);
    expect(v.velocity(120)).toBe(0);
  });
});
