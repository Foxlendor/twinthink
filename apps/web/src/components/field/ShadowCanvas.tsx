'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Minus, Plus, Shuffle } from 'lucide-react';
import { FieldEngine, type FieldSnapshot } from '@/lib/field/engine';
import { SeedSource } from '@/lib/field/seed/seedSource';
import IdeaPanel from './IdeaPanel';
import styles from './ShadowCanvas.module.css';

/**
 * The TwinThink Canvas.
 *
 * The feed moves content past you. The Canvas moves you through content:
 * drag to explore across (X/Y), scroll or pinch to go into whatever you are
 * centred on (Z), Escape to come back out. Nothing here navigates pages.
 */

const INITIAL: FieldSnapshot = {
  ready: false,
  frameId: 'canvas',
  path: [{ id: 'canvas', title: 'Canvas' }],
  selected: null,
  panel: null,
  insideTwin: false,
  atOverview: true,
  resisted: false,
  lensOn: false,
  activity: { backs: {}, returns: {} },
  announce: '',
  now: 0,
};

export default function ShadowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FieldEngine | null>(null);
  const [view, setView] = useState<FieldSnapshot>(INITIAL);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const params = new URLSearchParams(window.location.search);
    // `scale` is a stress-test knob: /canvas?scale=50 puts ~65k creators on the Canvas.
    const source = new SeedSource({ scale: Number(params.get('scale')) || 1 });
    const engine = new FieldEngine(canvas, source, setView);
    engineRef.current = engine;
    // Development handle for inspecting the Field from the console.
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __field?: FieldEngine }).__field = engine;
    void engine.start(params.get('at'));
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const engine = () => engineRef.current;
  const { panel, selected } = view;

  let hint: React.ReactNode;
  if (!view.ready) hint = 'Loading the Canvas…';
  else if (view.resisted) {
    hint = (
      <>
        <span className={styles.hintStrong}>Not open to you yet.</span> Something is there, but you are not close enough to see what it is.
      </>
    );
  } else if (view.insideTwin) hint = 'Scroll to go deeper · drag to look around · Esc to come back out';
  else if (view.atOverview) {
    hint = view.lensOn
      ? 'The Lens shows continuity, not the ideas themselves. Scroll toward any mark to go into it.'
      : 'At public distance the Canvas is intentionally close to blank. Scroll toward anything to go into it.';
  } else hint = selected ? `Scroll to go into ${selected.title ?? 'it'} · Esc to come back out` : 'Scroll toward a mark to go into it · click to select · Esc to come back out';

  return (
    <main>
      <section className={`${styles.stage} ${panel ? styles.withPanel : ''}`}>
        <canvas ref={canvasRef} className={styles.canvas} tabIndex={0} aria-label="TwinThink Canvas. Drag to explore, scroll to go deeper, Escape to come back out." />

        <nav className={styles.crumbs} aria-label="Where you are in the thought">
          {view.path.map((step, index) => {
            // Long paths keep their start and the last few steps; the middle folds into "…".
            const folded = view.path.length > 5 && index > 0 && index < view.path.length - 3;
            if (folded) {
              if (index !== 1) return null;
              return (
                <React.Fragment key="fold">
                  <span className={styles.crumbSep}>/</span>
                  <button type="button" className={styles.crumb} title={view.path.slice(1, -3).map((s) => s.title).join(' / ')} onClick={() => engine()?.show(view.path[view.path.length - 4].id)}>
                    …
                  </button>
                </React.Fragment>
              );
            }
            return (
            <React.Fragment key={step.id}>
              {index > 0 && <span className={styles.crumbSep}>/</span>}
              <button
                type="button"
                className={`${styles.crumb} ${index === view.path.length - 1 ? styles.crumbCurrent : ''}`}
                onClick={() => {
                  // Keep the step you came from selected, so you can go straight back in.
                  engine()?.select(view.path[index + 1]?.id ?? null);
                  engine()?.show(step.id, index === 0 ? 0.5 : undefined);
                }}
                aria-current={index === view.path.length - 1 ? 'location' : undefined}
              >
                {step.title}
              </button>
            </React.Fragment>
            );
          })}
          {selected && selected.parentId === view.frameId && selected.perceivable && (
            <>
              <span className={styles.crumbSep}>→</span>
              <span className={styles.crumbAhead}>{selected.title}</span>
            </>
          )}
        </nav>

        <div className={styles.headline} style={{ opacity: view.atOverview ? 1 : 0, transform: view.atOverview ? 'none' : 'translateY(-8px)' }} aria-hidden={!view.atOverview}>
          <div className={styles.eyebrow}>TwinThink Canvas · prototype</div>
          <h1 className={styles.title}>Something is here.</h1>
          <p className={styles.lede}>Move through the blank. Scroll toward anything to go into it. You never open a post here. You go inside an idea.</p>
        </div>

        <div className={styles.controls}>
          <button type="button" onClick={() => engine()?.toggleLens()} className={`${styles.control} ${view.lensOn ? styles.controlOn : ''}`} aria-pressed={view.lensOn}>
            {view.lensOn ? <EyeOff size={16} /> : <Eye size={16} />}
            {view.lensOn ? 'Hide Lens' : 'Use Lens'}
          </button>
          <button type="button" onClick={() => void engine()?.random()} className={styles.control}>
            <Shuffle size={16} />
            Random
          </button>
        </div>

        <div className={styles.depth}>
          <button type="button" className={styles.round} onClick={() => engine()?.out()} aria-label="Go out one level">
            <Minus size={16} />
          </button>
          <button type="button" className={styles.round} onClick={() => engine()?.deeper()} aria-label="Go deeper">
            <Plus size={16} />
          </button>
        </div>

        {!panel && <div className={styles.hint}>{hint}</div>}

        {panel && (
          <IdeaPanel
            key={panel.node.id}
            node={panel.node}
            twin={panel.twin}
            isFrame={panel.isFrame}
            parentTitle={panel.parentTitle}
            now={view.now}
            backedAt={panel.twin ? (view.activity.backs[panel.twin.id] ?? null) : null}
            daysVisited={panel.twin ? (view.activity.returns[panel.twin.id] ?? []) : []}
            titleOf={(id) => engine()?.titleOf(id) ?? null}
            onBack={(id) => engine()?.back(id)}
            onEnter={(id) => engine()?.enter(id)}
            onFly={(id) => {
              engine()?.select(id);
              engine()?.show(id);
            }}
            onClose={() => {
              engine()?.select(null);
              if (panel.isFrame) engine()?.out();
            }}
          />
        )}

        <div className={styles.srOnly} aria-live="polite">
          {view.announce}
        </div>
      </section>
    </main>
  );
}
