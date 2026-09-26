import { describe, expect, it, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { Query, addNote, createShadow, migrate, myShadows, notesFor, publicShadows, removeShadow, report, updateShadow } from './store';

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
    expect('ok' in (await report(q, id, 'spam'))).toBe(true);
    const cols = (await q(`SELECT column_name FROM information_schema.columns WHERE table_name IN ('tt_notes','tt_reports')`)).map((c) => c.column_name);
    expect(cols.some((c) => /sub|name|ip|email/.test(String(c)))).toBe(false);
  });
});
