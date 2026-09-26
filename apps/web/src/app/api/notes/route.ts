import { NextResponse } from 'next/server';
import { buildWorld } from '@/lib/shadowfield/world';
import { findPath } from '@/lib/shadowfield/model';
import { currentUser } from '@/lib/auth/session';
import { cleanNote } from '@/lib/notes/rules';
import { addNote, allowFrom, listNotes, notesConfigured } from '@/lib/notes/store';
import { db, dbConfigured } from '@/lib/shadows/db';
import { addNote as addNoteDb, getShadow, notesFor } from '@/lib/shadows/store';

// Anonymous notes left at a seal, for its maker. Anyone may leave one on a
// public idea. The Canvas's owner reads notes on his own ideas; each person
// reads the notes left at their own posted Shadows. Nothing but the words and
// the moment is kept.

/** The maker of a note's target: 'owner' for the Canvas's own ideas, else the poster's id. */
async function targetMaker(id: string): Promise<{ maker: string } | null> {
  if (id.startsWith('p/')) {
    if (!dbConfigured()) return null;
    const s = await getShadow(await db(), id.slice(2));
    return s && s.public && !s.hidden ? { maker: s.owner } : null;
  }
  if (id.length > 200 || id.startsWith('local/')) return null;
  return findPath(buildWorld([]), id) ? { maker: 'owner' } : null;
}

export async function POST(req: Request) {
  const useDb = dbConfigured();
  if (!useDb && !notesConfigured()) return NextResponse.json({ error: 'Notes are not switched on yet.' }, { status: 503 });
  let body: { target?: unknown; text?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // validated below
  }
  const target = typeof body.target === 'string' ? body.target : '';
  const text = cleanNote(body.text);
  try {
    if (!target || !(await targetMaker(target))) return NextResponse.json({ error: 'That idea is not on the Canvas.' }, { status: 404 });
    if (!text) return NextResponse.json({ error: 'A note is 1 to 500 characters.' }, { status: 400 });
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    if (notesConfigured() && !(await allowFrom(ip))) return NextResponse.json({ error: 'That is enough notes for now; try again later.' }, { status: 429 });
    if (useDb) await addNoteDb(await db(), target, text);
    else await addNote(target, text);
  } catch {
    return NextResponse.json({ error: 'The note could not be kept; try again.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(req: Request) {
  const user = await currentUser();
  const target = new URL(req.url).searchParams.get('target') ?? '';
  if (!user || !target) return NextResponse.json({ error: 'Only the maker reads notes.' }, { status: 403 });
  try {
    const t = await targetMaker(target);
    const allowed = t && (t.maker === 'owner' ? user.owner : t.maker === user.sub);
    if (!allowed) return NextResponse.json({ error: 'Only the maker reads notes.' }, { status: 403 });
    if (dbConfigured()) return NextResponse.json({ enabled: true, notes: await notesFor(await db(), target) }, { headers: { 'cache-control': 'no-store' } });
    if (notesConfigured()) return NextResponse.json({ enabled: true, notes: await listNotes(target) }, { headers: { 'cache-control': 'no-store' } });
    return NextResponse.json({ enabled: false, notes: [] });
  } catch {
    return NextResponse.json({ error: 'Notes could not be read.' }, { status: 502 });
  }
}
