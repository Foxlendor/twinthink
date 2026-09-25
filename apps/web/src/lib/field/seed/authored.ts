import type { EvidenceRef, HistoryEventType, NodeKind, Origin, RelationshipType, ShadowGlyph } from '../model';
import type { DomainKey } from './vocab';

/**
 * Hand-authored seed journeys.
 *
 * These are the paths the prototype must prove end to end. They are seeded
 * (origin: 'seeded') unless a node is tied to an existing Twin record, in which
 * case the record-derived parts are marked origin: 'record' by the adapter.
 *
 * `children: undefined` means "continue procedurally below here";
 * `children: []` means "this is a leaf".
 */
export interface AuthoredSpec {
  slug: string;
  kind: NodeKind;
  title: string;
  gist?: string;
  body?: string;
  glyph?: ShadowGlyph;
  /** Disclosure depth d(x). Defaults by kind and depth. */
  d?: number;
  /** Days ago this began. */
  began: number;
  events?: Array<[HistoryEventType, number, string?]>;
  twin?: { creator: string; note: string; backers: number; returners: number };
  /** Existing Twin record id in lib/twinsData.ts. */
  record?: string;
  evidence?: EvidenceRef[];
  /** [type, sibling slug] */
  rel?: Array<[RelationshipType, string]>;
  children?: AuthoredSpec[];
  /** Extra procedurally generated children after the authored ones. */
  extra?: number;
  /** Defaults to 'seeded'. The record adapter sets 'record'. */
  origin?: Origin;
}

export interface AuthoredConstellation {
  domain: DomainKey;
  handle: string;
  began: number;
  twins: AuthoredSpec[];
  extra: number;
}

const leaf = (slug: string, kind: NodeKind, title: string, began: number, body: string, more: Partial<AuthoredSpec> = {}): AuthoredSpec => ({
  slug,
  kind,
  title,
  began,
  body,
  children: [],
  events: [
    ['began', began],
    [kind === 'evidence' || kind === 'media' ? 'evidence' : 'revised', began],
  ],
  ...more,
});

const MOUNT_EVER_WRIST: AuthoredSpec = {
  slug: 'mount-ever-wrist',
  kind: 'twin',
  title: 'Mount Ever Wrist',
  gist: 'A song that started as a joke about a watch.',
  glyph: 'audio',
  began: 420,
  d: 0.1,
  twin: {
    creator: 'johne.boi',
    note: 'It started as a joke about a watch and turned into the only song I cannot stop rewriting.',
    backers: 37,
    returners: 212,
  },
  events: [
    ['began', 420, 'Hummed into a phone on a bus'],
    ['revised', 412],
    ['revised', 405],
    ['branched', 380, 'The way of singing the hook split off on its own'],
    ['returned', 372],
    ['revised', 360],
    ['dead_end', 350, 'The first hook'],
    ['revised', 331],
    ['returned', 318],
    ['branched', 300],
    ['revised', 296],
    ['dormant', 270, 'Put down for the winter'],
    ['revived', 190, 'Came back to it after the winter'],
    ['revised', 186],
    ['returned', 181],
    ['revised', 150],
    ['evidence', 120, 'Kitchen voice memo'],
    ['revised', 96],
    ['returned', 70],
    ['revised', 64],
    ['converged', 40, 'The verse melody and the hook finally share a note'],
    ['evidence', 30],
    ['revised', 12],
    ['returned', 5],
    ['revised', 3],
    ['visited', 8],
    ['visited', 2],
  ],
  children: [
    {
      slug: 'why',
      kind: 'facet',
      title: 'Why this song',
      gist: 'A watch that stopped the day everything changed.',
      began: 420,
      d: 0.12,
      children: [
        leaf('the-watch', 'thought', 'The watch', 419, 'It stopped at 4:12 and I never fixed it. The song is me trying to climb out of that minute.'),
        leaf('title', 'thought', 'Why the title is a pun', 300, 'Mount Everest, but on a wrist. Something enormous you carry every day without noticing.', { d: 0.3 }),
      ],
    },
    {
      slug: 'hook',
      kind: 'facet',
      title: 'Hook',
      gist: 'Four notes, rewritten more than anything else here.',
      began: 410,
      d: 0.12,
      events: [
        ['began', 410],
        ['revised', 400],
        ['dead_end', 350],
        ['revised', 300],
        ['revised', 190],
        ['revised', 12],
      ],
      children: [
        {
          slug: 'first-hook',
          kind: 'dead_end',
          title: 'First hook (abandoned)',
          gist: 'Too clever. Nobody could sing it back.',
          began: 408,
          d: 0.2,
          events: [
            ['began', 408],
            ['revised', 395],
            ['dead_end', 350, 'Nobody could sing it back'],
          ],
          children: [leaf('memo', 'evidence', 'Voice memo — the original', 408, '0:19, sung over a phone speaker. It sounds like a jingle, which is exactly the problem.', { evidence: [{ medium: 'audio', label: 'Voice memo, 0:19' }] })],
        },
        {
          slug: 'vocal-concept',
          kind: 'branch',
          title: 'Vocal concept',
          gist: 'Half-whispered, stacked in fourths.',
          began: 380,
          d: 0.18,
          twin: {
            creator: 'johne.boi',
            note: 'The hook is really a way of singing, not a melody. I think this might outlive the song.',
            backers: 9,
            returners: 41,
          },
          rel: [['branched_from', 'first-hook']],
          events: [
            ['began', 380, 'Split off from the hook'],
            ['revised', 378],
            ['revised', 300],
            ['dead_end', 250, 'Formant shifting'],
            ['returned', 240],
            ['revived', 190],
            ['revised', 190],
            ['evidence', 120],
            ['revised', 60],
            ['returned', 12],
          ],
          children: [
            {
              slug: 'sung-straight',
              kind: 'revision',
              title: 'Sung straight',
              gist: 'The obvious version. Clean, forgettable.',
              began: 378,
              d: 0.2,
              children: [leaf('take-2', 'evidence', 'Bounce, take 2', 377, 'Every note in tune. That is what is wrong with it.', { evidence: [{ medium: 'audio', label: 'Bounce, 0:32' }] })],
            },
            {
              slug: 'whispered-double',
              kind: 'revision',
              title: 'Whispered double',
              gist: 'Two whispers panned apart. Closer.',
              began: 300,
              d: 0.24,
              rel: [['revises', 'sung-straight']],
              children: [leaf('car-memo', 'evidence', 'Voice memo — car', 300, 'Recorded parked outside work. The engine hum sits under it like a drone note.', { evidence: [{ medium: 'audio', label: 'Voice memo, 0:27' }] })],
            },
            {
              slug: 'formant-shift',
              kind: 'dead_end',
              title: 'Formant shift',
              gist: 'Sounded like everyone else.',
              began: 262,
              d: 0.26,
              rel: [['branched_from', 'whispered-double']],
              events: [
                ['began', 262],
                ['revised', 258],
                ['dead_end', 250, 'Sounded like everyone else'],
              ],
              children: [leaf('why-not', 'thought', 'Why it stopped', 250, 'It made the voice sound expensive and anonymous. The point was that it sounded like one tired person.')],
            },
            {
              slug: 'stacked-fourths',
              kind: 'revision',
              title: 'Stacked fourths',
              gist: 'Three voices a fourth apart, the top one whispered. This is the one.',
              began: 190,
              d: 0.3,
              rel: [['revises', 'whispered-double']],
              events: [
                ['began', 190],
                ['revised', 176],
                ['evidence', 120],
                ['revised', 60],
                ['evidence', 30],
              ],
              children: [
                leaf('kitchen-memo', 'evidence', 'Voice memo — kitchen, 2am', 120, '0:41. Recorded after everyone was asleep, so the top voice is barely there. That turned out to be the sound.', {
                  evidence: [{ medium: 'audio', label: 'Voice memo, 0:41' }],
                  d: 0.3,
                }),
                leaf('session-notes', 'evidence', 'Session notes', 118, 'Fourths, not thirds — thirds made it sweet. Whisper on the top voice only. Do not tune the middle voice; the drift is the point.', {
                  evidence: [{ medium: 'text', label: 'Notes' }],
                  d: 0.32,
                }),
                leaf('three-takes', 'media', 'Three takes, same bar', 60, 'Loudness of the top voice across three takes. The quietest one is the keeper.', {
                  evidence: [{ medium: 'measurement', label: 'Top-voice level (dB)', series: [-14, -13, -15, -18, -21, -19, -22, -24, -23, -26, -25, -27] }],
                  d: 0.44,
                }),
                leaf('live-room', 'question', 'Does it survive a live room?', 30, 'A whisper disappears in a loud room. Maybe that is fine. Maybe the live version is a different song.', { d: 0.5 }),
              ],
            },
            leaf('live-version', 'question', 'A live arrangement', 20, 'Not ready to show.', { d: 0.85 }),
          ],
        },
        {
          slug: 'hook-rhythm',
          kind: 'experiment',
          title: 'Rhythm of the hook',
          gist: 'Moving the first note off the beat.',
          began: 360,
          d: 0.22,
          children: [
            leaf('straight', 'dead_end', 'Straight eighths', 360, 'Marching. Dropped the same day.', {
              events: [
                ['began', 360],
                ['dead_end', 359],
              ],
            }),
            leaf('pushed', 'revision', 'Pushed a sixteenth early', 331, 'The first note arrives slightly before you expect it. That is the whole hook now.', { rel: [['revises', 'straight']] }),
          ],
        },
        leaf('needs-words', 'question', 'Does it need words?', 200, 'Tried it as pure sound for a month. People sang the sound back, not a lyric. Still undecided.', { d: 0.22 }),
      ],
    },
    { slug: 'verses', kind: 'facet', title: 'Verses', gist: 'Where the story actually happens.', began: 395, d: 0.16 },
    { slug: 'sound', kind: 'facet', title: 'Sound', gist: 'Palette, textures, the room it lives in.', began: 330, d: 0.18 },
    { slug: 'arrangement', kind: 'facet', title: 'Arrangement', gist: 'What enters when, and what leaves.', began: 240, d: 0.46 },
    { slug: 'unreleased-mix', kind: 'facet', title: 'Unreleased mix', began: 30, d: 0.9 },
  ],
};

const TWIZZLOCK: AuthoredSpec = {
  slug: 'twizzlock',
  kind: 'twin',
  record: 'twizzlock',
  title: 'TwizzLock',
  gist: 'Use the bottle itself as a piston to keep soda from going flat.',
  glyph: 'physical',
  began: 310,
  d: 0.1,
  twin: {
    creator: 'johne.boi',
    note: 'Flat soda, every time. Then I noticed the bottle was already a piston.',
    backers: 0,
    returners: 0,
  },
  events: [
    ['began', 310, 'Flat soda, again'],
    ['revised', 300],
    ['dead_end', 280, 'Separate pump bulb'],
    ['branched', 262, 'The valve became its own problem'],
    ['revised', 250],
    ['returned', 240],
    ['dead_end', 205, 'Umbrella valve leaked back'],
    ['revised', 190, 'Duckbill valve'],
    ['evidence', 182, 'Pressure hold log'],
    ['returned', 150],
    ['revised', 120],
    ['branched', 96, 'Two-chamber sleeve'],
    ['returned', 60],
    ['revised', 28],
    ['evidence', 20],
    ['returned', 6],
  ],
  children: [
    {
      slug: 'origin',
      kind: 'facet',
      title: 'Origin',
      gist: 'The bottle is already a piston.',
      began: 310,
      d: 0.1,
      children: [
        leaf('flat', 'thought', 'Flat soda, every time', 310, 'Half a two-litre bottle goes flat by the next day. The empty space is the problem, not the cap.'),
        leaf('insight', 'thought', 'The bottle is the piston', 302, 'Push the bottle down into a sleeve and the headspace has nowhere to go. No pump, no cartridge.', { d: 0.14 }),
      ],
    },
    {
      slug: 'mechanism',
      kind: 'facet',
      title: 'Mechanism',
      gist: 'How it is supposed to work.',
      began: 300,
      d: 0.12,
      children: [
        {
          slug: 'pump-bulb',
          kind: 'dead_end',
          title: 'Separate pump bulb',
          gist: 'Worked. One more thing to lose.',
          began: 298,
          d: 0.16,
          events: [
            ['began', 298],
            ['revised', 290],
            ['dead_end', 280, 'One more thing to lose'],
          ],
          children: [leaf('why', 'thought', 'Why it stopped', 280, 'The bulb worked, but nobody keeps a bulb next to the fridge. The mechanism had to be the bottle and nothing else.')],
        },
        {
          slug: 'piston',
          kind: 'branch',
          title: 'Bottle as piston',
          gist: 'Push down; the headspace collapses; the valve holds it there.',
          began: 296,
          d: 0.14,
          rel: [['branched_from', 'pump-bulb']],
          children: [
            leaf('agitation', 'experiment', 'Pumping speed vs. fizz', 230, 'Pump fast and you shake loose the bubbles you are trying to keep. Slow strokes win.', { d: 0.24 }),
            leaf('lock', 'component', 'Retainer lock', 150, 'Stops the PET wall springing back under carbonation pressure once it is compressed.', { d: 0.3 }),
          ],
        },
        {
          slug: 'check-valve',
          kind: 'component',
          title: 'Base check valve',
          gist: 'Air out, never back in.',
          began: 262,
          d: 0.18,
          events: [
            ['began', 262],
            ['revised', 240],
            ['dead_end', 205],
            ['revised', 190],
            ['evidence', 182],
            ['revised', 120],
          ],
          children: [
            {
              slug: 'umbrella',
              kind: 'dead_end',
              title: 'Umbrella valve',
              gist: 'Leaked back under pressure after about forty cycles.',
              began: 240,
              d: 0.22,
              events: [
                ['began', 240],
                ['revised', 226],
                ['evidence', 214],
                ['dead_end', 205, 'Leaked back after ~40 cycles'],
              ],
              children: [
                leaf('umbrella-log', 'evidence', 'Pressure hold, umbrella valve', 214, 'Bottle pressure over twelve hours. It starts fine and bleeds away.', {
                  evidence: [{ medium: 'measurement', label: 'Pressure (kPa) over 12 h', series: [210, 206, 199, 188, 176, 161, 150, 138, 129, 118, 110, 104] }],
                }),
              ],
            },
            {
              slug: 'duckbill',
              kind: 'revision',
              title: 'Duckbill valve, 6 mm bore',
              gist: 'Food-safe TPE duckbill. It holds.',
              began: 196,
              d: 0.26,
              rel: [['revises', 'umbrella']],
              events: [
                ['began', 196],
                ['revised', 190],
                ['evidence', 182],
                ['revised', 120],
              ],
              children: [
                leaf('duckbill-log', 'evidence', 'Pressure hold, duckbill', 182, 'Same twelve-hour test. Flat line.', {
                  evidence: [{ medium: 'measurement', label: 'Pressure (kPa) over 12 h', series: [210, 209, 209, 208, 208, 207, 207, 207, 206, 206, 206, 205] }],
                  d: 0.28,
                }),
                {
                  slug: 'molding',
                  kind: 'component',
                  title: 'Manufacturing detail: molded duckbill',
                  gist: 'Stock food-contact TPE part first; custom mold only if the numbers hold.',
                  began: 120,
                  d: 0.48,
                  children: [
                    leaf('shore', 'thought', 'Softness', 118, 'Shore 50A. Softer seals better but tears at the bill; harder cracks in the cold.', { d: 0.5 }),
                    leaf('supplier', 'evidence', 'Supplier samples', 100, 'Three sample batches compared.', { d: 0.9, evidence: [{ medium: 'file', label: 'Sample comparison' }] }),
                  ],
                },
              ],
            },
            leaf('seat', 'question', 'Does the valve need a seat insert?', 60, 'Maybe. It depends on how different bottle bases are from one brand to the next.', { d: 0.3 }),
          ],
        },
      ],
    },
    {
      slug: 'materials',
      kind: 'facet',
      title: 'Sleeve',
      gist: 'The part your hand actually holds.',
      began: 250,
      d: 0.14,
      children: [
        leaf('single', 'dead_end', 'Single-wall sleeve', 250, 'Ballooned at the base.', {
          events: [
            ['began', 250],
            ['dead_end', 236],
          ],
        }),
        leaf('two-chamber', 'revision', 'Two-chamber sleeve', 96, 'TPU-coated ripstop nylon in two chambers, so it collapses where it should and nowhere else.', { rel: [['revises', 'single']], d: 0.24 }),
      ],
    },
    { slug: 'manufacturing', kind: 'facet', title: 'Making more than one', began: 90, d: 0.5 },
  ],
};

const MOVING_THROUGH: AuthoredSpec = {
  slug: 'moving-through',
  kind: 'twin',
  title: 'Moving through ideas, not past them',
  gist: 'A feed moves content past you. What if you moved through it instead?',
  glyph: 'unknown',
  began: 540,
  d: 0.1,
  twin: {
    creator: 'johne.boi',
    note: 'I do not fully know what this is yet. I know the feed is the wrong shape for ideas.',
    backers: 58,
    returners: 390,
  },
  events: [
    ['began', 540],
    ['revised', 500],
    ['dead_end', 460, 'Ranking by likes'],
    ['revised', 420],
    ['returned', 380],
    ['branched', 300, 'Shadows'],
    ['revised', 240],
    ['branched', 120, 'Depth instead of scroll'],
    ['returned', 40],
    ['revised', 2],
  ],
  children: [
    {
      slug: 'feed',
      kind: 'facet',
      title: 'The feed',
      gist: 'Moves content past you, forever.',
      began: 540,
      children: [
        leaf('likes', 'dead_end', 'Ranking by likes', 500, 'Tried it. It rewards whatever is finished and loud, which is the opposite of an idea that is still alive.', {
          events: [
            ['began', 500],
            ['dead_end', 460],
          ],
        }),
      ],
    },
    {
      slug: 'backing',
      kind: 'facet',
      title: 'Backing',
      gist: '“I want to see what happens next.”',
      began: 420,
      children: [leaf('not-like', 'thought', 'Not a like', 420, 'Backing is not approval, a rating or a purchase. It is one durable signal: keep going, I am watching.')],
    },
    {
      slug: 'shadows',
      kind: 'facet',
      title: 'Shadows',
      gist: 'You never see the whole idea. You see how much you are close enough to see.',
      began: 300,
      children: [leaf('closer', 'thought', 'Getting closer', 300, 'People who back an idea, and people who keep coming back, can see a little further into it than a stranger.')],
    },
    {
      slug: 'depth',
      kind: 'facet',
      title: 'Depth instead of scroll',
      gist: 'Scrolling means going in, not going on.',
      began: 120,
      children: [leaf('earth', 'thought', 'Like a map, not a list', 120, 'Zooming in should change what you see, not just how big it is. Far away, a speck. Close up, a whole history.')],
    },
  ],
};

const identityOnly = (slug: string, title: string, glyph: ShadowGlyph, began: number, creator: string, note: string, backers: number, returners: number): AuthoredSpec => ({
  slug,
  kind: 'twin',
  title,
  glyph,
  began,
  d: 0.12,
  twin: { creator, note, backers, returners },
});

export const AUTHORED_CONSTELLATIONS: AuthoredConstellation[] = [
  { domain: 'music', handle: 'johne.boi', began: 420, twins: [MOUNT_EVER_WRIST], extra: 2 },
  {
    domain: 'engineering',
    handle: 'johne.boi',
    began: 3450,
    twins: [
      { slug: 'resip', kind: 'twin', record: '0001', title: 'ReSip', glyph: 'physical', began: 3452, d: 0.1, twin: { creator: 'johne.boi', note: 'A science fair straw that warmed your drink with no battery. It never really stopped.', backers: 0, returners: 0 } },
      TWIZZLOCK,
      { slug: 'redrink', kind: 'twin', record: 'redrink', title: 'redr.ink', glyph: 'physical', began: 5, d: 0.1, twin: { creator: 'johne.boi', note: 'The ReSip idea again, ten years later, knowing what I know now.', backers: 0, returners: 0 } },
    ],
    extra: 0,
  },
  { domain: 'abstract', handle: 'johne.boi', began: 540, twins: [MOVING_THROUGH], extra: 1 },
  {
    domain: 'writing',
    handle: 'wren.k',
    began: 900,
    twins: [identityOnly('salt-ledger', 'The Salt Ledger', 'writing', 900, 'wren.k', 'A novel I have started four times. Each time the lighthouse moves.', 22, 160)],
    extra: 2,
  },
  {
    domain: 'software',
    handle: 'juno.lab',
    began: 610,
    twins: [identityOnly('field-notes', 'Offline field notes', 'software', 610, 'juno.lab', 'Notes that sync when you get back into signal, and never lose a word in between.', 14, 95)],
    extra: 3,
  },
  {
    domain: 'visual',
    handle: 'ines.studio',
    began: 700,
    twins: [identityOnly('four-pm', 'Shadows at 4pm', 'visual', 700, 'ines.studio', 'The same wall, every day, at the same time. It is never the same wall.', 31, 240)],
    extra: 2,
  },
];
