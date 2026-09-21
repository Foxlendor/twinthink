import { NextResponse } from 'next/server';
import { FALLBACK_TWINS } from '@/lib/mockTwins';
import { getLocalTwin } from '@/lib/twinsData';
import { DEFAULT_PITCH_CODES } from '@/lib/usePitchAccess';

function isPitchAuthorized(request: Request, searchParams: URLSearchParams): boolean {
  // 1. Check query parameters
  const queryCode = searchParams.get('pitch') || searchParams.get('code') || searchParams.get('invite');
  if (queryCode && DEFAULT_PITCH_CODES.includes(queryCode.toUpperCase().trim())) {
    return true;
  }

  // 2. Check custom header
  const headerCode = request.headers.get('x-pitch-code') || request.headers.get('x-pitch-pass');
  if (headerCode && DEFAULT_PITCH_CODES.includes(headerCode.toUpperCase().trim())) {
    return true;
  }

  // 3. Check cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/twinthink_pitch_code=([^;]+)/);
  if (match && DEFAULT_PITCH_CODES.includes(decodeURIComponent(match[1]).toUpperCase().trim())) {
    return true;
  }

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const authorized = isPitchAuthorized(request, searchParams);

  let rawTwin: any = null;

  // 1. Check local structured twin database first (twiizzlock, redrink, 0001)
  const local = getLocalTwin(id);
  if (local) {
    rawTwin = JSON.parse(JSON.stringify(local));
  } else {
    // 2. Check backend API
    try {
      const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://twinthink.onrender.com' : 'http://127.0.0.1:8001');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${backendUrl}/api/twins/${id}`, { 
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        rawTwin = await res.json();
      }
    } catch {
      // Backend unavailable or timed out
    }
  }

  // 3. Fallback mock if still not found
  if (!rawTwin && FALLBACK_TWINS[id]) {
    rawTwin = JSON.parse(JSON.stringify(FALLBACK_TWINS[id]));
  }

  if (!rawTwin) {
    return NextResponse.json({ error: "Twin not found" }, { status: 404 });
  }

  // 4. Server-Side PRIVATE ACCESS Data Masking
  // If NOT pitch authorized, mask all private assets, proprietary supplier trees, and confidential tolerances
  if (!authorized) {
    const maskedTwin = {
      ...rawTwin,
      current_version: {
        ...rawTwin.current_version,
        disclosure: {
          ...rawTwin.current_version?.disclosure,
          vault_access: 'RESTRICTED_DARK_CAPSULE',
          server_enforced: true,
          authorized: false,
          unlock_hint: 'Provide valid ?pitch=<CODE> or x-pitch-code header to unlock Private Records'
        },
        // Strip private assets (e.g. raw .step files, internal tooling drafts)
        assets: (rawTwin.current_version?.assets || []).filter(
          (a: any) => a.publication_scope === 'public_preview'
        )
      }
    };

    return NextResponse.json(maskedTwin, {
      headers: {
        'x-dark-capsule-vault': 'LOCKED',
        'Cache-Control': 'no-store'
      }
    });
  }

  // 5. Unlocked Full Engineering Twin
  return NextResponse.json({
    ...rawTwin,
    current_version: {
      ...rawTwin.current_version,
      disclosure: {
        ...rawTwin.current_version?.disclosure,
        vault_access: 'UNLOCKED_PITCH_PASS',
        server_enforced: true,
        authorized: true
      }
    }
  }, {
    headers: {
      'x-dark-capsule-vault': 'UNLOCKED',
      'Cache-Control': 'no-store'
    }
  });
}

