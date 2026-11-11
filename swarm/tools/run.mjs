#!/usr/bin/env node
// The swarm demo's ladder of runs (work/52, swarm.1.fringe@PrompTugal.dinis, at Dinis's word 11 Nov 2026 ~21:4x UTC:
// "start small and then go one by one ... every one of them should be a real run ... you do the runs, and then we visualize them").
// Each rung is a REAL run of the storm site's delegable work (https://storm-charles.promptugal.news/api/v1/, read over its public API),
// recorded as one JSON file: the units (person, swarm, agent, loop, LLM call, compute) with their altitude, the edges between them,
// a timeline of start and end events (for replay), and the run's metrics (calls, tokens, OpenRouter cost, the potential Anthropic cost
// of the same tokens, models, wall time, peak concurrency). Model text is never stored: only lengths, sha256 and whether it was valid.
//   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node swarm/tools/run.mjs --rung r3 [--budget-usd 1] [--cap-usd 25]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
process.env.LLM_DAILY_CAP_USD ||= arg('--cap-usd', '25');      // Dinis, 21:4x UTC: "yes, you can raise the 5-daily cap absolutely"
const { call, credit } = await import(path.join(ROOT, 'admin/tools/llm.mjs'));
const AGENT = 'swarm.1.fringe@PrompTugal.dinis';
const STORM = 'https://storm-charles.promptugal.news/api/v1/2026-11-10-storm-charles/';
const ENV = { id: 'R1', label: 'Claude Code cloud', account: 'riskmandate-personal' };

// The storm site's scheduled work, cut into tasks any runner can do (public data only; watch/websummit.json is left out: work/49).
const TASKS = [
  { id: 'warnings', dataset: 'weather/warnings.json', ask: 'the highest IPMA warning level in force for Lisbon now, for what, and until when' },
  { id: 'forecast', dataset: 'weather/forecast.json', ask: "tomorrow's forecast for Lisbon: rain and the strongest wind" },
  { id: 'stations', dataset: 'weather/stations.json', ask: 'the strongest gust observed in Lisbon in the latest hour, and where' },
  { id: 'tides', dataset: 'exposure/tides.json', ask: 'the next high water at Cascais and its height' },
  { id: 'transport', dataset: 'transport/services.json', ask: 'which transport operators are not running normally' },
  { id: 'flights', dataset: 'transport/flights.json', ask: 'how many flights at Lisbon in the latest count, against normal' },
];
const MODELS = ['deepseek/deepseek-v4-flash', 'qwen/qwen3.7-flash', 'mistralai/mistral-small-2603', 'meta-llama/llama-3.3-70b-instruct'];
// Anthropic list prices per million tokens (in/out), read from https://openrouter.ai/api/v1/models at 21:5x UTC, 11 Nov 2026:
// the POTENTIAL cost of the same tokens on Claude (not spent: the calls went to open-weight models).
const CLAUDE = { 'claude-haiku-5.5': [0.1, 0.5], 'claude-sonnet-5.5': [2, 10], 'claude-opus-5.5': [4, 20] };

const RUNGS = {
  r0: { title: 'Me → Claude → a task', tasks: 0, models: 0, loop: false, story: 'Dinis asks one Claude Code agent for one task. No model call leaves the agent.' },
  r1: { title: 'Me → Claude → compute', tasks: 1, models: 0, loop: false, story: 'The agent runs code (A0): it reads one storm dataset over the public API.' },
  r2: { title: 'Me → Claude → one OpenRouter call', tasks: 1, models: 1, loop: false, story: 'The agent hands the reading to one open-weight model (A1) through the router.' },
  r3: { title: 'Me → Claude → many models', tasks: 1, models: 4, loop: false, story: 'The same question to four open-weight models at once, compared in code.' },
  r4: { title: 'Me → Claude → loops', tasks: 6, models: 1, loop: true, story: 'Six loops (A2), one per storm task: read, ask, check, retry until valid.' },
  r5: { title: 'Me → Claude → a swarm of loops', tasks: 6, models: 4, loop: true, story: 'Every storm task on every model: 24 loops at once, then a consensus per task in code.' },
};

const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
function cost(tin, tout, [pi, po]) { return +((tin * pi + tout * po) / 1e6).toFixed(6); }

async function main() {
  const rid = arg('--rung', 'r0'), R = RUNGS[rid];
  if (!R) throw new Error('rungs: ' + Object.keys(RUNGS).join(', '));
  const budget = { usd: +arg('--budget-usd', '1'), calls: R.tasks * Math.max(R.models, 0) * (R.loop ? 3 : 1), sessions: 0 };
  const cr = R.models ? await credit() : { ok: false };
  if (R.models && cr.ok && cr.remaining < budget.usd + 5) throw new Error(`credit ${cr.remaining} USD is below the budget plus the floor`);
  const id = `${now().replace(/[-:]/g, '').slice(0, 13)}-${rid}`, T0 = Date.now();
  const nodes = [], edges = [], timeline = []; let live = 0, peak = 0;
  const node = (n) => (nodes.some((x) => x.id === n.id) || nodes.push({ ...n }), n.id);
  const edge = (from, to, kind) => edges.push({ from, to, kind });
  const ev = (unit, phase, more = {}) => { live += phase === 'start' ? 1 : phase === 'end' ? -1 : 0; peak = Math.max(peak, live); timeline.push({ t: Date.now() - T0, unit, phase, ...more }); };

  const me = node({ id: 'dinis', kind: 'person', altitude: 'P', label: 'Dinis' });
  const ag = node({ id: 'swarm.1', kind: 'agent', altitude: 'A3', label: AGENT, env: ENV.label, account: ENV.account, model: 'claude-opus-5.5' });
  const task = node({ id: 'task', kind: 'task', altitude: 'T', label: R.title });
  edge(me, ag, 'asks'); edge(ag, task, 'owns');
  ev(ag, 'start');
  const or = R.models ? node({ id: 'openrouter', kind: 'provider', altitude: 'M', label: 'OpenRouter' }) : null;
  const calls = [];
  async function a1(parent, t, model, input, attempt) {
    const u = node({ id: `${parent}/call:${model.split('/')[1]}#${attempt}`, kind: 'llm-call', altitude: 'A1', label: `${model.split('/')[1]} #${attempt}`, model });
    edge(parent, u, 'calls'); edge(u, or, 'via'); ev(u, 'start');
    const prompt = `From this public storm data (source: ${STORM}${t.dataset}), answer: ${t.ask}.\nReply with JSON only: {"headline": "<one sentence, at most 160 characters, facts from the data only>", "status": "normal" | "disrupted" | "warning" | "unknown"}.\nDATA (first 6000 characters):\n${input.slice(0, 6000)}`;
    const { text, line } = await call({ task: `WS-215/swarm/${rid}/${t.id}`, agent: AGENT, model, messages: [{ role: 'user', content: prompt }], max_tokens: model.includes('deepseek') ? 1200 : 300 });
    let parsed = null; try { parsed = JSON.parse((/\{[\s\S]*\}/.exec(text || '') || ['null'])[0]); } catch {}
    const valid = !!parsed && typeof parsed.headline === 'string' && ['normal', 'disrupted', 'warning', 'unknown'].includes(parsed.status);
    const c = { unit: u, task: t.id, model, served: line.model_served, status: line.status, valid, verdict: valid ? parsed.status : null, tokens_in: line.tokens_in, tokens_out: line.tokens_out, cost_usd: line.cost_usd, latency_ms: line.latency_ms, ledger_id: line.id, answer_sha256: text ? sha(text).slice(0, 16) : null, answer_chars: text ? text.length : 0 };
    calls.push(c); Object.assign(nodes.find((n) => n.id === u), { valid, tokens: line.tokens_in + line.tokens_out, cost_usd: line.cost_usd, latency_ms: line.latency_ms });
    ev(u, 'end', { valid, cost_usd: line.cost_usd }); return c;
  }
  async function fetchTask(parent, t) {
    const u = node({ id: `${parent}/read:${t.id}`, kind: 'compute', altitude: 'A0', label: `read ${t.dataset}` });
    const d = node({ id: `data:${t.id}`, kind: 'dataset', altitude: 'D', label: t.dataset, url: STORM + t.dataset });
    edge(parent, u, 'runs'); edge(u, d, 'reads'); ev(u, 'start');
    const r = await fetch(STORM + t.dataset); const body = await r.text();
    Object.assign(nodes.find((n) => n.id === d), { bytes: body.length, sha256: sha(body).slice(0, 16), read_at: now() });
    ev(u, 'end', { ok: r.ok, bytes: body.length }); return body;
  }
  async function loop(t, model) {   // A2: read, ask, check, retry (at most 3), then stop
    const l = node({ id: `loop:${t.id}${model ? ':' + model.split('/')[1] : ''}`, kind: 'loop', altitude: 'A2', label: `${t.id}${R.models > 1 ? ' · ' + model.split('/')[1] : ''}` });
    edge(ag, l, 'starts'); ev(l, 'start');
    const body = await fetchTask(l, t); let c = null;
    for (let a = 1; a <= 3 && !(c && c.valid); a++) c = await a1(l, t, model, body, a);
    ev(l, 'end', { valid: c.valid }); return c;
  }

  const ts = TASKS.slice(0, R.tasks), ms = MODELS.slice(0, R.models);
  if (R.loop) await Promise.all(ts.flatMap((t) => ms.map((m) => loop(t, m))));
  else if (ts.length) { const body = await fetchTask(ag, ts[0]); await Promise.all(ms.map((m) => a1(ag, ts[0], m, body, 1))); }
  // consensus per task, in code (A0), when more than one model answered it
  const consensus = {};
  if (R.models > 1) for (const t of ts) {
    const u = node({ id: `consensus:${t.id}`, kind: 'compute', altitude: 'A0', label: `consensus ${t.id}` }); edge(ag, u, 'runs'); ev(u, 'start');
    const v = calls.filter((c) => c.task === t.id && c.valid).map((c) => c.verdict); const tally = v.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]; consensus[t.id] = { tally, verdict: top ? top[0] : 'unknown', agree: top ? top[1] : 0, of: ms.length };
    ev(u, 'end');
  }
  ev(ag, 'end');
  const sum = (k) => calls.reduce((s, c) => s + (c[k] || 0), 0), tin = sum('tokens_in'), tout = sum('tokens_out');
  const byAlt = nodes.reduce((m, n) => ((m[n.altitude] = (m[n.altitude] || 0) + 1), m), {});
  const run = {
    v: 1, id, rung: rid, title: R.title, story: R.story, by: AGENT, for: 'Dinis Cruz', issue: 'WS-215', environment: ENV, started_at: new Date(T0).toISOString().replace(/\.\d+Z$/, 'Z'), wall_ms: Date.now() - T0,
    budget, credit_before_usd: cr.ok ? +cr.remaining.toFixed(2) : null,
    source: { workload: 'the storm site\'s scheduled datasets, read over its public API', url: STORM },
    metrics: {
      units: byAlt, agents: byAlt.A3 || 0, loops: byAlt.A2 || 0, llm_calls: calls.length, compute: byAlt.A0 || 0, peak_concurrency: peak - 1,
      valid_calls: calls.filter((c) => c.valid).length, tokens_in: tin, tokens_out: tout, openrouter_usd: +sum('cost_usd').toFixed(6),
      potential_claude_usd: Object.fromEntries(Object.entries(CLAUDE).map(([k, p]) => [k, cost(tin, tout, p)])),
      models: [...new Set(calls.map((c) => c.served))], latency_ms_p50: calls.length ? calls.map((c) => c.latency_ms).sort((a, b) => a - b)[Math.floor(calls.length / 2)] : null,
      not_measured: 'the A3 agent\'s own Claude tokens (this Claude Code session): not exposed to the run',
    },
    consensus, calls, nodes, edges, timeline,
  };
  const out = path.join(arg('--out', path.join(ROOT, '..', 'promptugal__news__swarm', 'runs')), `${id}.json`);   // runs live in PrompTugal__News__Swarm fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(run, null, 1) + '\n');
  console.log(`${id}: ${R.title}: ${nodes.length} nodes, ${calls.length} calls (${run.metrics.valid_calls} valid), ${tin}+${tout} tokens, ${run.metrics.openrouter_usd} USD (Sonnet would be ${run.metrics.potential_claude_usd['claude-sonnet-5.5']}), ${run.wall_ms} ms, peak ${run.metrics.peak_concurrency}`);
}
await main();
