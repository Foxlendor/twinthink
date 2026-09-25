// Throwaways: ideas from the inventor's own archive, cleared by the inventor
// on 2026-09-25 and given away free, in his own word, as throwaways.
//
// Shown: the name and one line cut from the cleared `why` (the problem it
// answers), with words only removed, never added (a test checks this). Plus
// anything the inventor explicitly chose to show (SHOWN, below). The full
// cleared text lives in archive.cleared.ts, which only tests import, so it
// never ships to visitors. Never: how it works, mechanisms, materials or
// construction.
//
// History rule: nothing is invented. Each record begins on the day it was
// added to the Canvas; earlier history exists but has not been recorded yet.

import { IdeaNode, Media } from '../model';
import { hashString } from '../rng';

const ADDED = Date.parse('2026-09-25T15:00:00Z');

interface Cleared {
  id: string;
  title: string;
  kind: IdeaNode['kind'];
  /** Shown when still in front of it: cut from the cleared `why` (archive.cleared.ts), words only removed. */
  line?: string;
  x: number;
  y: number;
}

const CLEARED: Cleared[] = [
  {
    id: 'coinceit',
    title: 'CoinCeit',
    kind: 'software',
    line: 'ideas are easy to take and hard to attribute.',
    x: -0.46,
    y: -0.31,
  },
  {
    id: 'bubbleblock',
    title: 'BUBBLEYEBLOCK',
    kind: 'physical',
    x: 0.52,
    y: 0.27,
  },
  {
    id: 'wear-os',
    title: 'Wear O’s',
    kind: 'physical',
    line: 'jewellery and a working device, nothing extra to carry.',
    x: -0.18,
    y: 0.49,
  },
  {
    id: 'sipsmolder',
    title: 'SipSmolder',
    kind: 'physical',
    line: 'a drink goes cold long before you finish it.',
    x: 0.08,
    y: -0.57,
  },
  {
    id: 'smholder',
    title: 'Smholder',
    kind: 'physical',
    line: 'warm food wherever you are, with nothing to plug in.',
    x: 0.63,
    y: -0.38,
  },
  {
    id: 'u3dpen',
    title: 'U3dPEN',
    kind: 'physical',
    line: 'making by hand, from what would be thrown away.',
    x: -0.69,
    y: 0.18,
  },
  {
    id: 'ferropen',
    title: 'FerroPen',
    kind: 'physical',
    line: 'ink is final. this lets a drawing stay changeable.',
    x: -0.38,
    y: -0.66,
  },
  {
    id: 'ferro-display',
    title: 'Ferro / crystalline display',
    kind: 'physical',
    line: 'screens are flat and untouchable; information could have shape.',
    x: 0.34,
    y: 0.63,
  },
  {
    id: 'xylem-camouflage',
    title: 'Xylem thread camouflage',
    kind: 'physical',
    line: 'printed camouflage only works in the place it was designed for.',
    x: 0.71,
    y: 0.05,
  },
];

/**
 * Things the inventor chose to show, by idea. BubbleBlock: a short hand-drawn
 * film of one version of it, shared by the inventor for the Canvas on
 * 2026-09-25 (shown as it is; nothing added).
 */
const SHOWN: Record<string, { media: Media[]; t: number }> = {
  bubbleblock: {
    t: Date.parse('2026-09-25T20:21:00Z'),
    media: [
      {
        kind: 'video',
        src: '/films/bubbleblock.mp4',
        webm: '/films/bubbleblock.webm',
        poster: '/films/bubbleblock.jpg',
        x: 0,
        y: 0,
        w: 1.7,
        aspect: 576 / 1028,
        from: 0.2,
        to: 14.5,
        by: 'animated by johne.boi',
      },
    ],
  },
};

/** The throwaways: one ring you fly into, holding the ideas he gives away. */
export function buildThrowaways(): IdeaNode {
  // his own hand-drawn film first
  const order = [...CLEARED].sort((a, b) => Number(!!SHOWN[b.id]) - Number(!!SHOWN[a.id]));
  const children: IdeaNode[] = order.map((c) => ({
    id: `archive/${c.id}`,
    title: c.title,
    kind: c.kind,
    origin: 'real',
    began: ADDED,
    events: [
      { t: ADDED, kind: 'begin', note: 'added to the Canvas; earlier history not recorded yet' },
      ...(SHOWN[c.id] ? [{ t: SHOWN[c.id].t, kind: 'evidence' as const, note: 'a version of it, shown' }] : []),
    ],
    media: SHOWN[c.id]?.media,
    line: c.line,
    free: true,
    state: 'alive',
    disclosure: 0,
    children: [],
    x: 0,
    y: 0,
    r: 0.05,
    seed: hashString(c.id),
  }));
  return {
    id: 'throwaways',
    title: 'throwaways',
    line: 'given away, free to build on.',
    kind: 'physical',
    origin: 'real',
    began: ADDED,
    events: [{ t: ADDED, kind: 'begin', note: 'added to the Canvas; earlier history not recorded yet' }],
    state: 'alive',
    disclosure: 0,
    free: true,
    children,
    x: 0.52,
    y: 0.27,
    r: 0.0025,
    fixed: true,
    seed: hashString('throwaways'),
  };
}

/** The lines shown, for tests that guard them against invention. */
export const CLEARED_LINES = CLEARED.map((c) => ({ id: `archive/${c.id}`, line: c.line }));
