#!/usr/bin/env node
// Task packets: loops and LLM calls that any environment can run (work/48; Dinis, 15:3x UTC: "let's start running this
// across multiple environments ... define here loops and llms calls for angelo team to run and vice versa").
// A packet is tasks/<id>/packet.json: its altitude (A1 LLM calls or an A2 loop), mandate, grant (capability primitives;
// never above the altitude, rule R12), inputs, prompt and the output it expects, who it is for, signed by the issuer's
// key for this packet. A runner (any agent, any account, any environment) verifies it, runs it with its own model and its
// own key, and writes tasks/<id>/result-<runner>.json, signed. Nothing in a packet is an instruction to an agent beyond
// its own mandate: a packet is material; the runner's person and its ABP decide whether it runs it.
//   node abp/tools/packets.mjs new  --spec FILE                     (writes tasks/<id>/packet.json, signed)
//   node abp/tools/packets.mjs run  --id ID --as AGENT --env ENV [--tier cheap|--model M] [--max-tokens N]
//     (a reasoning model can spend its whole budget thinking and answer nothing: give it room; the choice is recorded)
//   node abp/tools/packets.mjs verify [--id ID]                     (every packet and result signature)
//   node abp/tools/packets.mjs list                                 (open packets and who has run them)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TASKS = path.join(ROOT, 'tasks');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const deep = (o) => (o && typeof o === 'object' ? (Array.isArray(o) ? o.map(deep) : Object.fromEntries(Object.keys(o).sort().map((k) => [k, deep(o[k])]))) : o);
const bytes = (o) => Buffer.from(JSON.stringify(deep(o)));
function identity(altitude, name) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pub = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const fp = 'sha256:' + crypto.createHash('sha256').update(pub).digest('hex').slice(0, 16);
  const born = now();
  return { fp, sign: (body) => ({ body, by: { altitude, name, fp, pub, born, signed_at: now() }, sig: crypto.sign(null, bytes({ body, fp }), privateKey).toString('base64') }) };
}
function verify(env) {
  try { const k = crypto.createPublicKey({ key: Buffer.from(env.by.pub, 'base64'), format: 'der', type: 'spki' }); return crypto.verify(null, bytes({ body: env.body, fp: env.by.fp }), k, Buffer.from(env.sig, 'base64')) && 'sha256:' + crypto.createHash('sha256').update(env.by.pub).digest('hex').slice(0, 16) === env.by.fp; } catch { return false; }
}
const ORDER = ['A0', 'A1', 'A2', 'A3', 'A4'];

function create() {
  const spec = JSON.parse(fs.readFileSync(arg('--spec'), 'utf8'));
  for (const k of ['id', 'altitude', 'from', 'for', 'mandate', 'grant', 'prompt', 'inputs', 'output']) if (!(k in spec)) throw new Error('packet spec needs ' + k);
  if (!['A1', 'A2'].includes(spec.altitude)) throw new Error('packets carry A1 calls or A2 loops; higher altitudes are agents, not packets');
  if (spec.altitude === 'A1' && spec.grant.length) throw new Error('an A1 packet carries no grant: one prompt in, one answer out (R12)');
  const me = identity('A3', `issuer: ${spec.from}`);
  const env = me.sign({ v: 1, ...spec, issued_at: now() });
  fs.mkdirSync(path.join(TASKS, spec.id), { recursive: true });
  fs.writeFileSync(path.join(TASKS, spec.id, 'packet.json'), JSON.stringify(env, null, 1) + '\n');
  console.log(`packet ${spec.id}: ${spec.altitude}, ${spec.inputs.length} inputs, for ${spec.for}, signed ${me.fp}`);
}

async function run() {
  const id = arg('--id'), as = arg('--as'), envName = arg('--env');
  if (!as || !envName) throw new Error('run needs --as <agent> and --env <runtime, e.g. R1 Claude Code cloud, riskmandate-personal>');
  const p = JSON.parse(fs.readFileSync(path.join(TASKS, id, 'packet.json'), 'utf8'));
  if (!verify(p)) throw new Error('packet signature does not verify: not run');
  const P = p.body, { call } = await import(path.join(ROOT, 'admin/tools/llm.mjs'));
  const me = identity(P.altitude, `${P.altitude === 'A1' ? 'calls' : 'loop'}: ${id} by ${as}`);
  const tries = P.altitude === 'A2' ? (P.max_tries || 3) : 1;          // A1: one call per input; A2: loop until valid
  const outputs = [], calls = [];
  for (const input of P.inputs) {
    let out = null;
    for (let t = 1; t <= tries && !out; t++) {
      const c = identity('A1', `LLM call: ${id} ${input.id} #${t}`);
      const prompt = P.prompt.replace('{{input}}', JSON.stringify(input));
      const { text, line } = await call({ task: `WS-215/packet/${id}`, agent: as, tier: arg('--tier', P.tier || 'cheap'), model: arg('--model'), messages: [{ role: 'user', content: prompt }], max_tokens: +arg('--max-tokens', P.max_tokens || 400) });
      let parsed = null; try { parsed = JSON.parse((/\{[\s\S]*\}/.exec(text || '') || ['null'])[0]); } catch {}
      const ok = !!parsed && P.output.required.every((k) => k in parsed) && (!P.output.enum || Object.entries(P.output.enum).every(([k, vs]) => vs.includes(parsed[k])));
      calls.push(c.sign({ input: input.id, try: t, ok, model: line.model_served, ledger_id: line.id, cost_usd: line.cost_usd, latency_ms: line.latency_ms, prompt_sha256: crypto.createHash('sha256').update(prompt).digest('hex') }));
      if (ok) out = { input: input.id, ...parsed, tries: t, call_fp: c.fp };
    }
    outputs.push(out || { input: input.id, error: `no valid output in ${tries} tr${tries > 1 ? 'ies' : 'y'}` });
  }
  const res = me.sign({ packet: id, packet_fp: p.by.fp, runner: as, environment: envName, ran_at: now(), runner_choices: { tier: arg('--tier', P.tier || 'cheap'), model: arg('--model') || null, max_tokens: +arg('--max-tokens', P.max_tokens || 400) }, outputs, calls, cost_usd: +calls.reduce((s, c) => s + (c.body.cost_usd || 0), 0).toFixed(6) });
  const safe = as.replace(/[^A-Za-z0-9.@-]/g, '_');
  fs.writeFileSync(path.join(TASKS, id, `result-${safe}.json`), JSON.stringify(res, null, 1) + '\n');
  console.log(`ran ${id} as ${as} in ${envName}: ${outputs.filter((o) => !o.error).length}/${outputs.length} valid, ${calls.length} calls, ${res.body.cost_usd} USD, signed ${me.fp}`);
}

function check() {
  const ids = arg('--id') ? [arg('--id')] : (fs.existsSync(TASKS) ? fs.readdirSync(TASKS).filter((d) => fs.existsSync(path.join(TASKS, d, 'packet.json'))) : []);
  let bad = 0;
  for (const id of ids) {
    const p = JSON.parse(fs.readFileSync(path.join(TASKS, id, 'packet.json'), 'utf8'));
    const pv = verify(p); if (!pv) bad++;
    const rs = fs.readdirSync(path.join(TASKS, id)).filter((f) => /^result-.*\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(TASKS, id, f), 'utf8')));
    const rows = rs.map((r) => { const ok = verify(r) && r.body.packet_fp === p.by.fp && r.body.calls.every(verify); if (!ok) bad++; return `${r.body.runner} (${r.body.environment}) ${ok ? 'verified' : 'NOT VERIFIED'}, ${r.body.outputs.filter((o) => !o.error).length}/${r.body.outputs.length}`; });
    console.log(`${id}: ${p.body.altitude} for ${p.body.for}; packet ${pv ? 'verified' : 'NOT VERIFIED'}; results: ${rows.join('; ') || 'none yet'}`);
  }
  process.exitCode = bad ? 1 : 0;
}

const cmd = process.argv[2];
if (cmd === 'new') create(); else if (cmd === 'run') await run(); else if (cmd === 'verify' || cmd === 'list') check();
else console.log('usage: node abp/tools/packets.mjs new --spec FILE | run --id ID --as AGENT --env ENV | verify [--id ID] | list');
