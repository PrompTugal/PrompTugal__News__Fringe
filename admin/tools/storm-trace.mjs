#!/usr/bin/env node
// A snapshot of the Storm Charles team's trace (WS-214, incident.conductor@web-summit.dinis), for /graph/trace/.
// Reads their public site over HTTPS (https://storm-charles.promptugal.news, repo PrompTugal/PrompTugal__News__Storm-Charles):
// data/trace/index.json and every file it lists, data/trace/units.json, models/calls/index.json and every file it lists
// (text-free: no prompt, no answer), library/altitudes.json and api/v1/index.json. Writes data/storm-trace.json (<= 256 KB):
// spans paired from start/end, steps and model calls folded into buckets, each agent's sessions and altitude, the sha256,
// size and read time of every source file, and where their data differs from our swarm-flows schema
// (data/elastic-export-swarm-flows.json). No model text is read into the snapshot; no model is called.
// trace.view.fringe@PrompTugal.angelo for conductor.fringe@PrompTugal.angelo, 11 November 2026 (WS-215).
// Run: NODE_USE_ENV_PROXY=1 node admin/tools/storm-trace.mjs   (the proxy variable only where HTTPS goes through a proxy)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = 'https://storm-charles.promptugal.news/';
const MAX = 256 * 1024;
const STEP_BUCKET = 600;   // seconds: A3 steps (commits, messages) folded per agent per 10 minutes
const CALL_BUCKET = 300;   // seconds: model calls folded per agent per 5 minutes

const files = [];   // every source file read: path, url, bytes, sha256, read_at, and the sha256 their index gave
async function get(path, listed) {
  const url = BASE + path;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'lisbon-fringe-storm-trace/1' } });
      const read_at = new Date().toISOString();
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const sha256 = createHash('sha256').update(buf).digest('hex');
      const f = { path, url, bytes: buf.length, sha256, read_at };
      if (listed?.sha256) f.index_sha256_matches = listed.sha256 === sha256;
      files.push(f);
      return { json: JSON.parse(buf.toString('utf8')), fi: files.length - 1 };
    } catch (e) {
      if (attempt === 3) { files.push({ path, url, error: String(e.message || e), read_at: new Date().toISOString() }); return null; }
      await new Promise((ok) => setTimeout(ok, 500 * attempt));
    }
  }
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

const api = await get('api/v1/index.json');
const traceIndex = await get('data/trace/index.json');
const unitsF = await get('data/trace/units.json');
const callsIndex = await get('models/calls/index.json');
const altsF = await get('library/altitudes.json');
if (!traceIndex || !unitsF) { console.error('could not read their trace index or units: nothing written'); process.exit(1); }
const traceFiles = await pool(traceIndex.json.files || [], 6, (f) => get(f.path, f));
const callFiles = callsIndex ? await pool(callsIndex.json.files || [], 6, (f) => get(f.path, f)) : [];
const READ_AT = new Date().toISOString().slice(0, 19) + 'Z';

// --- the trace docs, in seq order ---
const docs = []; const seen = new Set();
for (const t of traceFiles) if (t) for (const d of t.json.docs || []) {
  const k = `${d.seq}|${d.span_id}|${d.phase}`;
  if (seen.has(k)) continue; seen.add(k); docs.push({ ...d, _fi: t.fi });
}
docs.sort((a, b) => (a.seq - b.seq) || a.at.localeCompare(b.at));
const calls = new Map();
for (const c of callFiles) if (c) for (const x of c.json.calls || []) if (!calls.has(x.id)) calls.set(x.id, { ...x, _fi: c.fi });

const units = unitsF.json.units || [];
const altAgents = new Map((altsF?.json.agents || []).map((a) => [a.agent, a]));
const ms = (s) => Date.parse(s);
const sessionsOf = (u) => (u.sessions || []).map((s) => [s.started_at || s.first_commit_at, s.last_commit_at, s.n, s.commits || 0]).filter((s) => s[0] && s[1]);
const times = [...docs.map((d) => ms(d.at)), ...units.flatMap((u) => sessionsOf(u).flatMap((s) => [ms(s[0]), ms(s[1])])), ...[...calls.values()].map((c) => ms(c.at))].filter(Number.isFinite);
const T0 = Math.floor(Math.min(...times) / 3600000) * 3600000, T1 = Math.max(...times);
const sec = (s) => Math.round((ms(s) - T0) / 100) / 10;   // seconds from t0, one decimal

// --- strings, shared ---
const strs = [], strIx = new Map();
const S = (s) => { if (s == null || s === '') return -1; s = String(s); if (s.length > 90) s = s.slice(0, 89) + '…'; if (!strIx.has(s)) { strIx.set(s, strs.length); strs.push(s); } return strIx.get(s); };

// --- agents (lanes): every runner in the trace or the calls, and every A3 unit with a session ---
const agentIx = new Map(), agents = [];
const unitByName = new Map(units.filter((u) => u.altitude === 'A3').map((u) => [u.name, u]));
const agentOf = (name) => {
  if (!name) return -1;
  if (agentIx.has(name)) return agentIx.get(name);
  const u = unitByName.get(name), a = altAgents.get(name);
  const inside = a?.inside || {};
  const crosses = (inside.A0_compute || []).filter((x) => x.crosses).length + (inside.A1_calls || []).filter((x) => x.crosses).length + (inside.A2_loops || []).filter((x) => x.crosses).length;
  agents.push({ id: name, name: name.replace(/@web-summit\.dinis$/, ''), alt: u?.altitude || a?.altitude?.value || 'A3',
    role: a?.role || null, runtime: u?.runtime || a?.runtime?.value || null, io: u?.io_level || a?.io?.level || null,
    account: u?.account || null, parent: u?.parent_id || null, keys: (u?.keys || []).length,
    sessions: u ? sessionsOf(u).map(([s, e, n, c]) => [sec(s), sec(e), n, c]) : [],
    inside: a ? { a2: (inside.A2_loops || []).length, a1: (inside.A1_calls || []).length, a0: (inside.A0_compute || []).length, crosses } : null,
    altitude_label: a?.altitude?.label || null, grant: a?.session_grant?.altitude || null, n: { spans: 0, steps: 0, calls: 0 } });
  agentIx.set(name, agents.length - 1); return agents.length - 1;
};
for (const u of units) if (u.altitude === 'A3' && sessionsOf(u).length) agentOf(u.name);

// --- spans: a start and its end, by unit_id and span_id ---
const ALTS = ['A4', 'A3', 'A2', 'A1', 'A0'];
const open = new Map(), spans = []; let endsWithoutStart = 0;
const steps = new Map();   // agent|bucket -> [commits, messages, other]
const a2steps = new Map();
const kindOf = (n) => /^commit\b/i.test(n || '') ? 0 : /^msg to\b/i.test(n || '') ? 1 : 2;
for (const d of docs) {
  const a = agentOf(d.runner), key = `${d.unit_id}|${d.span_id}`;
  if (d.phase === 'start' && d.altitude !== 'A3') { open.set(key, d); continue; }
  if (d.phase === 'end') {
    const s = open.get(key);
    if (!s) { endsWithoutStart++; continue; }
    open.delete(key); spans.push([s, d]); continue;
  }
  if (d.altitude === 'A2') { a2steps.set(d.unit_id, (a2steps.get(d.unit_id) || 0) + 1); continue; }
  // A3 steps and session starts: folded into 10-minute buckets per agent
  const b = Math.floor(sec(d.at) / STEP_BUCKET), k = `${a}|${b}`;
  const row = steps.get(k) || [0, 0, 0]; row[d.phase === 'start' ? 2 : kindOf(d.name)]++; steps.set(k, row);
  agents[a].n.steps++;
}
const spanRows = [];
const detailNote = (s, e) => {
  if (s.altitude === 'A2') {
    const m = (s.detail?.models || []).join(', '), x = e?.detail || {};
    return [m && `models: ${m}`, x.calls != null && `${x.calls} calls`, x.agreed != null && (x.agreed ? 'agreed' : 'did not agree'), a2steps.get(s.unit_id) && `${a2steps.get(s.unit_id)} attempts`].filter(Boolean).join('; ');
  }
  return String(e?.note || s.note || '').replace(/, measured session s-[0-9a-f]+$/, '');   // the ledger's session id: not needed here
};
const nameOf = (s, e) => {
  if (s.altitude === 'A2') return s.name || (s.detail?.task ? `loop: ${s.detail.task}` : s.flow);
  if (s.altitude === 'A0') {   // "ci run 1164 v0.1.1164" + "ci run 1164 success": the version is v0.1.<run>, so it is said once
    const n = String(s.name || s.unit_id).replace(/^ci run (\d+) v0\.1\.\1$/, 'ci run {n}');
    return e?.name && e.name !== s.name ? `${n} → ${String(e.name).split(' ').pop()}` : n;
  }
  return s.name || e?.name || s.unit_id;
};
const runNo = (s) => { const m = s.altitude === 'A0' && String(s.name || '').match(/^ci run (\d+) v0\.1\.\1$/); return m ? [Number(m[1])] : []; };   // fills {n} in the name
for (const [s, e] of spans) {
  const a = agentOf(s.runner); agents[a].n.spans++;
  const st = sec(s.at), dur = Math.max(0, Math.round((ms(e.at) - ms(s.at)) / 100) / 10);
  const cost = e.cost_usd ?? s.cost_usd ?? e.detail?.cost_usd;
  spanRows.push([a, ALTS.indexOf(s.altitude), st, dur, S(nameOf(s, e)), e.valid === true ? 1 : e.valid === false ? 0 : -1,
    S(detailNote(s, e)), S(e.model || s.model), cost != null ? Math.round(cost * 1e6) : -1, S(s.source), s._fi, ...runNo(s)]);
}
for (const s of open.values()) {   // a start with no end in the trace (yet): drawn open to its right
  const a = agentOf(s.runner); agents[a].n.spans++;
  spanRows.push([a, ALTS.indexOf(s.altitude), sec(s.at), null, S(nameOf(s)), -1, S(detailNote(s)), S(s.model), -1, S(s.source), s._fi, ...runNo(s)]);
}
spanRows.sort((x, y) => x[2] - y[2]);
const stepRows = [...steps].map(([k, v]) => { const [a, b] = k.split('|').map(Number); return [a, b, ...v]; }).sort((x, y) => x[1] - y[1] || x[0] - y[0]);

// --- model calls: per agent per 5 minutes; models and statuses per agent ---
const callB = new Map(), models = new Map(), statuses = new Map(); let linked = 0, spanNoTrace = 0;
const traceSpans = new Set(docs.map((d) => d.span_id));
for (const c of calls.values()) {
  const a = agentOf(c.agent); agents[a].n.calls++;
  if (c.span_id && traceSpans.has(c.span_id)) linked++;
  if (c.span_id && !c.trace_id) spanNoTrace++;
  const b = Math.floor(sec(c.at) / CALL_BUCKET), k = `${a}|${b}`;
  const row = callB.get(k) || [a, b, 0, 0, 0, 0, 0];
  row[2]++; if (c.status === 'ok') row[3]++; row[4] += c.tokens_in || 0; row[5] += c.tokens_out || 0; row[6] += Math.round((c.cost_usd || 0) * 1e6);
  callB.set(k, row);
  const m = models.get(a) || {}; const mk = c.model_served || `${c.model_asked} (not served)`; m[mk] = (m[mk] || 0) + 1; models.set(a, m);
  const st = statuses.get(a) || {}; st[c.status] = (st[c.status] || 0) + 1; statuses.set(a, st);
}
for (const [a, m] of models) agents[a].models = Object.entries(m).sort((x, y) => y[1] - x[1]).slice(0, 6);
for (const [a, st] of statuses) agents[a].statuses = st;
const callRows = [...callB.values()].sort((x, y) => x[1] - y[1] || x[0] - y[0]);

// lane order: the conductor first, then by what each did
const weight = (g) => g.n.spans + g.n.steps + g.n.calls / 20 + g.sessions.length * 5;
const order = agents.map((g, i) => i).sort((x, y) => (/conductor/.test(agents[y].id) - /conductor/.test(agents[x].id)) || weight(agents[y]) - weight(agents[x]));

// --- their data against our schema ---
let ours = null; try { ours = JSON.parse(readFileSync(join(root, 'data/elastic-export-swarm-flows.json'), 'utf8')); } catch {}
const ourFields = ours?.fields || [], theirFields = [...new Set(docs.flatMap((d) => Object.keys(d).filter((k) => k !== '_fi')))];
const vals = (list, f) => [...new Set(list.map((d) => d[f]).filter((v) => v != null))].sort();
const count = (list, f) => list.filter((d) => d[f] != null).length;
const schema = {
  ours: 'data/elastic-export-swarm-flows.json (index swarm-flows)',
  fields_ours: ourFields,
  fields_only_theirs: theirFields.filter((f) => !ourFields.includes(f)),
  fields_missing_in_some_of_theirs: ourFields.filter((f) => count(docs, f) < docs.length).map((f) => `${f}: ${count(docs, f)} of ${docs.length}`),
  altitudes: { ours: vals(ours?.docs || [], 'altitude'), theirs: vals(docs, 'altitude'), in_units: vals(units, 'altitude') },
  roles: { ours: vals(ours?.docs || [], 'role'), theirs: vals(docs, 'role') },
  phases: { ours: vals(ours?.docs || [], 'phase'), theirs: vals(docs, 'phase') },
  notes: [
    `unit_id: ours is a key fingerprint (sha256:...); theirs is a readable id with the altitude first (A3-<agent>, A0-ci-<run>, A1-<hash>, A2-delegate-...).`,
    `parent_id of their agents is A4-ws214 (units.json); library/altitudes.json calls the same swarm A4-incident.`,
    `units.json has altitude "P" for the person, outside A0-A4.`,
    `${endsWithoutStart} end(s) without a start, ${open.size} start(s) without an end (drawn open).`,
    `A1 spans from the accountant ledgers are one per agent per hour ("llm calls N in the hour (aggregate)"), not one per call.`,
    `${calls.size} model calls: ${linked} have a span_id found in the trace; ${spanNoTrace} carry a span_id with trace_id null.`,
    `Their trace files are .json ({elastic_feed, by, updated, flow, count, docs[]}), not .jsonl.`,
  ],
};

const out = {
  about: "A snapshot of the Storm Charles team's trace (WS-214), drawn at /graph/trace/. Their data, read over HTTPS from their public site; spans are their start and end events paired, steps and model calls are counted in buckets. Times are seconds from t0. Text-free: no prompt or answer. Regenerate with admin/tools/storm-trace.mjs; never edit by hand. Lisbon Tech Fringe is independent of Web Summit.",
  by: 'trace.view.fringe@PrompTugal.angelo', made_by: 'admin/tools/storm-trace.mjs', read_at: READ_AT,
  source: { site: BASE, repository: 'https://github.com/PrompTugal/PrompTugal__News__Storm-Charles', api: BASE + 'api/v1/index.json', contract: BASE + 'api/v1/README.md',
    trace: BASE + 'data/trace/', units: BASE + 'data/trace/units.json', calls: BASE + 'models/calls/index.json', altitudes: BASE + 'library/altitudes.json',
    runner: BASE + 'agents/conductor/RUNNER.html', compute: BASE + 'agents/conductor/COMPUTE.html', by: traceIndex.json.by, their_version: api?.json.version || null,
    trace_updated: traceIndex.json.updated, units_updated: unitsF.json.updated, calls_updated: callsIndex?.json.updated || null, altitudes_updated: altsF?.json.updated || null },
  t0: new Date(T0).toISOString(), t1: new Date(T1).toISOString(), step_bucket: STEP_BUCKET, call_bucket: CALL_BUCKET, alts: ALTS,
  counts: { trace_docs: docs.length, trace_files: traceFiles.filter(Boolean).length, spans: spanRows.length, open_spans: open.size, steps: agents.reduce((n, g) => n + g.n.steps, 0),
    calls: calls.size, call_files: callFiles.filter(Boolean).length, agents: agents.length, units: units.length, tokens_in: callRows.reduce((n, r) => n + r[4], 0), tokens_out: callRows.reduce((n, r) => n + r[5], 0),
    cost_usd: Math.round(callRows.reduce((n, r) => n + r[6], 0)) / 1e6 },
  schema,
  order,
  agents,
  span_fields: ['agent', 'alt', 'start_s', 'dur_s (null: no end yet)', 'name', 'valid (1, 0, -1 unknown)', 'note', 'model', 'cost_microusd (-1 unknown)', 'their source field', 'file', 'n: fills {n} in the name (CI run), only where present'],
  spans: spanRows,
  step_fields: ['agent', 'bucket', 'commits', 'messages', 'other (session starts and the rest)'],
  steps: stepRows,
  call_fields: ['agent', 'bucket', 'calls', 'ok', 'tokens_in', 'tokens_out', 'cost_microusd'],
  calls: callRows,
  strings: strs,
  files: files.map(({ path, url, bytes, sha256, read_at, index_sha256_matches, error }) => ({ path, bytes, sha256, read_at, ...(index_sha256_matches === false ? { index_sha256_matches } : {}), ...(error ? { error, url } : {}) })),
  files_base: BASE,
};
let text = JSON.stringify(out) + '\n';
// The trace grows every hour: past 256 KB, the oldest hours of spans and step buckets drop out, and the snapshot says so.
for (let cut = 3600; Buffer.byteLength(text) > MAX && cut < (T1 - T0) / 1000; cut += 3600) {
  out.spans = spanRows.filter((r) => r[2] >= cut); out.steps = stepRows.filter((r) => r[1] * STEP_BUCKET >= cut);
  out.trimmed_before = new Date(T0 + cut * 1000).toISOString();
  text = JSON.stringify(out) + '\n';
}
if (Buffer.byteLength(text) > MAX) { console.error(`snapshot ${Buffer.byteLength(text)} bytes, over 256 KB: nothing written`); process.exit(1); }
writeFileSync(join(root, 'data/storm-trace.json'), text);
console.log(`data/storm-trace.json: ${Buffer.byteLength(text)} bytes; ${docs.length} trace docs from ${out.counts.trace_files} files, ${spanRows.length} spans (${open.size} open), ${stepRows.length} step buckets, ${calls.size} calls in ${callRows.length} buckets, ${agents.length} agents, ${out.t0} to ${out.t1}; read ${READ_AT}; ${files.filter((f) => f.error).length} file(s) failed`);
