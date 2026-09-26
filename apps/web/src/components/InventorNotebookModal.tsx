'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Stamp, 
  ShieldCheck, 
  Feather,
  Clock,
  Layers,
  Award
} from 'lucide-react';

interface InventorNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventorNotebookModal({ isOpen, onClose }: InventorNotebookModalProps) {
  const [stamped, setStamped] = useState(false);
  const [stampTime, setStampTime] = useState<string>('');
  const [stampSoundActive, setStampSoundActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStampTime(new Date().toLocaleString());
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStamp = () => {
    setStamped(true);
    setStampTime(new Date().toLocaleString());
    setStampSoundActive(true);
    setTimeout(() => setStampSoundActive(false), 500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFDF9',
          backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          border: '2px solid #1E3A8A',
          borderRadius: '20px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(30, 58, 138, 0.15)',
          position: 'relative',
          color: '#1E293B',
          fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: '#475569',
            transition: 'background 0.2s'
          }}
          aria-label="Close Notebook"
        >
          <X size={18} />
        </button>

        {/* Notebook Header Stamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1.25rem' }}>
          <div style={{
            background: '#1E3A8A',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#1E3A8A',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Feather size={13} />
              AUTHENTIC INVENTOR LOGBOOK · ARCHIVE NO. 2015-01
            </div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              The Albuquerque Benchtop Journal
            </h2>
          </div>
        </div>

        {/* Famous Motto Callout */}
        <div style={{
          background: 'rgba(30, 58, 138, 0.05)',
          borderLeft: '4px solid #1E3A8A',
          padding: '1rem 1.25rem',
          borderRadius: '0 12px 12px 0',
          marginBottom: '1.75rem',
          fontStyle: 'italic',
          color: '#1E3A8A',
          fontSize: '1.1rem',
          fontWeight: 600,
          lineHeight: 1.5
        }}>
          &ldquo;i th.ink there for i am?&rdquo;
          <span style={{ display: 'block', fontStyle: 'normal', fontSize: '0.78rem', color: '#64748B', marginTop: '0.35rem', fontWeight: 500 }}>
            johne.boi (JB), Creator &amp; Founder · Signed in permanent ink
          </span>
        </div>

        {/* Journal Entries */}
        <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '2rem' }}>
          
          {/* Entry 0: The Origin */}
          <div style={{ background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Entry 00: What Would You Invent?
              </span>
              <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                Origin Lore
              </span>
            </div>
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.9rem', lineHeight: 1.6, color: '#1E293B', fontStyle: 'italic' }}>
              &ldquo;I always hated it as a kid when people would ask, &lsquo;What do you want to be when you grow up?&rsquo; and I&rsquo;d say, &lsquo;I want to be an inventor.&rsquo; And then immediately they&rsquo;d go, &lsquo;Oh yeah? What would you invent?&rsquo;
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: '#334155' }}>
              And I&rsquo;d think: Well, first of all, <strong>why would I tell you?</strong> Second of all, I don&rsquo;t really know yet. And third of all, I&rsquo;m just wanting to make an idea, and I don&rsquo;t even care if I get credit for it most of the time. If I have a good idea, <strong>I want to see it exist. I don&rsquo;t just want to look at it in my head.</strong> You feel me?&rdquo;
            </p>
          </div>

          {/* Entry 1 */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rule 01: Physical Chronological Discipline
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                Sept 2015 · Albuquerque, NM
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: '#334155' }}>
              As a kid in 2015, I learned to sign, date, and timestamp every single notebook page before turning off the benchtop light. An idea in your head has zero legal custody. A bound journal with unalterable ink is where true intellectual property begins. TwinThink carries this exact discipline into cryptographically signed digital twins.
            </p>
          </div>

          {/* Entry 2 */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Physics Note: 2-Liter Headspace Carbonation
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                Henry's Gas Law
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: '#334155' }}>
              Soda bottles go flat because empty headspace invites dissolved CO2 to vaporize into the void. Adding motorized compressors or expensive specialized caps is overcomplicated. Using the PET bottle itself as a sliding piston (TWIIZZLock™) mechanically collapses the headspace down to zero. Simple mechanics, zero power consumption.
            </p>
          </div>

          {/* Entry 3 */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Thermodynamic Law: Latent Heat Over Batteries
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                Phase Change Kinetics
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: '#334155' }}>
              Batteries degrade, short circuit, and end up in landfills. Sodium acetate trihydrate releases 12.05 kJ of latent crystallization heat at exactly 54°C without a single wire or microchip. Real innovation is mastering the materials of the Earth to produce clean, reusable thermodynamic action.
            </p>
          </div>

        </div>

        {/* Interactive Ink Stamp Area */}
        <div style={{
          background: stamped ? '#EFF6FF' : '#F8FAFC',
          border: stamped ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}>
          {stamped ? (
            <div style={{ animation: 'stampIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid #1E3A8A',
                color: '#1E3A8A',
                marginBottom: '0.75rem',
                transform: 'rotate(-8deg)',
                boxShadow: 'inset 0 0 10px rgba(30, 58, 138, 0.2)'
              }}>
                <Award size={32} />
              </div>
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#1E3A8A',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                ✓ WITNESSED &amp; DATED: {stampTime}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#3B82F6', marginTop: '0.25rem', fontWeight: 600 }}>
                Signed by Creator: did:twin:johne.boi · Albuquerque R&amp;D
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '0.75rem', color: '#64748B' }}>
                <Stamp size={28} style={{ margin: '0 auto 0.5rem', display: 'block', color: '#2563EB' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Leave your visitor ink stamp on this 2015-2026 invention journal
                </span>
              </div>
              <button
                onClick={handleStamp}
                style={{
                  background: '#1E3A8A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Stamp size={16} />
                <span>Stamp Witness Seal in Ink</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: '#94A3B8',
          borderTop: '1px solid #E2E8F0',
          paddingTop: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span>TwinThink Protocol Easter Egg · Press [ESC] or click background to close</span>
          <span style={{ fontWeight: 600, color: '#64748B' }}>
            Shortcut: Click logo 3x or press 'T' on keyboard
          </span>
        </div>

      </div>
    </div>
  );
}
