import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { sharedFallFor, setSharedFallStation } from '@/lib/shadows/store';

// GET is what a participant polls to follow a shared Fall: only ever the
// leader's current place (a plain content id), never a follower's own
// position. POST is the leader alone moving it.

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  try {
    const view = await sharedFallFor(await db(), id, user.sub);
    if (!view) return NextResponse.json({ error: 'Not here.' }, { status: 404 });
    return NextResponse.json({ sharedFall: view }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'That could not be read just now.' }, { status: 502 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    const raw: unknown = await req.json();
    if (raw && typeof raw === 'object') body = raw as Record<string, unknown>;
  } catch {
    // validated below
  }
  const stationId = typeof body.stationId === 'string' ? body.stationId : '';
  if (!stationId) return NextResponse.json({ error: 'Where to?' }, { status: 400 });
  try {
    const r = await setSharedFallStation(await db(), id, user.sub, stationId);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be kept; try again.' }, { status: 502 });
  }
}
