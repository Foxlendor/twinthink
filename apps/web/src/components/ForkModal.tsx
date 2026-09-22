'use client';

import React, { useState } from 'react';
import { X, GitFork, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { TwinData } from '@/lib/types';
import InventorTip from './InventorTip';

interface ForkModalProps {
  parentTwin: TwinData;
  mutatedValues: Record<string, number>;
  onClose: () => void;
}

const DOMAINS = ['Thermal Systems', 'Fluid Dynamics', 'Mechanisms', 'Haptics', 'Aerospace'];

export default function ForkModal({ parentTwin, mutatedValues, onClose }: ForkModalProps) {
  const [title, setTitle] = useState(`${parentTwin.current_version.title} (Fork)`);
  const [summary, setSummary] = useState('');
  const [domain, setDomain] = useState(parentTwin.domain);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request to fork
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Close modal after success animation
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 3500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(17, 24, 39, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        
        {isSuccess ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '80px', height: '80px', 
                borderRadius: '50%', background: '#D1FAE5',
                display: 'grid', placeItems: 'center'
              }}>
                <CheckCircle2 size={40} color="#059669" />
              </div>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Fork Successful!
            </h2>
            <p style={{ margin: '0', color: '#6B7280' }}>
              Your genetic mutation has been recorded and a new descendant Twin has been branched.
            </p>
          </div>
        ) : isSubmitting ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Loader2 size={48} className="animate-spin" color="#2563EB" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Forging New Twin...
            </h2>
            <p style={{ margin: '0 0 2rem 0', color: '#6B7280' }}>
              Calculating parameter deltas and updating genetic lineage graph.
            </p>
            <InventorTip style={{ textAlign: 'left' }} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#DBEAFE', padding: '0.4rem', borderRadius: '8px' }}>
                  <GitFork size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                    Branch & Fork Twin
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.1rem' }}>
                    Spawning descendant from #{parentTwin.id}
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                  New Twin Title
                </label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                  Physics Domain Shift
                </label>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                  If your mutation shifts the invention into a new category of physics, change the domain below to assign the proper simulation engine.
                </div>
                <select 
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                    background: '#FFFFFF'
                  }}
                >
                  {DOMAINS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {domain !== parentTwin.domain && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '0.75rem', color: '#B45309' }}>
                    <span>Domain Shift Detected:</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      {parentTwin.domain} <ArrowRight size={12} /> {domain}
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                  Mutation Summary
                </label>
                <textarea 
                  required
                  rows={3}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Describe why you are branching this twin and what the new parameters aim to achieve..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                  Inherited & Mutated Parameters
                </label>
                <div style={{ 
                  background: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem'
                }}>
                  {Object.entries(mutatedValues).map(([key, value]) => {
                    const origProp = parentTwin.current_version.properties.find(p => p.key === key);
                    const isMutated = origProp && origProp.value !== value;
                    
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px dashed #D1D5DB', paddingBottom: '0.4rem' }}>
                        <span style={{ color: '#6B7280' }}>{origProp?.label || key}</span>
                        <strong style={{ color: isMutated ? '#059669' : '#111827', fontFamily: 'var(--font-mono)' }}>
                          {Number(value).toFixed(2)} {origProp?.unit || ''}
                        </strong>
                      </div>
                    );
                  })}
                  {Object.keys(mutatedValues).length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', gridColumn: '1 / -1' }}>
                      No numeric parameters included in this fork.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer / Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    background: 'transparent',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Forging Branch...
                    </>
                  ) : (
                    'Submit Fork & Branch'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
}
