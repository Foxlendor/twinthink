'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, ChevronUp, CornerDownRight, Heart, X } from 'lucide-react';
import { ago, continuityOf, lifeWords } from '@/lib/field/continuity';
import type { NodeKind, RelationshipType, ShadowProjection } from '@/lib/field/model';
import styles from './ShadowCanvas.module.css';

export interface PanelProps {
  node: ShadowProjection;
  /** Nearest Twin at or above the node, if any. */
  twin: ShadowProjection | null;
  /** The node is the frame the viewer is inside, not a selection. */
  isFrame: boolean;
  parentTitle: string | null;
  now: number;
  backedAt: string | null;
  /** Distinct days this viewer entered the Twin (first one is discovery). */
  daysVisited: string[];
  titleOf(id: string): string | null;
  onBack(twinId: string): void;
  onEnter(id: string): void;
  onFly(id: string): void;
  onClose(): void;
}

const format = (value: number) => new Intl.NumberFormat('en-US', { notation: value >= 10000 ? 'compact' : 'standard' }).format(value);

function kindWords(kind: NodeKind, isTwin: boolean, nested: boolean) {
  if (isTwin) return nested ? 'an idea inside an idea' : 'an idea';
  switch (kind) {
    case 'constellation':
      return 'a creator';
    case 'facet':
      return 'part of the idea';
    case 'branch':
      return 'a branch';
    case 'thought':
      return 'a note';
    case 'component':
      return 'a part';
    case 'experiment':
      return 'an experiment';
    case 'question':
      return 'an open question';
    case 'revision':
      return 'a revision';
    case 'evidence':
      return 'evidence';
    case 'media':
      return 'an artifact';
    case 'dead_end':
      return 'a path that stopped';
    default:
      return '';
  }
}

const RELATION_WORDS: Record<RelationshipType, string> = {
  revises: 'a later version of',
  branched_from: 'branched off from',
  converges_with: 'comes together with',
  supports: 'supports',
  contradicts: 'contradicts',
  depends_on: 'depends on',
  descends_from: 'descends from',
};

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.line}>
      <span className={styles.lineLabel}>{label}</span>
      <strong className={styles.lineValue}>{value}</strong>
    </div>
  );
}

export default function IdeaPanel(props: PanelProps) {
  const { node, twin, isFrame, now, backedAt, daysVisited } = props;
  const [collapsed, setCollapsed] = useState(false);
  const nestedTwin = node.isTwin && Boolean(twin && twin.id !== node.id);

  if (!node.perceivable) {
    return (
      <aside className={styles.panel} aria-label="Something not yet open">
        <div className={styles.panelTop}>
          <span className={styles.panelKind}>something is here</span>
          <button type="button" className={styles.iconButton} onClick={props.onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <h2 className={styles.panelTitle}>Not open to you yet</h2>
        <p className={styles.panelGist}>
          {twin ? (
            <>
              You can tell something is inside <em>{twin.title}</em>, but not what it is. Some of it opens to people who back the idea or keep coming back to it. Some of it stays with the
              creator.
            </>
          ) : (
            'You can tell something is here, but not what it is.'
          )}
        </p>
        {twin && !backedAt && (
          <button type="button" className={styles.primary} onClick={() => props.onBack(twin.id)}>
            <Heart size={16} /> Back {twin.title}
          </button>
        )}
        {twin && backedAt && <p className={styles.yours}>You backed this idea. What is still hidden here is being kept by the creator for now.</p>}
      </aside>
    );
  }

  const c = continuityOf({ history: node.history ?? [], evidence: node.evidence ?? [], kind: node.kind, twin: node.twin }, now);
  const twinC = twin && twin.id !== node.id ? continuityOf({ history: twin.history ?? [], evidence: twin.evidence ?? [], kind: twin.kind, twin: twin.twin }, now) : c;
  const identity = twin?.twin;
  const returnedDays = Math.max(0, daysVisited.length - 1);

  return (
    <aside className={`${styles.panel} ${collapsed ? styles.panelCollapsed : ''}`} aria-label={node.title ?? 'Selected'}>
      <div className={styles.panelTop}>
        <span className={styles.panelKind}>
          {kindWords(node.kind, node.isTwin, nestedTwin)}
          {node.kind !== 'constellation' && node.kind !== 'twin' && node.kind !== 'evidence' && node.kind !== 'media' ? ' · ' + lifeWords(c.life) : ''}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button type="button" className={styles.iconButton} onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" className={styles.iconButton} onClick={props.onClose} aria-label="Close">
            <X size={14} />
          </button>
        </span>
      </div>

      <h2 className={styles.panelTitle}>{node.title}</h2>
      {props.parentTitle && node.kind !== 'twin' && node.kind !== 'constellation' && (
        <div className={styles.within}>
          inside {props.parentTitle}
          {twin && twin.id !== node.id && twin.title !== props.parentTitle ? ` · ${twin.title}` : ''}
        </div>
      )}
      {node.isTwin && identity && <div className={styles.within}>by {identity.creator}</div>}
      {node.gist && <p className={styles.panelGist}>{node.gist}</p>}
      {node.isTwin && node.twin?.note && <p className={styles.note}>“{node.twin.note}”</p>}
      {!node.isTwin && node.body && node.childCount === 0 && <p className={styles.panelGist}>{node.body}</p>}

      {node.kind === 'constellation' ? (
        <div className={styles.evidence}>
          <Line label="Ideas here" value={String(node.childCount)} />
          <Line label="First seen" value={ago(c.began, now)} />
        </div>
      ) : node.isTwin && node.twin ? (
        <div className={styles.evidence}>
          <Line label="Started" value={ago(c.began, now)} />
          <Line label="Changed" value={c.revisions + (c.revisions === 1 ? ' time' : ' times')} />
          {c.branches > 0 && <Line label="Branched" value={c.branches + (c.branches === 1 ? ' time' : ' times')} />}
          {c.deadEnds > 0 && <Line label="Dead ends kept" value={String(c.deadEnds)} />}
          {c.creatorReturns > 0 && <Line label="Creator came back" value={c.creatorReturns + ' times'} />}
          {c.evidence > 0 && <Line label="Evidence added" value={String(c.evidence)} />}
          <Line label="People who came back" value={format(node.twin.returners + (returnedDays > 0 && twin?.id === node.id ? 1 : 0))} />
          <Line label="Want the next step" value={format(node.twin.backers + (backedAt && twin?.id === node.id ? 1 : 0))} />
          <Line label="Right now" value={c.stillChanging ? `${lifeWords(c.life)}, changed ${ago(c.lastChange, now)}` : `${lifeWords(c.life)} since ${ago(c.lastChange, now)}`} />
        </div>
      ) : (
        <div className={styles.evidence}>
          <Line label="Began" value={ago(c.began, now)} />
          {c.revisions > 0 && <Line label="Reworked" value={c.revisions + (c.revisions === 1 ? ' time' : ' times')} />}
          <Line label="Last touched" value={ago(c.lastChange, now)} />
          {node.childCount > 0 && <Line label="Inside it" value={node.childCount + (node.childCount === 1 ? ' thing' : ' things')} />}
        </div>
      )}

      {Boolean(node.relationships?.length) && (
        <div className={styles.section}>
          <div className={styles.relations}>
            {node.relationships!.map((rel) => {
              const title = props.titleOf(rel.targetId);
              if (!title) return null;
              return (
                <div key={rel.type + rel.targetId}>
                  <CornerDownRight size={12} style={{ verticalAlign: '-1px', marginRight: 6 }} />
                  {RELATION_WORDS[rel.type]}{' '}
                  <button type="button" className={styles.linkish} onClick={() => props.onFly(rel.targetId)}>
                    {title}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Boolean(node.evidence?.length) && node.childCount > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Evidence</div>
          {node.evidence!.map((e) => (
            <p key={e.label} className={styles.small}>
              {e.label}
            </p>
          ))}
        </div>
      )}

      {!isFrame && node.kind !== 'constellation' && (node.childCount > 0 || node.body) && (
        <button type="button" className={styles.secondary} onClick={() => props.onEnter(node.id)}>
          Go in <span style={{ opacity: 0.5, fontWeight: 500 }}>· or scroll toward it</span>
        </button>
      )}
      {!isFrame && node.kind === 'constellation' && (
        <button type="button" className={styles.secondary} onClick={() => props.onEnter(node.id)}>
          Go in
        </button>
      )}

      {twin && identity && (
        <>
          {twin.id === node.id && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>What backing means</div>
              <p className={styles.small}>You are not buying or rating it. You are leaving one durable signal: you want to see what happens next.</p>
            </div>
          )}
          <button type="button" disabled={Boolean(backedAt)} onClick={() => props.onBack(twin.id)} className={`${styles.primary} ${backedAt ? styles.primaryDone : ''}`}>
            <Heart size={16} fill={backedAt ? 'currentColor' : 'none'} />
            {backedAt ? 'Backed · come back later' : twin.id === node.id ? 'Back this' : `Back ${twin.title}`}
          </button>
          {twin.id !== node.id && twinC.stillChanging && !backedAt && <p className={styles.within} style={{ textAlign: 'center' }}>{twin.title} is still changing.</p>}
        </>
      )}

      {identity?.recordHref && (
        <Link href={identity.recordHref} className={styles.secondary}>
          Open the full Twin record <ArrowUpRight size={14} />
        </Link>
      )}

      {twin && (backedAt || daysVisited.length > 0) && (
        <div className={styles.yours}>
          <strong style={{ fontWeight: 650 }}>Your trail</strong> · on this device
          <br />
          {daysVisited.length > 0 && <>You found {twin.title} {ago(Date.parse(daysVisited[0]), now)}. </>}
          {returnedDays > 0 && <>You came back on {returnedDays} other {returnedDays === 1 ? 'day' : 'days'}. </>}
          {backedAt && <>You backed it {ago(Date.parse(backedAt), now)}, so you can see a little further into it now.</>}
        </div>
      )}

      <div className={styles.provenance}>
        {node.origin === 'record'
          ? `From the ${identity?.title ?? 'Twin'} record.`
          : identity?.recordHref
            ? `Identity and specifications come from the ${identity.title} record. The inner history shown here is seeded for this prototype.`
            : 'Seeded for this prototype: believable structure and history, not real activity. Your trail above is real.'}
      </div>
    </aside>
  );
}
