// Canvas2D renderer for the Shadow Field.
//
// Semantic level of detail is driven by one number per node: R, its radius in
// screen pixels. The same node renders as a dot, an ink drop, a filament
// constellation, and finally an environment, with every representation
// cross-fading continuously as R changes. Nothing here scales a bitmap.

import { IdeaNode, LifeEvent, Media, SEAL_MARGIN, lastActivity, rippleReach } from './model';
import { Strand, topologyOf, strandAt, strandU } from './layout';
import { ScreenTransform } from './camera';
import { spatialIndex } from './spatial';
import { getImage, getVideo, startedByHand } from './media';
import { getPeaks } from './audio';
import { PLOT, Plot } from './plots';
import { clamp, hash01, noise1, smoothstep } from './rng';

export const PAPER = '#fbfaf7';
export const INK = '30,28,36';
export const ROSE = '176,118,146';

export interface Lens {
  /** Viewer closeness p in [0, 1] for a top-level Twin. */
  closeness(top: IdeaNode): number;
  visited: Set<string>;
  followed: Set<string>;
}

export interface Hit {
  kind: 'node' | 'event';
  node: IdeaNode;
  path: IdeaNode[];
  ev?: LifeEvent;
  sealed?: boolean;
  x: number;
  y: number;
  r: number;
  /** On-screen radius of the node itself. */
  size: number;
}

export interface RenderState {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  M: number;
  time: number;
  lens: Lens;
  hits: Hit[];
  serif: string;
  mono: string;
  hoverId: string | null;
  hoverEv: LifeEvent | null;
  now: number;
  /** When replaying, the moment being shown (epoch ms); null = the present. */
  cut: number | null;
  /** Labels are queued during the pass and placed afterwards by priority. */
  labels?: QueuedLabel[];
  /** Wall-clock seconds (keeps running even when motion is reduced). */
  clock?: number;
  /** Change ripples: node id -> start (clock seconds). See pulseChain(). */
  pulses?: Map<string, number>;
  /** prefers-reduced-motion: no ripples (time is also frozen by the caller). */
  reduced?: boolean;
  /** The song currently playing, if any: progress 0..1 and live loudness 0..1. */
  audio?: { src: string; progress: number; level: number } | null;
  /** Held plots on the Canvas (3 x 3 blocks of grid cells). */
  plots?: Plot[];
  /** 3D objects in view this frame, for the DOM overlay. */
  models?: { src: string; x: number; y: number; w: number; h: number; alpha: number }[];
  /** Batched sub-pixel marks, by alpha bucket. */
  dots?: (Path2D | undefined)[];
  /** Films drawn this frame (they play; the rest rest). */
  videos?: Set<string>;
}

const DOT_BUCKETS = 12;

/** Seconds a change takes to travel one strand. */
export const PULSE_EDGE = 1.5;

/**
 * Schedule a change to ripple outward from the changed node (last in path)
 * through every idea that contains it, one strand after another, ending as a
 * ring on the Canvas.
 */
export function pulseChain(pulses: Map<string, number>, path: IdeaNode[], now: number) {
  let t = now;
  for (let i = path.length - 1; i >= 1; i--) {
    pulses.set(path[i].id, t);
    t += PULSE_EDGE * 0.85;
  }
  return t; // when the ring reaches the Canvas
}

interface QueuedLabel {
  node: IdeaNode;
  x: number;
  y: number;
  cs: number;
  alpha: number;
  sealed: boolean;
}

function onScreen(st: RenderState, x: number, y: number, r: number) {
  return x + r > 0 && y + r > 0 && x - r < st.w && y - r < st.h;
}

function lifeOf(node: IdeaNode) {
  if (node.state === 'abandoned') return 0.38;
  if (node.state === 'dormant') return 0.6;
  return 1;
}

// ---------------------------------------------------------------------------
// Background lattice. Each frame carries its own coordinate grid, so the grid
// of an inner world emerges as its parent's grid fades.

function drawLattice(st: RenderState, T: ScreenTransform, alpha: number, extent: number, clipToDisk: boolean) {
  if (alpha < 0.004) return;
  const { ctx } = st;
  // log-periodic: whichever powers of 1/8 are near a comfortable spacing
  const kTop = Math.floor(Math.log(T.s / 1600) / Math.log(8));
  for (let k = Math.max(1, kTop); k <= kTop + 3; k++) {
    const g = Math.pow(8, -k);
    const gs = g * T.s;
    if (gs < 18) continue;
    const la = alpha * smoothstep(18, 60, gs) * (1 - smoothstep(420, 1600, gs));
    if (la < 0.004) continue;
    const x0 = Math.max(-extent, (0 - T.ox) / T.s);
    const x1 = Math.min(extent, (st.w - T.ox) / T.s);
    const y0 = Math.max(-extent, (0 - T.oy) / T.s);
    const y1 = Math.min(extent, (st.h - T.oy) / T.s);
    if (x1 < x0 || y1 < y0) continue;
    const arm = clamp(gs * 0.035, 1.5, 3.5);
    ctx.fillStyle = `rgba(${INK},1)`;
    for (let gx = Math.ceil(x0 / g) * g; gx <= x1; gx += g) {
      for (let gy = Math.ceil(y0 / g) * g; gy <= y1; gy += g) {
        let a = la;
        if (clipToDisk) {
          const d = Math.hypot(gx, gy);
          if (d > 1.15) continue;
          a *= 1 - smoothstep(0.75, 1.15, d);
        }
        if (a < 0.003) continue;
        const sx = T.ox + gx * T.s;
        const sy = T.oy + gy * T.s;
        ctx.globalAlpha = a;
        ctx.fillRect(sx - arm, sy - 0.25, arm * 2, 0.5);
        ctx.fillRect(sx - 0.25, sy - arm, 0.5, arm * 2);
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// The mark: dot -> ink drop -> diffusing wash.

export function drawMark(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number, sealed: boolean) {
  const { ctx, time } = st;
  const R = T.s;
  const x = T.ox;
  const y = T.oy;
  const life = lifeOf(node);
  const seed = node.seed;

  if (R < 1.6) {
    const a = alpha * (0.35 + 0.45 * life) * smoothstep(0.02, 0.6, R + 0.3);
    const size = Math.max(0.7, R * 0.9);
    ctx.fillStyle = `rgba(${INK},${a})`;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }

  const dropA = alpha * smoothstep(1.0, 5, R) * (sealed ? 1 : 1 - smoothstep(40, 190, R));
  if (dropA > 0.004) {
    const breathe = node.state === 'alive' ? 1 + 0.035 * Math.sin(time * 0.8 + (seed % 97)) : 1;
    const rb = Math.min(R * (sealed ? 0.3 : 0.42), sealed ? 60 : 1e9) * breathe;
    ctx.beginPath();
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + 0.12 * noise1(a * 1.6 + time * 0.05, seed) + 0.05 * noise1(a * 4.3 - time * 0.07, seed + 3);
      const px = x + Math.cos(a) * rb * wob;
      const py = y + Math.sin(a) * rb * wob;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    const g = ctx.createRadialGradient(x, y, 0, x, y, rb * 1.15);
    const core = (0.55 + 0.35 * life) * dropA;
    g.addColorStop(0, `rgba(${INK},${core})`);
    g.addColorStop(0.28, `rgba(${INK},${core * 0.62})`);
    g.addColorStop(0.7, `rgba(${INK},${core * 0.16})`);
    g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // The origin of the idea remains a concentrated point at every depth.
  const coreA = alpha * smoothstep(4, 40, R) * (0.5 + 0.5 * life);
  if (coreA > 0.01) {
    const cr = clamp(R * 0.012, 1.1, 3.2);
    ctx.fillStyle = `rgba(${INK},${coreA})`;
    ctx.beginPath();
    ctx.arc(x, y, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  if (sealed && R > 6) {
    // a closed seam: it exists, it is not open to you yet
    const ra = alpha * smoothstep(6, 30, R) * 0.35;
    ctx.strokeStyle = `rgba(${INK},${ra})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, Math.min(R * 0.46, 70), 0, Math.PI * 2);
    ctx.stroke();
  }

  // a change arriving from inside: one clear ring the viewer can notice
  const arrived = st.pulses?.get(node.id);
  if (arrived !== undefined && st.clock !== undefined) {
    const q = (st.clock - arrived) / 2.4;
    if (q >= 0 && q <= 1) {
      ctx.strokeStyle = `rgba(${ROSE},${alpha * 0.7 * (1 - q)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(R * 0.5, 2) + q * (40 + R * 0.8), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // recent activity leaves a slow ripple: evidence that something is alive here
  const quietDays = (st.now - lastActivity(node)) / 86400000;
  if (!st.reduced && !sealed && R > 0.5 && R < 40 && quietDays < 21) {
    const period = 7;
    const phase = ((time + (seed % 13) * 0.53) % period) / period;
    const liveness = 1 - quietDays / 21;
    const rr = Math.max(R * 0.5, 1.5) + phase * (16 + R * 0.6);
    const ra = alpha * 0.16 * liveness * Math.pow(1 - phase, 2) * (1 - smoothstep(10, 40, R));
    if (ra > 0.004) {
      ctx.strokeStyle = `rgba(${INK},${ra})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const followed = st.lens.followed.has(node.id);
  const visited = st.lens.visited.has(node.id);
  if ((followed || visited) && R > 0.3) {
    const ringR = clamp(R * 0.6, 4, 90);
    const ra = alpha * (followed ? 0.5 : 0.22) * (1 - smoothstep(60, 300, R));
    if (ra > 0.01) {
      ctx.fillStyle = followed ? `rgba(${ROSE},${ra})` : `rgba(${INK},${ra})`;
      const dots = followed ? 28 : 14;
      for (let i = 0; i < dots; i++) {
        const a = (i / dots) * Math.PI * 2 + time * 0.02;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * ringR, y + Math.sin(a) * ringR, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawWash(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number) {
  const R = T.s;
  const a = alpha * 0.55 * smoothstep(90, 900, R);
  if (a < 0.004) return;
  const { ctx } = st;
  const warm = hash01(node.seed, 99) > 0.5;
  const tint = warm ? '238,231,219' : '233,229,236';
  const rr = R * 1.2;
  const g = ctx.createRadialGradient(T.ox, T.oy, 0, T.ox, T.oy, rr);
  g.addColorStop(0, `rgba(${tint},${a})`);
  g.addColorStop(0.55, `rgba(${tint},${a * 0.7})`);
  g.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(Math.max(0, T.ox - rr), Math.max(0, T.oy - rr), Math.min(st.w, rr * 2), Math.min(st.h, rr * 2));
}

// ---------------------------------------------------------------------------
// Filaments.

function inGap(s: Strand, u: number) {
  for (const [a, b] of s.gaps) if (u > a && u < b) return true;
  return false;
}

function drawStrand(st: RenderState, s: Strand, T: ScreenTransform, alpha: number, path: IdeaNode[]) {
  if (alpha < 0.006) return;
  const { ctx, time } = st;
  const R = T.s;
  const Ls = s.len * R;
  if (Ls < 4) return;

  // visible parameter range from the coarse samples
  const n = s.pts.length / 2;
  let lo = n;
  let hi = -1;
  const pad = 40;
  for (let i = 0; i < n; i++) {
    const sx = T.ox + s.pts[i * 2] * R;
    const sy = T.oy + s.pts[i * 2 + 1] * R;
    if (sx > -pad && sy > -pad && sx < st.w + pad && sy < st.h + pad) {
      if (i < lo) lo = i;
      if (i > hi) hi = i;
    }
  }
  if (hi < 0) return;
  const uLo = s.cum[Math.max(0, lo - 1)] / s.len;
  const uHi = s.cum[Math.min(n - 1, hi + 1)] / s.len;

  const gap = 2.1 + (1 - s.coherence) * 8;
  const lf = Math.log2(Ls / gap);
  const L = clamp(Math.floor(lf), 1, 14);
  const frac = clamp(lf - L, 0, 1);
  const N = 1 << L;
  const dotR = clamp(0.38 + R / 2200, 0.42, 1.25) * (0.85 + 0.35 * clamp(s.weight / 14, 0, 1));
  const breatheAmp = 0.0028 * R * (0.4 + 0.6 * (1 - s.coherence));
  const jitterPx = (1 - s.coherence) * gap * 0.45;

  const uCut = st.cut === null ? 1 : strandU(s, st.cut);
  if (st.cut !== null && st.cut < s.t0) return;
  const i0 = Math.max(0, Math.floor(uLo * N) - 1);
  const i1 = Math.min(Math.floor(uCut * N), Math.ceil(uHi * N) + 1);
  const budget = 5000;
  const step = Math.max(1, Math.ceil((i1 - i0) / budget));

  const solid = new Path2D();
  const faint = new Path2D();
  for (let i = i0; i <= i1; i += step) {
    const u = i / N;
    const fresh = (i & 1) === 1 && L > 1;
    const gapNow = inGap(s, u);
    if (gapNow && i % 16 !== 0) continue;
    let size = dotR * (gapNow ? 0.6 : 1);
    if (s.taper > 0 && u > 1 - s.taper) size *= Math.pow((1 - u) / s.taper, 1.3);
    if (u < 0.04) size *= 0.6 + u * 10;
    if (size < 0.12) continue;
    const [px, py, tx, ty] = strandAt(s, u);
    const wob = Math.sin(time * 0.55 + u * 9 + (s.seed % 31)) * breatheAmp;
    const jit = (hash01(s.seed, i * 7 + L) - 0.5) * 2 * jitterPx;
    const sx = T.ox + px * R - ty * (wob + jit);
    const sy = T.oy + py * R + tx * (wob + jit);
    if (sx < -4 || sy < -4 || sx > st.w + 4 || sy > st.h + 4) continue;
    const p = fresh ? faint : solid;
    p.moveTo(sx + size, sy);
    p.arc(sx, sy, size, 0, Math.PI * 2);
  }
  ctx.fillStyle = `rgba(${INK},${alpha * 0.78})`;
  ctx.fill(solid);
  ctx.fillStyle = `rgba(${INK},${alpha * 0.78 * frac})`;
  ctx.fill(faint);

  // heartbeat: light moves outward along a thread in proportion to how alive it
  // is. It proves activity without saying anything about the content.
  if (s.child && st.clock !== undefined && !st.reduced && s.child.state !== 'abandoned') {
    const quietDays = Math.max(0, (st.now - lastActivity(s.child)) / 86400000);
    const life = Math.exp(-quietDays / 21);
    if (life > 0.05) {
      const period = 3.5 + (s.seed % 7) * 0.6 + quietDays * 0.15;
      const ph = ((st.clock + (s.seed % 97) * 0.37) % period) / period;
      const head = ph * 1.25;
      if (head <= 1.1) {
        const g = new Path2D();
        for (let k = 0; k < 7; k++) {
          const u = head - k * 0.018;
          if (u < 0 || u > 1) continue;
          const [px, py] = strandAt(s, u);
          const sx = T.ox + px * R;
          const sy = T.oy + py * R;
          const r0 = dotR * (1.9 - k * 0.18);
          g.moveTo(sx + r0, sy);
          g.arc(sx, sy, r0, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(${INK},${alpha * 0.55 * life})`;
        ctx.fill(g);
      }
    }
  }

  // a change travelling inward along this strand, from the thought to its parent
  const pStart = s.child ? st.pulses?.get(s.child.id) : undefined;
  if (pStart !== undefined && st.clock !== undefined) {
    const prog = (st.clock - pStart) / PULSE_EDGE;
    if (prog >= 0 && prog <= 1) {
      const head = 1 - prog;
      const g = new Path2D();
      for (let k = 0; k < 9; k++) {
        const u = head + k * 0.012;
        if (u < 0 || u > 1) continue;
        const [px, py] = strandAt(s, u);
        const sx = T.ox + px * R;
        const sy = T.oy + py * R;
        const r0 = dotR * (2.4 - k * 0.2);
        g.moveTo(sx + r0, sy);
        g.arc(sx, sy, r0, 0, Math.PI * 2);
      }
      ctx.fillStyle = `rgba(${ROSE},${Math.min(1, alpha * 3) * 0.75 * Math.sin(Math.PI * prog) + 0.15})`;
      ctx.fill(g);
    }
  }

  // pruned directions: short twigs that taper into nothing
  const twigA = alpha * smoothstep(140, 420, R);
  if (twigA > 0.01) {
    ctx.fillStyle = `rgba(${INK},${twigA * 0.6})`;
    for (const tw of s.twigs) {
      if (st.cut !== null && tw.ev.t > st.cut) continue;
      const [bx, by, tx, ty] = strandAt(s, tw.u);
      const ang = Math.atan2(ty, tx) + tw.side * 0.95;
      const segs = 18;
      const tp = new Path2D();
      for (let k = 1; k <= segs; k++) {
        const f = k / segs;
        const curl = tw.side * f * f * 0.6;
        const d = tw.len * f;
        const px = bx + Math.cos(ang + curl) * d;
        const py = by + Math.sin(ang + curl) * d;
        const sx = T.ox + px * R;
        const sy = T.oy + py * R;
        const sz = dotR * (1 - f) * 0.9 + 0.1;
        if (hash01(s.seed + k, Math.floor(tw.u * 1000)) < f * 0.55) continue;
        tp.moveTo(sx + sz, sy);
        tp.arc(sx, sy, sz, 0, Math.PI * 2);
      }
      ctx.fill(tp);
    }
  }

  // moments in the history of this strand
  const markA = alpha * smoothstep(260, 700, R);
  if (markA > 0.01) {
    for (const m of s.marks) {
      if (st.cut !== null && m.ev.t > st.cut) continue;
      const [px, py, tx, ty] = strandAt(s, m.u);
      const sx = T.ox + px * R;
      const sy = T.oy + py * R;
      if (!onScreen(st, sx, sy, 8)) continue;
      const k = m.ev.kind;
      const hovered = st.hoverEv === m.ev;
      const a = markA * (hovered ? 1 : 0.7);
      ctx.strokeStyle = `rgba(${INK},${a})`;
      ctx.fillStyle = `rgba(${INK},${a})`;
      ctx.lineWidth = 0.7;
      if (k === 'experiment') {
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (k === 'evidence') {
        ctx.beginPath();
        ctx.moveTo(sx, sy - 2.6);
        ctx.lineTo(sx + 2.2, sy);
        ctx.lineTo(sx, sy + 2.6);
        ctx.lineTo(sx - 2.2, sy);
        ctx.closePath();
        ctx.fill();
      } else if (k === 'revival' || k === 'begin') {
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (k === 'failure') {
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy - 2);
        ctx.lineTo(sx + 2, sy + 2);
        ctx.moveTo(sx + 2, sy - 2);
        ctx.lineTo(sx - 2, sy + 2);
        ctx.stroke();
      } else if (k === 'revision' || k === 'prune') {
        if (R < 900) continue;
        ctx.beginPath();
        ctx.moveTo(sx - ty * 2.4, sy + tx * 2.4);
        ctx.lineTo(sx + ty * 2.4, sy - tx * 2.4);
        ctx.stroke();
      } else if (k === 'dormant') {
        ctx.beginPath();
        ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (s.child) {
        st.hits.push({ kind: 'event', node: s.child, path: [...path, s.child], ev: m.ev, x: sx, y: sy, r: 7, size: 0 });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Text inside leaves (their native representation).

export function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > width && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

export function drawArtifact(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number) {
  const art = node.artifact;
  if (!art) return;
  const R = T.s;
  const { ctx } = st;
  const fpx = R * (art.type === 'story' ? 0.03 : 0.032);
  const a = alpha * smoothstep(8, 14, fpx) * (1 - smoothstep(70, 150, fpx));
  if (a < 0.01) return;
  ctx.textBaseline = 'alphabetic';
  if (art.type === 'text') {
    ctx.font = `italic ${fpx}px ${st.serif}`;
    ctx.fillStyle = `rgba(${INK},${a * 0.82})`;
    const lines = wrap(ctx, art.body, R * 1.05);
    const lh = fpx * 1.35;
    let y = T.oy - R * 0.2 - (lines.length * lh) / 2 + fpx * 0.8;
    ctx.textAlign = 'center';
    for (const line of lines) {
      if (y > -lh && y < st.h + lh) ctx.fillText(line, T.ox, y);
      y += lh;
    }
    ctx.textAlign = 'left';
    return;
  }
  // a session told as what happened, in order; the time is a quiet margin
  const width = R * 1.05;
  const x = T.ox - width / 2;
  const indent = fpx * 4.2;
  const lh = fpx * 1.3;
  ctx.font = `italic ${fpx}px ${st.serif}`;
  const blocks = art.lines.map((l) => wrap(ctx, l.text, width - indent));
  const total = blocks.reduce((n, b) => n + b.length * lh + fpx * 0.55, 0);
  let y = T.oy - R * 0.34 - total / 2 + fpx;
  art.lines.forEach((l, i) => {
    const time = new Date(l.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    if (y > -lh && y < st.h + lh) {
      ctx.font = `${fpx * 0.52}px ${st.mono}`;
      ctx.fillStyle = `rgba(${INK},${a * 0.38})`;
      ctx.fillText(time, x, y - fpx * 0.05);
    }
    ctx.font = `italic ${fpx}px ${st.serif}`;
    ctx.fillStyle = `rgba(${INK},${a * 0.8})`;
    for (const line of blocks[i]) {
      if (y > -lh && y < st.h + lh) ctx.fillText(line, x + indent, y);
      y += lh;
    }
    y += fpx * 0.55;
  });
}

// ---------------------------------------------------------------------------
// Content inside an idea: it resolves from a near-white shadow of itself into
// the real thing as the viewer approaches. Closeness (following, owning) lets
// it resolve sooner.

function drawMedia(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number, p: number) {
  if (!node.media?.length || alpha < 0.01) return;
  const { ctx } = st;
  const R = T.s;
  for (const m of node.media) {
    if (m.kind === 'image') {
      const W = m.w * R;
      const H = W * m.aspect;
      if (W < 3) continue;
      const cx = T.ox + m.x * R;
      const cy = T.oy + m.y * R;
      const x0 = cx - W / 2;
      const y0 = cy - H / 2;
      if (x0 > st.w || y0 > st.h || x0 + W < 0 || y0 + H < 0) continue;
      const a = alpha * smoothstep(3, 30, W);
      // how resolved: size on screen, eased by the viewer's closeness
      const reveal = smoothstep(30, 520 * (1.35 - 0.6 * p), W);
      const loaded = getImage(m.src);
      if (!loaded) {
        ctx.fillStyle = `rgba(${INK},${a * 0.05})`;
        ctx.fillRect(x0, y0, W, H);
        continue;
      }
      const maxLevel = loaded.mips.length - 1;
      const blur = (1 - reveal) * Math.min(5, maxLevel);
      // never sharper than the screen needs
      const need = Math.max(0, Math.floor(Math.log2(loaded.img.naturalWidth / Math.max(W, 1))));
      const lf = Math.min(maxLevel, Math.max(blur, need));
      const l0 = Math.floor(lf);
      const l1 = Math.min(maxLevel, l0 + 1);
      const frac = lf - l0;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = a;
      ctx.drawImage(loaded.mips[l0], x0, y0, W, H);
      if (frac > 0.01 && l1 !== l0) {
        ctx.globalAlpha = a * frac;
        ctx.drawImage(loaded.mips[l1], x0, y0, W, H);
      }
      // the shadow: far away, nearly white paper with only the structure left
      const veil = 0.93 * Math.pow(1 - reveal, 1.1);
      if (veil > 0.01) {
        ctx.globalAlpha = a * veil;
        ctx.fillStyle = PAPER;
        ctx.fillRect(x0 - 1, y0 - 1, W + 2, H + 2);
      }
      ctx.restore();
      if (m.caption && reveal > 0.6) {
        const fs = clamp(W * 0.028, 10, 18);
        ctx.font = `italic ${fs}px ${st.serif}`;
        ctx.fillStyle = `rgba(${INK},${a * 0.6 * smoothstep(0.6, 0.9, reveal)})`;
        ctx.fillText(m.caption, x0, y0 + H + fs * 1.4);
      }
    } else if (m.kind === 'video') {
      const W = m.w * R;
      drawVideo(st, m, T, alpha, smoothstep(30, 520 * (1.35 - 0.6 * p), W));
    } else if (m.kind === 'audio') {
      drawAudioRing(st, m.src, T, alpha);
    } else if (m.kind === 'model') {
      const W = m.w * R;
      const H = W * m.aspect;
      const cx = T.ox + m.x * R;
      const cy = T.oy + m.y * R;
      const reveal = smoothstep(160, 420, W);
      // far away: a turning ring of ink hints that there is an object here
      const ringA = alpha * smoothstep(20, 80, W) * (1 - reveal);
      if (ringA > 0.01) {
        const t = st.reduced ? 0 : st.clock ?? 0;
        ctx.fillStyle = `rgba(${INK},${ringA * 0.5})`;
        const n = 36;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + t * 0.4;
          const rx = W * 0.32;
          const ry = H * 0.32 * (0.35 + 0.25 * Math.sin(t * 0.3));
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (reveal > 0.01) (st.models ??= []).push({ src: m.src, x: cx - W / 2, y: cy - H / 2, w: W, h: H, alpha: alpha * reveal });
    } else {
      drawSketch(st, m.strokes, T, alpha * smoothstep(25, 110, R));
    }
  }
}

/**
 * A film inside an idea. Far away its poster stands in, pale as a shadow; near,
 * the film itself plays (silently until tapped), looping within [from, to].
 */
export function drawVideo(
  st: RenderState,
  m: Extract<Media, { kind: 'video' }>,
  T: ScreenTransform,
  alpha: number,
  reveal: number
) {
  const { ctx } = st;
  const W = m.w * T.s;
  const H = W * m.aspect;
  if (W < 3 || alpha < 0.01) return;
  const x0 = T.ox + m.x * T.s - W / 2;
  const y0 = T.oy + m.y * T.s - H / 2;
  if (x0 > st.w || y0 > st.h || x0 + W < 0 || y0 + H < 0) return;
  const a = alpha * smoothstep(3, 30, W);
  // a person seen far ahead is already moving (a pale print); a drawing waits until near.
  // With reduced motion, films rest until the viewer starts one.
  const wants = reveal > (m.round ? 0.02 : 0.35) && (!st.reduced || startedByHand.has(m.src));
  const live = wants ? getVideo(m.src, m.webm) : null;
  ctx.save();
  // far away it is a pale print of itself, darkening into the real thing as you near
  ctx.globalAlpha = a * (0.1 + 0.9 * Math.pow(reveal, 1.1));
  if (live) {
    (st.videos ??= new Set()).add(m.src);
    const from = m.from ?? 0;
    if (live.readyState >= 1 && (live.currentTime < from || (m.to !== undefined && live.currentTime > m.to) || live.ended)) {
      live.currentTime = from;
    }
  }
  const cx = x0 + W / 2;
  const cy = y0 + H / 2;
  const rx = W / 2;
  const ry = Math.min(H / 2, rx * 1.45);
  if (m.round) {
    // seen through an ink drop: nothing outside the oval is touched
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
  } else {
    // a clean sheet under a drawing near you, so what is behind it does not show through
    const ground = a * smoothstep(0.4, 0.9, reveal);
    if (ground > 0.01) {
      ctx.globalAlpha = ground;
      ctx.fillStyle = PAPER;
      ctx.fillRect(x0, y0, W, H);
      ctx.globalAlpha = a * (0.1 + 0.9 * Math.pow(reveal, 1.1));
    }
  }
  // printed onto the paper: its whites become the page, its darks become ink
  ctx.globalCompositeOperation = 'multiply';
  if (live && live.readyState >= 2) ctx.drawImage(live, x0, y0, W, H);
  else {
    const poster = getImage(m.poster);
    if (poster) {
      const need = Math.max(0, Math.floor(Math.log2(poster.img.naturalWidth / Math.max(W, 1))));
      const lvl = Math.min(poster.mips.length - 1, Math.max(Math.round((1 - reveal) * 4), need));
      ctx.drawImage(poster.mips[lvl], x0, y0, W, H);
    } else {
      ctx.fillStyle = `rgba(${INK},0.05)`;
      ctx.fillRect(x0, y0, W, H);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  if (!m.round) {
    // its edges soak into the paper, so no frame is ever drawn around it
    ctx.globalAlpha = a;
    const f = Math.min(W, H) * 0.12;
    for (const [gx0, gy0, gx1, gy1, rx0, ry0, rw, rh] of [
      [x0, 0, x0 + f, 0, x0, y0, f, H],
      [x0 + W, 0, x0 + W - f, 0, x0 + W - f, y0, f, H],
      [0, y0, 0, y0 + f, x0, y0, W, f],
      [0, y0 + H, 0, y0 + H - f, x0, y0 + H - f, W, f],
    ]) {
      const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
      g.addColorStop(0, 'rgba(251,250,247,1)');
      g.addColorStop(1, 'rgba(251,250,247,0)');
      ctx.fillStyle = g;
      ctx.fillRect(rx0, ry0, rw, rh);
    }
  }
  if (m.round) {
    // seen through an ink drop: the edge dissolves into the paper, the corners are page
    ctx.globalAlpha = a;
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, rx * 0.58, 0, 0, rx * 0.97);
    g.addColorStop(0, 'rgba(251,250,247,0)');
    g.addColorStop(1, 'rgba(251,250,247,1)');
    ctx.fillStyle = g;
    ctx.fillRect(-rx - 2, -rx - 2, rx * 2 + 4, rx * 2 + 4);
  }
  ctx.restore();
}

/**
 * An idea's real events as a small constellation, in the order they happened,
 * with a light sweeping through them: how much and how often, never what.
 */
export function drawRhythm(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number) {
  const evs = node.events.filter((e) => e.kind !== 'dormant' && e.kind !== 'revival');
  if (!evs.length) return;
  const R = T.s;
  const a = alpha * smoothstep(60, 220, R);
  if (a < 0.01) return;
  const { ctx } = st;
  const n = evs.length;
  const clock = st.reduced ? 0 : st.clock ?? 0;
  const sweep = (clock * (1.2 + 6 / (n + 2))) % (n + 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const size = clamp(R / 260, 0.9, 3.2);
  for (let i = 0; i < n; i++) {
    const rho = 0.08 + 0.46 * Math.sqrt((i + 1) / n);
    const ang = i * golden + (node.seed % 360) * (Math.PI / 180);
    const x = T.ox + Math.cos(ang) * rho * R;
    const y = T.oy - 0.12 * R + Math.sin(ang) * rho * R;
    if (x < -10 || y < -10 || x > st.w + 10 || y > st.h + 10) continue;
    const d = Math.abs(sweep - i);
    const lit = Math.exp(-d * d * 0.8);
    const k = evs[i].kind;
    const big = k === 'begin' || k === 'evidence' || k === 'experiment' ? 1.5 : 1;
    ctx.fillStyle = `rgba(${INK},${a * (0.28 + 0.62 * lit)})`;
    ctx.beginPath();
    ctx.arc(x, y, size * big * (1 + 0.5 * lit), 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A song as a ring of dotted ink: its waveform wrapped around the idea like a
 * record. While it plays, a playhead sweeps the ring and the ring breathes
 * with the music.
 */
export function drawAudioRing(st: RenderState, src: string, T: ScreenTransform, alpha: number) {
  const R = T.s;
  const a = alpha * smoothstep(30, 140, R);
  if (a < 0.01) return;
  const { ctx } = st;
  const playing = st.audio && st.audio.src === src ? st.audio : null;
  // the waveform is read only for the song in front of you (or playing): passing
  // the others never downloads them
  const pk = R > 0.45 * st.M || playing ? getPeaks(src) : null;
  const n = pk ? pk.length : 90;
  const clock = st.reduced ? 0 : st.clock ?? 0;
  const breathe = playing ? 1 + 0.06 * playing.level : 1 + 0.01 * Math.sin(clock * 0.8);
  const base = 0.42 * R * breathe;
  const dot = clamp(R / 420, 0.7, 2.4);
  const head = playing ? playing.progress : -1;
  // two fills in all: what has been heard (rose), and the rest (ink)
  const heard = new Path2D();
  const rest = new Path2D();
  for (let i = 0; i < n; i++) {
    const f = i / n;
    const ang = -Math.PI / 2 + f * Math.PI * 2;
    const amp = pk ? pk[i] : 0.15;
    const passed = playing && f <= head;
    const steps = Math.max(1, Math.round(1 + amp * 6));
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const path = passed ? heard : rest;
    for (let k = 0; k < steps; k++) {
      const rr = base + (k - (steps - 1) / 2) * dot * 2.6;
      const x = T.ox + cos * rr;
      const y = T.oy + sin * rr;
      if (x < -8 || y < -8 || x > st.w + 8 || y > st.h + 8) continue;
      path.moveTo(x + dot, y);
      path.arc(x, y, dot, 0, Math.PI * 2);
    }
  }
  ctx.fillStyle = `rgba(${INK},${a * (pk ? 0.55 : 0.22)})`;
  ctx.fill(rest);
  if (playing) {
    ctx.fillStyle = `rgba(${ROSE},${a * 0.75})`;
    ctx.fill(heard);
    const ang = -Math.PI / 2 + head * Math.PI * 2;
    ctx.fillStyle = `rgba(${ROSE},${a})`;
    ctx.beginPath();
    ctx.arc(T.ox + Math.cos(ang) * base, T.oy + Math.sin(ang) * base, dot * 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (R > 160) {
    // a quiet play mark at the centre: tap to hear it
    const s2 = clamp(R * 0.035, 6, 16);
    ctx.fillStyle = `rgba(${INK},${a * 0.45})`;
    ctx.beginPath();
    ctx.moveTo(T.ox - s2 * 0.45, T.oy - 0.12 * R - s2 * 0.6);
    ctx.lineTo(T.ox + s2 * 0.65, T.oy - 0.12 * R);
    ctx.lineTo(T.ox - s2 * 0.45, T.oy - 0.12 * R + s2 * 0.6);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Words set in dotted ink: the text is drawn once at 96px on a hidden canvas
 * and sampled on a fine grid (odd rows offset), giving points in units of the
 * font size, baseline at v = 0. Cached once the web font has loaded.
 */
const wordCache = new Map<string, { pts: Float32Array; w: number }>();
export function inkWords(text: string, family: string): { pts: Float32Array; w: number } | null {
  const key = `v2|${family}|${text}`;
  const hit = wordCache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return null;
  const px = 96;
  const font = `italic 400 ${px}px ${family}`;
  // (only the first family: next/font's local fallback face never loads, and would fail the check)
  const ready = !document.fonts || document.fonts.check(`italic 400 ${px}px ${family.split(',')[0].trim()}`, text);
  const c = document.createElement('canvas');
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.font = font;
  const pad = 7;
  const w = Math.ceil(g.measureText(text).width) + pad * 2;
  const h = Math.ceil(px * 1.4);
  c.width = w;
  c.height = h;
  g.font = font;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#000';
  const baseline = Math.round(px * 1.05);
  g.fillText(text, pad, baseline);
  // a little weight, so hairline strokes are not lost between the dots
  g.lineWidth = 5;
  g.lineJoin = 'round';
  g.strokeStyle = '#000';
  g.strokeText(text, pad, baseline);
  const data = g.getImageData(0, 0, w, h).data;
  const out: number[] = [];
  const step = 5;
  for (let y = 0, row = 0; y < h; y += step * 0.87, row++) {
    const yy = Math.round(y);
    for (let x = row % 2 ? step / 2 : 0; x < w; x += step) {
      const xx = Math.round(x);
      if (data[(yy * w + xx) * 4 + 3] > 110) out.push((xx - pad) / px, (yy - baseline) / px);
    }
  }
  const res = { pts: new Float32Array(out), w: (w - pad * 2) / px };
  if (ready) wordCache.set(key, res);
  return res;
}

/** A hand drawing, in the same dotted ink as the filaments. */
export function drawSketch(st: RenderState, strokes: number[][], T: ScreenTransform, alpha: number) {
  if (alpha < 0.01) return;
  const { ctx } = st;
  const R = T.s;
  // dot spacing in frame units: a power of two, so dots persist while zooming
  const spacing = Math.pow(2, Math.round(Math.log2(2.4 / R)));
  const size = clamp(0.45 + R / 1600, 0.5, 1.5);
  const path = new Path2D();
  for (const s of strokes) {
    let acc = 0;
    let next = 0;
    for (let i = 2; i < s.length; i += 2) {
      const x0 = s[i - 2];
      const y0 = s[i - 1];
      const x1 = s[i];
      const y1 = s[i + 1];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      while (next <= acc + seg) {
        const f = seg > 0 ? (next - acc) / seg : 0;
        const px = T.ox + (x0 + (x1 - x0) * f) * R;
        const py = T.oy + (y0 + (y1 - y0) * f) * R;
        if (px > -4 && py > -4 && px < st.w + 4 && py < st.h + 4) {
          path.moveTo(px + size, py);
          path.arc(px, py, size, 0, Math.PI * 2);
        }
        next += spacing;
      }
      acc += seg;
    }
  }
  ctx.fillStyle = `rgba(${INK},${alpha * 0.8})`;
  ctx.fill(path);
}

// ---------------------------------------------------------------------------
// Labels.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function relTime(now: number, t: number): string {
  const d = Math.max(0, (now - t) / 86400000);
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  if (d < 30) return `${Math.round(d)} days ago`;
  if (d < 365) return `${Math.round(d / 30)} months ago`;
  return `${(d / 365).toFixed(d < 730 ? 1 : 0)} years ago`;
}

export function shortDate(t: number) {
  const d = new Date(t);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** One word about an idea's life. No facts, nothing that enables. */
export function lifeWord(node: IdeaNode, now: number): string {
  if (node.state === 'abandoned') return 'let go';
  const quiet = (now - lastActivity(node)) / 86400000;
  if (quiet < 7) return 'moving';
  if (quiet < 60) return 'resting';
  return 'sleeping';
}

export function continuityLine(node: IdeaNode, now: number): string {
  const last = lastActivity(node);
  const quiet = (now - last) / 86400000;
  const parts = [`since ${shortDate(node.began)}`];
  if (node.state === 'abandoned') parts.push('let go');
  else if (quiet > 21) parts.push(`quiet since ${shortDate(last)}`);
  else parts.push(`last touched ${relTime(now, last)}`);
  return parts.join(' · ');
}

type Rect = [number, number, number, number];

function overlaps(a: Rect, list: Rect[]) {
  for (const b of list) if (a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]) return true;
  return false;
}

function drawLabel(st: RenderState, node: IdeaNode, x: number, y: number, cs: number, alpha: number, sealed: boolean, placed: Rect[]) {
  const { ctx, M } = st;
  const a = alpha * smoothstep(5, 22, cs) * (1 - smoothstep(0.1 * M, 0.26 * M, cs));
  if (a < 0.01) return;
  let off = Math.max(cs * 0.48, 4) + 8;
  const hovered = st.hoverId === node.id;
  if (node.title === '') return;
  if (sealed) {
    const r: Rect = [x + off, y - 8, x + off + 80, y + 6];
    if (overlaps(r, placed)) return;
    placed.push(r);
    ctx.font = `10px ${st.mono}`;
    ctx.fillStyle = `rgba(${INK},${a * 0.45})`;
    ctx.fillText('not open yet', x + off, y + 3);
    return;
  }
  const size = clamp(12 + cs / 26, 12, 19);
  ctx.font = `italic ${size}px ${st.serif}`;
  const tw = ctx.measureText(node.title ?? 'untitled').width;
  if (x + off + tw > st.w - 16) {
    ctx.textAlign = 'right';
    off = -off;
  }
  const lx0 = off > 0 ? x + off : x + off - tw;
  const rect: Rect = [lx0 - 2, y - size * 0.8, lx0 + tw + 2, y + size * 0.45];
  if (!hovered && overlaps(rect, placed)) {
    ctx.textAlign = 'left';
    return;
  }
  placed.push(rect);
  ctx.fillStyle = `rgba(${INK},${a * (hovered ? 0.95 : 0.72)})`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(node.title ?? 'untitled', x + off, y + size * 0.3);
  // very little context: one word about its life, and only when you ask (hover)
  const a2 = a * (hovered ? 1 : 0) * 0.5;
  if (a2 > 0.01) {
    ctx.font = `9.5px ${st.mono}`;
    ctx.fillStyle = `rgba(${INK},${a2})`;
    const second = node.portal ? 'every idea, again' : node.free ? 'free to build on' : lifeWord(node, st.now);
    ctx.fillText(second, x + off, y + size * 0.3 + 14);
  }
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// Recursion.

export function drawNode(
  st: RenderState,
  node: IdeaNode,
  T: ScreenTransform,
  alpha: number,
  p: number,
  path: IdeaNode[],
  isRoot: boolean
) {
  const R = T.s;
  const M = st.M;
  if (node.void) return; // its lattice is drawn by drawVoidLattice
  if (node.portal && !isRoot) {
    drawPortal(st, node, T, alpha, path);
    return;
  }
  const outerFade = isRoot ? 1 - smoothstep(30 * M, 400 * M, R) : 1 - smoothstep(9 * M, 45 * M, R);

  if (!isRoot) drawMark(st, node, T, alpha * (1 - smoothstep(6 * M, 20 * M, R)), false);

  const inner = isRoot ? 1 : smoothstep(16, 150, R);
  const ia = alpha * inner * outerFade;

  if (ia > 0.004) {
    if (isRoot) {
      if (!node.portal) drawLattice(st, T, ia * 0.2, 400, false);
    }
    else {
      drawWash(st, node, T, alpha * (1 - smoothstep(12 * M, 60 * M, R)));
      drawLattice(st, T, ia * (node.artifact ? 0.08 : 0.2) * smoothstep(0.6 * M, 2.6 * M, R), 1.2, true);
    }
  }

  const topo = topologyOf(node);
  // how revealed each child is (by rank), independent of how far past the
  // parent the viewer has travelled
  const reveal = new Map<IdeaNode, number>();
  const tipOf = new Map<IdeaNode, [number, number]>();
  if (!isRoot) {
    topo.order.forEach((si, rank) => {
      const s = topo.strands[si];
      const child = s.child;
      if (child && child.disclosure > p + SEAL_MARGIN) return;
      const threshold = 18 * Math.pow(1.55, rank);
      const r = alpha * inner * smoothstep(threshold, threshold * 2.6, R);
      if (child) reveal.set(child, r);
      if (child && st.cut !== null && st.cut < s.t1) {
        const [tx, ty] = strandAt(s, strandU(s, st.cut));
        tipOf.set(child, [tx, ty]);
      }
      if (ia > 0.004) drawStrand(st, s, T, r * outerFade * (child && child.state === 'abandoned' ? 0.7 : 1), path);
    });
  }

  if (!isRoot && ia > 0.004) {
    for (const l of topo.links) {
      drawStrand(st, l.strand, T, ia * smoothstep(40, 160, R) * (l.kind === 'grew-from' ? 0.95 : l.kind === 'resolves' ? 0.9 : 0.75), path);
    }
  }

  if (node.artifact && !isRoot) drawArtifact(st, node, T, alpha * outerFade);
  if (!isRoot) drawMedia(st, node, T, alpha * outerFade, p);
  if (!isRoot && !node.artifact && !node.media?.length && node.children.every((c) => c.portal)) {
    drawRhythm(st, node, T, alpha * outerFade);
  }

  // large fields: only visit children near the viewport
  let kids = node.children;
  if (kids.length > 400) {
    kids = spatialIndex(node).query((0 - T.ox) / R, (0 - T.oy) / R, (st.w - T.ox) / R, (st.h - T.oy) / R, []);
  }
  if (isRoot && !node.portal) drawPlots(st, T);
  if (isRoot) drawWater(st, node, T);
  const crowded = kids.length > 400;
  for (const c of kids) {
    const cp = isRoot ? st.lens.closeness(c) : p;
    if (!isRoot && c.disclosure > p + SEAL_MARGIN) continue;
    if (st.cut !== null && c.began > st.cut) continue;
    const sealed = !isRoot && c.disclosure > p;
    const cs = c.r * R;
    const tip = tipOf.get(c);
    const cx = T.ox + (tip ? tip[0] : c.x) * R;
    const cy = T.oy + (tip ? tip[1] : c.y) * R;
    if (!onScreen(st, cx, cy, Math.max(cs * 1.3, 3))) continue;
    const ca = isRoot ? alpha : reveal.get(c) ?? 0;
    if (ca < 0.004) continue;
    if (crowded && cs < 1.2 && !sealed) {
      // fast path: sub-pixel marks are batched by ink density
      const life = lifeOf(c);
      const a = ca * (0.35 + 0.45 * life) * smoothstep(0.02, 0.6, cs + 0.3);
      const b = Math.min(DOT_BUCKETS - 1, Math.floor(a * DOT_BUCKETS));
      const size = Math.max(0.7, cs * 0.9);
      (st.dots![b] ??= new Path2D()).rect(cx - size / 2, cy - size / 2, size, size);
      continue;
    }
    const CT = { ox: cx, oy: cy, s: cs };
    const cpath = [...path, c];
    if (sealed) drawMark(st, c, CT, ca, true);
    else if (cs < 0.12) drawMark(st, c, CT, ca, false);
    else drawNode(st, c, CT, ca, cp, cpath, false);
    if (cs >= 4) (st.labels ??= []).push({ node: c, x: cx, y: cy, cs, alpha: ca, sealed });
    if (cs < 0.5 * M) st.hits.push({ kind: 'node', node: c, path: cpath, sealed, x: cx, y: cy, r: Math.max(cs * 0.55, 12), size: cs });
  }
}

/** The endless grid inside empty frames, fading in as the last real frame's grid fades out. */
export function drawVoidLattice(st: RenderState, T: ScreenTransform, realR: number) {
  const M = st.M;
  const handover = smoothstep(9 * M, 45 * M, realR);
  drawLattice(st, T, 0.2 * handover, 1e6, false);
}

/** The Canvas again, reached from the end of a path. */
function drawPortal(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number, path: IdeaNode[]) {
  const R = T.s;
  const M = st.M;
  drawMark(st, node, T, alpha * (1 - smoothstep(0.3 * M, 1.2 * M, R)), false);
  const inner = alpha * smoothstep(40, 300, R);
  if (inner < 0.004) return;
  drawLattice(st, T, inner * 0.2 * (1 - smoothstep(30 * M, 400 * M, R)), 1.2, R < 3 * M);
  drawNode(st, node, T, inner, 1, path, true);
}

/** Held plots: a soft tint and corner marks, visible once the grid is legible. */
function drawPlots(st: RenderState, T: ScreenTransform) {
  if (!st.plots?.length) return;
  const { ctx, M } = st;
  const side = PLOT * T.s;
  const a = smoothstep(90, 260, side) * (1 - smoothstep(2.5 * M, 6 * M, side));
  if (a < 0.01) return;
  for (const p of st.plots) {
    const x = T.ox + p.x * T.s;
    const y = T.oy + p.y * T.s;
    if (x > st.w || y > st.h || x + side < 0 || y + side < 0) continue;
    ctx.fillStyle = `hsla(${p.hue}, 30%, 74%, ${0.06 * a})`;
    ctx.fillRect(x, y, side, side);
    ctx.strokeStyle = `hsla(${p.hue}, 25%, 35%, ${0.28 * a})`;
    ctx.lineWidth = 1;
    const c = Math.min(12, side * 0.08);
    ctx.beginPath();
    for (const [cx, cy, dx, dy] of [
      [x, y, 1, 1],
      [x + side, y, -1, 1],
      [x, y + side, 1, -1],
      [x + side, y + side, -1, -1],
    ]) {
      ctx.moveTo(cx + dx * c, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * c);
    }
    ctx.stroke();
    if (side > 320) {
      ctx.font = `9px ${st.mono}`;
      ctx.fillStyle = `hsla(${p.hue}, 25%, 30%, ${0.45 * a})`;
      ctx.fillText(p.holder, x + 6, y + side - 7);
    }
  }
}

/** Seconds a ripple takes to spread across the Canvas to its reach. */
const WATER = 4.2;

/**
 * When a change reaches a Shadow on the Canvas it spills into the space
 * around it like a ripple on water. Its reach grows with the size of the
 * idea's web; Shadows nearby (closest in topic) glow as the ring touches them.
 */
function drawWater(st: RenderState, field: IdeaNode, T: ScreenTransform) {
  if (!st.pulses || st.clock === undefined || st.reduced) return;
  const { ctx } = st;
  for (const src of field.children) {
    const t0 = st.pulses.get(src.id);
    if (t0 === undefined) continue;
    const q = (st.clock - t0) / WATER;
    if (q < 0 || q > 1.25) continue;
    const reach = rippleReach(src);
    const sx = T.ox + src.x * T.s;
    const sy = T.oy + src.y * T.s;
    // three rings, each trailing the last, easing out like water
    for (let k = 0; k < 3; k++) {
      const qk = q - k * 0.12;
      if (qk <= 0 || qk >= 1) continue;
      const e = 1 - Math.pow(1 - qk, 2.2);
      const rr = e * reach * T.s;
      const a = 0.32 * (1 - qk) * (1 - k * 0.3);
      if (rr < 1 || a < 0.005) continue;
      ctx.strokeStyle = `rgba(${ROSE},${a})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    // the ideas it reaches light up as the first ring passes them
    for (const other of field.children) {
      if (other === src) continue;
      const d = Math.hypot(other.x - src.x, other.y - src.y);
      if (d > reach) continue;
      const hit = 1 - Math.pow(1 - d / reach, 1 / 2.2); // when the first ring gets there
      const g = q - hit;
      if (g < 0 || g > 0.25) continue;
      const glow = Math.sin((g / 0.25) * Math.PI);
      const ox = T.ox + other.x * T.s;
      const oy = T.oy + other.y * T.s;
      const gr = Math.max(6, other.r * T.s * 0.9) + 10 * glow;
      const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, gr);
      grad.addColorStop(0, `rgba(${ROSE},${0.5 * glow})`);
      grad.addColorStop(1, `rgba(${ROSE},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ox, oy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function render(st: RenderState, start: IdeaNode, startPath: IdeaNode[], T: ScreenTransform, p: number, isRoot: boolean) {
  const { ctx } = st;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, st.w, st.h);
  st.hits.length = 0;
  st.labels = [];
  st.dots = [];
  st.models = [];
  st.videos = new Set();
  drawNode(st, start, T, 1, p, startPath, isRoot);
  st.dots.forEach((path, b) => {
    if (!path) return;
    ctx.fillStyle = `rgba(${INK},${(b + 0.5) / DOT_BUCKETS})`;
    ctx.fill(path);
  });
  // place labels: hovered first, then the most present
  const placed: Rect[] = [];
  const queue = st.labels.sort((a, b) => {
    const ha = st.hoverId === a.node.id ? 1 : 0;
    const hb = st.hoverId === b.node.id ? 1 : 0;
    return hb - ha || b.cs * b.alpha - a.cs * a.alpha;
  });
  for (const l of queue) drawLabel(st, l.node, l.x, l.y, l.cs, l.alpha, l.sealed, placed);
}
