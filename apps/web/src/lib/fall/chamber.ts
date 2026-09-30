// The Fall in first person: you are inside the web, not looking at it.
//
// The place you are at is a chamber around you (rings of ink on its walls). Every way on is an
// opening in that wall, where its relationship puts it (where it came from above, what it led to
// below, kin at the sides), wider the stronger the connection, and through it a passage runs to
// the next place: the very path you would travel, so a long passage is a long way, and the turn it
// takes is the turn you will take. Only the opening you face is named. A person's own work opens
// as a rose-lit side passage whose rings turn rose partway along: the crossing from public
// knowledge into their Whoeuvre. The way you came in stays open behind you.
//
// Nothing here decides what connects: the relationships come from the sources underneath, and
// the places from space.ts. This only draws them from the inside.

import { INK, PAPER, ROSE, Shown, View, project } from './draw';
import { Frame, Opening, V3, add, arrive, between, blend, cross, dot, len, norm, rightOf, scale, sub } from './space';

/** Where you are looking, relative to the way the place faces (radians). */
export interface Look {
  yaw: number;
  pitch: number;
}

/** The direction you look in, and which way is up, for a place and a look. */
export function lookAt(fr: Frame, look: Look): { f: V3; u: V3 } {
  const r = rightOf(fr);
  const cy = Math.cos(look.yaw);
  const sy = Math.sin(look.yaw);
  const f1 = norm(add(scale(fr.f, cy), scale(r, sy)));
  const r1 = norm(cross(f1, fr.u));
  const cp = Math.cos(look.pitch);
  const sp = Math.sin(look.pitch);
  const f = norm(add(scale(f1, cp), scale(fr.u, sp)));
  const u = norm(cross(r1, f));
  return { f, u };
}

/** How wide a way on opens (radians of the wall): the stronger the connection, the wider. */
export const mouthOf = (strength: number) => 0.07 + 0.08 * Math.max(0, Math.min(1, strength));

/** How big the chamber is: roomier the more ways lead on, never past the nearest of them. */
export function chamberRadius(openings: { pos: V3 }[], centre: V3) {
  const near = openings.reduce((m, o) => Math.min(m, len(sub(o.pos, centre))), Infinity);
  const want = 0.95 + 0.07 * openings.length;
  return Math.max(0.7, Math.min(want, Number.isFinite(near) ? near * 0.6 : want));
}

/** The opening you face: the one nearest the middle of your view, if it is within its own mouth. */
export function facing(centre: V3, look: V3, ways: { id: string; pos: V3; strength: number }[]): string | null {
  let best: string | null = null;
  let bestRatio = 1;
  for (const w of ways) {
    const a = Math.acos(Math.max(-1, Math.min(1, dot(norm(sub(w.pos, centre)), look))));
    const ratio = a / (mouthOf(w.strength) + 0.1);
    if (ratio < bestRatio) [best, bestRatio] = [w.id, ratio];
  }
  return best;
}

/** The passage to a way on: the path you would travel, from this place to where that way arrives. */
export function passageOf(here: Frame, to: V3): (t: number) => V3 {
  return between(here, arrive(here, to));
}

export interface Way {
  id: string;
  title: string;
  pos: V3;
  strength: number;
  why?: string;
  human?: boolean;
  /** The way you came in (named "back to", and taken with back). */
  back?: boolean;
  opening?: Opening;
}

export interface ChamberScene {
  /** The place whose chamber this is (while travelling: the place you are going to). */
  place: { id: string; title: string; line?: string; frame: Frame };
  eye: V3;
  look: { f: V3; u: V3 };
  ways: Way[];
  faced: string | null;
  reveal: (id: string) => number;
  seen: (id: string) => number;
  /** Travelling: the passage you are in, how far along, and whether it crosses into a person's work. */
  travel?: { path: (t: number) => V3; t: number; human: boolean } | null;
  arriving: number;
  status?: string;
  serif: string;
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

export function drawChamber(ctx: CanvasRenderingContext2D, v: View, sc: ChamberScene): Shown[] {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, v.w, v.h);
  const shown: Shown[] = [];
  const P = (p: V3) => project(v, p);
  const fr = sc.place.frame;
  const C = fr.p;
  const R = chamberRadius(sc.ways, C);
  const r = rightOf(fr);
  const dot1 = (x: number, y: number, size: number, a: number, col = INK) => {
    if (a < 0.01) return;
    ctx.fillStyle = `rgba(${col},${a})`;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  };
  const mouths = sc.ways.map((w) => ({ w, d: norm(sub(w.pos, C)), a: mouthOf(w.strength) * (w.id === sc.faced ? 1.12 : 1) }));
  const inside = sc.travel ? Math.min(1, Math.max(0, (sc.travel.t - 0.55) / 0.45)) : 1;

  // the passage you are travelling: its rings around you, streaming past, turning as it turns
  if (sc.travel) {
    const { path, t, human } = sc.travel;
    for (let s = t + 0.01; s <= 1.0001; s += 0.025) {
      const c = path(Math.min(1, s));
      const ahead = path(Math.min(1, s + 0.01));
      const tan = len(sub(ahead, c)) > 1e-6 ? norm(sub(ahead, c)) : fr.f;
      const [e1, e2] = across(tan);
      const rr = 0.34;
      // crossing into a person's work: the passage turns to rose thread partway along
      const col = human && s > 0.45 ? ROSE : INK;
      const fade = Math.min(1, (s - t) * 6) * (1 - 0.6 * Math.max(0, s - t - 0.4));
      for (let k = 0; k < 28; k++) {
        const th = (k / 28) * Math.PI * 2;
        const q = P(add(c, add(scale(e1, Math.cos(th) * rr), scale(e2, Math.sin(th) * rr))));
        if (q) dot1(q[0], q[1], Math.max(1, Math.min(3, 0.012 * q[2])), 0.35 * fade, col);
      }
    }
  }

  // the chamber's walls: rings of ink around you, with a hole wherever a way leads on
  for (let i = 1; i < 12; i++) {
    const th = (i / 12) * Math.PI;
    for (let j = 0; j < 40; j++) {
      const ph = (j / 40) * Math.PI * 2 + (i % 2 ? 0.08 : 0);
      const d = norm(add(scale(fr.f, Math.cos(th)), add(scale(r, Math.sin(th) * Math.cos(ph)), scale(fr.u, Math.sin(th) * Math.sin(ph)))));
      if (mouths.some((m) => Math.acos(Math.max(-1, Math.min(1, dot(d, m.d)))) < m.a * 1.15)) continue;
      const q = P(add(C, scale(d, R)));
      if (q) dot1(q[0], q[1], Math.max(1, Math.min(2.4, 0.01 * q[2])), 0.16 * inside);
    }
  }

  // every way on: its mouth in the wall, and the passage behind it running on to the next place
  for (const m of mouths) {
    const { w, d, a } = m;
    const faced = w.id === sc.faced;
    const col = w.human ? ROSE : INK;
    const known = sc.reveal(w.id);
    const [e1, e2] = across(d);
    const mouthAt = (th: number, grow = 1): V3 => add(C, scale(norm(add(scale(d, Math.cos(a * grow)), add(scale(e1, Math.sin(a * grow) * Math.cos(th)), scale(e2, Math.sin(a * grow) * Math.sin(th))))), R));
    // the passage: the path you would travel, rings square to it, fading into the distance
    const path = passageOf(fr, w.pos);
    const tubeR = R * Math.sin(a) * 0.9;
    let t0 = 0;
    for (let s = 0; s <= 1; s += 0.02) if (len(sub(path(s), C)) >= R) {
      t0 = s;
      break;
    }
    for (let s = t0; s <= 1; s += 0.05) {
      const c = path(s);
      const tan = norm(sub(path(Math.min(1, s + 0.01)), path(Math.max(0, s - 0.01))));
      const [p1, p2] = across(tan);
      const depth = (s - t0) / Math.max(0.05, 1 - t0);
      // a person's passage turns rose partway along, where it crosses into their work
      const ringCol = w.human && depth > 0.35 ? ROSE : INK;
      const alpha = (0.1 + 0.25 * w.strength) * (0.4 + 0.6 * known) * (1 - 0.7 * depth) * inside * (faced ? 1.5 : 1);
      for (let k = 0; k < 22; k++) {
        const th = (k / 22) * Math.PI * 2;
        const q = P(add(c, add(scale(p1, Math.cos(th) * tubeR), scale(p2, Math.sin(th) * tubeR))));
        if (q) dot1(q[0], q[1], Math.max(0.9, Math.min(2.2, 0.009 * q[2])), alpha, ringCol);
      }
    }
    // the mouth itself: a ring in the wall, lit in rose for a person's work, heavier when faced
    let cx = 0;
    let cy = 0;
    let n = 0;
    let top: [number, number] | null = null;
    for (let k = 0; k < 44; k++) {
      const th = (k / 44) * Math.PI * 2;
      const q = P(mouthAt(th));
      if (!q) continue;
      cx += q[0];
      cy += q[1];
      n++;
      if (!top || q[1] < top[1]) top = [q[0], q[1]];
      dot1(q[0], q[1], Math.max(1.1, Math.min(2.4, 0.012 * q[2])) * (faced ? 1.3 : 1), (0.35 + 0.4 * w.strength) * (faced ? 1.4 : 1) * inside, col);
    }
    if (w.human && n) {
      // rose light at the mouth of a person's passage
      const g = ctx.createRadialGradient(cx / n, cy / n, 1, cx / n, cy / n, 40);
      g.addColorStop(0, `rgba(${ROSE},${0.12 * inside})`);
      g.addColorStop(1, `rgba(${ROSE},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(cx / n - 40, cy / n - 40, 80, 80);
    }
    if (!n) continue;
    shown.push({ opening: w.opening ?? ({ strand: { to: w.id } } as Opening), x: cx / n, y: cy / n, r: 34 });
    // only the way you face is named: its name over the mouth once you have faced it a beat, then why
    if (faced && top && known > 0.35 && inside > 0.9) {
      const nameA = Math.min(1, (known - 0.35) / 0.25);
      ctx.textAlign = 'center';
      ctx.font = `italic 18px ${sc.serif}`;
      const label = w.back ? `back to ${w.title}` : w.title;
      const tx = Math.max(16 + ctx.measureText(label).width / 2, Math.min(v.w - 16 - ctx.measureText(label).width / 2, top[0]));
      let ty = Math.max(90, top[1] - 16);
      if (w.why && known > 0.85 && !w.back) {
        ctx.font = `italic 13px ${sc.serif}`;
        const lines = wrap(ctx, w.why, Math.min(420, v.w - 32));
        ty = Math.max(90 + lines.length * 16, ty);
        lines.forEach((l, i) => text(ctx, l, Math.max(16 + ctx.measureText(l).width / 2, Math.min(v.w - 16 - ctx.measureText(l).width / 2, tx)), ty - (lines.length - i) * 16 + 2, 0.62));
        ty -= lines.length * 16 + 12;
      }
      ctx.font = `italic 18px ${sc.serif}`;
      text(ctx, label, tx, ty, 0.9 * nameA);
      ctx.textAlign = 'left';
    }
  }

  // where you are: named in the caption, with the one line the source gives
  const capA = sc.travel ? Math.max(0, (sc.travel.t - 0.75) / 0.25) : 1;
  if (capA > 0.02) {
    const capY = v.h - (v.w < 600 ? 250 : 176);
    ctx.textAlign = 'center';
    ctx.font = `italic ${Math.round(Math.max(22, Math.min(30, v.w / 28)))}px ${sc.serif}`;
    text(ctx, sc.place.title, v.cx, capY, 0.9 * capA);
    const line = sc.status ?? sc.place.line;
    if (line) {
      ctx.font = `italic 15px ${sc.serif}`;
      wrap(ctx, line, Math.min(460, v.w - 48)).forEach((l, i) => text(ctx, l, v.cx, capY + 26 + i * 20, 0.62 * capA));
    }
    ctx.textAlign = 'left';
  }
  return shown;
}

/** The camera while travelling a passage: moving along it, looking the way it runs. */
export function travelCam(from: Frame, to: Frame, path: (t: number) => V3, t: number) {
  const fr = blend(from, to, t, path);
  return { eye: fr.p, f: fr.f, u: fr.u };
}
