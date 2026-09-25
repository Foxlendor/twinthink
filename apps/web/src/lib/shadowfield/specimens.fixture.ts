// Synthetic specimens: a TEST FIXTURE ONLY.
//
// These are NOT human ideas and are never served by the site. They exist
// to exercise scale (tens of thousands of Shadows), deep procedural recursion,
// sealed disclosure, dormancy and abandonment. They carry no titles or text so
// they cannot be mistaken for real records.

import { IdeaNode, LifeEvent, EventKind, LifeState } from './model';
import { mulberry32, hashString } from './rng';

const DAY = 86400000;

function makeEvents(rand: () => number, t0: number, span: number): LifeEvent[] {
  const n = 1 + Math.floor(Math.pow(rand(), 1.8) * 24);
  const out: LifeEvent[] = [{ t: t0, kind: 'begin', note: 'began' }];
  let t = t0;
  let quiet = false;
  for (let i = 1; i < n; i++) {
    t += (span / n) * (0.2 + rand() * 1.6);
    if (!quiet && rand() < 0.06) {
      out.push({ t, kind: 'dormant', note: 'went quiet' });
      t += span * (0.2 + rand() * 0.4);
      out.push({ t, kind: 'revival', note: 'came back' });
      quiet = false;
      continue;
    }
    const r = rand();
    const kind: EventKind = r < 0.62 ? 'revision' : r < 0.78 ? 'experiment' : r < 0.86 ? 'failure' : r < 0.93 ? 'evidence' : 'prune';
    const note = { revision: 'changed', experiment: 'tested', failure: 'failed', evidence: 'evidence added', prune: 'cut away' }[kind as string];
    out.push({ t, kind, note });
  }
  const now = Date.now();
  return out.filter((e) => e.t <= now);
}

function specimen(id: string, seed: number, t0: number, span: number, depth: number, disclosure: number): IdeaNode {
  const rand = mulberry32(seed);
  const events = makeEvents(rand, t0, span);
  const s = rand();
  const state: LifeState = s < 0.12 ? 'abandoned' : s < 0.3 ? 'dormant' : 'alive';
  const node: IdeaNode = {
    id,
    title: '',
    kind: 'unknown',
    origin: 'synthetic',
    began: t0,
    events,
    state,
    disclosure,
    children: [],
    x: 0,
    y: 0,
    r: 0.05,
    seed,
  };
  if (depth < 7) {
    node.expand = () => {
      const r2 = mulberry32(seed ^ 0x5bd1e995);
      const n = depth === 0 ? 3 + Math.floor(r2() * 7) : Math.floor(Math.pow(r2(), 1.4) * 6);
      for (let i = 0; i < n; i++) {
        const ct0 = t0 + r2() * span * 0.8;
        const d = Math.min(1, disclosure + r2() * 0.35 * (depth + 1) * 0.5);
        node.children.push(specimen(`${id}.${i}`, hashString(`${id}.${i}`), ct0, span * (0.3 + r2() * 0.6), depth + 1, d));
      }
    };
  }
  return node;
}

export function buildRehearsalField(count = 12000): IdeaNode[] {
  const rand = mulberry32(20260925);
  const now = Date.now();
  const out: IdeaNode[] = [];
  for (let i = 0; i < count; i++) {
    // loose clusters: ideas tend to gather
    const cluster = Math.floor(rand() * 40);
    const cr = mulberry32(cluster * 7919 + 1);
    const cx = (cr() * 2 - 1) * 0.9;
    const cy = (cr() * 2 - 1) * 0.9;
    const spread = 0.04 + cr() * 0.22;
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.7) * spread;
    const age = Math.pow(rand(), 1.6) * 1400 * DAY;
    const n = specimen(`s${i}`, hashString(`s${i}`), now - age, age * (0.3 + rand() * 0.7), 0, 0);
    n.x = Math.max(-1, Math.min(1, cx + Math.cos(a) * d));
    n.y = Math.max(-1, Math.min(1, cy + Math.sin(a) * d));
    n.r = 0.0009;
    n.fixed = true;
    out.push(n);
  }
  return out;
}
