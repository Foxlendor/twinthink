import { describe, expect, it } from 'vitest';
import { edgePaths } from './flightRender';
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
