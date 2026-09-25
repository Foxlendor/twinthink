import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { SESSION_COOKIE, authConfigured, sessionCookieOptions, signSession } from '@/lib/auth/session';
import { isOwner, safeNext } from '@/lib/auth/rules';

// Step 2: Google sends the visitor back with a code. Check the state, trade
// the code for an ID token, verify its signature, audience and nonce, and
// start a session. Nothing else about the account is stored.

const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  let saved: { state?: string; nonce?: string; next?: string } = {};
  try {
    saved = JSON.parse(jar.get('tt_oauth')?.value ?? '{}');
  } catch {
    saved = {};
  }
  const next = safeNext(saved.next);
  const fail = (why: string) => {
    const res = NextResponse.redirect(new URL(`/canvas?signin=${why}`, url.origin));
    res.cookies.delete({ name: 'tt_oauth', path: '/api/auth' });
    return res;
  };
  if (!authConfigured()) return fail('off');
  const code = url.searchParams.get('code');
  if (!code || !saved.state || url.searchParams.get('state') !== saved.state) return fail('failed');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${url.origin}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail('failed');
    const { id_token } = (await tokenRes.json()) as { id_token?: string };
    if (!id_token) return fail('failed');
    const { payload } = await jwtVerify(id_token, GOOGLE_KEYS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    if (payload.nonce !== saved.nonce || typeof payload.sub !== 'string' || typeof payload.email !== 'string') return fail('failed');
    const verified = payload.email_verified === true;
    const token = await signSession({
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : payload.email,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
      owner: isOwner(payload.email, verified, process.env.OWNER_EMAILS),
    });
    const res = NextResponse.redirect(new URL(next, url.origin));
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    res.cookies.delete({ name: 'tt_oauth', path: '/api/auth' });
    return res;
  } catch {
    return fail('failed');
  }
}
