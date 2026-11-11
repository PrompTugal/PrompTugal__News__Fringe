#!/usr/bin/env node
// work/04: data/communities.json, the groups behind this week's events. Owner: conductor.fringe@PrompTugal.indi.
// Communities are the organisers in data/events.json, split as the graph splits them (admin/build/graph.mjs
// organisersOf), so a community's id here is its graph node id without "community:". For each event on Luma, the
// event page is re-read once and only its hosting calendar is kept (an organisation's calendar: name, short
// description, website, public page). A personal calendar is a private person's and is never kept; hosts (people) are
// never read out. Every fact carries the page it came from and the UTC time read. Not websummit.com, ever.
// Run: node admin/tools/communities.mjs   (about one second per Luma page)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { organisersOf } from '../build/graph.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-') || 'x';
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// a calendar whose name is not the organiser's as events.json writes it
const CAL_ALIAS = { 'ufl at web summit 2026': 'unicorn factory lisboa', 'yorkseed': 'yorkseed global capital network',
  'canopy community calendar': 'canopy community', 'female founders breakfast europe': 'female founders breakfasts',
  'primal events workshops': 'primal events workshops', 'exa events': 'exa', 'rockstart': 'rockstart' };

// what a calendar says of itself: its first sentence, with no links and no person named as its curator
const tidy = (t) => {
  if (!t) return null;
  const s = String(t).replace(/https?:\/\/\S+|\b[a-z0-9.-]+\.(?:co|com|io|in|so)\/\S*/gi, ' ').split(/\n|(?<=[.!?])\s/)[0]
    .replace(/,?\s*(?:curated|organi[sz]ed|run|hosted) by .*$/i, '').replace(/\s+/g, ' ').trim();
  return s.length > 3 ? s : null;
};

function lumaCalendar(url) {
  if (!/^https:\/\/(luma\.com|lu\.ma)\//.test(url)) return null;
  let html = '';
  try { html = execFileSync('curl', ['-sSL', '-m', '20', '-A', 'LisbonFringe/1.0 (+https://fringe.promptugal.news)', url], { maxBuffer: 8e6 }).toString(); }
  catch { return { read_at: now(), calendar: null, error: 'unreachable' }; }
  const read_at = now();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  let c = null;
  try { c = JSON.parse(m[1]).props.pageProps.initialData.data.calendar || null; } catch { c = null; }
  if (!c || c.is_personal || c.access_level !== 'public') return { read_at, calendar: null };
  const web = c.website ? String(c.website).replace(/[?#].*$/, '') : null;
  return { read_at, calendar: { name: c.name, what: tidy(c.description_short), website: /^https:\/\//.test(web || '') ? web : null,
    page: c.slug ? `https://luma.com/${c.slug}` : null } };
}

const { events } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/events.json'), 'utf8'));
const out = new Map();
const community = (name) => {
  const id = slug(name);
  if (!out.has(id)) out.set(id, { id, name, what: null, join: null, links: [], events: [], sources: [] });
  return out.get(id);
};
const unmatched = [];
for (const e of events) {
  const orgs = organisersOf(e.organiser);
  for (const o of orgs) { const c = community(o); if (!c.events.includes(e.id)) c.events.push(e.id); }
  const got = lumaCalendar(e.url);
  sleep(got ? 1000 : 0);
  if (!got?.calendar) continue;
  const cal = got.calendar, key = CAL_ALIAS[norm(cal.name)] ?? norm(cal.name);
  const o = orgs.find((x) => norm(x).includes(key) || key.includes(norm(x)));
  if (!o) { unmatched.push(`${cal.name} (${e.id})`); continue; }
  const c = community(o);
  const src = { url: e.url, read_at: got.read_at, what: "the event page's hosting Luma calendar" };
  if (!c.sources.some((s) => s.url === e.url)) c.sources.push(src);
  if (cal.what && !c.what) c.what = { text: cal.what, quoted_from: e.url, read_at: got.read_at };
  if (cal.page && !c.links.some((l) => l.url === cal.page)) c.links.push({ label: 'Luma calendar', url: cal.page });
  if (cal.website && !c.links.some((l) => l.url === cal.website)) c.links.push({ label: 'website', url: cal.website });
}
for (const c of out.values()) {
  const cal = c.links.find((l) => l.label === 'Luma calendar');
  c.join = cal ? `Follow its public Luma calendar: ${cal.url}` : c.links.length ? `Its public website: ${c.links[0].url}` : 'unknown: join through its event pages';
  c.label = c.sources.length ? 'fact' : 'from events.json only';
}
const list = [...out.values()].sort((a, b) => b.events.length - a.events.length || a.name.localeCompare(b.name));
fs.writeFileSync(path.join(ROOT, 'data/communities.json'), JSON.stringify({
  about: "Lisbon Fringe's communities (work/04): the groups behind this week's events, each with its public links and its events (ids in data/events.json; the id here is its /graph/ node id without 'community:'). Organisations only: a personal Luma calendar, a host or an independent organiser is never listed. No contact details. Independent of Web Summit.",
  by: 'conductor.fringe@PrompTugal.indi', updated: now(),
  how: "admin/tools/communities.mjs: each Luma event page in data/events.json re-read once; only its hosting calendar (name, short description, website, public page) is kept, with the page and the time read. 'what' is quoted from that calendar, not written by us. Communities with no public calendar keep join 'unknown' until their own page is read.",
  unmatched_calendars: unmatched,
  communities: list,
}, null, 2) + '\n');
console.log(`data/communities.json: ${list.length} communities, ${list.filter((c) => c.sources.length).length} with a public calendar read; unmatched: ${unmatched.length}`);
