#!/usr/bin/env node
// Snapshot of pt.news's graph entities that the fringe graph links to (work/05, BRIEF.md §3 item 3).
// Reads a local clone of PrompTugal/PrompTugal__News__Website (public) and writes data/ptnews-index.json:
// companies (with their GAMMA-Ray card), organisations, places and topics, by id and name only.
// People are never read or copied. Run: node admin/tools/ptnews-index.mjs <path to the clone>
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src || !existsSync(join(src, 'data'))) { console.error('usage: ptnews-index.mjs <PrompTugal__News__Website clone>'); process.exit(1); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const one = (kind, file) => readdirSync(join(src, 'data', kind)).sort().flatMap((id) => {
  const f = join(src, 'data', kind, id, file);
  if (!existsSync(f)) return [];
  try { return [JSON.parse(readFileSync(f, 'utf8'))]; } catch { return []; }
});
const uniq = (a) => [...new Set(a.filter(Boolean))];
const companies = one('companies', 'company.json').map((c) => ({
  id: c.id, name: c.name, names: uniq([c.name, ...(c.aliases || []).map((a) => a.name)]), website: c.website || null,
  ...(c.gamma_ray?.card ? { gamma_ray: c.gamma_ray.card } : {}),
}));
const organisations = one('organisations', 'organisation.json').map((o) => ({ id: o.id, name: o.name, names: uniq([o.name, ...(o.names_as_listed || [])]) }));
const places = one('places', 'place.json').map((p) => ({ id: p.id, name: p.name, kind: p.kind || null, names: uniq([p.name, ...(p.matches || [])]) }));
const topics = one('topics', 'topic.json').map((t) => ({ id: t.id, name: t.name }));
const commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD']).toString().trim();
const out = {
  about: "pt.news's companies, organisations, places and topics, by id and name, so the fringe graph links to their pages and to GAMMA-Ray cards. No people. Regenerate with admin/tools/ptnews-index.mjs; never edit by hand.",
  from: { repository: 'PrompTugal/PrompTugal__News__Website', path: 'data/', commit, read_at: new Date().toISOString().slice(0, 16) + 'Z' },
  site: 'https://promptugal.news/',
  companies, organisations, places, topics,
};
writeFileSync(join(root, 'data/ptnews-index.json'), JSON.stringify(out) + '\n');
console.log(`data/ptnews-index.json: ${companies.length} companies (${companies.filter((c) => c.gamma_ray).length} with a GAMMA-Ray card), ${organisations.length} organisations, ${places.length} places, ${topics.length} topics, from ${commit.slice(0, 7)}`);
