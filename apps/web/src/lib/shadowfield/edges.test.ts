import { describe, expect, it } from 'vitest';
import { edgePaths, mouthsOf, openingsOf } from './flightRender';
import type { Station } from './flight';
import type { IdeaNode } from './model';

const node = (id: string, children: IdeaNode[] = [], extra: Partial<IdeaNode> = {}): IdeaNode => ({
  id,
  title: id,
  kind: 'unknown',
  origin: 'real',
  began: 0,
  events: [],
  state: 'alive',
  disclosure: 0,
  children,
  x: 0,
  y: 0,
  r: 0.1,
  seed: 1,
  ...extra,
});

const at = (path: IdeaNode[]) => ({ node: path[path.length - 1], path }) as unknown as Station;
const all = () => true;

describe('the paths beside the one you are on', () => {
  const a = node('a');
  const b = node('b');
  const c = node('c');
  const parent = node('parent', [a, b, c]);
  const root = node('root', [parent]);

  it('glimpses the nearest path before and after, at a branch', () => {
    const edges = edgePaths(at([root, parent, b]), all);
    expect(edges.map((e) => [e.node.id, e.side])).toEqual([
      ['a', -1],
      ['c', 1],
    ]);
    // each edge is a full path, so choosing it is an ordinary journey there
    expect(edges[0].path.map((n) => n.id)).toEqual(['root', 'parent', 'a']);
  });

  it('shows only the side that exists at either end', () => {
    expect(edgePaths(at([root, parent, a]), all).map((e) => e.node.id)).toEqual(['b']);
  });

  it('is nothing where there is no choice: a single path, or the Canvas itself', () => {
    const only = node('only');
    const lone = node('lone', [only]);
    expect(edgePaths(at([root, lone, only]), all)).toEqual([]);
    expect(edgePaths(at([root]), all)).toEqual([]);
    expect(edgePaths(null, all)).toEqual([]);
  });

  it('never glimpses a path this viewer may not enter; it skips to the next one they may', () => {
    const edges = edgePaths(at([root, parent, a]), (n) => n.id !== 'b');
    expect(edges.map((e) => e.node.id)).toEqual(['c']);
    expect(edgePaths(at([root, parent, b]), () => false)).toEqual([]);
  });
});

describe('every way on is a side tunnel off the wall', () => {
  const H = 3600000;
  const a = node('a', [], { began: 0 });
  const b = node('b', [], { began: 3 * H });
  const c = node('c', [], { began: 3 * H + 60000 });
  const parent = node('parent', [a, b, c]);
  const root = node('root', [parent]);

  it('joins the ways on and the paths beside, once each, kept apart around the face', () => {
    const edges = edgePaths(at([root, parent, b]), all);
    const ahead = [{ node: c, path: [root, parent, c], angle: 0 }];
    const open = openingsOf(ahead, edges);
    expect(open.map((o) => o.node.id).sort()).toEqual(['a', 'c']);
    const both = openingsOf([{ node: c, path: [root, parent, c], angle: 0 }], edgePaths(at([root, parent, a]), all));
    // b and c were made a minute apart: never on top of each other
    expect(Math.abs(both[1].angle - both[0].angle)).toBeGreaterThan(0.3);
  });

  it('opens each one in the wall, a little way past the thing in front of you, at its own hour', () => {
    const open = openingsOf([], edgePaths(at([root, parent, b]), all));
    const mouths = mouthsOf(open, 10);
    for (const m of mouths) {
      expect(Math.hypot(m.x, m.y)).toBeCloseTo(1.3);
      expect(m.z).toBeGreaterThan(10);
      expect(Math.atan2(m.y, m.x)).toBeCloseTo(Math.atan2(Math.sin(m.p.angle), Math.cos(m.p.angle)));
    }
  });
});
