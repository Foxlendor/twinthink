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

      {/* 3. Six Reality Protocol Navigation Cards */}
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
