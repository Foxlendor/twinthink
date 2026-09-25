import { describe, expect, it } from 'vitest';
import { Camera, ENTER } from './camera';
import { topologyOf, strandAt } from './layout';
import { IdeaNode, countEvents } from './model';
import { buildWorld, resolvePath } from './world';
import { createLocalStore, localShadowNode } from './sources/local';
import { Access, stepFlight, zoomAt } from './navigate';
import continuity from './sources/twinthink-continuity.json';

const open: Access = { canEnter: () => true, closenessAt: () => 1 };

function freshCamera(world = buildWorld([])) {
  const cam = new Camera(world);
  cam.resize(1440, 900);
  cam.s = 900 * 0.45;
  return cam;
}

function screenOf(cam: Camera, path: IdeaNode[]) {
  let T = cam.transformAt(0);
  for (let i = 1; i < path.length; i++) {
    const c = path[i];
    T = { ox: T.ox + c.x * T.s, oy: T.oy + c.y * T.s, s: T.s * c.r };
  }
  return T;
}

describe('camera', () => {
  it('descending and ascending are exact inverses', () => {
    const cam = freshCamera();
    const child = cam.node.children[0];
    cam.cx = 0.2101;
    cam.cy = -0.1399;
    cam.s = 5e5;
    const before = { cx: cam.cx, cy: cam.cy, s: cam.s };
    cam.descend(child);
    cam.ascend();
    expect(cam.cx).toBeCloseTo(before.cx, 12);
    expect(cam.cy).toBeCloseTo(before.cy, 12);
    expect(cam.s / before.s).toBeCloseTo(1, 12);
  });

  it('entering a child does not move anything on screen', () => {
    const cam = freshCamera();
    const child = cam.node.children[0];
    topologyOf(child);
    const grand = child.children[0];
    cam.cx = child.x;
    cam.cy = child.y;
    cam.s = (cam.M * (ENTER + 0.05)) / child.r;
    const before = screenOf(cam, [cam.path[0], child, grand]);
    cam.normalize(open.canEnter);
    expect(cam.depth).toBe(1);
    const after = cam.transformAt(1);
    const g = { ox: after.ox + grand.x * after.s, oy: after.oy + grand.y * after.s, s: after.s * grand.r };
    expect(g.ox).toBeCloseTo(before.ox, 6);
    expect(g.oy).toBeCloseTo(before.oy, 6);
    expect(g.s).toBeCloseTo(before.s, 6);
  });

  it('zooming in toward an idea and back out keeps it exactly under the cursor', () => {
    const cam = freshCamera();
    const tw = cam.node.children[0];
    const [sx, sy] = cam.toScreen(tw.x, tw.y);
    for (let i = 0; i < 400 && cam.depth < 1; i++) zoomAt(cam, sx, sy, 1.12, open);
    expect(cam.depth).toBe(1);
    for (let i = 0; i < 600 && (cam.depth > 0 || cam.s > 200); i++) zoomAt(cam, sx, sy, 1 / 1.12, open);
    expect(cam.depth).toBe(0);
    const [ex, ey] = cam.toScreen(tw.x, tw.y);
    expect(Math.abs(ex - sx)).toBeLessThan(0.5);
    expect(Math.abs(ey - sy)).toBeLessThan(0.5);
  });

  it('has hysteresis: small wobble at the threshold does not flip frames', () => {
    const cam = freshCamera();
    const tw = cam.node.children[0];
    cam.cx = tw.x;
    cam.cy = tw.y;
    cam.s = (cam.M * (ENTER + 0.01)) / tw.r;
    cam.normalize(open.canEnter);
    expect(cam.depth).toBe(1);
    cam.zoomAt(cam.w / 2, cam.h / 2, 0.9, open.canEnter);
    expect(cam.depth).toBe(1);
  });

  it('keeps precision many levels deep', () => {
    const cam = freshCamera();
    let node = cam.node.children[0];
    const path = [cam.node, node];
    while (true) {
      topologyOf(node);
      if (!node.children.length) break;
      node = node.children[0];
      path.push(node);
    }
    const target = path.slice(0, path.length);
    for (let i = 0; i < 4000; i++) {
      if (stepFlight(cam, { target, radius: 0.4 }, open, 1 / 60)) break;
    }
    const T = screenOf(cam, target);
    expect(cam.path.length).toBeGreaterThanOrEqual(target.length - 1);
    expect(Math.abs(T.ox - cam.w / 2)).toBeLessThan(2);
    expect(Math.abs(T.s / (0.4 * cam.M) - 1)).toBeLessThan(0.02);
  });
});

describe('topology', () => {
  it('keeps every child inside its parent and apart from its siblings', () => {
    const world = buildWorld([]);
    const tw = world.children[0];
    topologyOf(tw);
    for (const c of tw.children) expect(Math.hypot(c.x, c.y) + c.r).toBeLessThanOrEqual(0.93);
    for (let i = 0; i < tw.children.length; i++)
      for (let j = i + 1; j < tw.children.length; j++) {
        const a = tw.children[i];
        const b = tw.children[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r);
      }
  });

  it('grows a strand to every child, ending near it', () => {
    const tw = buildWorld([]).children[0];
    const topo = topologyOf(tw);
    expect(topo.strands.length).toBe(tw.children.length);
    for (const s of topo.strands) {
      const [x, y] = strandAt(s, 1);
      expect(Math.hypot(x - s.child!.x, y - s.child!.y)).toBeLessThan(s.child!.r * 1.2);
    }
  });

  it('is deterministic', () => {
    const a = buildWorld([]).children[0];
    const b = JSON.parse(JSON.stringify(a)) as IdeaNode;
    topologyOf(a);
    topologyOf(b);
    expect(b.children.map((c) => [c.x, c.y])).toEqual(a.children.map((c) => [c.x, c.y]));
  });
});

describe('TwinThink continuity record', () => {
  it('stores only timestamps, hashes, categories and kinds (no commit text)', () => {
    for (const c of continuity.commits) {
      expect(Object.keys(c).sort()).toEqual(['b', 'h', 'k', 't']);
      expect(c.h).toMatch(/^[0-9a-f]{7}$/);
      expect(['change', 'repair', 'experiment', 'prune']).toContain(c.k);
    }
  });

  it('counts each real change once', () => {
    const tw = buildWorld([]).children[0];
    expect(countEvents(tw)).toBe(continuity.commits.length + 1);
  });
});

describe('local shadows', () => {
  it('records casts, thoughts, revisions and returns as real events', () => {
    const mem = new Map<string, string>();
    const store = createLocalStore({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) });
    const s = store.cast('a bridge made of paper', 0.1, 0.1);
    const t = store.addThought(s.id, null, 'folding increases stiffness', 0.4, 0.2)!;
    store.addThought(s.id, t.id, 'test a single fold', 0.3, -0.3);
    store.revise(s.id, t.id, 'folding increases stiffness, a lot');
    store.letGo(s.id, t.id);
    const node = localShadowNode(store.list()[0]);
    expect(node.children).toHaveLength(1);
    expect(node.children[0].children).toHaveLength(1);
    expect(node.children[0].state).toBe('abandoned');
    expect(node.children[0].events.map((e) => e.kind)).toEqual(['begin', 'revision', 'prune']);
    const world = buildWorld(store.list());
    expect(resolvePath(world, [node.id, node.children[0].id]).length).toBe(3);
  });
});
