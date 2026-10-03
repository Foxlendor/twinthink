// The light behind you: your head moves the window, your silhouette shades the Fall.
//
// Two things, both on this device and never sent anywhere. Your head, found by the camera,
// moves the eye a little, so the screen is a window into the current: what is in front of you
// holds still, what is beyond it slides with you. Your silhouette stands between a light behind
// you and the Fall, so its shadow falls forward onto whatever is there, larger and softer on
// what is near, smaller on what is far: a planar shadow, cast by depth, not pasted on the frame.
//
// Pure: calibration, smoothing, the eye's offset, and the shade at a point. The camera and the
// models live in tracking.ts.

/** What the camera reads each time: where the head is in the picture (0..1), and how big it looks. */
export interface HeadReading {
  x: number;
  y: number;
  /** The distance between the eyes, as a fraction of the picture's width: larger is nearer. */
  d: number;
  t: number;
}

/** Where "straight ahead" is: the reading when the viewer set the centre (or the first one). */
export interface Calibration {
  x0: number;
  y0: number;
  d0: number;
}

/** The eye's offset from the window's centre, in track units at the window (focus) plane, and how near it is. */
export interface EyeOffset {
  ex: number;
  ey: number;
  /** 1 at the calibrated distance; above 1 nearer, below 1 farther. */
  near: number;
}

/** How far the window moves for how far the head moves, and how far it may go. */
export const HEAD_GAIN = 0.8;
export const HEAD_MAX = 0.35;
/** How long after the last reading the offset begins to ease back to centre, and how long that takes. */
export const LOSS_AFTER_MS = 350;
export const LOSS_EASE_MS = 900;

export function calibrate(r: HeadReading): Calibration {
  return { x0: r.x, y0: r.y, d0: Math.max(0.02, r.d) };
}

/**
 * The eye, from a head reading. The camera's picture is not mirrored, so a head moving to its own
 * right moves left in the picture; looking through a window, that slides the far world left too,
 * so the signs fall out as they are. Down in the picture is down.
 */
export function eyeOf(r: HeadReading, c: Calibration): EyeOffset {
  const ex = Math.max(-HEAD_MAX, Math.min(HEAD_MAX, (r.x - c.x0) * HEAD_GAIN));
  const ey = Math.max(-HEAD_MAX, Math.min(HEAD_MAX, -(r.y - c.y0) * HEAD_GAIN));
  const near = Math.max(0.7, Math.min(1.4, r.d / c.d0));
  return { ex, ey, near };
}

/**
 * Smoothing that is quick to follow a real move and still on a still head: the more the reading
 * changes, the more of it is taken (a one-euro filter, in its plainest form).
 */
export class HeadFilter {
  private prev: HeadReading | null = null;
  private lastSeen = 0;
  /** The smoothed reading, or null before the first. */
  value: HeadReading | null = null;

  feed(r: HeadReading) {
    this.lastSeen = r.t;
    if (!this.prev) {
      this.prev = { ...r };
      this.value = { ...r };
      return;
    }
    const dt = Math.max(1, r.t - this.prev.t) / 1000;
    const speed = Math.hypot(r.x - this.prev.x, r.y - this.prev.y) / dt;
    // a still head is held to 0.6 Hz of jitter; a moving one follows up to the frame rate
    const cutoff = 0.6 + 2.2 * speed;
    const alpha = 1 - Math.exp(-2 * Math.PI * cutoff * dt);
    const v = this.value!;
    this.value = { x: v.x + (r.x - v.x) * alpha, y: v.y + (r.y - v.y) * alpha, d: v.d + (r.d - v.d) * alpha * 0.5, t: r.t };
    this.prev = { ...r };
  }

  /** How much of the offset still applies at `now`: 1 while seen, easing to 0 once the head is lost. */
  weight(now: number): number {
    if (!this.value) return 0;
    const since = now - this.lastSeen;
    if (since <= LOSS_AFTER_MS) return 1;
    const u = Math.min(1, (since - LOSS_AFTER_MS) / LOSS_EASE_MS);
    return 1 - u * u * (3 - 2 * u);
  }

  reset() {
    this.prev = null;
    this.value = null;
    this.lastSeen = 0;
  }
}

/** The eye at `now`, eased back toward the centre when the head is lost; null when nothing has been seen. */
export function eyeAt(f: HeadFilter, c: Calibration | null, now: number): EyeOffset | null {
  if (!f.value || !c) return null;
  const e = eyeOf(f.value, c);
  const w = f.weight(now);
  return { ex: e.ex * w, ey: e.ey * w, near: 1 + (e.near - 1) * w };
}

// ---------------------------------------------------------------------------------------- the shadow

/** Where the light and the silhouette stand behind the eye (track units), and how wide the silhouette's plane is. */
export const LIGHT_BEHIND = 1.5;
export const SILHOUETTE_BEHIND = 0.32;
export const SILHOUETTE_WIDTH = 0.42;
/** How much of the ink a shadow takes away where it falls fully. */
export const SHADE_STRENGTH = 0.62;
/** The silhouette's mask: one square of this many samples a side, mirrored to match your own sides. */
export const MASK_N = 96;

/**
 * Where a point of the Fall, `dz` ahead of the eye and (X, Y) off its axis, meets the silhouette's
 * plane on its way from the light: the plane's coordinates (0..1), or outside it. The light sits
 * on the eye's axis behind the silhouette, so the shadow grows toward what is near and shrinks
 * toward what is far, as a shadow does.
 */
export function silhouetteUV(X: number, Y: number, dz: number): [number, number] {
  const t = (LIGHT_BEHIND - SILHOUETTE_BEHIND) / (dz + LIGHT_BEHIND);
  return [(X * t) / SILHOUETTE_WIDTH + 0.5, (Y * t) / SILHOUETTE_WIDTH + 0.5];
}

/** The mask sampled between its samples, 0 outside. */
export function sampleMask(mask: Float32Array, n: number, u: number, v: number): number {
  if (u <= 0 || v <= 0 || u >= 1 || v >= 1) return 0;
  const fx = u * (n - 1);
  const fy = v * (n - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(n - 1, x0 + 1);
  const y1 = Math.min(n - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = mask[y0 * n + x0] * (1 - tx) + mask[y0 * n + x1] * tx;
  const b = mask[y1 * n + x0] * (1 - tx) + mask[y1 * n + x1] * tx;
  return a * (1 - ty) + b * ty;
}

/**
 * The shade (0..1) a silhouette casts on a point drawn at screen (sx, sy), dz ahead, seen with the
 * eye's centre at (eyeX, eyeY) on screen and F pixels per unit at distance one.
 */
export function shadeAt(mask: Float32Array, n: number, sx: number, sy: number, dz: number, eyeX: number, eyeY: number, F: number, strength = SHADE_STRENGTH): number {
  if (dz <= 0) return 0;
  const X = ((sx - eyeX) * dz) / F;
  const Y = ((sy - eyeY) * dz) / F;
  const [u, v] = silhouetteUV(X, Y, dz);
  return strength * sampleMask(mask, n, u, v);
}

/**
 * The mask, made from the camera's person map: brought down to n x n, mirrored so your right is
 * the screen's right, cut at a clean edge (a shadow has one), then softened a little on purpose
 * (a penumbra is the light's doing, not the camera's uncertainty).
 */
export function maskFrom(src: Float32Array | Uint8Array, w: number, h: number, n: number, out: Float32Array, feather = 1): Float32Array {
  const scale = src instanceof Uint8Array ? 1 / 255 : 1;
  // the camera's picture is wider than it is tall; the mask takes its middle square
  const side = Math.min(w, h);
  const ox = Math.floor((w - side) / 2);
  const oy = Math.floor((h - side) / 2);
  const tmp = new Float32Array(n * n);
  const cell = side / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      // a box over the cell
      const x0 = ox + Math.floor(i * cell);
      const y0 = oy + Math.floor(j * cell);
      const x1 = ox + Math.max(x0 - ox + 1, Math.floor((i + 1) * cell));
      const y1 = oy + Math.max(y0 - oy + 1, Math.floor((j + 1) * cell));
      let sum = 0;
      let cnt = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        sum += src[y * w + x] * scale;
        cnt++;
      }
      const p = cnt ? sum / cnt : 0;
      // a clean edge: a shadow is cast or not
      const cut = p <= 0.4 ? 0 : p >= 0.6 ? 1 : (p - 0.4) / 0.2;
      // mirrored: the picture's left is your right
      tmp[j * n + (n - 1 - i)] = cut;
    }
  }
  if (feather <= 0) {
    out.set(tmp);
    return out;
  }
  // the penumbra: a small box blur, separable
  const r = Math.max(1, Math.round(feather));
  const pass = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    for (let k = -r; k <= r; k++) {
      const x = i + k;
      if (x < 0 || x >= n) continue;
      s += tmp[j * n + x];
      c++;
    }
    pass[j * n + i] = s / c;
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    for (let k = -r; k <= r; k++) {
      const y = j + k;
      if (y < 0 || y >= n) continue;
      s += pass[y * n + i];
      c++;
    }
    out[j * n + i] = s / c;
  }
  return out;
}

/** What the renderer is handed each frame: the eye, and the shade at any inked point. */
export interface ViewerLight {
  eye: EyeOffset;
  /** The shade (0..1) at a screen point dz ahead, given the eye's centre on screen and F. */
  shade: (sx: number, sy: number, dz: number, eyeX: number, eyeY: number, F: number) => number;
  /** The mask as a picture (n x n, white where the silhouette is), for shading a film or a picture. */
  maskImage: CanvasImageSource | null;
  /** How much of the shadow applies right now (eases out when the person is lost). */
  weight: number;
}
