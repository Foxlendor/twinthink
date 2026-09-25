import { describe, expect, it } from 'vitest';
import { type Camera, ENTER_AT, EXIT_AT, maxZoom, rebase, smoothPath, toChild, toParent, zoomAbout, framing, commonAncestor, expressIn } from '../camera';
import { continuityOf } from '../continuity';
import { BACKING_CLOSENESS, PUBLIC_CLOSENESS, closeness, project } from '../disclosure';
import { growthLayout, layoutDisks } from '../layout';
import type { FieldNode } from '../model';
import { SeedSource } from '../seed/seedSource';
import type { ViewerContext } from '../source';
import { FieldStore } from '../store';
import { StoreWorld } from '../world';

const NOW = Date.parse('2026-09-24T12:00:00Z');
const stranger: ViewerContext = { relationTo: () => ({ isCreator: false, backed: false, returnDays: 0 }) };
const backer = (twinId: string): ViewerContext => ({ relationTo: (id) => ({ isCreator: false, backed: id === twinId, returnDays: 0 }) });
const viewport = { width: 1200, height: 800 };

async function loadedWorld(viewer: ViewerContext = stranger) {
  const source = new SeedSource({ now: NOW });
  const store = new FieldStore(source, viewer);
  await store.init();
  return { source, store, world: new StoreWorld(store) };
}

describe('layout', () => {
  it('scatter and territory are deterministic and stay inside the parent', () => {
    for (const count of [1, 6, 15, 240]) {
      for (const style of ['scatter', 'territory'] as const) {
        const a = layoutDisks(count, 'seed', style);
        expect(a).toEqual(layoutDisks(count, 'seed', style));
        if (style === 'scatter') for (const disk of a) expect(Math.hypot(disk.x, disk.y) + disk.r).toBeLessThanOrEqual(1.001);
      }
    }
  });

  it('growth is deterministic, inside the parent, and leaves room around the point', () => {
    for (const n of [1, 2, 5, 9, 14]) {
      const items = Array.from({ length: n }, (_, i) => ({ from: i > 1 && i % 3 === 0 ? i - 2 : -1, weight: 0.5 }));
      const a = growthLayout(items, 'idea-' + n);
      expect(a).toEqual(growthLayout(items, 'idea-' + n));
      for (const disk of a) {
        const d = Math.hypot(disk.x, disk.y);
        expect(d + disk.r).toBeLessThanOrEqual(1.001);
        // The parent's own point (the origin) is never inside a child's field.
        expect(d - disk.r).toBeGreaterThan(0.05);
      }
    }
  });

  it('growth has a direction: it is not radially symmetric', () => {
    const items = Array.from({ length: 8 }, () => ({ from: -1, weight: 0.5 }));
    let widestGapSum = 0;
    const trials = 20;
    for (let t = 0; t < trials; t++) {
      const angles = growthLayout(items, 'asym-' + t)
        .map((d) => Math.atan2(d.y, d.x))
        .sort((a, b) => a - b);
      let widest = 2 * Math.PI - (angles[angles.length - 1] - angles[0]);
      for (let i = 1; i < angles.length; i++) widest = Math.max(widest, angles[i] - angles[i - 1]);
      widestGapSum += widest;
    }
    // Evenly spaced (radial) would leave gaps of 2π/8 ≈ 0.79. Growth leaves a real opening.
    expect(widestGapSum / trials).toBeGreaterThan(1.3);
  });

  it('a fork grows near the thing it came from', () => {
    const items = [
      { from: -1, weight: 0.5 },
      { from: -1, weight: 0.5 },
      { from: 0, weight: 0.5 },
      { from: 0, weight: 0.5 },
    ];
    const disks = growthLayout(items, 'fork');
    const toSource = (i: number) => Math.hypot(disks[i].x - disks[0].x, disks[i].y - disks[0].y);
    // Forks stay within reach of their source, so the division reads as one thread splitting.
    expect(toSource(2)).toBeLessThan(0.6);
    expect(toSource(3)).toBeLessThan(0.6);
  });
});

describe('camera', () => {
  it('toChild and toParent are inverses', () => {
    const cam: Camera = { frameId: 'p', cx: 0.31, cy: -0.2, zoom: 900 };
    const child = { parentId: 'p', x: 0.3, y: -0.25, r: 0.12 };
    const inside = toChild(cam, 'c', child);
    const back = toParent(inside, child);
    expect(back.cx).toBeCloseTo(cam.cx, 12);
    expect(back.cy).toBeCloseTo(cam.cy, 12);
    expect(back.zoom).toBeCloseTo(cam.zoom, 8);
  });

  it('zoomAbout keeps the anchor fixed on screen', () => {
    const cam: Camera = { frameId: 'p', cx: 0, cy: 0, zoom: 400 };
    const next = zoomAbout(cam, viewport, 2.5, 800, 300);
    const before = { x: cam.cx + (800 - 600) / cam.zoom, y: cam.cy + (300 - 400) / cam.zoom };
    const after = { x: next.cx + (800 - 600) / next.zoom, y: next.cy + (300 - 400) / next.zoom };
    expect(after.x).toBeCloseTo(before.x, 12);
    expect(after.y).toBeCloseTo(before.y, 12);
  });

  it('smoothPath starts and ends exactly at both views', () => {
    const path = smoothPath([0, 0, 2], [0.4, -0.1, 0.0001]);
    const [x0, y0, w0] = path.at(0);
    const [x1, y1, w1] = path.at(1);
    expect(x0).toBeCloseTo(0, 12);
    expect(y0).toBeCloseTo(0, 12);
    expect(w0).toBeCloseTo(2, 12);
    expect(x1).toBeCloseTo(0.4, 9);
    expect(y1).toBeCloseTo(-0.1, 9);
    expect(w1).toBeCloseTo(0.0001, 9);
  });

  it('rebases into children as you zoom and back out as you retreat', async () => {
    const { store, world } = await loadedWorld();
    const music = 'canvas/music';
    const g = world.geo(music)!;
    // Centre on Music and zoom until it fills the screen.
    let cam: Camera = { frameId: 'canvas', cx: g.x, cy: g.y, zoom: (ENTER_AT * 800 * 1.1) / g.r };
    cam = rebase(cam, viewport, world);
    expect(cam.frameId).toBe(music);
    // Now retreat past the exit threshold.
    cam = { ...cam, zoom: EXIT_AT * 800 * 0.5 };
    cam = rebase(cam, viewport, world);
    expect(cam.frameId).toBe('canvas');
    expect(store.nodes.size).toBeGreaterThan(6);
  });

  it('never enters something the viewer cannot perceive, and stops just short of it', async () => {
    const { store, world } = await loadedWorld();
    const hidden = 'canvas/music/johne.boi/mount-ever-wrist/unreleased-mix';
    await store.ensurePath(hidden);
    const node = store.get(hidden)!;
    expect(node.perceivable).toBe(false);
    const parent = 'canvas/music/johne.boi/mount-ever-wrist';
    let cam: Camera = { frameId: parent, cx: node.x, cy: node.y, zoom: 400 };
    const limit = maxZoom(cam, viewport, world);
    expect(limit * node.r).toBeLessThan(ENTER_AT * 800);
    cam = rebase({ ...cam, zoom: (ENTER_AT * 800 * 4) / node.r }, viewport, world);
    expect(cam.frameId).toBe(parent);
  });

  it('flies from the Canvas to a deep node and lands inside it', async () => {
    const { store, world } = await loadedWorld();
    const target = 'canvas/music/johne.boi/mount-ever-wrist/hook/vocal-concept/stacked-fourths';
    await store.ensurePath(target);
    const start: Camera = { frameId: 'canvas', cx: 0, cy: 0, zoom: 400 };
    const ancestor = commonAncestor(start.frameId, target, world);
    expect(ancestor).toBe('canvas');
    const end = framing(target, ancestor, viewport, world, 0.5);
    const path = smoothPath([start.cx, start.cy, 800 / start.zoom], [end.cx, end.cy, 800 / end.zoom]);
    const [cx, cy, w] = path.at(1);
    const landed = rebase({ frameId: ancestor, cx, cy, zoom: 800 / w }, viewport, world);
    expect(landed.frameId).toBe(target);
    expect(landed.zoom).toBeCloseTo(400, 3);
    // And expressing it back in the Canvas frame is lossless enough to return.
    const back = expressIn(landed, 'canvas', world);
    expect(back.cx).toBeCloseTo(end.cx, 9);
  });
});

describe('disclosure', () => {
  const node: FieldNode = {
    id: 'a',
    parentId: null,
    kind: 'experiment',
    glyph: 'audio',
    title: 'Secret thing',
    gist: 'gist',
    body: 'body',
    x: 0,
    y: 0,
    r: 1,
    d: 0.45,
    childCount: 3,
    history: [{ type: 'began', at: new Date(NOW - 5e9).toISOString(), origin: 'seeded' }],
    relationships: [],
    evidence: [{ medium: 'text', label: 'note' }],
    origin: 'seeded',
  };

  it('strips all content from a node the viewer is not close enough to perceive', () => {
    const shadow = project(node, PUBLIC_CLOSENESS, NOW);
    expect(shadow.perceivable).toBe(false);
    expect(shadow.title).toBeUndefined();
    expect(shadow.gist).toBeUndefined();
    expect(shadow.body).toBeUndefined();
    expect(shadow.history).toBeUndefined();
    expect(shadow.evidence).toBeUndefined();
  });

  it('backing brings the viewer close enough to see further', () => {
    const p = closeness({ isCreator: false, backed: true, returnDays: 0 });
    expect(p).toBeCloseTo(PUBLIC_CLOSENESS + BACKING_CLOSENESS);
    expect(project(node, p, NOW).title).toBe('Secret thing');
  });

  it('returning helps slowly and never exceeds its ceiling; creators see everything', () => {
    const many = closeness({ isCreator: false, backed: false, returnDays: 100 });
    expect(many).toBeLessThan(PUBLIC_CLOSENESS + BACKING_CLOSENESS);
    expect(closeness({ isCreator: true, backed: false, returnDays: 0 })).toBe(1);
  });

  it('the seed source does not reveal children of veiled nodes', async () => {
    const source = new SeedSource({ now: NOW });
    const id = 'canvas/music/johne.boi/mount-ever-wrist/unreleased-mix';
    expect(source.rawNode(id)!.childCount).toBeGreaterThan(0);
    expect(await source.children(id, stranger)).toEqual([]);
  });

  it('backing a Twin reveals the parts that need a backer, not the private ones', async () => {
    const source = new SeedSource({ now: NOW });
    const twin = 'canvas/music/johne.boi/mount-ever-wrist';
    const kids = async (viewer: ViewerContext) => (await source.children(twin, viewer)).filter((c) => c.perceivable).map((c) => c.id);
    const before = await kids(stranger);
    const after = await kids(backer(twin));
    expect(after.length).toBeGreaterThan(before.length);
    expect(after).toContain(twin + '/arrangement');
    expect(after).not.toContain(twin + '/unreleased-mix');
  });
});

describe('seed source', () => {
  it('is deterministic for the same moment', async () => {
    const a = new SeedSource({ now: NOW });
    const b = new SeedSource({ now: NOW });
    const ida = (await a.children('canvas/software', stranger)).slice(0, 20);
    const idb = (await b.children('canvas/software', stranger)).slice(0, 20);
    expect(ida).toEqual(idb);
  });

  it('childCount always matches the real number of children', () => {
    const source = new SeedSource({ now: NOW });
    const visit = (id: string, depth: number) => {
      const node = source.rawNode(id)!;
      const planned = node.childCount;
      const kids = source.rawChildren(id);
      expect(kids.length).toBe(planned);
      if (depth < 7) for (const child of kids.slice(0, 3)) visit(child.id, depth + 1);
    };
    visit('canvas', 0);
    visit('canvas/engineering/johne.boi', 2);
  });

  it('proves the music journey: Canvas → Music → johne.boi → Mount Ever Wrist → Hook → Vocal concept → revision → evidence', async () => {
    const source = new SeedSource({ now: NOW });
    const path = await source.path('canvas/music/johne.boi/mount-ever-wrist/hook/vocal-concept/stacked-fourths/kitchen-memo', stranger);
    expect(path.map((n) => n.title)).toEqual(['Canvas', 'Music', 'johne.boi', 'Mount Ever Wrist', 'Hook', 'Vocal concept', 'Stacked fourths', 'Voice memo — kitchen, 2am']);
    expect(path.every((n) => n.perceivable)).toBe(true);
    expect(path[5].isTwin).toBe(true); // an idea inside an idea
  });

  it('proves the engineering journey, and ties it to the existing TwizzLock record', async () => {
    const source = new SeedSource({ now: NOW });
    const base = 'canvas/engineering/johne.boi/twizzlock';
    const twin = source.rawNode(base)!;
    expect(twin.twin?.recordHref).toBe('/twins/twizzlock');
    expect(twin.history.some((e) => e.origin === 'record')).toBe(true);
    const failed = source.rawNode(base + '/mechanism/check-valve/umbrella')!;
    const revised = source.rawNode(base + '/mechanism/check-valve/duckbill')!;
    expect(failed.kind).toBe('dead_end');
    expect(revised.relationships).toContainEqual({ type: 'revises', targetId: failed.id });
    const detail = source.rawNode(base + '/mechanism/check-valve/duckbill/molding')!;
    expect(detail.title).toMatch(/Manufacturing/);
    const recordFacet = source.rawChildren(base).find((c) => c.id.endsWith('record-what-it-is'))!;
    expect(recordFacet.origin).toBe('record');
    // Private record assets map to the creator's private layer.
    const artifacts = source.rawChildren(base + '/record-artifacts');
    expect(artifacts.some((a) => a.d >= 0.9)).toBe(true);
  });

  it('redr.ink descends from the ReSip record', () => {
    const source = new SeedSource({ now: NOW });
    const redrink = source.rawNode('canvas/engineering/johne.boi/redrink')!;
    expect(redrink.relationships).toContainEqual({ type: 'descends_from', targetId: 'canvas/engineering/johne.boi/resip' });
    const resip = source.rawNode('canvas/engineering/johne.boi/resip')!;
    expect(continuityOf(resip, NOW).realized).toBe(true);
  });

  it('scales: a territory can hold tens of thousands of creators without generating what is not visited', () => {
    const source = new SeedSource({ now: NOW, scale: 60 });
    const start = performance.now();
    const constellations = source.rawChildren('canvas/music');
    expect(constellations.length).toBe(240 * 60);
    expect(performance.now() - start).toBeLessThan(1500);
  });
});

describe('continuity', () => {
  it('derives ethos from events, and calls a long-quiet idea resting', () => {
    const at = (days: number) => new Date(NOW - days * 86_400_000).toISOString();
    const c = continuityOf(
      {
        kind: 'twin',
        evidence: [],
        history: [
          { type: 'began', at: at(400), origin: 'seeded' },
          { type: 'revised', at: at(390), origin: 'seeded' },
          { type: 'dead_end', at: at(380), origin: 'seeded' },
          { type: 'branched', at: at(370), origin: 'seeded' },
          { type: 'dormant', at: at(300), origin: 'seeded' },
        ],
      },
      NOW
    );
    expect(c.revisions).toBe(1);
    expect(c.deadEnds).toBe(1);
    expect(c.branches).toBe(1);
    expect(c.life).toBe('dormant');
    expect(c.stillChanging).toBe(false);
  });
});
