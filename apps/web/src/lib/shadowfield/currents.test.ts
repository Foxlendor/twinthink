import { describe, expect, it } from 'vitest';
import { buildStream, FOCUS } from './flight';
import type { IdeaNode } from './model';
import { crossZ, currentAt, currentsOf, fractionOf, leanDimension, neighbourFacing, neighboursOf, rimAngle } from './currents';

const H = 3600000;
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

// three groups on the Slate; B's things go with a thing in C by a coined name; D is made at the same hour as A but shares nothing
const a1 = node('a1', [], { began: 10 * H });
const a2 = node('a2', [], { began: 9 * H });
const a3 = node('a3', [], { began: 8 * H });
const A = node('A', [a1, a2, a3], { began: 10 * H });
const b1 = node('b1', [], { began: 20 * H, title: 'the SIU3d dance' });
const b2 = node('b2', [], { began: 19 * H });
const B = node('B', [b1, b2], { began: 20 * H });
const c1 = node('c1', [], { began: 30 * H, title: 'song $IU3d' });
const C = node('C', [c1], { began: 30 * H });
const d1 = node('d1', [], { began: 10 * H + 1 });
const D = node('D', [d1], { began: 10 * H + 1 });
const root = node('slate', [A, B, C, D], { began: 0 });
const stream = buildStream(root);
const currents = currentsOf(stream);
const at = (id: string) => stream.stations[stream.byId.get(id)!];

describe('currents', () => {
  it('are the runs of every holder, the Slate first', () => {
    expect([...currents.keys()].sort()).toEqual(['A', 'B', 'C', 'D', 'slate']);
    const cA = currents.get('A')!;
    expect(cA.z1).toBeGreaterThan(cA.z0);
    // the things A holds lie within A's run
    for (const id of ['a1', 'a2', 'a3']) expect(at(id).z).toBeGreaterThanOrEqual(cA.z0);
    for (const id of ['a1', 'a2', 'a3']) expect(at(id).z).toBeLessThanOrEqual(cA.z1);
  });

  it('know which one you are in from the thing in front of you', () => {
    expect(currentAt(currents, at('a2'))?.id).toBe('A');
    expect(currentAt(currents, at('A'))?.id).toBe('slate');
    expect(currentAt(currents, at('slate'))?.id).toBe('slate');
  });
});

describe('crossing keeps depth and makes no progress', () => {
  it('arrives at the same fraction of the other current', () => {
    const cA = currents.get('A')!;
    const cB = currents.get('B')!;
    for (const t of [0, 0.17, 0.43, 0.8, 1]) {
      const camZ = cA.z0 + t * (cA.z1 - cA.z0) - FOCUS;
      expect(fractionOf(stream, cA, camZ)).toBeCloseTo(t, 6);
      const z = crossZ(stream, cB, fractionOf(stream, cA, camZ), camZ);
      expect(fractionOf(stream, cB, z)).toBeCloseTo(t, 6);
    }
  });

  it('is its own inverse: there and back lands where you were', () => {
    const cA = currents.get('A')!;
    const cC = currents.get('C')!;
    const camZ = cA.z0 + 0.43 * (cA.z1 - cA.z0) - FOCUS;
    const there = crossZ(stream, cC, fractionOf(stream, cA, camZ), camZ);
    const back = crossZ(stream, cA, fractionOf(stream, cC, there), there);
    expect(back).toBeCloseTo(camZ, 6);
  });
});

describe('neighbours', () => {
  const nb = (id: string) => neighboursOf(stream, currents, currents.get(id)!, root);

  it('come only from relationships: holds, held by, beside, goes with', () => {
    const ofB = nb('B');
    expect(ofB.map((n) => [n.current.id, n.reason]).sort()).toEqual(
      [
        ['A', 'beside'],
        ['C', 'beside'],
        ['D', 'beside'],
        ['slate', 'held-by'],
      ].sort()
    );
    // the same current once, for the first reason found: C is beside B before it goes with it
    expect(ofB.filter((n) => n.current.id === 'C')).toHaveLength(1);
  });

  it('never makes a neighbour of something merely made at the same hour', () => {
    const onlyTime = node('E', [node('e1')], { began: 10 * H + 2 });
    const far = node('far', [onlyTime, node('F', [node('f1')], { began: 10 * H })]);
    const r2 = node('slate2', [A, far]);
    const s2 = buildStream(r2);
    const c2 = currentsOf(s2);
    const ofA = neighboursOf(s2, c2, c2.get('A')!, r2);
    expect(ofA.map((n) => n.current.id)).not.toContain('E');
    expect(ofA.map((n) => n.current.id)).not.toContain('F');
  });

  it('finds what a thing goes with across groups, by the shared name', () => {
    const b = node('B2', [node('bx', [], { title: 'the SIU3d dance', began: 20 * H })], { began: 20 * H });
    const c = node('C2', [node('cx', [], { title: 'song $IU3d', began: 30 * H })], { began: 30 * H });
    const other = node('other', [b]);
    const r3 = node('slate3', [other, c]);
    const s3 = buildStream(r3);
    const c3 = currentsOf(s3);
    const ofB = neighboursOf(s3, c3, c3.get('B2')!, r3);
    const goes = ofB.find((n) => n.current.id === 'C2');
    expect(goes?.reason).toBe('goes-with');
    expect(goes?.via.id).toBe('cx');
  });

  it('places each neighbour by the hour of what joins you, within its dimension', () => {
    const ofA = nb('A');
    for (const n of ofA) {
      expect(n.dimension).toBe(n.reason === 'held-by' || n.reason === 'holds' ? 'y' : 'x');
      // x neighbours wait on the left or right sides of the rim; y neighbours at the top or bottom
      const side = n.dimension === 'x' ? Math.abs(Math.cos(n.angle)) : Math.abs(Math.sin(n.angle));
      expect(side).toBeGreaterThan(0.7);
    }
  });

  it('rimAngle keeps an hour on its own dimension\'s side', () => {
    expect(Math.cos(rimAngle(-Math.PI / 2, 'x'))).toBeGreaterThan(0.7);
    expect(Math.sin(rimAngle(0, 'y'))).toBeLessThan(-0.7);
  });
});

describe('a lean picks within its own dimension', () => {
  it('left and right are one dimension, up and down the other, the middle none', () => {
    expect(leanDimension(1, 0)).toBe('x');
    expect(leanDimension(-0.8, 0.1)).toBe('x');
    expect(leanDimension(0, -1)).toBe('y');
    expect(leanDimension(0.1, 0.1)).toBeNull();
  });
  it('faces the nearest neighbour of that dimension only', () => {
    const ofB = neighboursOf(stream, currents, currents.get('B')!, root);
    const up = neighbourFacing(ofB, 0, -1);
    expect(up?.dimension).toBe('y');
    const side = neighbourFacing(ofB, 1, 0);
    expect(side?.dimension).toBe('x');
  });
});
