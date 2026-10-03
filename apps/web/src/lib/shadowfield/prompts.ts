// Today's word: one word for everyone each day, to make something from. The
// same everywhere, changing at midnight UTC. Answers gather in their own ring.

const WORDS = [
  'hinge', 'lullaby', 'leftover', 'bridge', 'pocket', 'echo', 'spare part', 'rain', 'knot', 'lantern',
  'shortcut', 'borrowed', 'tide', 'handle', 'crumb', 'signal', 'ladder', 'patch', 'mirror', 'seed',
  'glue', 'window', 'static', 'thread', 'shelter', 'spoon', 'drift', 'buckle', 'compass', 'ember',
  'puddle', 'switch', 'blanket', 'pulley', 'whistle', 'crate', 'magnet', 'shadow', 'kite', 'valve',
  'bottle', 'fold', 'wheel', 'sponge', 'rope', 'bell', 'lid', 'map', 'spring', 'wire',
  'hook', 'lens', 'drum', 'nest', 'funnel', 'clip', 'stair', 'fan', 'cork', 'gate',
];

/** The day, as YYYY-MM-DD in UTC. */
export function dayOf(t: number = Date.now()) {
  return new Date(t).toISOString().slice(0, 10);
}

/** The word for a day. */
export function wordFor(day: string = dayOf()) {
  const n = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  // a fixed stride through the list, so neighbouring days are never alike
  return WORDS[(((n * 37) % WORDS.length) + WORDS.length) % WORDS.length];
}
