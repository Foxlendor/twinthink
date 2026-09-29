// Browser check of the prototype with Playwright + Chromium.
// Starts its own local server, drives the page with real (CDP) touch events at
// phone size and mouse/keyboard at desktop size, and writes screenshots to
// evidence/. Touch here is emulated by Chromium, not a physical phone.
//
// Run: npm run e2e   (see RUN.md for how Playwright is found)

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const p of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright']) {
    if (!p) continue;
    try {
      return require(p);
    } catch {}
  }
  throw new Error('Playwright not found. See RUN.md.');
}
const { chromium } = loadPlaywright();

const root = fileURLToPath(new URL('..', import.meta.url));
const evidence = `${root}evidence/`;
await mkdir(evidence, { recursive: true });
const PORT = 4300 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}/`;
const server = spawn(process.execPath, ['serve.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
await new Promise((ok) => server.stdout.once('data', ok));

const launch = {};
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(['ok', name]);
    console.log(`ok   ${name}`);
  } catch (e) {
    results.push(['FAIL', name, e.message]);
    console.log(`FAIL ${name}\n     ${e.message.split("\n").slice(0, 4).join(" ")}`);
  }
};

// Records every request and every event listener type the page registers.
async function open(options) {
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    window.__listeners = [];
    const orig = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, ...rest) {
      window.__listeners.push(type);
      return orig.call(this, type, ...rest);
    };
  });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()}`));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE);
  await page.waitForTimeout(300);
  return { context, page, requests, errors };
}
const drop = (page) => page.evaluate(() => ({ ...__tt.drop, ignore: undefined, events: __tt.drop.events.map((e) => e.type) }));
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('twinthink.prototype.v1') || 'null'));

// ---------------- phone ----------------
const phone = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const { page: p } = phone;
const cdp = await phone.context.newCDPSession(p);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });

await check('phone: with no input the Drop moves on its own and meets strands', async () => {
  const a = await drop(p);
  await p.waitForTimeout(3500);
  const b = await drop(p);
  assert.ok(b.y - a.y > 150, `moved ${b.y - a.y}`);
  assert.ok(b.events.some((e) => e === 'catch' || e === 'pierce'), `events: ${b.events}`);
  await p.screenshot({ path: `${evidence}phone-1-falling.png` });
});

await check('phone: touch and hold settles beside a work and shows it in place', async () => {
  await touch('touchStart', 200, 500);
  await p.waitForTimeout(2500);
  const d = await drop(p);
  assert.equal(d.mode, 'settle');
  assert.ok(Math.hypot(d.vx, d.vy) < 10, 'nearly still');
  assert.equal(await p.locator('#card').isVisible(), true, 'reading card visible');
  await p.screenshot({ path: `${evidence}phone-2-settled-reading.png` });
  await touch('touchEnd');
  await p.waitForTimeout(800);
  const e = await drop(p);
  assert.ok(e.mode === 'fall' || e.mode === 'strand', `after release: ${e.mode}`);
  assert.ok(Math.abs(e.y - d.y) > 20, 'moving again');
});

await check('phone: dragging the thumb drifts the Drop (floating joystick)', async () => {
  await touch('touchStart', 150, 600);
  for (let i = 1; i <= 8; i++) {
    await touch('touchMove', 150 + i * 9, 600);
    await p.waitForTimeout(30);
  }
  await p.waitForTimeout(500);
  const d = await drop(p);
  await p.screenshot({ path: `${evidence}phone-3-drift.png` });
  await touch('touchEnd');
  assert.ok(d.mode !== 'settle', 'drag is Drift, not settling');
  const inp = await p.evaluate(() => __tt.drop.vx);
  assert.ok(inp > 30 || d.mode === 'strand', `drifting right (vx ${inp.toFixed(1)}, mode ${d.mode})`);
});

await check('phone: Dew adheres and leaves a local bead; Drop lets go and falls', async () => {
  await touch('touchStart', 200, 500);
  await p.waitForTimeout(2200);
  await touch('touchEnd');
  await p.locator('#btn-dew').tap();
  let d = await drop(p);
  assert.equal(d.mode, 'adhered');
  const s1 = await saved(p);
  assert.equal(s1.journey.at(-1).type, 'dew');
  assert.ok(Object.values(s1.dew).flat().length >= 1);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${evidence}phone-4-dew.png` });
  await p.locator('#btn-drop').tap();
  const y0 = (await drop(p)).y;
  await p.waitForTimeout(700);
  d = await drop(p);
  assert.ok(d.mode !== 'adhered' && d.y > y0 + 40, 'fell after Drop');
  const s2 = await saved(p);
  assert.equal(s2.journey.at(-1).type, 'drop');
  assert.ok(s2.journey.every((j) => j.type === 'dew' || j.type === 'drop'), 'nothing else recorded');
});

await check('phone: nothing overlaps or scrolls sideways at 390 px', async () => {
  const boxes = await p.evaluate(() =>
    [...document.querySelectorAll('.actions button, #btn-dew, #btn-drop, #status, .brand')].map((e) => {
      const r = e.getBoundingClientRect();
      return { id: e.id || e.className || e.textContent, x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlap = a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1;
      assert.ok(!overlap, `${a.id} overlaps ${b.id}`);
    }
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(sw <= 0, `horizontal overflow ${sw}px`);
  for (const b of boxes) assert.ok(b.x >= 0 && b.x + b.w <= 390, `${b.id} off screen`);
});

await check('phone: tilt/orientation is never listened to', async () => {
  const types = await p.evaluate(() => window.__listeners);
  assert.ok(!types.some((t) => /deviceorientation|devicemotion/.test(t)), types.join(','));
});

// ---------------- desktop ----------------
const desk = await open({ viewport: { width: 1280, height: 800 } });
const { page: d } = desk;

await check('desktop: changing a relationship re-forms the web and changes the possible path', async () => {
  await d.click('#btn-rel');
  const before = await d.evaluate(() => __tt.world.strands.map((s) => s.id));
  assert.ok(before.includes('r5'));
  await d.click('#btn-demo');
  await d.waitForTimeout(1500);
  const after = await d.evaluate(() => __tt.world.strands.map((s) => s.id));
  assert.ok(!after.includes('r5'), 'strand gone');
  const text = await d.locator('#compare').innerText();
  assert.match(text, /Before: .*\nAfter: .*/);
  assert.match(text, /possible path changed/);
  await d.click('#btn-rel'); // close the sheet to see the web
  await d.waitForTimeout(1500);
  await d.screenshot({ path: `${evidence}desktop-1-relationship-changed.png` });
  await d.click('#btn-rel');
  await d.click('#btn-demo'); // and back on
  await d.waitForTimeout(300);
  assert.ok((await d.evaluate(() => __tt.world.strands.map((s) => s.id))).includes('r5'));
  await d.click('#btn-rel');
});

await check('desktop: keyboard drift, Space to settle, E to Dew, Q to Drop', async () => {
  await d.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await d.keyboard.down('ArrowLeft');
  await d.waitForTimeout(400);
  const vx = (await drop(d)).vx;
  await d.keyboard.up('ArrowLeft');
  assert.ok(vx < -30 || (await drop(d)).mode === 'strand', `vx ${vx}`);
  // Hold Space until it settles beside a work (in a gap it only slows).
  let near = false;
  for (let i = 0; i < 12 && !near; i++) {
    await d.keyboard.down(' ');
    await d.waitForTimeout(1500);
    assert.equal((await drop(d)).mode, 'settle');
    near = await d.locator('#card').isVisible();
    await d.keyboard.up(' ');
    if (!near) await d.waitForTimeout(700);
  }
  assert.ok(near, 'settled beside a work');
  await d.keyboard.press('e');
  const m = (await drop(d)).mode;
  assert.equal(m, 'adhered');
  await d.waitForTimeout(400);
  await d.screenshot({ path: `${evidence}desktop-2-dew-card.png` });
  await d.keyboard.press('q');
  assert.equal((await drop(d)).mode, 'fall');
});

let ideaId;
await check('desktop: enter an idea privately, connect it, meet it in the web', async () => {
  await d.click('#btn-idea');
  await d.fill('#idea-name', 'Gutter that sings when it overflows');
  await d.fill('#idea-text', 'A tuned slot in the downpipe. You hear the overflow before you see it.');
  await d.selectOption('#idea-kind', 'builds on');
  await d.selectOption('#idea-to', 's-barrel');
  await d.click('#form-idea button[type=submit]');
  await d.waitForTimeout(1600);
  const s = await saved(d);
  const w = s.works[0];
  ideaId = w.id;
  assert.equal(w.private, true);
  assert.equal(s.relations[0].from, w.id);
  const st = await drop(d);
  assert.equal(st.mode, 'rest');
  assert.equal(st.anchorId, w.id);
  assert.ok(await d.evaluate((id) => __tt.world.strands.some((x) => x.a === id || x.b === id), w.id), 'its strand is in the web');
  await d.screenshot({ path: `${evidence}desktop-3-idea-in-web.png` });
});

await check('desktop: after reload the idea, its id and connection are still there; edits keep history', async () => {
  await d.reload();
  await d.waitForTimeout(500);
  const s = await saved(d);
  assert.equal(s.works[0].id, ideaId);
  assert.ok(await d.evaluate((id) => __tt.world.nodeById.has(id), ideaId));
  await d.evaluate((id) => __tt.showInWeb(id), ideaId);
  await d.waitForTimeout(400);
  await d.locator('#card button', { hasText: 'Edit' }).click();
  await d.fill('#idea-text', 'A tuned slot in the downpipe, pitched low.');
  await d.click('#form-idea button[type=submit]');
  await d.reload();
  const s2 = await saved(d);
  assert.equal(s2.works[0].history.length, 2);
  assert.equal(s2.works[0].history[0].text, 'A tuned slot in the downpipe. You hear the overflow before you see it.');
});

await check('desktop: the list view reaches the same works and relationships by keyboard', async () => {
  await d.focus('#btn-view');
  await d.keyboard.press('Enter');
  const n = await d.locator('#list article').count();
  const works = await d.evaluate(() => __tt.world.nodes.length);
  assert.equal(n, works);
  assert.ok(await d.locator(`#work-${ideaId}`).isVisible());
  await d.screenshot({ path: `${evidence}desktop-4-list.png` });
  await d.focus('#btn-view');
  await d.keyboard.press('Enter');
});

await check('no network requests beyond loading the page itself', async () => {
  const all = [...phone.requests, ...desk.requests];
  const unexpected = all.filter((r) => !/^GET http:\/\/127\.0\.0\.1:\d+\/(|index\.html|styles\.css|src\/[a-z]+\.js)$/.test(r));
  assert.deepEqual(unexpected, []);
});

await check('no page errors', async () => {
  assert.deepEqual([...phone.errors, ...desk.errors], []);
});

// ---------------- reduced motion ----------------
const calm = await open({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await check('reduced motion: starts with the list, web still available', async () => {
  assert.equal(await calm.page.locator('#list').isVisible(), true);
  assert.equal(await calm.page.locator('#scene').isVisible(), false);
  await calm.page.click('#btn-view');
  assert.equal(await calm.page.locator('#scene').isVisible(), true);
});

await browser.close();
server.kill();
const failed = results.filter((r) => r[0] === 'FAIL');
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed. Screenshots in evidence/.`);
process.exit(failed.length ? 1 : 0);
