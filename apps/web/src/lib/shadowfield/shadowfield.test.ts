import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  aheadCopies,
  buildStream,
  focusOf,
  focusZ,
  leanAt,
  mod,
  beginPush,
  nearestFocus,
  newFlightCam,
  panBy,
  restingPlace,
  silence,
  project,
  spacing,
  stepFlightCam,
  stepFocus,
  travelled,
  viewOf,
  wrapDelta,
} from './flight';
import { Camera, ENTER } from './camera';
import { topologyOf, strandAt } from './layout';
import { IdeaNode, countEvents, findPath, reachedBy, rippleReach, webSize } from './model';
import { buildWorld, resolvePath } from './world';
import { THROWAWAYS } from './sources/archive';
import { TRACES, isLinked } from './sources/traces';
import { AUTHOR } from './sources/author';
import { isOwner, safeNext } from '../auth/rules';
import { cleanNote } from '../notes/rules';
import { createLocalStore, localShadowNode } from './sources/local';
import { Access, stepFlight, zoomAt } from './navigate';
import continuity from './sources/twinthink-continuity.json';
import notes from '../../../../../scripts/twinthink_notes.json';
import { buildRehearsalField } from './specimens.fixture';
import { spatialIndex } from './spatial';
import { founderPlots, CELL, PLOT } from './plots';
import { rootNode } from './world';

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
    for (let d = 0; d < 6; d++) {
      topologyOf(node);
      const next = node.children.find((c) => !c.portal);
      if (!next) break;
      node = next;
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
  it('stores only timestamps, hashes, categories, kinds and curated notes (no commit text)', () => {
    for (const c of continuity.commits as { h: string; k: string; d?: string }[]) {
      expect(Object.keys(c).filter((k) => k !== 'd').sort()).toEqual(['b', 'h', 'k', 't']);
      if (c.d !== undefined) expect(c.d).toBe((notes.changes as Record<string, string>)[c.h]);
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

describe('scale (synthetic fixture, never served)', () => {
  it('spatial index returns exactly the children in a region', () => {
    const field = rootNode('fixture', buildRehearsalField(20000));
    const idx = spatialIndex(field);
    const hits = idx.query(-0.1, -0.1, 0.1, 0.1, []).filter((c) => Math.abs(c.x) <= 0.1 && Math.abs(c.y) <= 0.1);
    const brute = field.children.filter((c) => Math.abs(c.x) <= 0.1 && Math.abs(c.y) <= 0.1);
    expect(new Set(hits)).toEqual(new Set(brute));
  });

  it('builds interiors lazily and supports deep recursion', () => {
    const field = rootNode('fixture', buildRehearsalField(100));
    let node = field.children[7];
    expect(node.children.length).toBe(0);
    let depth = 0;
    while (depth < 6) {
      topologyOf(node);
      if (!node.children.length) break;
      node = node.children[0];
      depth++;
    }
    expect(depth).toBeGreaterThanOrEqual(1);
  });

  it('flies to a deep synthetic node without losing precision', () => {
    const field = rootNode('fixture', buildRehearsalField(2000));
    const cam = new Camera(field);
    cam.resize(1440, 900);
    cam.s = 400;
    let node = field.children[3];
    const target = [field, node];
    for (let d = 0; d < 5; d++) {
      topologyOf(node);
      if (!node.children.length) break;
      node = node.children[0];
      target.push(node);
    }
    let arrived = false;
    for (let i = 0; i < 6000 && !arrived; i++) arrived = stepFlight(cam, { target, radius: 0.53 }, open, 1 / 60);
    expect(arrived).toBe(true);
    expect(cam.node).toBe(target[target.length - 1]);
  });
});

describe('nothing ends', () => {
  it('every leaf opens onto the Canvas again, and you can keep falling', () => {
    const world = buildWorld([]);
    const cam = new Camera(world);
    cam.resize(1440, 900);
    cam.s = 400;
    // walk to a leaf, then into its portal, then into TwinThink again
    let node = world.children[0];
    const target = [world, node];
    for (let d = 0; d < 6; d++) {
      topologyOf(node);
      const next = node.children.find((c) => !c.portal) ?? node.children.find((c) => c.portal);
      if (!next) break;
      node = next;
      target.push(node);
      if (node.portal) break;
    }
    expect(node.portal).toBe(true);
    topologyOf(node);
    target.push(node.children[0]);
    let arrived = false;
    for (let i = 0; i < 12000 && !arrived; i++) arrived = stepFlight(cam, { target, radius: 0.53 }, open, 1 / 60);
    expect(arrived).toBe(true);
    expect(cam.node.id).toBe('twinthink');
    expect(cam.depth).toBeGreaterThan(4);
  });

  it('zooming into blank space never stops and stays precise', () => {
    const cam = freshCamera();
    // far from any idea
    for (let i = 0; i < 400; i++) zoomAt(cam, 100, 100, 1.2, open);
    expect(cam.path.some((n) => n.void)).toBe(true);
    const z = cam.logZ();
    expect(z).toBeGreaterThan(Math.log(400) + 60);
    expect(Number.isFinite(cam.cx) && Math.abs(cam.cx) < 2).toBe(true);
    // and all the way back out
    for (let i = 0; i < 800 && cam.depth > 0; i++) zoomAt(cam, 100, 100, 1 / 1.2, open);
    expect(cam.depth).toBe(0);
  });
});

describe('throwaways', () => {
  it('his ideas, given away in one ring, each with something inside and no invented history', () => {
    const world = buildWorld([]);
    const ring = world.children.find((c) => c.id === 'throwaways')!;
    expect(ring.title).toBe('throwaways');
    expect(ring.free).toBe(true);
    const archived = ring.children.filter((c) => c.id.startsWith('archive/'));
    expect(archived).toHaveLength(9);
    expect(archived[0].id).toBe('archive/bubbleblock');
    for (const a of archived) {
      expect(a.free).toBe(true);
      expect(a.origin).toBe('real');
      expect(a.events[0].kind).toBe('begin');
      // anything after the beginning is only something the inventor chose to show
      for (const e of a.events.slice(1)) expect(e.kind).toBe('evidence');
      expect(a.events.length > 1).toBe(!!a.media?.length);
      expect(Math.hypot(a.x, a.y)).toBeLessThan(1);
      // a plain label, and real information inside: at least what it is and why
      expect(a.line && a.line.length > 8).toBe(true);
      const inside = a.children.map((c) => c.title);
      expect(inside).toContain('what it is');
      expect(inside).toContain('why it exists');
      for (const c of a.children) expect(c.artifact?.type === 'text' && c.artifact.body.length > 10).toBe(true);
    }
    // the one film the inventor shared: BubbleBlock, signed as his animation
    const shown = archived.filter((a) => a.media?.length);
    expect(shown.map((a) => a.id)).toEqual(['archive/bubbleblock']);
    const film = shown[0].media?.[0];
    expect(film?.kind).toBe('video');
    expect(film?.kind === 'video' && film.by).toBe('animated by johne.boi');
  });

  it('lineage runs between the ones that grew out of each other', () => {
    const world = buildWorld([]);
    const ring = world.children.find((c) => c.id === 'throwaways')!;
    const byId = new Map(ring.children.map((c) => [c.id, c]));
    const grew = (id: string) => (byId.get(id)?.links ?? []).filter((l) => l.kind === 'grew-from').map((l) => l.to);
    expect(grew('archive/u3dpen')).toEqual(['archive/ferropen']);
    expect(grew('archive/ferro-display')).toEqual(['archive/ferropen']);
    expect(grew('archive/smholder')).toEqual(['archive/sipsmolder']);
    // every thread lands on a real sibling
    for (const c of ring.children) for (const l of c.links ?? []) expect(byId.has(l.to), `${c.id} -> ${l.to}`).toBe(true);
  });

  it('never says how anything works', () => {
    // mechanisms, materials, parts and construction stay with the inventor
    const forbidden = /ferrofluid|microfluid|sodium|acetate|phase.change|shape.memory|alloy|capillar|coil|electromagnet|magnet|esp32|camera|circuit|battery pack|heating element|snap disc|crystalli|cellulose|pulp|extru|dishwasher|oil|silicone|chamber/i;
    // (names are the inventor's own and stay as he wrote them; everything written about them is checked)
    const texts = THROWAWAYS.flatMap((t) => [t.line, t.what, t.why, t.roots, t.became, t.name]).filter(Boolean) as string[];
    for (const text of texts) expect(forbidden.test(text), text).toBe(false);
    // and the old links to them still land
    const world = buildWorld([]);
    expect(resolvePath(world, ['archive/bubbleblock']).map((n) => n.id)).toEqual(['canvas', 'throwaways', 'archive/bubbleblock']);
  });

  it('a taken throwaway is the visitor’s own, and still credits who gave it', () => {
    const mem = new Map<string, string>();
    const store = createLocalStore({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) });
    const s = store.cast('SipSmolder', 0.4, 0.2, 'archive/sipsmolder');
    const node = localShadowNode(store.list().find((v) => v.id === s.id)!);
    expect(node.ownedBy).toBe('viewer');
    expect(node.line).toContain('johne.boi');
  });
});

describe('traces: what he shared elsewhere', () => {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const decodedTime = (code: string) => {
    let n = BigInt(0);
    for (const ch of code) n = n * BigInt(64) + BigInt(ALPHA.indexOf(ch));
    return Number((n >> BigInt(23)) + BigInt(1314220021721));
  };

  it('only comes from accounts the owner linked, at the moment each post was made', () => {
    for (const t of TRACES) {
      expect(isLinked(t), t.id).toBe(true);
      // the time is the post's own, not typed in (to the second)
      expect(Math.abs(Date.parse(t.at) - decodedTime(t.id)), t.id).toBeLessThan(1000);
    }
    expect(isLinked({ platform: 'instagram', owner: 'someone.else' })).toBe(false);
  });

  it('is woven into what it belongs to', () => {
    const world = buildWorld([]);
    const music = world.children.find((c) => c.id === 'music')!;
    const crhymes = music.children.find((c) => c.id === 'music/crhymes')!;
    expect(crhymes.events.some((e) => e.kind === 'evidence' && e.note?.includes('CRHYMES'))).toBe(true);
    const dance = world.children.find((c) => c.id === 'dance')!;
    expect(dance.began).toBeLessThanOrEqual(Date.parse('2024-06-25T10:59:55Z'));
    const moments = world.children.find((c) => c.id === 'moments')!;
    expect(moments.children.length).toBe(TRACES.filter((t) => !t.belongsTo).length);
  });

  it('shows his words and the moment: never images, never where it was posted', () => {
    const world = buildWorld([]);
    const shown: string[] = [];
    const visit = (n: IdeaNode) => {
      if (n.id.startsWith('moment')) {
        expect(n.media ?? []).toEqual([]);
        shown.push(n.title ?? '', n.line ?? '', n.artifact?.type === 'text' ? n.artifact.body : '');
      }
      for (const e of n.events) if (e.note?.startsWith('shared')) shown.push(e.note);
      if (!n.portal) n.children.forEach(visit);
    };
    visit(world);
    for (const text of shown) expect(/instagram|insta|tiktok|discord|reels?/i.test(text), text).toBe(false);
  });
});

describe('ethos, not logos', () => {
  it('sessions are named by the hours he worked, never by dates; no ring is named after a logo', () => {
    const tw = buildWorld([]).children.find((c) => c.id === 'twinthink')!;
    expect(tw.children.some((b) => b.id === 'twinthink/mark')).toBe(false);
    for (const b of tw.children) {
      for (const sess of b.children) expect(sess.title).not.toMatch(/\d/);
    }
    const all = tw.children.flatMap((b) => b.children.map((c) => c.title));
    expect(all).toContain('all through the night');
  });

  it('every verb under his name leads to its evidence', () => {
    const stream = buildStream(buildWorld([]));
    for (const [word, ids] of Object.entries(AUTHOR.go)) {
      expect(AUTHOR.line).toContain(word);
      expect(stream.byId.has(ids[ids.length - 1]), word).toBe(true);
    }
  });
});

describe('media files', () => {
  it('every file the Canvas refers to is published', () => {
    const world = buildWorld([]);
    const srcs: string[] = [];
    const walk = (n: IdeaNode) => {
      for (const m of n.media ?? []) {
        if ('src' in m) srcs.push(m.src);
        if (m.kind === 'video') srcs.push(m.poster, ...(m.webm ? [m.webm] : []));
      }
      for (const c of n.children) if (!c.portal) walk(c);
    };
    walk(world);
    expect(srcs.length).toBeGreaterThan(9);
    for (const src of srcs) expect(existsSync(join(__dirname, '../../../public', src)), src).toBe(true);
  });

  it('the dance is its own Shadow, a film seen through a round window', () => {
    const world = buildWorld([]);
    const dance = world.children.find((c) => c.id === 'dance')!;
    expect(dance.title).toBe('johne.boi, dancing');
    const film = dance.media?.[0];
    expect(film?.kind === 'video' && film.round).toBe(true);
  });
});

describe('the flight', () => {
  const world = buildWorld([]);
  const stream = buildStream(world);
  const st = stream.stations;

  it('walks every idea once, in order, never into a portal', () => {
    // expand leaves so portals exist; they must not change the stream
    for (const c of world.children) topologyOf(c);
    expect(st[0].node).toBe(world);
    expect(st[0].depth).toBe(0);
    const ids = st.map((s) => s.node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(st.some((s) => s.node.portal || s.node.void)).toBe(false);
    let count = 0;
    const walk = (n: IdeaNode) => {
      for (const c of travelled(n)) {
        count++;
        walk(c);
      }
    };
    walk(world);
    expect(st.length).toBe(count + 1);
    for (let i = 1; i < st.length; i++) expect(st[i].z).toBeGreaterThan(st[i - 1].z);
    expect(stream.length).toBeGreaterThan(st[st.length - 1].z);
  });

  it('an idea that holds others is a ring around everything it holds', () => {
    for (const g of st.filter((s) => s.gate && s.depth > 0)) {
      expect(g.x).toBe(0);
      const inside = st.filter((s) => s.path.includes(g.node) && s !== g);
      expect(inside.length).toBe(travelled(g.node).length + inside.filter((s) => s.path.length > g.path.length + 1).length);
      for (const s of inside) {
        expect(s.z).toBeGreaterThan(g.z);
        expect(s.z).toBeLessThan(g.end);
      }
    }
  });

  it('newest comes first, and the distance between things is the time between them', () => {
    const tops = st.filter((s) => s.depth === 1);
    for (let i = 1; i < tops.length; i++) expect(tops[i].t).toBeLessThanOrEqual(tops[i - 1].t);
    expect(spacing(0)).toBeCloseTo(1.1);
    expect(spacing(86400000)).toBeGreaterThan(spacing(3600000));
    expect(spacing(365 * 86400000)).toBeGreaterThan(spacing(30 * 86400000));
    expect(spacing(1e14)).toBe(3);
  });

  it('never ends: repeats ahead, and wraps both ways', () => {
    const L = stream.length;
    expect(aheadCopies(0, -0.5, L, 0.06, L * 2.5)).toHaveLength(3);
    for (const z of [0, 1.7, L - 0.1, L * 3 + 0.2, -L * 2]) {
      const d = wrapDelta(z, 0.4, L);
      expect(d).toBeGreaterThan(-L / 2 - 1e-9);
      expect(d).toBeLessThanOrEqual(L / 2 + 1e-9);
    }
    expect(mod(-0.5, L)).toBeCloseTo(L - 0.5);
  });

  it('arrives at the Canvas ring; a flick carries through many things and settles on one', () => {
    const cam = newFlightCam();
    expect(focusOf(stream, cam.z).depth).toBe(0);
    cam.v = 30;
    let t = 0;
    for (; t < 20; t += 1 / 60) stepFlightCam(cam, stream, 1 / 60);
    expect(cam.z).toBeGreaterThan(8);
    expect(cam.v).toBe(0);
    const f = nearestFocus(stream, cam.z)!;
    expect(Math.abs(f - cam.z)).toBeLessThan(0.01);
    const here = focusOf(stream, cam.z);
    expect(here.depth).toBeGreaterThan(0);
  });

  it('a slid view stays where it is left, follows the finger, and centres again once you travel on', () => {
    const cam = newFlightCam();
    const song = st.find((s) => s.node.id.startsWith('music/'))!;
    cam.z = focusZ(stream, song, 0);
    const W = 390;
    const H = 844;
    const at = () => {
      const v = viewOf(stream, cam, W, H);
      return project(v, song.x, song.y, wrapDelta(song.z, cam.z, stream.length));
    };
    const [x0, y0] = at();
    panBy(cam, stream, -120, -200, W, H);
    const [x1, y1] = at();
    expect(x1 - x0).toBeCloseTo(-120, 0);
    expect(y1 - y0).toBeCloseTo(-200, 0);
    // resting there, time passes: it stays
    for (let i = 0; i < 300; i++) stepFlightCam(cam, stream, 1 / 60);
    const [x2, y2] = at();
    expect(Math.hypot(x2 - x1, y2 - y1)).toBeLessThan(1);
    // travelling on, the slide lets go
    cam.z += 1.5;
    const v = viewOf(stream, cam, W, H);
    const [lx, ly] = leanAt(stream, cam.z);
    expect(v.x).toBeCloseTo(lx);
    expect(v.y).toBeCloseTo(ly);
  });

  it('flies to a thing and puts it in focus, forwards or backwards, across the seam', () => {
    const cam = newFlightCam();
    const song = st.find((s) => s.node.id.startsWith('music/'))!;
    cam.z = stream.length * 5 - 0.3; // many laps on, just before the seam
    cam.target = focusZ(stream, song, cam.z);
    expect(Math.abs(cam.target - cam.z)).toBeLessThanOrEqual(stream.length / 2);
    for (let i = 0; i < 600 && cam.target !== null; i++) stepFlightCam(cam, stream, 1 / 60);
    expect(cam.target).toBeNull();
    expect(focusOf(stream, cam.z).node.id).toBe(song.node.id);
    // and the camera leans toward it, so it arrives near the middle
    const [lx, ly] = leanAt(stream, cam.z);
    expect(Math.hypot(lx - song.x, ly - song.y)).toBeLessThan(Math.hypot(song.x, song.y));
  });

  it('comes to rest the way it was pushed: one small push forward reaches the next thing', () => {
    const cam = newFlightCam();
    const a = stepFocus(stream, cam.z, 1)!;
    const b = stepFocus(stream, a, 1)!;
    // pushed forward a little past a, with b near: rests on b, not back on a
    const z = a + Math.min(0.7, (b - a) * 0.6);
    if (b - z < 0.9) expect(restingPlace(stream, z, 1)).toBeCloseTo(b);
    // pushed back from b the same way: rests on a
    const z2 = b - Math.min(0.7, (b - a) * 0.6);
    if (z2 - a < 0.9) expect(restingPlace(stream, z2, -1)).toBeCloseTo(a);
    // with no push, whatever is very near
    expect(restingPlace(stream, a + 0.1, 0)).toBeCloseTo(a);
  });

  it('a silence is only real time with nothing happening', () => {
    const tw = world.children.find((c) => c.id === 'twinthink')!;
    const canvas = tw.children.find((c) => c.id === 'twinthink/canvas')!;
    // TwinThink was being worked on when its newest branch began: no silence
    expect(silence(tw, canvas)).toBe(0);
    const songs = world.children.find((c) => c.id === 'music')!.children;
    expect(silence(songs[0], songs[1])).toBeLessThan(3600000);
  });

  it('one small push from rest always arrives at the next thing, never springs back', () => {
    for (const k of [1, 5, 12, 30]) {
      const cam = newFlightCam();
      const a = stepFocus(stream, cam.z, 1)!;
      let z = a;
      for (let i = 1; i < k; i++) z = stepFocus(stream, z, 1)!;
      cam.z = z;
      const next = stepFocus(stream, z, 1)!;
      beginPush(cam, stream);
      cam.v = 1.8; // one wheel notch
      cam.dir = 1;
      for (let i = 0; i < 600; i++) stepFlightCam(cam, stream, 1 / 60);
      expect(cam.z).toBeCloseTo(next, 2);
    }
  });

  it('a long flick that ends in a silence is never pulled back to where it began', () => {
    const cam = newFlightCam();
    let z = stepFocus(stream, cam.z, 1)!;
    for (let i = 0; i < 5; i++) z = stepFocus(stream, z, 1)!;
    cam.z = z;
    beginPush(cam, stream);
    cam.v = 20;
    cam.dir = 1;
    let prev = cam.z;
    for (let i = 0; i < 900; i++) {
      stepFlightCam(cam, stream, 1 / 60);
      expect(cam.z).toBeGreaterThanOrEqual(prev - 0.6);
      prev = Math.max(prev, cam.z);
    }
    expect(cam.z).toBeGreaterThan(z + 3);
  });

  it('stepping goes to the very next thing, and back', () => {
    const cam = newFlightCam();
    const a = stepFocus(stream, cam.z, 1)!;
    const b = stepFocus(stream, a, 1)!;
    expect(b).toBeGreaterThan(a);
    expect(stepFocus(stream, b, -1)!).toBeCloseTo(a);
  });

  it('things are drawn only ahead: behind the camera nothing projects', () => {
    const v = viewOf(stream, newFlightCam(), 800, 600);
    const [, , k] = project(v, 0, 0, 1);
    expect(k).toBeCloseTo(v.F);
    for (const s of st) for (const dz of aheadCopies(s.z, v.z, stream.length, 0.06, 14)) expect(dz).toBeGreaterThan(0);
  });
});

describe('ripples', () => {
  it('finds paths without falling into portals', () => {
    const world = buildWorld([]);
    const tw = world.children[0];
    // expand every leaf so portals exist
    const walk = (n: IdeaNode, d: number) => {
      if (d > 4) return;
      topologyOf(n);
      for (const c of n.children) if (!c.portal) walk(c, d + 1);
    };
    walk(tw, 0);
    const leaf = tw.children[0].children[0];
    expect(findPath(world, leaf.id)?.map((n) => n.id)).toEqual(['canvas', 'twinthink', tw.children[0].id, leaf.id]);
    expect(findPath(world, 'nope')).toBeNull();
  });

  it('a bigger web reaches further, touching the nearest ideas first', () => {
    const world = buildWorld([]);
    const tw = world.children[0];
    const lone = world.children.find((c) => c.id === 'dance')!;
    expect(webSize(tw)).toBeGreaterThan(webSize(lone));
    expect(rippleReach(tw)).toBeGreaterThan(rippleReach(lone));
    const reached = reachedBy(tw, world.children);
    const d = reached.map((c) => Math.hypot(c.x - tw.x, c.y - tw.y));
    expect([...d].sort((a, b) => a - b)).toEqual(d);
    for (const x of d) expect(x).toBeLessThanOrEqual(rippleReach(tw));
  });
});

describe('free starters', () => {
  it('are on the Canvas, marked free, with no descriptive text', () => {
    const world = buildWorld([]);
    const starters = world.children.filter((c) => c.id.startsWith('starter/'));
    expect(starters.map((c) => c.title)).toEqual(['redr.ink', 'TwizzLock']);
    for (const s of starters) {
      expect(s.free).toBe(true);
      expect(s.artifact).toBeUndefined();
      expect(s.note).toBeUndefined();
    }
    expect(starters[0].media?.[0].kind).toBe('model');
  });
});

describe('free music modules', () => {
  it('holds all seven songs, dated by when they were made, playable and free', () => {
    const world = buildWorld([]);
    const music = world.children.find((c) => c.id === 'music')!;
    expect(music.free).toBe(true);
    expect(music.children).toHaveLength(7);
    for (const s of music.children) {
      expect(s.free).toBe(true);
      const a = s.media?.find((m) => m.kind === 'audio');
      expect(a && a.kind === 'audio' && a.src).toMatch(/^\/music\/[a-z0-9-]+\.m4a$/);
    }
    const times = music.children.map((s) => s.began);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});

describe('plots', () => {
  it('each public idea sits inside a 3x3 plot aligned to the grid; private ones get none', () => {
    const mem = new Map<string, string>();
    const store = createLocalStore({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) });
    store.cast('mine', 0.9, 0.9);
    const world = buildWorld(store.list());
    const plots = founderPlots(world.children);
    for (const n of world.children.filter((c) => !c.id.startsWith('local/'))) {
      expect(plots.some((p) => n.x >= p.x && n.x < p.x + PLOT && n.y >= p.y && n.y < p.y + PLOT)).toBe(true);
    }
    for (const p of plots) {
      expect(Math.abs(p.x / CELL - Math.round(p.x / CELL))).toBeLessThan(1e-9);
      expect(p.holder).toBe('johne.boi');
    }
    expect(plots.some((p) => 0.9 >= p.x && 0.9 < p.x + PLOT && 0.9 >= p.y && 0.9 < p.y + PLOT)).toBe(false);
  });
});

describe('signing in', () => {
  it('only a verified email on the owner list owns the Canvas', () => {
    expect(isOwner('Maker@Example.com', true, 'maker@example.com, other@x.org')).toBe(true);
    expect(isOwner('maker@example.com', false, 'maker@example.com')).toBe(false);
    expect(isOwner('someone@else.com', true, 'maker@example.com')).toBe(false);
    expect(isOwner('maker@example.com', true, undefined)).toBe(false);
  });

  it('after signing in, only ever returns to a page on this site', () => {
    expect(safeNext('/canvas#path=dance')).toBe('/canvas#path=dance');
    expect(safeNext('https://evil.example')).toBe('/canvas');
    // browsers drop tabs and line breaks, and read a backslash as a slash
    for (const bad of ['/\t/evil.example', '/\n/evil.example', '/\r\\evil.example', '/\\evil.example', '//evil.example', '/%09/x'.replace('%09', '\t')]) {
      expect(safeNext(bad)).toBe('/canvas');
    }
    expect(safeNext('/canvas?x=1')).toBe('/canvas?x=1');
    expect(safeNext('//evil.example')).toBe('/canvas');
    expect(safeNext('/\\evil.example')).toBe('/canvas');
    expect(safeNext(null)).toBe('/canvas');
  });
});

describe('notes at a seal', () => {
  it('are plain words, 1 to 500 characters', () => {
    expect(cleanNote('  thank you for this  ')).toBe('thank you for this');
    expect(cleanNote('a\u0000b')).toBe('ab');
    expect(cleanNote('')).toBeNull();
    expect(cleanNote('x'.repeat(501))).toBeNull();
    expect(cleanNote(42)).toBeNull();
  });
});
