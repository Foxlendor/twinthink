import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionUser } from './rules';

// A signed, stateless session in an httpOnly cookie (see Next's authentication
// guide). Sign-in is switched on only when all of these are set in Vercel:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET (32+ random chars).

export const SESSION_COOKIE = 'tt_session';
const DAYS = 30;

export function authConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && (process.env.SESSION_SECRET ?? '').length >= 32);
}

function key() {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? '');
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(key());
}

export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token || !authConfigured()) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : payload.email,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
      owner: payload.owner === true,
    };
  } catch {
    return null;
  }
}

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: DAYS * 86400,
};
