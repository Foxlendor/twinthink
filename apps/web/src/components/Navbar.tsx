'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Menu, X, Plus, ShieldCheck, Sparkles, FolderArchive, Compass, Coffee, BookOpen, Feather, Briefcase, Coins } from 'lucide-react';
import CreateTwinModal from './CreateTwinModal';
import BrandLogo from './BrandLogo';
import InventorNotebookModal from './InventorNotebookModal';

export default function Navbar() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close menu on Escape key or trigger Easter egg on shortcut
  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setShowProfileModal(false);
        setShowNotebookModal(false);
      }
      // Secret easter egg shortcut: Ctrl+Alt+I
      if (e.ctrlKey && e.altKey && (e.key === 'i' || e.key === 'I')) {
        setShowNotebookModal(true);
      }
      // Secret easter egg word typing: "twin"
      keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-4);
      if (keyBuffer === 'twin') {
        setShowNotebookModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset logo click count after 1.5 seconds
  useEffect(() => {
    if (logoClickCount > 0) {
      const timer = setTimeout(() => setLogoClickCount(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [logoClickCount]);

  // The Canvas is an immersive medium with its own quiet chrome.
  if (pathname?.startsWith('/canvas')) return null;

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E5E7EB',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          
          {/* Brand Logo with 3-click Easter Egg */}
          <div 
            onClick={() => {
              setLogoClickCount(prev => {
                const next = prev + 1;
                if (next >= 3) {
                  setShowNotebookModal(true);
                  return 0;
                }
                return next;
              });
            }}
            style={{ display: 'inline-flex', cursor: 'pointer' }}
            title="Twinth.ink (Tip: Triple-click for Inventor Journal)"
          >
            <Link 
              href="/" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none', 
                color: '#111827' 
              }}
            >
              <BrandLogo height={34} />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link 
              href="/bounties" 
              style={{ 
                fontSize: '0.8125rem', 
                fontWeight: 700, 
                color: pathname === '/bounties' ? '#2563EB' : '#4B5563', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                background: pathname === '/bounties' ? '#EFF6FF' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Briefcase size={14} color="#2563EB" />
              <span>R&amp;D Bounties</span>
            </Link>

            <Link
              href="/canvas"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#4B5563',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontStyle: 'italic',
              }}
            >
              Canvas
            </Link>

            <Link 
              href="/roundup" 
              style={{ 
                fontSize: '0.8125rem', 
                fontWeight: 700, 
                color: pathname === '/roundup' ? '#059669' : '#4B5563', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                background: pathname === '/roundup' ? '#ECFDF5' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Coins size={14} color="#059669" />
              <span>IP Kiosk &amp; Pool</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.25rem', color: '#4B5563' }}>
              <button 
                style={{ 
                  background: 'none', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer', 
                  color: '#4B5563' 
                }}
                onClick={() => setShowProfileModal(true)}
                aria-label="Inventor Profile"
                title="Inventor Profile"
              >
                <User size={16} />
              </button>

              {/* Burger Menu Button */}
              <button 
                style={{ 
                  background: mobileMenuOpen ? '#F3F4F6' : 'none', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer', 
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </nav>

        </div>

        {/* Mobile / Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              borderBottom: '1px solid #E5E7EB',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
              padding: '1.25rem 1.5rem',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <Link
                  href="/twins/0001"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    textDecoration: 'none',
                    color: '#111827'
                  }}
                >
                  <div style={{ padding: '6px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <Compass size={18} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Explore Records</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Concept previews & verified models</div>
                  </div>
                </Link>

                <Link
                  href="/archive"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    textDecoration: 'none',
                    color: '#111827'
                  }}
                >
                  <div style={{ padding: '6px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <FolderArchive size={18} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Public Archive</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Curated public invention records</div>
                  </div>
                </Link>

                <Link
                  href="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    textDecoration: 'none',
                    color: '#111827'
                  }}
                >
                  <div style={{ padding: '6px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <Sparkles size={18} color="#EA580C" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Concept Studio</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Prepare concept preview for review</div>
                  </div>
                </Link>

                <Link
                  href="/pitch"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    textDecoration: 'none',
                    color: '#111827'
                  }}
                >
                  <div style={{ padding: '6px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <ShieldCheck size={18} color="#DC2626" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pitch Access</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Investor paywall bypass</div>
                  </div>
                </Link>

                <Link
                  href="/bounties"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    textDecoration: 'none',
                    color: '#111827'
                  }}
                >
                  <div style={{ padding: '6px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <Briefcase size={18} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>R&amp;D Bounties</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Corporate challenges &amp; think tanks</div>
                  </div>
                </Link>

                <Link
                  href="/canvas"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    textDecoration: 'none',
                    color: '#111827'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Canvas</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Move through ideas by zooming into them</div>
                  </div>
                </Link>

                <Link
                  href="/roundup"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    textDecoration: 'none',
                    color: '#111827'
                  }}
                >
                  <div style={{ padding: '6px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <Coins size={18} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>IP Kiosk &amp; Monthly Pool</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Countertop stands &amp; grant lottery</div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowNotebookModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#1E3A8A'
                  }}
                >
                  <div style={{ padding: '6px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <BookOpen size={18} color="#1E3A8A" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Inventor Journal</div>
                    <div style={{ fontSize: '0.75rem', color: '#3B82F6' }}>&ldquo;i th.ink there for i am&rdquo; · 2015 Lore</div>
                  </div>
                </button>
              </div>

              {/* Bottom Quick Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderTop: '1px solid #F3F4F6',
                paddingTop: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#6B7280'
                }}>
                  <ShieldCheck size={14} color="#10B981" />
                  <span>Controlled Disclosure Active · Private drafts stay unlisted</span>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="button-primary"
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}
                >
                  <Plus size={15} />
                  New Twin
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Create Twin Modal */}
      {showCreateModal && (
        <CreateTwinModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17, 24, 39, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                padding: '4px'
              }}
              aria-label="Close Profile Modal"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                display: 'grid',
                placeItems: 'center'
              }}>
                <User size={22} color="#374151" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Inventor Session</h3>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Local Token Authentication</div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.55, margin: '0 0 1.25rem' }}>
              Your private twins are authenticated via per-twin owner tokens (<code style={{ fontFamily: 'var(--font-mono)', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>x-twin-owner-token</code>). No personal data is stored publicly.
            </p>

            <div style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <ShieldCheck size={16} color="#059669" />
              <span style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 600 }}>
                Owner token isolation verified
              </span>
            </div>

            <button
              onClick={() => {
                setShowProfileModal(false);
                setShowNotebookModal(true);
              }}
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '10px',
                padding: '0.65rem 1rem',
                color: '#1E3A8A',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                marginBottom: '1rem',
                cursor: 'pointer'
              }}
            >
              <Feather size={14} />
              <span>Read Albuquerque 2015 Inventor Journal</span>
            </button>

            <button
              onClick={() => setShowProfileModal(false)}
              className="button-primary"
              style={{ width: '100%', borderRadius: '10px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Inventor Laboratory Notebook Easter Egg Modal */}
      <InventorNotebookModal
        isOpen={showNotebookModal}
        onClose={() => setShowNotebookModal(false)}
      />
    </>
  );
}
