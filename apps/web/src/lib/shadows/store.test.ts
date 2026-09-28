import { describe, expect, it, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import {
  Query,
  REPORTS_TO_HIDE,
  shadowFor,
  resonance,
  resonate,
  addMedia,
  keep,
  myKeeps,
  unkeep,
  allowSender,
  getPicture,
  addNote,
  forViewer,
  getShadow,
  createShadow,
  migrate,
  myShadows,
  notesFor,
  publicShadows,
  removeShadow,
  report,
  updateShadow,
  createFork,
  forksIn,
  moveFork,
  setForkClosed,
  canPostInFork,
  joinFork,
  roomFor,
  FORK_ROOM_MAX,
} from './store';

let q: Query;
const ana = { sub: 'g-ana', name: 'Ana Maria Lopez' };
const ben = { sub: 'g-ben', name: 'Ben' };

beforeEach(async () => {
  const db = new PGlite();
  q = async (text, params = []) => (await db.query(text, params)).rows as Record<string, unknown>[];
  await migrate(q);
  await migrate(q); // twice is harmless
});

describe('shared Shadows', () => {
  it('are private until their maker makes them public', async () => {
    const r = await createShadow(q, ana, { title: 'a kite of paper', body: 'it flies in no wind' });
    expect(r.shadow!.public).toBe(false);
    expect(await publicShadows(q)).toHaveLength(0);
    expect((await myShadows(q, ana.sub)).map((s) => s.title)).toEqual(['a kite of paper']);
    const id = r.shadow!.id;
    const u = await updateShadow(q, ana, id, { public: true });
    expect(u.shadow!.public).toBe(true);
    const pub = await publicShadows(q);
    expect(pub.map((s) => [s.title, s.by])).toEqual([['a kite of paper', 'Ana']]);
  });

  it('only their maker can change or remove them; the site owner can only take them down', async () => {
    const r = await createShadow(q, ana, { title: 'mine', public: true });
    const id = r.shadow!.id;
    expect('error' in (await updateShadow(q, ben, id, { title: 'stolen' }))).toBe(true);
    expect('error' in (await removeShadow(q, ben, id, false))).toBe(true);
    expect('ok' in (await removeShadow(q, ben, id, true))).toBe(true); // site owner hides it
    expect(await publicShadows(q)).toHaveLength(0);
    expect(await myShadows(q, ana.sub)).toHaveLength(1); // still hers
    expect('ok' in (await removeShadow(q, ana, id, false))).toBe(true);
    expect(await myShadows(q, ana.sub)).toHaveLength(0);
  });

  it('refuses empty or oversized work, and more than a day’s worth', async () => {
    expect('error' in (await createShadow(q, ana, { title: '  ' }))).toBe(true);
    expect('error' in (await createShadow(q, ana, { title: 'x'.repeat(121) }))).toBe(true);
    expect('error' in (await createShadow(q, ana, { title: 'ok', body: 'y'.repeat(2001) }))).toBe(true);
    for (let i = 0; i < 20; i++) expect('shadow' in (await createShadow(q, ben, { title: `t${i}` }))).toBe(true);
    expect('error' in (await createShadow(q, ben, { title: 'one too many' }))).toBe(true);
  });

  it('keeps notes and reports without anyone’s name', async () => {
    const r = await createShadow(q, ana, { title: 'open', public: true });
    const id = r.shadow!.id;
    await addNote(q, `p/${id}`, 'this stayed with me');
    expect((await notesFor(q, `p/${id}`)).map((n) => n.text)).toEqual(['this stayed with me']);
    expect('ok' in (await report(q, ben.sub, id, 'spam'))).toBe(true);
    const cols = (await q(`SELECT column_name FROM information_schema.columns WHERE table_name IN ('tt_notes','tt_reports')`)).map((c) => c.column_name);
    expect(cols.some((c) => /sub|name|ip|email/.test(String(c)))).toBe(false);
  });
});

describe('story time', () => {
  it('is told to everyone without a name, and cannot be rewritten', async () => {
    const r = await createShadow(q, ana, { kind: 'story', body: 'The day the kettle broke I boiled water in a paper cup.\nIt worked.' });
    const s = r.shadow!;
    expect(s.kind).toBe('story');
    expect(s.public).toBe(true);
    expect(s.title).toBe('The day the kettle broke I boiled water in a paper cup.');
    const seen = forViewer((await publicShadows(q))[0], ben.sub);
    expect(seen.by).toBe('');
    expect(seen.mine).toBe(false);
    expect(JSON.stringify(seen)).not.toContain('Ana');
    expect(forViewer(s, ana.sub).mine).toBe(true);
    expect('error' in (await updateShadow(q, ana, s.id, { body: 'rewritten' }))).toBe(true);
    expect('ok' in (await removeShadow(q, ana, s.id, false))).toBe(true);
  });

  it('refuses a story too short to be one', async () => {
    expect('error' in (await createShadow(q, ana, { kind: 'story', body: 'hi' }))).toBe(true);
  });

  it('counts the ideas a story sparks', async () => {
    const story = (await createShadow(q, ana, { kind: 'story', body: 'I fixed a bike chain with a paperclip and some tape.' })).shadow!;
    const idea = await createShadow(q, ben, { title: 'a chain link you can bend by hand', from: story.id });
    expect(idea.shadow!.from).toBe(story.id);
    expect(idea.shadow!.public).toBe(false);
    // what grew is counted once it is shared
    expect((await getShadow(q, story.id))!.sparks).toBe(0);
    await updateShadow(q, ben, idea.shadow!.id, { public: true });
    expect((await getShadow(q, story.id))!.sparks).toBe(1);
    // only what is still shared can be built on
    const kept = (await createShadow(q, ana, { title: 'not shared' })).shadow!;
    expect('error' in (await createShadow(q, ben, { title: 'x', from: kept.id }))).toBe(true);
  });

  it('hides what enough different people report, once each', async () => {
    const s = (await createShadow(q, ana, { kind: 'story', body: 'A story that some people will not like at all.' })).shadow!;
    for (let i = 0; i < 5; i++) await report(q, ben.sub, s.id, 'no');
    expect(await publicShadows(q)).toHaveLength(1); // one person, counted once
    for (let i = 0; i < REPORTS_TO_HIDE - 1; i++) await report(q, `g-other${i}`, s.id, 'no');
    expect(await publicShadows(q)).toHaveLength(0);
    expect(await myShadows(q, ana.sub)).toHaveLength(1); // still its teller's
  });
});

describe('limits that hold', () => {
  it('counts posts let go toward the day, too', async () => {
    for (let i = 0; i < 20; i++) {
      const r = await createShadow(q, ben, { title: `t${i}` });
      await removeShadow(q, ben, r.shadow!.id, false);
    }
    expect('error' in (await createShadow(q, ben, { title: 'one too many' }))).toBe(true);
  });

  it('does not let reports from before sign-in hide anything', async () => {
    const s = (await createShadow(q, ana, { title: 'shared', public: true })).shadow!;
    for (let i = 0; i < 5; i++) await q(`INSERT INTO tt_reports (shadow_id, reason) VALUES ($1, 'old')`, [s.id]);
    await report(q, ben.sub, s.id, 'no');
    expect(await publicShadows(q)).toHaveLength(1);
  });

  it('tells only its maker that something was taken down', async () => {
    const s = (await createShadow(q, ana, { title: 'shared', public: true })).shadow!;
    await removeShadow(q, ben, s.id, true);
    const mine = (await myShadows(q, ana.sub))[0];
    expect(forViewer(mine, ana.sub).hidden).toBe(true);
    expect('hidden' in forViewer(mine, ben.sub)).toBe(false);
  });

  it('limits anonymous notes from one sender in an hour', async () => {
    for (let i = 0; i < 10; i++) expect(await allowSender(q, '1.2.3.4')).toBe(true);
    expect(await allowSender(q, '1.2.3.4')).toBe(false);
    expect(await allowSender(q, '5.6.7.8')).toBe(true);
  });
});

describe('build on it', () => {
  it('builds on anything shared, keeps it private, and credits back along the chain', async () => {
    const lamp = (await createShadow(q, ana, { title: 'a lamp that listens', public: true })).shadow!;
    const mine = (await createShadow(q, ben, { title: 'a lamp that hums back', from: lamp.id })).shadow!;
    expect(mine.public).toBe(false);
    expect(mine.parent).toEqual({ title: 'a lamp that listens', kind: 'shadow', by: 'Ana' });
    // a private one grows nothing visible, and cannot be built on
    const hidden = (await createShadow(q, ana, { title: 'not yet' })).shadow!;
    expect('error' in (await createShadow(q, ben, { title: 'x', from: hidden.id }))).toBe(true);
    // what grew is counted only once it is shared
    expect((await getShadow(q, lamp.id))!.sparks).toBe(0);
    await updateShadow(q, ben, mine.id, { public: true });
    expect((await getShadow(q, lamp.id))!.sparks).toBe(1);
  });

  it('never names who told a story, even through what it sparked', async () => {
    const story = (await createShadow(q, ana, { kind: 'story', body: 'The kettle broke so I used a paper cup and it worked.' })).shadow!;
    const idea = (await createShadow(q, ben, { title: 'a cup that boils', from: story.id })).shadow!;
    expect(idea.parent).toEqual({ title: story.title, kind: 'story', by: '' });
    expect(JSON.stringify(forViewer(idea, ben.sub))).not.toContain('Ana');
  });
});

describe('shared by link', () => {
  it('is seen by whoever has its link, and never shown on the Slate', async () => {
    const s = (await createShadow(q, ana, { title: 'a note for a friend' })).shadow!;
    expect(await shadowFor(q, s.id, ben.sub)).toBeNull();
    const u = await updateShadow(q, ana, s.id, { visibility: 'unlisted' });
    expect(u.shadow!.public).toBe(false);
    expect(u.shadow!.unlisted).toBe(true);
    expect(forViewer(u.shadow!, ana.sub).visibility).toBe('unlisted');
    expect((await shadowFor(q, s.id, ben.sub))!.title).toBe('a note for a friend');
    expect(await shadowFor(q, s.id, undefined)).not.toBeNull();
    expect(await publicShadows(q)).toHaveLength(0);
    // it cannot be built on until it is shared with everyone
    expect('error' in (await createShadow(q, ben, { title: 'x', from: s.id }))).toBe(true);
    // shared with everyone, then kept again: no link opens it
    expect((await updateShadow(q, ana, s.id, { visibility: 'public' })).shadow!.unlisted).toBe(false);
    await updateShadow(q, ana, s.id, { visibility: 'private' });
    expect(await shadowFor(q, s.id, ben.sub)).toBeNull();
    expect(await shadowFor(q, s.id, ana.sub)).not.toBeNull();
  });

  it('closes when taken down, even to those with the link', async () => {
    const s = (await createShadow(q, ana, { title: 'by link' })).shadow!;
    await updateShadow(q, ana, s.id, { visibility: 'unlisted' });
    await removeShadow(q, ben, s.id, true);
    expect(await shadowFor(q, s.id, ben.sub)).toBeNull();
  });
});

describe('pictures and films', () => {
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const HOST = 'abc123.public.blob.vercel-storage.com';
  const film = (id: string) => `https://${HOST}/films/${id}/a-XYZ.mp4`;

  it('only its maker adds them; a private Shadow’s pictures are seen by its maker alone', async () => {
    const s = (await createShadow(q, ana, { title: 'a chair' })).shadow!;
    expect('error' in (await addMedia(q, ben, s.id, { kind: 'image', data: PNG }))).toBe(true);
    const r = await addMedia(q, ana, s.id, { kind: 'image', data: PNG, aspect: 1 });
    const src = r.shadow!.media[0].src;
    expect(src).toMatch(/^\/api\/media\/[a-z0-9]+$/);
    const mid = src.split('/').pop()!;
    expect(await getPicture(q, mid, ben.sub)).toBeNull();
    expect((await getPicture(q, mid, ana.sub))!.mime).toBe('image/png');
    await updateShadow(q, ana, s.id, { public: true });
    const open = await getPicture(q, mid, undefined);
    expect(open!.open).toBe(true);
    expect(open!.bytes.length).toBeGreaterThan(10);
  });

  it('takes films only from the site’s own file store, and refuses what is not a picture', async () => {
    const s = (await createShadow(q, ana, { title: 'a dance' })).shadow!;
    expect('error' in (await addMedia(q, ana, s.id, { kind: 'video', url: 'https://evil.example/x.mp4' }, HOST))).toBe(true);
    // another store, or another Shadow's film in this one, is never taken
    expect('error' in (await addMedia(q, ana, s.id, { kind: 'video', url: `https://other9.public.blob.vercel-storage.com/films/${s.id}/a.mp4` }, HOST))).toBe(true);
    expect('error' in (await addMedia(q, ana, s.id, { kind: 'video', url: film('someoneelse') }, HOST))).toBe(true);
    expect('error' in (await addMedia(q, ana, s.id, { kind: 'image', data: 'data:text/html;base64,PHNjcmlwdD4=' }))).toBe(true);
    const r = await addMedia(q, ana, s.id, { kind: 'video', url: film(s.id), aspect: 16 / 9, poster: PNG }, HOST);
    expect(r.shadow!.media[0]).toMatchObject({ kind: 'video', src: film(s.id) });
    expect(r.shadow!.media[0].kind === 'video' && r.shadow!.media[0].poster).toMatch(/^\/api\/media\//);
  });

  it('holds at most six, and lets its films go with it', async () => {
    const s = (await createShadow(q, ana, { title: 'many' })).shadow!;
    // even all at once, no more than six
    const tries = await Promise.all(Array.from({ length: 9 }, () => addMedia(q, ana, s.id, { kind: 'image', data: PNG })));
    expect(tries.filter((t) => 'shadow' in t)).toHaveLength(6);
    const left = await q(`SELECT COUNT(*)::int AS n FROM tt_media WHERE shadow_id = $1`, [s.id]);
    expect(Number(left[0].n)).toBe(6);
    const v = (await createShadow(q, ana, { title: 'films' })).shadow!;
    await addMedia(q, ana, v.id, { kind: 'video', url: film(v.id) }, HOST);
    const gone = await removeShadow(q, ana, v.id, false);
    // only its own films are let go from the store (the store is named by the site's token)
    expect('films' in gone).toBe(true);
  });
});

describe('today’s word', () => {
  it('an answer is shared with the others and remembers its day', async () => {
    const r = (await createShadow(q, ana, { title: 'a hinge for a door that is not there', answer: true })).shadow!;
    expect(r.public).toBe(true);
    expect(r.day).toBe(new Date().toISOString().slice(0, 10));
    const plain = (await createShadow(q, ana, { title: 'just a thought' })).shadow!;
    expect(plain.day).toBeNull();
    // a story is never an answer
    const story = (await createShadow(q, ana, { kind: 'story', body: 'A story told on the day of the word, not an answer.', answer: true })).shadow!;
    expect(story.day).toBeNull();
  });
});

describe('sketchbooks', () => {
  it('keeps places on the Canvas once each, newest first, and lets them go', async () => {
    await keep(q, ana.sub, 'music/crhymes');
    await keep(q, ana.sub, 'p/abc123');
    await keep(q, ana.sub, 'music/crhymes');
    expect((await myKeeps(q, ana.sub)).sort()).toEqual(['music/crhymes', 'p/abc123']);
    expect(await myKeeps(q, ben.sub)).toEqual([]);
    await unkeep(q, ana.sub, 'p/abc123');
    expect(await myKeeps(q, ana.sub)).toEqual(['music/crhymes']);
  });

  it('never keeps what lives on a device, or a copy of a copy', async () => {
    expect('error' in (await keep(q, ana.sub, 'local/xyz'))).toBe(true);
    expect('error' in (await keep(q, ana.sub, 'k/music'))).toBe(true);
    expect('error' in (await keep(q, ana.sub, '<script>'))).toBe(true);
  });
});

describe('resonance', () => {
  it('comes only from people who return on another day; a crowd passing once does nothing', async () => {
    for (let i = 0; i < 30; i++) await resonate(q, 'music/a', `once${i}`, '2026-09-20');
    expect(await resonance(q, '2026-09-27')).toEqual({});
    await resonate(q, 'music/a', 'ana', '2026-09-20');
    await resonate(q, 'music/a', 'ana', '2026-09-20');
    expect(await resonance(q, '2026-09-27')).toEqual({});
    await resonate(q, 'music/a', 'ana', '2026-09-24');
    const one = (await resonance(q, '2026-09-27'))['music/a'];
    expect(one).toBeGreaterThan(0);
    await resonate(q, 'music/a', 'ben', '2026-09-21');
    await resonate(q, 'music/a', 'ben', '2026-09-26');
    expect((await resonance(q, '2026-09-27'))['music/a']).toBeGreaterThan(one);
    expect((await resonance(q, '2026-09-27'))['music/a']).toBeLessThan(1);
  });

  it('keeps only a one-way mark of who, and lets go after a season', async () => {
    await resonate(q, 'x', 'g-secret-account', '2026-01-01');
    const rows = await q(`SELECT * FROM tt_resonance`);
    expect(JSON.stringify(rows)).not.toContain('g-secret-account');
    await resonate(q, 'x', 'g-secret-account', '2026-01-05');
    expect(await resonance(q, '2026-09-27')).toEqual({});
  });
});

describe('forks', () => {
  it('only its maker opens one, and it is seen by whoever may see the Shadow it is in', async () => {
    const home = (await createShadow(q, ana, { title: 'a lamp that listens' })).shadow!;
    expect('error' in (await createFork(q, ben, home.id, { title: 'wiring' }))).toBe(true);
    const f = (await createFork(q, ana, home.id, { title: 'wiring', postAccess: 'anyone' })).fork!;
    expect(f.mine).toBe(true);
    const seenByOther = (await forksIn(q, home.id, ben.sub))[0];
    expect(seenByOther.mine).toBe(false);
    expect(seenByOther.inviteLink).toBeUndefined();
    expect(seenByOther.title).toBe('wiring');
  });

  it('an invite-only fork opens to no one until let in, and its link never leaves its maker', async () => {
    const home = (await createShadow(q, ana, { title: 'a lamp that listens' })).shadow!;
    const f = (await createFork(q, ana, home.id, { title: 'just us' })).fork!;
    expect(f.postAccess).toBe('invite');
    expect(f.inviteLink).toBeTruthy();
    expect((await forksIn(q, home.id, ben.sub))[0].inviteLink).toBeUndefined();
    expect(await canPostInFork(q, f.id, ben.sub)).toBe(false);
    expect('error' in (await joinFork(q, f.id, 'wrong-token', ben.sub))).toBe(true);
    expect('ok' in (await joinFork(q, f.id, f.inviteLink!, ben.sub))).toBe(true);
    expect(await canPostInFork(q, f.id, ben.sub)).toBe(true);
    // its own maker may always post inside it, invited or not
    expect(await canPostInFork(q, f.id, ana.sub)).toBe(true);
  });

  it('a post made inside a fork still starts private, the same as anywhere else', async () => {
    const home = (await createShadow(q, ana, { title: 'a lamp that listens' })).shadow!;
    const f = (await createFork(q, ana, home.id, { title: 'just us' })).fork!;
    await joinFork(q, f.id, f.inviteLink!, ben.sub);
    const posted = await createShadow(q, ben, { title: 'a wire I tried', forkId: f.id });
    expect(posted.shadow!.public).toBe(false);
    expect(posted.shadow!.forkId).toBe(f.id);
    expect(forViewer(posted.shadow!, ben.sub).forkId).toBe(f.id);
    // ana cannot post there simply by being told the fork's id without the link
    const stranger = { sub: 'g-carl', name: 'Carl' };
    expect('error' in (await createShadow(q, stranger, { title: 'butting in', forkId: f.id }))).toBe(true);
  });

  it('closing keeps what is inside; moving carries it, untouched, to another Shadow of the same maker', async () => {
    const homeA = (await createShadow(q, ana, { title: 'lamp A' })).shadow!;
    const homeB = (await createShadow(q, ana, { title: 'lamp B' })).shadow!;
    const f = (await createFork(q, ana, homeA.id, { title: 'notes', postAccess: 'anyone' })).fork!;
    await createShadow(q, ben, { title: 'a note left inside', forkId: f.id });
    expect('error' in (await setForkClosed(q, ben, f.id, true))).toBe(true);
    const closed = (await setForkClosed(q, ana, f.id, true)).fork!;
    expect(closed.closed).toBe(true);
    // closed: no new posts, but what is already there is untouched
    expect('error' in (await createShadow(q, ben, { title: 'too late', forkId: f.id }))).toBe(true);
    const bensOwn = (await createShadow(q, ben, { title: 'a Shadow of ben’s' })).shadow!;
    expect('error' in (await moveFork(q, ben, f.id, homeB.id))).toBe(true);
    expect('error' in (await moveFork(q, ana, f.id, bensOwn.id))).toBe(true);
    const moved = (await moveFork(q, ana, f.id, homeB.id)).fork!;
    expect(moved.hostShadowId).toBe(homeB.id);
    expect((await forksIn(q, homeA.id, ana.sub)).length).toBe(0);
    expect((await forksIn(q, homeB.id, ana.sub))[0].title).toBe('notes');
  });

  it('never opens past its maker’s room', async () => {
    const home = (await createShadow(q, ana, { title: 'a lamp that listens' })).shadow!;
    for (let i = 0; i < FORK_ROOM_MAX; i++) expect('fork' in (await createFork(q, ana, home.id, { title: `t${i}` }))).toBe(true);
    expect('error' in (await createFork(q, ana, home.id, { title: 'one too many' }))).toBe(true);
    expect((await roomFor(q, ana.sub)).room).toBe(0);
  });
});
