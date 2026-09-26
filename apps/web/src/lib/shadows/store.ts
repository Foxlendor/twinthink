import { dayOf } from '../shadowfield/prompts';
// Shadows people post, kept in Postgres. Plain SQL behind a tiny query
// interface, so the same code runs on Neon (production) and PGlite (tests).
//
// Private by default: a Shadow is seen only by its maker until they make it
// public. Nothing about a person is stored but their account id and first
// name as shown on their work.

export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export const TITLE_MAX = 120;
export const BODY_MAX = 2000;
export const POSTS_PER_DAY = 20;
export const STORY_MAX = 4000;
/** Distinct signed-in reports that hide something until the owner looks. */
export const REPORTS_TO_HIDE = 3;

/** A Shadow is someone's idea; a story is told without a name and may spark ideas in others. */
export type Kind = 'shadow' | 'story';

export interface ServerShadow {
  id: string;
  owner: string;
  by: string;
  title: string;
  body: string;
  public: boolean;
  created: number;
  updated: number;
  kind: Kind;
  /** For a Shadow sparked by a story: the story's id. */
  from: string | null;
  /** For a story: how many Shadows it has sparked. */
  sparks: number;
  /** Taken down by the Canvas's owner (or by reports): seen only by its maker. */
  hidden: boolean;
  /** What it was built on, as anyone may see it. */
  parent: { title: string; kind: Kind; by: string } | null;
  /** Pictures and films its maker added, in order. */
  media: PostMedia[];
  /** For an answer to the day's word: that day (YYYY-MM-DD). */
  day: string | null;
}

/** A picture (kept here, served from /api/media) or a film (in the file store), height over width. */
export type PostMedia =
  | { kind: 'image'; src: string; aspect: number }
  | { kind: 'video'; src: string; poster?: string; aspect: number };

export const MEDIA_MAX = 6;
export const IMAGE_BYTES_MAX = 750_000;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function parseMedia(raw: unknown): PostMedia[] {
  let v = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? (v as PostMedia[]) : [];
}

/** Films are only ever taken from the site's own file store. */
export function isStoreUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length > 500) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

const aspectOf = (a: unknown) => (typeof a === 'number' && Number.isFinite(a) ? Math.min(3, Math.max(0.25, a)) : 1);

/** A picture as a data URL, checked: a real picture type, small enough. */
function readPicture(dataUrl: unknown): { mime: string; b64: string } | null {
  if (typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m || !IMAGE_TYPES.includes(m[1])) return null;
  if ((m[2].length * 3) / 4 > IMAGE_BYTES_MAX) return null;
  return { mime: m[1], b64: m[2] };
}

async function keepPicture(q: Query, shadowId: string, pic: { mime: string; b64: string }) {
  const id = newId();
  await q(`INSERT INTO tt_media (id, shadow_id, mime, data) VALUES ($1, $2, $3, $4)`, [id, shadowId, pic.mime, pic.b64]);
  return `/api/media/${id}`;
}

/**
 * Its maker adds a picture ({kind:'image', data}) or a film already in the
 * file store ({kind:'video', url, poster?}) to their Shadow.
 */
export async function addMedia(q: Query, who: Author, id: string, input: { kind?: unknown; data?: unknown; url?: unknown; poster?: unknown; aspect?: unknown }) {
  const s = await getShadow(q, id);
  if (!s || s.owner !== who.sub) return { error: 'Not yours to change.' } as const;
  if (s.kind === 'story') return { error: 'A story is told in words.' } as const;
  if (s.media.length >= MEDIA_MAX) return { error: 'That is as much as one Shadow holds.' } as const;
  let item: PostMedia;
  if (input.kind === 'image') {
    const pic = readPicture(input.data);
    if (!pic) return { error: 'That picture is too large or not a picture.' } as const;
    item = { kind: 'image', src: await keepPicture(q, id, pic), aspect: aspectOf(input.aspect) };
  } else if (input.kind === 'video') {
    if (!isStoreUrl(input.url)) return { error: 'That film did not arrive.' } as const;
    const pic = input.poster === undefined ? null : readPicture(input.poster);
    item = { kind: 'video', src: input.url, aspect: aspectOf(input.aspect), ...(pic ? { poster: await keepPicture(q, id, pic) } : {}) };
  } else return { error: 'Only pictures and films.' } as const;
  await q(`UPDATE tt_shadows SET media = media || $2::jsonb, updated_at = NOW() WHERE id = $1`, [id, JSON.stringify([item])]);
  return { shadow: (await getShadow(q, id))! } as const;
}

/** A kept picture, for whoever may see the Shadow it belongs to. */
export async function getPicture(q: Query, mediaId: string, viewerSub: string | undefined) {
  const rows = await q(
    `SELECT m.mime, m.data, s.owner_sub, s.is_public, s.hidden FROM tt_media m JOIN tt_shadows s ON s.id = m.shadow_id WHERE m.id = $1`,
    [mediaId]
  );
  const r = rows[0];
  if (!r) return null;
  const open = r.is_public === true && r.hidden !== true;
  if (!open && r.owner_sub !== viewerSub) return null;
  return { mime: String(r.mime), bytes: Buffer.from(String(r.data), 'base64'), open };
}

/** What a viewer is sent: never the maker's account id, only whether it is theirs; a story never says who told it. */
export function forViewer(s: ServerShadow, viewerSub: string | undefined) {
  return {
    id: s.id,
    by: s.kind === 'story' ? '' : s.by,
    title: s.title,
    body: s.body,
    public: s.public,
    created: s.created,
    updated: s.updated,
    kind: s.kind,
    from: s.from,
    parent: s.parent,
    media: s.media,
    day: s.day,
    sparks: s.sparks,
    mine: s.owner === viewerSub,
    // only its maker is told it was taken down
    ...(s.owner === viewerSub && s.hidden ? { hidden: true } : {}),
  };
}

export interface Author {
  sub: string;
  name: string;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tt_shadows (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS tt_shadows_public ON tt_shadows (is_public, hidden, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS tt_shadows_owner ON tt_shadows (owner_sub, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS tt_notes (
    id BIGSERIAL PRIMARY KEY,
    target TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS tt_notes_target ON tt_notes (target, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS tt_reports (
    id BIGSERIAL PRIMARY KEY,
    shadow_id TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE tt_shadows ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'shadow'`,
  `ALTER TABLE tt_shadows ADD COLUMN IF NOT EXISTS sparked_from TEXT`,
  `CREATE INDEX IF NOT EXISTS tt_shadows_from ON tt_shadows (sparked_from)`,
  `ALTER TABLE tt_reports ADD COLUMN IF NOT EXISTS reporter TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS tt_reports_once ON tt_reports (shadow_id, reporter)`,
  // every post counts toward the day's limit, even one let go afterwards
  `CREATE TABLE IF NOT EXISTS tt_post_log (
    owner_sub TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS tt_post_log_owner ON tt_post_log (owner_sub, created_at DESC)`,
  // pictures and films a maker adds to their Shadow: pictures are kept here, films in a file store
  `ALTER TABLE tt_shadows ADD COLUMN IF NOT EXISTS media JSONB NOT NULL DEFAULT '[]'::jsonb`,
  `CREATE TABLE IF NOT EXISTS tt_media (
    id TEXT PRIMARY KEY,
    shadow_id TEXT NOT NULL,
    mime TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS tt_media_shadow ON tt_media (shadow_id)`,
  // an answer to the day's word remembers the day
  `ALTER TABLE tt_shadows ADD COLUMN IF NOT EXISTS prompt_day TEXT`,
  `CREATE INDEX IF NOT EXISTS tt_shadows_prompt ON tt_shadows (prompt_day)`,
  // anonymous notes are limited per sender, who is kept only as a keyed hash, per hour
  `CREATE TABLE IF NOT EXISTS tt_limits (
    k TEXT NOT NULL,
    hour BIGINT NOT NULL,
    n INT NOT NULL DEFAULT 0,
    PRIMARY KEY (k, hour)
  )`,
];

/** Bumped whenever SCHEMA changes, so a database already up to date is not locked for nothing. */
const SCHEMA_VERSION = 5;

// every read counts what grew from each, and names what each grew from (never who told a story)
const SELECT = `SELECT s.*,
  (SELECT COUNT(*)::int FROM tt_shadows c WHERE c.sparked_from = s.id AND NOT c.hidden) AS sparks,
  p.title AS from_title, p.kind AS from_kind, p.owner_name AS from_by
  FROM tt_shadows s LEFT JOIN tt_shadows p ON p.id = s.sparked_from AND p.is_public AND NOT p.hidden`;

export async function migrate(q: Query) {
  await q(`CREATE TABLE IF NOT EXISTS tt_meta (k TEXT PRIMARY KEY, v INT NOT NULL)`);
  const [m] = await q(`SELECT v FROM tt_meta WHERE k = 'schema'`);
  if (m && Number(m.v) >= SCHEMA_VERSION) return;
  for (const s of SCHEMA) await q(s);
  await q(`INSERT INTO tt_meta (k, v) VALUES ('schema', $1) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v`, [SCHEMA_VERSION]);
}

/** A keyed one-way mark: without the site's secret it cannot be matched to anyone. */
export async function mark(text: string, secret = process.env.SESSION_SECRET ?? 'twinthink') {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** At most `limit` a hour for one sender (an address, say), counted under a keyed hash. */
export async function allowSender(q: Query, sender: string, limit = 10) {
  const hour = Math.floor(Date.now() / 3600000);
  const k = (await mark(`note|${sender}`)).slice(0, 32);
  const [r] = await q(
    `INSERT INTO tt_limits (k, hour, n) VALUES ($1, $2, 1) ON CONFLICT (k, hour) DO UPDATE SET n = tt_limits.n + 1 RETURNING n`,
    [k, hour]
  );
  // old hours are cleared now and then
  if (Math.random() < 0.02) await q(`DELETE FROM tt_limits WHERE hour < $1`, [hour - 1]);
  return Number(r.n) <= limit;
}

/** Plain words: trimmed, no control characters, within a length. */
export function clean(raw: unknown, max: number, allowEmpty = false): string | null {
  if (typeof raw !== 'string') return allowEmpty ? '' : null;
  const text = raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (text.length > max) return null;
  if (!text && !allowEmpty) return null;
  return text;
}

function firstName(name: string) {
  return (name.trim().split(/\s+/)[0] || 'someone').slice(0, 40);
}

function row(r: Record<string, unknown>): ServerShadow {
  return {
    id: String(r.id),
    owner: String(r.owner_sub),
    by: String(r.owner_name),
    title: String(r.title),
    body: String(r.body ?? ''),
    public: r.is_public === true,
    created: new Date(r.created_at as string).getTime(),
    updated: new Date(r.updated_at as string).getTime(),
    kind: r.kind === 'story' ? 'story' : 'shadow',
    from: r.sparked_from ? String(r.sparked_from) : null,
    // what it grew from, while that is still shared: a story's teller is never named
    parent: r.from_title
      ? { title: String(r.from_title), kind: r.from_kind === 'story' ? 'story' : 'shadow', by: r.from_kind === 'story' ? '' : String(r.from_by ?? '') }
      : null,
    sparks: Number(r.sparks ?? 0),
    hidden: r.hidden === true,
    media: parseMedia(r.media),
    day: r.prompt_day ? String(r.prompt_day) : null,
  };
}

function newId() {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, 14);
}

/** A story's name: its first line, cut at a word. */
export function storyTitle(text: string) {
  const first = text.split(/\n/)[0].trim();
  if (first.length <= 70) return first;
  const cut = first.slice(0, 68);
  return cut.slice(0, Math.max(40, cut.lastIndexOf(' '))).trim() + '…';
}

export async function createShadow(
  q: Query,
  who: Author,
  input: { title?: unknown; body?: unknown; public?: unknown; kind?: unknown; from?: unknown; answer?: unknown }
) {
  const story = input.kind === 'story';
  const answer = !story && input.answer === true;
  let title: string | null;
  let body: string | null;
  if (story) {
    // a story is told in one piece; its first line names it
    const text = clean(input.body, STORY_MAX);
    if (!text || text.length < 20) return { error: 'Tell a little more of the story (at least a sentence).' } as const;
    title = storyTitle(text);
    body = text;
  } else {
    title = clean(input.title, TITLE_MAX);
    body = clean(input.body, BODY_MAX, true);
    if (!title || body === null) return { error: 'A Shadow needs a name (up to 120 characters) and at most 2000 characters inside.' } as const;
  }
  let from: string | null = null;
  if (!story && typeof input.from === 'string') {
    const src = await getShadow(q, input.from);
    // anything shared can be built on: a story, or someone's Shadow
    if (!src || !src.public || src.hidden) return { error: 'That is not here any more.' } as const;
    from = src.id;
  }
  // counted and claimed in one statement, so a burst of posts cannot slip past the limit together
  const claimed = await q(
    `INSERT INTO tt_post_log (owner_sub) SELECT $1 WHERE (SELECT COUNT(*) FROM tt_post_log WHERE owner_sub = $1 AND created_at > NOW() - INTERVAL '1 day') < $2 RETURNING 1`,
    [who.sub, POSTS_PER_DAY]
  );
  if (!claimed.length) return { error: 'That is enough for today; come back tomorrow.' } as const;
  // stories are told to everyone; a Shadow stays private until its maker shares it
  const rows = await q(
    `INSERT INTO tt_shadows (id, owner_sub, owner_name, title, body, is_public, kind, sparked_from, prompt_day) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    // an answer to today's word is made to be seen with the others
    [newId(), who.sub, story ? '' : firstName(who.name), title, body, story || answer || input.public === true, story ? 'story' : 'shadow', from, answer ? dayOf() : null]
  );
  return { shadow: (await getShadow(q, String(rows[0].id)))! } as const;
}

/** Everyone's public Shadows, newest first (hidden ones never). */
export async function publicShadows(q: Query, limit = 300): Promise<ServerShadow[]> {
  const rows = await q(`${SELECT} WHERE s.is_public AND NOT s.hidden ORDER BY s.created_at DESC LIMIT $1`, [limit]);
  return rows.map(row);
}

/** A person's own Shadows, public or not. */
export async function myShadows(q: Query, sub: string): Promise<ServerShadow[]> {
  const rows = await q(`${SELECT} WHERE s.owner_sub = $1 ORDER BY s.created_at DESC LIMIT 300`, [sub]);
  return rows.map(row);
}

export async function getShadow(q: Query, id: string): Promise<ServerShadow | null> {
  const rows = await q(`${SELECT} WHERE s.id = $1`, [id]);
  return rows[0] ? row(rows[0]) : null;
}

/** Only its maker changes a Shadow. */
export async function updateShadow(q: Query, who: Author, id: string, input: { title?: unknown; body?: unknown; public?: unknown }) {
  const s = await getShadow(q, id);
  if (!s || s.owner !== who.sub) return { error: 'Not yours to change.' } as const;
  const title = input.title === undefined ? s.title : clean(input.title, TITLE_MAX);
  const body = input.body === undefined ? s.body : clean(input.body, BODY_MAX, true);
  if (!title || body === null) return { error: 'A Shadow needs a name (up to 120 characters) and at most 2000 characters inside.' } as const;
  // a story is told once: its teller may take it back, not rewrite it
  if (s.kind === 'story') return { error: 'A story stays as it was told.' } as const;
  const pub = input.public === undefined ? s.public : input.public === true;
  await q(`UPDATE tt_shadows SET title = $2, body = $3, is_public = $4, updated_at = NOW() WHERE id = $1`, [id, title, body, pub]);
  return { shadow: (await getShadow(q, id))! } as const;
}

/** Its maker lets it go; the Canvas's owner can take anything down. */
export async function removeShadow(q: Query, who: Author, id: string, siteOwner: boolean) {
  const s = await getShadow(q, id);
  if (!s) return { error: 'Not found.' } as const;
  if (s.owner === who.sub) {
    await q(`DELETE FROM tt_shadows WHERE id = $1`, [id]);
    await q(`DELETE FROM tt_notes WHERE target = $1`, [`p/${id}`]);
    await q(`DELETE FROM tt_media WHERE shadow_id = $1`, [id]);
    // films in the file store are for the route to let go of
    return { ok: true, films: s.media.filter((m) => m.kind === 'video').map((m) => m.src) } as const;
  }
  if (siteOwner) {
    await q(`UPDATE tt_shadows SET hidden = TRUE WHERE id = $1`, [id]);
    return { ok: true } as const;
  }
  return { error: 'Not yours to remove.' } as const;
}

/** One report per signed-in person; enough of them hide it until the Canvas's owner looks. */
export async function report(q: Query, reporter: string, id: string, reason: unknown) {
  const s = await getShadow(q, id);
  if (!s || !s.public || s.hidden) return { error: 'Not found.' } as const;
  // only a one-way mark that this person reported this one thing, so it counts once
  const who = await mark(`report|${reporter}|${id}`);
  await q(`INSERT INTO tt_reports (shadow_id, reason, reporter) VALUES ($1, $2, $3) ON CONFLICT (shadow_id, reporter) DO NOTHING`, [
    id,
    clean(reason, 300, true) ?? '',
    who,
  ]);
  // reports from before sign-in was needed (no reporter) do not count toward hiding
  const [{ n }] = await q(`SELECT COUNT(*)::int AS n FROM tt_reports WHERE shadow_id = $1 AND reporter IS NOT NULL`, [id]);
  if (Number(n) >= REPORTS_TO_HIDE) await q(`UPDATE tt_shadows SET hidden = TRUE WHERE id = $1`, [id]);
  return { ok: true } as const;
}

export async function addNote(q: Query, target: string, body: string) {
  await q(`INSERT INTO tt_notes (target, body) VALUES ($1, $2)`, [target, body]);
}

export async function notesFor(q: Query, target: string) {
  const rows = await q(`SELECT body, created_at FROM tt_notes WHERE target = $1 ORDER BY created_at DESC LIMIT 100`, [target]);
  return rows.map((r) => ({ t: new Date(r.created_at as string).getTime(), text: String(r.body) }));
}
