// /models/ and /api/v1/models.json (work/47, dev.2.fringe@PrompTugal.dinis): every model experiment, the router's tiers and cap, credit and
// who calls it. COUNTS ONLY: no prompt, page text or model output (the ledger and raw store stay outside git).
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const load = (f) => (existsSync(join(root, f)) ? JSON.parse(readFileSync(join(root, f), 'utf8')) : null);
const usd = (n) => (n == null ? 'n/a' : n === 0 ? '$0' : n < 0.01 ? '$' + n.toFixed(4) : '$' + n.toFixed(3));
const OPEN = /^(meta-llama|deepseek|qwen|mistralai|moonshotai|google\/gemma|openai\/gpt-oss)/;
export function modelsData() {
  const ex = load('data/models-experiments.json'), led = load('data/models-ledger.json'), tab = load('admin/tools/llm-models.json');
  const days = led?.days || {}, day = Object.keys(days).sort().at(-1);
  const today = day ? days[day] : null;
  return { about: 'Lisbon Tech Fringe model experiments and the model router. Counts only: no prompts, page text or model output.',
    experiments: ex?.experiments || [], comparison: ex?.comparison || null,
    router: { tiers: Object.fromEntries(Object.entries(tab?.tiers || {}).map(([k, t]) => [k, { model: t.model, fallback: t.fallback, usd_per_million_tokens: t.usd_per_m, open_weight: OPEN.test(t.model), for: t.for }])), daily_cap_usd: tab?.daily_cap_usd, min_credit_usd: tab?.min_credit_usd },
    ledger: today ? { day, updated: led.updated, calls: today.calls, cost_usd: today.cost_usd, by_model: today.by_model, by_tier: today.by_tier, by_agent: today.by_agent, by_task: today.by_task, by_status: today.by_status, credit: led.credit_at_update } : null };
}
export const modelsCss = `.mx{overflow-wrap:anywhere}.mx code{overflow-wrap:anywhere;word-break:break-all}.mx .mxpair>*{min-width:0}@media(max-width:480px){.mx .mxpair{grid-template-columns:1fr}}.mx .mxnum{font-size:2rem;font-weight:700;line-height:1.1}.mx .mxpair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.mx .mxpair .card{margin:0}.mx table{border-collapse:collapse;width:100%;font-size:.9rem}.mx th,.mx td{text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);vertical-align:top}.mx .tag.ow{border-color:var(--accent);color:var(--accent)}.mx .tw{overflow-x:auto}`;
export function modelsBody(esc) {
  const d = modelsData(), c = d.comparison, L = d.ledger;
  const tag = (m, ow) => `<code>${esc(m)}</code> <span class="tag ${ow ? 'ow' : ''}">${ow ? 'open weight' : 'closed'}</span>`;
  const exs = d.experiments.map((e) => `<div class="card"><strong>${esc(e.id)} · ${esc(e.task)}</strong>
<div>${tag(e.model, e.open_weight)} <span class="tag">tier ${esc(e.tier)}</span></div>
<div class="muted">${esc(String(e.at).replace('T', ' '))} UTC · ${esc(e.approach)} · ${e.events_checked} events · ${e.calls} calls</div>
<div><strong>${usd(e.cost_usd)}</strong> total${e.cost_per_100_events_usd != null ? ` · <strong>${usd(e.cost_per_100_events_usd)}</strong> per 100 events` : ''}</div>
<div>${esc(e.result)} <em>${esc(e.verdict || '')}</em></div></div>`).join('');
  const rows = (o) => Object.entries(o || {}).sort((a, b) => b[1].calls - a[1].calls).map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td>${v.calls}</td><td>${usd(v.cost_usd)}</td><td>${v.tokens_in}/${v.tokens_out}</td></tr>`).join('');
  return `<div class="mx"><h1>Model experiments</h1>
<p>What we have tried with OpenRouter and open-weight models, what it cost and what it found. Every call goes through one wrapper with a ledger (<code>admin/tools/llm.mjs</code>). <strong>Counts only</strong>: no prompts, page text or model output are shown or kept in git. A model's word is evidence, never fact. JSON: <a href="/api/v1/models.json">/api/v1/models.json</a>.</p>
${c ? `<h2>${esc(c.title)}</h2><div class="mxpair"><div class="card"><div class="muted">${esc(c.a.params)} · <code>${esc(c.a.model)}</code></div><div class="mxnum">${c.a.flagged}</div><div>events flagged (noise)</div><div class="muted">${usd(c.a.cost_per_100_events_usd)} per 100 events</div></div>
<div class="card"><div class="muted">${esc(c.b.params)} · <code>${esc(c.b.model)}</code></div><div class="mxnum">${c.b.flagged}</div><div>flagged, <strong>${c.b.worth_a_look}</strong> worth a person's look</div><div class="muted">${usd(c.b.cost_per_100_events_usd)} per 100 events</div></div></div>
<p>${esc(c.lesson)}</p>` : ''}
<h2>Every experiment</h2>${exs || '<p class="muted">None yet.</p>'}
<h2>The router</h2><p class="muted">The caller names a tier; the router picks the model, checks the key's credit first, and refuses above the daily cap (<strong>${usd(d.router.daily_cap_usd)}</strong> a day per session ledger) or below ${usd(d.router.min_credit_usd)} of credit.</p>
<div class="tw"><table><tr><th>Tier</th><th>Model</th><th>$/M tokens in/out</th><th>For</th></tr>${Object.entries(d.router.tiers).map(([k, t]) => `<tr><td>${esc(k)}</td><td>${tag(t.model, t.open_weight)}</td><td>${esc(t.usd_per_million_tokens)}</td><td>${esc(t.for)}</td></tr>`).join('')}</table></div>
${L ? `<h2>Today's ledger (${esc(L.day)})</h2><p><strong>${L.calls}</strong> calls · <strong>${usd(L.cost_usd)}</strong> spent${L.credit?.account_remaining_usd != null ? ` · account credit left ${usd(L.credit.account_remaining_usd)}, key limit left ${usd(L.credit.key_remaining_usd)}` : ''} <span class="muted">(as of ${esc(String(L.updated).slice(0, 16).replace('T', ' '))} UTC)</span></p>
<div class="tw"><table><tr><th>Model</th><th>Calls</th><th>Cost</th><th>Tokens in/out</th></tr>${rows(L.by_model)}</table></div>
<div class="tw"><table><tr><th>Called by</th><th>Calls</th><th>Cost</th><th>Tokens in/out</th></tr>${rows(L.by_agent)}</table></div>
<p class="muted">The ledger is kept per session, outside git; this page shows the sessions that have summarised theirs, so another agent's calls appear once it does the same (<code>node admin/tools/models-summary.mjs</code>).</p>` : ''}
<p class="muted"><a href="/how/">How this is made</a> · <a href="https://github.com/PrompTugal/PrompTugal__News__Fringe/blob/dev/admin/tools/llm.mjs">the router's code</a></p></div>`;
}
