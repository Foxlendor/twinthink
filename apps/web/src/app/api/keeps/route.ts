import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { Query, keep, unkeep } from '@/lib/shadows/store';

// A person's sketchbook: POST keeps something, DELETE lets it go. What is kept
// is only ever shown to them, and only while it is still there to be seen.

async function change(req: Request, fn: (q: Query, sub: string, target: unknown) => Promise<{ error?: string; ok?: boolean }>) {
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to keep things.' }, { status: 401 });
  let target: unknown;
  try {
    const raw: unknown = await req.json();
    target = raw && typeof raw === 'object' ? (raw as { target?: unknown }).target : undefined;
  } catch {
    target = undefined;
  }
  try {
    const r = await fn(await db(), user.sub, target);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be changed; try again.' }, { status: 502 });
  }
}

export const POST = (req: Request) => change(req, keep);
export const DELETE = (req: Request) => change(req, unkeep);
