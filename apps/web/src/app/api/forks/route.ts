import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { createFork, forksIn, roomFor, shadowFor } from '@/lib/shadows/store';

// Forks: a named space a maker opens inside their own Shadow. Anyone who may
// see the Shadow sees its forks; only its own maker is ever told its invite
// link or how much room they have left.

export async function GET(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ enabled: false, forks: [] }, { headers: { 'cache-control': 'no-store' } });
  const host = new URL(req.url).searchParams.get('host') ?? '';
  if (!host) return NextResponse.json({ error: 'Which Shadow?' }, { status: 400 });
  try {
    const q = await db();
    const user = await currentUser();
    const s = await shadowFor(q, host, user?.sub);
    if (!s) return NextResponse.json({ error: 'Not here.' }, { status: 404 });
    const forks = await forksIn(q, host, user?.sub);
    const room = user && s.owner === user.sub ? await roomFor(q, user.sub) : undefined;
    return NextResponse.json({ enabled: true, forks, ...(room ? { room } : {}) }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ enabled: false, forks: [], error: 'Forks could not be read just now.' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to open a fork.' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    const raw: unknown = await req.json();
    if (raw && typeof raw === 'object') body = raw as Record<string, unknown>;
  } catch {
    // validated below
  }
  const host = typeof body.hostShadowId === 'string' ? body.hostShadowId : '';
  if (!host) return NextResponse.json({ error: 'Which Shadow?' }, { status: 400 });
  try {
    const r = await createFork(await db(), { sub: user.sub, name: user.name }, host, body);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ fork: r.fork }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'That could not be opened; try again.' }, { status: 502 });
  }
}
