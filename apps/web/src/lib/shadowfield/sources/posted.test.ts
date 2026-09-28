import { describe, expect, it } from 'vitest';
import { buildPosted, Posted, PostedFork } from './posted';
import { travelled } from '../flight';

const now = Date.parse('2026-09-20T12:00:00Z');

function shadow(over: Partial<Posted> & { id: string; title: string }): Posted {
  return { by: 'Ana', body: '', public: true, created: now, updated: now, mine: false, ...over };
}

function fork(over: Partial<PostedFork> & { id: string; hostShadowId: string; title: string }): PostedFork {
  return { postAccess: 'invite', closed: false, created: now, mine: false, canPost: false, ...over };
}

describe('forks in the world', () => {
  it('a fork with a post inside becomes a real gate, and that post is never also loose at the top level', () => {
    const home = shadow({ id: 'home', title: 'a lamp that listens', mine: true, forks: [fork({ id: 'f1', hostShadowId: 'home', title: 'wiring', mine: true, canPost: true })] });
    const inside = shadow({ id: 'note', title: 'a wire I tried', mine: false, by: 'Ben', forkId: 'f1' });
    const world = buildPosted([], [home, inside], false, []);
    const yours = world.find((n) => n.id === 'yours')!;
    // the post is nowhere at the top level of "yours"...
    expect(yours.children.some((n) => n.id === 'p/note')).toBe(false);
    const homeNode = yours.children.find((n) => n.id === 'p/home')!;
    const forkNode = homeNode.children.find((n) => n.id === 'fork/f1')!;
    // ...only inside the fork, which is now a real gate
    expect(travelled(homeNode).length).toBeGreaterThan(0);
    expect(forkNode.children.map((n) => n.id)).toEqual(['p/note']);
    expect(forkNode.title).toBe('wiring');
  });

  it('an empty fork holds its place but is not yet a gate to travel through', () => {
    const home = shadow({ id: 'home', title: 'a lamp', mine: true, forks: [fork({ id: 'f1', hostShadowId: 'home', title: 'empty so far', mine: true, canPost: true })] });
    const world = buildPosted([], [home], false, []);
    const homeNode = world.find((n) => n.id === 'yours')!.children[0];
    const forkNode = homeNode.children.find((n) => n.id === 'fork/f1')!;
    expect(forkNode.children).toEqual([]);
    expect(travelled(forkNode).length).toBe(0);
  });

  it('a closed fork keeps what is inside, and says so in its own line', () => {
    const home = shadow({
      id: 'home',
      title: 'a lamp',
      mine: true,
      forks: [fork({ id: 'f1', hostShadowId: 'home', title: 'notes', mine: true, closed: true, canPost: false })],
    });
    const inside = shadow({ id: 'note', title: 'left before it closed', mine: false, by: 'Ben', forkId: 'f1' });
    const world = buildPosted([], [home, inside], false, []);
    const forkNode = world.find((n) => n.id === 'yours')!.children[0].children.find((n) => n.id === 'fork/f1')!;
    expect(forkNode.children.map((n) => n.id)).toEqual(['p/note']);
    expect(forkNode.line).toMatch(/stays/);
  });

  it('nests: a post inside a fork can itself hold another fork', () => {
    const home = shadow({ id: 'home', title: 'a lamp', mine: true, forks: [fork({ id: 'f1', hostShadowId: 'home', title: 'wiring', mine: true, canPost: true })] });
    const mid = shadow({ id: 'mid', title: 'a deeper note', forkId: 'f1', forks: [fork({ id: 'f2', hostShadowId: 'mid', title: 'deeper still', canPost: true })] });
    const deep = shadow({ id: 'deep', title: 'the deepest', forkId: 'f2' });
    const world = buildPosted([mid, deep], [home], false, []);
    const f1 = world.find((n) => n.id === 'yours')!.children[0].children.find((n) => n.id === 'fork/f1')!;
    const midNode = f1.children.find((n) => n.id === 'p/mid')!;
    const f2 = midNode.children.find((n) => n.id === 'fork/f2')!;
    expect(f2.children.map((n) => n.id)).toEqual(['p/deep']);
  });
});
