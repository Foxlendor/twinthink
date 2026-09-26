import { NextResponse } from 'next/server';
import { db, dbConfigured } from '@/lib/shadows/db';
import { report } from '@/lib/shadows/store';

// Anyone can flag a public Shadow for the Canvas's owner to look at. No name is kept.

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ error: 'Not switched on yet.' }, { status: 503 });
  let reason: unknown = '';
  try {
    reason = ((await req.json()) as { reason?: unknown }).reason;
  } catch {
    reason = '';
  }
  try {
    const r = await report(await db(), id, reason);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'That could not be sent; try again.' }, { status: 502 });
  }
}
