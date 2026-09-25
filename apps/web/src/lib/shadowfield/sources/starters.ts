// Free starters: Twins the inventor has chosen to give away for anyone to
// build on. Shown with as little text as possible: the object itself, alive.

import { IdeaNode } from '../model';
import { hashString } from '../rng';

// Both were published on the site in the same session (repository history).
const PUBLISHED = Date.parse('2026-09-21T05:52:01Z');

export function buildStarters(): IdeaNode[] {
  const base = (id: string, title: string, x: number, y: number): IdeaNode => ({
    id: `starter/${id}`,
    title,
    kind: 'physical',
    origin: 'real',
    began: PUBLISHED,
    events: [{ t: PUBLISHED, kind: 'begin', note: 'given away' }],
    state: 'alive',
    disclosure: 0,
    children: [],
    x,
    y,
    r: 0.0025,
    fixed: true,
    seed: hashString(id),
    free: true,
  });
  const redrink = base('redrink', 'redr.ink', -0.12, 0.2);
  redrink.media = [{ kind: 'model', src: '/resip_preview.glb', x: 0, y: -0.08, w: 0.9, aspect: 0.7 }];
  const twizzlock = base('twizzlock', 'TwizzLock', 0.3, 0.36);
  return [redrink, twizzlock];
}
