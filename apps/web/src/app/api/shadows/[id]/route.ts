import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { forViewer, removeShadow, updateShadow } from '@/lib/shadows/store';

// Only a Shadow's maker changes it or lets it go; the Canvas's owner may take
// a public one down (it is hidden, not deleted, and stays its maker's).

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Posting is not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be removed; try again.' }, { status: 502 });
  }
}
