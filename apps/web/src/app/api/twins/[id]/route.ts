import { NextResponse } from 'next/server';
import { FALLBACK_TWINS } from '@/lib/mockTwins';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Check if backend API has this twin
  try {
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://twinthink.onrender.com' : 'http://127.0.0.1:8001');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/api/twins/${id}`, { 
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Backend offline, unreachable or timed out, continue to fallback mocks
  }

  // 2. Canonical fallback twins for resilience
  if (FALLBACK_TWINS[id]) {
    return NextResponse.json(FALLBACK_TWINS[id]);
  }

  return NextResponse.json({ error: "Twin not found" }, { status: 404 });
}
