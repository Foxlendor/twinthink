// Sample content, for private previews only. NOT real people or real work.
//
// Shown only on a preview build (a branch's own deployment) or while developing, never on the
// production domain (see `samplesAllowed`). Everything here lives in the browser: nothing is ever
// sent to or kept by the server (every id begins "sample/", and every keeper and server action
// refuses those ids). Each group says it is a sample, and the page says so too.
//
// It exists to see and feel the Slate at a busier scale than one maker's own work: several makers,
// groups, branches with alternatives, work spread across every hour, names shared across makers
// (so "goes with" has something to find), and enough depth for steering, lenses and Your Fall.

import { IdeaKind, IdeaNode } from '../model';
import { hashString, mulberry32 } from '../rng';

export const SAMPLE_PREFIX = 'sample/';

/** Whether a thing is sample content (never to leave the browser). */
export const isSample = (id: string) => id.startsWith(SAMPLE_PREFIX);

/**
 * Samples may show only on a preview build or while developing, and never on the production
 * domain, whatever the build says. Both must agree.
 */
export function samplesAllowed(deployEnv: string | undefined, hostname: string): boolean {
  if (/(^|\.)twinth\.ink$/i.test(hostname)) return false;
  return deployEnv === 'preview' || deployEnv === 'development';
}

interface Plan {
  maker: string;
  groups: { title: string; kind: IdeaKind; works: string[] }[];
}

// Invented makers and work, plainly: nothing here describes a real person or a real invention.
const PLANS: Plan[] = [
  {
    maker: 'Ada',
    groups: [
      { title: "Ada's drawings", kind: 'visual', works: ['harbour at dusk', 'lantern9 study', 'the long stair', 'moth and window', 'three hands', 'tidepool map'] },
      { title: "Ada's zine", kind: 'writing', works: ['issue one: rain', 'issue two: salt', 'letters page', 'the lantern9 issue'] },
    ],
  },
  {
    maker: 'Bo',
    groups: [
      { title: "Bo's beats", kind: 'music', works: ['slow engine', 'kettle loop', 'tidepool (instrumental)', 'night bus', 'kite string', 'two rooms'] },
      { title: "Bo's gear", kind: 'physical', works: ['cardboard sampler', 'foot switch v2', 'a speaker from a tin'] },
    ],
  },
  {
    maker: 'Cam',
    groups: [
      { title: "Cam's inventions", kind: 'physical', works: ['folding shelf', 'rain collector', 'bike light from a jar', 'lantern9 (a lamp)', 'hinge that remembers'] },
      { title: "Cam's notes", kind: 'writing', works: ['why things break', 'on hinges', 'what the jar taught me'] },
    ],
  },
  {
    maker: 'Dee',
    groups: [
      { title: "Dee's dances", kind: 'visual', works: ['kitchen floor', 'rooftop at six', 'kite string (dance)', 'slow engine (dance)', 'the hallway one'] },
      { title: "Dee's teaching", kind: 'writing', works: ['first steps', 'counting to eight', 'falling safely'] },
    ],
  },
  {
    maker: 'Eli',
    groups: [
      { title: "Eli's apps", kind: 'software', works: ['tide clock', 'shared shopping list', 'a timer that listens', 'map of benches'] },
      { title: "Eli's games", kind: 'software', works: ['paper boats', 'lantern9 (a puzzle)', 'two player kite'] },
    ],
  },
];

const DAY = 86400000;

/**
 * The sample makers, as groups on the Slate (one per maker's group), newest work first like
 * everything else. Deterministic: the same samples on every load, so a preview can be compared.
 */
export function buildSamples(now: number): IdeaNode[] {
  const out: IdeaNode[] = [];
  for (const plan of PLANS) {
    for (const g of plan.groups) {
      const gid = `${SAMPLE_PREFIX}${hashString(g.title).toString(36)}`;
      const rand = mulberry32(hashString(g.title));
      const works: IdeaNode[] = g.works.map((title, i) => {
        // spread across the last year and across every hour, so each quarter of the face has work
        const began = now - Math.floor(rand() * 360 + 2) * DAY - Math.floor(rand() * 24) * 3600000;
        const id = `${gid}/${i}`;
        const node: IdeaNode = {
          id,
          title,
          line: `by ${plan.maker} · sample`,
          kind: g.kind,
          origin: 'synthetic',
          began,
          events: [{ t: began, kind: 'begin', note: 'made (sample)' }],
          state: 'alive',
          disclosure: 0,
          children: [],
          artifact: { type: 'text', body: `${title}\n\n(sample content for previews: not a real person's work)` },
          x: 0,
          y: 0,
          r: 0.05,
          seed: hashString(id),
        };
        // some work has versions: a branch with alternatives (openings, a Lean, a path left open)
        if (i % 3 === 0) {
          node.artifact = undefined;
          node.children = ['first try', 'second try', 'the one I kept'].map((v, k) => {
            const t = began + (k + 1) * (2 + Math.floor(rand() * 20)) * DAY + Math.floor(rand() * 24) * 3600000;
            return {
              id: `${id}/${k}`,
              title: `${title}: ${v}`,
              line: `by ${plan.maker} · sample`,
              kind: g.kind,
              origin: 'synthetic',
              began: t,
              events: [{ t, kind: 'begin', note: 'made (sample)' }],
              state: 'alive',
              disclosure: 0,
              children: [],
              artifact: { type: 'text', body: `${title}, ${v}\n\n(sample content for previews)` },
              x: 0,
              y: 0,
              r: 0.05,
              seed: hashString(`${id}/${k}`),
            };
          });
        }
        return node;
      });
      const first = Math.min(...works.map((w) => w.began));
      out.push({
        id: gid,
        title: g.title,
        line: 'sample, for previews only.',
        kind: g.kind,
        origin: 'synthetic',
        began: first,
        events: [{ t: first, kind: 'begin', note: 'first sample work' }],
        state: 'alive',
        disclosure: 0,
        children: works,
        x: Math.cos(out.length * 2.39996) * 0.62,
        y: Math.sin(out.length * 2.39996) * 0.62,
        r: 0.0025,
        fixed: true,
        seed: hashString(gid),
      });
    }
  }
  return out;
}
