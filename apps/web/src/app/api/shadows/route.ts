import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { createShadow, forViewer, myShadows, publicShadows } from '@/lib/shadows/store';

// Shadows people post. Anyone may see the public ones (their maker's first
// name, the name of the work and what is inside it; nothing else). Signed-in
// makers also get their own, public or not, and may post new ones.

const off = () => NextResponse.json({ enabled: false, public: [], mine: [] }, { headers: { 'cache-control': 'no-store' } });

export async function GET() {
  if (!dbConfigured()) return off();
  try {
    const q = await db();
    const user = await currentUser();
    const pub = (await publicShadows(q)).map((s) => forViewer(s, user?.sub));
    const mine = user ? (await myShadows(q, user.sub)).map((s) => forViewer(s, user.sub)) : [];
    return NextResponse.json({ enabled: true, signedIn: !!user, public: pub, mine }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ enabled: false, public: [], mine: [], error: 'The Canvas could not be read just now.' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: 'Posting is not switched on yet.' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to post your work.' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // validated below
  }
  try {
    const r = await createShadow(await db(), { sub: user.sub, name: user.name }, body);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ shadow: forViewer(r.shadow, user.sub) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'That could not be kept; try again.' }, { status: 502 });
  }
}
