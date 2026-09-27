// Your share: the appearance TwinThink derives from your account, the way some
// games derive each player's look from theirs. Nobody picks it and nobody can
// copy it: the same Canvas is seen through slightly different paper by each
// person, and the grain itself shows whose view it is.
//
// The seed comes from the account (an opaque value the server derives from it)
// or, before signing in, from this device. Everything here is pure and
// deterministic: the same seed always makes the same paper.

export interface Appearance {
  /** Direction the paper fibres run, in radians. */
  fiberAngle: number;
  /** How much fibres wander from that direction. */
  fiberSpread: number;
  /** Fibres per 10,000 square pixels of paper. */
  fiberDensity: number;
  /** Grain specks per 10,000 square pixels. */
  grainDensity: number;
  /** -1 cool .. 1 warm; a whisper of tint, never a colour. */
  warmth: number;
}

export interface Fiber {
  x: number;
  y: number;
  angle: number;
  length: number;
  bend: number;
  alpha: number;
}

export interface Speck {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

/** FNV-1a over the seed text, then a mixing step. */
export function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  return h >>> 0;
}

function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function appearanceOf(seed: number): Appearance {
  const r = random(seed);
  return {
    fiberAngle: r() * Math.PI,
    fiberSpread: 0.15 + r() * 0.55,
    fiberDensity: 1.2 + r() * 2.4,
    grainDensity: 5 + r() * 14,
    warmth: r() * 2 - 1,
  };
}

/** One repeating tile of paper for this appearance: fibres and grain, as data. */
export function paperTile(seed: number, size: number): { fibers: Fiber[]; specks: Speck[]; appearance: Appearance } {
  const appearance = appearanceOf(seed);
  const r = random(seed ^ 0x9e3779b9);
  const area = (size * size) / 10_000;
  const fibers: Fiber[] = Array.from({ length: Math.round(appearance.fiberDensity * area) }, () => ({
    x: r() * size,
    y: r() * size,
    angle: appearance.fiberAngle + (r() - 0.5) * 2 * appearance.fiberSpread,
    length: 5 + r() * 16,
    bend: (r() - 0.5) * 0.8,
    alpha: 0.018 + r() * 0.03,
  }));
  const specks: Speck[] = Array.from({ length: Math.round(appearance.grainDensity * area) }, () => ({
    x: r() * size,
    y: r() * size,
    size: 0.5 + r() * 0.9,
    alpha: 0.015 + r() * 0.035,
  }));
  return { fibers, specks, appearance };
}

/** The faint tint over the page: warm or cool graphite, never a hue you would notice. */
export function tintOf(a: Appearance): string {
  return a.warmth >= 0 ? `rgba(196,150,96,${(0.012 * a.warmth).toFixed(4)})` : `rgba(96,120,150,${(0.012 * -a.warmth).toFixed(4)})`;
}
