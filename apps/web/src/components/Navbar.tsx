'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Menu, X, Moon, Sun, Plus, ShieldCheck, Sparkles, FolderArchive, Compass, Coffee, BookOpen, Feather, Briefcase, Coins } from 'lucide-react';
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

  // day or night, shared with the Canvas's own night switch
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // read what the pre-paint script already chose
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);
  const toggleDark = () => {
    const on = !dark;
    setDark(on);
    if (on) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.setItem('twinthink.night.v1', on ? '1' : '0');
    } catch {
      // optional
    }
  };

  // The Canvas is an immersive medium with its own quiet chrome.
  if (pathname?.startsWith('/canvas')) return null;

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--header-bg)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
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
                color: 'var(--text-primary)' 
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
                background: pathname === '/bounties' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
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
                color: 'var(--text-secondary)',
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
              href="/support"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontStyle: 'italic',
              }}
            >
              Support
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>
              <button
                type="button"
                onClick={toggleDark}
                aria-label={dark ? 'Switch to day' : 'Switch to night'}
                title={dark ? 'Day' : 'Night'}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button 
                style={{ 
                  background: 'none', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer', 
                  color: 'var(--text-secondary)' 
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
                  background: mobileMenuOpen ? 'var(--bg-tertiary)' : 'none', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer', 
                  color: 'var(--text-primary)',
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
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-subtle)',
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
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <Compass size={18} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Explore Records</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Concept previews & verified models</div>
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
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <FolderArchive size={18} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Public Archive</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curated public invention records</div>
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
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <Sparkles size={18} color="#EA580C" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Concept Studio</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prepare concept preview for review</div>
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
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <ShieldCheck size={18} color="#DC2626" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pitch Access</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Investor paywall bypass</div>
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
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <Briefcase size={18} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>R&amp;D Bounties</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Corporate challenges &amp; think tanks</div>
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
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Canvas</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Move through ideas by zooming into them</div>
                  </div>
                </Link>

                <Link
                  href="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Support</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Help keep TwinThink running</div>
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
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <Coins size={18} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>IP Kiosk &amp; Monthly Pool</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Countertop stands &amp; grant lottery</div>
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
                  <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
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
                borderTop: '1px solid var(--bg-tertiary)',
                paddingTop: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
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
            background: 'var(--bg-secondary)',
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
                color: 'var(--text-muted)',
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
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                display: 'grid',
                placeItems: 'center'
              }}>
                <User size={22} color="#374151" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Inventor Session</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Local Token Authentication</div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 1.25rem' }}>
              Your private twins are authenticated via per-twin owner tokens (<code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>x-twin-owner-token</code>). No personal data is stored publicly.
            </p>

            <div style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-subtle)',
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
