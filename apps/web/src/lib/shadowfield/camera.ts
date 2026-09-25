// A camera that lives inside a stack of nested frames.
//
// Precision never degrades with depth: the camera is always expressed in the
// frame of the deepest idea it is inside. Crossing into a child is a pure
// change of coordinates (no visual change), so Z stays continuous and
// perfectly reversible.

import { IdeaNode } from './model';
import { topologyOf } from './layout';

/** Enter a child once its radius covers this fraction of the shorter screen side. */
export const ENTER = 0.5;
/** Leave a frame when its own radius shrinks below this fraction. */
export const EXIT = 0.28;
/** In blank space, open an empty frame once zoomed this far, so depth stays precise forever. */
export const VOID_AT = 24;

export interface ScreenTransform {
  ox: number;
  oy: number;
  s: number;
}

export type EnterTest = (node: IdeaNode) => boolean;

export class Camera {
  path: IdeaNode[];
  cx = 0;
  cy = 0;
  s = 1;
  w = 1;
  h = 1;
  /** Flights know their destination and must not open empty frames on the way. */
  voidsEnabled = true;

  constructor(root: IdeaNode) {
    this.path = [root];
  }

  get node() {
    return this.path[this.path.length - 1];
  }

  get depth() {
    return this.path.length - 1;
  }

  /** Reference size for semantic thresholds: the shorter screen side. */
  get M() {
    return Math.min(this.w, this.h);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  toLocal(sx: number, sy: number): [number, number] {
    return [this.cx + (sx - this.w / 2) / this.s, this.cy + (sy - this.h / 2) / this.s];
  }

  toScreen(x: number, y: number): [number, number] {
    return [(x - this.cx) * this.s + this.w / 2, (y - this.cy) * this.s + this.h / 2];
  }

  /** Transform (node-local -> screen) for the ancestor at path index k. */
  transformAt(k: number): ScreenTransform {
    let cx = this.cx;
    let cy = this.cy;
    let s = this.s;
    for (let i = this.path.length - 1; i > k; i--) {
      const n = this.path[i];
      cx = cx * n.r + n.x;
      cy = cy * n.r + n.y;
      s = s / n.r;
    }
    return { ox: this.w / 2 - cx * s, oy: this.h / 2 - cy * s, s };
  }

  /** Log of total magnification relative to the root (continuous Z). */
  logZ(): number {
    let z = Math.log(this.s);
    for (let i = 1; i < this.path.length; i++) z -= Math.log(this.path[i].r);
    return z;
  }

  zoomAt(sx: number, sy: number, factor: number, canEnter: EnterTest) {
    const [lx, ly] = this.toLocal(sx, sy);
    this.s *= factor;
    this.cx = lx - (sx - this.w / 2) / this.s;
    this.cy = ly - (sy - this.h / 2) / this.s;
    this.normalize(canEnter);
  }

  pan(dx: number, dy: number, canEnter: EnterTest) {
    this.cx -= dx / this.s;
    this.cy -= dy / this.s;
    this.normalize(canEnter);
  }

  descend(child: IdeaNode) {
    this.cx = (this.cx - child.x) / child.r;
    this.cy = (this.cy - child.y) / child.r;
    this.s *= child.r;
    this.path.push(child);
  }

  ascend() {
    if (this.path.length < 2) return;
    const child = this.path.pop()!;
    this.cx = this.cx * child.r + child.x;
    this.cy = this.cy * child.r + child.y;
    this.s /= child.r;
  }

  /**
   * Is any real idea near the view? Checked in the nearest non-void frame, so
   * empty frames give way as soon as something to enter comes into view.
   */
  contentInView(): boolean {
    let i = this.path.length - 1;
    let cx = this.cx;
    let cy = this.cy;
    let s = this.s;
    while (i > 0 && this.path[i].void) {
      const n = this.path[i];
      cx = cx * n.r + n.x;
      cy = cy * n.r + n.y;
      s /= n.r;
      i--;
    }
    const frame = this.path[i];
    topologyOf(frame);
    const reach = (0.75 * Math.max(this.w, this.h)) / s;
    for (const c of frame.children) {
      if (Math.hypot(c.x - cx, c.y - cy) - c.r < reach) return true;
    }
    // content inside the idea counts too: you can zoom right into an image
    for (const m of frame.media ?? []) {
      if (m.kind === 'image' && Math.abs(m.x - cx) < m.w / 2 + reach && Math.abs(m.y - cy) < (m.w * m.aspect) / 2 + reach) return true;
    }
    return false;
  }

  /** Re-home the camera in the deepest frame that contains the view. */
  normalize(canEnter: EnterTest) {
    const M = this.M;
    for (let guard = 0; guard < 64; guard++) {
      if (this.path.length > 1 && (this.s < M * EXIT || Math.hypot(this.cx, this.cy) > 1.9)) {
        this.ascend();
        continue;
      }
      if (this.node.void && this.contentInView()) {
        while (this.node.void) this.ascend();
        continue;
      }
      const node = this.node;
      topologyOf(node); // ensures children are placed
      let entered = false;
      for (const c of node.children) {
        if (c.r * this.s < M * ENTER) continue;
        if (Math.hypot(this.cx - c.x, this.cy - c.y) > c.r) continue;
        if (!canEnter(c)) continue;
        this.descend(c);
        entered = true;
        break;
      }
      if (!entered) {
        // blank space has depth too: open an empty frame around the view
        if (this.voidsEnabled && this.s > M * VOID_AT && !this.contentInView()) {
          // a power of 1/8, snapped to the parent's lattice, so the endless
          // grid continues without a visible jump as frames change
          const n = Math.floor(Math.log(this.s / M) / Math.log(8));
          const r = Math.pow(8, -n);
          const step = Math.pow(8, -(n + 1));
          const v: IdeaNode = {
            id: `void:${this.path.length}`,
            kind: 'unknown',
            origin: 'real',
            began: 0,
            events: [],
            state: 'alive',
            disclosure: 0,
            children: [],
            x: Math.round(this.cx / step) * step,
            y: Math.round(this.cy / step) * step,
            r,
            seed: 0,
            void: true,
          };
          this.descend(v);
          continue;
        }
        break;
      }
    }
  }

  /** Jump to a path (e.g. from a URL), centred on the deepest node. */
  setPath(path: IdeaNode[], s: number) {
    this.path = [...path];
    this.cx = 0;
    this.cy = 0;
    this.s = s;
  }
}
