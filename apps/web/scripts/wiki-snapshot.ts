// Take a snapshot of real Wikipedia and DBpedia answers for the Fall's preview examples: the five
// starts and two steps on from each, so previews move without waiting on DBpedia's public endpoint.
// Past the snapshot's edge the Fall asks the sources live, in the visitor's browser.
//
// Run: npx jiti scripts/wiki-snapshot.ts [out.json]
// Gentle: one DBpedia query and one Wikipedia request at a time, with a pause between. Resumable:
// answers already in the output file are kept. Long dashes in any text are written as \u escapes
// in the JSON (the site's no-dashes rule), and undashed again where the text is shown.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chooseOpenings } from '../src/lib/fall/graph';
import { Row, Snapshot, Summary, WIKI_STARTS, fetchRows, fetchSummary, strandsFrom, wikiId } from '../src/lib/fall/wiki';

const out = process.argv[2] ?? 'public/fall/wiki-snapshot.json';
const snap: Snapshot = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : { taken: '', nodes: {} };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// fetch through curl (it follows this machine's proxy settings)
const curlFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const args = ['-s', '-m', '120', '-w', '\n%{http_code}', '-A', 'TwinThink-preview/0.1 (https://twinth.ink)'];
  for (const [k, v] of Object.entries((init?.headers as Record<string, string>) ?? {})) args.push('-H', `${k}: ${v}`);
  args.push(url);
  const raw = execFileSync('curl', args, { maxBuffer: 64 << 20 }).toString('utf8');
  const cut = raw.lastIndexOf('\n');
  const status = Number(raw.slice(cut + 1));
  return new Response(raw.slice(0, cut), { status: status || 599 });
};

const save = () => {
  snap.taken = new Date().toISOString().slice(0, 10);
  writeFileSync(out, JSON.stringify(snap).replace(/\u2013/g, '\\u2013').replace(/\u2014/g, '\\u2014'));
};
const local = (id: string) => id.slice('sample/wiki/'.length);

async function rows(id: string): Promise<Row[] | undefined> {
  const k = local(id);
  if (snap.nodes[k]?.rows) return snap.nodes[k].rows;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetchRows(id, curlFetch);
      // the strongest few dozen are plenty for a place's openings
      const kept = r.sort((a, b) => b.in.length + b.out.length - (a.in.length + a.out.length) || b.shared - a.shared).slice(0, 40);
      snap.nodes[k] = { ...snap.nodes[k], rows: kept };
      save();
      await sleep(1500);
      return kept;
    } catch (e) {
      console.log('retry', k, String(e));
      await sleep(8000);
    }
  }
  return undefined;
}

async function summary(id: string): Promise<Summary | undefined> {
  const k = local(id);
  if (snap.nodes[k]?.summary) return snap.nodes[k].summary;
  try {
    const s = await fetchSummary(id, curlFetch);
    snap.nodes[k] = { ...snap.nodes[k], summary: s };
    save();
    await sleep(1200);
    return s;
  } catch (e) {
    console.log('no summary', k, String(e));
    await sleep(4000);
    return undefined;
  }
}

const level: string[][] = [WIKI_STARTS.map(wikiId)];
for (let depth = 0; depth < 3; depth++) {
  const next: string[] = [];
  for (const id of level[depth]) {
    await summary(id);
    if (depth === 2) continue;
    const r = await rows(id);
    if (!r) continue;
    for (const s of chooseOpenings(strandsFrom(r))) next.push(s.to);
    console.log(depth, local(id), Object.keys(snap.nodes).length);
  }
  level.push([...new Set(next)]);
}
// the second step's own ways on, so the first two steps each show where they lead
for (const id of level[2]) {
  await rows(id);
  console.log(2, local(id), Object.keys(snap.nodes).length);
}
save();
console.log('done', Object.keys(snap.nodes).length);
