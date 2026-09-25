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
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/canvas';
  return next.slice(0, 500);
}

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  owner: boolean;
}
