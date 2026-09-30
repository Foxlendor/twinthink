import { describe, expect, it } from 'vitest';
import type { IdeaNode } from '../shadowfield/model';
import { buildWorld } from '../shadowfield/world';
import { SIGNED_OUT, createWhoeuvreGraph, slateLink } from './whoeuvre';

const DAY = 86400000;
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

// a small Whoeuvre: two groups; one song grew from a sketch; one thing is sealed, with a secret under it
const sketch = node('sketch', [], { began: 10 * DAY });
const song = node('song', [], { began: 12 * DAY, links: [{ to: 'sketch', kind: 'grew-from' }] });
const old = node('old', [], { began: 300 * DAY });
const secret = node('secret');
const sealed = node('sealed', [secret], { disclosure: 0.9 });
const onDevice = node('local/mine');
const portal = node('portal', [], { portal: true });
const songs = node('songs', [song, sketch, old, sealed, portal], { began: 0 });
const lab = node('lab', [node('lamp')]);
const world = node('canvas', [songs, lab, onDevice]);

describe('a Whoeuvre as a source for the Fall', () => {
  const g = createWhoeuvreGraph(world);
  const strands = (id: string) => g.known!(id)!;
  const to = (id: string, other: string) => strands(id).find((s) => s.to === other);

  it('puts what a thing is part of, and what it grew from, above it', () => {
    expect(to('song', 'songs')).toMatchObject({ bearing: 'from', why: 'part of' });
    expect(to('song', 'sketch')).toMatchObject({ bearing: 'from', why: 'grew from' });
  });

  it('puts what it holds, and what grew from it, below it', () => {
    expect(to('songs', 'song')).toMatchObject({ bearing: 'to', why: 'inside it' });
    expect(to('sketch', 'song')).toMatchObject({ bearing: 'to', why: 'grew from it' });
  });

  it('puts what was made alongside it beside it, closer the nearer in time', () => {
    expect(to('sketch', 'old')?.bearing).toBe('beside');
    expect(to('song', 'old')!.strength).toBeLessThan(to('sketch', 'song')!.strength);
    const nearSibling = createWhoeuvreGraph(node('c', [node('g', [node('a', [], { began: 0 }), node('b', [], { began: 2 * DAY }), node('z', [], { began: 200 * DAY })])]));
    const s = nearSibling.known!('a')!;
    expect(s.find((x) => x.to === 'b')!.strength).toBeGreaterThan(s.find((x) => x.to === 'z')!.strength);
  });

  it('never offers anything a visitor who is not signed in could not enter, or anything on a device', () => {
    const all = [...['canvas', 'songs', 'song', 'sketch', 'old', 'lab'].flatMap((id) => strands(id).map((s) => s.to))];
    expect(all).not.toContain('sealed');
    expect(all).not.toContain('secret');
    expect(all).not.toContain('local/mine');
    expect(all).not.toContain('portal');
  });

  it('refuses, rather than invents, anything it does not hold', async () => {
    await expect(g.strands('secret')).rejects.toThrow();
    await expect(g.node('secret')).rejects.toThrow();
  });

  it('names the maker at the root, and links every place back to where it lives on the Slate', async () => {
    const root = await g.node('canvas');
    expect(root.title).toBe("johne.boi's Whoeuvre");
    const n = await g.node('song');
    expect(n.credit?.href).toBe('/slate?at=songs~song');
    expect(slateLink([world, songs, song])).toBe('/slate?at=songs~song');
  });

  it('opens the real Whoeuvre: its groups from the root, and only what is open to everyone', () => {
    const real = buildWorld([]);
    const rg = createWhoeuvreGraph(real);
    const groups = rg.known!(real.id)!.map((s) => s.to);
    expect(groups).toEqual(expect.arrayContaining(['music', 'dance', 'hex-lab']));
    // walk everything reachable and check none of it is sealed to a visitor
    const seen = new Set<string>([real.id]);
    const queue = [real.id];
    while (queue.length) {
      const id = queue.shift()!;
      for (const s of rg.known!(id) ?? []) {
        if (seen.has(s.to)) continue;
        seen.add(s.to);
        queue.push(s.to);
      }
    }
    expect(seen.size).toBeGreaterThan(20);
    const find = (n: IdeaNode, id: string, path: IdeaNode[] = []): IdeaNode[] | null => {
      if (n.id === id) return [...path, n];
      for (const c of n.children) {
        const p = find(c, id, [...path, n]);
        if (p) return p;
      }
      return null;
    };
    for (const id of seen) {
      const p = find(real, id)!;
      expect(p.slice(2).every((n) => n.disclosure <= SIGNED_OUT)).toBe(true);
      expect(/^(local\/|k\/|sample\/)/.test(id)).toBe(false);
    }
  });
});
