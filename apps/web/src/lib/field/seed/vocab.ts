import type { EvidenceMedium, NodeKind, ShadowGlyph } from '../model';

/**
 * Vocabulary for procedurally seeded Twins. Everything generated from here is
 * marked origin: 'seeded'. It exists so the Canvas has believable density
 * before real Twins fill it; it is not a claim that these ideas exist.
 */

export type DomainKey = 'music' | 'engineering' | 'writing' | 'software' | 'visual' | 'abstract';

export interface FacetTemplate {
  title: string;
  gist: string;
  kinds: NodeKind[];
}

export interface DomainVocab {
  key: DomainKey;
  title: string;
  glyph: ShadowGlyph;
  /** Number of creator constellations in the territory. */
  size: number;
  twinTitles: string[];
  facets: FacetTemplate[];
  nouns: string[];
  adjectives: string[];
  approaches: string[];
  evidence: Array<{ medium: EvidenceMedium; label: string }>;
  observations: string[];
}

export const DOMAINS: DomainVocab[] = [
  {
    key: 'music',
    title: 'Music',
    glyph: 'audio',
    size: 240,
    twinTitles: [
      'A loop in D minor I keep humming',
      'Song about leaving slowly',
      'Kitchen-percussion kit',
      'Four bars I can’t finish',
      'Lullaby for a noisy city',
      'Half-time gospel sketch',
      'Tape-warped choir',
      'The drive-home song',
      'A beat built from footsteps',
      'Ballad in the wrong key',
      'Two-chord meditation',
      'A chorus without words',
    ],
    facets: [
      { title: 'Hook', gist: 'The part that has to land in four seconds.', kinds: ['experiment', 'revision', 'dead_end', 'question', 'branch'] },
      { title: 'Verses', gist: 'Where the story actually happens.', kinds: ['thought', 'revision', 'dead_end', 'question'] },
      { title: 'Sound', gist: 'Palette, textures, the room it lives in.', kinds: ['experiment', 'component', 'dead_end', 'evidence'] },
      { title: 'Arrangement', gist: 'What enters when, and what leaves.', kinds: ['branch', 'experiment', 'revision', 'question'] },
      { title: 'Lyrics notebook', gist: 'Lines kept, lines cut.', kinds: ['thought', 'revision', 'dead_end', 'evidence'] },
      { title: 'Why this song', gist: 'The thing underneath it.', kinds: ['thought', 'question', 'thought'] },
    ],
    nouns: ['hook', 'bridge', 'kick pattern', 'vocal stack', 'bassline', 'count-in', 'chorus line', 'pad', 'tape loop', 'outro', 'harmony', 'tempo', 'second verse', 'drop'],
    adjectives: ['slower', 'whispered', 'detuned', 'drier', 'doubled', 'half-time', 'an octave down', 'sparser', 'warmer', 'off-grid'],
    approaches: ['a key change', 'sidechain pumping', 'a click track', 'a borrowed chord', 'a big reverb', 'a sample chop'],
    evidence: [
      { medium: 'audio', label: 'Voice memo' },
      { medium: 'audio', label: 'Rough bounce' },
      { medium: 'text', label: 'Session notes' },
      { medium: 'audio', label: 'Stems' },
    ],
    observations: [
      'The second half is where it starts working.',
      'Too polished. The first take had the thing.',
      'Recorded at 2am so the voice is quieter than it should be.',
      'You can hear the fridge. Keeping it.',
      'This is the version people hummed back to me.',
    ],
  },
  {
    key: 'engineering',
    title: 'Engineering',
    glyph: 'physical',
    size: 260,
    twinTitles: [
      'Hinge that survives sand',
      'Cheap soil-moisture probe',
      'Passive window vent',
      'Bike light that charges from braking',
      'Tool-free shelf joint',
      'Leak detector for old pipes',
      'Folding stretcher for rescue teams',
      'Water filter from ceramic scraps',
      'Quieter desk fan blade',
      'Magnetic cable anchor',
      'One-handed jar opener',
      'Rain-powered garden timer',
    ],
    facets: [
      { title: 'Mechanism', gist: 'How it is supposed to work.', kinds: ['component', 'component', 'experiment', 'dead_end', 'question'] },
      { title: 'Materials', gist: 'What it is made of, and what failed.', kinds: ['component', 'experiment', 'dead_end', 'evidence'] },
      { title: 'Tests', gist: 'Things that were actually tried.', kinds: ['experiment', 'experiment', 'evidence', 'dead_end'] },
      { title: 'Manufacturing', gist: 'How more than one gets made.', kinds: ['component', 'question', 'experiment', 'revision'] },
      { title: 'Failure modes', gist: 'Every way it broke so far.', kinds: ['dead_end', 'experiment', 'evidence', 'question'] },
      { title: 'Open questions', gist: 'Not solved yet.', kinds: ['question', 'question', 'thought'] },
    ],
    nouns: ['spring', 'seal', 'housing', 'latch', 'pivot', 'gasket', 'bracket', 'valve', 'sleeve', 'fastener', 'blade', 'probe tip', 'clip', 'frame'],
    adjectives: ['thinner', 'printed', 'overmolded', 'stainless', 'glass-filled', 'half the size', 'riveted', 'snap-fit', 'heat-treated', 'hollow'],
    approaches: ['a vacuum pump', 'adhesive only', 'a single casting', 'off-the-shelf parts', 'laser-cut sheet', 'a threaded insert'],
    evidence: [
      { medium: 'measurement', label: 'Test log' },
      { medium: 'image', label: 'Bench photo' },
      { medium: 'file', label: 'CAD revision' },
      { medium: 'video', label: 'Cycle test clip' },
    ],
    observations: [
      'Held for 212 cycles before the first crack.',
      'The failure is always at the same corner.',
      'Works in the lab, not in the garage.',
      'Cheaper than expected once the tolerance was relaxed.',
      'The printed version was good enough to learn from.',
    ],
  },
  {
    key: 'writing',
    title: 'Writing',
    glyph: 'writing',
    size: 220,
    twinTitles: [
      'Novel about a lighthouse keeper’s daughter',
      'Essay: why maps lie kindly',
      'Letters to a future apartment',
      'Short story that ends in the middle',
      'A field guide to small courage',
      'Poems written on receipts',
      'The history of one street',
      'Screenplay with no villain',
      'A cookbook of failed recipes',
      'Memoir in forty rooms',
    ],
    facets: [
      { title: 'Premise', gist: 'What it is about, said plainly.', kinds: ['thought', 'revision', 'question'] },
      { title: 'Characters', gist: 'Who carries it.', kinds: ['component', 'component', 'dead_end', 'thought'] },
      { title: 'Structure', gist: 'The order things happen in.', kinds: ['branch', 'experiment', 'revision', 'dead_end'] },
      { title: 'Drafts', gist: 'Every pass so far.', kinds: ['revision', 'revision', 'revision', 'evidence'] },
      { title: 'Cut material', gist: 'Good things that did not belong.', kinds: ['dead_end', 'dead_end', 'thought'] },
      { title: 'Questions', gist: 'What the writer still does not know.', kinds: ['question', 'question', 'thought'] },
    ],
    nouns: ['opening line', 'second chapter', 'narrator', 'ending', 'title', 'flashback', 'sister', 'letter', 'timeline', 'last scene', 'epigraph', 'point of view'],
    adjectives: ['shorter', 'in second person', 'told backwards', 'quieter', 'from the dog’s view', 'present tense', 'without dialogue', 'colder'],
    approaches: ['a frame story', 'an unreliable narrator', 'a prologue', 'alternating chapters', 'a twist'],
    evidence: [
      { medium: 'text', label: 'Draft page' },
      { medium: 'image', label: 'Notebook photo' },
      { medium: 'text', label: 'Reader note' },
    ],
    observations: [
      'Reads better aloud than on the page.',
      'Cut 4,000 words; nobody missed them.',
      'This paragraph survived every draft.',
      'The ending finally sounds like the beginning.',
    ],
  },
  {
    key: 'software',
    title: 'Software',
    glyph: 'software',
    size: 250,
    twinTitles: [
      'Offline-first field notes',
      'A language for knitting patterns',
      'Calendar that respects sleep',
      'Tiny database for classrooms',
      'Diff tool for spreadsheets',
      'Screen reader for charts',
      'Local-only photo search',
      'A game about queues',
      'Budget app with no categories',
      'Git for recipes',
    ],
    facets: [
      { title: 'Core model', gist: 'The one data structure everything depends on.', kinds: ['component', 'revision', 'dead_end', 'question'] },
      { title: 'Interface', gist: 'What a person actually touches.', kinds: ['experiment', 'revision', 'dead_end', 'evidence'] },
      { title: 'Prototype', gist: 'The thing that runs today.', kinds: ['component', 'evidence', 'experiment'] },
      { title: 'Performance', gist: 'Where it is slow and why.', kinds: ['experiment', 'evidence', 'dead_end'] },
      { title: 'Abandoned approaches', gist: 'Rewrites that taught something.', kinds: ['dead_end', 'dead_end', 'thought'] },
      { title: 'Open questions', gist: 'Undecided on purpose.', kinds: ['question', 'question', 'thought'] },
    ],
    nouns: ['sync engine', 'parser', 'schema', 'undo stack', 'search index', 'onboarding', 'renderer', 'storage layer', 'conflict resolver', 'API', 'cache', 'import flow'],
    adjectives: ['immutable', 'event-sourced', 'single-file', 'lazy', 'typed', 'streaming', 'offline', 'batched', 'incremental'],
    approaches: ['websockets', 'a global lock', 'last-write-wins', 'an ORM', 'a microservice', 'polling'],
    evidence: [
      { medium: 'code', label: 'Commit' },
      { medium: 'measurement', label: 'Benchmark' },
      { medium: 'image', label: 'Screenshot' },
      { medium: 'text', label: 'Design note' },
    ],
    observations: [
      'p95 dropped from 180ms to 40ms.',
      'The simple version is still the one people use.',
      'Rewrote this twice; the third one is smaller.',
      'Deleted more code than was added.',
    ],
  },
  {
    key: 'visual',
    title: 'Visual art',
    glyph: 'visual',
    size: 200,
    twinTitles: [
      'Shadows at 4pm',
      'Glaze from local clay',
      'Portraits without faces',
      'A color only this river has',
      'Paper cut city',
      'Drawings made with the wrong hand',
      'Mural for a laundromat',
      'Textile from recycled nets',
      'One tree, every season',
    ],
    facets: [
      { title: 'Studies', gist: 'Small attempts before the real one.', kinds: ['experiment', 'experiment', 'evidence', 'dead_end'] },
      { title: 'Palette', gist: 'The colors it keeps returning to.', kinds: ['component', 'experiment', 'revision'] },
      { title: 'Technique', gist: 'How the marks get made.', kinds: ['experiment', 'component', 'dead_end', 'question'] },
      { title: 'Failed pieces', gist: 'Kept on purpose.', kinds: ['dead_end', 'dead_end', 'evidence'] },
      { title: 'Series', gist: 'Where the pieces belong together.', kinds: ['branch', 'revision', 'thought'] },
      { title: 'Questions', gist: 'What it is trying to see.', kinds: ['question', 'thought'] },
    ],
    nouns: ['composition', 'underpainting', 'blue', 'edge', 'figure', 'horizon', 'glaze', 'grain', 'frame', 'light', 'negative space', 'surface'],
    adjectives: ['larger', 'monochrome', 'scraped back', 'unfinished', 'wet-on-wet', 'cropped', 'in charcoal', 'at dusk'],
    approaches: ['a projector', 'photo reference', 'gold leaf', 'a grid', 'a single brush'],
    evidence: [
      { medium: 'image', label: 'Study' },
      { medium: 'image', label: 'Studio photo' },
      { medium: 'text', label: 'Process note' },
    ],
    observations: [
      'The accident in the corner became the point.',
      'Too careful. Doing it again faster.',
      'Only works in daylight.',
      'The small one is better than the big one.',
    ],
  },
  {
    key: 'abstract',
    title: 'Ideas',
    glyph: 'unknown',
    size: 180,
    twinTitles: [
      'A better way to disagree',
      'Measuring kindness in cities',
      'Schools with no grades',
      'Time as a shared resource',
      'An economy of attention',
      'Rituals for starting over',
      'Public libraries for tools',
      'A calendar based on tides',
    ],
    facets: [
      { title: 'Premise', gist: 'The claim, stated simply.', kinds: ['thought', 'revision', 'question'] },
      { title: 'Principles', gist: 'What must stay true.', kinds: ['component', 'component', 'dead_end'] },
      { title: 'Counterexamples', gist: 'Where it breaks.', kinds: ['dead_end', 'experiment', 'question'] },
      { title: 'Thought experiments', gist: 'Trying it in imagined worlds.', kinds: ['experiment', 'branch', 'thought'] },
      { title: 'Readings', gist: 'Who thought about this before.', kinds: ['evidence', 'thought', 'evidence'] },
      { title: 'Questions', gist: 'Still open.', kinds: ['question', 'question'] },
    ],
    nouns: ['incentive', 'definition', 'boundary', 'trust', 'scale', 'exception', 'metric', 'neighborhood', 'promise', 'rule'],
    adjectives: ['smaller', 'local', 'voluntary', 'slower', 'reversible', 'shared', 'unmeasured'],
    approaches: ['a ranking', 'a reward system', 'a single metric', 'a top-down rule'],
    evidence: [
      { medium: 'text', label: 'Notebook page' },
      { medium: 'text', label: 'Reading note' },
      { medium: 'image', label: 'Whiteboard' },
    ],
    observations: [
      'Someone pointed out the obvious flaw. Good.',
      'Held up against the three hardest cases.',
      'This changed my mind about the premise.',
    ],
  },
];

export const CREATOR_NOTES = [
  'I keep coming back because there is still something here I have not solved.',
  'This started as a mistake and became the part I could not stop thinking about.',
  'I am trying to make the simplest version real before I explain the rest.',
  'I have rebuilt this enough times to know the first version was not the point.',
  'This is still early. I only want to know if someone else feels the pull.',
  'I noticed a pattern and I am still trying to understand what it wants to become.',
  'There is a working piece here, but I do not want to reveal the whole shape yet.',
  'I would rather show the trail than promise what this becomes.',
  'I put this down for a year. It would not stay down.',
  'The failures are the most honest part of this.',
];

const HANDLE_A = ['wren', 'juno', 'ash', 'milo', 'noor', 'kit', 'sol', 'ines', 'tavi', 'rook', 'bea', 'ode', 'lark', 'iris', 'fen', 'cato', 'ada', 'remy', 'sage', 'yuki', 'oli', 'mara', 'teo', 'lumi'];
const HANDLE_B = ['k', 'works', 'lab', 'made', 'hollow', 'north', 'studio', 'pine', 'm', 'field', 'day', 'still', 'room', 'loop', 'shop'];
const HANDLE_SEP = ['.', '_', '.', ''];

export function handleFrom(rng: () => number) {
  const a = HANDLE_A[Math.floor(rng() * HANDLE_A.length)];
  const b = HANDLE_B[Math.floor(rng() * HANDLE_B.length)];
  const sep = HANDLE_SEP[Math.floor(rng() * HANDLE_SEP.length)];
  return a + sep + b;
}

export const KIND_TEMPLATES: Partial<Record<NodeKind, string[]>> = {
  experiment: ['What if the {noun} was {adj}?', 'Trying the {noun} {adj}', '{Noun}, rebuilt from scratch', 'Test: {noun} with {approach}'],
  dead_end: ['{Noun} via {approach}', 'The {adj} {noun}', 'First {noun} (abandoned)', '{Noun} with {approach}'],
  question: ['Does the {noun} need to exist?', 'Who is the {noun} for?', 'Is the {noun} the real problem?', 'What breaks the {noun}?'],
  revision: ['{Noun}, version {k}', '{Noun}, reworked', '{Noun}, {adj} this time'],
  thought: ['Note on the {noun}', 'Why the {noun} matters', 'The {noun} is really about something else'],
  component: ['The {noun}', '{Adj} {noun}', '{Noun} assembly'],
  branch: ['A version with {approach}', 'Split: the {adj} {noun}', 'Branch: {noun} first'],
};

export const KIND_GISTS: Partial<Record<NodeKind, string[]>> = {
  experiment: ['Tried it to find out.', 'A small test before committing.', 'Ran it more than once.'],
  dead_end: ['Did not hold. Kept here so it is not tried again blindly.', 'Stopped here, on purpose.', 'Taught one thing, then ended.'],
  question: ['Still open.', 'The answer changes the rest.', 'Asked more than once.'],
  revision: ['Changed after the last attempt.', 'A later version of the same part.'],
  thought: ['A note from along the way.', 'Written down before it was forgotten.'],
  component: ['One of the parts it depends on.', 'A piece that has to work alone first.'],
  branch: ['A line of thought that split off.', 'Went this way for a while.'],
};
