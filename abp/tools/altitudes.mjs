#!/usr/bin/env node
// The altitudes of execution, in action (work/48; Dinis, 15:3x UTC: "let's now try this in action, to spin up multiple
// altitudes"). One objective, run through the altitudes, each unit holding its own key for as long as it runs:
//   A0 compute   plan:  list the board's items and cut them into slices; merge: verify every signature and aggregate
//   A2 loop      loop:  one slice; for each item, LLM calls until the answer is valid (a closed loop, then stop)
//   A1 LLM call  one prompt in, one answer out, through admin/tools/llm.mjs (open weight, no tools)
// The A3 agent (architect.1) starts the loops as sub-agents and commits the result; the A4 swarm (the lead) routes it.
// Identity at every altitude: each unit makes an Ed25519 key pair in memory, signs its result, and never writes the
// private half anywhere. A signature by a key that existed only during the run proves the unit existed then.
//   node abp/tools/altitudes.mjs plan  --slices 3 --out DIR
//   node abp/tools/altitudes.mjs loop  --dir DIR --slice K
//   node abp/tools/altitudes.mjs merge --dir DIR --out data/work-altitudes.json
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { flow } from './flow.mjs';   // live start/step/end events to Elastic (Dinis, 18:5x UTC)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const canon = (o) => JSON.stringify(o, Object.keys(o).sort());
const deep = (o) => (o && typeof o === 'object' ? (Array.isArray(o) ? o.map(deep) : Object.fromEntries(Object.keys(o).sort().map((k) => [k, deep(o[k])]))) : o);
const bytes = (o) => Buffer.from(JSON.stringify(deep(o)));

// an identity that lives only as long as this unit
function identity(altitude, name) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pub = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const fp = 'sha256:' + crypto.createHash('sha256').update(pub).digest('hex').slice(0, 16);
  const born = now();
  return { altitude, name, fp, pub, born, sign: (body) => ({ body, by: { altitude, name, fp, pub, born, signed_at: now() }, sig: crypto.sign(null, bytes({ body, fp }), privateKey).toString('base64') }) };
}
export function verify(env) {
  try { const k = crypto.createPublicKey({ key: Buffer.from(env.by.pub, 'base64'), format: 'der', type: 'spki' }); return crypto.verify(null, bytes({ body: env.body, fp: env.by.fp }), k, Buffer.from(env.sig, 'base64')) && 'sha256:' + crypto.createHash('sha256').update(env.by.pub).digest('hex').slice(0, 16) === env.by.fp; } catch { return false; }
}

const DEFS = `The altitudes of execution:
A4 swarm: agents of agents; starts and schedules other agents, routes people's work.
A3 agent: a loop with an environment: memory across runs (status file, inbox), its own wake, reach beyond its sandbox.
A2 loop: a closed agentic loop: calls a model and uses tools until one task is done, then stops; cannot start others or schedule.
A1 LLM call: one prompt in, one answer out; no tools.
A0 compute: code that runs, no model.`;

// ---------- A0: plan ----------
async function plan() {
  const dir = arg('--dir', arg('--out')); fs.mkdirSync(dir, { recursive: true });
  const me = identity('A0', 'compute: plan');
  const F = flow(), U = F.unit({ altitude: 'A0', name: 'compute: plan', key_fp: me.fp }).start();
  const items = fs.readdirSync(path.join(ROOT, 'work')).filter((f) => /^\d+-.*\.md$/.test(f)).sort().map((f) => {
    const s = fs.readFileSync(path.join(ROOT, 'work', f), 'utf8'), fm = (k) => ((new RegExp(`^${k}:\\s*(.*)$`, 'm')).exec(s) || [, ''])[1].replace(/^"|"$/g, '').trim();
    return { id: 'work/' + f.replace(/\.md$/, ''), title: fm('title'), done_means: fm('done-means').slice(0, 400), status: fm('status') };
  });
  const lim = +arg('--items', 0); if (lim) items.splice(lim);
  const n = +arg('--slices', 3), slices = Array.from({ length: n }, (_, k) => items.filter((_, i) => i % n === k));
  const env = me.sign({ objective: 'For every board item, the lowest altitude that can do it (the least power that suffices)', items: items.length, slices });
  fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify(env, null, 1));
  U.end({ note: `${items.length} items in ${n} slices` }); await F.flush();
  console.log(`A0 plan: ${items.length} items in ${n} slices, signed by ${me.fp} (a key that lived ${Date.now() - Date.parse(me.born)} ms)`);
}

// ---------- A2: a loop over one slice, A1 calls inside ----------
async function loop() {
  const dir = arg('--dir'), k = +arg('--slice');
  const planEnv = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
  if (!verify(planEnv)) throw new Error('the plan is not signed by its A0 key');
  const { call } = await import(path.join(ROOT, 'admin/tools/llm.mjs'));
  const me = identity('A2', `loop: slice ${k}`), results = [], calls = [];
  const F = flow(), LU = F.unit({ altitude: 'A2', name: `loop: slice ${k}`, key_fp: me.fp }).start({ note: `${planEnv.body.slices[k].length} items` });
  for (const it of planEnv.body.slices[k]) {
    let answer = null;
    for (let attempt = 1; attempt <= 3 && !answer; attempt++) {             // the loop: until the answer is valid, then stop
      const c = identity('A1', `LLM call: ${it.id} #${attempt}`);
      const CU = F.unit({ altitude: 'A1', name: `LLM call: ${it.id} #${attempt}`, key_fp: c.fp, parent: me.fp }).start({ item: it.id, attempt });
      const prompt = `${DEFS}\n\nWhich is the LOWEST altitude that can do this board item, end to end? Answer only JSON: {"altitude":"A0|A1|A2|A3|A4","why":"<15 words"}\nItem: ${it.title}\nDone means: ${it.done_means}`;
      const { text, line } = await call({ task: 'WS-215/work-48/altitudes-in-action', agent: 'architect.1.fringe@PrompTugal.dinis', tier: 'cheap', messages: [{ role: 'user', content: prompt }], max_tokens: +arg('--max-tokens', 1200) });
      let parsed = null; try { parsed = JSON.parse((/\{[\s\S]*\}/.exec(text || '') || ['null'])[0]); } catch {}
      const valid = parsed && /^A[0-4]$/.test(parsed.altitude || '');
      calls.push(c.sign({ item: it.id, attempt, prompt_sha256: crypto.createHash('sha256').update(prompt).digest('hex'), answer: valid ? parsed : null, valid: !!valid, model: line.model_served, ledger_id: line.id, cost_usd: line.cost_usd, latency_ms: line.latency_ms }));
      CU.end({ item: it.id, attempt, model: line.model_served, cost_usd: line.cost_usd, latency_ms: line.latency_ms, valid: !!valid, note: valid ? parsed.altitude : 'invalid: retry' });
      if (valid) answer = { ...parsed, attempts: attempt, call_fp: c.fp };
      else LU.step(`retry ${it.id}`, { item: it.id, attempt });
    }
    results.push({ id: it.id, title: it.title, status: it.status, ...(answer || { altitude: null, why: 'no valid answer in 3 calls' }) });
  }
  const env = me.sign({ slice: k, plan_fp: planEnv.by.fp, results, calls });
  fs.writeFileSync(path.join(dir, `loop-${k}.json`), JSON.stringify(env, null, 1));
  LU.end({ note: `${results.length} items, ${calls.length} calls`, cost_usd: +calls.reduce((s2, c2) => s2 + (c2.body.cost_usd || 0), 0).toFixed(6) }); await F.flush();
  console.log(`A2 loop ${k}: ${results.length} items, ${calls.length} A1 calls (${calls.filter((c) => !c.body.valid).length} retried), signed by ${me.fp}; stopped`);
}

// ---------- A0: verify every signature, merge ----------
async function merge() {
  const dir = arg('--dir'), out = path.resolve(ROOT, arg('--out', 'data/work-altitudes.json'));
  const me = identity('A0', 'compute: merge');
  const F = flow(), MU = F.unit({ altitude: 'A0', name: 'compute: merge', key_fp: me.fp }).start();
  const planEnv = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
  const loops = fs.readdirSync(dir).filter((f) => /^loop-\d+\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const checks = { plan: verify(planEnv), loops: loops.map((l) => verify(l) && l.body.plan_fp === planEnv.by.fp), calls: loops.flatMap((l) => l.body.calls.map(verify)) };
  const ok = checks.plan && checks.loops.every(Boolean) && checks.calls.every(Boolean);
  const items = loops.flatMap((l) => l.body.results).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const by = items.reduce((m, r) => ((m[r.altitude || 'none'] = (m[r.altitude || 'none'] || 0) + 1), m), {});
  const allCalls = loops.flatMap((l) => l.body.calls);
  const trace = {
    A3: { name: 'architect.1.fringe@PrompTugal.dinis', note: 'started the loops as sub-agents; commits the result under its session key' },
    A0: [{ name: planEnv.by.name, fp: planEnv.by.fp, born: planEnv.by.born }, { name: me.name, fp: me.fp, born: me.born }],
    A2: loops.map((l) => ({ name: l.by.name, fp: l.by.fp, born: l.by.born, signed_at: l.by.signed_at, items: l.body.results.length, calls: l.body.calls.length })),
    A1: { calls: allCalls.length, retried: allCalls.filter((c) => !c.body.valid).length, models: [...new Set(allCalls.map((c) => c.body.model))], cost_usd: +allCalls.reduce((s, c) => s + (c.body.cost_usd || 0), 0).toFixed(6), keys: allCalls.length },
  };
  const doc = me.sign({ about: 'Every board item placed at the lowest altitude that can do it, by the altitudes of execution in action (abp/tools/altitudes.mjs): A0 planned, three A2 loops each ran A1 calls on an open-weight model until valid, A0 verified every signature and merged; architect.1 (A3) started the loops. Each unit signed with a key that existed only while it ran. A model\'s placement is evidence, not a decision.', objective: planEnv.body.objective, generated: now(), signatures_verified: ok, counts: { items: items.length, by_altitude: by, signatures: 1 + loops.length + allCalls.length }, trace, items });
  fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
  MU.end({ note: `${1 + loops.length + allCalls.length} signatures ${ok ? 'verified' : 'NOT verified'}`, valid: ok });
  await F.flush();
  console.log(`A0 merge: ${items.length} items, by altitude ${JSON.stringify(by)}; ${1 + loops.length + allCalls.length} signatures ${ok ? 'all verified' : 'NOT ALL VERIFIED'}; ${trace.A1.calls} A1 calls, ${trace.A1.cost_usd} USD; signed by ${me.fp}`);
}

const cmd = process.argv[2];
if (cmd === 'plan') await plan(); else if (cmd === 'loop') await loop(); else if (cmd === 'merge') { await merge(); }
else console.log('usage: node abp/tools/altitudes.mjs plan --slices N --dir DIR | loop --dir DIR --slice K | merge --dir DIR --out FILE');
