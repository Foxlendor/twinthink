import { createHmac } from 'node:crypto';
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
  /** Seen by whoever has its link (and not shown to anyone else). */
  unlisted: boolean;
  hidden: boolean;
  /** What it was built on, as anyone may see it. */
  parent: { title: string; kind: Kind; by: string } | null;
  /** Pictures and films its maker added, in order. */
  media: PostMedia[];
  /** For an answer to the day's word: that day (YYYY-MM-DD). */
  day: string | null;
  /** The fork it was posted inside, if any (sharing still follows the usual rule). */
  forkId: string | null;
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

/** The site's own file store, as named by its token (vercel_blob_rw_<store>_<secret>). */
export function storeHost(token = process.env.BLOB_READ_WRITE_TOKEN): string | null {
  const id = token?.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)?.[1];
  return id ? `${id.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

/**
 * A film is only ever taken from the site's own file store, and only from the
 * place uploads for this very Shadow are put (films/<shadow id>/...), so no one
 * can claim, or later remove, a film that is not theirs.
 */
export function isStoreUrl(url: unknown, shadowId: string, host: string | null = storeHost()): url is string {
  if (typeof url !== 'string' || url.length > 500 || !host) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === host && u.pathname.startsWith(`/films/${shadowId}/`) && !u.search && !u.hash;
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
export async function addMedia(
  q: Query,
  who: Author,
  id: string,
  input: { kind?: unknown; data?: unknown; url?: unknown; poster?: unknown; aspect?: unknown },
  host: string | null = storeHost()
) {
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
    if (!isStoreUrl(input.url, id, host)) return { error: 'That film did not arrive.' } as const;
    const pic = input.poster === undefined ? null : readPicture(input.poster);
    item = { kind: 'video', src: input.url, aspect: aspectOf(input.aspect), ...(pic ? { poster: await keepPicture(q, id, pic) } : {}) };
  } else return { error: 'Only pictures and films.' } as const;
  // added in one step that also holds the limit, so a burst of additions cannot pass it
  const done = await q(
    `UPDATE tt_shadows SET media = media || $2::jsonb, updated_at = NOW() WHERE id = $1 AND owner_sub = $3 AND jsonb_array_length(media) < $4 RETURNING id`,
    [id, JSON.stringify([item]), who.sub, MEDIA_MAX]
  );
  if (!done.length) {
    // the picture kept for it is let go again
    const kept = [item.kind === 'image' ? item.src : item.poster].filter(Boolean) as string[];
    for (const src of kept) await q(`DELETE FROM tt_media WHERE id = $1`, [src.split('/').pop()]);
    return { error: 'That is as much as one Shadow holds.' } as const;
  }
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

/** A maker's key for gathering their work: keyed, one-way, and the same everywhere. */
export function makerKey(sub: string, secret = process.env.SESSION_SECRET ?? 'twinthink') {
  return createHmac('sha256', secret).update(`maker|${sub}`).digest('hex').slice(0, 12);
}

/** What a viewer is sent: never the maker's account id, only whether it is theirs; a story never says who told it. */
export function forViewer(s: ServerShadow, viewerSub: string | undefined) {
  return {
    id: s.id,
    by: s.kind === 'story' ? '' : s.by,
    title: s.title,
    body: s.body,
    public: s.public,
    // private, only with its link, or everyone's
    visibility: s.public ? ('public' as const) : s.unlisted ? ('unlisted' as const) : ('private' as const),
    created: s.created,
    updated: s.updated,
    kind: s.kind,
    // what it grew from, only while that is still shared
    from: s.parent ? s.from : null,
    parent: s.parent,
    media: s.media,
    day: s.day,
    sparks: s.sparks,
    forkId: s.forkId,
    // the same maker's work can be gathered by this key, which never leads back to their account
    maker: s.kind === 'story' ? '' : makerKey(s.owner),
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
  // a person's sketchbook: what they kept of others' work, by its place on the Canvas
  `CREATE TABLE IF NOT EXISTS tt_keeps (
    owner_sub TEXT NOT NULL,
    target TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (owner_sub, target)
  )`,
  // unlisted: seen by whoever has its link, and by no one who does not
  `ALTER TABLE tt_shadows ADD COLUMN IF NOT EXISTS unlisted BOOLEAN NOT NULL DEFAULT FALSE`,
  // resonance: that someone (a keyed one-way mark) stayed with something on a day
  `CREATE TABLE IF NOT EXISTS tt_resonance (
    target TEXT NOT NULL,
    day TEXT NOT NULL,
    visitor TEXT NOT NULL,
    PRIMARY KEY (target, day, visitor)
  )`,
  // anonymous notes are limited per sender, who is kept only as a keyed hash, per hour
  `CREATE TABLE IF NOT EXISTS tt_limits (
    k TEXT NOT NULL,
    hour BIGINT NOT NULL,
    n INT NOT NULL DEFAULT 0,
    PRIMARY KEY (k, hour)
  )`,
  // a fork: a named space a maker opens inside their own Shadow, for others to travel into
  // (and, by its own rule, post inside). Closing one stops new posts; it and its history stay.
  `CREATE TABLE IF NOT EXISTS tt_forks (
    id TEXT PRIMARY KEY,
    host_shadow_id TEXT NOT NULL,
    owner_sub TEXT NOT NULL,
    title TEXT NOT NULL,
    post_access TEXT NOT NULL DEFAULT 'invite',
    invite_token TEXT,
    closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS tt_forks_host ON tt_forks (host_shadow_id)`,
  // whoever a fork has let in, when its rule is 'invite': a one-way key, like a maker's
  `CREATE TABLE IF NOT EXISTS tt_fork_access (
    fork_id TEXT NOT NULL,
    poster_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (fork_id, poster_key)
  )`,
  // a Shadow posted inside a fork, rather than loose on the Slate (sharing still follows it)
  `ALTER TABLE tt_shadows ADD COLUMN IF NOT EXISTS fork_id TEXT`,
  `CREATE INDEX IF NOT EXISTS tt_shadows_fork ON tt_shadows (fork_id)`,
  // pressure: that someone's fall reached the end of a fork and turned back, kept as a one-way
  // mark of them and the day (never who): many different people hitting the same wall, not one
  // person returning to it (that is resonance's own, different, question)
  `CREATE TABLE IF NOT EXISTS tt_pressure (
    target TEXT NOT NULL,
    day TEXT NOT NULL,
    visitor TEXT NOT NULL,
    PRIMARY KEY (target, day, visitor)
  )`,
  // Rabi noticing pressure, and what a maker decides about it: never an action on its own.
  // Observing, explaining and asking, nothing more; the fork system stays the only thing that changes.
  `CREATE TABLE IF NOT EXISTS tt_rabi_log (
    id TEXT PRIMARY KEY,
    fork_id TEXT NOT NULL,
    owner_sub TEXT NOT NULL,
    event TEXT NOT NULL,
    pressure_state TEXT,
    action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS tt_rabi_log_fork ON tt_rabi_log (fork_id, created_at)`,
  // a decision's own baseline (to judge later growth against, never shown to anyone), and which
  // fork, if any, a click actually led to being made: opening the composer is not yet agreement
  `ALTER TABLE tt_rabi_log ADD COLUMN IF NOT EXISTS reached INT`,
  `ALTER TABLE tt_rabi_log ADD COLUMN IF NOT EXISTS created_fork_id TEXT`,
  // a shared Fall: an overlay on top of two people's own Falls, never their definition. Its own
  // maker leads it (the only thing kept here is where they currently are); ending it, or either
  // person leaving it, touches neither person's own Fall or history.
  `CREATE TABLE IF NOT EXISTS tt_shared_fall (
    id TEXT PRIMARY KEY,
    host_sub TEXT NOT NULL,
    host_name TEXT NOT NULL,
    invite_token TEXT NOT NULL,
    station_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS tt_shared_fall_host ON tt_shared_fall (host_sub, created_at DESC)`,
  // whoever has joined: presence only (has this account joined, and are they still here). Never
  // where they are: a follower's own position is never collected, only the leader's.
  `CREATE TABLE IF NOT EXISTS tt_shared_fall_participant (
    shared_fall_id TEXT NOT NULL,
    sub TEXT NOT NULL,
    name TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    PRIMARY KEY (shared_fall_id, sub)
  )`,
  `CREATE INDEX IF NOT EXISTS tt_shared_fall_participant_fall ON tt_shared_fall_participant (shared_fall_id)`,
];

/** Bumped whenever SCHEMA changes, so a database already up to date is not locked for nothing. */
const SCHEMA_VERSION = 13;

// every read counts what grew from each, and names what each grew from (never who told a story)
const SELECT = `SELECT s.*,
  (SELECT COUNT(*)::int FROM tt_shadows c WHERE c.sparked_from = s.id AND c.is_public AND NOT c.hidden) AS sparks,
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
    unlisted: r.is_public !== true && r.unlisted === true,
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
    forkId: r.fork_id ? String(r.fork_id) : null,
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
  input: { title?: unknown; body?: unknown; public?: unknown; kind?: unknown; from?: unknown; answer?: unknown; forkId?: unknown }
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
  let forkId: string | null = null;
  if (!story && typeof input.forkId === 'string') {
    // a story stands alone; only a Shadow is ever posted inside a fork
    if (!(await canPostInFork(q, input.forkId, who.sub))) return { error: 'You may not post there.' } as const;
    forkId = input.forkId;
  }
  // counted and claimed in one statement, so a burst of posts cannot slip past the limit together
  const claimed = await q(
    `INSERT INTO tt_post_log (owner_sub) SELECT $1 WHERE (SELECT COUNT(*) FROM tt_post_log WHERE owner_sub = $1 AND created_at > NOW() - INTERVAL '1 day') < $2 RETURNING 1`,
    [who.sub, POSTS_PER_DAY]
  );
  if (!claimed.length) return { error: 'That is enough for today; come back tomorrow.' } as const;
  // stories are told to everyone; a Shadow stays private until its maker shares it
  const rows = await q(
    `INSERT INTO tt_shadows (id, owner_sub, owner_name, title, body, is_public, kind, sparked_from, prompt_day, fork_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    // an answer to today's word is made to be seen with the others
    [newId(), who.sub, story ? '' : firstName(who.name), title, body, story || answer || input.public === true, story ? 'story' : 'shadow', from, answer ? dayOf() : null, forkId]
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
export async function updateShadow(
  q: Query,
  who: Author,
  id: string,
  input: { title?: unknown; body?: unknown; public?: unknown; visibility?: unknown }
) {
  const s = await getShadow(q, id);
  if (!s || s.owner !== who.sub) return { error: 'Not yours to change.' } as const;
  const title = input.title === undefined ? s.title : clean(input.title, TITLE_MAX);
  const body = input.body === undefined ? s.body : clean(input.body, BODY_MAX, true);
  if (!title || body === null) return { error: 'A Shadow needs a name (up to 120 characters) and at most 2000 characters inside.' } as const;
  // a story is told once: its teller may take it back, not rewrite it
  if (s.kind === 'story') return { error: 'A story stays as it was told.' } as const;
  // how far it is shared: private, only by its link, or with everyone (a maker widens it on purpose)
  const v = input.visibility;
  const pub = v === 'public' ? true : v === 'private' || v === 'unlisted' ? false : input.public === undefined ? s.public : input.public === true;
  const unlisted = v === 'unlisted' ? true : v === 'private' || v === 'public' || input.public !== undefined ? false : s.unlisted;
  await q(`UPDATE tt_shadows SET title = $2, body = $3, is_public = $4, unlisted = $5, updated_at = NOW() WHERE id = $1`, [id, title, body, pub, unlisted]);
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
    return { ok: true, films: s.media.filter((m) => m.kind === 'video' && isStoreUrl(m.src, id)).map((m) => m.src) } as const;
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

export const KEEPS_MAX = 300;

/** A place on the Canvas that can be kept: a station id or a posted Shadow (never anything on a device). */
function keepable(target: unknown): target is string {
  return typeof target === 'string' && target.length <= 200 && /^[a-z0-9][a-z0-9/_.:-]*$/i.test(target) && !target.startsWith('local/') && !target.startsWith('k/');
}

/** Keep something in your sketchbook (again is harmless). */
export async function keep(q: Query, sub: string, target: unknown) {
  if (!keepable(target)) return { error: 'That cannot be kept.' } as const;
  const [{ n }] = await q(`SELECT COUNT(*)::int AS n FROM tt_keeps WHERE owner_sub = $1`, [sub]);
  if (Number(n) >= KEEPS_MAX) return { error: 'Your sketchbook is full; let something go first.' } as const;
  await q(
    `INSERT INTO tt_keeps (owner_sub, target) SELECT $1, $2 WHERE (SELECT COUNT(*) FROM tt_keeps WHERE owner_sub = $1) < $3 ON CONFLICT DO NOTHING`,
    [sub, target, KEEPS_MAX]
  );
  return { ok: true } as const;
}

export async function unkeep(q: Query, sub: string, target: unknown) {
  if (typeof target !== 'string') return { error: 'That was not kept.' } as const;
  await q(`DELETE FROM tt_keeps WHERE owner_sub = $1 AND target = $2`, [sub, target]);
  return { ok: true } as const;
}

/** What you kept, newest first. */
export async function myKeeps(q: Query, sub: string): Promise<string[]> {
  const rows = await q(`SELECT target FROM tt_keeps WHERE owner_sub = $1 ORDER BY created_at DESC LIMIT $2`, [sub, KEEPS_MAX]);
  return rows.map((r) => String(r.target));
}

/**
 * Resonance: continued human return. Someone staying with something is
 * recorded once a day, as a keyed one-way mark of them; nothing else. Only
 * people who come back to it on different days make it resonate: a crowd
 * passing once does nothing. Views and popularity never count.
 */
export async function resonate(q: Query, target: string, visitor: string, day = new Date().toISOString().slice(0, 10)) {
  const who = (await mark(`resonance|${visitor}`)).slice(0, 32);
  await q(`INSERT INTO tt_resonance (target, day, visitor) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [target, day, who]);
  // what is older than a season is let go now and then
  if (Math.random() < 0.01) await q(`DELETE FROM tt_resonance WHERE day < $1`, [dayBefore(day, 90)]);
}

function dayBefore(day: string, n: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);
}

/** How much each thing resonates (0..1): from the people who came back to it on another day, in the last season. */
export async function resonance(q: Query, today = new Date().toISOString().slice(0, 10)): Promise<Record<string, number>> {
  const rows = await q(
    `SELECT target, COUNT(*)::int AS returning FROM (
       SELECT target, visitor FROM tt_resonance WHERE day >= $1 GROUP BY target, visitor HAVING COUNT(DISTINCT day) >= 2
     ) r GROUP BY target`,
    [dayBefore(today, 90)]
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[String(r.target)] = +(1 - Math.exp(-Number(r.returning) / 6)).toFixed(3);
  return out;
}

/** Once a level like this reaches it, enough separate falls have hit the same wall to say so. */
export const GATHERING = 0.5;

/** A fall's reach recorded: someone's (a keyed one-way mark) fall reached this end and turned back, today. */
export async function markReached(q: Query, target: string, visitor: string, day = new Date().toISOString().slice(0, 10)) {
  const who = (await mark(`pressure|${visitor}`)).slice(0, 32);
  await q(`INSERT INTO tt_pressure (target, day, visitor) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [target, day, who]);
  // kept for two weeks: this is about pressure right now, not a season of it
  if (Math.random() < 0.01) await q(`DELETE FROM tt_pressure WHERE day < $1`, [dayBefore(day, 14)]);
}

/**
 * How much pressure has gathered at each wall (0..1): from how many different
 * falls have reached it and turned back in the last two weeks. Never a
 * return: a crowd of strangers hitting the same place counts here; the same
 * one person coming back to it is resonance's question, not this one.
 */
export async function pressure(q: Query, today = new Date().toISOString().slice(0, 10)): Promise<Record<string, number>> {
  const rows = await q(
    `SELECT target, COUNT(DISTINCT visitor)::int AS reached FROM tt_pressure WHERE day >= $1 GROUP BY target HAVING COUNT(DISTINCT visitor) >= 3`,
    [dayBefore(today, 14)]
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[String(r.target)] = +(1 - Math.exp(-Number(r.reached) / 8)).toFixed(3);
  return out;
}

/** Past this, pressure is not just felt, it is worth a maker's own decision. */
export const ROUTE_CANDIDATE = 0.75;

/** The exact, recent reach for one wall: never shown to anyone but whoever it is pressing on. */
async function reachCount(q: Query, target: string, today = new Date().toISOString().slice(0, 10)): Promise<number> {
  const [r] = await q(`SELECT COUNT(DISTINCT visitor)::int AS n FROM tt_pressure WHERE target = $1 AND day >= $2`, [target, dayBefore(today, 14)]);
  return Number(r?.n ?? 0);
}

/** How much further pressure has to grow before "watch" (curious) or "leave it" (intentional) asks again. */
export const WATCH_GROWTH = 1.3;
export const LEAVE_GROWTH = 2;
/** "Open a path" is a maker looking into it, not a lasting decision either way: a plain, short cooldown. */
const OPEN_PATH_COOLDOWN_DAYS = 7;

/**
 * Rabi noticing: whether a fork's own maker should be shown that real
 * pressure has gathered at it. Never the exact count (sparse traffic can
 * make one visitor guessable even to an owner); only whether it has
 * crossed the bar. What re-shows it depends on what was last decided:
 * "watch" wants to hear about real further growth; "leave it" means the
 * dead end is wanted, and asks again only if pressure grows much more;
 * "open a path" is a maker looking into it, and only pauses for a short
 * while either way. Nothing here ever changes the fork itself.
 */
export async function noticeFor(q: Query, forkId: string, ownerSub: string): Promise<{ show: boolean } | null> {
  const f = await getForkRaw(q, forkId);
  if (!f || f.owner_sub !== ownerSub) return null;
  const reached = await reachCount(q, `fork/${forkId}`);
  const level = 1 - Math.exp(-reached / 8);
  if (level < ROUTE_CANDIDATE) return { show: false };
  const [last] = await q(
    `SELECT action, reached, created_at FROM tt_rabi_log WHERE fork_id = $1 AND event = 'notice_action' ORDER BY created_at DESC LIMIT 1`,
    [forkId]
  );
  if (last) {
    const baseline = Number(last.reached ?? 0);
    if (last.action === 'watch' && reached < baseline * WATCH_GROWTH) return { show: false };
    if (last.action === 'leave' && reached < baseline * LEAVE_GROWTH) return { show: false };
    if (last.action === 'open_path' && Date.now() - new Date(last.created_at as string).getTime() < OPEN_PATH_COOLDOWN_DAYS * 86400000) {
      return { show: false };
    }
  }
  return { show: true };
}

/** That the notice was actually shown: once a day is enough to say so, however often it is checked. */
export async function logNoticeShown(q: Query, forkId: string, ownerSub: string, pressureState: 'gathering' | 'route_candidate') {
  const f = await getForkRaw(q, forkId);
  if (!f || f.owner_sub !== ownerSub) return { error: 'Not yours.' } as const;
  const today = new Date().toISOString().slice(0, 10);
  const [already] = await q(`SELECT 1 FROM tt_rabi_log WHERE fork_id = $1 AND event = 'notice_shown' AND created_at::date = $2::date`, [forkId, today]);
  if (!already) await q(`INSERT INTO tt_rabi_log (id, fork_id, owner_sub, event, pressure_state) VALUES ($1, $2, $3, 'notice_shown', $4)`, [newId(), forkId, ownerSub, pressureState]);
  return { ok: true } as const;
}

export type NoticeAction = 'open_path' | 'leave' | 'watch';

/**
 * What a maker decided, plainly, with the pressure it was decided against
 * (never shown to anyone, only kept to judge later growth against). Opening
 * a path is not yet agreement: only actually making a fork afterward is
 * (see logFunnelEvent). This is only ever a record of a choice; nothing
 * here changes the fork.
 */
export async function logNoticeAction(q: Query, forkId: string, ownerSub: string, action: NoticeAction) {
  const f = await getForkRaw(q, forkId);
  if (!f || f.owner_sub !== ownerSub) return { error: 'Not yours.' } as const;
  const reached = await reachCount(q, `fork/${forkId}`);
  await q(`INSERT INTO tt_rabi_log (id, fork_id, owner_sub, event, action, reached) VALUES ($1, $2, $3, 'notice_action', $4, $5)`, [
    newId(),
    forkId,
    ownerSub,
    action,
    reached,
  ]);
  return { ok: true } as const;
}

export type FunnelEvent = 'composer_opened' | 'fork_created';

/**
 * The rest of the chain past a click: that the fork-creation composer
 * actually opened from a notice, and, the one thing that counts as real
 * agreement, that a fork was actually made afterward. Neither is a
 * decision; both are just what happened.
 */
export async function logFunnelEvent(q: Query, forkId: string, ownerSub: string, event: FunnelEvent, createdForkId?: string) {
  const f = await getForkRaw(q, forkId);
  if (!f || f.owner_sub !== ownerSub) return { error: 'Not yours.' } as const;
  await q(`INSERT INTO tt_rabi_log (id, fork_id, owner_sub, event, created_fork_id) VALUES ($1, $2, $3, $4, $5)`, [
    newId(),
    forkId,
    ownerSub,
    event,
    createdForkId ?? null,
  ]);
  return { ok: true } as const;
}

/** One Shadow for whoever asked: anyone, if it is shared (even only by link); its maker, always. */
export async function shadowFor(q: Query, id: string, viewerSub: string | undefined) {
  const s = await getShadow(q, id);
  if (!s) return null;
  if (s.owner === viewerSub) return s;
  return (s.public || s.unlisted) && !s.hidden ? s : null;
}

// ---------------------------------------------------------------------------
// Forks: a named space a maker opens inside their own Shadow, for others to
// travel into (and, by its own rule, post inside). Moving or closing a fork
// never touches what is already inside it: only where it sits, or whether it
// takes anything new.

export type PostAccess = 'anyone' | 'invite';

export const FORK_TITLE_MAX = 80;
/** How many forks one person may hold at once, closed ones too: what a fork holds keeps taking room even quiet. */
export const FORK_ROOM_MAX = 12;

export interface ForkView {
  id: string;
  hostShadowId: string;
  title: string;
  postAccess: PostAccess;
  closed: boolean;
  created: number;
  /** True for whoever opened it. */
  mine: boolean;
  /** Whether this viewer may post inside it right now. */
  canPost: boolean;
  /** Only ever sent to its own maker: the link that lets someone else post inside it. */
  inviteLink?: string;
}

function forkRow(r: Record<string, unknown>, viewerSub: string | undefined, canPost: boolean): ForkView {
  const mine = r.owner_sub === viewerSub;
  return {
    id: String(r.id),
    hostShadowId: String(r.host_shadow_id),
    title: String(r.title),
    postAccess: r.post_access === 'anyone' ? 'anyone' : 'invite',
    closed: r.closed === true,
    created: new Date(r.created_at as string).getTime(),
    mine,
    canPost,
    ...(mine && r.post_access !== 'anyone' && r.invite_token ? { inviteLink: String(r.invite_token) } : {}),
  };
}

/** Whether a viewer may post inside a fork, given its row (closed always denies, even its own maker). */
async function canPostGivenRow(f: Record<string, unknown> | null, q: Query, viewerSub: string | undefined): Promise<boolean> {
  if (!f || f.closed || !viewerSub) return false;
  if (f.owner_sub === viewerSub) return true;
  if (f.post_access === 'anyone') return true;
  const [r] = await q(`SELECT 1 FROM tt_fork_access WHERE fork_id = $1 AND poster_key = $2`, [f.id, makerKey(viewerSub)]);
  return !!r;
}

/** How much room one person has left for forks (closed ones still hold their place: what is inside them is still there). */
export async function roomFor(q: Query, ownerSub: string): Promise<{ used: number; room: number }> {
  const [r] = await q(`SELECT COUNT(*)::int AS n FROM tt_forks WHERE owner_sub = $1`, [ownerSub]);
  const used = Number(r?.n ?? 0);
  return { used, room: Math.max(0, FORK_ROOM_MAX - used) };
}

async function getForkRaw(q: Query, id: string) {
  const [r] = await q(`SELECT * FROM tt_forks WHERE id = $1`, [id]);
  return r ?? null;
}

/** Whether a fork by this id is real: so pressure is never recorded against something made up. */
export async function forkExists(q: Query, id: string): Promise<boolean> {
  return !!(await getForkRaw(q, id));
}

/** Only a Shadow's own maker opens a fork inside it. */
export async function createFork(q: Query, who: Author, hostShadowId: string, input: { title?: unknown; postAccess?: unknown }) {
  const host = await getShadow(q, hostShadowId);
  if (!host || host.owner !== who.sub) return { error: 'Only its maker can open a fork here.' } as const;
  const title = clean(input.title, FORK_TITLE_MAX);
  if (!title) return { error: 'A fork needs a name (up to 80 characters).' } as const;
  const postAccess: PostAccess = input.postAccess === 'anyone' ? 'anyone' : 'invite';
  const id = newId();
  const inviteToken = postAccess === 'invite' ? newId() : null;
  // counted and claimed in one statement, so a burst of openings cannot slip past the room together
  const claimed = await q(
    `INSERT INTO tt_forks (id, host_shadow_id, owner_sub, title, post_access, invite_token)
     SELECT $1, $2, $3, $4, $5, $6 WHERE (SELECT COUNT(*) FROM tt_forks WHERE owner_sub = $3) < $7 RETURNING id`,
    [id, hostShadowId, who.sub, title, postAccess, inviteToken, FORK_ROOM_MAX]
  );
  if (!claimed.length) return { error: 'That is as much room as you have for now.' } as const;
  // freshly opened, not closed: its own maker may always post there right away
  return { fork: forkRow((await getForkRaw(q, id))!, who.sub, true) } as const;
}

/** The forks open inside one Shadow, for whoever may see it (an invite link is sent only to its own maker). */
export async function forksIn(q: Query, hostShadowId: string, viewerSub: string | undefined): Promise<ForkView[]> {
  const rows = await q(`SELECT * FROM tt_forks WHERE host_shadow_id = $1 ORDER BY created_at ASC`, [hostShadowId]);
  const out: ForkView[] = [];
  for (const r of rows) out.push(forkRow(r, viewerSub, await canPostGivenRow(r, q, viewerSub)));
  return out;
}

/**
 * The forks for many Shadows at once (one batched access check, not one per
 * fork), keyed by host id: for building the whole Slate's tree in one round trip.
 */
export async function forksForMany(q: Query, hostIds: string[], viewerSub: string | undefined): Promise<Record<string, ForkView[]>> {
  const out: Record<string, ForkView[]> = {};
  if (!hostIds.length) return out;
  const rows = await q(`SELECT * FROM tt_forks WHERE host_shadow_id = ANY($1::text[]) ORDER BY created_at ASC`, [hostIds]);
  if (!rows.length) return out;
  let granted = new Set<string>();
  if (viewerSub) {
    const need = rows.filter((r) => r.post_access !== 'anyone' && r.owner_sub !== viewerSub).map((r) => String(r.id));
    if (need.length) {
      const g = await q(`SELECT fork_id FROM tt_fork_access WHERE poster_key = $1 AND fork_id = ANY($2::text[])`, [makerKey(viewerSub), need]);
      granted = new Set(g.map((x) => String(x.fork_id)));
    }
  }
  for (const r of rows) {
    const canPost = r.closed || !viewerSub ? false : r.owner_sub === viewerSub || r.post_access === 'anyone' || granted.has(String(r.id));
    (out[String(r.host_shadow_id)] ??= []).push(forkRow(r, viewerSub, canPost));
  }
  return out;
}

/** Moves a fork to another Shadow of the same maker's: its history travels with it, untouched. */
export async function moveFork(q: Query, who: Author, forkId: string, newHostShadowId: string) {
  const f = await getForkRaw(q, forkId);
  if (!f || f.owner_sub !== who.sub) return { error: 'Not yours to move.' } as const;
  const host = await getShadow(q, newHostShadowId);
  if (!host || host.owner !== who.sub) return { error: 'Only into a Shadow of your own.' } as const;
  await q(`UPDATE tt_forks SET host_shadow_id = $2, updated_at = NOW() WHERE id = $1`, [forkId, newHostShadowId]);
  const moved = { ...f, host_shadow_id: newHostShadowId };
  return { fork: forkRow(moved, who.sub, await canPostGivenRow(moved, q, who.sub)) } as const;
}

/** Closes (or reopens) a fork: closed, it takes no new posts, but it and what is already inside it stay. */
export async function setForkClosed(q: Query, who: Author, forkId: string, closed: boolean) {
  const f = await getForkRaw(q, forkId);
  if (!f || f.owner_sub !== who.sub) return { error: 'Not yours to change.' } as const;
  await q(`UPDATE tt_forks SET closed = $2, updated_at = NOW() WHERE id = $1`, [forkId, closed]);
  const now = { ...f, closed };
  return { fork: forkRow(now, who.sub, await canPostGivenRow(now, q, who.sub)) } as const;
}

/** Whether this person may post inside a fork right now. */
export async function canPostInFork(q: Query, forkId: string, viewerSub: string | undefined): Promise<boolean> {
  return canPostGivenRow(await getForkRaw(q, forkId), q, viewerSub);
}

/** Opening someone's invite link lets that account post inside the fork from then on. */
export async function joinFork(q: Query, forkId: string, inviteToken: string, viewerSub: string) {
  const f = await getForkRaw(q, forkId);
  if (!f || f.closed || !f.invite_token || f.invite_token !== inviteToken) return { error: 'That invitation is not open.' } as const;
  await q(`INSERT INTO tt_fork_access (fork_id, poster_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [forkId, makerKey(viewerSub)]);
  return { ok: true } as const;
}

// ---------------------------------------------------------------------------
// A shared Fall: two people travelling one Fall together. Entirely an overlay
// on top of each person's own: only the leader's current place is ever kept
// (never a follower's own position, and never a history of hesitation or
// timing, only the plain trail of where the shared Fall itself has gone).
// Ending it, or either person leaving it, touches neither person's own Fall.

export interface SharedFallParticipant {
  /** Recognisable only for the life of this one shared Fall: hash(fallId, sub), never reused elsewhere. */
  token: string;
  name: string;
  /** Whether this is the viewer's own entry (so a client can tell its own presence apart from theirs). */
  mine: boolean;
}

export interface SharedFallView {
  id: string;
  hostName: string;
  /** Whether this viewer is the one leading it. */
  hosting: boolean;
  /** A plain content id (the same ids `findPath` already resolves), null until the leader first moves. */
  stationId: string | null;
  ended: boolean;
  /** Only ever sent to its own leader: the link that lets one other account join. */
  inviteLink?: string;
  participants: SharedFallParticipant[];
}

async function getSharedFallRaw(q: Query, id: string) {
  const [r] = await q(`SELECT * FROM tt_shared_fall WHERE id = $1`, [id]);
  return r ?? null;
}

/** One shared Fall, as one of its own participants sees it: null if it does not exist, or they are not in it. */
export async function sharedFallFor(q: Query, id: string, viewerSub: string): Promise<SharedFallView | null> {
  const f = await getSharedFallRaw(q, id);
  if (!f) return null;
  const all = await q(`SELECT sub, name, left_at FROM tt_shared_fall_participant WHERE shared_fall_id = $1`, [id]);
  // once a participant, always able to check back (even to see it has ended); the list shown is only who is still in it
  if (!all.some((r) => r.sub === viewerSub)) return null;
  const rows = all.filter((r) => r.left_at === null);
  const participants: SharedFallParticipant[] = [];
  for (const r of rows) {
    participants.push({ token: (await mark(`sharedFall|${id}|${r.sub}`)).slice(0, 16), name: String(r.name), mine: r.sub === viewerSub });
  }
  const hosting = f.host_sub === viewerSub;
  const ended = f.ended_at !== null;
  return {
    id,
    hostName: String(f.host_name),
    hosting,
    stationId: f.station_id ? String(f.station_id) : null,
    ended,
    ...(hosting && !ended ? { inviteLink: String(f.invite_token) } : {}),
    participants,
  };
}

/** Only a signed-in account opens one, leading it from wherever they already are. */
export async function createSharedFall(q: Query, who: Author) {
  // one that has already ended is let go after a couple of days: nothing here is meant to last
  if (Math.random() < 0.05) await q(`DELETE FROM tt_shared_fall WHERE ended_at IS NOT NULL AND ended_at < NOW() - INTERVAL '2 days'`);
  const id = newId();
  const inviteToken = newId();
  await q(`INSERT INTO tt_shared_fall (id, host_sub, host_name, invite_token) VALUES ($1, $2, $3, $4)`, [id, who.sub, who.name, inviteToken]);
  await q(`INSERT INTO tt_shared_fall_participant (shared_fall_id, sub, name) VALUES ($1, $2, $3)`, [id, who.sub, who.name]);
  return { sharedFall: (await sharedFallFor(q, id, who.sub))! } as const;
}

/** Opening someone's "Fall with me" link joins that account to it, as an independent participant, not a viewer. */
export async function joinSharedFall(q: Query, id: string, inviteToken: string, who: Author) {
  const f = await getSharedFallRaw(q, id);
  if (!f || f.ended_at || f.invite_token !== inviteToken) return { error: 'That invitation is not open any more.' } as const;
  await q(
    `INSERT INTO tt_shared_fall_participant (shared_fall_id, sub, name) VALUES ($1, $2, $3)
     ON CONFLICT (shared_fall_id, sub) DO UPDATE SET left_at = NULL, name = EXCLUDED.name`,
    [id, who.sub, who.name]
  );
  return { ok: true } as const;
}

/** Only its own leader moves a shared Fall: a plain content id, the same the flight already navigates by. */
export async function setSharedFallStation(q: Query, id: string, hostSub: string, stationId: string) {
  const f = await getSharedFallRaw(q, id);
  if (!f || f.host_sub !== hostSub || f.ended_at) return { error: 'Not yours to lead.' } as const;
  await q(`UPDATE tt_shared_fall SET station_id = $2, updated_at = NOW() WHERE id = $1`, [id, stationId]);
  return { ok: true } as const;
}

/**
 * Leaving marks that seat empty; it never touches the leaver's own Fall or
 * history. There being no one else yet to hand it to (see: switch lead,
 * not built), the leader leaving ends the shared Fall itself.
 */
export async function leaveSharedFall(q: Query, id: string, sub: string) {
  const f = await getSharedFallRaw(q, id);
  if (!f) return { error: 'That is already over.' } as const;
  await q(`UPDATE tt_shared_fall_participant SET left_at = NOW() WHERE shared_fall_id = $1 AND sub = $2 AND left_at IS NULL`, [id, sub]);
  if (f.host_sub === sub && !f.ended_at) await q(`UPDATE tt_shared_fall SET ended_at = NOW() WHERE id = $1`, [id]);
  return { ok: true } as const;
}
