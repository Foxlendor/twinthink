import { describe, expect, it } from 'vitest';
import { FOCUS, buildStream, newFlightCam, project, viewOf } from './flight';
import type { IdeaNode } from './model';

const node = (id: string, children: IdeaNode[] = []): IdeaNode => ({ id, title: id, kind: 'unknown', origin: 'real', began: 0, events: [], state: 'alive', disclosure: 0, children, x: 0, y: 0, r: 0.1, seed: 1 });
const stream = buildStream(node('slate', [node('a'), node('b')]));

describe('the screen is a window', () => {
  const cam = newFlightCam();
  const still = viewOf(stream, cam, 800, 600, undefined, null);
  const moved = viewOf(stream, cam, 800, 600, undefined, { ex: 0.2, ey: -0.1, near: 1 });
  const dx = (dz: number) => project(moved, 0.3, 0.2, dz)[0] - project(still, 0.3, 0.2, dz)[0];
  const dy = (dz: number) => project(moved, 0.3, 0.2, dz)[1] - project(still, 0.3, 0.2, dz)[1];

  it('holds what is at the focus plane still when the head moves', () => {
    expect(dx(FOCUS)).toBeCloseTo(0, 6);
    expect(dy(FOCUS)).toBeCloseTo(0, 6);
  });
  it('slides what is beyond the window with the head, and what is nearer against it', () => {
    expect(dx(4)).toBeGreaterThan(0);
    expect(dy(4)).toBeLessThan(0);
    expect(dx(0.4)).toBeLessThan(0);
    // the farther, the more: toward the full shift of the vanishing point
    expect(dx(8)).toBeGreaterThan(dx(4));
    expect(dx(1000)).toBeCloseTo(moved.F * 0.2, 0);
  });
  it('shows a little more of the world when the head comes nearer, and never changes the centre', () => {
    const nearer = viewOf(stream, cam, 800, 600, undefined, { ex: 0, ey: 0, near: 1.3 });
    expect(nearer.F).toBeLessThan(still.F);
    expect(nearer.cx).toBe(still.cx);
    expect(nearer.cy).toBe(still.cy);
  });
});
