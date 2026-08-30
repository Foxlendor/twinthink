'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateTwinModal from '@/components/CreateTwinModal';

const realityLayers = [
  ['Object', 'What is it?', 'object'],
  ['Structure', 'What is it made of?', 'structure'],
  ['Behavior', 'What does it do?', 'behavior'],
  ['Evidence', 'What supports it?', 'evidence'],
  ['History', 'How did it become this?', 'history'],
  ['Lineage', 'Where did it come from?', 'lineage'],
] as const;

export default function HomePage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="home-shell">
      <header className="home-header">
        <Link href="/" className="wordmark">TWINTH.INK</Link>
        <button className="quiet-create" onClick={() => setCreateOpen(true)}>Create a Twin</button>
      </header>

      <section className="home-hero">
        <div className="home-copy">
          <p className="home-kicker">TwinThink</p>
          <h1>Give an idea<br />a reality.</h1>
          <p className="home-lede">A living digital record for things people imagine, build, and test.</p>
          <div className="home-actions">
            <Link href="/twins/0001" className="button-primary">Explore RESIP™</Link>
            <button className="button-secondary" onClick={() => setCreateOpen(true)}>Create a Twin</button>
          </div>
        </div>
        <Link href="/twins/0001" className="home-specimen" aria-label="Explore RESIP Thermal Drink Straw">
          <img src="/resip_straw_hero.jpg" alt="RESIP Thermal Drink Straw" />
          <div className="specimen-caption"><span>Twin #0001</span><strong>RESIP™</strong><small>Thermal Drink Straw</small></div>
        </Link>
      </section>

      <section className="home-feature">
        <div>
          <p className="home-kicker">The first Twin</p>
          <h2>RESIP™</h2>
          <p>A reusable self-heating drink straw using sodium acetate phase-change activation.</p>
        </div>
        <div className="feature-meta">
          <span>Experimental</span><span>9 components</span><span>37 files</span>
        </div>
        <Link href="/twins/0001" className="text-link">Explore Twin →</Link>
      </section>

      <section className="home-layers">
        <div className="section-heading"><p className="home-kicker">Reality Protocol</p><p>Look at an idea from the outside in.</p></div>
        <div className="layer-list">
          {realityLayers.map(([title, question, id]) => (
            <Link key={id} href={`/twins/0001?tab=${id}`} className="layer-row">
              <span>{title}</span><span>{question}</span><b>→</b>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-footer"><span>TwinThink</span><span>Simple on the surface. Deep underneath.</span></footer>

      {createOpen && <CreateTwinModal onClose={() => setCreateOpen(false)} />}
    </main>
  );
}
