// Pure rules for sign-in, shared by the routes and the tests (no secrets here).

/** Who owns this Canvas: emails listed in OWNER_EMAILS (comma separated), verified by Google. */
export function isOwner(email: string | undefined, verified: boolean | undefined, ownerList: string | undefined): boolean {
  if (!email || !verified || !ownerList) return false;
  const owners = ownerList
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.trim().toLowerCase());
}

/** Where to go after signing in: only a path on this site, never another site. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.length > 500) return '/canvas';
  // browsers drop tabs and line breaks and read \\ as /, so none of those are allowed at all
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return '/canvas';
  let u: URL;
  try {
    u = new URL(next, 'https://here.invalid');
  } catch {
    return '/canvas';
  }
  // and whatever it resolves to must still be this site
  if (u.origin !== 'https://here.invalid') return '/canvas';
  return u.pathname + u.search + u.hash;
}

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  owner: boolean;
}
