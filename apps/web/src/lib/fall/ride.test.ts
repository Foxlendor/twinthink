import { describe, expect, it } from 'vitest';
import { Strand } from './graph';
import { START, len, openingsAround, sub } from './space';
import { CRUISE, SETTLE_AT, branchFor, captureAt, easeSpeed, leadIn, legOf, mainCurrent, paceAt, screenward, settleSpeed, zoneAt } from './ride';

const s = (to: string, strength: number, bearing: Strand['bearing'], human = false): Strand => ({ to, title: to, strength, bearing, human });

// a split as space.ts forms it: kin either side, what it grew from above, what it led to below
const strands = [s('left-or-right', 0.62, 'beside'), s('other-side', 0.5, 'beside'), s('above', 0.9, 'from'), s('below', 0.55, 'to'), s('made-by-someone', 0.8, 'to', true)];
const fork = openingsAround(START, strands);

describe('the current', () => {
  it('with no lean, carries you along the strongest relationship, never into a person’s work', () => {
    expect(mainCurrent(fork)?.strand.to).toBe('above');
    expect(branchFor(START, fork, { x: 0, y: 0 })?.strand.to).toBe('above');
    // a lean too small to be one is no lean
    expect(branchFor(START, fork, { x: 0.1, y: 0.05 })?.strand.to).toBe('above');
  });

  it('takes a person’s work when that is all that leads on', () => {
    expect(mainCurrent(openingsAround(START, [s('piece', 0.8, 'to', true)]))?.strand.to).toBe('piece');
  });

  it('steers into the branch lying the way you lean', () => {
    for (const o of fork) {
      if (o.strand.human) continue;
      const [x, y] = screenward(START, o.pos);
      const m = Math.hypot(x, y);
      const chosen = branchFor(START, fork, { x: x / m, y: y / m });
      // two branches may share a direction; the one chosen lies that way
      const [cx, cy] = screenward(START, chosen!.pos);
      expect(Math.abs(Math.atan2(cy, cx) - Math.atan2(y, x))).toBeLessThan(0.3);
    }
    // leaning down finds what it led to (a person's side current included)
    expect(['below', 'made-by-someone']).toContain(branchFor(START, fork, { x: 0, y: 1 })?.strand.to);
  });

  it('captures you gradually, only as you near the split', () => {
    expect(captureAt(0.3)).toBe(0);
    expect(captureAt(0.7)).toBeGreaterThan(0);
    expect(captureAt(0.7)).toBeLessThan(captureAt(0.9));
    expect(captureAt(1)).toBe(1);
  });

  it('runs slower through a dense subject and faster across a weak gap', () => {
    expect(paceAt(0.5, 0.2, 0.5)).toBeGreaterThan(paceAt(0.5, 0.9, 0.5));
    expect(paceAt(0.02, 0.5, 1)).toBeLessThan(paceAt(0.02, 0.5, 0));
    expect(paceAt(0.02, 0.5, 0.5)).toBeLessThan(paceAt(0.5, 0.5, 0.5));
  });
});

describe('stopping', () => {
  it('begins at once when held, and the current picks back up more gently', () => {
    let v = CRUISE;
    for (let i = 0; i < 6; i++) v = easeSpeed(v, 0, 1 / 60, true);
    // a tenth of a second in, already visibly slower
    expect(v).toBeLessThan(CRUISE * 0.7);
    for (let i = 0; i < 60; i++) v = easeSpeed(v, 0, 1 / 60, true);
    expect(v).toBeLessThan(CRUISE * 0.02);
    let up = 0;
    for (let i = 0; i < 6; i++) up = easeSpeed(up, CRUISE, 1 / 60, false);
    expect(up).toBeGreaterThan(0);
    expect(up).toBeLessThan(CRUISE * 0.2);
  });

  it('settles, with no attention, inside the next subject', () => {
    expect(settleSpeed(0.2, CRUISE)).toBe(CRUISE);
    expect(settleSpeed(SETTLE_AT, CRUISE)).toBe(0);
    expect(zoneAt(SETTLE_AT, true)).toBe('arriving');
  });

  it('knows what stopping reveals, by where you are', () => {
    expect(zoneAt(0.05, true)).toBe('leaving');
    expect(zoneAt(0.35, true)).toBe('passage');
    expect(zoneAt(0.8, true)).toBe('arriving');
    // the way in has nothing behind it
    expect(zoneAt(0.3, false)).toBe('arriving');
  });
});

describe('legs', () => {
  it('run from one subject to the next, as long as the relationship is', () => {
    const b = { ...START, p: [0, 0, 3] as [number, number, number] };
    const leg = legOf('a', 'b', START, b, 0.8);
    expect(len(sub(leg.path(0), START.p))).toBeLessThan(1e-9);
    expect(len(sub(leg.path(1), b.p))).toBeLessThan(1e-9);
    expect(leg.length).toBeCloseTo(3, 1);
  });

  it('begin a little way up the current into where you enter', () => {
    const lead = leadIn(START, 'here');
    expect(lead.from).toBeNull();
    expect(len(sub(lead.path(1), START.p))).toBeLessThan(1e-9);
  });
});
