import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { noticeFor, logNoticeShown, logNoticeAction, logFunnelEvent, NoticeAction, FunnelEvent } from '@/lib/shadows/store';

// Rabi noticing: only ever tells a fork's own maker, only what is actually
// happening, and never acts. GET is what decides whether to show it (and
// records that it was); POST is either the maker's own decision (open a
// path / leave it / watch) or a step further along, once opening a path
// actually led somewhere (the composer opened; a fork was actually made).
// Neither kind of POST ever touches the fork itself.

const ACTIONS: NoticeAction[] = ['open_path', 'leave', 'watch'];
const EVENTS: FunnelEvent[] = ['composer_opened', 'fork_created'];

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
  const event = typeof body.event === 'string' && EVENTS.includes(body.event as FunnelEvent) ? (body.event as FunnelEvent) : null;
  if (!action && !event) return NextResponse.json({ error: 'Which decision?' }, { status: 400 });
  try {
    const q = await db();
    const createdForkId = typeof body.createdForkId === 'string' ? body.createdForkId : undefined;
    const r = action ? await logNoticeAction(q, id, user.sub, action) : await logFunnelEvent(q, id, user.sub, event!, createdForkId);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'That could not be kept; try again.' }, { status: 502 });
  }
}
