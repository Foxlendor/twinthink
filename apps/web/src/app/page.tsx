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
  CheckCircle,
  Sparkles,
  Lightbulb,
  Check,
  Lock,
  Mail
} from 'lucide-react';
import CreateTwinModal from '@/components/CreateTwinModal';

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

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

      {/* 3. The Simplicity of Value: A Priori Ideas & Soon to Come */}
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
            background: 'rgba(17, 24, 39, 0.05)',
            border: '1px solid #E5E7EB',
            borderRadius: '100px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <Lightbulb size={13} color="#111827" />
            A Priori Ideas
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
            fontWeight: 800,
            letterSpacing: '-0.75px',
            lineHeight: 1.2,
            color: '#111827',
            marginBottom: '1rem'
          }}>
            The Simplicity of Value: Ideas Conceived from First Principles
          </h2>
          <p style={{
            fontSize: '1.0625rem',
            color: '#4B5563',
            lineHeight: 1.65,
            margin: 0
          }}>
            Great inventions do not need buzzwords to prove their worth. Before factories, tooling, or bureaucracy, an idea holds genuine intrinsic value when it solves a real problem from first principles. TwinThink gives original concepts a clear, permanent, and tangible reality that anyone can understand.
          </p>
        </div>

        {/* 3 Grounded Pillars Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
                <Lightbulb size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
                1. First Principles (A Priori)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                When an idea solves a genuine physical problem by first principles, that conceptual design holds immediate, standalone value—before mass production ever begins.
              </p>
            </div>
            <Link
              href="/twins/0001?tab=object"
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
              Inspect Concept & Intent <ChevronRight size={13} />
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
                color: '#111827'
              }}>
                <Layers size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
                2. Tangible Grounding
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                No artificial jargon. Plainly detail what the product is made of, how the physical mechanics function, what parts cost, and how it performs in practice.
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
              Review Practical BOM <ChevronRight size={13} />
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
                color: '#111827'
              }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
                3. Permanent Authorship
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                Connect earliest notebook sketches and physical prototypes into a tamper-evident record. You get clear proof of originality without confusion.
              </p>
            </div>
            <Link
              href="/twins/0001?tab=history"
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
              Explore Provenance <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Real-World Clarity vs Buzzword Jargon Comparison */}
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '2rem',
          color: '#111827'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '0.4rem' }}>
            Why Simplicity Beats Industry Buzzwords
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem', maxWidth: '680px', lineHeight: 1.5 }}>
            Too many physical products get buried under speculative tech buzzwords or scattered across unreadable CAD plugins. TwinThink brings clean, unmistakable clarity to what you have created.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E11D48', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                ✕ The Buzzword Trap
              </div>
              <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.8, margin: 0 }}>
                <li>Overcomplicated jargon that leaves friends, buyers, and investors confused.</li>
                <li>CAD models trapped behind proprietary software licenses.</li>
                <li>BOM costs and supplier links scattered across unsaved spreadsheets.</li>
                <li>Ambiguous notes that fail to prove who originated the idea.</li>
              </ul>
            </div>

            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                ✓ The TwinThink Standard
              </div>
              <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.8, margin: 0 }}>
                <li>Simple, plain-English explanation anyone can grasp in 60 seconds.</li>
                <li>Transparent Bill of Materials with verified unit costs and part specs.</li>
                <li>Clear physical mechanics and test records directly linked to the design.</li>
                <li>Timestamped proof of invention from first sketch to working prototype.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Soon to Come Callout & Waitlist */}
        <div style={{
          marginTop: '3rem',
          background: '#111827',
          borderRadius: '16px',
          padding: '2.5rem',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '100px',
            padding: '0.3rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#34D399',
            marginBottom: '1.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
            Soon to Come
          </div>

          <h3 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            marginBottom: '0.75rem',
            lineHeight: 1.2
          }}>
            TwinThink is opening soon for creators and inventors.
          </h3>

          <p style={{
            fontSize: '0.9375rem',
            color: '#9CA3AF',
            maxWidth: '620px',
            lineHeight: 1.6,
            marginBottom: '2rem'
          }}>
            We are preparing early access for independent builders, engineers, and product creators who want a simple, credible way to record, value, and share their physical inventions. Join the preview waitlist below.
          </p>

          {/* Email Waitlist Form */}
          {waitlistSubmitted ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              borderRadius: '10px',
              padding: '0.85rem 1.25rem',
              color: '#34D399',
              fontSize: '0.9375rem',
              fontWeight: 600
            }}>
              <Check size={18} />
              You&apos;re on the list. We&apos;ll notify you when early access opens.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (waitlistEmail.trim()) {
                  setWaitlistSubmitted(true);
                }
              }}
              style={{
                display: 'flex',
                gap: '0.75rem',
                maxWidth: '480px',
                flexWrap: 'wrap'
              }}
            >
              <input
                type="email"
                required
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '0.85rem 1.15rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#FFFFFF',
                  color: '#111827',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                Join Waitlist
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Feature Highlights Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginTop: '2.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F9FAFB', marginBottom: '0.35rem' }}>
                Instant Idea Packaging
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                Drop in sketches, notes, and photos to create a clean, structured record of your idea.
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F9FAFB', marginBottom: '0.35rem' }}>
                Grounded Valuation
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                Clear bill-of-materials and practical unit costing that buyers and partners can trust.
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F9FAFB', marginBottom: '0.35rem' }}>
                Verifiable Authorship
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                Permanent, timestamped proof of your original invention without bureaucratic drag.
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 4. Six Reality Dimensions / Anatomy of an Idea */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.4rem 0' }}>
          Explore the Anatomy of an Idea
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 1.25rem 0' }}>
          Click any dimension below to inspect how Twin #0001 (Resip™) breaks down from initial concept to physical reality.
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

