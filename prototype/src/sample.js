// Synthetic sample content for the prototype. None of this is anyone's real
// work: every item is marked sample: true and shown with a SAMPLE label.
// Timestamps are kept in full for a later Time view; they do not drive motion.

export const SAMPLE_GROUPS = [
  { id: 'g-water', name: 'Water at home (sample)' },
  { id: 'g-block', name: 'Shared on the block (sample)' },
];

export const SAMPLE_WORKS = [
  {
    id: 's-barrel',
    title: 'Rain barrel that shows its level',
    summary: 'A float and a painted stick, readable from the kitchen window.',
    body: 'A cork float rides a dowel through the lid. Rings painted every 10 litres. No electronics; the point is that you can see it without walking out.',
    maker: 'Sample maker A',
    group: 'g-water',
    createdAt: '2026-03-02T07:14:00-07:00',
  },
  {
    id: 's-stake',
    title: 'Soil stake from a pencil',
    summary: 'Graphite conducts; wet soil conducts more.',
    body: 'Two pencils pushed into a pot, a coin-cell and an LED. Brighter means wetter. A rough idea of when to water, not a measurement.',
    maker: 'Sample maker B',
    group: 'g-water',
    createdAt: '2026-03-09T21:40:00-07:00',
  },
  {
    id: 's-schedule',
    title: 'Street watering rota',
    summary: 'Neighbours take turns watering the shared beds.',
    body: 'A card on the shared shelf lists the week. Whoever has the card waters the three verge beds and passes it on.',
    maker: 'Sample maker A',
    group: 'g-block',
    createdAt: '2026-04-11T18:05:00-06:00',
  },
  {
    id: 's-shelf',
    title: 'Shared tool shelf',
    summary: 'One weatherproof shelf, borrowed tools, a paper log.',
    body: 'A shelf under the carport of whoever volunteers. Tools are labelled with the lender. The log is a clipboard: out, back, anything broken.',
    maker: 'Sample maker C',
    group: 'g-block',
    createdAt: '2026-02-20T12:30:00-07:00',
  },
  {
    id: 's-pump',
    title: 'Hand pump sketch',
    summary: 'A bicycle-pump part turned into a barrel pump.',
    body: 'Reverse the valve in an old floor pump so it pulls instead of pushes. Sketch only; not built.',
    maker: 'Sample maker B',
    group: 'g-water',
    createdAt: '2026-05-01T09:55:00-06:00',
  },
  {
    id: 's-seeds',
    title: 'Seed swap in a phone box',
    summary: 'Envelopes on hooks, take one, leave one.',
    body: 'An unused phone box with pegboard inside. Seeds in labelled envelopes. The only rule is the date on the envelope.',
    maker: 'Sample maker C',
    group: 'g-block',
    createdAt: '2026-01-15T16:20:00-07:00',
  },
  {
    id: 's-map',
    title: 'Rain map on the pavement',
    summary: 'Chalk marks where puddles form after rain.',
    body: 'After each rain, whoever walks past chalks the puddle edge. Over a season the chalk shows where water goes.',
    maker: 'Sample maker A',
    group: 'g-block',
    createdAt: '2026-06-22T06:48:00-06:00',
  },
].map((w) => ({ ...w, sample: true }));

// Relationships as people would state them. Kinds are words for readers; the
// physics does not map a kind to a shape (see PRODUCT.md, D-12).
export const SAMPLE_RELATIONS = [
  { id: 'r1', from: 's-stake', to: 's-barrel', kind: 'builds on' },
  { id: 'r2', from: 's-pump', to: 's-barrel', kind: 'builds on' },
  { id: 'r3', from: 's-schedule', to: 's-shelf', kind: 'responds to' },
  { id: 'r4', from: 's-schedule', to: 's-stake', kind: 'uses' },
  { id: 'r5', from: 's-map', to: 's-barrel', kind: 'responds to' },
  { id: 'r6', from: 's-seeds', to: 's-shelf', kind: 'branches from' },
  { id: 'r7', from: 's-map', to: 's-schedule', kind: 'informs' },
  { id: 'r8', from: 's-pump', to: 's-shelf', kind: 'borrows from' },
].map((r) => ({ ...r, sample: true }));

export const RELATION_KINDS = ['builds on', 'responds to', 'branches from', 'uses', 'informs', 'borrows from'];
