import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { joinSharedFall } from '@/lib/shadows/store';

// Opening a "Fall with me" link joins that account as an independent
// participant, not a viewer: it grants nothing else.

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to accept the invitation.' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    const raw: unknown = await req.json();
    if (raw && typeof raw === 'object') body = raw as Record<string, unknown>;
  } catch {
    // validated below
  }
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) return NextResponse.json({ error: 'That invitation is not open.' }, { status: 400 });
  try {
    const r = await joinSharedFall(await db(), id, token, { sub: user.sub, name: user.name });
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be accepted; try again.' }, { status: 502 });
  }
}
