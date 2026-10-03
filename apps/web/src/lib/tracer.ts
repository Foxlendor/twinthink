export type TraceSegment = { from: [number, number]; to: [number, number]; level: number };
export type Trace = { width: number; height: number; segments: TraceSegment[] };

// Marching squares, computed once per picture. Display choices reuse this geometry.
export function tracePixels(data: Uint8ClampedArray, width: number, height: number): Trace {
  if (width < 2 || height < 2 || data.length !== width * height * 4) throw new Error('Invalid picture dimensions.');
  const light = new Float32Array(width * height);
  for (let i = 0; i < light.length; i++) {
    const alpha = data[i * 4 + 3] / 255;
    light[i] = (data[i * 4] * .2126 + data[i * 4 + 1] * .7152 + data[i * 4 + 2] * .0722) * alpha + 255 * (1 - alpha);
  }
  const segments: TraceSegment[] = [];
  for (const level of [48, 96, 144, 192, 224]) {
    for (let y = 0; y < height - 1; y++) for (let x = 0; x < width - 1; x++) {
      const values = [light[y * width + x], light[y * width + x + 1], light[(y + 1) * width + x + 1], light[(y + 1) * width + x]];
      const corners = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
      const crossings: [number, number][] = [];
      for (let edge = 0; edge < 4; edge++) {
        const next = (edge + 1) % 4;
        if ((values[edge] < level) === (values[next] < level)) continue;
        const t = (level - values[edge]) / (values[next] - values[edge]);
        crossings.push([corners[edge][0] + t * (corners[next][0] - corners[edge][0]), corners[edge][1] + t * (corners[next][1] - corners[edge][1])]);
      }
      if (crossings.length === 4 && values.reduce((a, b) => a + b, 0) / 4 < level) crossings.push(crossings.shift()!);
      for (let i = 0; i + 1 < crossings.length; i += 2) segments.push({ from: crossings[i], to: crossings[i + 1], level });
    }
  }
  return { width, height, segments };
}

export function selectMarks(trace: Trace, density: number): TraceSegment[] {
  const value = Math.max(1, Math.min(100, Number.isFinite(density) ? density : 1));
  const limit = Math.round(100 + value * 49);
  const count = Math.min(limit, trace.segments.length);
  return Array.from({ length: count }, (_, i) => trace.segments[Math.floor(i * trace.segments.length / count)]);
}
