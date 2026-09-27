/**
 * Scrubbing UI for audio and video seek controls.
 */

export interface ScrubRange {
  from: number;
  to: number;
  total: number;
}

export interface Scrubber {
  id: string;
  shape: { cx: number; cy: number; r: number };
  range: ScrubRange;
}

/** Check if a point is on (or near) a scrubber control. */
export function onScrubber(shape: { cx: number; cy: number; r: number }, x: number, y: number, tolerance = 8): boolean {
  const dx = x - shape.cx;
  const dy = y - shape.cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist <= shape.r + tolerance;
}

/** Extract fraction along a scrubber's ring (0..1). */
export function dragFraction(
  shape: { cx: number; cy: number; r: number },
  x: number,
  y: number,
  total: number
): number {
  const dx = x - shape.cx;
  const dy = y - shape.cy;
  const angle = Math.atan2(dy, dx);
  return ((angle + Math.PI) / (Math.PI * 2)) * total;
}

/** Unwrap a fractional position past the ring boundary. */
export function unwrapDrag(f: number, min: number, max: number): number {
  if (f < min) return min;
  if (f > max) return max;
  return f;
}

/** Seek helpers. */
export function seekTime(range: ScrubRange, frac: number): number {
  return range.from + frac * (range.to - range.from);
}

export function timeAt(current: number, range: ScrubRange): number {
  if (range.to === range.from) return 0;
  return (current - range.from) / (range.to - range.from);
}

export function trimRange(from: number, to: number, total: number): ScrubRange {
  return { from, to, total };
}

export function stepSeek(current: number, delta: number, range: ScrubRange): number {
  const next = current + delta;
  return Math.max(range.from, Math.min(range.to, next));
}

/** Format a time value for display. */
export function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  const sign = seconds < 0 ? '-' : '';
  if (h > 0) return `${sign}${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

/** Find point fraction along a line segment. */
export function pointFraction(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  const t = ((x - x1) * dx + (y - y1) * dy) / len2;
  return Math.max(0, Math.min(1, t));
}

/** Nearest grid point. */
export function nearCentre(value: number, snap: number): number {
  return Math.round(value / snap) * snap;
}

/** Reach of a value from center. */
export function reachOf(value: number, center: number): number {
  return Math.abs(value - center);
}
