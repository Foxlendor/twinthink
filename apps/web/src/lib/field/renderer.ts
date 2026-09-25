import { type Camera, type Viewport, minSide } from './camera';
import { growthAngle, layoutDisks, type Disk } from './layout';
import { DAY_MS, type EvidenceRef, type HistoryEvent, type NodeKind, type ShadowProjection } from './model';
import { hashString } from './rng';

/**
 * Filament Field — how TwinThink draws thought.
 *
 * Everything sits on one enormous shared plane with a faint grid underneath.
 * An idea is a concentration of ink at a point. Its structure is not drawn as
 * boxes or bubbles: it grows out of that point as hair-thin dotted filaments,
 * and its history trails behind it as a thread.
 *
 * Detail emerges with screen size, the way a specimen resolves under a
 * microscope — not by scaling one picture up:
 *
 *   field radius  <3px    a single near-white pixel
 *                  ~5px    a faint halo: something is here
 *                 ~10px    a history trail starts to show: something has been growing here
 *                 ~15px    the strongest filament appears, then the next, then the next
 *                 ~60px    forks, child points, alternatives, dead ends tapering away
 *                ~150px    a few words beside the point
 *            ~0.4 screen   the ink drop swells to fill the view as you pass into it
 *                 inside    the child's own field is now the whole environment
 *
 * The same drawing runs in reverse when you pull back, so everything
 * compresses into its point until the idea is one pixel again.
 *
 * Relationships carry their age: a thread that was made once and left is a
 * few scattered grains; one the creator kept returning to is nearly
 * continuous; a dead end tapers into nothing; a part not yet open to the
 * viewer dissolves partway.
 *
 * Traversal is breadth-first under a budget, and grain spacing adapts to load,
 * so cost follows the screen, never the size of the Field.
 */

export interface FieldWorld {
  get(id: string): ShadowProjection | undefined;
  childIds(id: string): string[] | undefined;
  request(id: string): void;
  diskInFrame(id: string, frameId: string): Disk | null;
  /** Ancestor of `id` `levels` up (or the root). */
  ancestor(id: string, levels: number): string;
  /** When this node stopped being veiled for the viewer, if recently. */
  revealedAt?(id: string): number | undefined;
}

export interface RenderInput {
  ctx: CanvasRenderingContext2D;
  viewport: Viewport;
  camera: Camera;
  world: FieldWorld;
  time: number;
  now: number;
  lensOn: boolean;
  selectedId: string | null;
  hoverId: string | null;
  isBacked(twinId: string): boolean;
  fonts: { sans: string; mono: string };
}

export interface HitNode {
  id: string;
  /** Where the point is drawn. */
  sx: number;
  sy: number;
  /** Radius of its field on screen. */
  sr: number;
  perceivable: boolean;
  kind: NodeKind;
  level: number;
}

export interface RenderStats {
  hits: HitNode[];
  drawn: number;
  dots: number;
  labels: number;
}

export const PAPER = '#fcfbf8';
const PAPER_RGB = '252,251,248';
const INK = '30,29,36';
const FOCUS = '70,96,168';
const MEDIA_TINT: Partial<Record<EvidenceRef['medium'], string>> = {
  audio: '108,92,150',
  measurement: '64,104,150',
  image: '150,114,70',
  video: '150,114,70',
};

const NODE_BUDGET = 6000;
const DOT_BUDGET = 60_000;
const MAX_LABELS = 16;
const MAX_READINGS = 3;
/** How much smaller-looking (farther) things shift toward the centre: a hint of depth. */
const PARALLAX = 0.035;
const CONTAINER: ReadonlySet<NodeKind> = new Set(['canvas', 'domain', 'constellation']);

/** Adapts grain spacing so dense scenes stay smooth. */
let dotScale = 1;

const smooth = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const hashCache = new Map<string, number>();
function seedOf(id: string) {
  let h = hashCache.get(id);
  if (h === undefined) {
    h = hashString(id) / 4294967296;
    if (hashCache.size > 50_000) hashCache.clear();
    hashCache.set(id, h);
  }
  return h;
}

/** Deterministic per-index noise in [0, 1). */
const grain = (i: number, seed: number) => {
  const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

interface Strength {
  /** 0..1: how coherent this thread is, from its history. */
  continuity: number;
}

const strengthCache = new WeakMap<ShadowProjection, Strength>();
export function strengthOf(node: ShadowProjection): Strength {
  let cached = strengthCache.get(node);
  if (cached) return cached;
  if (!node.perceivable) {
    cached = { continuity: 0.14 };
  } else {
    let revisions = 0;
    let returns = 0;
    let evidence = 0;
    let branches = 0;
    for (const event of node.history ?? []) {
      if (event.type === 'revised') revisions++;
      else if (event.type === 'returned' || event.type === 'revived') returns++;
      else if (event.type === 'evidence') evidence++;
      else if (event.type === 'branched' || event.type === 'split') branches++;
    }
    const work = revisions + returns * 1.3 + evidence * 0.8 + branches + node.childCount * 0.6;
    let continuity = 1 - Math.exp(-work / 6);
    continuity = Math.min(1, continuity * 0.85 + node.vitality * 0.25);
    if (node.kind === 'dead_end' || node.life === 'ended') continuity *= 0.55;
    cached = { continuity: Math.max(0.08, continuity) };
  }
  strengthCache.set(node, cached);
  return cached;
}

interface QueueItem {
  id: string;
  x: number;
  y: number;
  r: number;
  level: number;
  /** 0..1 — how far this has emerged from its parent's field. */
  emergence: number;
  px?: number;
  py?: number;
}

interface Label {
  text: string;
  x: number;
  y: number;
  size: number;
  alpha: number;
  priority: number;
  mono: boolean;
  weight: number;
  align: CanvasTextAlign;
}

interface Reading {
  node: ShadowProjection;
  px: number;
  py: number;
  R: number;
  alpha: number;
}

const densityCache = new Map<string, Disk[]>();
function densityDisks(node: ShadowProjection): Disk[] {
  const key = node.id + '#' + node.childCount;
  let disks = densityCache.get(key);
  if (!disks) {
    disks = layoutDisks(node.childCount, node.id, node.kind === 'canvas' ? 'territory' : 'scatter');
    if (densityCache.size > 400) densityCache.clear();
    densityCache.set(key, disks);
  }
  return disks;
}

export function renderField(input: RenderInput): RenderStats {
  const { ctx, viewport, camera, world, time } = input;
  const side = minSide(viewport);
  const W = viewport.width;
  const H = viewport.height;
  let dots = 0;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const toSX = (x: number) => W / 2 + (x - camera.cx) * camera.zoom;
  const toSY = (y: number) => H / 2 + (y - camera.cy) * camera.zoom;

  /** Smaller-on-screen things sit a little farther back, so moving across shows depth. */
  const parallax = (x: number, y: number, R: number): [number, number] => {
    const depth = Math.max(0, Math.min(1, Math.log2(side / Math.max(R, 0.5)) / 12));
    const k = 1 - PARALLAX * depth;
    return [W / 2 + (x - W / 2) * k, H / 2 + (y - H / 2) * k];
  };

  /** Where a node's point is actually drawn: its true place, breathing slightly, with depth. */
  const pointOf = (node: ShadowProjection, sx: number, sy: number, R: number): [number, number] => {
    if (!CONTAINER.has(node.kind) && R < side * 0.8 && node.life !== 'dormant' && node.life !== 'ended') {
      const seed = seedOf(node.id);
      const amp = Math.min(2.4, R * 0.018) * (0.35 + node.vitality) * (1 - smooth(side * 0.3, side * 0.8, R));
      sx += Math.sin(time * 0.00031 + seed * 40) * amp;
      sy += Math.cos(time * 0.00027 + seed * 53) * amp;
    }
    return parallax(sx, sy, R);
  };

  // ---- the plane itself
  const rootId = world.ancestor(camera.frameId, 64);
  const plane = world.diskInFrame(rootId, camera.frameId);
  if (plane) drawGrid(ctx, toSX(plane.x), toSY(plane.y), plane.r * camera.zoom, W, H, input.lensOn);

  // Draw from two levels above the frame so neighbours stay present as you move out.
  const startId = world.ancestor(camera.frameId, 2);
  const start = world.diskInFrame(startId, camera.frameId);
  const hits: HitNode[] = [];
  const labels: Label[] = [];
  const readings: Reading[] = [];
  if (!start) return { hits, drawn: 0, dots: 0, labels: 0 };

  const queue: QueueItem[] = [{ id: startId, ...start, level: 0, emergence: 1 }];
  let head = 0;
  let drawn = 0;

  while (head < queue.length && drawn < NODE_BUDGET) {
    const item = queue[head++];
    const node = world.get(item.id);
    if (!node) continue;
    const R = item.r * camera.zoom;
    const [px, py] = item.px !== undefined ? [item.px, item.py!] : pointOf(node, toSX(item.x), toSY(item.y), R);
    if (px + R < -80 || py + R < -80 || px - R > W + 80 || py - R > H + 80) continue;
    const e = item.emergence;
    const seed = seedOf(node.id);
    drawn++;

    if (node.kind === 'domain') {
      // A territory names itself only once you are moving inside it, like a map region.
      const a = smooth(side * 0.75, side * 1.2, R) * (1 - smooth(side * 2.6, side * 4.5, R));
      if (a > 0.01) {
        labels.push({ text: node.title ?? '', x: Math.max(120, Math.min(W - 120, px)), y: Math.max(96, Math.min(H - 60, py - R * 0.5)), size: 22, alpha: 0.13 * a, priority: 5000 + R, mono: false, weight: 600, align: 'center' });
      }
    } else if (node.kind === 'constellation') {
      drawConstellationSeed(ctx, node, px, py, R, e, input, labels);
      if (R >= 0.6) hits.push({ id: node.id, sx: px, sy: py, sr: R, perceivable: true, kind: node.kind, level: item.level });
    } else if (node.kind !== 'canvas') {
      const revealedAt = world.revealedAt?.(node.id);
      const reveal = revealedAt === undefined ? 1 : smooth(0, 1600, time - revealedAt);
      const selected = node.id === input.selectedId;
      const hovered = node.id === input.hoverId;
      if (node.perceivable) drawInkDrop(ctx, px, py, R, e, side, seed);
      if (node.perceivable && node.history && R >= 7) dots += drawTrail(ctx, node, px, py, R, e * reveal, time, input.now, seed, input.lensOn);
      drawPoint(ctx, node, px, py, R, e, input, selected, hovered, seed, reveal);
      if (e > 0.2 && R >= 0.6) hits.push({ id: node.id, sx: px, sy: py, sr: R, perceivable: node.perceivable, kind: node.kind, level: item.level });

      // Words: a small name beside the point, then its own reading once you are close.
      if (node.perceivable && node.title) {
        const onScreen = px > 10 && px < W - 10 && py > 10 && py < H - 10;
        if (R >= 150 && e > 0.5 && onScreen) readings.push({ node, px, py, R, alpha: smooth(150, 260, R) * e });
        const a = smooth(node.isTwin ? 22 : 30, node.isTwin ? 55 : 70, R) * (1 - smooth(122, 150, R)) * e;
        const boost = selected || hovered ? 1 : 0;
        if (a > 0.02 || boost) {
          labels.push({
            text: node.title,
            x: px + 8,
            y: py + 4,
            size: node.isTwin ? 12 : 11,
            alpha: Math.max(a * (node.isTwin ? 0.66 : 0.5), boost * 0.75),
            priority: (boost ? 9000 : 0) + R + (node.isTwin ? 30 : 0),
            mono: false,
            weight: node.isTwin ? 600 : 500,
            align: 'left',
          });
        }
      }
    }

    // ---- what grows out of it
    if (!node.perceivable || node.childCount === 0) continue;
    const kids = world.childIds(node.id);
    if (!kids) {
      if (R >= 10) world.request(node.id);
      if (node.kind === 'domain' || node.kind === 'canvas') dots += drawDensity(ctx, node, px, py, R, input.lensOn);
      continue;
    }
    if ((node.kind === 'domain' || node.kind === 'canvas') && (R * 0.5) / Math.sqrt(Math.max(1, node.childCount)) < 0.45) {
      dots += drawDensity(ctx, node, px, py, R, input.lensOn);
      continue;
    }
    if (R < 4) continue;

    const children: Array<{ child: ShadowProjection; cx: number; cy: number; cr: number; CR: number; p: [number, number]; continuity: number }> = [];
    for (const childId of kids) {
      const child = world.get(childId);
      if (!child) continue;
      const cx = item.x + item.r * child.x;
      const cy = item.y + item.r * child.y;
      const cr = item.r * child.r;
      const CR = cr * camera.zoom;
      children.push({ child, cx, cy, cr, CR, p: pointOf(child, toSX(cx), toSY(cy), CR), continuity: strengthOf(child).continuity });
    }

    const structural = !CONTAINER.has(node.kind) || node.kind === 'constellation';
    // Strongest threads emerge first; the rest follow as you come closer.
    const order = children.map((_, i) => i).sort((a, b) => children[b].continuity - children[a].continuity);
    const rank = new Array<number>(children.length);
    order.forEach((childIndex, position) => (rank[childIndex] = position));
    const byId = new Map(children.map((c) => [c.child.id, c]));
    const emerged = new Map<string, number>();
    const threadAlpha = node.kind === 'constellation' ? 0.22 : 1;

    children.forEach((c, i) => {
      let ce = e;
      if (structural) {
        const threshold = 13 + rank[i] * 17 + Math.max(0, rank[i] - 3) * 10;
        ce = e * smooth(threshold, threshold + 34, R);
      }
      emerged.set(c.child.id, ce);
    });

    children.forEach((c) => {
      const ce = emerged.get(c.child.id) ?? 0;
      if (ce < 0.01) return;
      if (structural && dots < DOT_BUDGET) {
        // A thread grows from the sibling it came out of when that is visible, otherwise from the point.
        const from = c.child.grewFrom ? byId.get(c.child.grewFrom) : undefined;
        const fromShown = from && (emerged.get(from.child.id) ?? 0) > 0.05 ? from : undefined;
        const [x0, y0] = fromShown ? fromShown.p : [px, py];
        dots += drawFilament(ctx, x0, y0, c.p[0], c.p[1], {
          alpha: ce * threadAlpha * (0.4 + 0.5 * c.continuity),
          // A creator's link to each of their ideas says little; keep it the faintest thread there is.
          continuity: node.kind === 'constellation' ? 0.16 : c.continuity,
          seed: seedOf(c.child.id),
          time,
          taper: !c.child.perceivable ? 'veiled' : c.child.kind === 'dead_end' || c.child.life === 'ended' ? 'dead' : 'none',
          focus: c.child.id === input.selectedId || c.child.id === input.hoverId,
          startGap: fromShown ? Math.max(3, Math.min(8, fromShown.CR * 0.05)) : Math.max(3, Math.min(9, R * 0.02)),
          endGap: Math.max(3, Math.min(8, c.CR * 0.04)),
        });
      }
      if (c.CR < 0.3) return;
      queue.push({ id: c.child.id, x: c.cx, y: c.cy, r: c.cr, level: item.level + 1, emergence: ce, px: c.p[0], py: c.p[1] });
    });

    // Threads that are not growth — convergence, support, contradiction — appear late and faint.
    if (structural && R >= 180 && dots < DOT_BUDGET) {
      const a = smooth(180, 320, R) * e;
      for (const c of children) {
        for (const rel of c.child.relationships ?? []) {
          if (rel.type === 'revises' || rel.type === 'branched_from' || rel.type === 'descends_from' || rel.targetId === c.child.grewFrom) continue;
          const target = byId.get(rel.targetId);
          if (!target) continue;
          dots += drawFilament(ctx, c.p[0], c.p[1], target.p[0], target.p[1], {
            alpha: a * 0.28,
            continuity: 0.25,
            seed: seedOf(c.child.id + rel.targetId),
            time,
            taper: 'none',
            focus: false,
            startGap: 5,
            endGap: 5,
            bow: 0.45,
          });
        }
      }
    }
  }

  // Adapt grain spacing to keep dense scenes smooth.
  dotScale = Math.max(1, Math.min(3, dotScale * 0.9 + Math.max(1, dots / (DOT_BUDGET * 0.7)) * 0.1));

  // ---- words, largest first, never overlapping
  const placed: Array<[number, number, number, number]> = [];
  readings.sort((a, b) => b.R - a.R);
  for (const reading of readings.slice(0, MAX_READINGS)) drawReading(ctx, reading, input, placed);

  labels.sort((a, b) => b.priority - a.priority);
  let labelCount = 0;
  for (const label of labels) {
    if (labelCount >= MAX_LABELS) break;
    ctx.font = `${label.weight} ${label.size}px ${label.mono ? input.fonts.mono : input.fonts.sans}`;
    const text = label.text.length > 42 ? label.text.slice(0, 40) + '…' : label.text;
    const width = ctx.measureText(text).width;
    const x0 = label.align === 'left' ? label.x : label.x - width / 2;
    const box: [number, number, number, number] = [x0 - 3, label.y - label.size, x0 + width + 3, label.y + 4];
    if (box[2] < 0 || box[0] > W || box[3] < 0 || box[1] > H) continue;
    if (placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])) continue;
    placed.push(box);
    ctx.fillStyle = `rgba(${INK},${label.alpha})`;
    ctx.textAlign = label.align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, label.x, label.y);
    labelCount++;
  }

  return { hits, drawn, dots, labels: labelCount };
}

// ------------------------------------------------------------------ the plane

/**
 * The shared coordinate grid, anchored to the Canvas itself so it is the
 * same plane at every depth. Finer lines fade in as coarser ones spread out.
 */
function drawGrid(ctx: CanvasRenderingContext2D, ox: number, oy: number, rootR: number, W: number, H: number, lensOn: boolean) {
  if (!Number.isFinite(rootR) || rootR <= 0 || rootR > 1e12) return;
  const k = 1 - PARALLAX; // the grid is the deepest layer
  const cx = W / 2;
  const cy = H / 2;
  const gx = cx + (ox - cx) * k;
  const gy = cy + (oy - cy) * k;
  for (let level = 0; level < 40; level++) {
    const spacing = (0.25 / Math.pow(4, level)) * rootR * k;
    if (spacing > 1400) continue;
    if (spacing < 16) break;
    const alpha = (lensOn ? 0.042 : 0.03) * smooth(16, 80, spacing) * (1 - smooth(500, 1400, spacing));
    if (alpha < 0.002) continue;
    ctx.beginPath();
    const firstX = gx - Math.floor(gx / spacing) * spacing;
    for (let x = firstX; x <= W; x += spacing) {
      const xr = Math.round(x) + 0.5;
      ctx.moveTo(xr, 0);
      ctx.lineTo(xr, H);
    }
    const firstY = gy - Math.floor(gy / spacing) * spacing;
    for (let y = firstY; y <= H; y += spacing) {
      const yr = Math.round(y) + 0.5;
      ctx.moveTo(0, yr);
      ctx.lineTo(W, yr);
    }
    ctx.strokeStyle = `rgba(${INK},${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ------------------------------------------------------------------ points

/**
 * An idea's point: a small concentration of ink with a few loose grains and a
 * soft halo — never a UI button. Twins carry a pale bead at their heart.
 */
function drawPoint(
  ctx: CanvasRenderingContext2D,
  node: ShadowProjection,
  px: number,
  py: number,
  R: number,
  e: number,
  input: RenderInput,
  selected: boolean,
  hovered: boolean,
  seed: number,
  reveal: number
) {
  const { lensOn, time } = input;
  const visibility = lensOn ? 1 : 0.14 + 0.86 * smooth(2.5, 26, R);
  const dead = node.kind === 'dead_end' || node.life === 'ended';
  const dormant = node.life === 'dormant';
  const backed = node.isTwin && input.isBacked(node.id);

  if (!node.perceivable || reveal < 1) {
    // Something is here, but not for you yet: a smudge without a centre.
    const veil = node.perceivable ? 1 - reveal : 1;
    const r = 2.5 + Math.min(16, R * 0.07);
    const breathe = 0.85 + 0.15 * Math.sin(time * 0.0011 + seed * 17);
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 2.4 * breathe);
    g.addColorStop(0, `rgba(${INK},${0.07 * e * visibility * veil})`);
    g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(px - r * 2.5, py - r * 2.5, r * 5, r * 5);
    if (selected || hovered) focusRing(ctx, px, py, r + 5, time, selected ? 0.5 : 0.28);
    if (!node.perceivable) return;
    ctx.globalAlpha = reveal;
  }

  const tint = (node.kind === 'evidence' || node.kind === 'media') && node.evidence?.[0] ? (MEDIA_TINT[node.evidence[0].medium] ?? INK) : backed ? FOCUS : INK;
  const a = Math.min(0.95, e * visibility * (0.42 + 0.5 * node.vitality) * (dead ? 0.38 : dormant ? 0.62 : 1));

  if (R < 3) {
    const s = R < 1.2 ? 1 : 1.5;
    ctx.fillStyle = `rgba(${tint},${a * (lensOn ? 0.9 : 0.7)})`;
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
    if (selected || hovered) focusRing(ctx, px, py, 6, time, selected ? 0.55 : 0.3);
    ctx.globalAlpha = 1;
    return;
  }

  // Halo: the ink has spread a little into the paper.
  const halo = 3 + 9 * smooth(4, 90, R) + (node.isTwin ? 3 : 0);
  if (R >= 5) {
    const g = ctx.createRadialGradient(px, py, 0, px, py, halo * 2.2);
    g.addColorStop(0, `rgba(${tint},${0.11 * a})`);
    g.addColorStop(1, `rgba(${tint},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(px - halo * 2.2, py - halo * 2.2, halo * 4.4, halo * 4.4);
  }

  // Core. Living things breathe, very slightly.
  const breath = node.vitality > 0.3 && !dead ? Math.sin(time * 0.0014 + seed * 30) * 0.18 * node.vitality : 0;
  const core = (dead ? 0.55 : 0.8) + 1.5 * smooth(3, 60, R) + (node.isTwin ? 0.7 : 0) + breath;
  ctx.beginPath();
  ctx.arc(px, py, core, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${tint},${a})`;
  ctx.fill();

  // Loose grains around the core: ink, not a button.
  if (R >= 14 && !dead) {
    const ga = a * 0.42 * smooth(14, 44, R);
    const count = 3 + Math.floor(seed * 4);
    ctx.fillStyle = `rgba(${tint},${ga})`;
    for (let g = 0; g < count; g++) {
      const angle = seed * 50 + g * 2.1 + Math.sin(time * 0.00023 + g * 1.7) * 0.25;
      const distance = core * (1.7 + grain(g, seed) * 2);
      ctx.fillRect(px + Math.cos(angle) * distance - 0.45, py + Math.sin(angle) * distance - 0.45, 0.9, 0.9);
    }
  }

  // A Twin holds its own world: a pale bead at its heart.
  if (node.isTwin && R >= 8) {
    ctx.beginPath();
    ctx.arc(px, py, core * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${PAPER_RGB},${0.85 * smooth(8, 30, R)})`;
    ctx.fill();
  }

  if (selected || hovered) focusRing(ctx, px, py, core + 6 + Math.min(6, R * 0.02), time, selected ? 0.55 : 0.3);
  ctx.globalAlpha = 1;
}

/** Focus is a ring of grains that slowly turns, not an outline. */
function focusRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number, alpha: number) {
  const count = Math.max(10, Math.min(28, Math.round(r * 1.1)));
  const turn = time * 0.00018;
  ctx.fillStyle = `rgba(${FOCUS},${alpha})`;
  for (let i = 0; i < count; i++) {
    const a = turn + (i / count) * Math.PI * 2;
    const rr = r + Math.sin(i * 2.3 + time * 0.001) * 0.6;
    ctx.fillRect(x + Math.cos(a) * rr - 0.6, y + Math.sin(a) * rr - 0.6, 1.2, 1.2);
  }
}

/**
 * The ink drop. As you approach an idea its ink swells to fill the view, then
 * thins as you pass inside and its own field takes over. Purely a function
 * of how close you are, so stopping halfway stops halfway.
 */
function drawInkDrop(ctx: CanvasRenderingContext2D, px: number, py: number, R: number, e: number, side: number, seed: number) {
  const t = R / side;
  if (t < 0.1 || t > 1.8) return;
  const swell = smooth(0.1, 0.42, t) * (1 - smooth(0.5, 1.8, t));
  const alpha = 0.05 * swell * e;
  if (alpha < 0.002) return;
  const r = R * (0.75 + 0.1 * seed);
  const g = ctx.createRadialGradient(px, py, 0, px, py, r);
  g.addColorStop(0, `rgba(${INK},${alpha})`);
  g.addColorStop(0.55, `rgba(${INK},${alpha * 0.35})`);
  g.addColorStop(1, `rgba(${INK},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(px - r, py - r, r * 2, r * 2);
}

function drawConstellationSeed(ctx: CanvasRenderingContext2D, node: ShadowProjection, px: number, py: number, R: number, e: number, input: RenderInput, labels: Label[]) {
  // From afar a creator's cluster is one speck, denser for busier creators. It
  // hands over to the individual ideas as they become visible.
  const speck = 1 - smooth(10, 30, R);
  const focus = node.id === input.selectedId || node.id === input.hoverId;
  if (speck > 0.01) {
    const alpha = ((input.lensOn ? 0.3 : 0.08) + Math.min(0.24, node.childCount * 0.02) * (input.lensOn ? 1 : 0.35)) * speck * e;
    const size = Math.max(1.1, Math.min(3, R * 0.7));
    ctx.fillStyle = `rgba(${INK},${focus ? 0.7 : alpha})`;
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
  }
  if (focus) focusRing(ctx, px, py, Math.max(6, Math.min(R * 0.4, 30)), input.time, 0.45);
  const a = smooth(40, 110, R) * (1 - smooth(input.viewport.height * 1.2, input.viewport.height * 2.5, R));
  if (a > 0.02) {
    labels.push({ text: node.title ?? '', x: px + 7, y: py - 6, size: 10.5, alpha: 0.42 * a * e, priority: 1000 + R, mono: true, weight: 500, align: 'left' });
  }
}

function drawDensity(ctx: CanvasRenderingContext2D, node: ShadowProjection, px: number, py: number, R: number, lensOn: boolean) {
  const disks = densityDisks(node);
  if (!disks.length || R < 4) return 0;
  const cap = Math.min(disks.length, Math.max(3, Math.floor(R * R * 0.02)), 1500);
  const step = disks.length / cap;
  ctx.fillStyle = `rgba(${INK},${(lensOn ? 0.24 : 0.07) * smooth(4, 14, R)})`;
  for (let i = 0; i < cap; i++) {
    const disk = disks[Math.floor(i * step)];
    const size = Math.max(0.9, Math.min(2.4, disk.r * R * 0.5));
    ctx.fillRect(px + disk.x * R - size / 2, py + disk.y * R - size / 2, size, size);
  }
  return cap;
}

// ------------------------------------------------------------------ filaments

interface FilamentStyle {
  alpha: number;
  /** 0..1: fragmented grains → a nearly continuous thread. */
  continuity: number;
  seed: number;
  time: number;
  taper: 'none' | 'dead' | 'veiled';
  focus: boolean;
  startGap: number;
  endGap: number;
  /** Extra sideways bow, for threads that are not growth. */
  bow?: number;
}

/**
 * One hair-thin thread of grains along a slightly asymmetric curve that sways
 * almost imperceptibly. Returns the number of grains drawn.
 */
function drawFilament(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, style: FilamentStyle) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const D = Math.hypot(dx, dy);
  if (D < 5 || style.alpha < 0.004) return 0;
  const nx = -dy / D;
  const ny = dx / D;
  const s = style.seed;
  // Asymmetric bend: sometimes a C, sometimes an S. Never a straight connector.
  const sway = Math.sin(style.time * 0.00042 + s * 13) * 0.028;
  const b1 = (grain(1, s) - 0.5) * 0.55 + sway + (style.bow ?? 0);
  const b2 = b1 * (0.3 + grain(2, s) * 0.9) * (grain(3, s) < 0.3 ? -1 : 1) - sway * 0.6;
  const c1x = x0 + dx * 0.3 + nx * D * b1;
  const c1y = y0 + dy * 0.3 + ny * D * b1;
  const c2x = x0 + dx * 0.7 + nx * D * b2;
  const c2y = y0 + dy * 0.7 + ny * D * b2;

  const continuity = style.continuity;
  const gap = (1.6 + (1 - continuity) * 5) * dotScale;
  const count = Math.min(900, Math.ceil(D / gap));
  const t0 = Math.min(0.45, style.startGap / D);
  const t1 = style.taper === 'dead' ? 0.8 : style.taper === 'veiled' ? 0.58 : 1 - Math.min(0.45, style.endGap / D);
  const keep = 0.28 + 0.72 * continuity;
  const size = 0.75 + 0.5 * continuity;
  const rgb = style.focus ? FOCUS : INK;
  const baseAlpha = Math.min(0.85, style.alpha * (style.focus ? 1.6 : 1));
  let drawn = 0;
  let bucket = -1;

  for (let i = 0; i <= count; i++) {
    if (grain(i, s) > keep) continue;
    const t = t0 + ((t1 - t0) * i) / count;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1;
    const y = u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1;
    // Ends are softer than the middle; dead ends and veiled parts fade out.
    const along = (t - t0) / Math.max(1e-6, t1 - t0);
    let envelope = smooth(0, 0.12, along);
    if (style.taper === 'dead') envelope *= Math.pow(1 - along, 1.6);
    else if (style.taper === 'veiled') envelope *= Math.pow(1 - along, 2.2);
    else envelope *= 1 - 0.35 * smooth(0.85, 1, along);
    const level = Math.round(envelope * 8);
    if (level !== bucket) {
      bucket = level;
      ctx.fillStyle = `rgba(${rgb},${(baseAlpha * level) / 8})`;
    }
    if (level === 0) continue;
    const dotSize = style.taper === 'dead' ? size * (0.45 + 0.55 * envelope) : size;
    ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
    drawn++;
  }

  // A thread returned to again and again carries a second, finer strand beside it.
  if (continuity > 0.72 && style.taper === 'none' && D > 40) {
    ctx.fillStyle = `rgba(${rgb},${baseAlpha * 0.4})`;
    const offset = 1.4 + grain(9, s);
    for (let i = 0; i <= count; i += 2) {
      if (grain(i + 5000, s) > 0.55) continue;
      const t = t0 + ((t1 - t0) * i) / count;
      const u = 1 - t;
      const wave = Math.sin(t * 9 + s * 20) * offset;
      const x = u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1 + nx * wave;
      const y = u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1 + ny * wave;
      ctx.fillRect(x - 0.4, y - 0.4, 0.8, 0.8);
      drawn++;
    }
  }
  return drawn;
}

/**
 * History as a thread trailing into the point: oldest farthest away, now at
 * the point. Revisions are grains on it, the creator's returns are heavier
 * grains, evidence sits beside it, a dead end is a short side-thread that
 * fades out, and a stretch where nothing happened is simply missing.
 */
function drawTrail(ctx: CanvasRenderingContext2D, node: ShadowProjection, px: number, py: number, R: number, e: number, time: number, now: number, seed: number, lensOn: boolean) {
  const history = node.history!;
  if (!history.length) return 0;
  const a = e * smooth(7, 60, R) * (lensOn ? 1 : 0.35 + 0.65 * smooth(10, 40, R));
  if (a < 0.01) return 0;
  let began = Number.POSITIVE_INFINITY;
  for (const event of history) began = Math.min(began, Date.parse(event.at));
  const span = Math.max(DAY_MS, now - began);
  const heading = growthAngle(node.id) + Math.PI;
  const length = R * 0.5;
  const at = (u: number): [number, number] => {
    const angle = heading + 0.6 * Math.sin(u * 2.6 + seed * 6) * u + 0.3 * u + Math.sin(time * 0.0003 + seed * 9) * 0.02;
    return [px + Math.cos(angle) * length * u, py + Math.sin(angle) * length * u];
  };
  const uOf = (t: number) => Math.max(0, Math.min(1, (now - t) / span));

  // Quiet stretches (dormant → revived) are gaps in the thread.
  const quiet: Array<[number, number]> = [];
  let dormantAt: number | null = null;
  for (const event of history) {
    const t = Date.parse(event.at);
    if (event.type === 'dormant') dormantAt = t;
    if (event.type === 'revived' && dormantAt !== null) {
      quiet.push([uOf(t), uOf(dormantAt)]);
      dormantAt = null;
    }
  }
  if (dormantAt !== null) quiet.push([0, uOf(dormantAt)]);

  let drawn = 0;
  const steps = Math.min(320, Math.floor(length / (3.4 * dotScale)));
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    if (quiet.some(([q0, q1]) => u >= q0 && u <= q1)) continue;
    if (grain(i, seed + 3) > 0.7) continue;
    const [x, y] = at(u);
    ctx.fillStyle = `rgba(${INK},${a * 0.2 * (1 - u * 0.55)})`;
    ctx.fillRect(x - 0.4, y - 0.4, 0.8, 0.8);
    drawn++;
  }

  const normalAt = (u: number): [number, number] => {
    const [x0, y0] = at(Math.max(0, u - 0.01));
    const [x1, y1] = at(Math.min(1, u + 0.01));
    const d = Math.hypot(x1 - x0, y1 - y0) || 1;
    return [-(y1 - y0) / d, (x1 - x0) / d];
  };
  const detail = smooth(20, 90, R);

  history.forEach((event: HistoryEvent, index) => {
    const u = uOf(Date.parse(event.at));
    const [x, y] = at(u);
    const age = 1 - u * 0.5;
    const side = grain(index, seed) < 0.5 ? 1 : -1;
    switch (event.type) {
      case 'revised':
        ctx.fillStyle = `rgba(${INK},${a * 0.5 * age})`;
        ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
        break;
      case 'returned':
      case 'revived': {
        const [nx, ny] = normalAt(u);
        ctx.beginPath();
        ctx.arc(x + nx * side * 1.2, y + ny * side * 1.2, event.type === 'revived' ? 1.8 : 1.3, 0, Math.PI * 2);
        ctx.fillStyle = event.type === 'revived' ? `rgba(${FOCUS},${a * 0.55})` : `rgba(${INK},${a * 0.55 * age})`;
        ctx.fill();
        break;
      }
      case 'evidence': {
        const [nx, ny] = normalAt(u);
        ctx.fillStyle = `rgba(${INK},${a * 0.5 * age})`;
        ctx.fillRect(x + nx * side * 4 - 1, y + ny * side * 4 - 1, 2, 2);
        break;
      }
      case 'branched':
      case 'split':
      case 'dead_end': {
        if (detail < 0.05) break;
        // A short side-thread; a dead end fades out, a branch keeps going.
        const [nx, ny] = normalAt(u);
        const reach = Math.min(28, 6 + R * 0.05);
        const n = Math.round(reach / 2.4);
        for (let k = 1; k <= n; k++) {
          const f = k / n;
          const fade = event.type === 'dead_end' ? 1 - f : 1 - f * 0.4;
          ctx.fillStyle = `rgba(${INK},${a * 0.4 * fade * detail * age})`;
          const curl = f * f * 0.5 * side;
          ctx.fillRect(x + (nx * side + ny * curl) * reach * f - 0.45, y + (ny * side - nx * curl) * reach * f - 0.45, 0.9, 0.9);
          drawn++;
        }
        break;
      }
      case 'realized':
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${INK},${a * 0.7})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PAPER_RGB},0.9)`;
        ctx.fill();
        break;
      case 'converged': {
        const [nx, ny] = normalAt(u);
        ctx.fillStyle = `rgba(${FOCUS},${a * 0.4})`;
        for (let k = 1; k <= 4; k++) ctx.fillRect(x + nx * side * k * 2.2 - 0.45, y + ny * side * k * 2.2 - 0.45, 0.9, 0.9);
        break;
      }
      case 'visited': {
        const [nx, ny] = normalAt(u);
        ctx.fillStyle = `rgba(${INK},${a * 0.18})`;
        ctx.fillRect(x - nx * side * 6 - 0.5, y - ny * side * 6 - 0.5, 1, 1);
        break;
      }
      default:
        break;
    }
    drawn++;
  });
  return drawn;
}

// ------------------------------------------------------------------ words

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  let used = 0;
  for (const word of words) {
    const next = current ? current + ' ' + word : word;
    if (ctx.measureText(next).width > width && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else current = next;
    used++;
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (used < words.length && lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\S*$/, '') + '…';
  return lines;
}

function kindWords(node: ShadowProjection) {
  switch (node.kind) {
    case 'experiment':
      return 'experiment';
    case 'dead_end':
      return 'a path that stopped';
    case 'question':
      return 'open question';
    case 'revision':
      return 'revision';
    case 'evidence':
      return 'evidence';
    case 'media':
      return 'artifact';
    case 'component':
      return 'part';
    case 'branch':
      return node.isTwin ? 'branch · its own idea now' : 'branch';
    case 'thought':
      return 'note';
    default:
      return '';
  }
}

/** Close enough to read: the idea's own words beside its point, never on a card. */
function drawReading(ctx: CanvasRenderingContext2D, reading: Reading, input: RenderInput, placed: Array<[number, number, number, number]>) {
  const { node, px, py, R, alpha } = reading;
  const W = input.viewport.width;
  const H = input.viewport.height;
  const leaf = node.childCount === 0;
  const width = Math.min(300, Math.max(170, R * 0.55));
  // Words sit on the side away from where the idea grows, unless there is no room there.
  const heading = growthAngle(node.id);
  const preferLeft = Math.cos(heading) > 0.2;
  const leftFits = px - 16 - width > 8;
  const rightFits = px + 16 + width < W - 8;
  const left = preferLeft ? leftFits || !rightFits : !rightFits && leftFits;
  let x = left ? px - 16 - width : px + 16;
  x = Math.max(8, Math.min(W - width - 8, x));
  const titleSize = 12.5 + 4 * smooth(150, 700, R);
  const textSize = 12;
  const blocks: Array<{ text: string; size: number; weight: number; alpha: number; mono?: boolean; lines: number }> = [];
  const kind = node.kind !== 'facet' && node.kind !== 'twin' ? kindWords(node) : '';
  if (kind) blocks.push({ text: kind, size: 9.5, weight: 500, alpha: 0.42, mono: true, lines: 1 });
  blocks.push({ text: node.title ?? '', size: titleSize, weight: 620, alpha: 0.86, lines: 2 });
  const gistAlpha = smooth(220, 320, R);
  if (node.gist && gistAlpha > 0.02) blocks.push({ text: node.gist, size: textSize, weight: 420, alpha: 0.56 * gistAlpha, lines: 3 });
  const bodyAlpha = smooth(280, 420, R);
  if (leaf && node.body && bodyAlpha > 0.02) blocks.push({ text: node.body, size: textSize, weight: 420, alpha: 0.7 * bodyAlpha, lines: 7 });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const laid: Array<{ lines: string[]; size: number; weight: number; alpha: number; mono?: boolean }> = [];
  let total = 0;
  for (const block of blocks) {
    ctx.font = `${block.weight} ${block.size}px ${block.mono ? input.fonts.mono : input.fonts.sans}`;
    const lines = wrap(ctx, block.text, width, block.lines);
    laid.push({ lines, size: block.size, weight: block.weight, alpha: block.alpha, mono: block.mono });
    total += lines.length * block.size * 1.32 + block.size * 0.5;
  }
  const evidence = leaf ? node.evidence?.[0] : undefined;
  const evidenceHeight = evidence ? 56 * bodyAlpha : 0;
  total += evidenceHeight;
  let y = Math.max(70, Math.min(H - total - 16, py - Math.min(26, total / 2)));
  const box: [number, number, number, number] = [x - 4, y - 4, x + width + 4, y + total + 4];
  if (placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])) return;
  placed.push(box);
  for (const block of laid) {
    ctx.font = `${block.weight} ${block.size}px ${block.mono ? input.fonts.mono : input.fonts.sans}`;
    ctx.fillStyle = `rgba(${INK},${block.alpha * alpha})`;
    for (const text of block.lines) {
      ctx.fillText(text, x, y);
      y += block.size * 1.32;
    }
    y += block.size * 0.5;
  }
  if (evidence && evidenceHeight > 12) drawEvidence(ctx, evidence, node.id, x, y + 2, width, evidenceHeight - 6, alpha * bodyAlpha, input.fonts.mono);
}

/** Evidence is drawn as what it is — in grains, like everything else — never as a stock picture. */
function drawEvidence(ctx: CanvasRenderingContext2D, evidence: EvidenceRef, id: string, x: number, y: number, w: number, h: number, alpha: number, mono: string) {
  const tint = MEDIA_TINT[evidence.medium] ?? INK;
  const seed = hashString(id);
  const plot = h - 14;
  if (evidence.series?.length && plot > 8) {
    const series = evidence.series;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const steps = Math.floor(w / 2.2);
    ctx.fillStyle = `rgba(${tint},${0.75 * alpha})`;
    for (let i = 0; i <= steps; i++) {
      const f = (i / steps) * (series.length - 1);
      const k = Math.floor(f);
      const v = series[k] + (series[Math.min(series.length - 1, k + 1)] - series[k]) * (f - k);
      ctx.fillRect(x + (i / steps) * w - 0.55, y + plot - ((v - min) / range) * plot - 0.55, 1.1, 1.1);
    }
  } else if (evidence.medium === 'audio' && plot > 8) {
    const bars = Math.floor(w / 4);
    ctx.fillStyle = `rgba(${tint},${0.6 * alpha})`;
    for (let i = 0; i < bars; i++) {
      const n = Math.abs(Math.sin(seed * 0.001 + i * 0.7) * Math.sin(i * 0.23 + seed)) * 0.85 + 0.1;
      const envelope = Math.sin((i / bars) * Math.PI) * 0.8 + 0.2;
      const bh = Math.max(1, n * envelope * plot);
      for (let yy = -bh / 2; yy <= bh / 2; yy += 2) ctx.fillRect(x + i * 4, y + plot / 2 + yy, 1.1, 1.1);
    }
  } else if (plot > 8) {
    ctx.fillStyle = `rgba(${INK},${0.22 * alpha})`;
    const rows = Math.min(5, Math.floor(plot / 7));
    for (let r = 0; r < rows; r++) {
      const lw = w * (0.5 + (((seed >> (r * 3)) & 7) / 7) * 0.45);
      for (let xx = 0; xx < lw; xx += 2.4) ctx.fillRect(x + xx, y + r * 7, 1.1, 1.1);
    }
  }
  ctx.font = `500 9.5px ${mono}`;
  ctx.fillStyle = `rgba(${INK},${0.42 * alpha})`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(evidence.label, x, y + h - 11);
}
