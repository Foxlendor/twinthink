'use client';

import React, { useState } from 'react';
import FlyBrainSpecialist from '@/components/FlyBrainSpecialist';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RndPage() {
  const [selectedTwin, setSelectedTwin] = useState<'redrink' | 'twiizzlock'>('redrink');

  return (
    <div style={{ minHeight: '100vh', background: '#090D16', padding: '2rem 1.5rem 4rem' }}>
      {/* Back to Home Navigation */}
      <div style={{ maxWidth: '1280px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#94A3B8',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            background: '#0F172A',
            border: '1px solid #1E293B'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        {/* Specimen Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedTwin('redrink')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedTwin === 'redrink' ? '1px solid #0284C7' : '1px solid #1E293B',
              background: selectedTwin === 'redrink' ? '#0284C7' : '#0F172A',
              color: '#FFFFFF'
            }}
          >
            ReDrink™ Straw
          </button>
          <button
            onClick={() => setSelectedTwin('twiizzlock')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedTwin === 'twiizzlock' ? '1px solid #059669' : '1px solid #1E293B',
              background: selectedTwin === 'twiizzlock' ? '#059669' : '#0F172A',
              color: '#FFFFFF'
            }}
          >
            TWIIZZLock™ Piston
          </button>
        </div>
      </div>

      <FlyBrainSpecialist
        twinId={selectedTwin}
        twinTitle={selectedTwin === 'redrink' ? 'ReDrink™ Exothermic Straw' : 'TWIIZZLock™ 2L Volume Lock'}
        domain={selectedTwin === 'redrink' ? 'Thermal Systems' : 'Mechanisms'}
      />
    </div>
  );
}
