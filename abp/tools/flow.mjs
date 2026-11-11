#!/usr/bin/env node
// Flows: the execution of every unit, live, in Elastic (swarm-flows). Dinis, 11 November 2026, 18:5x UTC: "I want to
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
// Every unit is also an OpenTelemetry span (below): OTEL_EXPORTER_OTLP_ENDPOINT, else ~/.abp/otlp/.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const INDEX = 'swarm-flows';   // docs/elastic-guidance.md: swarm-<kind>, owned by its creator (_meta.owner)
export const MAPPING = { mappings: { _meta: { owner: 'architect.1.fringe@PrompTugal.dinis', about: 'Flows: every unit\'s start, step and end, live (abp/tools/flow.mjs)' }, dynamic: 'strict', properties: {
  flow: { type: 'keyword' }, seq: { type: 'long' }, at: { type: 'date' }, phase: { type: 'keyword' },
  unit_id: { type: 'keyword' }, parent_id: { type: 'keyword' }, altitude: { type: 'keyword' }, role: { type: 'keyword' },
  name: { type: 'text', fields: { raw: { type: 'keyword', ignore_above: 256 } } },
  runner: { type: 'keyword' }, person: { type: 'keyword' }, environment: { type: 'keyword' }, host: { type: 'keyword' },
  key_fp: { type: 'keyword' }, model: { type: 'keyword' }, cost_usd: { type: 'double' }, latency_ms: { type: 'long' },
  duration_ms: { type: 'long' }, valid: { type: 'boolean' }, item: { type: 'keyword' }, attempt: { type: 'integer' },
  note: { type: 'text' }, objective: { type: 'text' }, source: { type: 'keyword' },
  trace_id: { type: 'keyword' }, span_id: { type: 'keyword' }, parent_span_id: { type: 'keyword' } } } };

// ---------- OpenTelemetry (Dinis, 19:08 UTC: "yes start with open telemetry") ----------
// Every flow is an OTel trace and every unit a span: trace_id = sha256(flow)[0:32], span_id = sha256(unit_id)[0:16],
// parent = the parent unit's span. At a unit's end its span goes out as OTLP/HTTP JSON (the standard wire format):
// to OTEL_EXPORTER_OTLP_ENDPOINT (+ /v1/traces, headers from OTEL_EXPORTER_OTLP_HEADERS, never printed) when set,
// else as one line of OTLP JSON in ~/.abp/otlp/<flow>.jsonl, which any collector reads (filelog/otlpjson). Any OTel
// back end then takes it: Elastic APM, Grafana Tempo, Jaeger, Honeycomb. Attributes follow the gen_ai semantic
// conventions where one exists (gen_ai.request.model), abp.* otherwise. No prompt, no key, no person's data.
const hex = (s, n) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, n);
export const traceIdOf = (flowId) => hex('trace:' + flowId, 32);
export const spanIdOf = (unitId) => hex('span:' + unitId, 16);
const ns = (ms) => String(BigInt(Math.round(ms)) * 1000000n);
const attr = (k, v) => v === undefined || v === null ? null : { key: k, value: typeof v === 'boolean' ? { boolValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v }) : { stringValue: String(v) } };
export function otlpSpan({ flowId, u, runner, environment, endAt, status, extra = {}, person }) {
  const a = [attr('abp.altitude', u.altitude), attr('abp.role', ROLE[u.altitude]), attr('abp.unit_id', u.id), attr('abp.flow', flowId), attr('abp.key_fp', u.key_fp),
    attr('abp.environment', environment), attr('abp.person', person), attr('gen_ai.request.model', extra.model), attr('gen_ai.operation.name', u.altitude === 'A1' ? 'chat' : undefined),
    attr('abp.cost_usd', extra.cost_usd), attr('abp.valid', extra.valid), attr('abp.item', extra.item), attr('abp.attempt', extra.attempt), attr('abp.note', extra.note)].filter(Boolean);
  return { resourceSpans: [{ resource: { attributes: [attr('service.name', runner), attr('service.namespace', 'promptugal.fringe'), attr('deployment.environment', environment), attr('host.name', os.hostname().slice(0, 64))].filter(Boolean) },
    scopeSpans: [{ scope: { name: 'abp/tools/flow.mjs', version: '1' }, spans: [{ traceId: traceIdOf(flowId), spanId: spanIdOf(u.id), ...(u.parent ? { parentSpanId: spanIdOf(u.parent) } : {}),
      name: `${u.altitude} ${u.name}`, kind: u.altitude === 'A1' ? 3 : 1, startTimeUnixNano: ns(u.t0 || endAt), endTimeUnixNano: ns(endAt), attributes: a,
      status: status === 'error' ? { code: 2, message: String(extra.note || 'error').slice(0, 200) } : { code: extra.valid === false ? 0 : 1 } }] }] }] };
}
async function exportSpan(flowId, body) {
  const ep = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').replace(/\/+$/, '');
  if (!ep) { const d = path.join(os.homedir(), '.abp', 'otlp'); fs.mkdirSync(d, { recursive: true }); fs.appendFileSync(path.join(d, flowId + '.jsonl'), JSON.stringify(body) + '\n'); return; }
  const headers = { 'content-type': 'application/json' };
  for (const kv of (process.env.OTEL_EXPORTER_OTLP_HEADERS || '').split(',').filter(Boolean)) { const i = kv.indexOf('='); headers[decodeURIComponent(kv.slice(0, i).trim())] = decodeURIComponent(kv.slice(i + 1).trim()); }
  const r = await fetch(`${ep}/v1/traces`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!r.ok) console.error(`flow: span not exported (OTLP HTTP ${r.status})`);
}
const ROLE = { A4: 'swarm', A3: 'agent', A2: 'loop', A1: 'llm call', A0: 'compute' };
const now = () => new Date().toISOString();

export function flow({ id = process.env.FLOW_ID, runner = process.env.FLOW_RUNNER || 'architect.1.fringe@PrompTugal.dinis', environment = process.env.FLOW_ENV || 'R1 Claude Code cloud, riskmandate-personal', objective } = {}) {
  const flowId = id || `flow-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}-${crypto.randomBytes(3).toString('hex')}`;
  const person = (/@PrompTugal\.([a-z]+)/i.exec(runner) || [, null])[1];
  const pending = []; let seq = Date.now() * 1000; const tally = { sent: 0, errors: 0 };
  let lib = null, ready = null;
  const send = async (ev) => {
    if (!process.env.ELASTIC_URL) { const d = path.join(os.homedir(), '.abp', 'flows'); fs.mkdirSync(d, { recursive: true }); fs.appendFileSync(path.join(d, flowId + '.jsonl'), JSON.stringify(ev) + '\n'); return; }
    lib ||= await import(path.join(ROOT, 'admin/tools/elastic-lib.mjs'));
    const B = lib.base(), headers = { 'content-type': 'application/json', ...lib.auth() };
    ready ||= (async () => { const h = await fetch(`${B}/${INDEX}`, { method: 'HEAD', headers }); if (h.status === 404) await fetch(`${B}/${INDEX}`, { method: 'PUT', headers, body: JSON.stringify(MAPPING) }); })();
    await ready;
    const r = await fetch(`${B}/${INDEX}/_doc`, { method: 'POST', headers, body: JSON.stringify(ev) });
    if (!r.ok) { tally.errors++; console.error(`flow: event not stored (HTTP ${r.status})`); } else tally.sent++;
  };
  const emit = (u, phase, extra = {}) => {
    const ev = { trace_id: traceIdOf(flowId), span_id: spanIdOf(u.id), parent_span_id: u.parent ? spanIdOf(u.parent) : undefined, flow: flowId, seq: seq++, at: now(), phase, unit_id: u.id, parent_id: u.parent || undefined, altitude: u.altitude, role: ROLE[u.altitude], name: u.name, runner, person, environment, host: os.hostname().slice(0, 64), key_fp: u.key_fp, objective: phase === 'start' ? (u.objective || objective) : undefined, source: 'abp/tools/flow.mjs', ...extra };
    for (const k of Object.keys(ev)) if (ev[k] === undefined) delete ev[k];
    pending.push(send(ev).catch((e) => console.error('flow:', String(e.message).slice(0, 120))));
    if (phase === 'end' || phase === 'error') pending.push(exportSpan(flowId, otlpSpan({ flowId, u, runner, environment, person, endAt: Date.now(), status: phase, extra })).catch((e) => console.error('flow: otlp', String(e.message).slice(0, 120))));
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
    // one audit line per flush in elastic-submissions (elastic.1's logSubmission, docs/elastic-guidance.md section 6)
    async flush() {
      await Promise.all(pending); pending.length = 0;
      if (!process.env.ELASTIC_URL || !(tally.sent + tally.errors)) return;
      try { lib ||= await import(path.join(ROOT, 'admin/tools/elastic-lib.mjs')); await lib.logSubmission({ agent: runner, index: INDEX, via: 'live', sent: tally.sent, errors: tally.errors, held: 0, source: 'abp/tools/flow.mjs', commit: flowId }); }
      catch (e) { console.error('flow: audit line not stored', String(e.message).slice(0, 120)); }
      tally.sent = tally.errors = 0;
    },
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
