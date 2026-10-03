import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { leaveSharedFall } from '@/lib/shadows/store';

// Leaving never destroys the leaver's own Fall or history. The leader
// leaving ends the shared Fall itself (there being no one else yet to lead
// it: see "switch lead", not built).

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  try {
    const r = await leaveSharedFall(await db(), id, user.sub);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be kept; try again.' }, { status: 502 });
  }
}
