import 'server-only';
import { neon } from '@neondatabase/serverless';
import { Query, migrate } from './store';

// The Postgres the Vercel project is connected to (Neon). Whatever prefix the
// integration was given, one of these holds the connection string.
const NAMES = ['DATABASE_URL', 'STORAGE_URL', 'POSTGRES_URL', 'STORAGE_DATABASE_URL', 'STORAGE_POSTGRES_URL', 'NEON_DATABASE_URL'];
const url =
  NAMES.map((n) => process.env[n]).find((v) => v?.startsWith('postgres')) ??
  // any other prefix the integration was given
  Object.entries(process.env).find(([k, v]) => /(DATABASE|POSTGRES)_URL$/.test(k) && v?.startsWith('postgres'))?.[1] ??
  '';

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
