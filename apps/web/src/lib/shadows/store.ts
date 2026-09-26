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
    sparks: s.sparks,
    mine: s.owner === viewerSub,
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
];

// every read counts the Shadows a story has sparked
const SELECT = `SELECT s.*, (SELECT COUNT(*)::int FROM tt_shadows c WHERE c.sparked_from = s.id) AS sparks FROM tt_shadows s`;

export async function migrate(q: Query) {
  for (const s of SCHEMA) await q(s);
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
    sparks: Number(r.sparks ?? 0),
  };
}

async function digest(text: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
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
  input: { title?: unknown; body?: unknown; public?: unknown; kind?: unknown; from?: unknown }
) {
  const story = input.kind === 'story';
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
    if (!src || src.kind !== 'story' || !src.public || src.hidden) return { error: 'That story is not here any more.' } as const;
    from = src.id;
  }
  const [{ n }] = await q(`SELECT COUNT(*)::int AS n FROM tt_shadows WHERE owner_sub = $1 AND created_at > NOW() - INTERVAL '1 day'`, [who.sub]);
  if (Number(n) >= POSTS_PER_DAY) return { error: 'That is enough for today; come back tomorrow.' } as const;
  // stories are told to everyone; a Shadow stays private until its maker shares it
  const rows = await q(
    `INSERT INTO tt_shadows (id, owner_sub, owner_name, title, body, is_public, kind, sparked_from) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [newId(), who.sub, story ? '' : firstName(who.name), title, body, story || input.public === true, story ? 'story' : 'shadow', from]
  );
  return { shadow: row(rows[0]) } as const;
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

export async function getShadow(q: Query, id: string): Promise<(ServerShadow & { hidden: boolean }) | null> {
  const rows = await q(`${SELECT} WHERE s.id = $1`, [id]);
  return rows[0] ? { ...row(rows[0]), hidden: rows[0].hidden === true } : null;
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
    return { ok: true } as const;
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
  const mark = await digest(`${reporter}:${id}`);
  await q(`INSERT INTO tt_reports (shadow_id, reason, reporter) VALUES ($1, $2, $3) ON CONFLICT (shadow_id, reporter) DO NOTHING`, [
    id,
    clean(reason, 300, true) ?? '',
    mark,
  ]);
  const [{ n }] = await q(`SELECT COUNT(*)::int AS n FROM tt_reports WHERE shadow_id = $1`, [id]);
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
