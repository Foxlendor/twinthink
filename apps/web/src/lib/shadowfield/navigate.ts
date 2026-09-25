// Navigation rules layered on the camera: soft limits, gentle gravity toward
// the idea you are approaching, and continuous flights (used by clicks,
// breadcrumbs and keyboard). Every movement is still a camera zoom/pan, so
// a flight can be interrupted or reversed at any moment.

import { Camera, EnterTest, ScreenTransform } from './camera';
import { IdeaNode, SEAL_MARGIN } from './model';
import { topologyOf } from './layout';
import { clamp, smoothstep } from './rng';

export interface Access {
  canEnter: EnterTest;
  /** Viewer closeness for the top-level Twin containing the camera. */
  closenessAt(path: IdeaNode[]): number;
}

/** Visible, enterable-or-sealed children of the current frame. */
function perceivable(cam: Camera, access: Access) {
  const node = cam.node;
  const p = cam.depth === 0 ? 1 : access.closenessAt(cam.path);
  topologyOf(node);
  return node.children.filter((c) => cam.depth === 0 || c.disclosure <= p + SEAL_MARGIN);
}

/** Largest scale the camera may reach in its current frame, zooming toward focus (fx, fy). */
export function maxScale(cam: Camera, access: Access, fx = cam.cx, fy = cam.cy): number {
  const M = cam.M;
  let best = M * (cam.node.children.length ? 3 : 7);
  let nearest = Infinity;
  for (const c of perceivable(cam, access)) {
    const d = Math.hypot(fx - c.x, fy - c.y);
    nearest = Math.min(nearest, Math.max(d - c.r, 1e-9));
    if (d < c.r * 1.6) {
      if (access.canEnter(c)) return Infinity;
      best = Math.max(best, (0.34 * M) / c.r);
    }
  }
  // in open space you may zoom until the nearest idea reaches the edge of view
  if (nearest < Infinity) best = Math.max(best, (0.5 * M) / nearest);
  return best;
}

export function minScale(cam: Camera): number {
  return cam.depth === 0 ? Math.min(cam.w, cam.h) * 0.2 : 0;
}

/**
 * The point a zoom should hold still. When the cursor is near an idea, the
 * idea itself becomes the anchor, so it stays exactly where the viewer is
 * looking while it grows into an environment.
 */
export function zoomAnchor(cam: Camera, sx: number, sy: number, access: Access): [number, number] {
  let best: [number, number] | null = null;
  let bestD = Infinity;
  for (const c of perceivable(cam, access)) {
    const [px, py] = cam.toScreen(c.x, c.y);
    const R = c.r * cam.s;
    const d = Math.hypot(px - sx, py - sy);
    if (d < Math.max(56, R * 1.25) && d < bestD) {
      bestD = d;
      best = [px, py];
    }
  }
  if (!best) return [sx, sy];
  const w = 1 - smoothstep(0, 1, bestD / 90) * 0.5;
  return [sx + (best[0] - sx) * w, sy + (best[1] - sy) * w];
}

/** Zoom with elastic limits, anchored on the idea under the cursor. */
export function zoomAt(cam: Camera, sx: number, sy: number, factor: number, access: Access) {
  const [ax, ay] = factor > 1 ? zoomAnchor(cam, sx, sy, access) : [sx, sy];
  if (factor > 1) {
    const [fx, fy] = cam.toLocal(ax, ay);
    const headroom = Math.log(maxScale(cam, access, fx, fy) / cam.s);
    const want = Math.log(factor);
    const allowed = headroom <= 0 ? want * 0.02 : Math.min(want, headroom * 0.4 + want * 0.02);
    factor = Math.exp(Math.max(0, allowed));
  } else {
    const floor = minScale(cam);
    if (floor > 0) {
      const room = Math.log(cam.s / floor);
      const want = -Math.log(factor);
      const allowed = room <= 0 ? 0 : Math.min(want, room * 0.4);
      factor = Math.exp(-allowed);
    }
  }
  cam.zoomAt(ax, ay, factor, access.canEnter);
}

export function pan(cam: Camera, dx: number, dy: number, access: Access) {
  cam.pan(dx, dy, access.canEnter);
  if (cam.depth === 0) {
    cam.cx = clamp(cam.cx, -1.25, 1.25);
    cam.cy = clamp(cam.cy, -1.25, 1.25);
  }
}

/** Screen transform of any node, given its full path from the root. */
export function transformOfPath(cam: Camera, target: IdeaNode[]): ScreenTransform | null {
  let k = 0;
  while (k < cam.path.length && k < target.length && cam.path[k] === target[k]) k++;
  if (k === 0) return null;
  let T = cam.transformAt(k - 1);
  for (let i = k; i < target.length; i++) {
    const c = target[i];
    T = { ox: T.ox + c.x * T.s, oy: T.oy + c.y * T.s, s: T.s * c.r };
  }
  return T;
}

export interface Flight {
  target: IdeaNode[];
  /** Desired on-screen radius of the target, as a fraction of M. */
  radius: number;
}

/** Advance a flight by one frame. Returns true when arrived. */
export function stepFlight(cam: Camera, f: Flight, access: Access, dt: number): boolean {
  const M = cam.M;
  const k = Math.min(1, dt * 4.2);
  // leave any branch that does not lead to the target
  let common = 0;
  while (common < cam.path.length && common < f.target.length && cam.path[common] === f.target[common]) common++;
  if (common < cam.path.length) {
    const T = transformOfPath(cam, f.target);
    const cx = T ? T.ox : cam.w / 2;
    const cy = T ? T.oy : cam.h / 2;
    cam.zoomAt(cx, cy, Math.exp(-k * 1.6), access.canEnter);
    return false;
  }
  const T = transformOfPath(cam, f.target);
  if (!T) return true;
  const wantR = f.target.length === 1 ? Math.min(cam.w, cam.h) * 0.45 : f.radius * M;
  const dx = cam.w / 2 - T.ox;
  const dy = cam.h / 2 - T.oy;
  const lz = Math.log(wantR / T.s);
  if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6 && Math.abs(lz) < 0.004) return true;
  // pan first when far off-centre, so the journey reads as travel then descent
  const off = Math.hypot(dx, dy) / M;
  const zk = off > 0.25 && lz > 0 ? k * 0.25 : k;
  cam.pan(dx * k, dy * k, access.canEnter);
  cam.zoomAt(cam.w / 2, cam.h / 2, Math.exp(clamp(lz * zk, -0.35, 0.35)), access.canEnter);
  return false;
}
