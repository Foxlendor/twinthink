import { NextResponse } from 'next/server';
import { getLocalTwin } from '@/lib/twinsData';
import { DEFAULT_PITCH_CODES } from '@/lib/usePitchAccess';

function isPitchAuthorized(request: Request, searchParams: URLSearchParams): boolean {
  const queryCode = searchParams.get('pitch') || searchParams.get('code') || searchParams.get('invite');
  if (queryCode && DEFAULT_PITCH_CODES.includes(queryCode.toUpperCase().trim())) {
    return true;
  }

  const headerCode = request.headers.get('x-pitch-code') || request.headers.get('x-pitch-pass');
  if (headerCode && DEFAULT_PITCH_CODES.includes(headerCode.toUpperCase().trim())) {
    return true;
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/twinthink_pitch_code=([^;]+)/);
  if (match && DEFAULT_PITCH_CODES.includes(decodeURIComponent(match[1]).toUpperCase().trim())) {
    return true;
  }

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  const { searchParams } = new URL(request.url);
  const authorized = isPitchAuthorized(request, searchParams);

  const local = getLocalTwin(id);
  const assets = local?.current_version?.assets || [];
  const targetAsset = assets.find(
    (a) => a.relative_path.toLowerCase() === filename.toLowerCase()
  );

  // If asset is marked private and client has no valid pitch pass -> 403 FORBIDDEN
  if (targetAsset && targetAsset.publication_scope === 'private' && !authorized) {
    return NextResponse.json(
      {
        error: "Forbidden: Dark Capsule Level-3 Vault Restricted",
        asset: filename,
        twin_id: id,
        access_requirement: "Valid pitch pass or cryptographic release key required",
        status: 403
      },
      { 
        status: 403,
        headers: {
          'x-vault-gate': 'LOCKED_PRIVATE_ASSET',
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  // If asset not registered or public preview
  if (targetAsset) {
    return NextResponse.json({
      status: "authorized",
      asset: filename,
      twin_id: id,
      scope: targetAsset.publication_scope,
      size_bytes: targetAsset.size_bytes,
      media_type: targetAsset.media_type
    });
  }

  return NextResponse.json({ error: "Asset not found" }, { status: 404 });
}
