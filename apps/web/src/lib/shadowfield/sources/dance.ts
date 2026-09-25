// johne.boi dancing: a film the inventor shared for the Canvas on 2026-09-25.
// Nothing is added to it; it begins on the Canvas when it was added.

import { IdeaNode } from '../model';
import { hashString } from '../rng';

const ADDED = Date.parse('2026-09-25T20:23:00Z');

export function buildDance(): IdeaNode {
  return {
    id: 'dance',
    title: 'johne.boi · dance',
    kind: 'visual',
    origin: 'real',
    began: ADDED,
    events: [{ t: ADDED, kind: 'begin', note: 'added to the Canvas' }],
    state: 'alive',
    disclosure: 0,
    children: [],
    media: [
      {
        kind: 'video',
        src: '/films/dance-1.mp4',
        poster: '/films/dance-1.jpg',
        x: 0,
        y: 0,
        w: 1.25,
        aspect: 1024 / 576,
        round: true,
      },
    ],
    x: -0.58,
    y: 0.12,
    r: 0.0025,
    fixed: true,
    seed: hashString('dance'),
  };
}
