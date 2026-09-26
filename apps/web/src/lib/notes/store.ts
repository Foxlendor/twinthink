import 'server-only';
import { createHash } from 'node:crypto';

// Notes live in a Redis store reached over its REST API (Vercel's KV / Upstash
// integration sets KV_REST_API_URL and KV_REST_API_TOKEN). A note holds only
// its words and when it was left: no name, no account, no address.

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export function notesConfigured() {
  return Boolean(url && token);
}

async function cmd<T>(...args: (string | number)[]): Promise<T> {
  const res = await fetch(url!, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`notes store ${res.status}`);
  return ((await res.json()) as { result: T }).result;
}

export interface Note {
  t: number;
  text: string;
}

export async function addNote(target: string, text: string) {
  const note: Note = { t: Date.now(), text };
  await cmd('LPUSH', `notes:${target}`, JSON.stringify(note));
  await cmd('LTRIM', `notes:${target}`, 0, 499);
  await cmd('SADD', 'notes:targets', target);
}

export async function listNotes(target: string): Promise<Note[]> {
  const raw = await cmd<string[]>('LRANGE', `notes:${target}`, 0, 99);
  return raw.flatMap((r) => {
    try {
      return [JSON.parse(r) as Note];
    } catch {
      return [];
    }
  });
}

export async function notedTargets(): Promise<string[]> {
  return cmd<string[]>('SMEMBERS', 'notes:targets');
}

/**
 * At most `limit` notes an hour from one address. The address is only ever
 * held as a salted hash in a key that expires within the hour, apart from
 * any note.
 */
export async function allowFrom(ip: string, limit = 10): Promise<boolean> {
  const hour = Math.floor(Date.now() / 3600000);
  const salt = process.env.SESSION_SECRET ?? 'twinthink';
  const key = `rl:${createHash('sha256').update(`${salt}|${hour}|${ip}`).digest('hex').slice(0, 32)}`;
  const n = await cmd<number>('INCR', key);
  if (n === 1) await cmd('EXPIRE', key, 3600);
  return n <= limit;
}
