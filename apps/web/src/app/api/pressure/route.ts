import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { allowSender, pressure, markReached, forkExists } from '@/lib/shadows/store';

// Pressure: GET how much has gathered at each wall (0..1 each, never a count);
// POST that a fall reached one and turned back (kept only as a keyed one-way
// mark of you and the day). Only a real fork can gather this.

async function isFork(target: string) {
  if (!target.startsWith('fork/') || target.length > 60) return false;
  return forkExists(await db(), target.slice('fork/'.length));
}

export async function GET() {
  if (!dbConfigured()) return NextResponse.json({ levels: {} });
  try {
    return NextResponse.json({ levels: await pressure(await db()) }, { headers: { 'cache-control': 'public, max-age=300' } });
  } catch {
    return NextResponse.json({ levels: {} });
  }
}

export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  let target: unknown;
  try {
    const raw: unknown = await req.json();
    target = raw && typeof raw === 'object' ? (raw as { target?: unknown }).target : undefined;
  } catch {
    target = undefined;
  }
  if (typeof target !== 'string' || !(await isFork(target))) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const user = await currentUser();
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    const visitor = user ? `u:${user.sub}` : `a:${ip}|${req.headers.get('user-agent') ?? ''}`;
    const q = await db();
    if (!(await allowSender(q, `pressure|${visitor}`, 60))) return NextResponse.json({ ok: false }, { status: 429 });
    await markReached(q, target, visitor);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
