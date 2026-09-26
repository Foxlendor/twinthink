'use client';

import React, { useState } from 'react';
import { TwinData } from '@/lib/types';
import { GitFork, ArrowDown, Sparkles, Sliders, Play, ArrowRight, Lightbulb } from 'lucide-react';
import styles from './Tabs.module.css';
import { getLocalTwin } from '@/lib/twinsData';
import ForkModal from '../ForkModal';

interface LineageTabProps {
  twin: TwinData;
}

export default function LineageTab({ twin }: LineageTabProps) {
  const [simulated, setSimulated] = useState<boolean>(false);
  const [showForkModal, setShowForkModal] = useState<boolean>(false);
  
  // Create state for dynamic properties based on the current twin
  const numericProps = twin.current_version.properties.filter(p => p.type === 'number');
  
  // Simple state dictionary for the sliders
  const [mutatedValues, setMutatedValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    numericProps.forEach(p => {
      init[p.key] = p.value as number;
    });
    return init;
  });

  const handleSliderChange = (key: string, val: number) => {
    setMutatedValues(prev => ({ ...prev, [key]: val }));
    setSimulated(true);
  };

  // Fetch parent and descendants for DAG visualization
  const parentTwin = twin.lineage.parent && typeof twin.lineage.parent === 'string' 
    ? getLocalTwin(twin.lineage.parent) 
    : null;
    
  const descendantTwins = twin.lineage.descendants
    .map(id => getLocalTwin(id))
    .filter(t => t !== null) as TwinData[];

  return (
    <div className={styles.tabContent}>
      
      {/* TwizzFizz Tutorial Banner (Only show on ReSip #0001) */}
      {twin.id === '0001' && (
        <div style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          border: '1px solid #2563EB',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem',
          color: '#FFFFFF',
          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Lightbulb size={20} color="#FCD34D" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Lineage Tutorial: The "TwizzFizz" Mutation
            </span>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#BFDBFE', lineHeight: 1.6 }}>
            Did you know that <strong>Twin #0003 (TwizzFizz)</strong> was born directly from this thermal straw? 
            An inventor clicked <strong>Fork</strong> below, swapped the <em>Thermal Phase-Change</em> payload for a <em>Pressurized Gas Widget</em>, and evolved the invention into the <strong>Fluid Dynamics</strong> domain to create on-demand carbonation. 
            <br/><br/>
            Check out the <strong>Descendants</strong> in the DAG tree below to see the resulting child Twin!
          </p>
        </div>
      )}

      {/* Concept Lineage Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <GitFork size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            IDEATION LINEAGE & FORK ENGINE
          </span>
        </div>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
          Where Did This Idea Come From, and What Can It Become?
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Every twin records its genetic lineage. Fork this baseline to mutate physical parameters, run simulations on the new physics matrix, and produce a child revision.
        </p>
      </div>

      {/* Dynamic Lineage Tree Visualization (DAG) */}
      <div className={styles.section} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0' }}>
        
        {/* Parent Node (if exists) */}
        {parentTwin && (
          <>
            <a href={`/twins/${parentTwin.id}?tab=lineage`} style={{ textDecoration: 'none', width: '100%', maxWidth: '420px' }}>
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.875rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PARENT ANCESTOR ({parentTwin.domain})</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{parentTwin.current_version.title}</div>
              </div>
            </a>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.75rem 0' }}>
              <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
              <div style={{
                padding: '0.35rem 0.8rem',
                background: 'rgba(0, 102, 255, 0.1)',
                border: '1px dashed var(--accent-primary)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)'
              }}>
                + DOMAIN MUTATION APPLIED
              </div>
              <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
              <ArrowDown size={14} color="var(--text-muted)" style={{ marginTop: '-4px' }} />
            </div>
          </>
        )}

        {/* Concept Ancestor Fallback (if no parent) */}
        {!parentTwin && twin.id === '0001' && (
          <>
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.875rem 1.5rem',
              textAlign: 'center',
              maxWidth: '420px',
              width: '100%'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CONCEPT ANCESTOR (Alpha)</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Phase Change Beverage Reheating Calorimeter</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Benchtop glass rig with supersaturated sodium acetate core</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.75rem 0' }}>
              <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
              <div style={{
                padding: '0.35rem 0.8rem',
                background: 'rgba(0, 102, 255, 0.1)',
                border: '1px dashed var(--accent-primary)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)'
              }}>
                + INVENTIONS JOURNAL MUTATION (2021)
              </div>
              <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
              <ArrowDown size={14} color="var(--text-muted)" style={{ marginTop: '-4px' }} />
            </div>
          </>
        )}

        {/* Current Canonical Twin Node */}
        <div style={{
          background: '#F0FDF4',
          border: '2px solid #10B981',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 2rem',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', letterSpacing: '0.5px' }}>CURRENT CANONICAL SPECIMEN</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {twin.current_version.title}, Twin #{twin.id}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {twin.domain} • Status: {twin.status}
          </div>
        </div>

        {/* Descendants (Children) */}
        {descendantTwins.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.75rem', width: '100%' }}>
            <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
            <ArrowDown size={14} color="var(--text-muted)" style={{ marginTop: '-4px', marginBottom: '1rem' }} />
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {descendantTwins.map(desc => (
                <a key={desc.id} href={`/twins/${desc.id}?tab=lineage`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    minWidth: '220px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'transform 0.1s ease'
                  }} className="hover:scale-105">
                    <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.5px' }}>DESCENDANT (FORK)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{desc.current_version.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#3B82F6', marginTop: '0.3rem', fontWeight: 600 }}>{desc.domain}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Fork & Parameter Mutation Simulator */}
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fork & Re-Simulate Mutation Engine
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Evaluate parameter mutations before generating a child Twin
            </span>
          </div>

          <button
            onClick={() => setShowForkModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <GitFork size={14} fill="#FFFFFF" />
            Branch & Fork Twin
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          {/* Dynamic Sliders based on Properties */}
          <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {numericProps.map((prop, i) => {
              const val = mutatedValues[prop.key];
              const baseline = prop.value as number;
              // Simple arbitrary min/max for the simulator
              const min = baseline * 0.2;
              const max = baseline * 3.0;
              const step = baseline > 10 ? 1 : 0.1;

              return (
                <div key={prop.key} style={{ marginBottom: i === numericProps.length - 1 ? 0 : '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{prop.label}</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                      {Number(val).toFixed(2)} {prop.unit}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={val}
                    onChange={(e) => handleSliderChange(prop.key, Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                    <span>{min.toFixed(1)} (Min)</span>
                    <span>{baseline.toFixed(1)} (Base)</span>
                    <span>{max.toFixed(1)} (Max)</span>
                  </div>
                </div>
              );
            })}
            {numericProps.length === 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                No numeric parameters available to mutate on this twin.
              </div>
            )}
          </div>

          {/* Mutation Impact Radar */}
          <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Projected Genetic Deltas vs Baseline
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {numericProps.slice(0, 3).map(prop => {
                  const baseline = prop.value as number;
                  const mutated = mutatedValues[prop.key];
                  const delta = baseline === 0 ? 0 : ((mutated - baseline) / baseline * 100).toFixed(1);
                  const isPositive = Number(delta) >= 0;
                  
                  return (
                    <div key={`delta-${prop.key}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{prop.label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{mutated.toFixed(2)} {prop.unit}</strong>
                        <span style={{ fontSize: '0.7rem', color: isPositive ? '#059669' : '#DC2626', marginLeft: '0.4rem' }}>
                          ({isPositive ? `+${delta}` : delta}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: '#111827', fontWeight: 700, marginBottom: '0.2rem' }}>
                READY TO SPAWN CHILD REVISION
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                This mutation can be packaged into a standalone twin bundle preserving ancestor provenance.
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* The Fork Modal */}
      {showForkModal && (
        <ForkModal 
          parentTwin={twin} 
          mutatedValues={mutatedValues} 
          onClose={() => setShowForkModal(false)} 
        />
      )}
    </div>
  );
}
