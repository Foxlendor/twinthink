import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { allowSender, getShadow, resonance, resonate } from '@/lib/shadows/store';
import { buildWorld } from '@/lib/shadowfield/world';
import { findPath } from '@/lib/shadowfield/model';

// Resonance: GET how much things resonate (0..1 each, never a count);
// POST that you stayed with something (kept only as a keyed one-way mark of
// you and the day). Only things anyone may see can resonate.

async function visible(target: string) {
  if (target.length > 200 || target.startsWith('local/') || target.startsWith('k/')) return false;
  if (target.startsWith('p/')) {
    const s = await getShadow(await db(), target.slice(2));
    return !!s && s.public && !s.hidden;
  }
  const path = findPath(buildWorld([]), target);
  return !!path && !path.some((n) => n.disclosure > 0);
}

export async function GET() {
  if (!dbConfigured()) return NextResponse.json({ levels: {} });
  try {
    return NextResponse.json({ levels: await resonance(await db()) }, { headers: { 'cache-control': 'public, max-age=300' } });
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
  if (typeof target !== 'string' || !target) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    if (!(await visible(target))) return NextResponse.json({ ok: false }, { status: 404 });
    const user = await currentUser();
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    const visitor = user ? `u:${user.sub}` : `a:${ip}|${req.headers.get('user-agent') ?? ''}`;
    const q = await db();
    if (!(await allowSender(q, `resonance|${visitor}`, 60))) return NextResponse.json({ ok: false }, { status: 429 });
    await resonate(q, target, visitor);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
