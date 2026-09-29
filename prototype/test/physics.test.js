import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_WORKS, SAMPLE_RELATIONS } from '../src/sample.js';
import { buildWorld, layout } from '../src/web.js';
import { PHYS, newDrop, step, predict, dew, release, restAt, reachable } from '../src/physics.js';

const world = buildWorld(SAMPLE_WORKS, SAMPLE_RELATIONS);
const run = (d, w, seconds, input = null) => {
  for (let i = 0; i < Math.round(seconds / PHYS.DT); i++) step(d, w, typeof input === 'function' ? input(d) : input);
  return d;
};
const strandsOf = (p) => p.touched.filter((id, i, a) => a[i - 1] !== id);

test('layout is deterministic: same relationships, same web', () => {
  const a = layout(SAMPLE_WORKS, SAMPLE_RELATIONS);
  const b = layout(SAMPLE_WORKS, SAMPLE_RELATIONS);
  assert.deepEqual([...a], [...b]);
});

test('with no input the Drop keeps moving, falls through gaps and is caught by strands', () => {
  const p = predict(newDrop(500, 0), world, 20);
  const types = new Set(p.events.map((e) => e.type));
  assert.ok(types.has('catch'), 'caught by a strand');
  assert.ok(types.has('leave') || types.has('slip'), 'leaves a strand again');
  assert.ok(p.end.y > 1800, 'kept falling (more than one web height)');
  // Never at rest for long without input.
  let still = 0;
  let maxStill = 0;
  for (let i = 1; i < p.points.length; i++) {
    const m = Math.hypot(p.points[i].x - p.points[i - 1].x, p.points[i].y - p.points[i - 1].y);
    still = m < 0.5 ? still + 1 : 0;
    maxStill = Math.max(maxStill, still);
  }
  assert.ok(maxStill * 4 * PHYS.DT < 1.5, `stalled for ${(maxStill * 4 * PHYS.DT).toFixed(2)} s`);
});

test('fast falls tear through strands that slower falls are caught by', () => {
  const pierced = predict(newDrop(500, 0), world, 30, { drift: { x: 0, y: 1 }, hold: false });
  assert.ok(pierced.events.some((e) => e.type === 'pierce'), 'full downward drift pierces at least one strand');
  const calm = predict(newDrop(500, 0), world, 30);
  const calmCatches = calm.events.filter((e) => e.type === 'catch').length;
  const fastCatches = pierced.events.filter((e) => e.type === 'catch').length;
  assert.ok(fastCatches < calmCatches, `fast ${fastCatches} catches vs calm ${calmCatches}`);
});

test('a thumb nudge (Drift for one second, then let go) changes which strand catches the Drop', () => {
  const route = (dx) => {
    const d = newDrop(500, 0);
    run(d, world, 20, (s) => (s.t < 1 ? { drift: { x: dx, y: 0 } } : null));
    return d.events.filter((e) => e.type === 'catch' || e.type === 'transfer').map((e) => e.strandId);
  };
  const left = route(-0.6);
  const none = route(0);
  const right = route(0.6);
  assert.notEqual(left[0], none[0]);
  assert.notEqual(right[0], none[0]);
  assert.notEqual(left[0], right[0]);
});

test('Drift has momentum: letting go does not stop the Drop at once', () => {
  const d = run(newDrop(500, 0), world, 0.6, { drift: { x: 1, y: 0 } });
  const vx = d.vx;
  step(d, world, null);
  assert.ok(vx > 100 && d.vx > vx * 0.9, `vx ${vx} -> ${d.vx}`);
});

test('touch/hold settles beside the nearest work; release resumes motion', () => {
  const d = run(newDrop(500, 0), world, 2.5);
  run(d, world, 3, { hold: true });
  assert.equal(d.mode, 'settle');
  assert.ok(Math.hypot(d.vx, d.vy) < 5, 'at rest while held');
  const near = reachable(d, world);
  assert.ok(near, 'settled within reach of a work');
  const y0 = d.y;
  run(d, world, 1.0);
  assert.equal(d.mode === 'fall' || d.mode === 'strand', true);
  assert.ok(Math.abs(d.y - y0) > 20, 'moving again after release');
});

test('Dew adheres to the work and holds against drift; Drop releases and falls', () => {
  const d = run(newDrop(500, 0), world, 2.5);
  run(d, world, 2, { hold: true });
  const id = dew(d, world);
  assert.ok(id);
  assert.equal(d.mode, 'adhered');
  run(d, world, 2, { drift: { x: 1, y: 1 } });
  assert.equal(d.mode, 'adhered', 'Drift does not undo a Dew');
  const r = release(d, world);
  assert.equal(r.workId, id);
  const y0 = d.y;
  run(d, world, 1);
  assert.ok(d.y > y0 + 50, 'falls after Drop');
});

test('passive travel emits only motion events, never a judgment', () => {
  const p = predict(newDrop(300, 0), world, 30, { drift: { x: 0.3, y: 0.2 } });
  assert.ok(p.events.length > 0);
  assert.ok(p.events.every((e) => !['dew', 'drop'].includes(e.type)));
});

test('rest (from the list view) is not a Dew and any touch lets it go', () => {
  const d = newDrop(500, 0);
  assert.ok(restAt(d, world, 's-shelf'));
  run(d, world, 1);
  assert.equal(d.mode, 'rest');
  assert.ok(!d.events.some((e) => e.type === 'dew'));
  run(d, world, 0.1, { drift: { x: 0.5, y: 0 } });
  assert.equal(d.mode, 'fall');
});

test('DECISIVE: changing one relationship changes the web and the possible path', () => {
  const without = SAMPLE_RELATIONS.filter((r) => r.id !== 'r5');
  const w2 = buildWorld(SAMPLE_WORKS, without);
  // Structure: the strand is gone, positions and grips around it changed.
  assert.ok(!w2.strandById.has('r5'));
  const moved = world.nodes.map((n) => Math.hypot(n.x - w2.nodeById.get(n.id).x, n.y - w2.nodeById.get(n.id).y));
  assert.ok(Math.max(...moved) > 20, 'works moved');
  assert.ok(world.nodeById.get('s-barrel').degree !== w2.nodeById.get('s-barrel').degree);
  // Motion: same start, same (zero) input, different route.
  const before = strandsOf(predict(newDrop(500, 0), world, 12));
  const after = strandsOf(predict(newDrop(500, 0), w2, 12));
  assert.ok(before.includes('r5'));
  assert.ok(!after.includes('r5'));
  assert.notDeepEqual(after, before.filter((id) => id !== 'r5'), 'not just the same route minus one strand');
});

test('adding a relationship adds a strand the Drop can ride', () => {
  const extra = [...SAMPLE_RELATIONS, { id: 'x1', from: 's-seeds', to: 's-map', kind: 'responds to' }];
  const w2 = buildWorld(SAMPLE_WORKS, extra);
  assert.ok(w2.strandById.has('x1'));
  const routes = [];
  for (let x = 150; x <= 850; x += 50) routes.push(...predict(newDrop(x, 0), w2, 20).touched);
  assert.ok(routes.includes('x1'), 'some start reaches the new strand');
});

test('a strand removed under the Drop lets it fall instead of freezing', () => {
  const d = newDrop(500, 0);
  // Find it on a strand, then remove that strand.
  let guard = 0;
  while (d.mode !== 'strand' && guard++ < 5000) step(d, world, null);
  assert.equal(d.mode, 'strand');
  const w2 = buildWorld(SAMPLE_WORKS, SAMPLE_RELATIONS.filter((r) => r.id !== d.strandId));
  step(d, w2, null);
  assert.equal(d.mode, 'fall');
});
