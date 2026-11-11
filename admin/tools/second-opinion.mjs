#!/usr/bin/env node
// Second-opinion check (work/20's first real use; the lead, 12:39 UTC, advised by fable.fringe@).
// For each event re-read in the last N hours (default 2), a cheap open model (tier "check") reads the event's public page text and
// our entry, and answers only match / mismatch / unclear for status, start, end and place. The model's word is EVIDENCE, never
// fact: nothing in data/events.json changes from it. Mismatches go to data/second-opinion.json (verdicts only, no page text, no
// model text) for work/13 (Vicky's conductor) and researcher.2.
//   node admin/tools/second-opinion.mjs [--hours 2] [--limit N] [--mock] [--out data/second-opinion.json]
// Page text: the public event page fetched here (https only, never websummit.com, one request at a time, 0.6 s apart, identified).
// Every call goes through admin/tools/llm.mjs (ledger, credit check, daily cap). Page text is never written to git.
import fs from 'node:fs'; import path from 'node:path';
import { call, credit, summary } from './llm.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const HOURS = +arg('hours', 2), LIMIT = +arg('limit', 0) || 0, MOCK = !!arg('mock', false), OUT = path.join(ROOT, arg('out', 'data/second-opinion.json'));
const AGENT = process.env.AGENT || 'dev.2.fringe@PrompTugal.dinis';
const now = Date.now(), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const events = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/events.json'), 'utf8')).events
  .filter((e) => /^https:\/\//.test(e.url) && !/(^|\.)websummit\.com$/i.test(new URL(e.url).hostname) && now - Date.parse(e.read_at) <= HOURS * 3600e3 + 60e3);
const todo = LIMIT ? events.slice(0, LIMIT) : events;

async function pageText(url) {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'LisbonFringeCheck/1.0 (public pages only; fringe.promptugal.news)' } });
  if (!r.ok) return { err: 'http_' + r.status };
  const html = await r.text();
  let facts = '';
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);   // Luma's own structured data: start_at, end_at, place
  if (m) { const g = (k) => (m[1].match(new RegExp('"' + k + '":"([^"]*)"')) || [])[1]; facts = `Structured: start_at=${g('start_at')} end_at=${g('end_at')} timezone=${g('timezone')} city=${g('city_state')}\n`; }
  const t = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return { text: facts + t.slice(0, 4500) };
}
const PROMPT = (e, t) => `Compare a web page with a record of the event. The page's own words win. Times are UTC (Lisbon is UTC in November).
RECORD: status=${e.status} start=${e.start || 'unknown'} end=${e.end || 'unknown'} place=${e.place || 'unknown'}
(status values: on, online, moved, cancelled, unknown)
PAGE TEXT:
${t}

Answer with exactly four lines and nothing else:
status: match | mismatch | unclear
start: match | mismatch | unclear
end: match | mismatch | unclear
place: match | mismatch | unclear
For a mismatch add " - " and what the page says in at most 12 words.`;
const parse = (txt) => { const out = {}; for (const k of ['status', 'start', 'end', 'place']) { const m = new RegExp('^\\s*' + k + '\\s*:\\s*(match|mismatch|unclear)\\b\\s*(?:[-–]\\s*(.*))?$', 'im').exec(txt || ''); out[k] = m ? { v: m[1].toLowerCase(), says: (m[2] || '').trim().slice(0, 100) || undefined } : { v: 'unparsed' }; } return out; };

const c0 = await credit(); console.log('credit before:', JSON.stringify(c0));
const results = []; let spent0 = summary().cost_usd;
for (const e of todo) {
  const p = MOCK ? { text: 'mock page' } : await pageText(e.url).catch((x) => ({ err: String(x.message || x).slice(0, 60) }));
  if (p.err) { results.push({ id: e.id, url: e.url, error: p.err }); await sleep(600); continue; }
  const r = await call({ task: 'WS-215/second-opinion', agent: AGENT, tier: 'check', mock: MOCK, max_tokens: 120, messages: [{ role: 'user', content: PROMPT(e, p.text) }] });
  if (!r.text) { results.push({ id: e.id, url: e.url, error: r.line.status }); if (/refused|credit/.test(r.line.status)) { console.log('stopping:', r.line.status); break; } continue; }
  results.push({ id: e.id, url: e.url, read_at: e.read_at, ...parse(r.text) });
  if (!MOCK) await sleep(600);
}
// end and place from an 8B model are mostly noise (time formats, "Address given to guests"): they are counted, not listed
const bad = results.filter((r) => !r.error && ['status', 'start'].some((k) => r[k]?.v === 'mismatch'));
const noisy = (k) => results.filter((r) => !r.error && r[k]?.v === 'mismatch').length;
const s = summary();
const doc = { about: 'Second-opinion checks (work/20): a cheap open model read each event\'s public page and our entry. EVIDENCE only, never fact: no data changed from it. Verdicts only; no page or model text is kept in git. Mismatches are for work/13 and researcher.2 to re-read at source.',
  run_at: new Date().toISOString().slice(0, 19) + 'Z', by: AGENT, model: 'tier check (see admin/tools/llm-models.json)', hours: HOURS, checked: results.filter((r) => !r.error).length, errors: results.filter((r) => r.error).length, mismatches_status_or_start: bad.length, end_mismatches_not_listed: noisy('end'), place_mismatches_not_listed: noisy('place'),
  cost_usd_this_run: +(s.cost_usd - spent0).toFixed(5), label: 'evidence', mismatched: bad.map((r) => ({ id: r.id, url: r.url, status: r.status, start: r.start })), all: results.map((r) => r.error ? { id: r.id, error: r.error } : { id: r.id, status: r.status.v, start: r.start.v, end: r.end.v, place: r.place.v }) };
if (!MOCK) fs.writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
console.log(JSON.stringify({ checked: doc.checked, errors: doc.errors, mismatches: doc.mismatches_status_or_start, cost_usd: doc.cost_usd_this_run, per_100_usd: doc.checked ? +(doc.cost_usd_this_run / doc.checked * 100).toFixed(5) : null }));
