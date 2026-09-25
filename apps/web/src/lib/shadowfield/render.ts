// Canvas2D renderer for the Shadow Field.
//
// Semantic level of detail is driven by one number per node: R, its radius in
// screen pixels. The same node renders as a dot, an ink drop, a filament
// constellation, and finally an environment, with every representation
// cross-fading continuously as R changes. Nothing here scales a bitmap.

import { IdeaNode, LifeEvent, SEAL_MARGIN, lastActivity, countEvents } from './model';
import { Strand, topologyOf, strandAt, strandU } from './layout';
import { ScreenTransform } from './camera';
import { spatialIndex } from './spatial';
import { clamp, hash01, noise1, smoothstep } from './rng';

export const PAPER = '#fbfaf7';
const INK = '30,28,36';
const ROSE = '176,118,146';

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
  /** prefers-reduced-motion: no ripples (time is also frozen by the caller). */
  reduced?: boolean;
  /** Batched sub-pixel marks, by alpha bucket. */
  dots?: (Path2D | undefined)[];
}

const DOT_BUCKETS = 12;

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
  const levels = [1 / 8, 1 / 64, 1 / 512];
  for (const g of levels) {
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

function drawMark(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number, sealed: boolean) {
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

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
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

function drawArtifact(st: RenderState, node: IdeaNode, T: ScreenTransform, alpha: number) {
  const art = node.artifact;
  if (!art) return;
  const R = T.s;
  const { ctx } = st;
  const isLedger = art.type === 'ledger';
  const fpx = R * (isLedger ? 0.0105 : 0.032);
  const a = alpha * smoothstep(isLedger ? 5 : 8, isLedger ? 9 : 14, fpx) * (1 - smoothstep(isLedger ? 48 : 70, isLedger ? 110 : 150, fpx));
  if (a < 0.01) return;
  ctx.font = isLedger ? `${fpx}px ${st.mono}` : `italic ${fpx}px ${st.serif}`;
  ctx.fillStyle = `rgba(${INK},${a * 0.82})`;
  ctx.textBaseline = 'alphabetic';
  const width = isLedger ? fpx * 30 : R * 1.05;
  const lines = art.type === 'ledger' ? art.lines : wrap(ctx, art.body, width);
  const lh = fpx * (isLedger ? 1.55 : 1.35);
  const total = lines.length * lh;
  let y = T.oy + (isLedger ? R * 0.18 : 0) - total / 2 + fpx * 0.8;
  if (y < T.oy - R * 0.85) y = T.oy - R * 0.85;
  ctx.textAlign = isLedger ? 'left' : 'center';
  const x = isLedger ? T.ox - width / 2 : T.ox;
  for (const line of lines) {
    if (y > -lh && y < st.h + lh) ctx.fillText(line, x, y);
    y += lh;
  }
  ctx.textAlign = 'left';
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

export function continuityLine(node: IdeaNode, now: number): string {
  const last = lastActivity(node);
  const changes = countEvents(node);
  const quiet = (now - last) / 86400000;
  const parts = [`since ${shortDate(node.began)}`];
  if (changes > 1) parts.push(`${changes} changes`);
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
  const a2 = a * Math.max(smoothstep(90, 180, cs), hovered ? 1 : 0) * 0.5;
  if (a2 > 0.01) {
    ctx.font = `9.5px ${st.mono}`;
    ctx.fillStyle = `rgba(${INK},${a2})`;
    ctx.fillText(continuityLine(node, st.now), x + off, y + size * 0.3 + 14);
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
  const outerFade = isRoot ? 1 - smoothstep(30 * M, 400 * M, R) : 1 - smoothstep(9 * M, 45 * M, R);

  if (!isRoot) drawMark(st, node, T, alpha * (1 - smoothstep(6 * M, 20 * M, R)), false);

  const inner = isRoot ? 1 : smoothstep(16, 150, R);
  const ia = alpha * inner * outerFade;

  if (ia > 0.004) {
    if (isRoot) drawLattice(st, T, ia * 0.2, 400, false);
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

  if (node.artifact && !isRoot) drawArtifact(st, node, T, alpha * outerFade);

  // large fields: only visit children near the viewport
  let kids = node.children;
  if (kids.length > 400) {
    kids = spatialIndex(node).query((0 - T.ox) / R, (0 - T.oy) / R, (st.w - T.ox) / R, (st.h - T.oy) / R, []);
  }
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

export function render(st: RenderState, start: IdeaNode, startPath: IdeaNode[], T: ScreenTransform, p: number, isRoot: boolean) {
  const { ctx } = st;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, st.w, st.h);
  st.hits.length = 0;
  st.labels = [];
  st.dots = [];
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
