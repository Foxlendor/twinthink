/**
 * XYZ camera.
 *
 * X/Y are position inside the local frame of the node you are currently in.
 * Z is semantic depth: the frame path from the Canvas down to that node, plus
 * a continuous zoom inside it.
 *
 * Each node's children live in the node's own unit disk. The camera is always
 * expressed relative to one frame (`frameId`), and it *rebases* as you move:
 * once a child fills enough of the screen you are inside it; once the frame
 * shrinks enough you are back in its parent. Because coordinates never
 * accumulate across levels, depth is unlimited and precision never degrades.
 */

export interface Camera {
  frameId: string;
  /** View centre in the frame's local units. */
  cx: number;
  cy: number;
  /** Screen pixels per local unit, i.e. the frame's radius on screen. */
  zoom: number;
}

export interface Geometry {
  parentId: string | null;
  x: number;
  y: number;
  r: number;
}

export interface GeometryLookup {
  geo(id: string): Geometry | undefined;
  /** Loaded child ids, undefined if not loaded yet. */
  childIds(id: string): string[] | undefined;
  /** Whether the viewer may enter this node. */
  canEnter(id: string): boolean;
}

export interface Viewport {
  width: number;
  height: number;
}

/** Enter a child once its radius exceeds this fraction of the smaller screen side. */
export const ENTER_AT = 0.45;
/** Leave to the parent once the current frame's radius drops below this. */
export const EXIT_AT = 0.3;
/** How far out the Canvas itself can go. */
export const MIN_ROOT_ZOOM = 0.2;
/** Deepest zoom inside a frame, as a multiple of the smaller screen side. */
export const MAX_LEAF_ZOOM = 1.35;

export const minSide = (viewport: Viewport) => Math.max(1, Math.min(viewport.width, viewport.height));

export function toScreen(camera: Camera, viewport: Viewport, x: number, y: number) {
  return {
    x: viewport.width / 2 + (x - camera.cx) * camera.zoom,
    y: viewport.height / 2 + (y - camera.cy) * camera.zoom,
  };
}

export function toLocal(camera: Camera, viewport: Viewport, sx: number, sy: number) {
  return {
    x: camera.cx + (sx - viewport.width / 2) / camera.zoom,
    y: camera.cy + (sy - viewport.height / 2) / camera.zoom,
  };
}

/** Express the camera in the parent's frame. */
export function toParent(camera: Camera, frame: Geometry): Camera {
  return {
    frameId: frame.parentId!,
    cx: frame.x + frame.r * camera.cx,
    cy: frame.y + frame.r * camera.cy,
    zoom: camera.zoom / frame.r,
  };
}

/** Express the camera in a child's frame. */
export function toChild(camera: Camera, childId: string, child: Geometry): Camera {
  return {
    frameId: childId,
    cx: (camera.cx - child.x) / child.r,
    cy: (camera.cy - child.y) / child.r,
    zoom: camera.zoom * child.r,
  };
}

/** Zoom by `factor` keeping the local point under screen point (sx, sy) fixed. */
export function zoomAbout(camera: Camera, viewport: Viewport, factor: number, sx: number, sy: number): Camera {
  const anchor = toLocal(camera, viewport, sx, sy);
  const zoom = camera.zoom * factor;
  return {
    frameId: camera.frameId,
    zoom,
    cx: anchor.x - (sx - viewport.width / 2) / zoom,
    cy: anchor.y - (sy - viewport.height / 2) / zoom,
  };
}

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, cx: camera.cx - dx / camera.zoom, cy: camera.cy - dy / camera.zoom };
}

/** The child of the current frame under the view centre, if any. */
export function childAtCentre(camera: Camera, world: GeometryLookup): string | null {
  const ids = world.childIds(camera.frameId);
  if (!ids) return null;
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const id of ids) {
    const g = world.geo(id);
    if (!g) continue;
    const distance = Math.hypot(camera.cx - g.x, camera.cy - g.y);
    if (distance < g.r && distance / g.r < bestDistance) {
      best = id;
      bestDistance = distance / g.r;
    }
  }
  return best;
}

/**
 * Move the camera into the frame it belongs in. Exits first (so a fast zoom
 * out climbs several levels in one frame), then enters as deep as the zoom
 * allows. Returns the same object when nothing changed.
 */
export function rebase(camera: Camera, viewport: Viewport, world: GeometryLookup): Camera {
  const side = minSide(viewport);
  let current = camera;
  for (let guard = 0; guard < 64; guard++) {
    const frame = world.geo(current.frameId);
    if (!frame || frame.parentId === null) break;
    if (current.zoom >= EXIT_AT * side) break;
    current = toParent(current, frame);
  }
  for (let guard = 0; guard < 64; guard++) {
    const childId = childAtCentre(current, world);
    if (!childId || !world.canEnter(childId)) break;
    const child = world.geo(childId)!;
    if (current.zoom * child.r < ENTER_AT * side) break;
    current = toChild(current, childId, child);
  }
  return current;
}

/**
 * Upper bound on zoom in the current frame. You can always get close enough to
 * enter any child; inside a leaf you can get close enough to read it. A child
 * you are not close enough to perceive stops you just short of entering: you
 * can see that something is there, not what it is.
 */
export function maxZoom(camera: Camera, viewport: Viewport, world: GeometryLookup): number {
  const side = minSide(viewport);
  const ids = world.childIds(camera.frameId);
  const centreChild = childAtCentre(camera, world);
  if (centreChild && !world.canEnter(centreChild)) {
    const g = world.geo(centreChild)!;
    return ((ENTER_AT * 0.93) * side) / g.r;
  }
  if (!ids || ids.length === 0) return MAX_LEAF_ZOOM * side;
  let smallest = Number.POSITIVE_INFINITY;
  for (const id of ids) smallest = Math.min(smallest, world.geo(id)?.r ?? smallest);
  return Math.max(MAX_LEAF_ZOOM, (ENTER_AT * 1.6) / smallest) * side;
}

export function minZoom(camera: Camera, viewport: Viewport, world: GeometryLookup) {
  const frame = world.geo(camera.frameId);
  return frame && frame.parentId === null ? MIN_ROOT_ZOOM * minSide(viewport) : 0;
}

/** Frame path from the root to `id` using loaded geometry. */
export function framePath(id: string, world: GeometryLookup): string[] {
  const out: string[] = [];
  let cursor: string | null = id;
  while (cursor) {
    out.push(cursor);
    cursor = world.geo(cursor)?.parentId ?? null;
  }
  return out.reverse();
}

export function commonAncestor(a: string, b: string, world: GeometryLookup) {
  const pa = framePath(a, world);
  const pb = framePath(b, world);
  let shared = pa[0];
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    if (pa[i] !== pb[i]) break;
    shared = pa[i];
  }
  return shared;
}

/** Express the camera in an ancestor frame. */
export function expressIn(camera: Camera, ancestorId: string, world: GeometryLookup): Camera {
  let current = camera;
  for (let guard = 0; guard < 256 && current.frameId !== ancestorId; guard++) {
    const frame = world.geo(current.frameId);
    if (!frame || frame.parentId === null) break;
    current = toParent(current, frame);
  }
  return current;
}

/**
 * The camera that frames node `id` (its disk filling `fill` of the smaller
 * screen side), expressed in ancestor frame `ancestorId`.
 */
export function framing(id: string, ancestorId: string, viewport: Viewport, world: GeometryLookup, fill = 0.42): Camera {
  // Framing a node in its own frame, radius = fill * side. An idea grows to
  // one side of its point, so look a little toward where its structure is.
  let cx = 0;
  let cy = 0;
  const ids = world.childIds(id);
  if (ids?.length) {
    for (const child of ids) {
      const g = world.geo(child);
      if (g) {
        cx += g.x;
        cy += g.y;
      }
    }
    cx = (cx / ids.length) * 0.5;
    cy = (cy / ids.length) * 0.5;
  }
  let camera: Camera = { frameId: id, cx, cy, zoom: fill * minSide(viewport) };
  camera = expressIn(camera, ancestorId, world);
  return camera;
}

/**
 * Smooth zoom-and-pan between two views (van Wijk & Nuij, "Smooth and
 * efficient zooming and panning", 2003). Both views are [cx, cy, w] in the
 * same frame, where w is the visible width in local units. The path zooms out
 * just enough to keep both ends in context — the Google Earth feeling.
 */
export function smoothPath(from: [number, number, number], to: [number, number, number], rho = 1.35) {
  const [ux0, uy0, w0] = from;
  const [ux1, uy1, w1] = to;
  const rho2 = rho * rho;
  const rho4 = rho2 * rho2;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;

  if (d2 < 1e-24) {
    const S = Math.log(w1 / w0) / rho;
    return {
      length: Math.abs(S),
      at: (t: number): [number, number, number] => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)],
    };
  }

  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / rho;
  return {
    length: Math.abs(S),
    at: (t: number): [number, number, number] => {
      const s = t * S;
      const coshr0 = Math.cosh(r0);
      const u = (w0 / (rho2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(rho * s + r0)];
    },
  };
}
