#!/usr/bin/env node
// Every agentic run as flat documents, for Elastic (Dinis, 18:3x UTC: "I want to use elastic to visualise the agentic
// runs that me and Angelo are doing"). One document per unit of work (A3 agent, A2 loop, A1 LLM call, A0 compute), with
// its run, its parent, its altitude, its key (fingerprint only), when it was born and signed, its model, cost and
// latency, its environment and runner, whether its signature verified, and its reach where measured (needed / held /
// exposure). Sources, all signed: data/work-altitudes.json (the altitudes run), tasks/<id>/packet.json and
// result-*.json (packets, from any environment: Angelo's results land here too), run folders given with --run-dir
// (the per-call records of an altitudes run), data/run-reach.json (the reach).
//   node abp/tools/runs-export.mjs [--run-dir DIR ...] [--out data/altitude-runs.json]
// elastic.1 indexes the output as fringe-altitudes (one document per unit; 'id' is stable, so a re-push updates).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const runDirs = process.argv.flatMap((a, i) => (a === '--run-dir' ? [process.argv[i + 1]] : []));
const read = (p) => JSON.parse(fs.readFileSync(path.resolve(ROOT, p), 'utf8'));
const deep = (o) => (o && typeof o === 'object' ? (Array.isArray(o) ? o.map(deep) : Object.fromEntries(Object.keys(o).sort().map((k) => [k, deep(o[k])]))) : o);
function verify(env) {
  try { const k = crypto.createPublicKey({ key: Buffer.from(env.by.pub, 'base64'), format: 'der', type: 'spki' }); return crypto.verify(null, Buffer.from(JSON.stringify(deep({ body: env.body, fp: env.by.fp }))), k, Buffer.from(env.sig, 'base64')); } catch { return false; }
}
const person = (agent) => (/@PrompTugal\.([a-z]+)/i.exec(agent || '') || [, null])[1];
const docs = [];
const reach = (() => { try { return Object.fromEntries(read('data/run-reach.json').units.map((u) => [u.unit, u])); } catch { return {}; } })();
const withReach = (d, unitName) => { const r = reach[unitName]; return r ? { ...d, reach_needs: r.needs.length, reach_held: r.held.length, reach_exposure: r.exposure.length, reach_exposed: r.exposure } : d; };

// 1. The altitudes run (data/work-altitudes.json, and its per-call records when the run folder is given)
try {
  const W = read('data/work-altitudes.json'), T = W.body.trace, run = 'altitudes-' + W.body.generated.slice(0, 16);
  const base = { run, run_kind: 'altitudes', objective: W.body.objective, environment: 'R1 Claude Code cloud, riskmandate-personal', runner: 'architect.1.fringe@PrompTugal.dinis', person: 'dinis' };
  docs.push({ ...base, id: run + ':A3', altitude: 'A3', unit: T.A3.name, role: 'agent', parent: null });
  T.A0.forEach((u, i) => docs.push(withReach({ ...base, id: `${run}:A0:${i}`, altitude: 'A0', unit: u.name, role: 'compute', parent: run + ':A3', key_fp: u.fp, born: u.born, verified: W.body.signatures_verified }, i ? 'compute: merge' : 'compute: plan')));
  T.A2.forEach((u) => docs.push(withReach({ ...base, id: `${run}:A2:${u.fp}`, altitude: 'A2', unit: u.name, role: 'loop', parent: run + ':A3', key_fp: u.fp, born: u.born, signed_at: u.signed_at, items: u.items, calls: u.calls, verified: W.body.signatures_verified }, 'loop: slice 0..2 (x3)')));
  for (const dir of runDirs) for (const f of fs.readdirSync(dir).filter((x) => /^loop-\d+\.json$/.test(x))) {
    const L = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const c of L.body.calls) docs.push(withReach({ ...base, id: `${run}:A1:${c.by.fp}`, altitude: 'A1', unit: c.by.name, role: 'llm call', parent: `${run}:A2:${L.by.fp}`, key_fp: c.by.fp, born: c.by.born, signed_at: c.by.signed_at, model: c.body.model, cost_usd: c.body.cost_usd, latency_ms: c.body.latency_ms, valid: c.body.valid, item: c.body.item, attempt: c.body.attempt, verified: verify(c) }, '81 LLM calls'));
  }
} catch (e) { console.error('altitudes run:', e.message); }

// 2. Task packets and every environment's results
const TASKS = path.join(ROOT, 'tasks');
for (const id of fs.existsSync(TASKS) ? fs.readdirSync(TASKS) : []) {
  const pf = path.join(TASKS, id, 'packet.json'); if (!fs.existsSync(pf)) continue;
  const P = JSON.parse(fs.readFileSync(pf, 'utf8'));
  docs.push({ id: `packet:${id}`, run: `packet:${id}`, run_kind: 'packet', altitude: P.body.altitude, unit: `packet ${id}`, role: 'packet', parent: null, issuer: P.body.from, for: P.body.for, person: person(P.body.from), key_fp: P.by.fp, born: P.by.born, inputs: P.body.inputs.length, grant: P.body.grant, verified: verify(P) });
  for (const f of fs.readdirSync(path.join(TASKS, id)).filter((x) => /^result-.*\.json$/.test(x))) {
    const R = JSON.parse(fs.readFileSync(path.join(TASKS, id, f), 'utf8')), B = R.body, rid = `packet:${id}:${B.runner}:${B.ran_at}`;
    const ok = B.outputs.filter((o) => !o.error).length;
    docs.push({ id: rid, run: rid, run_kind: 'packet-result', altitude: P.body.altitude, unit: R.by.name, role: P.body.altitude === 'A1' ? 'llm calls' : 'loop', parent: `packet:${id}`, runner: B.runner, person: person(B.runner), environment: B.environment, key_fp: R.by.fp, born: R.by.born, signed_at: R.by.signed_at, cost_usd: B.cost_usd, outputs: B.outputs.length, valid_outputs: ok, valid_share: B.outputs.length ? +(ok / B.outputs.length).toFixed(3) : null, runner_choices: B.runner_choices || null, verified: verify(R) && B.packet_fp === P.by.fp });
    for (const c of B.calls) docs.push({ id: `${rid}:A1:${c.by.fp}`, run: rid, run_kind: 'packet-result', altitude: 'A1', unit: c.by.name, role: 'llm call', parent: rid, runner: B.runner, person: person(B.runner), environment: B.environment, key_fp: c.by.fp, born: c.by.born, signed_at: c.by.signed_at, model: c.body.model, cost_usd: c.body.cost_usd, latency_ms: c.body.latency_ms, valid: c.body.ok, item: c.body.input, attempt: c.body.try, verified: verify(c) });
  }
}

for (const d of docs) if (d.born && d.signed_at) d.duration_ms = Date.parse(d.signed_at) - Date.parse(d.born);
const out = { about: 'Every agentic run as flat documents, one per unit (abp/tools/runs-export.mjs), for Elastic index fringe-altitudes. Signed sources only; keys appear as fingerprints, never key material.', generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), count: docs.length, by_altitude: docs.reduce((m, d) => ((m[d.altitude] = (m[d.altitude] || 0) + 1), m), {}), verified: docs.filter((d) => d.verified === true).length, docs };
fs.writeFileSync(path.resolve(ROOT, arg('--out', 'data/altitude-runs.json')), JSON.stringify(out, null, 1) + '\n');
console.log(`runs-export: ${docs.length} units (${JSON.stringify(out.by_altitude)}), ${out.verified} signatures verified`);
