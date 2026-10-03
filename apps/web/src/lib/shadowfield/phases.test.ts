import { describe, expect, it } from 'vitest';
import { ENTER, EXIT, NAME_BUDGET, Phase, stepPhase, withinBudget } from './phases';

describe('semantic phases', () => {
  it('a name comes in only once near enough, and goes only once clearly back', () => {
    let p: Phase | undefined;
    p = stepPhase(p, ENTER - 0.01, 1 / 60);
    expect(p.on).toBe(false);
    p = stepPhase(p, ENTER + 0.01, 1 / 60);
    expect(p.on).toBe(true);
    // between EXIT and ENTER it stays: no flicker at the edge
    for (const n of [0.4, 0.3, 0.41, 0.29, 0.35]) {
      p = stepPhase(p, n, 1 / 60);
      expect(p.on).toBe(true);
    }
    p = stepPhase(p, EXIT - 0.01, 1 / 60);
    expect(p.on).toBe(false);
  });

  it('eases in decisively and out gently, and settles exactly', () => {
    let p: Phase = { on: false, a: 0 };
    p = stepPhase(p, 0.9, 0.1);
    const inAfter = p.a;
    let q: Phase = { on: true, a: 1 };
    q = stepPhase(q, 0.1, 0.1);
    expect(inAfter).toBeGreaterThan(1 - q.a);
    for (let i = 0; i < 200; i++) p = stepPhase(p, 0.9, 1 / 60);
    expect(p.a).toBe(1);
  });

  it('only a few names at once, the nearest, and always the one in front of you', () => {
    const names = Array.from({ length: 12 }, (_, i) => ({ id: i, near: i / 12 }));
    names[0] = { id: 0, near: 0, here: true } as (typeof names)[number] & { here: boolean };
    const kept = withinBudget(names);
    expect(kept).toHaveLength(NAME_BUDGET);
    expect(kept.map((k) => k.id)).toContain(0);
    expect(kept.map((k) => k.id)).toEqual([0, 11, 10, 9, 8]);
  });
});
