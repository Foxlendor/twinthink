'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Menu, X, Plus } from 'lucide-react';
import CreateTwinModal from './CreateTwinModal';

export default function Navbar() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          
          {/* Brand Logo */}
          <Link 
            href="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              textDecoration: 'none', 
              color: '#111827' 
            }}
          >
            <span style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              TWINTH.INK
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 400 }}>
              TwinThink
            </span>
          </Link>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <Link
              href="/twins/0001"
              style={{
                fontSize: '0.875rem',
                color: '#374151',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.15s'
              }}
            >
              Explore
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.875rem',
                color: '#374151',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Create Twin
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '0.5rem', color: '#4B5563' }}>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 0 }}
                onClick={() => alert('Account profile coming soon.')}
                aria-label="User Profile"
              >
                <User size={18} />
              </button>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 0 }}
                onClick={() => setShowCreateModal(true)}
                aria-label="Menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Create Twin Modal */}
      {showCreateModal && (
        <CreateTwinModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}
