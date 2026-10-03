import { describe, expect, it } from 'vitest';
import type { IdeaNode } from './model';
import { relatedTo } from './relate';
import { buildWorld } from './world';

const node = (id: string, title: string, children: IdeaNode[] = [], extra: Partial<IdeaNode> = {}): IdeaNode => ({
  id,
  title,
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

describe('what a thing goes with, elsewhere', () => {
  const song = node('music/iu3d', '$IU3d');
  const night = node('music/night', 'one night');
  const clip = node('moment/c', 'dancing to #SIU3d');
  const other = node('moment/d', 'one night out');
  const sealed = node('p/s', 'IU3d secret', [], { disclosure: 0.8 });
  const root = node('canvas', '', [node('music', 'songs', [song, night]), node('dance', 'dancing', [clip, other]), node('p', 'posts', [sealed])]);

  it('finds the song a dance is danced to, by a rare shared name, across groups', () => {
    const r = relatedTo(root, [root, root.children[1], clip]);
    expect(r.map((x) => x.path[x.path.length - 1].id)).toEqual(['music/iu3d']);
  });

  it('never by a common word, never inside its own group, never to something sealed', () => {
    expect(relatedTo(root, [root, root.children[1], other])).toEqual([]);
    expect(relatedTo(root, [root, root.children[0], song]).map((x) => x.path[x.path.length - 1].id)).toEqual(['moment/c']);
  });

  it('on the real Slate, finds something for the dance', () => {
    const world = buildWorld([]);
    const found: string[] = [];
    const walk = (n: IdeaNode, p: IdeaNode[]) => {
      for (const c of n.children) {
        const q = [...p, c];
        for (const r of relatedTo(world, q)) found.push(`${c.id} -> ${r.path[r.path.length - 1].id} (${r.word})`);
        walk(c, q);
      }
    };
    walk(world, [world]);
    console.log(found.join('\n'));
    expect(found.length).toBeGreaterThan(0);
  });
});
