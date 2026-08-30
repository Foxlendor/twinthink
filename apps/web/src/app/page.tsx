import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Box, Activity, ShieldCheck, Clock, GitFork, Award, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const realityProtocol = [
    { step: '01', question: 'WHAT IS IT?', tab: 'OBJECT', desc: 'Authoritative 3D CAD mesh, executive identity, and derived reality state scores.' },
    { step: '02', question: 'WHAT IS IT MADE OF?', tab: 'STRUCTURE', desc: 'Production-ready $4.50 BOM, material specs, annular dimensions, and STEP geometry.' },
    { step: '03', question: 'HOW DOES IT WORK?', tab: 'BEHAVIOR', desc: 'Multi-node thermodynamic ODE simulation, real-time heat flux schema, and draw pulses.' },
    { step: '04', question: 'WHAT PROVES IT?', tab: 'EVIDENCE', desc: 'Physical thermocouple bench telemetry, drag-and-drop CSV ingestion, and automated RMSE.' },
    { step: '05', question: 'WHERE DID IT COME FROM?', tab: 'HISTORY', desc: '10-year evolutionary archive: 2016 Science Fair tests, 2021 drawings, and lab workbench.' },
    { step: '06', question: 'WHAT CAN IT BECOME?', tab: 'LINEAGE', desc: 'Genetic mutation fork engine to simulate physical deltas and spawn child revisions.' },
  ];

  return (
    <main className="container" style={{ padding: '3rem 1.5rem 6rem 1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(0, 102, 255, 0.1)',
          border: '1px solid rgba(0, 102, 255, 0.3)',
          padding: '0.35rem 0.85rem',
          borderRadius: '100px',
          fontSize: '0.8125rem',
          color: 'var(--accent-primary)',
          fontWeight: 700,
          letterSpacing: '0.5px',
          marginBottom: '1.25rem'
        }}>
          <Sparkles size={14} />
          IDEA REALITY ENGINE
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
          fontWeight: 900,
          letterSpacing: '-1.5px',
          lineHeight: 1.08,
          margin: '0 0 1rem 0',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #A0AEC0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Give an idea a reality.
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '680px',
          margin: '0 auto 2rem auto',
          lineHeight: 1.6
        }}>
          TwinThink transforms physical inventions, thermodynamic concepts, and experimental hardware into living, evidence-backed digital twins.
        </p>

        {/* Primary CTA: Specimen #0001 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/twins/0001"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #00e5a3 100%)',
              color: '#000',
              padding: '0.9rem 2rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(0, 102, 255, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            Explore Canonical Twin #0001 (RESIP™)
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Featured Specimen Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #131824 100%)',
        border: '1px solid #252e42',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '4rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Award size={16} color="#00e5a3" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00e5a3', fontFamily: 'var(--font-mono)' }}>
                THE SPECIMEN THAT PROVES THE SYSTEM
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>
              RESIP™ — Self-Heating Drink Straw (Outdoor Edition)
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
              Twin #0001 / Living Engineering Record
            </div>
          </div>

          <Link
            href="/twins/0001"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            Launch Twin Viewer
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Quick Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1f293d' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activation Plateau</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>54.0 °C</div>
            <div style={{ fontSize: '0.7rem', color: '#a64dff', marginTop: '0.2rem' }}>NIST Trihydrate Equilibrium</div>
          </div>

          <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1f293d' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enthalpy Release</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>12.05 kJ</div>
            <div style={{ fontSize: '0.7rem', color: '#00e5a3', marginTop: '0.2rem' }}>Calibrated ODE Simulation</div>
          </div>

          <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1f293d' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Unit COGS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>$4.50 USD</div>
            <div style={{ fontSize: '0.7rem', color: '#00ccff', marginTop: '0.2rem' }}>Off-the-shelf 316L Core</div>
          </div>

          <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1f293d' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Historical Lineage</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>2016 → 2026</div>
            <div style={{ fontSize: '0.7rem', color: '#ffaa00', marginTop: '0.2rem' }}>72 Verified Lab Artifacts</div>
          </div>
        </div>
      </div>

      {/* The 6-Question Reality Protocol */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            THE PROTOCOL
          </span>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem 0', fontWeight: 800 }}>
            The 6 Dimensions of a Living Digital Twin
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
            A digital twin is not a 3D animation. It is a structured graph of claims, physical laws, and empirical evidence.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {realityProtocol.map((p) => (
            <div
              key={p.step}
              style={{
                background: '#0d1117',
                border: '1px solid #1f293d',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.2)', fontFamily: 'var(--font-mono)' }}>
                  {p.step}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(0, 102, 255, 0.1)',
                  color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  TAB: {p.tab}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
                {p.question}
              </h3>
              
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Epistemic Transparency Manifesto */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 163, 0.08) 0%, rgba(0, 102, 255, 0.05) 100%)',
        border: '1px solid rgba(0, 229, 163, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <ShieldCheck size={32} color="#00e5a3" style={{ margin: '0 auto 0.75rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
          Transparency Is the Product
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
          TwinThink enforces strict epistemic boundaries: every property explicitly distinguishes what is <strong style={{ color: '#a64dff' }}>LITERATURE</strong>, <strong style={{ color: '#00ccff' }}>MEASURED</strong>, <strong style={{ color: '#00e5a3' }}>CALIBRATED</strong>, or <strong style={{ color: '#ffaa00' }}>ESTIMATED</strong>.
        </p>
        <Link
          href="/twins/0001"
          style={{
            background: '#00e5a3',
            color: '#000',
            padding: '0.65rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Open Twin #0001 Reality Station
          <ArrowRight size={16} />
        </Link>
      </div>

    </main>
  );
}
