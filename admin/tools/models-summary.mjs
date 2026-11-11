#!/usr/bin/env node
// Counts-only summary of this session's model ledger for /models/ (work/47). No prompt, page text or model output: only
// calls, tokens, cost and status by model, tier, agent and task, plus the credit now. The ledger itself stays outside git.
//   node admin/tools/models-summary.mjs        (writes data/models-ledger.json)
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { credit } from './llm.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DIR = process.env.LLM_LEDGER_DIR || path.join(os.homedir(), '.fringe-ledger');
const days = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /^\d{4}-\d\d-\d\d\.jsonl$/.test(f)).sort() : [];
const by = {}, tot = (k) => (by[k] ||= {});
const out = { days: {} };
for (const f of days) {
  const d = f.slice(0, 10), L = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const grp = (key) => L.reduce((m, l) => { const v = l[key] || '?'; const x = (m[v] ||= { calls: 0, ok: 0, cost_usd: 0, tokens_in: 0, tokens_out: 0 }); x.calls++; if (l.status === 'ok') x.ok++; x.cost_usd = +(x.cost_usd + (l.cost_usd || 0)).toFixed(6); x.tokens_in += l.tokens_in || 0; x.tokens_out += l.tokens_out || 0; return m; }, {});
  out.days[d] = { calls: L.length, cost_usd: +L.reduce((s, l) => s + (l.cost_usd || 0), 0).toFixed(6), first: L[0]?.at, last: L.at(-1)?.at, by_model: grp('model'), by_tier: grp('tier'), by_agent: grp('agent'), by_task: grp('task'), by_status: grp('status') };
}
const c = await credit();
Object.assign(out, { about: 'Counts only, from the model ledger of the sessions that run admin/tools/llm.mjs (the ledger is per session, outside git). No prompt, page text or model output.', updated: new Date().toISOString().slice(0, 19) + 'Z', credit_at_update: { key_remaining_usd: c.key_remaining != null ? +c.key_remaining.toFixed(2) : null, account_remaining_usd: c.account_remaining != null ? +c.account_remaining.toFixed(2) : null } });
fs.writeFileSync(path.join(ROOT, 'data/models-ledger.json'), JSON.stringify(out, null, 1) + '\n'); console.log('wrote data/models-ledger.json', Object.keys(out.days).join(','));
