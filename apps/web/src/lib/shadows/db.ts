import 'server-only';
import { neon } from '@neondatabase/serverless';
import { Query, migrate } from './store';

// The Postgres the Vercel project is connected to (Neon). Whatever prefix the
// integration was given, one of these holds the connection string.
const url =
  process.env.DATABASE_URL ?? process.env.STORAGE_URL ?? process.env.POSTGRES_URL ?? process.env.STORAGE_DATABASE_URL ?? '';

export function dbConfigured() {
  return url.startsWith('postgres');
}

let ready: Promise<Query> | null = null;

/** The query function, with the tables made on first use. */
export function db(): Promise<Query> {
  ready ??= (async () => {
    const sql = neon(url);
    const q: Query = async (text, params = []) => (await sql.query(text, params)) as Record<string, unknown>[];
    await migrate(q);
    return q;
  })();
  ready.catch(() => {
    ready = null;
  });
  return ready;
}
