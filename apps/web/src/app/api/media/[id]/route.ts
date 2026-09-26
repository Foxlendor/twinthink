import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { getPicture } from '@/lib/shadows/store';

// A picture from a posted Shadow, for whoever may see that Shadow.

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured() || !/^[a-z0-9]{6,20}$/.test(id)) return new Response('Not found', { status: 404 });
  try {
    const user = await currentUser();
    const pic = await getPicture(await db(), id, user?.sub);
    if (!pic) return new Response('Not found', { status: 404 });
    return new Response(new Uint8Array(pic.bytes), {
      headers: {
        'content-type': pic.mime,
        // briefly, so taking something down or keeping it private takes hold within minutes
        'cache-control': pic.open ? 'public, max-age=300' : 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return new Response('Could not be read', { status: 502 });
  }
}
