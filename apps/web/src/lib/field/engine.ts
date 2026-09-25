import { loadActivity, viewerFrom, withBack, withEntry, type LocalActivity } from './activity';
import { minSide, rebase, type Viewport } from './camera';
import { FieldController } from './controller';
import type { ShadowProjection } from './model';
import { renderField, type HitNode } from './renderer';
import type { FieldSource } from './source';
import { FieldStore } from './store';
import { StoreWorld } from './world';

/**
 * The Canvas engine: owns the store, camera controller, input and the frame
 * loop, and publishes small snapshots for whatever UI sits on top. It knows
 * nothing about React, so the chrome, the renderer and the data source can
 * each be replaced independently.
 */

export interface PanelSnapshot {
  node: ShadowProjection;
  twin: ShadowProjection | null;
  parentTitle: string | null;
  isFrame: boolean;
}

export interface FieldSnapshot {
  ready: boolean;
  frameId: string;
  path: Array<{ id: string; title: string }>;
  selected: ShadowProjection | null;
  panel: PanelSnapshot | null;
  insideTwin: boolean;
  atOverview: boolean;
  resisted: boolean;
  lensOn: boolean;
  activity: LocalActivity;
  announce: string;
  /** The Field's clock (seeded history is relative to it). */
  now: number;
}

const CONTAINERS = new Set(['canvas', 'domain', 'constellation']);

export class FieldEngine {
  readonly store: FieldStore;
  readonly world: StoreWorld;
  readonly controller: FieldController;
  private readonly viewport: Viewport = { width: 1200, height: 800 };
  private activity: LocalActivity;
  private lensOn = false;
  private hits: HitNode[] = [];
  private hover: { x: number; y: number } | null = null;
  private hoverId: string | null = null;
  private fonts = { sans: 'sans-serif', mono: 'monospace' };
  private raf = 0;
  private ready = false;
  private destroyed = false;
  private lastKey = '';
  private lastFrameId = '';
  private announce = '';
  private urlTimer = 0;
  private readonly cleanups: Array<() => void> = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly source: FieldSource & { now: number },
    private readonly onChange: (snapshot: FieldSnapshot) => void
  ) {
    this.activity = loadActivity();
    this.store = new FieldStore(source, viewerFrom(this.activity));
    this.world = new StoreWorld(this.store);
    this.controller = new FieldController(
      {
        world: this.world,
        viewport: () => this.viewport,
        ensurePath: async (id) => {
          await this.store.ensurePath(id);
        },
        snaps: (frameId) => {
          const kind = this.store.get(frameId)?.kind;
          return kind !== undefined && kind !== 'canvas' && kind !== 'domain';
        },
      },
      source.rootId
    );
  }

  async start(initialAt: string | null) {
    this.fonts = readFonts();
    this.measure();
    await this.store.init();
    if (initialAt) {
      try {
        const path = await this.store.ensurePath(initialAt);
        const target = path[path.length - 1];
        this.controller.camera = rebase({ frameId: target, cx: 0, cy: 0, zoom: minSide(this.viewport) * 0.46 }, this.viewport, this.world);
      } catch {
        // Unknown place: start from the overview.
      }
    }
    if (this.destroyed) return;
    this.ready = true;
    this.bindInput();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.urlTimer);
    for (const cleanup of this.cleanups) cleanup();
  }

  // ------------------------------------------------------------------ actions

  setLens(on: boolean) {
    this.lensOn = on;
    this.publish(true);
  }

  toggleLens() {
    this.setLens(!this.lensOn);
  }

  select(id: string | null) {
    this.controller.select(id);
  }

  /** Fly to show something in context. */
  show(id: string, fill?: number) {
    const node = this.store.get(id);
    void this.controller.flyTo(id, fill ?? (node && CONTAINERS.has(node.kind) ? 0.48 : 0.44));
  }

  /** Fly inside something: the camera rebases into it on arrival. */
  enter(id: string) {
    this.controller.select(null);
    void this.controller.flyTo(id, 0.62);
  }

  out() {
    void this.controller.out();
  }

  deeper() {
    this.controller.nudge(1);
  }

  back(twinId: string) {
    const next = withBack(this.activity, twinId);
    if (next === this.activity) return;
    this.activity = next;
    void this.store.refreshTwin(twinId, viewerFrom(next));
    this.publish(true);
  }

  async random() {
    this.lensOn = true;
    const id = await this.source.randomTwin(Math.floor(Math.random() * 1e9), viewerFrom(this.activity));
    if (!id) return;
    await this.store.ensurePath(id);
    this.controller.select(id);
    this.show(id, 0.3);
  }

  titleOf(id: string) {
    return this.store.get(id)?.title ?? null;
  }

  // ------------------------------------------------------------------ loop

  private measure() {
    const rect = this.canvas.getBoundingClientRect();
    this.viewport.width = Math.max(1, rect.width);
    this.viewport.height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    return dpr;
  }

  private lastTime = performance.now();
  private lastEvict = 0;
  private lastHoverPick = 0;

  private loop = (time: number) => {
    if (this.destroyed) return;
    const dt = Math.min(64, time - this.lastTime);
    this.lastTime = time;
    const dpr = this.measure();
    this.controller.step(dt, time);

    if (this.hover && time - this.lastHoverPick > 60) {
      this.lastHoverPick = time;
      this.hoverId = this.pickAt(this.hover.x, this.hover.y);
      this.canvas.style.cursor = this.hoverId ? 'pointer' : '';
    }

    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const stats = renderField({
        ctx,
        viewport: this.viewport,
        camera: this.controller.camera,
        world: this.world,
        time,
        now: this.source.now,
        lensOn: this.lensOn,
        selectedId: this.controller.selectedId,
        hoverId: this.hoverId,
        isBacked: (id) => Boolean(this.activity.backs[id]),
        fonts: this.fonts,
      });
      this.hits = stats.hits;
    }

    if (time - this.lastEvict > 2000) {
      this.lastEvict = time;
      this.store.evict(new Set(this.store.ancestry(this.controller.camera.frameId)));
    }

    if (this.controller.camera.frameId !== this.lastFrameId) this.frameChanged();
    this.publish(false);
    this.raf = requestAnimationFrame(this.loop);
  };

  /** URL, returns and screen-reader announcement follow the frame you are in. */
  private frameChanged() {
    const frameId = this.controller.camera.frameId;
    this.lastFrameId = frameId;

    window.clearTimeout(this.urlTimer);
    this.urlTimer = window.setTimeout(() => {
      const url = frameId === this.store.rootId ? '/canvas' : `/canvas?at=${encodeURIComponent(frameId)}`;
      if (window.location.pathname + window.location.search !== url) window.history.replaceState(window.history.state, '', url);
    }, 350);

    const here = this.store.get(frameId);
    const inside = this.store.childrenOf(frameId)?.filter((id) => this.store.get(id)?.perceivable).length ?? 0;
    this.announce = here ? `${here.title ?? 'Somewhere'}. ${inside ? inside + ' things inside.' : ''}` : '';

    // Entering a Twin on a new day is a return. Returns bring you closer, slowly.
    const twin = this.store.enclosingTwin(frameId);
    if (!twin) return;
    const before = Math.max(0, (this.activity.returns[twin.id]?.length ?? 0) - 1);
    const next = withEntry(this.activity, twin.id);
    if (next === this.activity) return;
    this.activity = next;
    const after = Math.max(0, (next.returns[twin.id]?.length ?? 0) - 1);
    if (after > before) void this.store.refreshTwin(twin.id, viewerFrom(next));
    else this.store.setViewer(viewerFrom(next));
  }

  private publish(force: boolean) {
    const camera = this.controller.camera;
    const side = minSide(this.viewport);
    const atOverview = camera.frameId === this.store.rootId && camera.zoom < side * 0.8;
    const resisted = performance.now() - this.controller.resistedAt < 2600;
    const key = [camera.frameId, this.controller.selectedId, atOverview, resisted, this.store.version, this.lensOn, this.announce].join('|');
    if (!force && key === this.lastKey) return;
    this.lastKey = key;

    const selectedId = this.controller.selectedId;
    const frame = this.store.get(camera.frameId);
    const panelId = selectedId ?? (frame && !CONTAINERS.has(frame.kind) ? frame.id : null);
    const panelNode = panelId ? this.store.get(panelId) : undefined;
    let panel: PanelSnapshot | null = null;
    if (panelNode) {
      const parent = panelNode.parentId ? this.store.get(panelNode.parentId) : undefined;
      panel = {
        node: panelNode,
        twin: this.store.enclosingTwin(panelNode.id),
        parentTitle: parent && !CONTAINERS.has(parent.kind) ? (parent.title ?? null) : null,
        isFrame: panelNode.id === camera.frameId,
      };
    }

    this.onChange({
      ready: this.ready,
      frameId: camera.frameId,
      path: this.store.ancestry(camera.frameId).map((id) => ({ id, title: this.store.get(id)?.title ?? '…' })),
      selected: selectedId ? (this.store.get(selectedId) ?? null) : null,
      panel,
      insideTwin: Boolean(this.store.enclosingTwin(camera.frameId)),
      atOverview,
      resisted,
      lensOn: this.lensOn,
      activity: this.activity,
      announce: this.announce,
      now: this.source.now,
    });
  }

  // ------------------------------------------------------------------ picking

  /**
   * The nearest meaningful thing to a screen point. Ideas are points now, so
   * this is about closeness to the ink, preferring the deepest thing that has
   * emerged there. The frame you are inside and its ancestors are never picked,
   * so clicking empty space clears the selection.
   */
  pickAt(sx: number, sy: number): string | null {
    const side = minSide(this.viewport);
    const around = new Set(this.store.ancestry(this.controller.camera.frameId));
    let best: HitNode | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const hit of this.hits) {
      if (around.has(hit.id) || hit.sr > side * 1.2) continue;
      const distance = Math.hypot(hit.sx - sx, hit.sy - sy);
      // Reach grows a little with the size of the thing's field, within limits.
      const reach = Math.max(14, Math.min(46, hit.sr * 0.3));
      if (distance > reach) continue;
      const score = distance / reach - hit.level * 0.15;
      if (score < bestScore) {
        best = hit;
        bestScore = score;
      }
    }
    return best?.id ?? null;
  }

  // ------------------------------------------------------------------ input

  private bindInput() {
    const canvas = this.canvas;
    const controller = this.controller;
    const listen = <K extends keyof HTMLElementEventMap>(target: HTMLElement | Window, type: K, handler: (event: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) => {
      target.addEventListener(type, handler as EventListener, options);
      this.cleanups.push(() => target.removeEventListener(type, handler as EventListener, options));
    };
    const local = (event: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    // Non-passive so the page itself never scrolls: the wheel means depth here.
    listen(
      canvas,
      'wheel',
      (event) => {
        event.preventDefault();
        const p = local(event);
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.viewport.height : 1;
        const dx = event.deltaX * unit;
        let dy = event.deltaY * unit;
        if (event.shiftKey && Math.abs(dx) < 1) {
          controller.pan(-dy, 0);
          return;
        }
        // A trackpad's sideways swipe explores across; vertical goes deeper or out.
        if (Math.abs(dx) > Math.abs(dy) * 1.2) {
          controller.pan(-dx, 0);
          return;
        }
        if (event.ctrlKey) dy *= 3.2; // trackpad pinch arrives as ctrl+wheel with small deltas
        controller.wheel(dy, p.x, p.y, (x, y) => this.pickAt(x, y), performance.now());
      },
      { passive: false }
    );

    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinchDistance = 0;
    let pinchMid = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0, t: 0 };
    let lastTap = { t: 0, x: 0, y: 0 };

    listen(canvas, 'pointerdown', (event) => {
      canvas.setPointerCapture(event.pointerId);
      const p = local(event);
      pointers.set(event.pointerId, p);
      controller.stopInertia();
      if (pointers.size === 1) {
        moved = 0;
        velocity = { x: 0, y: 0, t: performance.now() };
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
        pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        moved += 100; // a pinch is never a tap
      }
    });

    listen(canvas, 'pointermove', (event) => {
      const p = local(event);
      if (!pointers.has(event.pointerId)) {
        if (event.pointerType === 'mouse') this.hover = p;
        return;
      }
      const previous = pointers.get(event.pointerId)!;
      pointers.set(event.pointerId, p);
      if (pointers.size === 1) {
        const dx = p.x - previous.x;
        const dy = p.y - previous.y;
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 4) {
          controller.pan(dx, dy);
          const now = performance.now();
          const dt = Math.max(1, now - velocity.t);
          velocity = { x: velocity.x * 0.6 + (dx / dt) * 0.4, y: velocity.y * 0.6 + (dy / dt) * 0.4, t: now };
        }
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (pinchDistance > 0) controller.pinch(distance / pinchDistance, mid.x, mid.y);
        controller.pan(mid.x - pinchMid.x, mid.y - pinchMid.y);
        pinchDistance = distance;
        pinchMid = mid;
      }
    });

    const up = (event: PointerEvent) => {
      const p = local(event);
      const wasSingle = pointers.size === 1;
      pointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (pointers.size === 1) moved += 100;
      if (!wasSingle) return;
      if (moved < 6) {
        const picked = this.pickAt(p.x, p.y);
        const now = performance.now();
        const doubleTap = event.pointerType !== 'mouse' && now - lastTap.t < 320 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 30;
        lastTap = { t: now, x: p.x, y: p.y };
        if (doubleTap && picked) {
          this.enter(picked);
          return;
        }
        controller.select(picked);
        if (picked && !this.lensOn) this.lensOn = true;
        canvas.focus({ preventScroll: true });
      } else if (performance.now() - velocity.t < 80) {
        controller.release(velocity.x, velocity.y);
      }
    };
    listen(canvas, 'pointerup', up);
    listen(canvas, 'pointercancel', up);
    listen(canvas, 'pointerleave', () => {
      this.hover = null;
      this.hoverId = null;
    });
    listen(canvas, 'dblclick', (event) => {
      const p = local(event);
      const picked = this.pickAt(p.x, p.y);
      if (picked) this.enter(picked);
    });

    // Keyboard works anywhere on the page unless the viewer is typing.
    listen(window, 'keydown', (event) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const step = 60;
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          if (controller.selectedId && controller.selectedId !== controller.camera.frameId && !controller.flying) controller.select(null);
          else void controller.out();
          break;
        case 'Enter':
          if (controller.selectedId && target === canvas) {
            event.preventDefault();
            this.enter(controller.selectedId);
          }
          break;
        case '+':
        case '=':
          controller.nudge(1);
          break;
        case '-':
        case '_':
          controller.nudge(-1);
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          if (target !== canvas && target !== document.body) return;
          event.preventDefault();
          controller.pan(event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0, event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0);
          break;
        case 'Tab': {
          if (target !== canvas) return;
          // Cycle through what is visible inside the current frame.
          const ids = (this.store.childrenOf(controller.camera.frameId) ?? []).filter((id) => this.store.get(id)?.perceivable);
          if (!ids.length) return;
          event.preventDefault();
          const index = controller.selectedId ? ids.indexOf(controller.selectedId) : -1;
          const next = ids[(index + (event.shiftKey ? -1 : 1) + ids.length) % ids.length];
          controller.select(next);
          this.announce = this.store.get(next)?.title ?? '';
          break;
        }
        case 'l':
        case 'L':
          this.toggleLens();
          break;
        case 'r':
        case 'R':
          void this.random();
          break;
      }
    });
  }
}

function readFonts() {
  const root = getComputedStyle(document.documentElement);
  const sans = root.getPropertyValue('--font-sans').trim() || getComputedStyle(document.body).fontFamily || 'sans-serif';
  const mono = root.getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';
  return { sans, mono };
}
