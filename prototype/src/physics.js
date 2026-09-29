// The Drop's motion. Pure and deterministic: given the same world, state and
// input it always does the same thing. Nothing in here records a choice;
// motion events (catch, pierce, transfer, leave, slip) are motion only.

export const PHYS = {
  DT: 1 / 120,
  G: 900, // gravity, px/s^2 (down is +y)
  DRAG: 2.5, // free-fall drag; terminal speed about G/DRAG = 360 px/s
  DRIFT: 1000, // full thumb drift acceleration; slightly more than G, so the Drop can rise
  PULL_R: 380, // how far a work's pull reaches
  PULL: 45, // pull per relationship a work has
  EDGE_LEAN: 220,
  STRAND_FRICTION: 0.9,
  DETACH: 0.55, // drift across a strand beyond this lets go of it
  STALL_SPEED: 22,
  SETTLE_R: 260, // touch/hold settles around a work this close
  NEAR_R: 150, // Dew and Drop apply to a work this close
  SETTLE_K: 14,
  SETTLE_C: 7.5,
};

export function newDrop(x = 500, y = 0) {
  return { x, y, vx: 0, vy: 0, mode: 'fall', strandId: null, shift: 0, s: 0, vt: 0, anchorId: null, side: 1, ignore: {}, t: 0, still: 0, events: [] };
}

export function cloneDrop(d) {
  return { ...d, ignore: { ...d.ignore }, events: d.events.slice() };
}

export function wrapDy(dy, H) {
  return ((((dy + H / 2) % H) + H) % H) - H / 2;
}

// Nearest work to a point, with its position in the point's own tile.
export function nearestWork(world, x, y) {
  let best = null;
  for (const n of world.nodes) {
    const dx = n.x - x;
    const dy = wrapDy(n.y - y, world.H);
    const d = Math.hypot(dx, dy);
    if (!best || d < best.d) best = { node: n, d, x: x + dx, y: y + dy };
  }
  return best;
}

function emit(d, type, extra) {
  d.events.push({ type, t: d.t, ...extra });
  if (d.events.length > 60) d.events.shift();
}

function ignored(d, id) {
  return d.ignore[id] !== undefined && d.ignore[id] > d.t;
}

function strandGeom(s, shift) {
  const ax = s.ax;
  const ay = s.ay + shift;
  const bx = s.bx;
  const by = s.by + shift;
  const L = Math.hypot(bx - ax, by - ay) || 1;
  const ux = (bx - ax) / L;
  const uy = (by - ay) / L;
  return { ax, ay, bx, by, L, ux, uy, nx: -uy, ny: ux };
}

function segmentHit(p0x, p0y, p1x, p1y, g) {
  const rx = p1x - p0x;
  const ry = p1y - p0y;
  const sx = g.bx - g.ax;
  const sy = g.by - g.ay;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const qx = g.ax - p0x;
  const qy = g.ay - p0y;
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * ry - qy * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, u };
}

function driftOf(input) {
  const x = input?.drift?.x || 0;
  const y = input?.drift?.y || 0;
  const m = Math.hypot(x, y);
  return m > 1 ? { x: x / m, y: y / m } : { x, y };
}

function walls(d, world, a) {
  // Past the outermost work the web leans gently back in, so a Drop that
  // flies off an edge is not lost in an empty column.
  if (world.minX !== undefined) {
    if (d.x < world.minX - 30) a.x += PHYS.EDGE_LEAN;
    if (d.x > world.maxX + 30) a.x -= PHYS.EDGE_LEAN;
  }
  const m = 40;
  if (d.x < m) a.x += (m - d.x) * 40;
  if (d.x > world.W - m) a.x -= (d.x - (world.W - m)) * 40;
}

function fall(d, world, drift) {
  const { DT, G, DRAG, DRIFT, PULL_R, PULL } = PHYS;
  const a = { x: drift.x * DRIFT - DRAG * d.vx, y: G + drift.y * DRIFT - DRAG * d.vy };
  // Well-connected work pulls a little: density bends the fall.
  for (const n of world.nodes) {
    const dx = n.x - d.x;
    const dy = wrapDy(n.y - d.y, world.H);
    const dist = Math.hypot(dx, dy);
    if (dist < PULL_R && dist > 1) {
      const k = PULL * n.degree * (1 - dist / PULL_R);
      a.x += (k * dx) / dist;
      a.y += (k * dy) / dist;
    }
  }
  walls(d, world, a);
  d.vx += a.x * DT;
  d.vy += a.y * DT;
  const x1 = d.x + d.vx * DT;
  const y1 = d.y + d.vy * DT;

  // Earliest strand crossed on this step.
  let hit = null;
  const tiles = new Set([Math.floor(d.y / world.H), Math.floor(y1 / world.H)]);
  for (const k of tiles) {
    const shift = k * world.H;
    for (const s of world.strands) {
      if (ignored(d, s.id)) continue;
      const g = strandGeom(s, shift);
      const h = segmentHit(d.x, d.y, x1, y1, g);
      if (h && (!hit || h.t < hit.t)) hit = { ...h, s, g, shift };
    }
  }
  if (hit) {
    const { g, s } = hit;
    const vn = d.vx * g.nx + d.vy * g.ny;
    if (Math.abs(vn) <= s.grip) {
      d.mode = 'strand';
      d.strandId = s.id;
      d.shift = hit.shift;
      d.s = hit.u * g.L;
      d.vt = d.vx * g.ux + d.vy * g.uy;
      d.x = g.ax + g.ux * d.s;
      d.y = g.ay + g.uy * d.s;
      d.still = 0;
      emit(d, 'catch', { strandId: s.id });
      return;
    }
    // Too fast to hold: tears through, and the strand still takes some speed.
    d.vx *= 0.8;
    d.vy *= 0.8;
    d.ignore[s.id] = d.t + 0.25;
    emit(d, 'pierce', { strandId: s.id });
  }
  d.x = x1;
  d.y = y1;
  if (d.x < 0) (d.x = 0), (d.vx = Math.abs(d.vx) * 0.3);
  if (d.x > world.W) (d.x = world.W), (d.vx = -Math.abs(d.vx) * 0.3);

  // Motion is always happening: a Drop that has stalled in free fall slides off.
  if (Math.hypot(d.vx, d.vy) < PHYS.STALL_SPEED) {
    d.still += DT;
    if (d.still > 0.5) {
      const near = nearestWork(world, d.x, d.y);
      d.vx += (near && near.x > d.x ? -1 : 1) * 120;
      d.still = 0;
    }
  } else d.still = 0;
}

function leaveStrand(d, g, speed, dirx, diry, ignoreIds, type, extra) {
  d.mode = 'fall';
  d.vx = dirx * speed;
  d.vy = diry * speed;
  for (const id of ignoreIds) d.ignore[id] = d.t + 0.35;
  d.strandId = null;
  d.still = 0;
  emit(d, type, extra);
}

function onStrand(d, world, drift) {
  const { DT, G, DRIFT, STRAND_FRICTION, DETACH } = PHYS;
  const s = world.strandById.get(d.strandId);
  if (!s) {
    // The relationship went away under the Drop: the strand is gone, so it falls.
    d.mode = 'fall';
    d.strandId = null;
    emit(d, 'leave', { reason: 'strand removed' });
    return;
  }
  const g = strandGeom(s, d.shift);
  const dn = drift.x * g.nx + drift.y * g.ny;
  if (Math.abs(dn) > DETACH) {
    const push = Math.sign(dn) * 160;
    d.mode = 'fall';
    d.vx = d.vt * g.ux + g.nx * push;
    d.vy = d.vt * g.uy + g.ny * push;
    d.ignore[s.id] = d.t + 0.35;
    d.strandId = null;
    emit(d, 'leave', { strandId: s.id, reason: 'drift' });
    return;
  }
  const along = (drift.x * DRIFT) * g.ux + (G + drift.y * DRIFT) * g.uy - STRAND_FRICTION * d.vt;
  d.vt += along * DT;
  d.s += d.vt * DT;

  if (Math.abs(d.vt) < PHYS.STALL_SPEED) {
    d.still += DT;
    if (d.still > 0.8) {
      d.x = g.ax + g.ux * d.s;
      d.y = g.ay + g.uy * d.s;
      leaveStrand(d, g, 60, 0, 1, [s.id], 'slip', { strandId: s.id });
      d.ignore[s.id] = d.t + 0.6;
      return;
    }
  } else d.still = 0;

  if (d.s >= 0 && d.s <= g.L) {
    d.x = g.ax + g.ux * d.s;
    d.y = g.ay + g.uy * d.s;
    return;
  }

  // Reached a work where strands meet: continue along whichever strand lies
  // closest to the way the Drop is already going (bent by Drift), or fly off.
  const atB = d.s > g.L;
  const nodeId = atB ? s.b : s.a;
  const node = world.nodeById.get(nodeId);
  const dirx = atB ? g.ux : -g.ux;
  const diry = atB ? g.uy : -g.uy;
  const speed = Math.abs(d.vt);
  d.x = atB ? g.bx : g.ax;
  d.y = atB ? g.by : g.ay;
  let ax = dirx + 0.9 * drift.x;
  let ay = diry + 0.9 * drift.y;
  const am = Math.hypot(ax, ay) || 1;
  ax /= am;
  ay /= am;
  let best = null;
  const atNode = [];
  for (const o of world.strands) {
    if (o.a !== nodeId && o.b !== nodeId) continue;
    atNode.push(o.id);
    if (o.id === s.id || ignored(d, o.id)) continue;
    const og = strandGeom(o, d.shift);
    const outx = o.a === nodeId ? og.ux : -og.ux;
    const outy = o.a === nodeId ? og.uy : -og.uy;
    const score = ax * outx + ay * outy;
    if (!best || score > best.score) best = { o, og, score };
  }
  // Too slow to carry on round a junction: it slips off and gravity takes over.
  if (speed < 45) {
    leaveStrand(d, g, 60, 0, 1, atNode, 'slip', { strandId: s.id, at: node.id });
    return;
  }
  if (best && best.score > 0.25) {
    const v = speed * (0.55 + 0.45 * best.score);
    d.strandId = best.o.id;
    if (best.o.a === nodeId) {
      d.s = 0;
      d.vt = v;
    } else {
      d.s = best.og.L;
      d.vt = -v;
    }
    emit(d, 'transfer', { strandId: best.o.id, from: s.id, at: node.id });
    return;
  }
  leaveStrand(d, g, speed, dirx, diry, atNode, 'leave', { strandId: s.id, at: node.id });
}

function settleToward(d, world, targetX, targetY) {
  const { DT, SETTLE_K, SETTLE_C } = PHYS;
  const ax = SETTLE_K * (targetX - d.x) - SETTLE_C * d.vx;
  const ay = SETTLE_K * (targetY - d.y) - SETTLE_C * d.vy;
  d.vx += ax * DT;
  d.vy += ay * DT;
  d.x += d.vx * DT;
  d.y += d.vy * DT;
}

function restingPlace(d, near) {
  // Beside the work, not on top of it, so it stays readable.
  return { x: near.x + d.side * (near.node.r + 34), y: near.y };
}

// One fixed timestep. input: { drift: {x, y} (length <= 1), hold: boolean }
export function step(d, world, input) {
  const drift = driftOf(input);
  d.t += PHYS.DT;
  // Rest: placed beside a work (from the list view, or after saving an idea).
  // Not a judgment; any touch or drift lets it go.
  if (d.mode === 'rest' && (input?.hold || Math.hypot(drift.x, drift.y) > 0.15)) {
    d.mode = 'fall';
    d.anchorId = null;
  }
  if (d.mode === 'adhered' || d.mode === 'rest') {
    const n = world.nodeById.get(d.anchorId);
    if (!n) {
      d.mode = 'fall';
      d.anchorId = null;
    } else {
      const near = { node: n, x: n.x, y: d.y + wrapDy(n.y - d.y, world.H) };
      const p = restingPlace(d, near);
      settleToward(d, world, p.x, p.y);
      return d;
    }
  }
  if (input?.hold) {
    if (d.mode !== 'settle') {
      d.mode = 'settle';
      d.strandId = null;
      const near = nearestWork(world, d.x, d.y);
      d.side = near && near.x > d.x ? -1 : 1;
    }
    const near = nearestWork(world, d.x, d.y);
    if (near && near.d < PHYS.SETTLE_R) {
      const p = restingPlace(d, near);
      settleToward(d, world, p.x, p.y);
    } else {
      d.vx -= 6 * d.vx * PHYS.DT;
      d.vy -= 6 * d.vy * PHYS.DT;
      d.x += d.vx * PHYS.DT;
      d.y += d.vy * PHYS.DT;
    }
    return d;
  }
  if (d.mode === 'settle') {
    d.mode = 'fall'; // release: movement resumes
    d.still = 0;
  }
  if (d.mode === 'strand') onStrand(d, world, drift);
  else fall(d, world, drift);
  return d;
}

// The work the Drop is near enough to Dew or Drop, if any.
export function reachable(d, world) {
  if (d.mode === 'adhered' || d.mode === 'rest') {
    const n = world.nodeById.get(d.anchorId);
    if (n) return n;
  }
  const near = nearestWork(world, d.x, d.y);
  return near && near.d < PHYS.NEAR_R + near.node.r ? near.node : null;
}

// Places the Drop at rest beside a work, e.g. when reached from the list view.
export function restAt(d, world, workId) {
  const n = world.nodeById.get(workId);
  if (!n) return false;
  d.mode = 'rest';
  d.anchorId = n.id;
  d.strandId = null;
  d.side = n.x > world.W / 2 ? -1 : 1;
  d.x = n.x + d.side * (n.r + 34);
  d.y = n.y + Math.floor(d.y / world.H) * world.H;
  d.vx = 0;
  d.vy = 0;
  return true;
}

// Dew: an explicit decision. The Drop adheres to the work it is near.
export function dew(d, world) {
  const n = reachable(d, world);
  if (!n) return null;
  const near = nearestWork(world, d.x, d.y);
  d.side = near.x > d.x ? -1 : 1;
  d.mode = 'adhered';
  d.anchorId = n.id;
  d.strandId = null;
  emit(d, 'dew', { at: n.id });
  return n.id;
}

// Drop: an explicit decision to let go. Detaches from the work or strand and
// falls; it does not choose where the fall ends.
export function release(d, world) {
  const n = reachable(d, world);
  const onStrandId = d.mode === 'strand' ? d.strandId : null;
  if (!n && !onStrandId) return null;
  const ignoreIds = world.strands.filter((s) => (n && (s.a === n.id || s.b === n.id)) || s.id === onStrandId).map((s) => s.id);
  for (const id of ignoreIds) d.ignore[id] = d.t + 0.7;
  d.mode = 'fall';
  d.anchorId = null;
  d.strandId = null;
  d.vy = Math.max(d.vy, 0) + 240;
  d.still = 0;
  emit(d, 'drop', { at: n?.id ?? null, strandId: onStrandId });
  return { workId: n?.id ?? null, strandId: onStrandId };
}

// What the Drop would do with no input from here. Used to show how a changed
// relationship changes the possible path; it never moves the real Drop.
export function predict(drop, world, seconds = 8, input = null) {
  const d = cloneDrop(drop);
  d.events = [];
  const points = [];
  const steps = Math.round(seconds / PHYS.DT);
  for (let i = 0; i < steps; i++) {
    step(d, world, input);
    if (i % 4 === 0) points.push({ x: d.x, y: d.y });
  }
  const touched = d.events.filter((e) => e.type === 'catch' || e.type === 'transfer').map((e) => e.strandId);
  return { points, events: d.events, touched, end: { x: d.x, y: d.y } };
}
