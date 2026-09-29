// Content and relationships -> the structure the Drop moves through.
// Positions come from a deterministic force layout of the relationships and
// groups; strand grip and a work's pull come from how connected things are.
// Nothing here chooses a destination.

export const WORLD = { W: 1000, H: 1800 };

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAD_X = 110;
const PAD_Y = 160;

// Deterministic: the same works and relations always give the same layout,
// so a reload shows the same web and a changed relation is the only cause
// of a changed web.
export function layout(works, relations, { W, H } = WORLD) {
  // Each work has a stable home derived from its identity; relationships pull
  // works away from home toward each other. A changed relationship therefore
  // reshapes the web around it instead of reshuffling everything.
  const home = new Map();
  const pos = new Map();
  for (const w of works) {
    const r = rng(hashString(w.id));
    const h = { x: PAD_X + r() * (W - 2 * PAD_X), y: PAD_Y + r() * (H - 2 * PAD_Y) };
    home.set(w.id, h);
    pos.set(w.id, { ...h });
  }
  const ids = works.map((w) => w.id);
  const groupOf = new Map(works.map((w) => [w.id, w.group]));
  const REST = 330;
  const TETHER = 0.012;
  for (let iter = 0; iter < 600; iter++) {
    const cool = 1 - iter / 600;
    const f = new Map(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i]);
        const b = pos.get(ids[j]);
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = 1;
          dy = 0;
          d2 = 1;
        }
        const d = Math.sqrt(d2);
        let k = 160000 / d2;
        if (groupOf.get(ids[i]) && groupOf.get(ids[i]) === groupOf.get(ids[j])) {
          k -= 0.004 * (d - 420);
        }
        f.get(ids[i]).x -= (k * dx) / d;
        f.get(ids[i]).y -= (k * dy) / d;
        f.get(ids[j]).x += (k * dx) / d;
        f.get(ids[j]).y += (k * dy) / d;
      }
    }
    for (const rel of relations) {
      const a = pos.get(rel.from);
      const b = pos.get(rel.to);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const k = 0.03 * (d - REST);
      f.get(rel.from).x += (k * dx) / d;
      f.get(rel.from).y += (k * dy) / d;
      f.get(rel.to).x -= (k * dx) / d;
      f.get(rel.to).y -= (k * dy) / d;
    }
    for (const id of ids) {
      const p = pos.get(id);
      const h = home.get(id);
      const v = f.get(id);
      v.x += TETHER * (h.x - p.x);
      v.y += TETHER * (h.y - p.y);
      const m = Math.hypot(v.x, v.y);
      const step = Math.min(m, 30 * cool + 1);
      if (m > 0) {
        p.x += (v.x / m) * step;
        p.y += (v.y / m) * step;
      }
      p.x = Math.min(W - PAD_X, Math.max(PAD_X, p.x));
      p.y = Math.min(H - PAD_Y, Math.max(PAD_Y, p.y));
    }
  }
  return pos;
}

// Builds the physical world. `positions` may be animated positions while the
// web re-forms; otherwise the layout of the given works/relations is used.
export function buildWorld(works, relations, positions = layout(works, relations)) {
  const byId = new Map(works.map((w) => [w.id, w]));
  const live = relations.filter((r) => byId.has(r.from) && byId.has(r.to) && r.from !== r.to);
  const degree = new Map(works.map((w) => [w.id, 0]));
  for (const r of live) {
    degree.set(r.from, degree.get(r.from) + 1);
    degree.set(r.to, degree.get(r.to) + 1);
  }
  const nodes = works.map((w) => {
    const p = positions.get(w.id);
    const deg = degree.get(w.id);
    return { id: w.id, x: p.x, y: p.y, r: 24 + 3 * deg, degree: deg, group: w.group };
  });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const strands = live.map((r) => {
    const a = nodeById.get(r.from);
    const b = nodeById.get(r.to);
    const same = a.group && a.group === b.group ? 0.25 : 0;
    const tension = Math.min(1, (a.degree + b.degree - 2) / 6 + same);
    return {
      id: r.id,
      a: a.id,
      b: b.id,
      ax: a.x,
      ay: a.y,
      bx: b.x,
      by: b.y,
      tension,
      grip: 230 + 170 * tension,
    };
  });
  const xs = nodes.map((n) => n.x);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : WORLD.W;
  return { W: WORLD.W, H: WORLD.H, minX, maxX, nodes, nodeById, strands, strandById: new Map(strands.map((s) => [s.id, s])) };
}
