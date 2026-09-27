import 'server-only';
import { buildWorld } from './world';
import { findPath } from './model';
import { db, dbConfigured } from '@/lib/shadows/db';
import { getShadow } from '@/lib/shadows/store';

// What a shared link says about the one thing it points to, for its preview
// card: a name and a line, and only for what anyone may see.

export interface Shared {
  title: string;
  line: string;
  /** A still from its film, if it has one (a path on this site). */
  still?: string;
}

/** `at` is a path of ids joined by ~, as in /slate?at=moments~moment/abc */
export async function describeShared(at: string | undefined): Promise<Shared | null> {
  if (!at || at.length > 600) return null;
  const ids = at.split('~').filter(Boolean);
  const last = ids[ids.length - 1];
  if (!last) return null;
  if (last.startsWith('p/')) {
    if (!dbConfigured()) return null;
    try {
      const s = await getShadow(await db(), last.slice(2));
      if (!s || !s.public || s.hidden) return null;
      return { title: s.title, line: s.kind === 'story' ? 'a story, told without a name' : `by ${s.by}` };
    } catch {
      return null;
    }
  }
  const path = findPath(buildWorld([]), last);
  // nothing sealed is ever described, not even its name
  if (!path || path.some((n) => n.disclosure > 0)) return null;
  const node = path[path.length - 1];
  const film = node.media?.find((m) => m.kind === 'video');
  const still = film && film.kind === 'video' ? film.poster : undefined;
  return { title: node.title ?? 'the Slate', line: node.line ?? 'on the Slate', ...(still ? { still } : {}) };
}
