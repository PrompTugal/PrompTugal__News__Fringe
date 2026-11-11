#!/usr/bin/env node
// Flows: the execution of every unit, live, in Elastic (fringe-flows). Dinis, 11 November 2026, 18:5x UTC: "I want to
// start to see the execution. I want to see the beginning, the middle, and ending ... especially as we add ChatGPT,
// Cloudflare, AWS, maybe even GCP to the mix." Every unit (A4 swarm, A3 agent, A2 loop, A1 LLM call, A0 compute)
// emits start, step and end events as it runs, from whatever environment it runs in; a flow is one run of units,
// tied by unit_id and parent_id. An event never carries a key, a prompt or a person's data: fingerprints, names,
// timings, models, costs, outcomes.
//   As a library:  import { flow } from './flow.mjs'; const f = flow(); const u = f.unit({ altitude, name, parent });
//                  u.start(); u.step('note', {...}); u.end({ valid, cost_usd, ... })   (await f.flush() before exit)
//   From a shell:  FLOW_ID=... node abp/tools/flow.mjs event --phase start|end --altitude A3 --name N [--unit ID] [--parent ID]
// Environment: FLOW_ID (the run; new if unset), FLOW_PARENT (the parent unit for units started here), FLOW_ENV (where
// this runs, e.g. 'R1 Claude Code cloud, riskmandate-personal'), FLOW_RUNNER (the agent), ELASTIC_URL and the
// credential read by admin/tools/elastic-lib.mjs (never printed). With no ELASTIC_URL, events go to ~/.abp/flows/.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const INDEX = 'fringe-flows';
export const MAPPING = { mappings: { dynamic: 'strict', properties: {
  flow: { type: 'keyword' }, seq: { type: 'long' }, at: { type: 'date' }, phase: { type: 'keyword' },
  unit_id: { type: 'keyword' }, parent_id: { type: 'keyword' }, altitude: { type: 'keyword' }, role: { type: 'keyword' },
  name: { type: 'text', fields: { raw: { type: 'keyword', ignore_above: 256 } } },
  runner: { type: 'keyword' }, person: { type: 'keyword' }, environment: { type: 'keyword' }, host: { type: 'keyword' },
  key_fp: { type: 'keyword' }, model: { type: 'keyword' }, cost_usd: { type: 'double' }, latency_ms: { type: 'long' },
  duration_ms: { type: 'long' }, valid: { type: 'boolean' }, item: { type: 'keyword' }, attempt: { type: 'integer' },
  note: { type: 'text' }, objective: { type: 'text' }, source: { type: 'keyword' } } } };
const ROLE = { A4: 'swarm', A3: 'agent', A2: 'loop', A1: 'llm call', A0: 'compute' };
const now = () => new Date().toISOString();

export function flow({ id = process.env.FLOW_ID, runner = process.env.FLOW_RUNNER || 'architect.1.fringe@PrompTugal.dinis', environment = process.env.FLOW_ENV || 'R1 Claude Code cloud, riskmandate-personal', objective } = {}) {
  const flowId = id || `flow-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}-${crypto.randomBytes(3).toString('hex')}`;
  const person = (/@PrompTugal\.([a-z]+)/i.exec(runner) || [, null])[1];
  const pending = []; let seq = Date.now() * 1000;
  let lib = null, ready = null;
  const send = async (ev) => {
    if (!process.env.ELASTIC_URL) { const d = path.join(os.homedir(), '.abp', 'flows'); fs.mkdirSync(d, { recursive: true }); fs.appendFileSync(path.join(d, flowId + '.jsonl'), JSON.stringify(ev) + '\n'); return; }
    lib ||= await import(path.join(ROOT, 'admin/tools/elastic-lib.mjs'));
    const B = lib.base(), headers = { 'content-type': 'application/json', ...lib.auth() };
    ready ||= (async () => { const h = await fetch(`${B}/${INDEX}`, { method: 'HEAD', headers }); if (h.status === 404) await fetch(`${B}/${INDEX}`, { method: 'PUT', headers, body: JSON.stringify(MAPPING) }); })();
    await ready;
    const r = await fetch(`${B}/${INDEX}/_doc`, { method: 'POST', headers, body: JSON.stringify(ev) });
    if (!r.ok) console.error(`flow: event not stored (HTTP ${r.status})`);
  };
  const emit = (u, phase, extra = {}) => {
    const ev = { flow: flowId, seq: seq++, at: now(), phase, unit_id: u.id, parent_id: u.parent || undefined, altitude: u.altitude, role: ROLE[u.altitude], name: u.name, runner, person, environment, host: os.hostname().slice(0, 64), key_fp: u.key_fp, objective: phase === 'start' ? (u.objective || objective) : undefined, source: 'abp/tools/flow.mjs', ...extra };
    for (const k of Object.keys(ev)) if (ev[k] === undefined) delete ev[k];
    pending.push(send(ev).catch((e) => console.error('flow:', String(e.message).slice(0, 120))));
  };
  return {
    id: flowId,
    unit({ altitude, name, parent = process.env.FLOW_PARENT, id, key_fp, objective: obj } = {}) {
      const u = { id: id || key_fp || `${altitude}-${crypto.randomBytes(6).toString('hex')}`, altitude, name, parent, key_fp, objective: obj, t0: 0 };
      return {
        id: u.id,
        start(extra) { u.t0 = Date.now(); emit(u, 'start', extra); return this; },
        step(note, extra = {}) { emit(u, 'step', { note, ...extra }); return this; },
        end(extra = {}) { emit(u, 'end', { duration_ms: u.t0 ? Date.now() - u.t0 : undefined, ...extra }); return this; },
        error(note, extra = {}) { emit(u, 'error', { note, duration_ms: u.t0 ? Date.now() - u.t0 : undefined, ...extra }); return this; },
      };
    },
    async flush() { await Promise.all(pending); },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  if (process.argv[2] !== 'event') { console.log('usage: FLOW_ID=... node abp/tools/flow.mjs event --phase start|end --altitude A3 --name N [--unit ID] [--parent ID] [--note T]'); process.exit(2); }
  const f = flow(), u = f.unit({ altitude: a('--altitude'), name: a('--name'), id: a('--unit'), parent: a('--parent'), objective: a('--objective') });
  const ph = a('--phase', 'step');
  if (ph === 'start') u.start(); else if (ph === 'end') u.end({ note: a('--note') }); else u.step(a('--note', ''));
  await f.flush(); console.log(`flow ${f.id}: ${ph} ${a('--altitude')} ${a('--name')}`);
}
