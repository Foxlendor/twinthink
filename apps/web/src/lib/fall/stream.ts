// The Fall from inside the current: the relationship you are riding is the tube around you.
//
// Its rings are fixed in the space, so they stream past as you move. Where it reaches a subject
// the tube swells (a region), and that subject's own relationships split off ahead as branches:
// wider the stronger, the strongest nearly straight on. Only the next split is drawn clearly, and
// the one after it faintly. A person's own work is a thinner rose side current, with rose threads
// drifting along the wall toward it before it splits off.
//
// While moving, nothing is named but the subject drifting past. Stopping is understanding: held
// still, what is where you are resolves (the subject and its line in a region, why the two connect
// in a passage, every branch and its reason at a split).

import { INK, PAPER, ROSE, View, project } from './draw';
import { V3, add, cross, len, norm, scale, sub } from './space';
import { Zone } from './ride';

export interface Branch {
  id: string;
  title: string;
  why?: string;
  strength: number;
  human?: boolean;
  /** The branch itself: from the split to the next subject along it. */
  path: (t: number) => V3;
  /** Where that subject leads in turn (once known): the split after, faint. */
  onward: ((t: number) => V3)[];
}

export interface StreamScene {
  leg: { path: (t: number) => V3; s: number; length: number; strength: number; human: boolean; why?: string };
  /** The subject behind you (none on the way in) and the one ahead. */
  behind: { title: string; line?: string } | null;
  ahead: { title: string; line?: string };
  branches: Branch[];
  captured: string | null;
  capture: number;
  /** How far stopping has resolved what is here (0 moving, 1 fully still). */
  still: number;
  zone: Zone;
  /** A person's own work a step or two on, when it is not a branch here. */
  roseNear?: { title: string; through: string; path: (t: number) => V3 } | null;
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
  ctx.fillStyle = `rgba(${INK},${a})`;
  ctx.fillText(s, x, y);
}

function wrap(ctx: CanvasRenderingContext2D, s: string, max: number, lines = 3) {
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

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The tube's width for a relationship: wider the stronger. */
export const tubeOf = (strength: number) => 0.2 + 0.2 * Math.max(0, Math.min(1, strength));

export function drawStream(ctx: CanvasRenderingContext2D, v: View, sc: StreamScene) {
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
  const around = (path: (t: number) => V3, t: number, radius: number, th: number) => {
    const [e1, e2] = across(tangentAt(path, t));
    return add(path(t), add(scale(e1, Math.cos(th) * radius), scale(e2, Math.sin(th) * radius)));
  };
  /**
   * A tube along a path: rings fixed in the space (so they stream past as you move), and a few
   * seams running along it (so each branch reads as its own way).
   */
  const tube = (path: (t: number) => V3, from: number, to: number, length: number, radius: (t: number) => number, alpha: (t: number) => number, colAt: (t: number) => string, seams = 6, spacing = 0.34) => {
    const step = spacing / Math.max(0.5, length);
    for (let t = Math.ceil(from / step) * step; t <= to + 1e-4; t += step) {
      const tt = Math.min(1, t);
      const r = radius(tt);
      const qs: ([number, number, number] | null)[] = [];
      for (let k = 0; k < 32; k++) qs.push(P(around(path, tt, r, (k / 32) * Math.PI * 2)));
      stroke(qs, alpha(tt), colAt(tt), true);
    }
    const fine = step / 3;
    for (let j = 0; j < seams; j++) {
      const th = (j / seams) * Math.PI * 2 + 0.3;
      for (let t = from; t < to; t += fine * 4) {
        const qs: ([number, number, number] | null)[] = [];
        for (let u = t; u <= Math.min(to, t + fine * 4) + 1e-6; u += fine) qs.push(P(around(path, Math.min(1, u), radius(Math.min(1, u)), th)));
        stroke(qs, 0.55 * alpha(Math.min(1, t)), colAt(Math.min(1, t)), false);
      }
    }
  };
  const { leg } = sc;
  const L = leg.length;
  // a region swells the tube where it meets a subject (either end of a relationship)
  const swell = (distToEnd: number) => 0.55 * Math.exp(-Math.pow(distToEnd / 1.1, 2));
  const moving = 1 - sc.still;

  // the relationship you are riding: around you, streaming past
  const r0 = tubeOf(leg.strength);
  const legR = (t: number) => r0 * (1 + swell(t * L) + swell((1 - t) * L));
  tube(
    leg.path,
    leg.s,
    1,
    L,
    legR,
    (t) => {
      const ahead = (t - leg.s) * L;
      return 0.34 * Math.min(1, ahead * 1.4) * Math.exp(-ahead / 6);
    },
    // crossing into (or out of) a person's work: the tube turns to rose thread partway along
    (t) => (leg.human && t > 0.45 ? ROSE : INK),
    0
  );

  // the split ahead: every branch, its width its strength, fading as it runs on to its subject
  const human = sc.branches.find((b) => b.human);
  for (const b of sc.branches) {
    const captured = b.id === sc.captured;
    const emph = captured ? 1 + 0.7 * sc.capture : 1 - 0.5 * sc.capture;
    const col = b.human ? ROSE : INK;
    const r = tubeOf(b.strength) * (b.human ? 0.65 : 0.85);
    const bl = len(sub(b.path(1), b.path(0)));
    const toEnd = (1 - leg.s) * L;
    tube(
      b.path,
      0.06,
      1,
      bl,
      (t) => r * (0.55 + 0.45 * Math.min(1, t * 4) + swell((1 - t) * bl)),
      (t) => (0.08 + 0.28 * b.strength) * (1 - 0.75 * t) * emph * Math.exp(-toEnd / 8),
      () => col,
      3,
      0.55
    );
    // the split after this one: only its line, faint
    for (const o of b.onward) {
      for (let t = 0.1; t <= 1; t += 0.06) {
        const q = P(o(t));
        if (q) dot1(q[0], q[1], Math.max(1, Math.min(2, 0.008 * q[2])), (captured ? 0.24 : 0.12) * (1 - 0.6 * t), INK);
      }
    }
    if (b.human) {
      // rose light at the mouth of a person's side current
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

  // before a person's side current splits off, rose threads drift along the wall toward it
  if (human && !leg.human) {
    const target = human.path(0.3);
    const drift = sc.reduced ? 0 : sc.time * 0.05;
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 26; i++) {
        const t = 0.35 + ((i / 26 + drift + k * 0.013) % 1) * 0.65;
        if (t < leg.s + 0.02) continue;
        const c = leg.path(t);
        const tan = tangentAt(leg.path, t);
        let toward = sub(target, c);
        toward = sub(toward, scale(tan, toward[0] * tan[0] + toward[1] * tan[1] + toward[2] * tan[2]));
        if (len(toward) < 1e-4) continue;
        toward = norm(toward);
        const side = cross(tan, toward);
        const ang = (k - 1) * 0.28;
        const radius = legR(t) * 0.96;
        const q = P(add(c, scale(add(scale(toward, Math.cos(ang)), scale(side, Math.sin(ang))), radius)));
        if (q) dot1(q[0], q[1], Math.max(1.2, Math.min(3, 0.012 * q[2])), 0.45 * (0.4 + 0.6 * t), ROSE);
      }
    }
  }

  // held still: a person's own work a step or two on, as a rose thread along the way to it
  if (sc.roseNear && sc.still > 0.05) {
    for (let t = 0.05; t <= 1; t += 0.04) {
      const q = P(sc.roseNear.path(t));
      if (q) dot1(q[0], q[1], Math.max(1.4, Math.min(3, 0.012 * q[2])), 0.55 * sc.still, ROSE);
    }
  }

  // words
  const boxes: [number, number, number, number][] = [];
  const clear = (b: [number, number, number, number]) => !boxes.some((q) => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]);
  const capY = v.h - (v.w < 600 ? 230 : 160);
  const big = Math.round(Math.max(22, Math.min(30, v.w / 28)));
  ctx.textAlign = 'center';

  // the subject drifting past: named as you come into its region, gone as you leave it
  const aheadA = Math.max(smooth(0.6, 0.8, leg.s), sc.zone === 'arriving' ? sc.still : 0);
  const behindA = sc.behind ? Math.max(1 - smooth(0.03, 0.15, leg.s), sc.zone === 'leaving' ? sc.still : 0) : 0;
  const drift = (x: number) => (sc.reduced ? 0 : x * moving);
  const caption = (title: string, line: string | undefined, a: number, dy: number) => {
    ctx.font = `italic ${big}px ${sc.serif}`;
    text(ctx, title, v.cx, capY + dy, 0.9 * a);
    boxes.push([v.cx - 260, capY + dy - big - 4, v.cx + 260, capY + dy + 70]);
    if (line && sc.still > 0.02) {
      ctx.font = `italic 15px ${sc.serif}`;
      wrap(ctx, line, Math.min(460, v.w - 48)).forEach((l, i) => text(ctx, l, v.cx, capY + dy + 26 + i * 20, 0.62 * a * sc.still));
    }
  };
  if (sc.zone === 'passage' && sc.still > 0.02 && sc.behind) {
    // stopped between two subjects: why the two connect
    ctx.font = `italic 15px ${sc.serif}`;
    text(ctx, sc.behind.title, v.cx, capY - big - 10, 0.55 * sc.still);
    ctx.font = `italic ${big}px ${sc.serif}`;
    text(ctx, sc.ahead.title, v.cx, capY, 0.9 * sc.still);
    if (leg.why) {
      ctx.font = `italic 15px ${sc.serif}`;
      wrap(ctx, leg.why, Math.min(460, v.w - 48)).forEach((l, i) => text(ctx, l, v.cx, capY + 26 + i * 20, 0.62 * sc.still));
    }
    boxes.push([v.cx - 260, capY - big - 30, v.cx + 260, capY + 80]);
  } else if (aheadA > 0.02) caption(sc.ahead.title, sc.status ?? sc.ahead.line, aheadA, drift(-(leg.s - 0.8) * 40));
  else if (behindA > 0.02 && sc.behind) caption(sc.behind.title, sc.behind.line, behindA, drift(-(leg.s + 0.1) * 60));
  else if (sc.status) {
    ctx.font = `italic 15px ${sc.serif}`;
    text(ctx, sc.status, v.cx, capY, 0.62);
  }

  // held still near a split: every branch named where it leaves, with its reason
  if (sc.still > 0.02 && sc.zone === 'arriving') {
    const labels = sc.branches
      .map((b) => ({ b, q: P(b.path(0.42)) }))
      .filter((x): x is { b: Branch; q: [number, number, number] } => !!x.q)
      .sort((x, y) => Number(!!y.b.human) - Number(!!x.b.human) || y.b.strength - x.b.strength);
    for (const { b, q } of labels) {
      ctx.font = `italic 16px ${sc.serif}`;
      const nw = ctx.measureText(b.title).width;
      ctx.font = `italic 12.5px ${sc.serif}`;
      const why = b.why ? wrap(ctx, b.why, Math.min(260, v.w * 0.42), 2) : [];
      const ww = Math.max(nw, ...why.map((l) => ctx.measureText(l).width));
      const x = Math.max(16 + ww / 2, Math.min(v.w - 16 - ww / 2, q[0]));
      let y = Math.max(80, Math.min(v.h - 120, q[1]));
      const boxAt = (yy: number): [number, number, number, number] => [x - ww / 2 - 4, yy - 16, x + ww / 2 + 4, yy + 4 + why.length * 15];
      let box = boxAt(y);
      for (let tries = 0; tries < 6 && !clear(box); tries++) {
        y += (tries % 2 ? -1 : 1) * (tries + 1) * 22;
        box = boxAt(y);
      }
      if (!clear(box)) continue;
      boxes.push(box);
      const faint = b.id === sc.captured ? 1 : 0.72;
      ctx.font = `italic 16px ${sc.serif}`;
      text(ctx, b.title, x, y, 0.88 * sc.still * faint);
      if (b.human) dot1(x - nw / 2 - 9, y - 5, 5, 0.8 * sc.still, ROSE);
      ctx.font = `italic 12.5px ${sc.serif}`;
      why.forEach((l, i) => text(ctx, l, x, y + 16 + i * 15, 0.55 * sc.still * faint));
    }
  }
  // held still, leaving a subject: the relationship you are riding, named ahead
  if (sc.still > 0.02 && sc.zone === 'leaving') {
    const q = P(leg.path(0.55));
    if (q) {
      ctx.font = `italic 16px ${sc.serif}`;
      const y = Math.max(80, Math.min(capY - 80, q[1]));
      text(ctx, sc.ahead.title, q[0], y, 0.85 * sc.still);
      if (leg.why) {
        ctx.font = `italic 12.5px ${sc.serif}`;
        wrap(ctx, leg.why, Math.min(300, v.w - 48), 2).forEach((l, i) => text(ctx, l, Math.max(16 + 150, Math.min(v.w - 166, q[0])), y + 16 + i * 15, 0.55 * sc.still));
      }
    }
  }
  // and the person's work a step or two on, named where its thread leads
  if (sc.roseNear && sc.still > 0.05) {
    const q = P(sc.roseNear.path(0.9));
    if (q) {
      ctx.font = `italic 14px ${sc.serif}`;
      const label = `${sc.roseNear.title}, a step on through ${sc.roseNear.through}`;
      const w = ctx.measureText(label).width;
      const x = Math.max(16 + w / 2, Math.min(v.w - 16 - w / 2, q[0]));
      let y = Math.max(70, Math.min(capY - 60, q[1] - 12));
      for (let tries = 0; tries < 6 && !clear([x - w / 2, y - 14, x + w / 2, y + 4]); tries++) y -= 20;
      text(ctx, label, x, y, 0.7 * sc.still);
    }
  }
  ctx.textAlign = 'left';
}
