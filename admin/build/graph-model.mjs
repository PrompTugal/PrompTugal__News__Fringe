// work/42, the semantic graph (ontologist.1.fringe@PrompTugal.dinis). Brief 13: "a massive semantic graph ... all of these
// should be JSON files ... everything should be linked to everything".
// Derived at build time from data/events.json (the researchers keep writing it), plus the small curated files in
// data/graph/ (festivals, organiser folds, personas) and data/organisers.json (dev.2's canonical names, work/23) and
// data/communities.json (work/04's calendars). Nothing here is hand-copied from an event.
//
// Types: day, festival, organiser, event, session, place, persona, topic. Every entity has a stable id (a slug) and a
// page; every link is typed, and every link that comes from an event carries that event's source URL and read_at.
// Organisations only: an unknown or independent (private) organiser makes no organiser node (organisersOf, work/05).

import { readFileSync, existsSync } from 'node:fs';
import { organisersOf, areaOf } from './graph.mjs';

const norm = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/^the\s+/, '').replace(/[™®]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-') || 'x';

export const TYPES = ['days', 'festivals', 'organisers', 'events', 'sessions', 'places', 'personas', 'topics', 'platforms'];
// The page of each type (URLs may change freely while traffic is low; the API ids never do).
export const PREFIX = { day: 'd', festival: 'f', organiser: 'o', event: 'e', session: 's', place: 'n', persona: 'p', topic: 't', platform: 'r' };
export const pathOf = (type, id) => `/${PREFIX[type]}/${encodeURIComponent(id)}/`;

// The verbs (subject type, verb, object type): the schema of every link.
export const VERBS = {
  hasEvent:   ['festival', 'event'],    // the festival runs it, or a partner runs it under the festival's name
  lists:      ['festival', 'event'],    // the festival's public feed lists it (weaker than hasEvent)
  runs:       ['organiser', 'event'],   // lead organiser (first named on the page)
  coRuns:     ['organiser', 'event'],   // named with others
  hosts:      ['organiser', 'event'],   // "hosted by": gives the venue, not a co-organiser
  supports:   ['organiser', 'event'],   // "powered by": a sponsor or partner
  runsFestival: ['organiser', 'festival'],
  partOf:     ['organiser', 'organiser'],
  onDay:      ['event', 'day'],
  at:         ['event', 'place'],
  forPersona: ['event', 'persona'],
  about:      ['event', 'topic'],
  hasSession: ['event', 'session'],
  registerOn: ['event', 'platform'],  // where you register: the host of the event's own URL (brief 13 addendum)
};

// The grammar (Fractal Semantic Graphs, Dinis Cruz, newsroom.sgit.ai, read 2026-11-11 16:56 UTC): every edge is a verb,
// stated in both directions, with an inverse a person would say; no relates_to. The verb ids above stay as they are
// (the API and /data/'s queries use them); this adds how each reads forwards and back.
export const GRAMMAR = {
  hasEvent:     { says: 'holds',                   inverse: 'is held under' },
  lists:        { says: 'lists in its feed',       inverse: 'is listed in the feed of' },
  runs:         { says: 'runs',                    inverse: 'is run by' },
  coRuns:       { says: 'co-runs',                 inverse: 'is co-run by' },
  hosts:        { says: 'hosts the venue of',      inverse: 'is hosted by' },
  supports:     { says: 'supports',                inverse: 'is supported by' },
  runsFestival: { says: 'runs the festival',       inverse: 'is a festival run by' },
  partOf:       { says: 'is a programme of',       inverse: 'has the programme' },
  onDay:        { says: 'happens on',              inverse: 'has on it' },
  at:           { says: 'happens in',              inverse: 'is where it happens:' },
  forPersona:   { says: 'is for',                  inverse: 'can go to' },
  about:        { says: 'is about',                inverse: 'is the topic of' },
  hasSession:   { says: 'has on its agenda',       inverse: 'is a session of' },
  registerOn:   { says: 'takes registrations on',  inverse: 'is where you register for' },
};
for (const [v, [from, to]] of Object.entries(VERBS)) Object.assign(GRAMMAR[v], { from, to });

// The registration platform, from the host of the event's url. Anything else is the organiser's own site.
const PLATFORMS = [['luma', 'Luma', /(^|\.)(lu\.ma|luma\.com)$/], ['meetup', 'Meetup', /(^|\.)meetup\.com$/], ['eventbrite', 'Eventbrite', /(^|\.)eventbrite\./],
  ['partiful', 'Partiful', /(^|\.)partiful\.com$/]];
export function platformOf(url) {
  let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch {}
  const p = PLATFORMS.find(([, , re]) => re.test(host));
  return p ? { id: p[0], name: p[1] } : { id: 'own-site', name: "The organiser's own site", host };
}

const TOPIC_ALIAS = { vc: 'venture capital', vcs: 'venture capital', 'angel investors': 'angel investing',
  agents: 'AI agents', 'agentic internet': 'AI agents', 'ai agents': 'AI agents', ai: 'AI', 'deep tech': 'deeptech & hardware' };
const topicName = (t) => TOPIC_ALIAS[String(t).toLowerCase()] || String(t);

// Is the place in Lisbon (the city or the neighbourhoods the week uses), online, or elsewhere? Elsewhere is named.
const ELSEWHERE = ['Covilhã', 'Mértola', 'Santarém', 'Sintra', 'Estoril', 'Cascais', 'Porto', 'Oeiras', 'Almada'];
export function cityOf(e) {
  const p = `${e.place || ''} ${e.neighbourhood || ''}`;
  if (/^online\b/i.test(e.place || '')) return 'online';
  for (const c of ELSEWHERE) if (new RegExp(c, 'i').test(p)) return c;
  if (/Lisbo|PTW Palace|Gomes Freire|Tagus|Parque das Na/i.test(p) || e.neighbourhood) return 'Lisbon';
  return 'unknown';
}

const readJSON = (root, f) => { try { return existsSync(`${root}/${f}`) ? JSON.parse(readFileSync(`${root}/${f}`, 'utf8')) : null; } catch { return null; } };

export function buildModel(root, events) {
  const festSeed = readJSON(root, 'data/graph/festivals.json')?.festivals || [];
  const personaSeed = readJSON(root, 'data/graph/personas.json')?.personas || [];
  const orgSeed = [...(readJSON(root, 'data/organisers.json')?.organisers || []), ...(readJSON(root, 'data/graph/organisers.json')?.organisers || [])];
  const communities = readJSON(root, 'data/communities.json')?.communities || [];
  const commById = new Map(communities.map((c) => [c.id, c]));
  const commByName = new Map(communities.map((c) => [norm(c.name), c]));

  const E = {}; for (const t of TYPES) E[t] = new Map();
  const links = [];
  const link = (from, verb, to, e) => links.push({ from, verb, to, ...(e ? { source: e.url, read_at: e.read_at } : {}) });

  // --- organisers: one per organisation ------------------------------------------------------------------------
  const alias = new Map();
  for (const o of orgSeed) for (const a of [o.name, o.id, ...(o.aliases || [])]) alias.set(norm(a), o.id);
  const held = new Set(orgSeed.filter((o) => o.hold).map((o) => o.id));   // not yet confirmed an organisation: no name, no page
  const organiser = (raw) => {
    const id = alias.get(norm(raw)) || slug(raw);
    if (!E.organisers.has(id)) {
      const seed = orgSeed.filter((o) => o.id === id).pop();
      const c = commById.get(seed?.community || id) || commByName.get(norm(seed?.name || raw));
      E.organisers.set(id, { id, type: 'organiser', name: seed?.name || raw, links: (c?.links || []).filter((l) => /^https:\/\//.test(l.url || '')),
        what: c?.what || null, part_of: seed?.part_of || null, events: [], lead: [], festivals: [] });
    }
    return E.organisers.get(id);
  };

  // --- festivals --------------------------------------------------------------------------------------------------
  for (const f of festSeed) E.festivals.set(f.id, { id: f.id, type: 'festival', name: f.name, links: f.links || [], organiser: f.organiser || null,
    holds_when: f.holds_when, lists_when: f.lists_when, events: [], listed: [], days: [], _m: f.match || {} });

  // --- personas, days -----------------------------------------------------------------------------------------------
  for (const p of personaSeed) E.personas.set(p.id, { id: p.id, type: 'persona', name: p.name, ask: p.ask, rule: p.rule, label: 'hypothesis (by rule)', events: [], _re: p.match ? new RegExp(p.match, 'i') : null, _lane: p.lane });

  for (const e of events) {
    const id = e.id;
    const city = cityOf(e);
    const ev = { id, type: 'event', name: e.name, url: e.url, read_at: e.read_at, day: e.date, start: e.start || null, end: e.end || null,
      kind: e.kind || 'unknown', size: e.size || null, status: e.status || 'unknown', storm_moved: e.storm_moved ?? null, cost: e.cost || null, platform: null,
      free: /^free\b/i.test(e.cost || '') ? true : (/EUR|€|\d/.test(e.cost || '') ? false : null),
      city, in_lisbon: city === 'Lisbon', place: null, organisers: [], festival: null, listed_by: [], personas: [], topics: [], sessions: [] };
    E.events.set(id, ev);

    // day
    if (e.date) {
      if (!E.days.has(e.date)) E.days.set(e.date, { id: e.date, type: 'day', name: new Date(`${e.date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }), events: [], festivals: [] });
      E.days.get(e.date).events.push(id); link(id, 'onDay', e.date, e);
    }

    // organisers, and the festival named among them
    // A long aside in brackets is the researcher's note, not a name ("(as the page names it: ... not affiliated with
    // Web Summit)" made a node "Web Summit)"); short brackets stay ("(ICE)"). "hosted by" and "powered by" give roles.
    const line = String(e.organiser || '').replace(/\s*\((?:[^()\s]+\s+){2,}[^()]*\)/g, '');
    const roleOf = new Map();
    for (const [re, role] of [[/,?\s+hosted by\s+(.+)$/i, 'hosts'], [/,?\s+powered by\s+(.+)$/i, 'supports']]) {
      const mm = line.match(re); if (mm) for (const n of organisersOf(mm[1])) roleOf.set(norm(n), role);
    }
    const names = organisersOf(line).filter((raw) => !held.has(alias.get(norm(raw)) || slug(raw)) && norm(raw) !== 'web summit');
    names.forEach((raw, i) => {
      const role = i === 0 ? 'runs' : (roleOf.get(norm(raw)) || 'coRuns');
      const fest = [...E.festivals.values()].find((f) => f._m.organiser && norm(raw) === norm(f._m.organiser));
      const o = organiser(raw);
      if (ev.organisers.some((x) => x.id === o.id)) return;
      ev.organisers.push({ id: o.id, lead: i === 0, role });
      o.events.push(id); if (i === 0) o.lead.push(id);
      if (role !== 'runs' && role !== 'coRuns') o[role] = (o[role] || 0) + 1;
      link(o.id, role, id, e);
      if (fest && !ev.festival) { ev.festival = fest.id; fest.events.push(id); link(fest.id, 'hasEvent', id, e); }
    });
    // listed in a festival's feed (but not run under it)
    for (const f of E.festivals.values()) {
      if (ev.festival === f.id || !f._m.listed) continue;
      if (new RegExp(f._m.listed, 'i').test(`${e.check || ''} ${e.note || ''} ${e.place || ''}`)) { ev.listed_by.push(f.id); f.listed.push(id); link(f.id, 'lists', id, e); }
    }

    // place: the neighbourhood as the page names it, else the area in the place line, else the city
    const area = e.neighbourhood || areaOf(e.place);
    const pname = area === 'Online' || city === 'online' ? 'Online' : (area && area !== 'Lisbon' ? area : (city !== 'unknown' ? city : null));
    if (pname) {
      const pid = slug(pname);
      if (!E.places.has(pid)) E.places.set(pid, { id: pid, type: 'place', name: pname, city: pname === 'Online' ? 'online' : (ELSEWHERE.includes(pname) ? pname : (city === 'Lisbon' || pname === 'Lisbon' ? 'Lisbon' : city)), events: [] });
      E.places.get(pid).events.push(id); ev.place = pid; link(id, 'at', pid, e);
    }

    // platform
    const pf = platformOf(e.url);
    if (!E.platforms.has(pf.id)) E.platforms.set(pf.id, { id: pf.id, type: 'platform', name: pf.name, hosts: [], events: [] });
    const P = E.platforms.get(pf.id); P.events.push(id); if (pf.host && !P.hosts.includes(pf.host)) P.hosts.push(pf.host);
    ev.platform = pf.id; link(id, 'registerOn', pf.id, e);

    // topics
    for (const t of new Set((e.topics || []).map(topicName))) {
      const tid = slug(t);
      if (!E.topics.has(tid)) E.topics.set(tid, { id: tid, type: 'topic', name: t, events: [] });
      E.topics.get(tid).events.push(id); ev.topics.push(tid); link(id, 'about', tid, e);
    }

    // personas, by rule
    const text = `${e.name} ${(e.topics || []).join(' ')} ${e.kind || ''}`;
    const invite = /invite[- ]only|approved guests|closed group/i.test(`${e.join || ''} ${e.place || ''} ${e.cost || ''}`);
    for (const p of E.personas.values()) {
      const hit = p._re ? (p._re.test(text) || (p._lane && e.lane === p._lane)) : !invite;
      if (hit) { p.events.push(id); ev.personas.push(p.id); link(id, 'forPersona', p.id, e); }
    }
  }

  // sessions: the timed agenda an event's own page publishes (data/graph/sessions.json; title and time, never a speaker)
  for (const x of readJSON(root, 'data/graph/sessions.json')?.sessions || []) {
    const ev = E.events.get(x.event); if (!ev) continue;
    E.sessions.set(x.id, { id: x.id, type: 'session', name: x.name, kind: x.kind || null, event: x.event, day: ev.day, start: x.start || null, end: x.end || null,
      place: ev.place, festival: ev.festival, url: x.url, read_at: x.read_at, label: x.label || 'fact' });
    ev.sessions.push(x.id); links.push({ from: x.event, verb: 'hasSession', to: x.id, source: x.url, read_at: x.read_at });
  }

  // festival -> organiser, festival -> days; organiser part_of
  for (const f of E.festivals.values()) {
    if (f.organiser) { const o = organiser(E.organisers.get(f.organiser)?.name || f.name); o.festivals.push(f.id); link(o.id, 'runsFestival', f.id); }
    f.days = [...new Set([...f.events, ...f.listed].map((id) => E.events.get(id).day))].sort();
    for (const d of f.days) E.days.get(d)?.festivals.push(f.id);
    delete f._m;
  }
  for (const o of E.organisers.values()) if (o.part_of) { organiser(o.part_of); link(o.id, 'partOf', o.part_of); }
  for (const p of E.personas.values()) { delete p._re; delete p._lane; }

  // Stars first: organisers by events led, then by events.
  const sorted = {};
  for (const t of TYPES) sorted[t] = [...E[t].values()];
  sorted.organisers = sorted.organisers.filter((o) => o.events.length || o.festivals.length)
    .sort((a, b) => b.lead.length - a.lead.length || b.events.length - a.events.length || a.name.localeCompare(b.name));
  sorted.sessions.sort((a, b) => String(a.start).localeCompare(String(b.start)));
  sorted.days.sort((a, b) => a.id.localeCompare(b.id));
  sorted.places.sort((a, b) => b.events.length - a.events.length);
  sorted.platforms.sort((a, b) => b.events.length - a.events.length);
  sorted.topics.sort((a, b) => b.events.length - a.events.length);
  return { ...sorted, links, byId: E };
}
