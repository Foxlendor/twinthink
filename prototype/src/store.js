// Everything the visitor makes or decides stays in this browser (localStorage).
// Nothing here talks to a network; the page's CSP also forbids it.

import { SAMPLE_WORKS, SAMPLE_RELATIONS } from './sample.js';

export const STORAGE_KEY = 'twinthink.prototype.v1';

export function emptyState() {
  return {
    version: 1,
    works: [], // the visitor's own ideas: { id, title, text, source, private, createdAt, history: [...] }
    relations: [], // relationships the visitor added: { id, from, to, kind, createdAt }
    disabledSample: [], // sample relationship ids switched off as a local test change
    dew: {}, // workId -> [timestamps]: persistence left by explicit Dew
    journey: [], // explicit judgments only, in order: { type: 'dew' | 'drop', workId, at }
  };
}

export function load(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const data = JSON.parse(raw);
    if (data?.version !== 1) return emptyState();
    return { ...emptyState(), ...data };
  } catch {
    return emptyState();
  }
}

export function save(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function newId(prefix) {
  const u = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${u}`;
}

// A new idea starts private. The original words are kept as the first entry
// in its history and are never overwritten by later edits.
export function addIdea(state, { title, text }, now = new Date().toISOString()) {
  const t = title.trim();
  const body = (text ?? '').trim();
  if (!t) throw new Error('An idea needs a title.');
  const work = {
    id: newId('idea'),
    title: t,
    text: body,
    source: 'typed',
    private: true,
    createdAt: now,
    history: [{ at: now, title: t, text: body, change: 'created' }],
  };
  state.works.push(work);
  return work;
}

export function editIdea(state, id, { title, text }, now = new Date().toISOString()) {
  const w = state.works.find((x) => x.id === id);
  if (!w) return null;
  const t = title.trim() || w.title;
  const body = (text ?? '').trim();
  if (t === w.title && body === w.text) return w;
  w.title = t;
  w.text = body;
  w.history.push({ at: now, title: t, text: body, change: 'edited' });
  return w;
}

export function removeIdea(state, id) {
  state.works = state.works.filter((w) => w.id !== id);
  state.relations = state.relations.filter((r) => r.from !== id && r.to !== id);
  delete state.dew[id];
}

export function connect(state, from, to, kind, now = new Date().toISOString()) {
  if (!from || !to || from === to) return null;
  const rel = { id: newId('rel'), from, to, kind, createdAt: now };
  state.relations.push(rel);
  return rel;
}

export function disconnect(state, relId) {
  state.relations = state.relations.filter((r) => r.id !== relId);
}

export function setSampleRelation(state, relId, enabled) {
  const off = new Set(state.disabledSample);
  if (enabled) off.delete(relId);
  else off.add(relId);
  state.disabledSample = [...off];
}

// Only explicit Dew and Drop are recorded. Motion, catches, settling and
// reading are never written here.
export function recordJudgment(state, type, workId, now = new Date().toISOString()) {
  if (type !== 'dew' && type !== 'drop') throw new Error('Only Dew and Drop are judgments.');
  state.journey.push({ type, workId, at: now });
  if (state.journey.length > 500) state.journey.splice(0, state.journey.length - 500);
  if (type === 'dew' && workId) (state.dew[workId] ||= []).push(now);
}

// The works and relationships the web is built from.
export function contents(state) {
  const own = state.works.map((w) => ({
    id: w.id,
    title: w.title,
    summary: w.text.split(/(?<=[.!?])\s/)[0].slice(0, 120),
    body: w.text,
    maker: 'You',
    group: null,
    createdAt: w.createdAt,
    sample: false,
    private: true,
  }));
  const ids = new Set([...SAMPLE_WORKS.map((w) => w.id), ...own.map((w) => w.id)]);
  const off = new Set(state.disabledSample);
  const relations = [
    ...SAMPLE_RELATIONS.filter((r) => !off.has(r.id)),
    ...state.relations.filter((r) => ids.has(r.from) && ids.has(r.to)).map((r) => ({ ...r, sample: false })),
  ];
  return { works: [...SAMPLE_WORKS, ...own], relations };
}
