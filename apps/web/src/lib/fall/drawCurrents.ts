// Drawing the Fall from inside: each current is drawn in ink, like a tube of rings.
//
// The environment never stops moving; only you do. Rings flow along every current all the time,
// in the direction its relationship runs, and a faint haze drifts, so the Fall is alive while you
// are Located. The current you arrived by widens where it meets the subject; the currents leaving
// the subject separate from there, wider the stronger, the strongest nearly straight on. A rose
// current is drawn thinner, with rose threads drifting toward it along the current you arrived by.
// Words are few: the subject (its line once you are Located), and the name, then the reason, of
// whatever current you look at.

import { INK, PAPER, ROSE, View, project } from './draw';
import { V3, add, cross, len, norm, scale, sub } from './space';

export interface RouteCurrent {
  path: (t: number) => V3;
  length: number;
  strength: number;
  /** Where along it is rose (crossing into, or out of, a person's work). */
  roseAt?: (t: number) => boolean;
  /** Swelling where it meets a subject, at either end (how much). */
  swellA?: number;
  swellB?: number;
  alpha?: number;
}

export interface LeavingCurrent {
  id: string;
  path: (t: number) => V3;
  length: number;
  strength: number;
  human?: boolean;
  /** How much it stands out: leaned at and pulling (above 1), or passed over (below 1). */
  emph: number;
  /** Where it leads in turn (once known): faint lines only. */
  onward: ((t: number) => V3)[];
}

export interface CurrentLabel {
  at: V3;
  title: string;
  why?: string;
  nameA: number;
  whyA: number;
  rose?: boolean;
  big?: boolean;
}

export interface CurrentsScene {
  eye: V3;
  route: RouteCurrent[];
  leaving: LeavingCurrent[];
  /** Rose threads drifting toward a rose current, along a current on your route. */
  threads?: { along: RouteCurrent; toward: V3 } | null;
  labels: CurrentLabel[];
  caption: { small?: string; smallA?: number; title: string; titleA: number; line?: string; lineA: number } | null;
  status?: string;
  time: number;
  reduced: boolean;
  serif: string;
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, a: number) {
  if (a < 0.01) return;
  ctx.save();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.globalAlpha = Math.min(1, a * 1.2);
  ctx.strokeText(s, x, y);
  ctx.restore();
  ctx.fillStyle = `rgba(${INK},${Math.min(1, a)})`;
  ctx.fillText(s, x, y);
}

export function wrap(ctx: CanvasRenderingContext2D, s: string, max: number, lines = 3) {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(' ')) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > max && cur) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    out.length = lines;
    out[lines - 1] = `${out[lines - 1].replace(/[\s,.;:]+$/, '')}…`;
  }
  return out;
}

/** A basis square to a direction (for rings around it). */
function across(d: V3): [V3, V3] {
  const helper: V3 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = norm(cross(d, helper));
  return [e1, cross(d, e1)];
}

/** How wide a current is drawn: wider the stronger the relationship. */
export const widthOf = (strength: number) => 0.2 + 0.2 * Math.max(0, Math.min(1, strength));

/** How fast the rings flow along every current (world units a second): nothing is ever still. */
export const FLOW = 0.32;

export function drawCurrents(ctx: CanvasRenderingContext2D, v: View, sc: CurrentsScene) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, v.w, v.h);
  const P = (p: V3) => project(v, p);
  const dot1 = (x: number, y: number, size: number, a: number, col = INK) => {
    if (a < 0.01) return;
    ctx.fillStyle = `rgba(${col},${Math.min(1, a)})`;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  };
  const tangentAt = (path: (t: number) => V3, t: number) => {
    const d = sub(path(Math.min(1, t + 0.01)), path(Math.max(0, t - 0.01)));
    return len(d) > 1e-6 ? norm(d) : ([0, 0, 1] as V3);
  };
  const around = (path: (t: number) => V3, t: number, radius: number, th: number) => {
    const [e1, e2] = across(tangentAt(path, t));
    return add(path(t), add(scale(e1, Math.cos(th) * radius), scale(e2, Math.sin(th) * radius)));
  };
  /** A loop of ink through projected points (broken where a point is behind you). */
  const stroke = (qs: ([number, number, number] | null)[], a: number, col: string, closed: boolean) => {
    if (a < 0.01) return;
    ctx.strokeStyle = `rgba(${col},${Math.min(1, a)})`;
    let k = 0;
    let n = 0;
    ctx.beginPath();
    let prev: [number, number, number] | null = null;
    for (const q of closed ? [...qs, qs[0]] : qs) {
      if (q && prev) {
        ctx.lineTo(q[0], q[1]);
        k += q[2];
        n++;
      } else if (q) ctx.moveTo(q[0], q[1]);
      prev = q;
    }
    ctx.lineWidth = Math.max(0.6, Math.min(2.2, 0.009 * (n ? k / n : 0)));
    ctx.stroke();
  };
  // near you it is clear, far off it fades; right on top of you it thins so you can see out
  const seen = (p: V3) => {
    const d = len(sub(p, sc.eye));
    return Math.min(1, d * 1.3) * Math.exp(-d / 6.5);
  };
  const swell = (amount: number | undefined, dist: number) => (amount ? 0.55 * amount * Math.exp(-Math.pow(dist / 1.2, 2)) : 0);
  const flowAt = (length: number) => (sc.reduced ? 0 : ((sc.time * FLOW) % 0.36) / Math.max(0.5, length));
  /** One current: rings flowing along it, and, for one leaving the subject, a few lines along it so it reads as its own direction. */
  const drawOne = (path: (t: number) => V3, length: number, from: number, radius: (t: number) => number, alpha: (t: number) => number, colAt: (t: number) => string, lines: number) => {
    const step = 0.36 / Math.max(0.5, length);
    const phase = flowAt(length);
    for (let t = from + phase; t <= 1 + 1e-4; t += step) {
      const tt = Math.min(1, t);
      const c = path(tt);
      const a = alpha(tt) * seen(c);
      if (a < 0.01) continue;
      const r = radius(tt);
      const qs: ([number, number, number] | null)[] = [];
      for (let k = 0; k < 32; k++) qs.push(P(around(path, tt, r, (k / 32) * Math.PI * 2)));
      stroke(qs, a, colAt(tt), true);
    }
    const fine = step / 3;
    for (let j = 0; j < lines; j++) {
      const th = (j / lines) * Math.PI * 2 + 0.3;
      for (let t = from; t < 1; t += fine * 4) {
        const qs: ([number, number, number] | null)[] = [];
        for (let u = t; u <= Math.min(1, t + fine * 4) + 1e-6; u += fine) qs.push(P(around(path, Math.min(1, u), radius(Math.min(1, u)), th)));
        stroke(qs, 0.55 * alpha(t) * seen(path(t)), colAt(t), false);
      }
    }
  };

  // a faint haze, drifting (still there, unmoving, with reduced motion)
  for (let k = 0; k < 3; k++) {
    const t = sc.reduced ? k : sc.time * 0.03 + k * 2.1;
    const x = v.w * (0.5 + 0.38 * Math.sin(t * 0.7 + k));
    const y = v.h * (0.45 + 0.3 * Math.cos(t * 0.5 + 2 * k));
    const R = Math.max(v.w, v.h) * (0.35 + 0.1 * k);
    const g = ctx.createRadialGradient(x, y, 1, x, y, R);
    g.addColorStop(0, `rgba(${INK},0.035)`);
    g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, v.w, v.h);
  }

  // the currents on your route near you (the one you are in, the one you came by): rings flowing past
  for (const tb of sc.route) {
    const r0 = widthOf(tb.strength);
    const L = tb.length;
    drawOne(
      tb.path,
      L,
      0,
      (t) => r0 * (1 + swell(tb.swellA, t * L) + swell(tb.swellB, (1 - t) * L)),
      () => 0.34 * (tb.alpha ?? 1),
      (t) => (tb.roseAt?.(t) ? ROSE : INK),
      0
    );
  }

  // the currents leaving the subject: each as wide as its relationship is strong, fading as it runs on
  for (const b of sc.leaving) {
    const col = b.human ? ROSE : INK;
    const r = widthOf(b.strength) * (b.human ? 0.65 : 0.85);
    const bl = b.length;
    drawOne(
      b.path,
      bl,
      0.06,
      (t) => r * (0.55 + 0.45 * Math.min(1, t * 4) + swell(0.8, (1 - t) * bl)),
      (t) => (0.1 + 0.28 * b.strength) * (1 - 0.72 * t) * b.emph,
      () => col,
      3
    );
    for (const o of b.onward) {
      for (let t = 0.1; t <= 1; t += 0.06) {
        const q = P(o(t));
        if (q) dot1(q[0], q[1], Math.max(1, Math.min(2, 0.008 * q[2])), 0.12 * Math.min(1.6, b.emph) * (1 - 0.6 * t), INK);
      }
    }
    if (b.human) {
      const q = P(b.path(0.15));
      if (q) {
        const R = Math.max(14, Math.min(50, 0.14 * q[2]));
        const g = ctx.createRadialGradient(q[0], q[1], 1, q[0], q[1], R);
        g.addColorStop(0, `rgba(${ROSE},0.14)`);
        g.addColorStop(1, `rgba(${ROSE},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(q[0] - R, q[1] - R, 2 * R, 2 * R);
      }
    }
  }

  // rose threads drifting toward a rose current, along the current you arrived by
  if (sc.threads) {
    const { along: tb, toward: target } = sc.threads;
    const r0 = widthOf(tb.strength);
    const drift = sc.reduced ? 0 : sc.time * 0.05;
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 26; i++) {
        const t = 0.35 + ((i / 26 + drift + k * 0.013) % 1) * 0.65;
        const c = tb.path(t);
        const tan = tangentAt(tb.path, t);
        let to = sub(target, c);
        to = sub(to, scale(tan, to[0] * tan[0] + to[1] * tan[1] + to[2] * tan[2]));
        if (len(to) < 1e-4) continue;
        to = norm(to);
        const side = cross(tan, to);
        const ang = (k - 1) * 0.28;
        const radius = r0 * (1 + swell(tb.swellB, (1 - t) * tb.length)) * 0.96;
        const p = add(c, scale(add(scale(to, Math.cos(ang)), scale(side, Math.sin(ang))), radius));
        const q = P(p);
        if (q) dot1(q[0], q[1], Math.max(1.2, Math.min(3, 0.012 * q[2])), 0.5 * (0.4 + 0.6 * t) * Math.min(1, 2 * seen(p)), ROSE);
      }
    }
  }

  // words
  const boxes: [number, number, number, number][] = [];
  const clear = (b: [number, number, number, number]) => !boxes.some((q) => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]);
  const capY = v.h - (v.w < 600 ? 230 : 160);
  const big = Math.round(Math.max(22, Math.min(30, v.w / 28)));
  ctx.textAlign = 'center';
  const cap = sc.caption;
  if (cap) {
    if (cap.small && (cap.smallA ?? 0) > 0.01) {
      ctx.font = `italic 14px ${sc.serif}`;
      text(ctx, cap.small, v.cx, capY - big - 8, 0.55 * (cap.smallA ?? 0));
    }
    ctx.font = `italic ${big}px ${sc.serif}`;
    text(ctx, cap.title, v.cx, capY, 0.9 * cap.titleA);
    const line = sc.status ?? cap.line;
    const lineA = sc.status ? 1 : cap.lineA;
    if (line && lineA > 0.01) {
      ctx.font = `italic 15px ${sc.serif}`;
      wrap(ctx, line, Math.min(460, v.w - 48)).forEach((l, i) => text(ctx, l, v.cx, capY + 26 + i * 20, 0.62 * lineA));
    }
    if (cap.titleA > 0.05) boxes.push([v.cx - 260, capY - big - 26, v.cx + 260, capY + 86]);
  } else if (sc.status) {
    ctx.font = `italic 15px ${sc.serif}`;
    text(ctx, sc.status, v.cx, capY, 0.62);
  }
  // the current you look at, named, then why
  for (const lb of [...sc.labels].sort((a, b) => Number(!!b.big) - Number(!!a.big) || b.nameA - a.nameA)) {
    if (lb.nameA < 0.02) continue;
    const q = P(lb.at);
    if (!q) continue;
    const size = lb.big ? 18 : 15;
    ctx.font = `italic ${size}px ${sc.serif}`;
    const nw = ctx.measureText(lb.title).width;
    ctx.font = `italic 12.5px ${sc.serif}`;
    const why = lb.why && lb.whyA > 0.02 ? wrap(ctx, lb.why, Math.min(280, v.w * 0.5), 3) : [];
    const ww = Math.max(nw, ...why.map((l) => ctx.measureText(l).width));
    const x = Math.max(16 + ww / 2, Math.min(v.w - 16 - ww / 2, q[0]));
    let y = Math.max(80, Math.min(capY - 50 - why.length * 15, q[1]));
    const boxAt = (yy: number): [number, number, number, number] => [x - ww / 2 - 4, yy - size, x + ww / 2 + 4, yy + 4 + why.length * 15];
    let box = boxAt(y);
    for (let tries = 0; tries < 6 && !clear(box); tries++) {
      y += (tries % 2 ? -1 : 1) * (tries + 1) * 22;
      box = boxAt(y);
    }
    if (!clear(box) && !lb.big) continue;
    boxes.push(box);
    ctx.font = `italic ${size}px ${sc.serif}`;
    text(ctx, lb.title, x, y, 0.88 * lb.nameA);
    if (lb.rose) dot1(x - nw / 2 - 9, y - 5, 5, 0.8 * lb.nameA, ROSE);
    ctx.font = `italic 12.5px ${sc.serif}`;
    why.forEach((l, i) => text(ctx, l, x, y + 16 + i * 15, 0.58 * lb.whyA));
  }
  ctx.textAlign = 'left';
}
