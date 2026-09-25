import { rngFor } from './rng';

/**
 * Deterministic placement of children inside a parent's local unit disk.
 *
 * Every node's own point sits at the origin (0, 0) of its field. Its children
 * are placed around that point; each child owns an invisible disk (x, y, r)
 * that is the extent of *its* field, and the camera enters a child when that
 * disk fills enough of the screen. The disks are never drawn.
 *
 * Three styles:
 *   territory — a few huge overlapping regions (the top of the Canvas)
 *   scatter   — many points spread over a region (a territory's creators)
 *   growth    — an idea's structure: irregular, asymmetric, grown outward
 *               from the parent's point, with alternatives forking off the
 *               thing they came from. Never radial, never evenly spaced.
 */

export interface Disk {
  x: number;
  y: number;
  r: number;
}

export type LayoutStyle = 'scatter' | 'territory';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function layoutDisks(count: number, seed: string, style: LayoutStyle): Disk[] {
  if (count <= 0) return [];
  if (style === 'territory') return territories(count, seed);
  return scatter(count, seed);
}

/**
 * The direction an idea grows in. Its history trails away in the opposite
 * direction, so structure and time never pile on top of each other. Shared by
 * the layout and the renderer.
 */
export function growthAngle(id: string) {
  return rngFor('growth-angle', id)() * Math.PI * 2;
}

/**
 * Large overlapping regions for the top of the Canvas. They overlap on purpose:
 * the Canvas should read as one continuous field, not a set of discs.
 */
function territories(count: number, seed: string): Disk[] {
  const rng = rngFor('territory', seed);
  const disks: Disk[] = [];
  const turn = rng() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const angle = turn + (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.5;
    const radius = 0.34 + (rng() - 0.5) * 0.12;
    disks.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, r: 0.5 + rng() * 0.08 });
  }
  return disks;
}

/**
 * Sunflower packing with jitter, for places holding many things. Density
 * falls off toward the edge so neighbouring regions blend instead of ending
 * in a hard rim.
 */
function scatter(count: number, seed: string): Disk[] {
  const rng = rngFor('scatter', seed);
  const spread = 0.88;
  const spacing = spread * Math.sqrt(Math.PI / count);
  const r = Math.min(0.3, spacing * 0.3);
  const disks: Disk[] = [];
  const turn = rng() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const radius = spread * Math.pow((i + 0.5) / count, 0.62);
    const angle = turn + i * GOLDEN_ANGLE;
    const jitter = spacing * (0.3 + 0.5 * (radius / spread));
    let x = Math.cos(angle) * radius + (rng() - 0.5) * jitter;
    let y = Math.sin(angle) * radius + (rng() - 0.5) * jitter;
    const size = r * (0.75 + rng() * 0.4);
    // Never cross the parent's rim.
    const reach = Math.hypot(x, y) + size;
    if (reach > 0.97) {
      const k = (0.97 - size) / Math.hypot(x, y);
      x *= k;
      y *= k;
    }
    disks.push({ x, y, r: size });
  }
  return disks;
}

export interface GrowthItem {
  /** Index of the earlier sibling this grew from, or -1 for the parent's point. */
  from: number;
  /** 0..1: how much has happened inside it. Heavier things get a little more room. */
  weight: number;
}

const MIN_FROM_ORIGIN = 0.2;
const MAX_REACH = 0.86;

/**
 * Items must be in the order they began. Early things stay close to the
 * point they grew from; later things are further out along the growth.
 */
export function growthLayout(items: GrowthItem[], parentId: string): Disk[] {
  const n = items.length;
  if (n === 0) return [];
  const rng = rngFor('growth', parentId);
  const heading = growthAngle(parentId);
  // Wider fan for more things, but never a full circle: growth has a direction.
  const spread = Math.min(2.5, 0.9 + 0.22 * n);
  const points: Array<{ x: number; y: number }> = [];
  const forks = new Array<number>(n).fill(0);

  items.forEach((item, index) => {
    const from = item.from >= 0 && item.from < index ? item.from : -1;
    if (from === -1) {
      const bias = rng() * 2 - 1;
      const angle = heading + spread * bias * Math.abs(bias) * 0.9 + (rng() - 0.5) * 0.35;
      const distance = 0.34 + 0.42 * (0.4 * rng() + 0.6 * ((index + 0.5) / n));
      points.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
      return;
    }
    const base = points[from];
    const outward = Math.atan2(base.y, base.x);
    const side = (forks[from] + (rng() < 0.5 ? 0 : 1)) % 2 === 0 ? 1 : -1;
    forks[from] += 1;
    let angle = outward + side * (0.35 + 0.55 * rng());
    const step = 0.2 + 0.12 * rng();
    let x = base.x + Math.cos(angle) * step;
    let y = base.y + Math.sin(angle) * step;
    if (Math.hypot(x, y) > MAX_REACH) {
      // Out of room: curl back along the rim instead of leaving the field.
      angle = outward + side * (1.6 + 0.4 * rng());
      x = base.x + Math.cos(angle) * step;
      y = base.y + Math.sin(angle) * step;
    }
    points.push({ x, y });
  });

  // Relax so nothing sits on anything else, keeping the growth's shape.
  const minDistance = Math.min(0.3, 1.05 / Math.sqrt(n + 3));
  for (let iteration = 0; iteration < 48; iteration++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        const d = Math.hypot(dx, dy) || 1e-6;
        if (d < minDistance) {
          const push = (minDistance - d) / 2 / d;
          points[i].x -= dx * push;
          points[i].y -= dy * push;
          points[j].x += dx * push;
          points[j].y += dy * push;
        }
      }
    }
    for (const point of points) {
      const d = Math.hypot(point.x, point.y) || 1e-6;
      if (d > MAX_REACH) {
        point.x *= MAX_REACH / d;
        point.y *= MAX_REACH / d;
      } else if (d < MIN_FROM_ORIGIN) {
        point.x *= MIN_FROM_ORIGIN / d;
        point.y *= MIN_FROM_ORIGIN / d;
      }
    }
  }

  return points.map((point, i) => {
    let nearest = Number.POSITIVE_INFINITY;
    for (let j = 0; j < n; j++) if (j !== i) nearest = Math.min(nearest, Math.hypot(points[j].x - point.x, points[j].y - point.y));
    const fromOrigin = Math.hypot(point.x, point.y);
    const room = Math.min(nearest * 0.48, fromOrigin - 0.07, 0.97 - fromOrigin);
    const r = Math.max(0.045, Math.min(0.26, room)) * (0.86 + 0.14 * items[i].weight);
    return { x: point.x, y: point.y, r };
  });
}
