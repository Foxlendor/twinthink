#!/usr/bin/env node
// Builds the continuity record for TwinThink's own Twin from this repository's
// real git history.
//
// Privacy rule: commit messages are only used locally to *classify* a change.
// They are never written to the output. The output contains timestamps, short
// hashes, a category, and an event kind — nothing else.
//
// Usage: node scripts/build_twinthink_continuity.mjs
// (needs full history: git fetch --depth=2000 origin master)

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'apps/web/src/lib/shadowfield/sources/twinthink-continuity.json');

const raw = execSync('git log --no-merges --reverse --format=%H%x09%aI%x09%s', { cwd: root, encoding: 'utf8' });

// Ordered: first match wins.
const BRANCHES = [
  ['canvas', /canvas|shadow|semantic zoom|filament|lens/i],
  ['tooling', /\bcli\b|mcp|tooling|tt-wrap/i],
  ['rights', /crypto|identity|capabilit|key|revocation|signed|security|authoriz|access control|dark capsule/i],
  ['disclosure', /private|privacy|disclos|public preview|publication|sanitiz|approval|anonymi|unapproved|remove personal|gate /i],
  ['graph', /bom|product graph|hierarch|m2\b/i],
  ['engine', /simulat|telemetry|calibrat|reality|schema|thermo|scenario|provenance|evidence|journal/i],
  ['mark', /brand|favicon|logo|icon|mark\b|typograph/i],
  ['deploy', /deploy|vercel|render|api url|requirements|peer dependency|license|upload test|production/i],
  ['surface', /./],
];

function kindOf(subject) {
  if (/^test/i.test(subject) || /\btests?\b/i.test(subject)) return 'experiment';
  if (/remove|purge|wipe|strip|clean up|obsolete|anonymi|gate /i.test(subject)) return 'prune';
  if (/^fix|\bfix\b|resolve|repair|eliminate/i.test(subject)) return 'repair';
  return 'change';
}

const commits = raw
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [hash, date, subject] = line.split('\t');
    if (/^chore: merge|^merge/i.test(subject)) return null;
    const branch = BRANCHES.find(([, re]) => re.test(subject))[0];
    return { h: hash.slice(0, 7), t: date, b: branch, k: kindOf(subject) };
  })
  .filter(Boolean);

writeFileSync(out, JSON.stringify({ generated: new Date().toISOString(), commits }, null, 1) + '\n');
console.log(`wrote ${commits.length} commits to ${path.relative(root, out)}`);
