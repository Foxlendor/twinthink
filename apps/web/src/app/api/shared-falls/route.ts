import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { createSharedFall } from '@/lib/shadows/store';

// "Fall with me": one signed-in account opens a shared Fall, leading it from
// wherever they already are; the invite link lets one other account join as
// an independent participant, not a passive viewer.

export async function POST() {
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to Fall with someone.' }, { status: 401 });
  try {
    const r = await createSharedFall(await db(), { sub: user.sub, name: user.name });
    return NextResponse.json({ sharedFall: r.sharedFall }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'That could not be opened; try again.' }, { status: 502 });
  }
}
