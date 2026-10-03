import { describe, expect, it } from 'vitest';
import { buildSamples, isSample, samplesAllowed } from './sources/samples';
import { buildWorld } from './world';
import { RULES, createCore, type Rule } from './core';
import type { Station } from './flight';

describe('sample content (private previews only)', () => {
  it('never shows on the real site, whatever the build says; only on a preview or in development', () => {
    expect(samplesAllowed('production', 'www.twinth.ink')).toBe(false);
    expect(samplesAllowed('preview', 'www.twinth.ink')).toBe(false);
    expect(samplesAllowed('preview', 'twinth.ink')).toBe(false);
    expect(samplesAllowed('production', 'twinthink-abc.vercel.app')).toBe(false);
    expect(samplesAllowed('local', 'localhost')).toBe(false);
    expect(samplesAllowed('preview', 'twinthink-git-branch-me.vercel.app')).toBe(true);
    expect(samplesAllowed('development', 'localhost')).toBe(true);
  });

  it('is plainly sample content: every id marked, every group says so, and it has branches to choose among', () => {
    const s = buildSamples(Date.UTC(2026, 8, 29));
    const all: string[] = [];
    const walk = (n: { id: string; children: { id: string; children: unknown[] }[] }) => {
      all.push(n.id);
      n.children.forEach((c) => walk(c as never));
    };
    s.forEach((g) => walk(g as never));
    expect(all.every(isSample)).toBe(true);
    expect(s.every((g) => g.line?.includes('sample') && g.origin === 'synthetic')).toBe(true);
    expect(s.some((g) => g.children.some((w) => w.children.length >= 2))).toBe(true);
    // the same samples every time, so previews can be compared
    expect(JSON.stringify(buildSamples(1e12).map((g) => g.id))).toBe(JSON.stringify(buildSamples(1e12).map((g) => g.id)));
  });

  it('leaves no anonymous trace: staying with a sample is never resonance', () => {
    const world = buildWorld([], undefined, buildSamples(Date.now()));
    const g = world.children.find((c) => isSample(c.id))!;
    const w = g.children.find((c) => !c.children.length)!;
    const at = { node: w, path: [world, g, w], depth: 2, gate: false, t: w.began } as unknown as Station;
    const kept: string[] = [];
    const core = createCore({ waiting: () => false }, (r: Rule) => kept.push(`${r.keeper} ${r.trace}`));
    core.frame(at, true, 0);
    core.frame(at, true, 9000);
    expect(kept.filter((k) => !k.startsWith('device'))).toEqual(['live station']);
    // (the page's keeper refuses sample ids for anything live or anonymous; see ShadowField keep())
    expect(RULES.find((r) => r.trace === 'resonance')).toBeTruthy();
  });

  it('is absent from the Slate unless asked for', () => {
    expect(buildWorld([]).children.some((c) => isSample(c.id))).toBe(false);
  });
});
