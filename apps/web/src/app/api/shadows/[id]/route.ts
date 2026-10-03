import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { forksIn, forViewer, removeShadow, shadowFor, updateShadow } from '@/lib/shadows/store';

// Only a Shadow's maker changes it or lets it go; the Canvas's owner may take
// a public one down (it is hidden, not deleted, and stays its maker's).

/** One Shadow by its link: shared ones (even only by link) for anyone, and yours for you. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  try {
    const user = await currentUser();
    const s = await shadowFor(await db(), id, user?.sub);
    if (!s) return NextResponse.json({ error: 'Not here.' }, { status: 404 });
    const forks = await forksIn(await db(), s.id, user?.sub);
    return NextResponse.json({ shadow: { ...forViewer(s, user?.sub), forks } }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'That could not be read.' }, { status: 502 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Posting is not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    const raw: unknown = await req.json();
    if (raw && typeof raw === 'object') body = raw as Record<string, unknown>;
  } catch {
    // validated below
  }
  try {
    const r = await updateShadow(await db(), { sub: user.sub, name: user.name }, id, body);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 403 });
    return NextResponse.json({ shadow: forViewer(r.shadow, user.sub) });
  } catch {
    return NextResponse.json({ error: 'That could not be changed; try again.' }, { status: 502 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Posting is not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  try {
    const r = await removeShadow(await db(), { sub: user.sub, name: user.name }, id, user.owner);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 403 });
    // its films leave the file store too (best effort: the Shadow is gone either way)
    const films = 'films' in r ? r.films ?? [] : [];
    if (films.length && process.env.BLOB_READ_WRITE_TOKEN) await del(films).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be removed; try again.' }, { status: 502 });
  }
}
