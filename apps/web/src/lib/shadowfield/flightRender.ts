// Drawing the flight, in the Canvas's ink on paper.
//
// Far ahead everything gathers into a few specks near the vanishing point. As
// the viewer moves, things grow, resolve into what they are (a song's
// waveform, an object, a drawing, the constellation of a working session) and
// slide out past the edges, behind the viewer. Rings are ideas that hold
// others; inside one, its silk runs past on every side like the walls of a
// tunnel. One dotted thread runs through everything, in order: continuity.
// The faster you move, the more the ink streaks.

import { IdeaNode, LifeEvent, lastActivity, rippleReach } from './model';
import { ScreenTransform } from './camera';
import { FAR, FOCUS, FlightCam, NEAR, Station, Stream, View, aheadCopies, flightScale, project, travelled, viewOf } from './flight';
import { Hit, INK, PAPER, ROSE, RenderState, drawArtifact, drawAudioRing, drawRhythm, drawSketch, drawVideo } from './render';
import { getImage } from './media';
import { clamp, hash01, noise1, smoothstep } from './rng';

const DAY = 86400000;
const STRUCTURAL = new Set<LifeEvent['kind']>(['dormant', 'revival', 'return']);

/** A few alpha levels, so thousands of specks cost a handful of fills. */
const BUCKETS = 10;

class Ink {
  private paths: (Path2D | undefined)[] = [];
  private rose: (Path2D | undefined)[] = [];
  dot(x: number, y: number, size: number, a: number, rose = false) {
    if (a < 0.006) return;
    const b = Math.min(BUCKETS - 1, Math.floor(a * BUCKETS));
    const list = rose ? this.rose : this.paths;
    const p = (list[b] ??= new Path2D());
    if (size < 1.3) p.rect(x - size / 2, y - size / 2, size, size);
    else {
      p.moveTo(x + size / 2, y);
      p.arc(x, y, size / 2, 0, Math.PI * 2);
    }
  }
  flush(ctx: CanvasRenderingContext2D) {
    for (const [list, rgb] of [
      [this.paths, INK],
      [this.rose, ROSE],
    ] as const) {
      list.forEach((p, b) => {
        if (!p) return;
        ctx.fillStyle = `rgba(${rgb},${(b + 0.5) / BUCKETS})`;
        ctx.fill(p);
      });
      list.length = 0;
    }
  }
}

export interface FlightState {
  /** Screen frame of each thing drawn this frame (its disk: centre and radius). */
  frames: Map<string, ScreenTransform>;
  /** Closeness p of the viewer to a station's top-level Shadow. */
  closeness: (s: Station) => number;
  /** Not perceivable at all by this viewer. */
  hidden: (s: Station) => boolean;
}

function fogOf(dz: number) {
  return (1 - smoothstep(FAR * 0.45, FAR, dz)) * smoothstep(NEAR, 0.32, dz);
}

function liveness(node: IdeaNode, now: number) {
  const quiet = (now - lastActivity(node)) / DAY;
  if (node.state === 'abandoned') return 0.1;
  return clamp(1 - quiet / 30, 0.15, 1);
}

// ---------------------------------------------------------------------------

/** Ink specks suspended in the space you move through: they streak when you rush. */
function drawSpecks(st: RenderState, v: View, cam: FlightCam, ink: Ink) {
  const { ctx } = st;
  const P = 4;
  const N = 70;
  const streak = st.reduced ? 0 : clamp(cam.v * 0.03, -0.9, 0.9);
  const j0 = Math.floor((v.z + NEAR) / P);
  const j1 = Math.floor((v.z + FAR) / P);
  ctx.lineCap = 'round';
  for (let j = j0; j <= j1; j++) {
    const jj = ((j % 9973) + 9973) % 9973;
    for (let i = 0; i < N; i++) {
      const dz = j * P + hash01(i, jj * 3 + 1) * P - v.z;
      if (dz < NEAR || dz > FAR) continue;
      const x = (hash01(i, jj * 3 + 2) * 2 - 1) * 2.2;
      const y = (hash01(i, jj * 3 + 3) * 2 - 1) * 1.6;
      const [sx, sy, k] = project(v, x, y, dz);
      if (sx < -20 || sy < -20 || sx > st.w + 20 || sy > st.h + 20) continue;
      const a = 0.22 * fogOf(dz) * (0.4 + 0.6 * hash01(i, jj));
      const size = clamp(0.006 * k, 0.5, 2.4);
      if (Math.abs(streak) > 0.04) {
        let [tx, ty] = project(v, x, y, Math.max(NEAR, dz + streak));
        const len = Math.hypot(tx - sx, ty - sy);
        const cap = st.M * 0.12;
        if (len > cap) {
          tx = sx + ((tx - sx) * cap) / len;
          ty = sy + ((ty - sy) * cap) / len;
        }
        ctx.strokeStyle = `rgba(${INK},${a * 0.8})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      } else ink.dot(sx, sy, size, a);
    }
  }
}

/**
 * Inside a ring, its silk runs along the walls: strands of dots converging on
 * the vanishing point. How many strands: how much the idea holds.
 */
function drawTube(st: RenderState, v: View, s: Station, L: number, ink: Ink) {
  const STEP = 0.5;
  const strands = s.depth === 0 ? 30 : clamp(12 + 3 * travelled(s.node).length, 14, 44);
  const turn = hash01(s.node.seed, 3) * Math.PI * 2 + (st.reduced ? 0 : (st.clock ?? 0) * 0.015);
  const span = s.end - s.z;
  const strength = s.depth === 0 ? 0.1 : 0.17;
  for (const base of aheadCopies(s.z, v.z, L, NEAR - span, FAR)) {
    // rings every STEP along the ring's length, aligned so they stream steadily
    const m0 = Math.max(1, Math.ceil((NEAR - base) / STEP));
    for (let m = m0; m * STEP <= span; m++) {
      const dz = base + m * STEP;
      if (dz > FAR) break;
      const fade = fogOf(dz) * smoothstep(0, 1.5, m * STEP) * smoothstep(0, 1.2, span - m * STEP);
      if (fade < 0.02) continue;
      for (let j = 0; j < strands; j++) {
        const ang = turn + (j / strands) * Math.PI * 2 + 0.35 * noise1(m * 0.4 + j, s.node.seed);
        const [sx, sy, k] = project(v, Math.cos(ang) * s.r, Math.sin(ang) * s.r, dz);
        if (sx < -4 || sy < -4 || sx > st.w + 4 || sy > st.h + 4) continue;
        ink.dot(sx, sy, clamp(0.0045 * k, 0.45, 2.6), strength * fade);
      }
    }
  }
}

/** One dotted thread through everything, in order. It thins across long silences. */
function drawThread(st: RenderState, v: View, stream: Stream, ink: Ink, cam: FlightCam) {
  const { stations, length: L } = stream;
  const STEP = 0.055;
  const streak = st.reduced ? 0 : clamp(cam.v * 0.02, -0.6, 0.6);
  const { ctx } = st;
  for (let i = 0; i < stations.length; i++) {
    const a = stations[i];
    const b = stations[(i + 1) % stations.length];
    const span = i + 1 < stations.length ? b.z - a.z : b.z + L - a.z;
    const quietDays = b.quiet / DAY;
    // a silence of weeks leaves only every third dot
    const every = quietDays > 10 ? 3 : 1;
    for (const base of aheadCopies(a.z, v.z, L, NEAR - span, FAR)) {
      const u0 = Math.max(0, (NEAR - base) / span);
      const u1 = Math.min(1, (FAR - base) / span);
      if (u1 <= u0) continue;
      const n0 = Math.ceil((u0 * span) / STEP);
      const n1 = Math.floor((u1 * span) / STEP);
      for (let n = n0; n <= n1; n++) {
        if (n % every) continue;
        const u = (n * STEP) / span;
        const e = u * u * (3 - 2 * u);
        const x = a.x + (b.x - a.x) * e;
        const y = a.y + (b.y - a.y) * e;
        const dz = base + u * span;
        const [sx, sy, k] = project(v, x, y, dz);
        if (sx < -6 || sy < -6 || sx > st.w + 6 || sy > st.h + 6) continue;
        const alpha = 0.34 * fogOf(dz) * (0.75 + 0.25 * hash01(n, a.i));
        const size = clamp(0.0075 * k, 0.5, 2.8);
        if (Math.abs(streak) > 0.05 && k > 60) {
          let [tx, ty] = project(v, x, y, Math.max(NEAR, dz + streak));
          // a streak is a smear of ink, never a rule across the page
          const len = Math.hypot(tx - sx, ty - sy);
          const cap = st.M * 0.07;
          if (len > cap) {
            tx = sx + ((tx - sx) * cap) / len;
            ty = sy + ((ty - sy) * cap) / len;
          }
          ctx.strokeStyle = `rgba(${INK},${alpha * 0.7})`;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        } else ink.dot(sx, sy, size, alpha);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Things.

/** A change arriving: one clear rose ring. A Shadow on the Canvas spills it wider, by the size of its web. */
function drawPulse(st: RenderState, s: Station, x: number, y: number, R: number, alpha: number) {
  const t0 = st.pulses?.get(s.node.id);
  if (t0 === undefined || st.clock === undefined || st.reduced) return;
  const { ctx } = st;
  const top = s.depth === 1;
  const q = (st.clock - t0) / (top ? 4.2 : 2.4);
  if (q < 0 || q > 1) return;
  const spread = top ? R * (1.2 + 9 * rippleReach(s.node)) : R * 0.9 + 40;
  for (let k = 0; k < (top ? 3 : 1); k++) {
    const qk = q - k * 0.12;
    if (qk <= 0 || qk >= 1) continue;
    const e = 1 - Math.pow(1 - qk, 2.2);
    ctx.strokeStyle = `rgba(${ROSE},${alpha * 0.7 * (1 - qk) * (1 - k * 0.3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.5 + e * spread, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** An idea that holds others: a ring of silk, its own moments beaded on it. */
function drawGate(st: RenderState, s: Station, x: number, y: number, R: number, alpha: number, ink: Ink, sealed: boolean) {
  const { ctx, M } = st;
  const node = s.node;
  const clock = st.reduced ? 0 : st.clock ?? 0;
  const live = liveness(node, st.now);
  // a soft wash inside the first ring of a Shadow
  if (s.depth === 1 && !sealed) {
    const wa = alpha * 0.35 * smoothstep(0.03 * M, 0.2 * M, R) * (1 - smoothstep(0.5 * M, 1.4 * M, R));
    if (wa > 0.01) {
      const warm = hash01(node.seed, 99) > 0.5;
      const tint = warm ? '238,231,219' : '233,229,236';
      const g = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 1.05);
      g.addColorStop(0, `rgba(${tint},0)`);
      g.addColorStop(0.75, `rgba(${tint},${wa * 0.6})`);
      g.addColorStop(1, `rgba(${tint},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, R * 1.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const circ = Math.PI * 2 * R;
  const n = Math.round(clamp(circ / (s.depth === 0 ? 9 : 6), 16, 520));
  const size = clamp(R / 240, 0.6, 2.4);
  const turn = hash01(node.seed, 5) * Math.PI * 2 + clock * 0.03 * (s.depth % 2 ? 1 : -1);
  // a light travels the ring: faster the more alive the idea is
  const glint = (clock * (0.12 + 0.5 * live)) % 1;
  const base = (s.depth === 0 ? 0.28 : 0.5) * alpha;
  for (let i = 0; i < n; i++) {
    const f = i / n;
    const ang = turn + f * Math.PI * 2;
    const px = x + Math.cos(ang) * R;
    const py = y + Math.sin(ang) * R;
    if (px < -4 || py < -4 || px > st.w + 4 || py > st.h + 4) continue;
    const d = Math.min(Math.abs(f - glint), 1 - Math.abs(f - glint));
    const lit = sealed ? 0 : Math.exp(-(d * d) * 900);
    ink.dot(px, py, size * (1 + lit), base * (0.55 + 0.45 * lit));
  }
  // its own moments, placed around the ring by when they happened
  if (!sealed && s.depth > 0) {
    const evs = node.events.filter((e) => !STRUCTURAL.has(e.kind) && (st.cut === null || e.t <= st.cut));
    const t0 = node.began;
    const t1 = Math.max(t0 + 1, lastActivity(node));
    for (const e of evs) {
      const ang = turn + ((e.t - t0) / (t1 - t0)) * Math.PI * 1.9;
      const px = x + Math.cos(ang) * R;
      const py = y + Math.sin(ang) * R;
      if (px < -6 || py < -6 || px > st.w + 6 || py > st.h + 6) continue;
      const recent = (st.now - e.t) / DAY < 7;
      ink.dot(px, py, size * 2.6, alpha * (recent ? 0.75 : 0.5), recent);
    }
  }
  drawPulse(st, s, x, y, R, alpha);
}

function drawImage(st: RenderState, m: { src: string; x: number; y: number; w: number; aspect: number }, T: ScreenTransform, alpha: number, p: number) {
  const { ctx, M } = st;
  const W = m.w * T.s;
  const H = W * m.aspect;
  if (W < 3) return;
  const x0 = T.ox + m.x * T.s - W / 2;
  const y0 = T.oy + m.y * T.s - H / 2;
  if (x0 > st.w || y0 > st.h || x0 + W < 0 || y0 + H < 0) return;
  const a = alpha * smoothstep(3, 30, W);
  // it resolves from a pale shadow of itself as it nears focus (sooner, the closer you are to it)
  const reveal = smoothstep(0.08 * M, (0.42 - 0.18 * p) * M, W);
  const loaded = getImage(m.src);
  if (!loaded) {
    ctx.fillStyle = `rgba(${INK},${a * 0.05})`;
    ctx.fillRect(x0, y0, W, H);
    return;
  }
  const maxLevel = loaded.mips.length - 1;
  const need = Math.max(0, Math.floor(Math.log2(loaded.img.naturalWidth / Math.max(W, 1))));
  const lf = Math.min(maxLevel, Math.max((1 - reveal) * Math.min(5, maxLevel), need));
  const l0 = Math.floor(lf);
  const l1 = Math.min(maxLevel, l0 + 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.drawImage(loaded.mips[l0], x0, y0, W, H);
  if (lf - l0 > 0.01 && l1 !== l0) {
    ctx.globalAlpha = a * (lf - l0);
    ctx.drawImage(loaded.mips[l1], x0, y0, W, H);
  }
  const veil = 0.9 * Math.pow(1 - reveal, 1.1);
  if (veil > 0.01) {
    ctx.globalAlpha = a * veil;
    ctx.fillStyle = PAPER;
    ctx.fillRect(x0 - 1, y0 - 1, W + 2, H + 2);
  }
  ctx.restore();
}

/** Anything else: an ink drop that resolves into what it carries. */
function drawThing(st: RenderState, s: Station, x: number, y: number, R: number, alpha: number, speed: number, ink: Ink, sealed: boolean, p: number) {
  const { ctx, M } = st;
  const node = s.node;
  const clock = st.reduced ? 0 : st.clock ?? 0;
  const live = liveness(node, st.now);
  const T: ScreenTransform = { ox: x, oy: y, s: R };
  const media = node.media ?? [];
  const song = media.find((m) => m.kind === 'audio');
  const content = !!(media.length || node.artifact);
  const film = media.some((m) => m.kind === 'video');

  // the drop: dense far away, thinning to a stain once what it carries shows
  const breathe = node.state === 'alive' && !st.reduced ? 1 + 0.04 * Math.sin(clock * 0.8 + (node.seed % 97)) : 1;
  const rb = R * (sealed ? 0.22 : 0.34) * breathe;
  const thin = content && !sealed ? 1 - 0.8 * smoothstep(0.06 * M, 0.22 * M, R) : 1;
  // (a film needs no drop: it is printed straight onto the page)
  const coreA = film ? 0 : alpha * (0.3 + 0.35 * live) * thin * (song ? 0.5 : 1);
  if (coreA > 0.01 && rb > 0.5) {
    ctx.beginPath();
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + 0.12 * noise1(a * 1.6 + clock * 0.05, node.seed) + 0.05 * noise1(a * 4.3 - clock * 0.07, node.seed + 3);
      const px = x + Math.cos(a) * rb * wob;
      const py = y + Math.sin(a) * rb * wob;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    const g = ctx.createRadialGradient(x, y, 0, x, y, rb * 1.15);
    g.addColorStop(0, `rgba(${INK},${coreA})`);
    g.addColorStop(0.3, `rgba(${INK},${coreA * 0.6})`);
    g.addColorStop(0.72, `rgba(${INK},${coreA * 0.15})`);
    g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g;
    ctx.fill();
  }
  if (sealed) {
    ctx.strokeStyle = `rgba(${INK},${alpha * 0.3})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  // a fine ring with a light travelling it: something here is alive, and how
  // much (things that move on their own, a song, a film, an object, need none)
  const moving = media.some((m) => m.kind === 'audio' || m.kind === 'video' || m.kind === 'model' || m.kind === 'image');
  if (!moving) {
    const ringR = R * 0.52;
    const rn = Math.round(clamp((Math.PI * 2 * ringR) / 7, 12, 220));
    const glint = (clock * (0.1 + 0.45 * live) + hash01(node.seed, 11)) % 1;
    for (let i = 0; i < rn; i++) {
      const f = i / rn;
      const ang = f * Math.PI * 2 - Math.PI / 2;
      const d = Math.min(Math.abs(f - glint), 1 - Math.abs(f - glint));
      const lit = Math.exp(-(d * d) * 700);
      ink.dot(x + Math.cos(ang) * ringR, y + Math.sin(ang) * ringR, clamp(R / 300, 0.5, 1.8) * (1 + lit), alpha * (0.16 + 0.5 * lit * live));
    }
  }

  // what it carries
  for (const m of media) {
    if (m.kind === 'image') drawImage(st, m, T, alpha, p);
    else if (m.kind === 'video') drawVideo(st, m, T, alpha, smoothstep(0.08 * M, (0.4 - 0.16 * p) * M, m.w * R));
    else if (m.kind === 'audio') drawAudioRing(st, m.src, { ox: x, oy: y, s: R * 2 }, alpha);
    else if (m.kind === 'sketch') drawSketch(st, m.strokes, T, alpha * smoothstep(0.05 * M, 0.16 * M, R));
    else if (m.kind === 'model') {
      const W = m.w * R * 1.5;
      const H = W * m.aspect;
      const cx = x + m.x * R;
      const cy = y + m.y * R;
      // the object itself turns in place once near and still enough to look at
      const show = alpha * smoothstep(0.14 * M, 0.26 * M, W) * (1 - smoothstep(1.6, 4, Math.abs(speed)));
      const ringA = alpha * smoothstep(12, 60, W) * (1 - show);
      if (ringA > 0.01) {
        for (let i = 0; i < 40; i++) {
          const ang = (i / 40) * Math.PI * 2 + clock * 0.4;
          ink.dot(cx + Math.cos(ang) * W * 0.3, cy + Math.sin(ang) * H * 0.3 * (0.35 + 0.25 * Math.sin(clock * 0.3)), 1.6, ringA * 0.5);
        }
      }
      if (show > 0.01) (st.models ??= []).push({ src: m.src, x: cx - W / 2, y: cy - H / 2, w: W, h: H, alpha: show });
    }
  }
  if (node.artifact) drawArtifact(st, node, { ox: x, oy: y + R * 0.2, s: R * 2.4 }, alpha);
  if (!content && node.events.length > 1) drawRhythm(st, node, { ox: x, oy: y + R * 0.25, s: R * 2 }, alpha);

  // followed: a rose ring of dots you put there
  if (st.lens.followed.has(node.id)) {
    for (let i = 0; i < 36; i++) {
      const ang = (i / 36) * Math.PI * 2 + clock * 0.02;
      ink.dot(x + Math.cos(ang) * R * 0.62, y + Math.sin(ang) * R * 0.62, 1.2, alpha * 0.5, true);
    }
  }
  drawPulse(st, s, x, y, R, alpha);
}

// ---------------------------------------------------------------------------

interface Title {
  text: string;
  x: number;
  y: number;
  size: number;
  a: number;
  near: number;
}

export function renderFlight(st: RenderState, stream: Stream, cam: FlightCam, fs: FlightState) {
  // sizes in the flight are measured against the flight's own scale
  st.M = flightScale(st.w, st.h);
  const { ctx, M } = st;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, st.w, st.h);
  st.hits.length = 0;
  st.models = [];
  st.videos = new Set();
  fs.frames.clear();
  const v = viewOf(stream, cam, st.w, st.h);
  const L = stream.length;
  const speed = cam.v;
  const ink = new Ink();

  const born = (s: Station) => st.cut === null || s.depth === 0 || s.node.began <= st.cut;

  drawSpecks(st, v, cam, ink);
  for (const s of stream.stations) if (s.gate && born(s) && !fs.hidden(s)) drawTube(st, v, s, L, ink);
  drawThread(st, v, stream, ink, cam);
  ink.flush(ctx);

  // far to near, so nearer things are drawn over farther ones
  const list: { s: Station; dz: number }[] = [];
  for (const s of stream.stations) {
    if (!born(s) || fs.hidden(s)) continue;
    for (const dz of aheadCopies(s.z, v.z, L, NEAR, FAR)) list.push({ s, dz });
  }
  list.sort((a, b) => b.dz - a.dz);

  const titles: Title[] = [];
  const quiet = 1 - smoothstep(2.5, 7, Math.abs(speed));
  for (const { s, dz } of list) {
    const [x, y, k] = project(v, s.x, s.y, dz);
    const R = s.r * k;
    const alpha = fogOf(dz);
    if (alpha < 0.01) continue;
    const reach = s.gate ? R * 1.1 : R;
    if (x + reach < 0 || y + reach < 0 || x - reach > st.w || y - reach > st.h) continue;
    const p = fs.closeness(s);
    const sealed = s.depth > 1 && s.node.disclosure > p;
    if (s.gate) drawGate(st, s, x, y, R, alpha, ink, sealed);
    else drawThing(st, s, x, y, R, alpha, speed, ink, sealed, p);
    ink.flush(ctx);
    if (!fs.frames.has(s.node.id) || dz < FOCUS * 2) fs.frames.set(s.node.id, { ox: x, oy: y, s: R });

    if (s.depth > 0) {
      if (!s.gate && R < 0.9 * M) {
        st.hits.push({ kind: 'node', node: s.node, path: s.path, sealed, x, y, r: Math.max(R * 0.6, 16), size: R });
      } else if (s.gate && R < 0.3 * M) {
        st.hits.push({ kind: 'node', node: s.node, path: s.path, sealed, x, y, r: Math.max(R * 0.9, 16), size: R * 1.5 });
      }
      // very little text: a name, only while it is near enough to read and you are not rushing
      const win = smoothstep(0.035 * M, 0.09 * M, R) * (1 - smoothstep(s.gate ? 0.55 * M : 0.42 * M, s.gate ? 0.95 * M : 0.75 * M, R));
      const ta = alpha * win * quiet;
      if (ta > 0.02 && s.node.title) {
        const size = clamp(11 + R / 22, 12, s.gate ? 22 : 19);
        const song = s.node.media?.some((m) => m.kind === 'audio');
        // a song's name sits inside its ring; anything else's beneath it
        const ty = s.gate ? Math.max(58, y - R - size * 0.6) : song ? y + R * 0.18 + size * 0.4 : y + R * 0.62 + size * 1.1;
        titles.push({ text: sealed ? '' : s.node.title, x, y: ty, size, a: ta, near: 1 / dz });
      }
    }
  }
  ink.flush(ctx);

  // names: nearest first, never on top of one another
  titles.sort((a, b) => b.near - a.near);
  const placed: [number, number, number, number][] = [];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const t of titles) {
    if (!t.text) continue;
    ctx.font = `italic ${t.size}px ${st.serif}`;
    const w = ctx.measureText(t.text).width;
    const r: [number, number, number, number] = [t.x - w / 2 - 4, t.y - t.size, t.x + w / 2 + 4, t.y + t.size * 0.35];
    if (placed.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) continue;
    placed.push(r);
    ctx.fillStyle = `rgba(${INK},${t.a * 0.78})`;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.textAlign = 'left';
}

/** Hits this frame carry station paths; the viewer's pointer picks the nearest. */
export type { Hit };
