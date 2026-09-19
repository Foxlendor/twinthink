import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';

interface CreatorProfileProps {
  params: Promise<{ creator: string }>;
}

export default async function CreatorProfilePage({ params }: CreatorProfileProps) {
  const { creator } = await params;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#111827' }}>
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#6B7280',
            textDecoration: 'none',
            fontSize: '0.85rem',
            marginBottom: '2rem'
          }}
        >
          <ArrowLeft size={16} /> Back to TwinThink
        </Link>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '22px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(17,24,39,0.04)'
          }}
        >
          <LockKeyhole size={32} color="#6B7280" style={{ marginBottom: '1rem' }} />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '999px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: '#374151'
            }}
          >
            <ShieldCheck size={12} />
            Publication Controlled
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.7px', margin: '1rem 0 0.65rem' }}>
            Creator profile not publicly published
          </h1>

          <p style={{ maxWidth: '560px', margin: '0 auto', color: '#6B7280', lineHeight: 1.6 }}>
            The profile identified by <code>{creator}</code> has no public creator record.
            TwinThink does not expose personal inventions, identity details, or private work
            merely because a creator route exists.
          </p>
        </div>
      </main>
    </div>
  );
}
