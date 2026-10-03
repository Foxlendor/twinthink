import { NextResponse } from 'next/server';
import { authConfigured } from '@/lib/auth/session';
import { safeNext } from '@/lib/auth/rules';

// Step 1 of "sign in with Google": send the visitor to Google with a one-time
// state and nonce, kept in a short-lived httpOnly cookie.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get('next'));
  if (!authConfigured()) return NextResponse.redirect(new URL(`${next}${next.includes('?') ? '&' : '?'}signin=off`, url.origin));
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  google.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  google.searchParams.set('redirect_uri', `${url.origin}/api/auth/callback/google`);
  google.searchParams.set('response_type', 'code');
  google.searchParams.set('scope', 'openid email profile');
  google.searchParams.set('state', state);
  google.searchParams.set('nonce', nonce);
  google.searchParams.set('prompt', 'select_account');
  const res = NextResponse.redirect(google);
  res.cookies.set('tt_oauth', JSON.stringify({ state, nonce, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 600,
  });
  return res;
}
