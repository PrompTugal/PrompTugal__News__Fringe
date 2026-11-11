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
// THE LEAD'S HOLD (work/49, 16:23 UTC): Luma's terms allow access only through its publicly supported interfaces, and Meetup's terms are on hold for
// machines (sources.md). This tool never fetches luma.com, lu.ma or meetup.com pages. Luma events are to be fed from the calendars' iCal data that
// researcher.2 collects (a publicly supported interface), once that feed is wired in here; until then they are skipped, not checked.
const HELD = /(^|\.)(luma\.com|lu\.ma|meetup\.com)$/i;
const held = events.filter((e) => HELD.test(new URL(e.url).hostname));
const free = events.filter((e) => !HELD.test(new URL(e.url).hostname));
if (held.length) console.log(`terms hold (work/49): ${held.length} Luma/Meetup events not fetched`);
const todo = LIMIT ? free.slice(0, LIMIT) : free;

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
// The model EXTRACTS what the page says (status, start, end, place); the comparison is done here, on times normalised to UTC minutes,
// so format differences (6:30 PM, 18:30, 2026-11-11T18:30:00.000Z) cannot make a false mismatch.
const PROMPT = (e, t) => `Read this web page text about an event and report what it says. Times in the page are Lisbon time, which equals UTC in November; write them in 24-hour UTC.
PAGE TEXT:
${t}

Answer with exactly four lines and nothing else:
status: on | cancelled | postponed | moved | unclear
start: YYYY-MM-DDTHH:MM (UTC) | unclear
end: YYYY-MM-DDTHH:MM (UTC) | unclear
place: the venue or area named on the page in at most 8 words | online | unclear`;
const line = (txt, k) => ((new RegExp('^\\s*' + k + '\\s*:\\s*(.+)$', 'im').exec(txt || '')) || [])[1]?.trim();
const minutes = (v) => { const m = /(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/.exec(v || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60000 : null; };
const words = (x) => new Set(String(x || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !['lisboa', 'lisbon', 'portugal', 'online', 'address', 'given', 'guests', 'venue', 'event', 'page'].includes(w)));
const cmpTime = (page, rec) => { const a = minutes(page), b = minutes(rec); return a == null || b == null ? { v: 'unclear' } : a === b ? { v: 'match' } : { v: 'mismatch', says: String(page).slice(0, 16) }; };
function cmpStatus(page, rec) {
  const p = (page || 'unclear').toLowerCase();
  if (!/^(on|cancelled|postponed|moved|unclear)/.test(p) || p.startsWith('unclear')) return { v: 'unclear' };
  const pg = p.startsWith('on') ? 'on' : p.startsWith('cancel') ? 'cancelled' : 'moved';   // postponed counts as moved
  const r = rec === 'online' || rec === 'unknown' ? 'on' : rec;
  return pg === r ? { v: 'match' } : rec === 'unknown' ? { v: 'unclear', says: pg } : { v: 'mismatch', says: pg };
}
function cmpPlace(page, rec) {
  if (!page || /^unclear/i.test(page)) return { v: 'unclear' };
  const recOnline = /^online\b/i.test(rec || ''), pgOnline = /^online\b/i.test(page);
  if (recOnline || pgOnline) return recOnline && pgOnline ? { v: 'match' } : { v: 'mismatch', says: page.slice(0, 60) };
  const a = words(page), b = words(rec); if (!a.size || !b.size) return { v: 'unclear' };
  return [...a].some((w) => b.has(w)) ? { v: 'match' } : { v: 'unclear', says: page.slice(0, 60) };   // a different name is not proof of a different place
}
const parse = (txt, e) => ({ status: cmpStatus(line(txt, 'status'), e.status), start: cmpTime(line(txt, 'start'), e.start), end: cmpTime(line(txt, 'end'), e.end), place: cmpPlace(line(txt, 'place'), e.place) });

const c0 = await credit(); console.log('credit before:', JSON.stringify(c0));
const results = []; let spent0 = summary().cost_usd;
for (const e of todo) {
  const p = MOCK ? { text: 'mock page' } : await pageText(e.url).catch((x) => ({ err: String(x.message || x).slice(0, 60) }));
  if (p.err) { results.push({ id: e.id, url: e.url, error: p.err }); await sleep(600); continue; }
  const r = await call({ task: 'WS-215/second-opinion', agent: AGENT, tier: 'check', mock: MOCK, max_tokens: 120, messages: [{ role: 'user', content: PROMPT(e, p.text) }] });
  if (!r.text) { results.push({ id: e.id, url: e.url, error: r.line.status }); if (/refused|credit/.test(r.line.status)) { console.log('stopping:', r.line.status); break; } continue; }
  results.push({ id: e.id, url: e.url, read_at: e.read_at, ...parse(r.text, e) });
  if (!MOCK) await sleep(600);
}
// ---- Luma events: compared with the calendars' public iCal data that researcher.2 saves in data/feeds/luma-ical.json (a publicly supported
// interface; work/49). No page is fetched and no model is called: pure code. Matched by name (status words such as [CANCELLED] stripped) and start
// date; compared on UTC minutes; the feed's own status words are read from the event name. Evidence only, like the model's verdicts.
const feedFile = path.join(ROOT, 'data/feeds/luma-ical.json');
if (fs.existsSync(feedFile) && !MOCK) {
  const feed = JSON.parse(fs.readFileSync(feedFile, 'utf8'));
  const norm = (n) => String(n).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\[【(][^\]】)]*(cancel|postpon|moved|sold out|full)[^\]】)]*[\]】)]/gi, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const fstatus = (n) => (/cancel/i.test(n) ? 'cancelled' : /postpon|moved|rescheduled/i.test(n) ? 'moved' : 'on');
  const byKey = new Map(); for (const f of feed.events || []) byKey.set(norm(f.name) + '|' + String(f.start).slice(0, 10), f);
  const all = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/events.json'), 'utf8')).events;
  let nf = 0;
  for (const e of all.filter((x) => HELD.test(new URL(x.url).hostname) && !/(^|\.)websummit\.com$/i.test(new URL(x.url).hostname))) {
    const f = byKey.get(norm(e.name) + '|' + String(e.start || e.date).slice(0, 10)); if (!f) continue; nf++;
    const place = f.location ? cmpPlace(f.location, e.place) : { v: 'unclear' };
    results.push({ id: e.id, url: e.url, read_at: feed.read_at, source: 'ical', status: cmpStatus(fstatus(f.name), e.status), start: cmpTime(f.start, e.start), end: cmpTime(f.end, e.end), place });
  }
  console.log(`ical feed: ${nf} Luma events compared (feed read ${feed.read_at})`);
}
// comparison is in code, on times normalised to UTC minutes
const bad = results.filter((r) => !r.error && ['status', 'start', 'end', 'place'].some((k) => r[k]?.v === 'mismatch'));
const noisy = (k) => results.filter((r) => !r.error && r[k]?.v === 'mismatch').length;
const s = summary();
const doc = { about: 'Second-opinion checks (work/20): a cheap open model read each event\'s public page and our entry. EVIDENCE only, never fact: no data changed from it. Verdicts only; no page or model text is kept in git. Mismatches are for work/13 and researcher.2 to re-read at source.',
  run_at: new Date().toISOString().slice(0, 19) + 'Z', by: AGENT, model: 'tier check (see admin/tools/llm-models.json) for non-Luma pages; Luma events from the calendars\' public iCal data (data/feeds/luma-ical.json), no page fetched', hours: HOURS, checked: results.filter((r) => !r.error).length, errors: results.filter((r) => r.error).length, mismatches: bad.length,
  cost_usd_this_run: +(s.cost_usd - spent0).toFixed(5), label: 'evidence', mismatched: bad.map((r) => ({ id: r.id, url: r.url, status: r.status, start: r.start, end: r.end, place: r.place })), all: results.map((r) => r.error ? { id: r.id, error: r.error } : { id: r.id, status: r.status.v, start: r.start.v, end: r.end.v, place: r.place.v }) };
if (!MOCK) fs.writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
console.log(JSON.stringify({ checked: doc.checked, errors: doc.errors, mismatches: doc.mismatches, cost_usd: doc.cost_usd_this_run, per_100_usd: doc.checked ? +(doc.cost_usd_this_run / doc.checked * 100).toFixed(5) : null }));
