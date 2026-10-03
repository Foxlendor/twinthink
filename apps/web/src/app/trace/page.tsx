'use client';

import dynamic from 'next/dynamic';

const TraceEditor = dynamic(() => import('./TraceEditor'), { ssr: false, loading: () => <p role="status">Opening picture tools…</p> });

export default function TracePage() {
  return <TraceEditor />;
}
