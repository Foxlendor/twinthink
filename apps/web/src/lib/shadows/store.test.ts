import { describe, expect, it, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { Query, REPORTS_TO_HIDE, allowSender, addNote, forViewer, getShadow, createShadow, migrate, myShadows, notesFor, publicShadows, removeShadow, report, updateShadow } from './store';

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
    expect((await getShadow(q, story.id))!.sparks).toBe(1);
    // only a story can spark, and only one that is still told
    expect('error' in (await createShadow(q, ben, { title: 'x', from: idea.shadow!.id }))).toBe(true);
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
