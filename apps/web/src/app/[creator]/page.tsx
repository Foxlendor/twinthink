import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { PUBLIC_CATEGORIES, PUBLIC_IDEAS } from '@/lib/shadowfield/sources/public';

interface Props {
  params: Promise<{ creator: string }>;
}

const PUBLIC = new Set(['foxlendor', 'johne.boi', 'johne']);

export default async function CreatorPage({ params }: Props) {
  const { creator } = await params;
  const slug = decodeURIComponent(creator).toLowerCase();

  if (!PUBLIC.has(slug)) {
    return (
      <main style={{ minHeight: '100vh', background: '#fbfbf8', padding: '5rem 1.5rem', color: '#171717' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Link href="/canvas" style={{ color: '#777', textDecoration: 'none' }}><ArrowLeft size={15} /> Canvas</Link>
          <div style={{ marginTop: 40, padding: 48, border: '1px solid #e7e7e1', borderRadius: 22, background: '#fff', textAlign: 'center' }}>
            <LockKeyhole size={28} color="#999" />
            <h1>Creator record not published</h1>
            <p style={{ color: '#777' }}>There is no public creator record for this route.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fbfbf8', color: '#171717' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '3.5rem 1.4rem 7rem' }}>
        <Link href="/canvas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#777', textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={15} /> Canvas
        </Link>

        <header style={{ padding: '3rem 0', borderBottom: '1px solid #e8e8e2' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#999', letterSpacing: '0.14em', textTransform: 'uppercase' }}>creator shadow</div>
          <h1 style={{ margin: '0.8rem 0 0', fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 0.9, letterSpacing: '-0.065em', fontWeight: 650 }}>Foxlendor</h1>
          <p style={{ maxWidth: 700, color: '#666', lineHeight: 1.7 }}>
            A public record of invention, game, interface, music, and creative-system ideas.
          </p>
          <Link href="/canvas#path=creator%2Ffoxlendor" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#171717', textDecoration: 'none', fontWeight: 700 }}>
            enter the constellation <ArrowRight size={15} />
          </Link>
        </header>

        <p style={{ color: '#888', fontSize: 13, margin: '2rem 0' }}>
          {PUBLIC_IDEAS.length} project records. Missing dates and missing mechanics are left unknown rather than guessed.
        </p>

        {PUBLIC_CATEGORIES.map((category) => {
          const ideas = PUBLIC_IDEAS.filter((idea) => idea.category === category);
          if (!ideas.length) return null;
          return (
            <section key={category} style={{ marginBottom: 52 }}>
              <h2 style={{ fontSize: 17, paddingBottom: 10, borderBottom: '1px solid #e8e8e2' }}>{category} · {ideas.length}</h2>
              {ideas.map((idea) => (
                <article key={idea.id} style={{ padding: '20px 0', borderBottom: '1px solid #efefe9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 20 }}>{idea.title}</h3>
                    <span style={{ color: '#999', fontFamily: 'monospace', fontSize: 11 }}>{idea.era} · {idea.status}</span>
                  </div>
                  <p style={{ color: '#444', lineHeight: 1.65 }}>{idea.summary}</p>
                  <details>
                    <summary style={{ color: '#777', cursor: 'pointer', fontSize: 13 }}>history & reasoning</summary>
                    <div style={{ color: '#666', lineHeight: 1.65, fontSize: 14, marginTop: 12 }}>
                      <p><strong>Problem:</strong> {idea.problem}</p>
                      {idea.evolution ? <p><strong>Evolution:</strong> {idea.evolution}</p> : null}
                      {idea.highlights?.length ? <ul>{idea.highlights.map((x) => <li key={x}>{x}</li>)}</ul> : null}
                      <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 10 }}>source: {idea.evidence}</div>
                    </div>
                  </details>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </main>
  );
}
