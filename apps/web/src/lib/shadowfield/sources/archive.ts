// Throwaways: ideas from the inventor's own archive, given away free, in his
// own word, as throwaways.
//
// What is shown was asked for by the inventor on 2026-09-25: each throwaway
// carries a plain label, what it is, why it exists, where it came from, what
// it led to and the story of its name, and threads of lineage run between the
// ones that grew out of each other.
//
// Never shown: how anything works. No mechanisms, materials, parts or
// construction (a test guards the words). Only the inventor can open that.
//
// History rule: nothing is invented. Each record begins on the day it was
// added to the Canvas; earlier history exists but has not been recorded yet.

import { IdeaNode, Media } from '../model';
import { hashString } from '../rng';

const ADDED = Date.parse('2026-09-25T15:00:00Z');

interface Throwaway {
  id: string;
  title: string;
  kind: IdeaNode['kind'];
  /** The label under the name: what it is, in a few plain words. */
  line: string;
  /** What it is. */
  what: string;
  /** The problem it answers. */
  why: string;
  /** Where it came from. */
  roots?: string;
  /** What came of it. */
  became?: string;
  /** How it got its name. */
  name?: string;
  /** Throwaways (by id) this one grew out of. Drawn as a thread of lineage. */
  grewFrom?: string[];
}

export const THROWAWAYS: Throwaway[] = [
  {
    id: 'coinceit',
    title: 'CoinCeit',
    kind: 'software',
    line: 'share an idea and keep the credit',
    what: 'A place to put an idea out into the world and still be known as the person who had it.',
    why: 'Ideas are easy to take and hard to attribute, so most people keep theirs to themselves.',
    became: 'TwinThink grew out of the same problem, much further along.',
  },
  {
    id: 'bubbleblock',
    title: 'BUBBLEYEBLOCK',
    kind: 'physical',
    line: 'glasses that keep ads out of the real world',
    what: 'A pair of glasses that keeps advertisements in the physical world out of the wearer’s view.',
    why: 'You can block ads on a screen, but not on a street, a bus or a billboard.',
    name: 'First called BubbleBlock. The name grew an eye: BUBBLEYEBLOCK, said like bubble eye block.',
  },
  {
    id: 'wear-os',
    title: 'Wear O’s',
    kind: 'physical',
    line: 'a ring that is also a working device',
    what: 'A ring that is also a discreet personal vaporizer.',
    why: 'Something you already wear can be the device itself, so there is nothing extra to carry.',
  },
  {
    id: 'sipsmolder',
    title: 'SipSmolder',
    kind: 'physical',
    line: 'a straw that warms your drink as you sip',
    what: 'A reusable straw that warms a drink as you sip it, with no cord and no battery.',
    why: 'A drink goes cold long before you finish it.',
    roots: 'It grew out of ReSip, a heated straw first built for a science fair in 2016.',
    became: 'The same warmth moved into a bigger vessel: Smholder.',
  },
  {
    id: 'smholder',
    title: 'Smholder',
    kind: 'physical',
    line: 'a container that warms food, nothing to plug in',
    what: 'A food and drink container that warms what is inside when you want it to, without a microwave.',
    why: 'Warm food wherever you are, with nothing to plug in.',
    roots: 'SipSmolder’s warmth, given a whole meal to hold.',
    grewFrom: ['sipsmolder'],
  },
  {
    id: 'ferropen',
    title: 'FerroPen',
    kind: 'physical',
    line: 'a drawing that stays changeable',
    what: 'A drawing tool whose marks can be moved again and taken back up, so a drawing is never final.',
    why: 'Ink is final. This lets a drawing stay changeable.',
    became: 'It went two ways: into U3dPEN, a pen that makes objects, and into a display whose pixels have shape.',
  },
  {
    id: 'u3dpen',
    title: 'U3dPEN',
    kind: 'physical',
    line: 'a pen that makes things from what gets thrown away',
    what: 'A handheld pen that builds small objects out of material that would otherwise be thrown away.',
    why: 'Making things by hand should not need new material every time.',
    roots: 'It grew out of FerroPen: a mark you can take back up became a mark you can build with.',
    name: 'Written U3dPEN on purpose. Turn it upside down and it reads differently.',
    grewFrom: ['ferropen'],
  },
  {
    id: 'ferro-display',
    title: 'Ferro / crystalline display',
    kind: 'physical',
    line: 'a screen whose pixels have shape',
    what: 'A display whose pixels can physically move, rise and hold their shape.',
    why: 'Screens are flat and untouchable. Information could have shape.',
    roots: 'From FerroPen: marks that can move, grown into a whole surface of them.',
    became: 'Nothing built yet. It points toward maps you can feel, surfaces that reshape and patterns that stay put.',
    grewFrom: ['ferropen'],
  },
  {
    id: 'xylem-camouflage',
    title: 'Xylem thread camouflage',
    kind: 'physical',
    line: 'fabric that changes its look to match where it is',
    what: 'A fabric that changes how it looks to match its surroundings, instead of printing one pattern once.',
    why: 'Printed camouflage only works in the place it was designed for.',
    roots: 'Named after the way plants carry water up through themselves.',
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

/** The parts you find inside a throwaway, in the order you meet them. */
const FACETS: Array<{ key: 'what' | 'why' | 'roots' | 'became' | 'name'; title: string }> = [
  { key: 'what', title: 'what it is' },
  { key: 'why', title: 'why it exists' },
  { key: 'roots', title: 'where it came from' },
  { key: 'became', title: 'what came of it' },
  { key: 'name', title: 'its name' },
];

function facets(t: Throwaway): IdeaNode[] {
  return FACETS.filter((f) => t[f.key]).map((f) => ({
    id: `archive/${t.id}/${f.key}`,
    title: f.title,
    kind: 'writing' as const,
    origin: 'real' as const,
    began: ADDED,
    events: [{ t: ADDED, kind: 'begin' as const, note: 'written for the Canvas' }],
    state: 'alive' as const,
    disclosure: 0,
    artifact: { type: 'text' as const, body: t[f.key]! },
    children: [],
    x: 0,
    y: 0,
    r: 0.05,
    seed: hashString(`${t.id}/${f.key}`),
  }));
}

/** The throwaways: one ring you fly into, holding the ideas he gives away. */
export function buildThrowaways(): IdeaNode {
  // his own hand-drawn film first
  const order = [...THROWAWAYS].sort((a, b) => Number(!!SHOWN[b.id]) - Number(!!SHOWN[a.id]));
  const children: IdeaNode[] = order.map((t) => ({
    id: `archive/${t.id}`,
    title: t.title,
    kind: t.kind,
    origin: 'real',
    began: ADDED,
    events: [
      { t: ADDED, kind: 'begin', note: 'added to the Canvas; earlier history not recorded yet' },
      ...(SHOWN[t.id] ? [{ t: SHOWN[t.id].t, kind: 'evidence' as const, note: 'a version of it, shown' }] : []),
    ],
    media: SHOWN[t.id]?.media,
    line: t.line,
    free: true,
    state: 'alive',
    disclosure: 0,
    children: facets(t),
    links: (t.grewFrom ?? []).map((from) => ({ to: `archive/${from}`, kind: 'grew-from' as const })),
    x: 0,
    y: 0,
    r: 0.05,
    seed: hashString(t.id),
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
