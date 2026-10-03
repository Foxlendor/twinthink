import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { moveFork, setForkClosed } from '@/lib/shadows/store';

// Only a fork's own maker moves or closes it. Moving it, or closing it, never
// touches what is already inside: only where it sits, or whether it still
// takes anything new.

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const who = { sub: user.sub, name: user.name };
  try {
    const q = await db();
    if (typeof body.hostShadowId === 'string') {
      const r = await moveFork(q, who, id, body.hostShadowId);
      if ('error' in r) return NextResponse.json({ error: r.error }, { status: 403 });
      return NextResponse.json({ fork: r.fork });
    }
    if (typeof body.closed === 'boolean') {
      const r = await setForkClosed(q, who, id, body.closed);
      if ('error' in r) return NextResponse.json({ error: r.error }, { status: 403 });
      return NextResponse.json({ fork: r.fork });
    }
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'That could not be changed; try again.' }, { status: 502 });
  }
}
