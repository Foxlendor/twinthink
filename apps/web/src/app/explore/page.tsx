'use client';

import React from 'react';
import Link from 'next/link';
import { TWINS_DATABASE } from '@/lib/twinsData';
import { ArrowRight, Compass, Database } from 'lucide-react';

export default function ExplorePage() {
  const twins = Object.values(TWINS_DATABASE);

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', padding: '4rem 1.5rem', color: '#111827' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Compass size={36} color="#111827" />
            Explore Public Records.
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#4B5563', maxWidth: '600px', lineHeight: 1.6 }}>
            Browse open engineering records, physical component bills of materials, and verified twins.
          </p>
        </div>

        {/* Info Section */}
        <div style={{ 
          background: '#FFFFFF', 
          border: '1px solid #E5E7EB', 
          borderRadius: '16px', 
          padding: '2rem',
          marginBottom: '4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Database size={24} color="#2563EB" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Public Directory</h2>
          </div>
          <p style={{ color: '#4B5563', lineHeight: 1.5, margin: 0 }}>
            Physical components and systems have digital records. Twins host the simulation code, CAD models, sensor telemetry, and assembly instructions required to recreate the physical object in reality.
          </p>
        </div>

        {/* Directory Grid */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Featured Directory</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {twins.map(twin => (
              <Link
                key={twin.id}
                href={`/twins/${twin.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.5px' }}>
                      ID: {twin.id}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      v{twin.current_version.semver}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.5rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {twin.current_version.title}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5 }}>
                    {twin.current_version.summary.substring(0, 110)}...
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
                    Verified Record
                  </div>
                  <div style={{ color: '#2563EB', display: 'flex', alignItems: 'center' }}>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
