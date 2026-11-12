// work/42 (ontologist.1.fringe@PrompTugal.dinis): the graph's own checks, run at each wake (and by anyone):
//   node admin/build/graph-check.mjs            (reads data/; checks _site/ pages too when it has been built)
// It never changes anything; it prints each problem and exits 1 if there is one.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildModel, TYPES, VERBS, GRAMMAR, pathOf } from './graph-model.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const events = (JSON.parse(readFileSync(join(root, 'data/events.json'), 'utf8')).events || []).filter((e) => e.name && /^https:\/\//.test(e.url || '') && e.read_at);
const m = buildModel(root, events);
const bad = [];
const say = (s) => bad.push(s);

// 1. ids unique within each type, and every entity typed
for (const t of TYPES) { const ids = m[t].map((x) => x.id); const dup = ids.filter((id, i) => ids.indexOf(id) !== i); if (dup.length) say(`${t}: duplicate ids ${[...new Set(dup)].join(', ')}`); }
// 2. every verb is in the grammar, with its inverse; no relates_to (Fractal Semantic Graphs, rule 2)
for (const v of Object.keys(VERBS)) if (!GRAMMAR[v]?.inverse) say(`verb ${v} has no inverse`);
const typeOf = (id) => TYPES.map((t) => [t, m.byId[t]]).find(([, M]) => M.has(id))?.[0];
const seen = new Set();
for (const l of m.links) {
  if (!VERBS[l.verb]) { say(`link with unknown verb ${l.verb}`); continue; }
  if (/relate/i.test(l.verb)) say(`a relates_to link: ${l.from} -> ${l.to}`);
  const [ft, tt] = VERBS[l.verb];
  if (!m.byId[ft + 's']?.has(l.from)) say(`${l.verb}: from ${l.from} is not a ${ft}`);
  if (!m.byId[tt + 's']?.has(l.to)) say(`${l.verb}: to ${l.to} is not a ${tt}`);
  // 3. a link from an event's own fields carries that event's source and time read
  if ((ft === 'event' || tt === 'event') && (!/^https:\/\//.test(l.source || '') || !l.read_at)) say(`${l.verb} ${l.from} -> ${l.to}: no source or read_at`);
  const k = `${l.from}|${l.verb}|${l.to}`; if (seen.has(k)) say(`duplicate link ${k}`); seen.add(k);
}
// 4. organisations only: a held organiser never appears; Web Summit is never an organiser here
const held = (JSON.parse(readFileSync(join(root, 'data/graph/organisers.json'), 'utf8')).organisers || []).filter((o) => o.hold).map((o) => o.id);
for (const id of held) if (m.byId.organisers.has(id) || m.links.some((l) => l.from === id || l.to === id)) say(`held organiser ${id} is in the graph`);
for (const o of m.organisers) if (/^web summit\)?$/i.test(o.name.trim())) say(`organiser named ${o.name}`);
// 5. sessions: no title copied from a platform under a hold (work/49)
for (const s of m.sessions) if (/luma\.com/.test(s.url) && !s.title_held) say(`session ${s.id} shows a title read from Luma`);
// 6. every entity's page exists in a built site, and every page it links to (when _site/ is there)
const site = join(root, '_site');
if (existsSync(site)) {
  for (const t of TYPES.filter((t) => t !== 'events')) for (const x of m[t]) { const p = join(site, pathOf(x.type, x.id), 'index.html'); if (!existsSync(p)) say(`no page for ${x.type} ${x.id}`); }
  for (const t of [...TYPES, 'links', 'retired', 'index']) if (!existsSync(join(site, 'api/v1/graph', `${t}.json`))) say(`no /api/v1/graph/${t}.json`);
}
console.log(bad.length ? bad.map((b) => 'FAIL ' + b).join('\n') + `\ngraph-check: ${bad.length} problem(s)` : `graph-check: OK (${TYPES.map((t) => `${m[t].length} ${t}`).join(', ')}, ${m.links.length} links)`);
process.exitCode = bad.length ? 1 : 0;
