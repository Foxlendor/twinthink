import {
  type Camera,
  type GeometryLookup,
  type Viewport,
  childAtCentre,
  commonAncestor,
  expressIn,
  framing,
  maxZoom,
  minSide,
  minZoom,
  panBy,
  rebase,
  smoothPath,
  toLocal,
  toScreen,
  zoomAbout,
} from './camera';
import type { Disk } from './layout';

/**
 * Turns gestures into movement through the Field.
 *
 *   drag / arrows           X/Y — explore across
 *   wheel / pinch / + -     Z   — go into what you are centred on, or back out
 *   click / tap             select the nearest meaningful thing
 *   double-click / Enter    fly into the selection
 *   Escape                  fly one level out
 *
 * Wheel input is not applied as a jump: it becomes an impulse that is eased in
 * over a few frames, so trackpads, wheels and pinches all feel continuous.
 */

export interface ControllerHost {
  world: GeometryLookup & { diskInFrame(id: string, frameId: string): Disk | null };
  viewport(): Viewport;
  /** Loads everything needed to travel to `id`. */
  ensurePath(id: string): Promise<void>;
  /**
   * Whether scrolling into empty space inside this frame should snap toward
   * the nearest thing in it. True inside ideas; false on open territory,
   * where zooming about the pointer is the natural map behaviour.
   */
  snaps(frameId: string): boolean;
}

interface Flight {
  ancestorId: string;
  path: ReturnType<typeof smoothPath>;
  start: number;
  duration: number;
  targetId: string;
  resolve: () => void;
}

const WHEEL_SENSITIVITY = 0.0021;
const MAX_IMPULSE = 2.2;

export class FieldController {
  camera: Camera;
  selectedId: string | null = null;
  /** What a wheel gesture is steering toward (hovered or selected when it began). */
  private aimId: string | null = null;
  private aimUntil = 0;
  /** Keyboard and buttons have no pointer: steer the aimed thing to the centre. */
  private centreAim = false;
  private zoomImpulse = 0;
  private zoomAnchor: { x: number; y: number } | null = null;
  private velocity = { x: 0, y: 0 };
  private flight: Flight | null = null;
  /** Time the camera last pushed against something the viewer cannot enter yet. */
  resistedAt = Number.NEGATIVE_INFINITY;
  private flightToken = 0;

  constructor(
    private readonly host: ControllerHost,
    rootId: string
  ) {
    const side = minSide(host.viewport());
    this.camera = { frameId: rootId, cx: 0, cy: 0, zoom: side * 0.5 };
  }

  get flying() {
    return this.flight !== null;
  }

  // -------------------------------------------------------------- input

  /** Wheel or trackpad. Positive deltaY means "out", like scrolling down a page. */
  wheel(deltaY: number, sx: number, sy: number, pickAt: (sx: number, sy: number) => string | null, now: number) {
    this.cancelFlight();
    this.velocity = { x: 0, y: 0 };
    const impulse = Math.max(-0.6, Math.min(0.6, -deltaY * WHEEL_SENSITIVITY));
    if (impulse > 0) {
      // Going in: steer toward the thing the viewer is centred on — the selection,
      // or whatever is under the pointer when the gesture starts.
      if (now > this.aimUntil || !this.aimId) this.aimId = this.selectedId ?? pickAt(sx, sy) ?? this.nearestChild(sx, sy);
      this.centreAim = false;
      this.aimUntil = now + 450;
      this.zoomAnchor = { x: sx, y: sy };
    } else {
      // Going out: retrace around the centre of view.
      this.aimId = null;
      const viewport = this.host.viewport();
      this.zoomAnchor = { x: viewport.width / 2, y: viewport.height / 2 };
    }
    this.zoomImpulse = Math.max(-MAX_IMPULSE, Math.min(MAX_IMPULSE, this.zoomImpulse + impulse));
  }

  /** Direct pinch: apply immediately so fingers stay glued to content. */
  pinch(factor: number, sx: number, sy: number) {
    this.cancelFlight();
    this.applyZoom(factor, sx, sy);
  }

  pan(dx: number, dy: number) {
    this.cancelFlight();
    this.camera = panBy(this.camera, dx, dy);
    this.settle();
  }

  /** Called when a drag ends, with velocity in px/ms. */
  release(vx: number, vy: number) {
    this.velocity = { x: vx, y: vy };
  }

  stopInertia() {
    this.velocity = { x: 0, y: 0 };
    this.zoomImpulse = 0;
  }

  select(id: string | null) {
    this.selectedId = id;
  }

  /** Step one level in (+1) or out (-1) with the keyboard or buttons. */
  nudge(direction: 1 | -1) {
    const viewport = this.host.viewport();
    this.cancelFlight();
    if (direction > 0) this.aimId = this.selectedId ?? this.nearestChild(viewport.width / 2, viewport.height / 2);
    this.centreAim = true;
    this.aimUntil = performance.now() + 600;
    this.zoomAnchor = { x: viewport.width / 2, y: viewport.height / 2 };
    this.zoomImpulse = Math.max(-MAX_IMPULSE, Math.min(MAX_IMPULSE, this.zoomImpulse + direction * 0.55));
  }

  // -------------------------------------------------------------- flights

  /** Fly smoothly to a node anywhere in the Field. */
  async flyTo(targetId: string, fill = 0.44): Promise<void> {
    const token = ++this.flightToken;
    await this.host.ensurePath(targetId);
    if (token !== this.flightToken) return;
    const world = this.host.world;
    if (!world.geo(targetId)) return;
    const viewport = this.host.viewport();
    const side = minSide(viewport);
    const ancestorId = commonAncestor(this.camera.frameId, targetId, world);
    const from = expressIn(this.camera, ancestorId, world);
    const to = framing(targetId, ancestorId, viewport, world, fill);
    const path = smoothPath([from.cx, from.cy, side / from.zoom], [to.cx, to.cy, side / to.zoom]);
    const duration = Math.max(520, Math.min(2600, path.length * 620));
    this.stopInertia();
    return new Promise((resolve) => {
      this.flight = { ancestorId, path, start: performance.now(), duration, targetId, resolve };
    });
  }

  /** Escape: go one level out, keeping where you were selected so you can go back in. */
  async out() {
    const world = this.host.world;
    const frame = world.geo(this.camera.frameId);
    if (!frame || frame.parentId === null) {
      // Already at the Canvas: settle back to the overview.
      await this.flyTo(this.camera.frameId, 0.5);
      return;
    }
    const leaving = this.camera.frameId;
    const parentId = frame.parentId;
    const grand = world.geo(parentId);
    this.selectedId = leaving;
    await this.flyTo(parentId, grand?.parentId === null ? 0.5 : 0.44);
  }

  private cancelFlight() {
    if (this.flight) {
      const done = this.flight.resolve;
      this.flight = null;
      this.flightToken++;
      done();
    }
  }

  // -------------------------------------------------------------- frame step

  /** Advance one animation frame. Returns true if the camera moved. */
  step(dtMs: number, now: number): boolean {
    const before = this.camera;
    const viewport = this.host.viewport();
    const side = minSide(viewport);

    if (this.flight) {
      const t = Math.min(1, (now - this.flight.start) / this.flight.duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const [cx, cy, w] = this.flight.path.at(eased);
      this.camera = rebase({ frameId: this.flight.ancestorId, cx, cy, zoom: side / w }, viewport, this.host.world);
      if (t >= 1) {
        const done = this.flight.resolve;
        this.flight = null;
        done();
      }
      return true;
    }

    if (Math.abs(this.zoomImpulse) > 1e-4) {
      const portion = this.zoomImpulse * (1 - Math.exp(-dtMs / 85));
      this.zoomImpulse -= portion;
      const anchor = this.zoomAnchor ?? { x: viewport.width / 2, y: viewport.height / 2 };
      const aim = portion > 0 && this.aimId ? this.screenDisk(this.aimId) : null;
      if (aim) {
        // Zoom about the aimed thing so it stays where the viewer is looking
        // while its world opens around it. It is drawn inward only gently —
        // firmly when it would leave the screen or the gesture had no pointer.
        this.applyZoom(Math.exp(portion), aim.x, aim.y);
        const after = this.screenDisk(this.aimId!);
        if (after) {
          const off = Math.hypot(after.x - viewport.width / 2, after.y - viewport.height / 2) / side;
          const edge = Math.max(0, Math.min(1, (off - 0.28) / 0.2));
          const pull = Math.min(1, portion * (this.centreAim ? 1.8 : 0.3 + 2.4 * edge));
          this.camera = panBy(this.camera, (viewport.width / 2 - after.x) * pull, (viewport.height / 2 - after.y) * pull);
          this.settle();
        }
      } else {
        this.applyZoom(Math.exp(portion), anchor.x, anchor.y);
      }
      if (Math.abs(this.zoomImpulse) <= 1e-4) this.zoomImpulse = 0;
    }

    if (Math.abs(this.velocity.x) + Math.abs(this.velocity.y) > 0.01) {
      this.camera = panBy(this.camera, this.velocity.x * dtMs, this.velocity.y * dtMs);
      const decay = Math.exp(-dtMs / 260);
      this.velocity = { x: this.velocity.x * decay, y: this.velocity.y * decay };
      this.settle();
    }

    return before !== this.camera;
  }

  private applyZoom(factor: number, sx: number, sy: number) {
    const viewport = this.host.viewport();
    let next = zoomAbout(this.camera, viewport, factor, sx, sy);
    const max = maxZoom(next, viewport, this.host.world);
    const min = minZoom(next, viewport, this.host.world);
    if (next.zoom > max) {
      const centre = childAtCentre(next, this.host.world);
      if (factor > 1 && centre && !this.host.world.canEnter(centre)) this.resistedAt = performance.now();
      next = zoomAbout(this.camera, viewport, max / this.camera.zoom, sx, sy);
      this.zoomImpulse = Math.min(this.zoomImpulse, 0);
    }
    if (next.zoom < min) {
      next = zoomAbout(this.camera, viewport, min / this.camera.zoom, sx, sy);
      this.zoomImpulse = Math.max(this.zoomImpulse, 0);
    }
    this.camera = next;
    this.settle();
  }

  /** Rebase into the right frame and drop the selection if it is now behind us. */
  private settle() {
    const viewport = this.host.viewport();
    const next = rebase(this.camera, viewport, this.host.world);
    if (next.frameId !== this.camera.frameId) {
      if (this.selectedId === next.frameId) this.selectedId = null;
      if (this.aimId === next.frameId) this.aimId = null;
    }
    this.camera = next;
  }

  /**
   * Inside an idea, scrolling in over empty space still goes *into something*:
   * the nearest thing you are allowed to enter.
   */
  private nearestChild(sx: number, sy: number): string | null {
    const world = this.host.world;
    if (!this.host.snaps(this.camera.frameId)) return null;
    const ids = world.childIds(this.camera.frameId);
    if (!ids?.length) return null;
    const point = toLocal(this.camera, this.host.viewport(), sx, sy);
    let best: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const id of ids) {
      const g = world.geo(id);
      if (!g || !world.canEnter(id)) continue;
      const distance = Math.hypot(point.x - g.x, point.y - g.y) - g.r;
      if (distance < bestDistance) {
        best = id;
        bestDistance = distance;
      }
    }
    return best;
  }

  /** Screen position and radius of any loaded node. */
  screenDisk(id: string) {
    const disk = this.host.world.diskInFrame(id, this.camera.frameId);
    if (!disk) return null;
    const viewport = this.host.viewport();
    const point = toScreen(this.camera, viewport, disk.x, disk.y);
    return { x: point.x, y: point.y, r: disk.r * this.camera.zoom };
  }
}
