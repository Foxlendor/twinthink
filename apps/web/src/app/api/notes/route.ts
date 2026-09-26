import { NextResponse } from 'next/server';
import { buildWorld } from '@/lib/shadowfield/world';
import { findPath } from '@/lib/shadowfield/model';
import { currentUser } from '@/lib/auth/session';
import { cleanNote } from '@/lib/notes/rules';
import { addNote, allowFrom, listNotes, notedTargets, notesConfigured } from '@/lib/notes/store';

// Anonymous notes left at a seal, for the maker. Anyone may leave one on a
// public idea; only the Canvas's owner (signed in) may read them.

function publicTarget(id: unknown): string | null {
  if (typeof id !== 'string' || id.length > 200 || id.startsWith('local/')) return null;
  return findPath(buildWorld([]), id) ? id : null;
}

export async function POST(req: Request) {
  if (!notesConfigured()) return NextResponse.json({ error: 'Notes are not switched on yet.' }, { status: 503 });
  let body: { target?: unknown; text?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // validated below
  }
  const target = publicTarget(body.target);
  const text = cleanNote(body.text);
  if (!target) return NextResponse.json({ error: 'That idea is not on the Canvas.' }, { status: 404 });
  if (!text) return NextResponse.json({ error: 'A note is 1 to 500 characters.' }, { status: 400 });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  try {
    if (!(await allowFrom(ip))) return NextResponse.json({ error: 'That is enough notes for now; try again later.' }, { status: 429 });
    await addNote(target, text);
  } catch {
    return NextResponse.json({ error: 'The note could not be kept; try again.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user?.owner) return NextResponse.json({ error: 'Only the maker reads notes.' }, { status: 403 });
  if (!notesConfigured()) return NextResponse.json({ enabled: false, notes: [], targets: [] });
  const target = new URL(req.url).searchParams.get('target');
  try {
    if (target) return NextResponse.json({ enabled: true, notes: await listNotes(target) }, { headers: { 'cache-control': 'no-store' } });
    return NextResponse.json({ enabled: true, targets: await notedTargets() }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Notes could not be read.' }, { status: 502 });
  }
}
