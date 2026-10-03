import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { report } from '@/lib/shadows/store';

// Anyone signed in can flag something shared, once. Enough flags hide it until
// the Canvas's owner looks; the reporter's name is never shown to anyone.

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to report.' }, { status: 401 });
  let reason: unknown = '';
  try {
    reason = ((await req.json()) as { reason?: unknown }).reason;
  } catch {
    reason = '';
  }
  try {
    const r = await report(await db(), user.sub, id, reason);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'That could not be sent; try again.' }, { status: 502 });
  }
}
