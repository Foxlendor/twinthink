import { NextResponse } from 'next/server';
import { authConfigured, currentUser } from '@/lib/auth/session';

// Who is looking: the signed-in visitor (name, picture, whether they own this
// Canvas), or nobody. The email is never sent back to the page.

export async function GET() {
  const user = await currentUser();
  return NextResponse.json(
    { enabled: authConfigured(), user: user ? { name: user.name, picture: user.picture ?? null, owner: user.owner } : null },
    { headers: { 'cache-control': 'no-store' } }
  );
}
