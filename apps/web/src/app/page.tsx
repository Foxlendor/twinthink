'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Box, 
  Layers, 
  Activity, 
  FileText, 
  Clock, 
  GitFork, 
  ArrowRight, 
  ChevronRight, 
  Calendar,
  Layers2,
  FileCode,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import CreateTwinModal from '@/components/CreateTwinModal';

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const realityCards = [
    {
      id: 'object',
      title: 'Object',
      question: 'What is it?',
      icon: Box,
      href: '/twins/0001?tab=object'
    },
    {
      id: 'structure',
      title: 'Structure',
      question: 'What is it made of?',
      icon: Layers,
      href: '/twins/0001?tab=structure'
    },
    {
      id: 'behavior',
      title: 'Behavior',
      question: 'What does it do?',
      icon: Activity,
      href: '/twins/0001?tab=behavior'
    },
    {
      id: 'evidence',
      title: 'Evidence',
      question: 'What supports it?',
      icon: FileText,
      href: '/twins/0001?tab=evidence'
    },
    {
      id: 'history',
      title: 'History',
      question: 'How did it become this?',
      icon: Clock,
      href: '/twins/0001?tab=history'
    },
    {
      id: 'lineage',
      title: 'Lineage',
      question: 'Where did it come from, and where can it go?',
      icon: GitFork,
      href: '/twins/0001?tab=lineage'
    }
  ];

  return (
    <main className="container" style={{ padding: '4rem 1.5rem 6rem 1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* 1. Hero Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        alignItems: 'center',
        gap: '3rem',
        marginBottom: '5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(2.75rem, 5vw, 3.85rem)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.08,
            color: '#111827',
            marginBottom: '1.25rem'
          }}>
            Give an idea<br />a reality.
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: '#4B5563',
            lineHeight: 1.6,
            maxWidth: '460px',
            marginBottom: '2rem'
          }}>
            A living digital record for things people imagine, build, and test.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem' }}>
            <Link
              href="/twins/0001"
              className="button-primary"
              style={{ padding: '0.85rem 1.75rem', borderRadius: '100px', fontSize: '0.9375rem' }}
            >
              Explore
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="button-secondary"
              style={{ padding: '0.85rem 1.75rem', borderRadius: '100px', fontSize: '0.9375rem' }}
            >
              Create Twin
            </button>
          </div>

          <Link
            href="/twins/0001"
            style={{
              fontSize: '0.875rem',
              color: '#374151',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none'
            }}
          >
            Learn more about TwinThink
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Hero Product Render */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            height: '420px',
            position: 'relative'
          }}>
            <img
              src="/resip_straw_hero.jpg"
              alt="RESIP™ Thermal Straw Prototype"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.06))'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Featured Twin Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '2.25rem',
        marginBottom: '4rem',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          
          {/* Left Column: Specimen Identity */}
          <div>
            <div style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              marginBottom: '0.75rem'
            }}>
              FEATURED TWIN
            </div>

            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 0.25rem 0',
              letterSpacing: '-0.5px'
            }}>
              RESIP™
            </h2>

            <div style={{
              fontSize: '1rem',
              color: '#4B5563',
              marginBottom: '0.75rem'
            }}>
              Thermal Drink Straw
            </div>

            <div style={{
              display: 'inline-block',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '100px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#374151',
              fontFamily: 'var(--font-mono)',
              marginBottom: '1.25rem'
            }}>
              Twin #0001
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: '#6B7280',
              lineHeight: 1.5,
              margin: '0 0 1.5rem 0'
            }}>
              A reusable self-heating drink straw using sodium acetate phase change activation.
            </p>

            <Link
              href="/twins/0001"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#111827',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              Explore Twin
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Middle Column: Product Visual */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '240px',
            background: '#F9FAFB',
            borderRadius: '12px',
            padding: '1rem',
            overflow: 'hidden'
          }}>
            <img
              src="/resip_straw_hero.jpg"
              alt="RESIP™ Preview"
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Right Column: Quiet Metadata Rows */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={15} color="#9CA3AF" />
                Created
              </span>
              <strong style={{ color: '#111827', fontFamily: 'var(--font-mono)' }}>2026-08-30</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={15} color="#9CA3AF" />
                Status
              </span>
              <strong style={{ color: '#111827' }}>Experimental</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode size={15} color="#9CA3AF" />
                Files
              </span>
              <strong style={{ color: '#111827', fontFamily: 'var(--font-mono)' }}>37</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers2 size={15} color="#9CA3AF" />
                Components
              </span>
              <strong style={{ color: '#111827', fontFamily: 'var(--font-mono)' }}>9</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={15} color="#9CA3AF" />
                Claims
              </span>
              <strong style={{ color: '#111827', fontFamily: 'var(--font-mono)' }}>37</strong>
            </div>
          </div>

        </div>
      </div>

      {/* 3. What is a Digital Twin? - Interactive Educational Guide */}
      <section style={{
        marginTop: '4rem',
        marginBottom: '4.5rem',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '20px',
        padding: '3rem 2.25rem',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ maxWidth: '780px', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '100px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#059669',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            The Living Digital Twin Protocol
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
            fontWeight: 800,
            letterSpacing: '-0.75px',
            lineHeight: 1.2,
            color: '#111827',
            marginBottom: '1rem'
          }}>
            What is a Physical Digital Twin?
          </h2>
          <p style={{
            fontSize: '1.0625rem',
            color: '#4B5563',
            lineHeight: 1.65,
            margin: 0
          }}>
            A digital twin is <strong>not merely a 3D picture or a CAD drawing</strong>. It is a computable, living software mirror of a physical product that brings together physical geometry, physics simulations, real sensor experiments, and cryptographic proof of invention.
          </p>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {/* Pillar 1 */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: '#111827'
              }}>
                <Layers size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
                1. Structural BOM & CAD
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                Hierarchical Bill of Materials (BOM) linking raw materials, manufacturing processes, unit costs ($4.50), and 3D STEP geometry.
              </p>
            </div>
            <Link
              href="/twins/0001?tab=structure"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#111827',
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              Inspect BOM Structure <ChevronRight size={13} />
            </Link>
          </div>

          {/* Pillar 2 */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: '#0284C7'
              }}>
                <Activity size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
                2. Differential Equations
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                Pure-Python ODE solvers modeling heat transfer, flow velocity, and latent phase-change release without expensive CAD plugins.
              </p>
            </div>
            <Link
              href="/twins/0001?tab=behavior"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#0284C7',
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              Run Thermal ODE <ChevronRight size={13} />
            </Link>
          </div>

          {/* Pillar 3 */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: '#059669'
              }}>
                <FileText size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
                3. Bench Sensor Telemetry
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                Actual micro-thermocouple test streams uploaded from physical test rigs. Continuously fits parameters and verifies RMSE precision.
              </p>
            </div>
            <Link
              href="/twins/0001?tab=evidence"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#059669',
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              View Test Runs <ChevronRight size={13} />
            </Link>
          </div>

          {/* Pillar 4 */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: '#D97706'
              }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
                4. Cryptographic Proof
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                Every revision is signed with creator Ed25519 keys, linking 2016 invention notebook scans to verified 2026 prototypes.
              </p>
            </div>
            <Link
              href="/twins/0001?tab=history"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#D97706',
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              Explore Provenance <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Interactive Comparison: Static CAD vs. Living Twin */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '14px',
          padding: '2rem',
          color: '#FFFFFF'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Why Digital Twins Outperform Static CAD Files & Paper Patents
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem', maxWidth: '680px' }}>
            Traditional engineering leaves critical data fragmented in isolated folders. TwinThink binds physical reality and computation into one portable, verifiable bundle.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ✕ The Fragmented Way
              </div>
              <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.8, margin: 0 }}>
                <li>CAD models are static geometric shapes with no embedded physics.</li>
                <li>Physical test data sits in unversioned spreadsheets on someone&apos;s laptop.</li>
                <li>BOM costs and supplier links diverge from 3D designs.</li>
                <li>Inventorship disputes rely on ambiguous dates and unverified emails.</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ✓ The TwinThink Living Twin
              </div>
              <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8125rem', color: '#F1F5F9', lineHeight: 1.8, margin: 0 }}>
                <li>Self-contained differential equation simulation engine inside the bundle.</li>
                <li>Real bench sensor telemetry continuously validates model accuracy (RMSE).</li>
                <li>3-level structural BOM with real unit costs ($4.50) and part weights.</li>
                <li>Ed25519 cryptographic signatures guarantee tamper-evident authorship.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Six Reality Protocol Navigation Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.4rem 0' }}>
          Explore the Six Reality Dimensions
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 1.25rem 0' }}>
          Click any dimension below to inspect how Twin #0001 (Resip™) answers the fundamental engineering questions.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        {realityCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              href={card.href}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.25rem',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '140px',
                transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#111827';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <Icon size={20} color="#111827" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem 0' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                  {card.question}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#9CA3AF', marginTop: '0.5rem' }}>
                <ChevronRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTwinModal onClose={() => setShowCreateModal(false)} />
      )}
    </main>
  );
}

