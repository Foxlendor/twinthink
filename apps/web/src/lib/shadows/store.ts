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

export interface ServerShadow {
  id: string;
  owner: string;
  by: string;
  title: string;
  body: string;
  public: boolean;
  created: number;
  updated: number;
}

/** What a viewer is sent: never the maker's account id, only whether it is theirs. */
export function forViewer(s: ServerShadow, viewerSub: string | undefined) {
  return { id: s.id, by: s.by, title: s.title, body: s.body, public: s.public, created: s.created, updated: s.updated, mine: s.owner === viewerSub };
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
];

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
  };
}

function newId() {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, 14);
}

export async function createShadow(q: Query, who: Author, input: { title?: unknown; body?: unknown; public?: unknown }) {
  const title = clean(input.title, TITLE_MAX);
  const body = clean(input.body, BODY_MAX, true);
  if (!title || body === null) return { error: 'A Shadow needs a name (up to 120 characters) and at most 2000 characters inside.' } as const;
  const [{ n }] = await q(`SELECT COUNT(*)::int AS n FROM tt_shadows WHERE owner_sub = $1 AND created_at > NOW() - INTERVAL '1 day'`, [who.sub]);
  if (Number(n) >= POSTS_PER_DAY) return { error: 'That is enough new Shadows for today.' } as const;
  const rows = await q(
    `INSERT INTO tt_shadows (id, owner_sub, owner_name, title, body, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [newId(), who.sub, firstName(who.name), title, body, input.public === true]
  );
  return { shadow: row(rows[0]) } as const;
}

/** Everyone's public Shadows, newest first (hidden ones never). */
export async function publicShadows(q: Query, limit = 300): Promise<ServerShadow[]> {
  const rows = await q(`SELECT * FROM tt_shadows WHERE is_public AND NOT hidden ORDER BY created_at DESC LIMIT $1`, [limit]);
  return rows.map(row);
}

/** A person's own Shadows, public or not. */
export async function myShadows(q: Query, sub: string): Promise<ServerShadow[]> {
  const rows = await q(`SELECT * FROM tt_shadows WHERE owner_sub = $1 ORDER BY created_at DESC LIMIT 300`, [sub]);
  return rows.map(row);
}

export async function getShadow(q: Query, id: string): Promise<(ServerShadow & { hidden: boolean }) | null> {
  const rows = await q(`SELECT * FROM tt_shadows WHERE id = $1`, [id]);
  return rows[0] ? { ...row(rows[0]), hidden: rows[0].hidden === true } : null;
}

/** Only its maker changes a Shadow. */
export async function updateShadow(q: Query, who: Author, id: string, input: { title?: unknown; body?: unknown; public?: unknown }) {
  const s = await getShadow(q, id);
  if (!s || s.owner !== who.sub) return { error: 'Not yours to change.' } as const;
  const title = input.title === undefined ? s.title : clean(input.title, TITLE_MAX);
  const body = input.body === undefined ? s.body : clean(input.body, BODY_MAX, true);
  if (!title || body === null) return { error: 'A Shadow needs a name (up to 120 characters) and at most 2000 characters inside.' } as const;
  const pub = input.public === undefined ? s.public : input.public === true;
  const rows = await q(`UPDATE tt_shadows SET title = $2, body = $3, is_public = $4, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, title, body, pub]);
  return { shadow: row(rows[0]) } as const;
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

export async function report(q: Query, id: string, reason: unknown) {
  const s = await getShadow(q, id);
  if (!s || !s.public) return { error: 'Not found.' } as const;
  await q(`INSERT INTO tt_reports (shadow_id, reason) VALUES ($1, $2)`, [id, clean(reason, 300, true) ?? '']);
  return { ok: true } as const;
}

export async function addNote(q: Query, target: string, body: string) {
  await q(`INSERT INTO tt_notes (target, body) VALUES ($1, $2)`, [target, body]);
}

export async function notesFor(q: Query, target: string) {
  const rows = await q(`SELECT body, created_at FROM tt_notes WHERE target = $1 ORDER BY created_at DESC LIMIT 100`, [target]);
  return rows.map((r) => ({ t: new Date(r.created_at as string).getTime(), text: String(r.body) }));
}
