import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../src/store.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('a new idea is private, keeps its words and a history, and survives a reload with the same id', () => {
  const ls = memoryStorage();
  const s = store.load(ls);
  const w = store.addIdea(s, { title: '  Kettle that tells you it boiled ', text: 'A whistle, but visual.' });
  store.connect(s, w.id, 's-barrel', 'responds to');
  store.save(s, ls);

  const again = store.load(ls);
  const back = again.works.find((x) => x.id === w.id);
  assert.equal(back.title, 'Kettle that tells you it boiled');
  assert.equal(back.private, true);
  assert.equal(back.source, 'typed');
  assert.equal(back.history.length, 1);
  const c = store.contents(again);
  assert.ok(c.works.some((x) => x.id === w.id && !x.sample));
  assert.ok(c.relations.some((r) => r.from === w.id && r.to === 's-barrel'));
});

test('editing appends history; the original expression is never overwritten', () => {
  const s = store.emptyState();
  const w = store.addIdea(s, { title: 'First', text: 'as first said' });
  store.editIdea(s, w.id, { title: 'Second', text: 'reworded' });
  assert.equal(w.title, 'Second');
  assert.equal(w.history[0].text, 'as first said');
  assert.equal(w.history[1].change, 'edited');
  store.editIdea(s, w.id, { title: 'Second', text: 'reworded' });
  assert.equal(w.history.length, 2, 'no-op edits add nothing');
});

test('only Dew and Drop are recorded as judgments', () => {
  const s = store.emptyState();
  store.recordJudgment(s, 'dew', 's-shelf');
  store.recordJudgment(s, 'drop', 's-shelf');
  assert.deepEqual(s.journey.map((j) => j.type), ['dew', 'drop']);
  assert.equal(s.dew['s-shelf'].length, 1);
  assert.throws(() => store.recordJudgment(s, 'lean', 's-shelf'));
  assert.throws(() => store.recordJudgment(s, 'catch', 's-shelf'));
});

test('switching a sample relationship off is local and reversible', () => {
  const s = store.emptyState();
  store.setSampleRelation(s, 'r5', false);
  assert.ok(!store.contents(s).relations.some((r) => r.id === 'r5'));
  store.setSampleRelation(s, 'r5', true);
  assert.ok(store.contents(s).relations.some((r) => r.id === 'r5'));
});

test('removing an idea removes its relationships and Dew', () => {
  const s = store.emptyState();
  const w = store.addIdea(s, { title: 'Gone soon', text: '' });
  store.connect(s, w.id, 's-map', 'uses');
  store.recordJudgment(s, 'dew', w.id);
  store.removeIdea(s, w.id);
  assert.equal(s.works.length, 0);
  assert.equal(s.relations.length, 0);
  assert.equal(s.dew[w.id], undefined);
});

test('corrupt or foreign storage falls back to an empty state', () => {
  const ls = memoryStorage();
  ls.setItem(store.STORAGE_KEY, '{nope');
  assert.deepEqual(store.load(ls).works, []);
  ls.setItem(store.STORAGE_KEY, JSON.stringify({ version: 99 }));
  assert.deepEqual(store.load(ls).works, []);
});
