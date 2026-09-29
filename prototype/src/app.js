import { SAMPLE_GROUPS, SAMPLE_RELATIONS, RELATION_KINDS } from './sample.js';
import { layout, buildWorld } from './web.js';
import { PHYS, newDrop, cloneDrop, step, predict, dew, release, reachable, restAt, nearestWork, wrapDy } from './physics.js';
import * as store from './store.js';
import { createInput } from './input.js';
import { draw, readTheme, viewScale } from './render.js';

const $ = (id) => document.getElementById(id);
const canvas = $('web');
const ctx = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let saved = store.load();
let content = store.contents(saved);
let target = layout(content.works, content.relations);
let display = new Map([...target].map(([k, v]) => [k, { ...v }]));
let anim = null;
let targetWorld = buildWorld(content.works, content.relations, target);
let world = targetWorld;
const drop = newDrop(500, 0);
let view = reduced ? 'list' : 'web';
let theme = readTheme();
let ghosts = [];
let compareTimer = 0;
let overview = null; // while comparing paths: a zoomed-out camera showing one whole web height
let camScale = null;
let livePath = null;
let livePathAt = 0;
const twang = new Map();
const trail = [];
const cam = { x: 500, y: 200 };
let size = { w: 0, h: 0, dpr: 1 };

const titleOf = (id) => content.works.find((w) => w.id === id)?.title ?? 'a removed work';
const strandName = (id) => {
  const r = content.relations.find((x) => x.id === id);
  return r ? `${titleOf(r.from)} — ${titleOf(r.to)}` : 'a removed strand';
};

// ---------- structure ----------

function rebuild({ animate = true } = {}) {
  content = store.contents(saved);
  const next = layout(content.works, content.relations);
  for (const [id, p] of next) if (!display.has(id)) display.set(id, { ...p });
  for (const id of [...display.keys()]) if (!next.has(id)) display.delete(id);
  target = next;
  targetWorld = buildWorld(content.works, content.relations, target);
  if (animate && !reduced) {
    anim = { from: new Map([...display].map(([k, v]) => [k, { ...v }])), t0: performance.now(), dur: 1200 };
  } else {
    display = new Map([...target].map(([k, v]) => [k, { ...v }]));
    anim = null;
  }
  world = buildWorld(content.works, content.relations, display);
  renderLists();
}

function tickAnim(now) {
  if (!anim) return;
  const u = Math.min(1, (now - anim.t0) / anim.dur);
  const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
  for (const [id, to] of target) {
    const from = anim.from.get(id) ?? to;
    display.set(id, { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
  }
  world = buildWorld(content.works, content.relations, display);
  if (u >= 1) {
    anim = null;
    world = targetWorld;
  }
}

// Where the Drop would go from here with no input. A Drop that is holding
// still is shown as if it had just been let go.
function possiblePath(w) {
  const d = cloneDrop(drop);
  if (d.mode !== 'fall' && d.mode !== 'strand') {
    d.mode = 'fall';
    d.anchorId = null;
  }
  return predict(d, w, 12);
}

function describe(p) {
  const seq = [];
  for (const id of p.touched) if (seq[seq.length - 1] !== id) seq.push(id);
  if (!seq.length) return 'no strand catches it (falls through gaps)';
  return seq.slice(0, 4).map(strandName).join(' → ') + (seq.length > 4 ? ' → …' : '');
}

function changeStructure(mutate, { fromTop = false } = {}) {
  if (fromTop) {
    // A fair, repeatable comparison: the same starting point each time.
    Object.assign(drop, newDrop(500, Math.floor(drop.y / PHYS_H()) * PHYS_H()));
    trail.length = 0;
  }
  const beforeWorld = targetWorld;
  const before = possiblePath(beforeWorld);
  const beforePos = target;
  mutate();
  store.save(saved);
  rebuild();
  const after = possiblePath(targetWorld);
  let moved = 0;
  for (const [id, p] of target) {
    const q = beforePos.get(id);
    if (q) moved = Math.max(moved, Math.hypot(p.x - q.x, p.y - q.y));
  }
  const same = JSON.stringify(before.touched) === JSON.stringify(after.touched);
  ghosts = [
    { kind: 'before', label: 'path before change', points: before.points },
    { kind: 'after', label: 'path after change', points: after.points },
  ];
  compareTimer = performance.now() + 20000;
  // Zoom out to one whole web height; the web repeats downward, so both
  // paths are folded onto that one copy of it.
  overview = same ? null : { span: targetWorld.H * 1.04 };
  $('compare').textContent =
    `Before: ${describe(before)}\nAfter: ${describe(after)}\n` +
    (same
      ? `Same strands from here: this relationship is not on the no-input path from this point. The web still re-formed (works moved up to ${Math.round(moved)} px).`
      : `The possible path changed. Works moved up to ${Math.round(moved)} px.`);
}
const PHYS_H = () => targetWorld.H;

// ---------- judgments (explicit only) ----------

function judge(type) {
  if (view !== 'web') return;
  if (type === 'dew') {
    const id = dew(drop, world);
    if (!id) return;
    store.recordJudgment(saved, 'dew', id);
    store.save(saved);
    toast(`Dew left on “${titleOf(id)}” (this device). Drop lets go.`);
  } else {
    const r = release(drop, world);
    if (!r) return;
    store.recordJudgment(saved, 'drop', r.workId);
    store.save(saved);
  }
  renderLists();
  lastCardKey = '';
}

const input = createInput(canvas, { onJudgment: judge });
$('btn-dew').addEventListener('click', () => judge('dew'));
$('btn-drop').addEventListener('click', () => judge('drop'));

// ---------- frame loop ----------

function resize() {
  const r = canvas.getBoundingClientRect();
  size = { w: r.width, h: r.height, dpr: window.devicePixelRatio || 1 };
  canvas.width = Math.round(r.width * size.dpr);
  canvas.height = Math.round(r.height * size.dpr);
}
new ResizeObserver(resize).observe(canvas);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => (theme = readTheme()));

let last = performance.now();
let acc = 0;
let eventCursor = 0;
let lastStatus = '';
let lastCardKey = '';
let hintGone = false;

function frame(now) {
  requestAnimationFrame(frame);
  tickAnim(now);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  let inputActive = false;
  if (view === 'web') {
    const inp = input.read();
    inputActive = inp.hold || !!(inp.drift.x || inp.drift.y);
    if (!hintGone && (inp.hold || inp.drift.x || inp.drift.y)) {
      hintGone = true;
      $('hint').classList.add('gone');
    }
    acc += dt;
    let n = 0;
    while (acc >= PHYS.DT && n < 12) {
      step(drop, world, inp);
      acc -= PHYS.DT;
      n++;
    }
    if (n === 12) acc = 0;
  }
  // Strands ring when touched.
  for (const e of drop.events) {
    if (e.t <= eventCursor) continue;
    if (e.strandId && (e.type === 'catch' || e.type === 'pierce' || e.type === 'transfer')) {
      twang.set(e.strandId, { t: now / 1000, amp: e.type === 'pierce' ? 9 : 5 });
    }
  }
  if (drop.events.length) eventCursor = drop.events[drop.events.length - 1].t;

  trail.push({ x: drop.x, y: drop.y });
  if (trail.length > 45) trail.shift();
  if (trail.length > 1 && Math.abs(trail[trail.length - 1].y - trail[trail.length - 2].y) > 300) trail.splice(0, trail.length - 1);

  if (ghosts.length && now > compareTimer) ghosts = [];
  if (!ghosts.length || inputActive) overview = null;
  let wanted = viewScale(size.w, targetWorld);
  if (overview) wanted = Math.min(wanted, size.h / overview.span);
  camScale = camScale === null || reduced ? wanted : camScale + (wanted - camScale) * (1 - Math.exp(-dt * 4));
  const scale = camScale;
  // Keep the web's whole width in view when it fits; otherwise follow the Drop.
  const lo = targetWorld.minX - 120 + size.w / 2 / scale;
  const hi = targetWorld.maxX + 120 - size.w / 2 / scale;
  const targetX = lo >= hi ? (targetWorld.minX + targetWorld.maxX) / 2 : Math.min(Math.max(drop.x, lo), hi);
  const tileTop = Math.floor(drop.y / world.H) * world.H;
  const targetY = overview ? tileTop + world.H / 2 : drop.y + (size.h * 0.12) / scale;
  if (overview && Math.abs(targetY - cam.y) > world.H / 2) cam.y += Math.sign(targetY - cam.y) * world.H; // same web, next copy
  const k = reduced ? 1 : 1 - Math.exp(-dt * 5);
  cam.x += (targetX - cam.x) * k;
  cam.y += (targetY - cam.y) * k;
  if (Math.abs(targetY - cam.y) > size.h / scale) cam.y = targetY;

  if ($('chk-path').checked && now - livePathAt > 300) {
    livePath = possiblePath(targetWorld);
    livePathAt = now;
  }
  const allGhosts = [...ghosts];
  if ($('chk-path').checked && livePath && !ghosts.length) allGhosts.push({ kind: 'after', label: 'possible path (no input)', points: livePath.points });

  const focus = view === 'web' && ['settle', 'adhered', 'rest'].includes(drop.mode) ? reachable(drop, world) : null;

  if (view === 'web' && size.w > 0) {
    draw(ctx, {
      ...size,
      cam,
      scale,
      world,
      drop,
      works: content.works,
      dew: saved.dew,
      thumb: input.thumb(),
      theme,
      now: now / 1000,
      reduced,
      ghosts: allGhosts,
      twang,
      focusId: focus?.id,
      labelFrom: overview ? cam : drop,
      ghostTile: overview ? tileTop : undefined,
      avoid: $('card').hidden ? [] : [{ x: $('card').offsetLeft, y: $('card').offsetTop, w: $('card').offsetWidth, h: $('card').offsetHeight }],
      trail,
    });
    placeCard(focus, scale);
  }
  updateControls(focus);
}

function updateControls(focus) {
  const near = reachable(drop, world);
  $('btn-dew').disabled = view !== 'web' || !near || drop.mode === 'adhered';
  $('btn-drop').disabled = view !== 'web' || !(near || drop.mode === 'strand');
  let s;
  if (view !== 'web') s = 'List view: the same works, without motion';
  else if (drop.mode === 'strand') s = `Caught: ${strandName(drop.strandId)}`;
  else if (drop.mode === 'settle') s = focus ? `Settling beside “${titleOf(focus.id)}”` : 'Slowing (no work close by)';
  else if (drop.mode === 'adhered') s = `Dew: holding to “${titleOf(drop.anchorId)}”. Drop lets go.`;
  else if (drop.mode === 'rest') s = `Resting beside “${titleOf(drop.anchorId)}” · drag or touch to go on`;
  else s = near ? `Falling past “${titleOf(near.id)}”` : 'Falling';
  if (s !== lastStatus) {
    $('status').textContent = s;
    lastStatus = s;
  }
}

function relLines(id) {
  return content.relations
    .filter((r) => r.from === id || r.to === id)
    .map((r) => (r.from === id ? `${r.kind} → ${titleOf(r.to)}` : `${titleOf(r.from)} ${r.kind} this`));
}

function placeCard(focus, scale) {
  const card = $('card');
  if (!focus) {
    if (!card.hidden) card.hidden = true;
    lastCardKey = '';
    return;
  }
  const work = content.works.find((w) => w.id === focus.id);
  const dews = (saved.dew[focus.id] || []).length;
  const key = `${focus.id}|${dews}|${content.relations.length}|${work?.title}`;
  if (key !== lastCardKey) {
    lastCardKey = key;
    card.replaceChildren();
    const kicker = el('div', 'kicker', work.sample ? `SAMPLE · ${work.maker}` : 'YOUR IDEA · PRIVATE · THIS DEVICE');
    const h = el('h2', null, work.title);
    const body = el('p', null, work.body || work.summary || '');
    const ul = el('ul');
    for (const line of relLines(work.id)) ul.append(el('li', null, line));
    card.append(kicker, h, body, ul);
    if (dews) card.append(el('p', 'kicker', `Dew left here: ${dews} (this device)`));
    if (!work.sample) {
      const b = el('button', null, 'Edit');
      b.type = 'button';
      b.addEventListener('click', () => openIdea(work.id));
      const row = el('div', 'card-actions');
      row.append(b);
      card.append(row);
    }
    card.hidden = false;
  }
  // Beside the work, on the side away from the Drop.
  const sx = (focus.x - cam.x) * scale + size.w / 2;
  const ny = drop.y + wrapDy(focus.y - drop.y, world.H);
  const sy = (ny - cam.y) * scale + size.h / 2;
  const cw = card.offsetWidth;
  const ch = card.offsetHeight;
  let left = drop.x > focus.x ? sx - focus.r * scale - 16 - cw : sx + focus.r * scale + 16;
  if (left < 8 || left + cw > size.w - 8) left = Math.min(size.w - cw - 8, Math.max(8, sx - cw / 2));
  const top = Math.min(size.h - ch - 8, Math.max(8, sy - ch / 2));
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

let toastTimer;
function toast(text) {
  document.querySelector('.toast')?.remove();
  const t = el('div', 'toast', text);
  t.setAttribute('role', 'status');
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 4500);
}

// ---------- views ----------

function setView(v) {
  view = v;
  $('scene').hidden = v !== 'web';
  $('list').hidden = v !== 'list';
  document.body.classList.toggle('listing', v === 'list');
  $('btn-view').textContent = v === 'web' ? 'List' : 'Web';
  $('btn-view').setAttribute('aria-pressed', String(v === 'list'));
  if (v === 'web') requestAnimationFrame(resize);
}
$('btn-view').addEventListener('click', () => setView(view === 'web' ? 'list' : 'web'));

function showInWeb(id) {
  setView('web');
  restAt(drop, world, id);
  trail.length = 0;
  cam.y = drop.y;
  cam.x = drop.x;
}

function renderLists() {
  // Accessible list: the same works and relationships as the web.
  const body = $('list-body');
  body.replaceChildren();
  const groups = [...SAMPLE_GROUPS, { id: null, name: 'Your ideas (private, this device)' }];
  for (const g of groups) {
    const works = content.works.filter((w) => (w.group ?? null) === g.id);
    if (!works.length) continue;
    body.append(el('h2', null, g.name));
    for (const w of works) {
      const a = el('article');
      a.id = `work-${w.id}`;
      a.tabIndex = -1;
      a.append(el('h3', null, w.title), el('div', 'muted', w.sample ? `Sample · ${w.maker}` : 'Your idea · private'));
      a.append(el('p', null, w.body || w.summary || ''));
      const rels = content.relations.filter((r) => r.from === w.id || r.to === w.id);
      if (rels.length) {
        const ul = el('ul');
        for (const r of rels) {
          const other = r.from === w.id ? r.to : r.from;
          const li = el('li', null, r.from === w.id ? `${r.kind} ` : '');
          const link = el('button', 'linklike', titleOf(other));
          link.type = 'button';
          link.addEventListener('click', () => {
            const t = $(`work-${other}`);
            t?.focus();
            t?.scrollIntoView({ block: 'start' });
          });
          li.append(link);
          if (r.from !== w.id) li.append(document.createTextNode(` ${r.kind} this`));
          ul.append(li);
        }
        a.append(ul);
      }
      const dews = (saved.dew[w.id] || []).length;
      if (dews) a.append(el('div', 'muted', `Dew left here: ${dews} (this device)`));
      const row = el('div', 'row');
      const show = el('button', null, 'Show in the web');
      show.type = 'button';
      show.addEventListener('click', () => showInWeb(w.id));
      const dw = el('button', null, 'Dew');
      dw.type = 'button';
      dw.addEventListener('click', () => {
        store.recordJudgment(saved, 'dew', w.id);
        store.save(saved);
        renderLists();
        $(`work-${w.id}`)?.focus();
      });
      const dr = el('button', null, 'Drop');
      dr.type = 'button';
      dr.addEventListener('click', () => {
        store.recordJudgment(saved, 'drop', w.id);
        store.save(saved);
        toast(`Drop: let go of “${w.title}” (this device).`);
      });
      row.append(show, dw, dr);
      if (!w.sample) {
        const ed = el('button', null, 'Edit');
        ed.type = 'button';
        ed.addEventListener('click', () => openIdea(w.id));
        row.append(ed);
      }
      a.append(row);
      body.append(a);
    }
  }
  renderRelationSheet();
  renderIdeaList();
}

// ---------- sheets ----------

const sheets = { 'btn-rel': 'sheet-rel', 'btn-idea': 'sheet-idea', 'btn-help': 'sheet-help' };
function openSheet(btnId) {
  for (const [b, s] of Object.entries(sheets)) {
    const open = b === btnId && $(s).hidden;
    $(s).hidden = !open;
    $(b).setAttribute('aria-expanded', String(open));
    if (open) $(s).querySelector('button, input, select')?.focus();
  }
}
for (const b of Object.keys(sheets)) $(b).addEventListener('click', () => {
  if (b === 'btn-idea') resetIdeaForm();
  openSheet(b);
});
document.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', () => openSheet(null)));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') openSheet(null);
});

function fillSelect(sel, options, keep) {
  const prev = keep ? sel.value : '';
  const head = [...sel.querySelectorAll('option[value=""]')];
  sel.replaceChildren(...head);
  for (const [value, label] of options) {
    const o = el('option', null, label);
    o.value = value;
    sel.append(o);
  }
  if (prev) sel.value = prev;
}

function renderRelationSheet() {
  const off = new Set(saved.disabledSample);
  const ul = $('rel-sample');
  ul.replaceChildren();
  for (const r of SAMPLE_RELATIONS) {
    const li = el('li');
    const label = el('label');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = !off.has(r.id);
    cb.addEventListener('change', () => changeStructure(() => store.setSampleRelation(saved, r.id, cb.checked)));
    label.append(cb, document.createTextNode(`${titleOf(r.from)} ${r.kind} ${titleOf(r.to)}`));
    li.append(label);
    ul.append(li);
  }
  const own = $('rel-own');
  own.replaceChildren();
  const mine = saved.relations;
  if (!mine.length) own.append(el('li', 'muted', 'None yet.'));
  for (const r of mine) {
    const li = el('li', null, `${titleOf(r.from)} ${r.kind} ${titleOf(r.to)}`);
    const rm = el('button', null, 'Remove');
    rm.type = 'button';
    rm.addEventListener('click', () => changeStructure(() => store.disconnect(saved, r.id)));
    li.append(rm);
    own.append(li);
  }
  const opts = content.works.map((w) => [w.id, `${w.title}${w.sample ? ' (sample)' : ''}`]);
  fillSelect($('rel-from'), opts, true);
  fillSelect($('rel-to'), opts, true);
  fillSelect($('rel-kind'), RELATION_KINDS.map((k) => [k, k]), true);
  $('btn-demo').textContent = off.has('r5')
    ? 'Try it: switch “Rain map responds to Rain barrel” back on'
    : 'Try it: switch off “Rain map responds to Rain barrel”';
}

$('btn-demo').addEventListener('click', () => {
  const on = !saved.disabledSample.includes('r5');
  setView('web');
  changeStructure(() => store.setSampleRelation(saved, 'r5', !on), { fromTop: true });
});

$('form-rel').addEventListener('submit', (e) => {
  e.preventDefault();
  const from = $('rel-from').value;
  const to = $('rel-to').value;
  if (!from || !to || from === to) return toast('Choose two different works.');
  changeStructure(() => store.connect(saved, from, to, $('rel-kind').value));
});

function resetIdeaForm() {
  $('idea-id').value = '';
  $('idea-name').value = '';
  $('idea-text').value = '';
  $('idea-title').textContent = 'New idea';
  $('idea-connect').hidden = false;
  $('idea-to').value = '';
  $('btn-idea-delete').hidden = true;
  $('idea-history').hidden = true;
}

function openIdea(id) {
  const w = saved.works.find((x) => x.id === id);
  if (!w) return;
  if ($('sheet-idea').hidden) openSheet('btn-idea');
  $('idea-id').value = w.id;
  $('idea-name').value = w.title;
  $('idea-text').value = w.text;
  $('idea-title').textContent = 'Edit idea';
  $('idea-connect').hidden = true;
  $('btn-idea-delete').hidden = false;
  const ol = $('idea-history-list');
  ol.replaceChildren();
  for (const h of w.history) {
    const li = el('li');
    li.append(el('div', 'muted', `${h.change} · ${new Date(h.at).toLocaleString()}`), el('div', null, `${h.title}: ${h.text || '(no text)'}`));
    ol.append(li);
  }
  $('idea-history').hidden = false;
  $('idea-name').focus();
}

function renderIdeaList() {
  fillSelect($('idea-kind'), RELATION_KINDS.map((k) => [k, k]), true);
  fillSelect($('idea-to'), content.works.map((w) => [w.id, `${w.title}${w.sample ? ' (sample)' : ''}`]), true);
  const ul = $('idea-list');
  ul.replaceChildren();
  if (!saved.works.length) ul.append(el('li', 'muted', 'Nothing saved yet.'));
  for (const w of saved.works) {
    const li = el('li', null, w.title);
    const span = el('span');
    const ed = el('button', null, 'Edit');
    ed.type = 'button';
    ed.addEventListener('click', () => openIdea(w.id));
    const sh = el('button', null, 'Show');
    sh.type = 'button';
    sh.addEventListener('click', () => {
      openSheet(null);
      showInWeb(w.id);
    });
    span.append(ed, document.createTextNode(' '), sh);
    li.append(span);
    ul.append(li);
  }
}

$('form-idea').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('idea-id').value;
  const title = $('idea-name').value;
  const text = $('idea-text').value;
  if (!title.trim()) return;
  if (id) {
    store.editIdea(saved, id, { title, text });
    store.save(saved);
    rebuild({ animate: false });
    openIdea(id);
    toast('Saved. The earlier version stays in its history.');
    return;
  }
  const to = $('idea-to').value;
  let work;
  changeStructure(() => {
    work = store.addIdea(saved, { title, text });
    if (to) store.connect(saved, work.id, to, $('idea-kind').value);
  });
  openSheet(null);
  showInWeb(work.id);
  toast('Saved privately in this browser. The Drop is resting beside it: drag or touch to fall on.');
});

$('btn-idea-delete').addEventListener('click', () => {
  const id = $('idea-id').value;
  if (!id || !confirm('Delete this idea and its relationships from this browser?')) return;
  changeStructure(() => store.removeIdea(saved, id));
  resetIdeaForm();
});

$('btn-reset').addEventListener('click', () => {
  if (!confirm('Clear your ideas, relationships, Dew and Drop records from this browser?')) return;
  try {
    localStorage.removeItem(store.STORAGE_KEY);
  } catch {}
  location.reload();
});

// Keyboard reach for the list; also exposed for tests.
window.__tt = { drop, get world() { return world; }, get saved() { return saved; }, nearestWork, showInWeb };

renderLists();
setView(view);
if (reduced) toast('Reduced motion: starting with the list. “Web” shows the moving view.');
requestAnimationFrame(frame);
