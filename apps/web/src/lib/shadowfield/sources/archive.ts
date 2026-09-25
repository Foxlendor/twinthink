// Ideas from the inventor's own archive, cleared by the inventor on 2026-09-25
// to appear on the public Canvas.
//
// Disclosure rule chosen by the inventor: on the Canvas each idea shows only
// its name and that it is alive, plus anything the inventor explicitly chose
// to show (SHOWN, below). The one-line summaries below are kept for
// reference but are not displayed. Never add mechanisms, materials or
// construction details here without new, explicit permission.
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
  /** What it does, in one line. */
  does: string;
  /** The problem it answers. */
  why: string;
  x: number;
  y: number;
}

const CLEARED: Cleared[] = [
  {
    id: 'coinceit',
    title: 'CoinCeit',
    kind: 'software',
    does: 'A place to share ideas while keeping credit for them.',
    why: 'Ideas are easy to take and hard to attribute. An earlier attempt at the problem TwinThink now works on.',
    x: -0.46,
    y: -0.31,
  },
  {
    id: 'bubbleblock',
    title: 'BUBBLEYEBLOCK',
    kind: 'physical',
    does: 'Glasses that keep advertisements in the real world out of the wearer’s view.',
    why: 'You can block ads on a screen, but not on a street.',
    x: 0.52,
    y: 0.27,
  },
  {
    id: 'wear-os',
    title: 'Wear O’s',
    kind: 'physical',
    does: 'A ring that is also a discreet personal vaporizer.',
    why: 'An everyday object that is both jewellery and a working device, so there is nothing extra to carry.',
    x: -0.18,
    y: 0.49,
  },
  {
    id: 'sipsmolder',
    title: 'SipSmolder',
    kind: 'physical',
    does: 'A reusable straw that warms a drink as you sip it, with no cord and no battery.',
    why: 'A drink goes cold long before you finish it.',
    x: 0.08,
    y: -0.57,
  },
  {
    id: 'smholder',
    title: 'Smholder',
    kind: 'physical',
    does: 'A food and drink container that warms what is inside on demand, without a microwave.',
    why: 'Warm food wherever you are, with nothing to plug in.',
    x: 0.63,
    y: -0.38,
  },
  {
    id: 'u3dpen',
    title: 'U3dPEN',
    kind: 'physical',
    does: 'A handheld pen that builds three-dimensional things from recovered material.',
    why: 'Making something by hand usually means buying new material; this starts from what would be thrown away.',
    x: -0.69,
    y: 0.18,
  },
  {
    id: 'ferropen',
    title: 'FerroPen',
    kind: 'physical',
    does: 'A drawing tool whose marks can be moved, reshaped, and taken back up after they are made.',
    why: 'Ink is final. This lets a drawing stay changeable and its material reusable.',
    x: -0.38,
    y: -0.66,
  },
  {
    id: 'ferro-display',
    title: 'Ferro / crystalline display',
    kind: 'physical',
    does: 'A display whose pixels physically move and can hold their shape, so you can feel an image as well as see it.',
    why: 'Screens are flat and untouchable; information could have shape.',
    x: 0.34,
    y: 0.63,
  },
  {
    id: 'xylem-camouflage',
    title: 'Xylem thread camouflage',
    kind: 'physical',
    does: 'A fabric that changes its own appearance to match its surroundings.',
    why: 'Printed camouflage only works in the place it was designed for.',
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
      },
    ],
  },
};

export function buildArchiveShadows(): IdeaNode[] {
  return CLEARED.map((c) => ({
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
    state: 'alive',
    disclosure: 0,
    children: [],
    x: c.x,
    y: c.y,
    r: 0.0025,
    fixed: true,
    seed: hashString(c.id),
  }));
}
