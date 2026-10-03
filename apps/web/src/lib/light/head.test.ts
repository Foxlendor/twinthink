import { describe, expect, it } from 'vitest';
import { HeadFilter, LIGHT_BEHIND, LOSS_AFTER_MS, LOSS_EASE_MS, MASK_N, SILHOUETTE_BEHIND, SILHOUETTE_WIDTH, calibrate, eyeAt, eyeOf, maskFrom, sampleMask, shadeAt, silhouetteUV } from './head';

describe('the eye, from the head', () => {
  const c = calibrate({ x: 0.5, y: 0.5, d: 0.1, t: 0 });
  it('is at the centre when the head is where it was set', () => {
    const e = eyeOf({ x: 0.5, y: 0.5, d: 0.1, t: 0 }, c);
    expect(e.ex).toBeCloseTo(0, 9);
    expect(e.ey).toBeCloseTo(0, 9);
    expect(e.near).toBe(1);
  });
  it('a head moving to its own right (left in the picture) slides the far world left; down is down', () => {
    const e = eyeOf({ x: 0.4, y: 0.6, d: 0.1, t: 0 }, c);
    expect(e.ex).toBeLessThan(0);
    expect(e.ey).toBeLessThan(0);
  });
  it('never goes further than the window allows, and nearness is bounded', () => {
    const e = eyeOf({ x: 1, y: 0, d: 1, t: 0 }, c);
    expect(Math.abs(e.ex)).toBeLessThanOrEqual(0.35);
    expect(Math.abs(e.ey)).toBeLessThanOrEqual(0.35);
    expect(e.near).toBe(1.4);
  });
});

describe('smoothing and loss', () => {
  it('holds a still head steady and follows a real move', () => {
    const f = new HeadFilter();
    for (let i = 0; i < 30; i++) f.feed({ x: 0.5 + (i % 2 ? 0.004 : -0.004), y: 0.5, d: 0.1, t: i * 33 });
    expect(Math.abs(f.value!.x - 0.5)).toBeLessThan(0.003);
    for (let i = 30; i < 45; i++) f.feed({ x: 0.7, y: 0.5, d: 0.1, t: i * 33 });
    expect(f.value!.x).toBeGreaterThan(0.66);
  });
  it('eases the offset back to the centre once the head is lost, and not before', () => {
    const f = new HeadFilter();
    const c = calibrate({ x: 0.5, y: 0.5, d: 0.1, t: 0 });
    f.feed({ x: 0.5, y: 0.5, d: 0.1, t: 0 });
    for (let i = 1; i < 20; i++) f.feed({ x: 0.3, y: 0.5, d: 0.1, t: i * 33 });
    const last = 19 * 33;
    const held = eyeAt(f, c, last + LOSS_AFTER_MS)!;
    expect(held.ex).toBeLessThan(-0.1);
    const half = eyeAt(f, c, last + LOSS_AFTER_MS + LOSS_EASE_MS / 2)!;
    expect(Math.abs(half.ex)).toBeLessThan(Math.abs(held.ex));
    const gone = eyeAt(f, c, last + LOSS_AFTER_MS + LOSS_EASE_MS + 1)!;
    expect(gone.ex).toBeCloseTo(0, 6);
    expect(gone.near).toBeCloseTo(1, 6);
  });
  it('is nothing before a head has been seen, or without a centre', () => {
    const f = new HeadFilter();
    expect(eyeAt(f, null, 0)).toBeNull();
    expect(eyeAt(f, calibrate({ x: 0.5, y: 0.5, d: 0.1, t: 0 }), 0)).toBeNull();
  });
});

describe('the shadow is cast by depth', () => {
  it('meets the silhouette plane larger for what is near and smaller for what is far', () => {
    const [uNear] = silhouetteUV(0.5, 0, 0.6);
    const [uFar] = silhouetteUV(0.5, 0, 6);
    // the same offset off the axis lands further out on the plane when near: the shadow is bigger there
    expect(uNear - 0.5).toBeGreaterThan(uFar - 0.5);
    // and the geometry is the light's: the ray from the light through the point
    const t = (LIGHT_BEHIND - SILHOUETTE_BEHIND) / (0.6 + LIGHT_BEHIND);
    expect(uNear).toBeCloseTo((0.5 * t) / SILHOUETTE_WIDTH + 0.5, 9);
  });
  it('shades only where the mask is, and nothing outside it', () => {
    const n = 8;
    const mask = new Float32Array(n * n);
    // a silhouette in the middle of the plane
    for (let j = 2; j < 6; j++) for (let i = 2; i < 6; i++) mask[j * n + i] = 1;
    expect(sampleMask(mask, n, 0.5, 0.5)).toBe(1);
    expect(sampleMask(mask, n, 0.02, 0.02)).toBe(0);
    expect(sampleMask(mask, n, 1.2, 0.5)).toBe(0);
    // on the eye's axis, at any depth, the shadow of the middle falls
    expect(shadeAt(mask, n, 400, 300, 2, 400, 300, 600)).toBeGreaterThan(0.5);
    // far from the axis on screen, at a near depth, the point is outside the silhouette
    expect(shadeAt(mask, n, 400 + 2000, 300, 0.5, 400, 300, 600)).toBe(0);
  });
  it('makes a mirrored, cut, softened mask from the camera\'s map, taking the middle square', () => {
    const w = 32;
    const h = 24;
    const src = new Float32Array(w * h);
    // a person on the picture's left
    for (let y = 4; y < 20; y++) for (let x = 6; x < 12; x++) src[y * w + x] = 0.9;
    const out = maskFrom(src, w, h, 12, new Float32Array(12 * 12), 0);
    // mirrored: it is on the mask's right
    const left = out.slice(0, 12).reduce((a, b) => a + b, 0) + out.slice(12 * 6, 12 * 6 + 6).reduce((a, b) => a + b, 0);
    const right = out.slice(12 * 6 + 6, 12 * 7).reduce((a, b) => a + b, 0);
    expect(right).toBeGreaterThan(left);
    for (const v of out) expect(v === 0 || v === 1 || (v > 0 && v < 1)).toBe(true);
    const soft = maskFrom(src, w, h, 12, new Float32Array(12 * 12), 1);
    // softened: more values strictly between 0 and 1 than the cut one has
    const between = (m: Float32Array) => [...m].filter((v) => v > 0.01 && v < 0.99).length;
    expect(between(soft)).toBeGreaterThan(between(out));
  });
  it('the mask side is what the renderer expects', () => {
    expect(MASK_N).toBe(96);
  });
});
