import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { currentUser } from '@/lib/auth/session';
import { db, dbConfigured } from '@/lib/shadows/db';
import { getShadow } from '@/lib/shadows/store';

// Films go straight from the maker's phone to the file store (Vercel Blob):
// this only says yes, for a signed-in maker adding to their own Shadow.

const FILM_BYTES_MAX = 200 * 1024 * 1024;

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !dbConfigured()) {
    return NextResponse.json({ error: 'Films are not switched on yet.' }, { status: 503 });
  }
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await currentUser();
        if (!user) throw new Error('Sign in first.');
        const s = clientPayload ? await getShadow(await db(), clientPayload) : null;
        if (!s || s.owner !== user.sub) throw new Error('Not yours to change.');
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
          maximumSizeInBytes: FILM_BYTES_MAX,
          addRandomSuffix: true,
        };
      },
      // the maker's page records the film itself once it has arrived
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'That film could not be sent.' }, { status: 400 });
  }
}
