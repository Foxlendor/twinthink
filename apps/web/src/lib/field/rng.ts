/** Deterministic randomness. The Canvas must look the same every time you return. */

export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function random() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a, good enough to turn node ids into seeds. */
export function hashString(value: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Rng = () => number;

export function rngFor(...parts: Array<string | number>): Rng {
  return mulberry32(hashString(parts.join('|')));
}

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length) % list.length];
}

export function between(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min);
}

export function intBetween(rng: Rng, min: number, max: number) {
  return Math.floor(between(rng, min, max + 1));
}

/** Fisher–Yates on a copy. */
export function shuffled<T>(rng: Rng, list: readonly T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
