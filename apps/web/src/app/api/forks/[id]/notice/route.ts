import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { noticeFor, logNoticeShown, logNoticeAction, NoticeAction } from '@/lib/shadows/store';

// Rabi noticing: only ever tells a fork's own maker, only what is actually
// happening, and never acts. GET is what decides whether to show it (and
// records that it was); POST is the maker's own decision, logged plainly
// and nothing more. The fork itself is never touched by anything here.

const ACTIONS: NoticeAction[] = ['open_path', 'leave', 'watch'];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return NextResponse.json({ show: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ show: false });
  try {
    const q = await db();
    const notice = await noticeFor(q, id, user.sub);
    if (!notice) return NextResponse.json({ show: false });
    if (notice.show) await logNoticeShown(q, id, user.sub, 'route_candidate');
    return NextResponse.json(notice, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ show: false });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const action = typeof body.action === 'string' && ACTIONS.includes(body.action as NoticeAction) ? (body.action as NoticeAction) : null;
  if (!action) return NextResponse.json({ error: 'Which decision?' }, { status: 400 });
  try {
    const r = await logNoticeAction(await db(), id, user.sub, action);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be kept; try again.' }, { status: 502 });
  }
}
