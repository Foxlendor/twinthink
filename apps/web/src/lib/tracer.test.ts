import { describe, expect, it } from 'vitest';
import { selectMarks, tracePixels } from './tracer';

describe('private picture contours', () => {
  it('does not turn a transparent picture into false dark outlines', () => {
    expect(tracePixels(new Uint8ClampedArray(4 * 4 * 4), 4, 4).segments).toEqual([]);
  });
  it('finds an edge at each brightness level', () => {
    const pixels = new Uint8ClampedArray([0,0,0,255,255,255,255,255,0,0,0,255,255,255,255,255]);
    const trace = tracePixels(pixels, 2, 2);
    expect(trace.segments).toHaveLength(5);
    expect(new Set(trace.segments.map(s => s.level)).size).toBe(5);
    for (const segment of trace.segments) expect(segment.from[0]).toBeCloseTo(segment.to[0]);
  });
  it('enforces the density cap without changing the stored contours', () => {
    const segment = { from: [0, 0] as [number, number], to: [1, 1] as [number, number], level: 96 };
    const trace = { width: 2, height: 2, segments: Array.from({ length: 20000 }, () => segment) };
    expect(selectMarks(trace, 100)).toHaveLength(5000);
    expect(selectMarks(trace, 10000)).toHaveLength(5000);
    expect(selectMarks(trace, 1)).toHaveLength(149);
    expect(trace.segments).toHaveLength(20000);
  });
});
