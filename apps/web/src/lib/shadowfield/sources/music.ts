// johne.boi's songs, given away as free modules for musicians to build on.
// Each song begins at the moment it was exported (from the file names).

import { IdeaNode } from '../model';
import { hashString } from '../rng';

const SONGS: { id: string; title: string; made: string }[] = [
  { id: 'naptimesellinynim', title: 'naptimesellinynim', made: '2026-09-21T16:44:21.588Z' },
  { id: 'mount-ever-wrizt', title: 'mount ever wrizt', made: '2026-09-21T16:45:41.080Z' },
  { id: 'dust', title: 'DusT', made: '2026-09-21T16:47:54.534Z' },
  { id: 'crhymes', title: 'CRHYMES', made: '2026-09-21T16:48:53.031Z' },
  { id: 'new-project', title: 'new project', made: '2026-09-21T17:26:16.490Z' },
  { id: 'dolonia', title: 'Dolonia', made: '2026-09-21T17:26:30.727Z' },
  { id: 'iu3d', title: 'IU3d', made: '2026-09-21T17:28:47.235Z' },
];

export function buildMusic(): IdeaNode {
  const songs: IdeaNode[] = SONGS.map((s) => {
    const t = Date.parse(s.made);
    return {
      id: `music/${s.id}`,
      title: s.title,
      kind: 'music',
      origin: 'real',
      began: t,
      events: [{ t, kind: 'begin', note: 'made' }],
      state: 'alive',
      disclosure: 0,
      children: [],
      media: [{ kind: 'audio', src: `/music/${s.id}.m4a` }],
      x: 0,
      y: 0,
      r: 0.05,
      seed: hashString(s.id),
      free: true,
    };
  });
  const first = Date.parse(SONGS[0].made);
  return {
    id: 'music',
    title: 'johne.boi · music',
    kind: 'music',
    origin: 'real',
    began: first,
    events: [{ t: first, kind: 'begin', note: 'first song' }],
    state: 'alive',
    disclosure: 0,
    children: songs,
    x: -0.42,
    y: 0.44,
    r: 0.0025,
    fixed: true,
    seed: hashString('music'),
    free: true,
  };
}
