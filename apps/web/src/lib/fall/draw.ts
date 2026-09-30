// Drawing a Fall: ink on paper, and nothing but what the path and its strands put there.
//
// No tunnel, no particles, no fixed spiral. What you see is: where you are (a place, named), the
// strands leading on from it (dotted silk, darker and nearer the stronger the connection), your
// own thread behind you through every place you reached (solid, the way you actually came), the
// ways you passed at each of those places (short faint stubs), and, faintly past each way on,
// where it leads in turn (once known). Leaning toward a way on pulls it in and pushes the rest
// out; a strand walked before (on this device) is drawn solid, one never taken stays dotted.

import { Opening, Place, V3, add, between, blend, cross, dot, len, norm, scale, sub } from './space';

export const INK = '30,28,36';
export const PAPER = '#fbfaf7';
/** The Slate's colour for credit: a thread to a person's own work. */
export const ROSE = '176,118,146';

export interface Cam {
  eye: V3;
  at: V3;
  up: V3;
}

export interface View {
  w: number;
  h: number;
  F: number;
  cx: number;
  cy: number;
  cf: V3;
  cr: V3;
  cu: V3;
  eye: V3;
}

export function viewOf(cam: Cam, w: number, h: number): View {
  const cf = norm(sub(cam.at, cam.eye));
  const cr = norm(cross(cf, cam.up));
  const cu = cross(cr, cf);
  return { w, h, F: 0.62 * Math.max(Math.min(w, h), 0.6 * Math.max(w, h)), cx: w / 2, cy: h * 0.46, cf, cr, cu, eye: cam.eye };
}

const NEAR = 0.15;

/** Screen position and scale of a point, or null if it is behind you. */
export function project(v: View, p: V3): [number, number, number] | null {
  const d = sub(p, v.eye);
  const z = dot(d, v.cf);
  if (z < NEAR) return null;
  const k = v.F / z;
  return [v.cx + dot(d, v.cr) * k, v.cy - dot(d, v.cu) * k, k];
}

export interface Shown {
  opening: Opening;
  x: number;
  y: number;
  r: number;
}

export interface Scene {
  places: Map<string, Place>;
  route: string[];
  /** The ways on from where you are (placed), and how far each has been pushed or pulled by leaning. */
  openings: Opening[];
  aimed: string | null;
  lean: number;
  /** Past each way on, where it leads in turn (already known), faint. */
  beyond: Map<string, V3[]>;
  /**
   * How legible each way on has become to you (0 to 1). At first you see only enough to orient:
   * a short stub in its direction. Leaning toward it draws it out, then names it, then says why.
   */
  reveal: (id: string) => number;
  /** What your path keeps circling: where, what, and how many of your places link to it. */
  centres: { id: string; title: string; at: V3; n: number }[];
  here: { id: string; title: string; line?: string; pos: V3 } | null;
  /** On this device: places seen before (how much), and strands walked before. */
  seen: (id: string) => number;
  walked: (from: string, to: string) => boolean;
  /** Looking back over the whole path: every place is named. */
  overlooking: number;
  /** Travelling: how far along (0 to 1); the place ahead is named only as you arrive. */
  arriving: number;
  status?: string;
  serif: string;
}

/** A strand hangs a little, like silk, instead of running ruler straight. */
function strandAt(a: V3, b: V3, up: V3, t: number): V3 {
  const m = add(scale(add(a, b), 0.5), scale(up, -0.1 * len(sub(b, a))));
  const s = 1 - t;
  return add(add(scale(a, s * s), scale(m, 2 * s * t)), scale(b, t * t));
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, a: number) {
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

export function drawFall(ctx: CanvasRenderingContext2D, v: View, sc: Scene): Shown[] {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, v.w, v.h);
  const up = v.cu;
  const shown: Shown[] = [];
  const P = (p: V3) => project(v, p);
  // names never print over each other: the first placed keeps its room
  const boxes: [number, number, number, number][] = [];
  const room = (x: number, y: number, w: number, h: number) => {
    const b: [number, number, number, number] = [x - w / 2 - 3, y - h, x + w / 2 + 3, y + 4];
    if (boxes.some((q) => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1])) return false;
    boxes.push(b);
    return true;
  };

  // your thread: through every place reached, the way you actually came (solid, the only solid line)
  const places = sc.route.map((id) => sc.places.get(id)).filter((p): p is Place => !!p);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i < places.length; i++) {
    const a = places[i - 1];
    const b = places[i];
    const path = between(a.frame, { ...b.frame, p: b.frame.p });
    let prev: [number, number, number] | null = null;
    for (let s = 0; s <= 24; s++) {
      const q = P(path(s / 24));
      if (q && prev) {
        ctx.strokeStyle = `rgba(${INK},${0.62})`;
        ctx.lineWidth = Math.min(3.2, Math.max(0.8, 0.018 * (q[2] + prev[2]) * 0.5));
        ctx.beginPath();
        ctx.moveTo(prev[0], prev[1]);
        ctx.lineTo(q[0], q[1]);
        ctx.stroke();
      }
      prev = q;
    }
  }
  // where a run of strong links held your way nearly straight, the space closed in around it: rings
  // form along that stretch of your thread, tighter the stronger the link (a tunnel, earned)
  const ring = (c: V3, t: V3, radius: number, a: number) => {
    const e1 = norm(cross(t, up));
    const e2 = cross(e1, t);
    for (let k = 0; k < 30; k++) {
      const th = (k / 30) * Math.PI * 2;
      const q = P(add(c, add(scale(e1, Math.cos(th) * radius), scale(e2, Math.sin(th) * radius))));
      if (!q) continue;
      ctx.fillStyle = `rgba(${INK},${a})`;
      ctx.fillRect(q[0] - 0.8, q[1] - 0.8, 1.6, 1.6);
    }
  };
  for (let i = 1; i < places.length; i++) {
    const a = places[i - 1];
    const b = places[i];
    const w = b.via?.strength ?? 0;
    if (b.via?.from !== a.id || w < 0.7 || dot(a.frame.f, b.frame.f) < 0.8) continue;
    const path = between(a.frame, b.frame);
    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const fr = blend(a.frame, b.frame, t, path);
      ring(fr.p, fr.f, 0.62 - 0.4 * Math.min(1, (w - 0.7) / 0.3), 0.2);
    }
  }
  // what your path keeps circling: a faint centre, named, heavier the more often you have come round
  for (const c of sc.centres) {
    const q = P(c.at);
    if (!q) continue;
    const a = Math.min(0.55, 0.22 + 0.08 * (c.n - 3));
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = `rgba(${INK},${a * (1 - k * 0.3)})`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(q[0], q[1], Math.max(8, 0.1 * q[2]) * (1 + k * 0.7), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.font = `italic 14px ${sc.serif}`;
    ctx.textAlign = 'center';
    const ty = q[1] - Math.max(8, 0.1 * q[2]) * 2.5 - 6;
    // looking back, a place you stood on is already named where it is
    if (!(sc.overlooking > 0.05 && sc.places.has(c.id)) && room(q[0], ty, ctx.measureText(c.title).width, 16)) text(ctx, c.title, q[0], ty, a + 0.1);
  }
  // the ways passed at each place behind you: short, faint stubs, so the choices you did not make stay visible
  for (const pl of places) {
    if (sc.here && pl.id === sc.here.id) continue;
    for (const w of pl.passed) {
      for (let s = 1; s <= 8; s++) {
        const q = P(strandAt(pl.frame.p, w.pos, up, (s / 8) * 0.34));
        if (q) {
          ctx.fillStyle = `rgba(${INK},${0.22 * (1 - s / 10)})`;
          ctx.fillRect(q[0] - 0.8, q[1] - 0.8, 1.6, 1.6);
        }
      }
    }
    // a place already reached: a small ink mark, and (looking back) its name
    const q = P(pl.frame.p);
    if (q) {
      const r = Math.max(2.5, Math.min(9, 0.07 * q[2]));
      ctx.fillStyle = `rgba(${INK},0.55)`;
      ctx.beginPath();
      ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
      ctx.fill();
      if (sc.overlooking > 0.05) {
        ctx.font = `italic ${Math.round(Math.max(12, Math.min(16, 0.1 * q[2])))}px ${sc.serif}`;
        ctx.textAlign = 'center';
        text(ctx, pl.title, q[0], q[1] - r - 6, 0.78 * sc.overlooking);
      }
    }
  }

  const hereP = sc.here ? P(sc.here.pos) : null;
  const hereA = (1 - sc.overlooking) * Math.max(0, Math.min(1, (sc.arriving - 0.6) / 0.4));
  const hereR = hereP ? Math.max(5, Math.min(18, 0.11 * hereP[2])) : 0;
  // where you are is named in a caption of its own, low on the page, so the space around the
  // place itself stays free for its strands (what it led to lies below it, and must be seen)
  const capY = v.h - (v.w < 600 ? 250 : 176);
  if (sc.here && hereA > 0.05) boxes.push([v.cx - 250, capY - 34, v.cx + 250, capY + 70]);
  if (sc.here && hereP && hereA > 0.05) {
    ctx.font = `italic 15px ${sc.serif}`;
    room(hereP[0], hereP[1] - hereR - 8, ctx.measureText(sc.here.title).width, 16);
  }
  // few ways on, and a strong one among them: the space narrows along it (a tunnel forming ahead)
  if (sc.here && sc.openings.length > 0 && sc.openings.length <= 3) {
    const best = sc.openings.reduce((a, b) => (b.strand.strength > a.strand.strength ? b : a));
    if (best.strand.strength >= 0.7 && !best.back) {
      for (const t of [0.35, 0.55, 0.75]) {
        const c = strandAt(sc.here.pos, best.pos, up, t);
        const d = sub(strandAt(sc.here.pos, best.pos, up, Math.min(1, t + 0.02)), c);
        ring(c, norm(d), 0.55 - 0.3 * (best.strand.strength - 0.7), 0.16);
      }
    }
  }
  // the ways on: each strand from here to where it leads
  for (const o of sc.openings) {
    const aimed = sc.aimed === o.strand.to;
    const lean = sc.aimed ? sc.lean : 0;
    const w = o.strand.strength;
    // leaning: the one leaned toward comes in, the rest drift out and fade
    const fade = aimed ? 1 : 1 - 0.65 * lean;
    const walked = sc.here ? sc.walked(sc.here.id, o.strand.to) : false;
    const from = sc.here?.pos;
    if (!from) continue;
    const known = sc.reveal(o.strand.to);
    // a person's own work is joined by a thread of credit, in rose, as on the Slate
    const col = o.strand.human ? ROSE : INK;
    // only as much of the strand as you have attended to: a stub at first, all of it once looked at
    const reach = 0.22 + 0.78 * Math.min(1, known / 0.6);
    const legible = 0.35 + 0.65 * known;
    const N = Math.max(10, Math.round(len(sub(o.pos, from)) * 9));
    for (let s = 1; s < N; s++) {
      if (s / N > reach) break;
      const q = P(strandAt(from, o.pos, up, s / N));
      if (!q) continue;
      const a = (0.18 + 0.5 * w) * fade * legible * (aimed ? 1.35 : 1) * (o.strand.shape === 'faded' ? 0.5 : 1);
      const size = Math.max(1, Math.min(3.4, (0.012 + 0.012 * w) * q[2] * (aimed ? 1.4 : 1)));
      if (walked) {
        const q2 = P(strandAt(from, o.pos, up, (s + 1) / N));
        if (q2) {
          ctx.strokeStyle = `rgba(${col},${a})`;
          ctx.lineWidth = size * 0.8;
          ctx.beginPath();
          ctx.moveTo(q[0], q[1]);
          ctx.lineTo(q2[0], q2[1]);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = `rgba(${col},${a})`;
        ctx.beginPath();
        ctx.arc(q[0], q[1], size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // where it leads in turn, once known and looked at: faint, further on
    for (const b of known > 0.55 ? sc.beyond.get(o.strand.to) ?? [] : []) {
      for (let s = 2; s <= 10; s += 2) {
        const q = P(strandAt(o.pos, b, up, s / 10));
        if (!q) continue;
        ctx.fillStyle = `rgba(${INK},${0.12 * fade * (aimed ? 1.8 : 1)})`;
        ctx.fillRect(q[0] - 0.7, q[1] - 0.7, 1.4, 1.4);
      }
    }
    // not yet attended to: just where the stub points, a mark with no outline and no name
    if (reach < 0.999) {
      const e = P(strandAt(from, o.pos, up, reach));
      if (e) {
        ctx.fillStyle = `rgba(${col},${0.3 * fade * legible})`;
        ctx.beginPath();
        ctx.arc(e[0], e[1], 2.2, 0, Math.PI * 2);
        ctx.fill();
        shown.push({ opening: o, x: e[0], y: e[1], r: 26 });
      }
      continue;
    }
    const q = P(o.pos);
    if (!q) continue;
    const r = Math.max(4, Math.min(22, (0.07 + 0.06 * w) * q[2])) * (aimed ? 1.25 : 1);
    ctx.strokeStyle = `rgba(${col},${(0.35 + 0.45 * w) * fade * legible * (aimed ? 1.3 : 1)})`;
    ctx.lineWidth = aimed ? 2 : 1.2;
    ctx.beginPath();
    ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
    ctx.stroke();
    // seen here before, on this device: dew gathered on it
    const seen = sc.seen(o.strand.to);
    if (seen > 0) {
      const n = Math.min(10, 3 + seen * 2);
      for (let k = 0; k < n; k++) {
        const t = (k / n) * Math.PI * 2 + 0.4;
        ctx.fillStyle = `rgba(${INK},${0.4 * fade})`;
        ctx.beginPath();
        ctx.arc(q[0] + Math.cos(t) * r * 1.35, q[1] + Math.sin(t) * r * 1.35, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // words only once the space has done its part: named after you have leaned toward it a while,
    // and why only once you are still leaning (a name stays, faintly, once learned)
    const nameA = known > 0.62 ? (aimed ? 0.92 : 0.42 * fade) : 0;
    ctx.font = `italic ${aimed ? 17 : 14}px ${sc.serif}`;
    const label = o.strand.title.slice(0, 44);
    const below = q[1] >= (hereP?.[1] ?? v.cy);
    const ty = below ? q[1] + r + 17 : q[1] - r - 9;
    const tx = Math.max(60, Math.min(v.w - 60, q[0]));
    if (nameA > 0.03 && (aimed || room(tx, ty, ctx.measureText(label).width, 16))) {
      ctx.textAlign = 'center';
      text(ctx, label, tx, ty, nameA);
      if (aimed && o.strand.why && known > 0.85) {
        ctx.font = `italic 13px ${sc.serif}`;
        text(ctx, o.back ? `${o.strand.why}, back where you were` : o.strand.why, tx, ty + (below ? 17 : -18), 0.6);
      }
    }
    shown.push({ opening: o, x: q[0], y: q[1], r: Math.max(r * 1.4, 22) });
  }

  // where you are: a place, named, with the one line the source gives
  if (sc.here && hereP) {
    const r = hereR;
    ctx.fillStyle = `rgba(${INK},0.82)`;
    ctx.beginPath();
    ctx.arc(hereP[0], hereP[1], r, 0, Math.PI * 2);
    ctx.fill();
    const seen = sc.seen(sc.here.id);
    if (seen > 1) {
      for (let k = 0; k < Math.min(12, seen * 2); k++) {
        const t = (k / Math.min(12, seen * 2)) * Math.PI * 2;
        ctx.fillStyle = `rgba(${INK},0.45)`;
        ctx.beginPath();
        ctx.arc(hereP[0] + Math.cos(t) * r * 1.5, hereP[1] + Math.sin(t) * r * 1.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (sc.overlooking > 0.05) {
      ctx.textAlign = 'center';
      ctx.font = `italic 15px ${sc.serif}`;
      text(ctx, sc.here.title, hereP[0], hereP[1] - r - 8, 0.9 * sc.overlooking);
    }
    if (hereA > 0.03) {
      const a = hereA;
      ctx.textAlign = 'center';
      ctx.font = `italic 15px ${sc.serif}`;
      text(ctx, sc.here.title.slice(0, 44), hereP[0], hereP[1] - r - 8, 0.7 * a);
      ctx.font = `italic ${Math.round(Math.max(22, Math.min(30, v.w / 28)))}px ${sc.serif}`;
      text(ctx, sc.here.title, v.cx, capY, 0.9 * a);
      if (sc.here.line || sc.status) {
        ctx.font = `italic 15px ${sc.serif}`;
        const words = (sc.status ?? sc.here.line ?? '').split(' ');
        const lines: string[] = [];
        let cur = '';
        for (const wd of words) {
          const tryLine = cur ? `${cur} ${wd}` : wd;
          if (ctx.measureText(tryLine).width > Math.min(460, v.w - 48) && cur) {
            lines.push(cur);
            cur = wd;
          } else cur = tryLine;
        }
        if (cur) lines.push(cur);
        lines.slice(0, 3).forEach((l, i) => text(ctx, l, v.cx, capY + 26 + i * 20, 0.62 * a));
      }
    }
  }
  ctx.textAlign = 'left';
  return shown;
}
