// Reading a hand: scroll wheels, trackpads and fingers, turned into hops.
//
// Pure (no DOM), so the feel can be tested exactly.

/**
 * A scroll becomes hops. A mouse wheel's notch is one hop. A trackpad sends a
 * swell of small deltas followed by a long decaying tail (its own momentum):
 * the swell may hop, the tail never does, so one swipe on a trackpad is one
 * hop. Pushing on (a long, steady scroll) hops again, each needing more.
 */
export class WheelHops {
  private last = -Infinity;
  private prev = 0;
  private acc = 0;
  private hops = 0;
  private dir = 0;
  private tail = false;
  /** Counts gestures: a new one begins at every pause, turn or notch. */
  gesture = 0;

  /**
   * One wheel event: `d` its delta in pixels (positive is forward), `t` its
   * time in ms, `lineMode` whether the device reported lines or pages (a wheel
   * with notches). Returns the direction to hop (1 or -1), or 0.
   */
  push(d: number, t: number, lineMode = false): 0 | 1 | -1 {
    if (!d) return 0;
    const dt = t - this.last;
    const a = Math.abs(d);
    const sign = d > 0 ? 1 : -1;
    // a wheel's notch: reported in lines, or a large delta that arrives alone or repeats the last one
    // (spun fast, a wheel sends the same size again and again; a trackpad's never repeat exactly)
    const notched = lineMode || (a >= 50 && (dt > 60 || Math.abs(a - this.prev) <= 0.02 * this.prev));
    const decaying = !notched && dt <= 140 && sign === this.dir && a < 0.97 * this.prev;
    // a new gesture: a pause, a turn, a notch, or a fresh swell after a tail
    const fresh = dt > 140 || sign !== this.dir || notched || (this.tail && a > 1.6 * this.prev);
    this.last = t;
    this.prev = a;
    this.tail = decaying && !fresh;
    if (fresh) {
      this.acc = 0;
      this.hops = 0;
      this.dir = sign;
      this.gesture++;
    }
    if (decaying) return 0;
    this.acc += a;
    if (this.acc >= 14 + 480 * this.hops) {
      this.acc = 0;
      this.hops++;
      return sign;
    }
    return 0;
  }
}

/**
 * A finger's speed at the moment it lets go: a straight line fitted to where
 * it was over the last 80ms. A finger that rested before letting go has none.
 */
export class VelocityTracker {
  private pts: { t: number; y: number }[] = [];

  add(t: number, y: number) {
    this.pts.push({ t, y });
    while (this.pts.length > 2 && t - this.pts[0].t > 80) this.pts.shift();
  }

  reset() {
    this.pts = [];
  }

  /** Pixels per second (positive: moving down the screen). */
  velocity(now: number): number {
    const p = this.pts;
    if (p.length < 2) return 0;
    if (now - p[p.length - 1].t > 50) return 0;
    const n = p.length;
    const mt = p.reduce((s, q) => s + q.t, 0) / n;
    const my = p.reduce((s, q) => s + q.y, 0) / n;
    let num = 0;
    let den = 0;
    for (const q of p) {
      num += (q.t - mt) * (q.y - my);
      den += (q.t - mt) * (q.t - mt);
    }
    return den > 0 ? (num / den) * 1000 : 0;
  }
}

/** How many pixels of finger travel carry you one thing along, on a screen of height h. */
export function pxPerStop(h: number) {
  return Math.max(200, Math.min(320, 0.34 * h));
}

/**
 * Where a finger that let go lands, in stops from where it began (0 = back
 * where it began). `u` is how many stops the finger carried it (fractional,
 * positive forward); `v` its speed in stops per second at release; `px` how far
 * it moved in pixels; `vpx` its speed in pixels per second.
 *
 * It lands on the stop the finger reached, rounding on once past 0.22 of the
 * way. A quick flick (350px/s over 24px or more) goes one further than the
 * stop it began from, never more: speed is felt, not skipped through.
 */
export function landing(u: number, vpx: number, px: number): number {
  // (u is measured from a stop the camera was at, or had just passed in the finger's direction)
  const reached = u >= 0 ? Math.floor(u + 0.78) : Math.ceil(u - 0.78);
  const flick = Math.abs(vpx) >= 350 && Math.abs(px) >= 24;
  if (flick) {
    // a finger moving up the screen carries you forward
    const dir = vpx < 0 ? 1 : -1;
    const further = dir > 0 ? Math.max(reached, Math.floor(u) + 1) : Math.min(reached, Math.ceil(u) - 1);
    return further;
  }
  return reached;
}

/**
 * Where a released drag lands, as an index into its run of stops. `u0` is
 * where the camera was when the finger caught it (it may be between stops,
 * caught mid-hop), `u` where the finger carried it. It never lands on the far
 * side of u0 from the way the finger moved.
 */
export function landingIndex(u0: number, u: number, vpx: number, px: number, count: number): number {
  const eps = 1e-6;
  const forward = u > u0 || (u === u0 && vpx < 0);
  // the stop the camera had reached or passed, in the finger's direction
  const start = forward ? Math.floor(u0 + eps) : Math.ceil(u0 - eps);
  let idx = start + landing(u - start, vpx, px);
  if (forward) idx = Math.max(idx, start);
  else idx = Math.min(idx, start);
  return Math.max(0, Math.min(count - 1, idx));
}
