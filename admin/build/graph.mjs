// Connect the dots: the fringe graph (work/05, BRIEF.md §3 item 3). Owner: conductor.fringe@PrompTugal.angelo.
// Builds one data model from data/events.json alone: nodes are events, communities (the organisers, as organisations),
// topics and places (the area of each venue); every edge comes from one event's own fields, so every edge carries that
// event's source URL and read_at. Where pt.news already has the community, place or topic (data/ptnews-index.json, a
// snapshot of PrompTugal__News__Website data/), the node links to its page, and to its GAMMA-Ray card when it has one.
// The layout is computed here, once, so a phone only draws it. No people: an organiser described as an individual
// ("an independent organiser") makes no node.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const readJSON = (f) => { try { return JSON.parse(readFileSync(ROOT + f, 'utf8')); } catch { return null; } };

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-') || 'x';

// --- communities: split joint organisers, drop descriptors -------------------------------------------------------
const DESCRIPTOR = /\s*\((?:per |a |an |luma |named )[^)]*\)\s*$/i;
const PRIVATE = /^(an? )?independent organis|^(unknown|not (stated|named))\b/i;   // no node for an individual or an unknown organiser
export function organisersOf(text) {
  if (!text || PRIVATE.test(text)) return [];
  // "with", "powered by", "hosted by" join organisers only in lower case ("Life With Artificials" is one name);
  // " and " splits a joint list, except inside names that hold it ("Germany Trade and Invest").
  const parts = String(text).split(/,?\s+(?:with|powered by|hosted by)\s+/);
  return parts.flatMap((p, i) => (i === 0 ? [p] : p.replace(/Trade and Invest/g, 'Trade§and§Invest').split(/,\s+|\s+and\s+/).map((x) => x.replace(/§/g, ' '))))
    .map((p) => p.replace(DESCRIPTOR, '').replace(/^\s*with\s+/i, '').trim())
    .filter((p) => p && !PRIVATE.test(p));
}

// --- topics: a few synonyms folded, the rest as written -----------------------------------------------------------
const TOPIC_ALIAS = { vc: 'venture capital', vcs: 'venture capital', 'angel investors': 'angel investing',
  agents: 'AI agents', 'agentic internet': 'AI agents', 'ai agents': 'AI agents', ai: 'AI' };
const topicName = (t) => TOPIC_ALIAS[String(t).toLowerCase()] || String(t);

// --- places: the area in the trailing brackets, "Online", or the city ---------------------------------------------
const NOT_AREA = /link|zoom|meet|guest|named|page|boarding|stream|youtube|calendar/i;
export function areaOf(place) {
  const p = String(place ?? '');
  if (!p || /^not stated/i.test(p)) return null;
  if (/^online\b/i.test(p)) return 'Online';
  const m = p.match(/\(([^()]*)\)\s*$/);
  if (m && !NOT_AREA.test(m[1])) return m[1].split(/\s*\/\s*|,\s*/)[0].replace(/^Central /, '').trim();
  if (/\b(Lisboa|Lisbon)\b/.test(p)) return 'Lisbon';
  return null;
}

// --- the model --------------------------------------------------------------------------------------------------
export function buildGraph(events, ptnews, communities) {
  // work/04's verified communities (data/communities.json, re-read at their calendars) win over names split from
  // an event's organiser line; the organiser line is the fallback for events no community lists yet.
  const byEvent = new Map();
  for (const c of communities || []) for (const id of c.events || []) { if (!byEvent.has(id)) byEvent.set(id, []); byEvent.get(id).push(c); }
  const nodes = new Map(), edges = [];
  const site = ptnews?.site || 'https://promptugal.news/';
  const byName = (list, kind) => { const m = new Map(); for (const x of list || []) for (const n of [...(x.names || [x.name]), x.id]) m.set(norm(n), { ...x, kind }); return m; };
  const orgIdx = new Map([...byName(ptnews?.organisations, 'organisations'), ...byName(ptnews?.companies, 'companies')]);
  const placeIdx = byName(ptnews?.places, 'places');
  const topicIdx = byName(ptnews?.topics, 'topics');
  const ptLink = (hit) => hit ? { ptnews: `${site}${hit.kind}/${hit.id}/`, ...(hit.gamma_ray ? { gamma_ray: hit.gamma_ray } : {}) } : {};
  const node = (type, label, extra = {}) => {
    const id = `${type}:${slug(label)}`;
    if (!nodes.has(id)) nodes.set(id, { id, type, label, ...extra });
    return nodes.get(id);
  };
  for (const e of events) {
    const ev = { id: `event:${e.id}`, type: 'event', label: e.name, event: e.id, url: e.url, read_at: e.read_at, date: e.date, start: e.start || null,
      end: e.end || null, kind: e.kind || 'unknown', status: e.status || 'unknown', storm_moved: e.storm_moved ?? null,
      place: e.place || null, organiser: e.organiser || null, topics: (e.topics || []).map(topicName) };
    nodes.set(ev.id, ev);
    const link = (to, verb) => edges.push({ from: ev.id, to: to.id, verb, source: e.url, read_at: e.read_at });
    const listed = byEvent.get(e.id);
    if (listed) for (const c of listed) {
      const home = (c.links || []).find((l) => /^https:\/\//.test(l.url || ''));
      link(node('community', c.name, { ...ptLink(orgIdx.get(norm(c.name))), verified: true, community: c.id, home: home?.url || null, what: c.what?.text || null }), 'organised by');
    }
    else for (const o of organisersOf(e.organiser)) link(node('community', o, ptLink(orgIdx.get(norm(o)))), 'organised by');
    for (const t of new Set((e.topics || []).map(topicName))) link(node('topic', t, ptLink(topicIdx.get(norm(t)))), 'about');
    const a = areaOf(e.place);
    if (a) link(node('place', a, ptLink(placeIdx.get(norm(a)))), 'at');
  }
  const list = [...nodes.values()];
  outreachOf(list);
  const degree = {}; for (const ed of edges) { degree[ed.from] = (degree[ed.from] || 0) + 1; degree[ed.to] = (degree[ed.to] || 0) + 1; }
  for (const n of list) n.degree = degree[n.id] || 0;
  layout(list, edges);
  return { nodes: list, edges, outreach: outreachCounts(list), ontology: ontology(list, edges, events, communities) };
}

// --- the outreach layer (work/32): a STATE per community, from data/outreach-tracker.json. Counts and states only:
// no channel, contact, sender or note field of the tracker is ever copied into the graph, the page or graph.json.
export const OUTREACH = ['listed', 'draft ready', 'contacted', 'answered', 'joined'];
const outState = (o) => {
  const s = norm(o.state);
  if (/join/.test(s)) return 'joined';
  if (/answer|repl/.test(s)) return 'answered';
  if (/contact|sent/.test(s)) return 'contacted';
  // "drafted" with a draft that waits for Dinis's approval is still only listed; a draft is ready once approved
  if (/ready|approved/.test(s) || (/draft/.test(s) && /\b(ready|approved)\b/.test(norm(o.draft_status)) && !/until/.test(norm(o.draft_status)))) return 'draft ready';
  return 'listed';
};
function outreachOf(nodes) {
  const t = readJSON('data/outreach-tracker.json')?.organisers || [];
  const byId = new Map(t.map((o) => [o.id, o])), byName = new Map(t.map((o) => [norm(o.organiser), o]));
  for (const n of nodes) {
    if (n.type !== 'community') continue;
    const o = (n.community && byId.get(n.community)) || byName.get(norm(n.label)) || byId.get(slug(n.label));
    if (o) n.outreach = outState(o);
  }
}
function outreachCounts(nodes) {
  const c = Object.fromEntries(OUTREACH.map((k) => [k, 0]));
  for (const n of nodes) if (n.outreach) c[n.outreach]++;
  const f = readJSON('data/outreach.json');
  const keys = ['organisers_listed', 'drafts_ready', 'contacted', 'answered', 'joined'];
  return { on_graph: c, tracker: f ? { by: f.by || null, updated: f.updated || null, ...Object.fromEntries(keys.map((k) => [k, Number(f[k]) || 0])) } : null };
}

// --- the ontology picture (work/32): what the things are and how they join, with live counts ------------------------
const CHANNELS = [['Luma', /(^|\.)(luma\.com|lu\.ma)$/], ['Meetup', /(^|\.)meetup\.com$/], ['LinkedIn', /(^|\.)linkedin\.com$/],
  ['X', /(^|\.)(x\.com|twitter\.com)$/], ['WhatsApp group', /(^|\.)(chat\.)?whatsapp\.com$/], ['Eventbrite', /(^|\.)eventbrite\./]];
const channelOf = (url) => { let h; try { h = new URL(url).hostname.toLowerCase(); } catch { return null; } return (CHANNELS.find(([, re]) => re.test(h)) || ['website'])[0]; };
function ontology(nodes, edges, events, communities) {
  const n = (t) => nodes.filter((x) => x.type === t).length;
  const ch = Object.fromEntries([...CHANNELS.map(([k]) => k), 'website'].map((k) => [k, 0]));
  const add = (u) => { const k = u && channelOf(u); if (k) ch[k]++; };
  for (const e of events) add(e.url);
  for (const c of communities || []) for (const l of c.links || []) add(l.url);
  const src = new Set(), times = [];
  for (const e of events) { if (e.url) src.add(e.url); if (e.read_at) times.push(e.read_at); }
  for (const c of communities || []) {
    if (c.what?.quoted_from) src.add(c.what.quoted_from);
    if (c.what?.read_at) times.push(c.what.read_at);
    for (const s of c.sources || []) { const u = typeof s === 'string' ? s : s?.url; if (u) src.add(u); if (s?.read_at) times.push(s.read_at); }
  }
  // agents: the distinct "by" (and "researcher") values written in data/*.json; a count, no names on the page
  const agents = new Set();
  const walk = (v) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if ((k === 'by' || k === 'researcher') && typeof x === 'string' && /@/.test(x)) agents.add(x); else walk(x); } };
  let files = []; try { files = readdirSync(ROOT + 'data').filter((f) => f.endsWith('.json')); } catch {}
  for (const f of files) walk(readJSON('data/' + f));
  const verb = (v) => edges.filter((e) => e.verb === v).length;
  return { counts: { community: n('community'), community_checked: nodes.filter((x) => x.type === 'community' && x.verified).length, event: n('event'),
    place: n('place'), topic: n('topic'), channel_links: Object.values(ch).reduce((a, b) => a + b, 0), source: src.size, agent: agents.size, person_by_role: 1 },
    channels: ch, sources_latest_read_at: times.sort().pop() || null,
    edges: { 'organised by': verb('organised by'), about: verb('about'), at: verb('at') } };
}

export function ontologyBody(graph, esc) {
  const o = graph.ontology, c = o.counts, out = graph.outreach?.on_graph || {};
  const B = { person: [60, 40], agent: [300, 40], community: [60, 150], source: [300, 150], event: [180, 245], channel: [60, 345], topic: [180, 380], place: [300, 345] };
  const W = 50, H = 21;   // half sizes
  const box = (k, title, count, cls = '') => { const [x, y] = B[k];
    return `<g class="ob ${cls}"><rect x="${x - W}" y="${y - H}" width="${2 * W}" height="${2 * H}" rx="8"/><text x="${x}" y="${y - 4}" class="ot">${esc(title)}</text><text x="${x}" y="${y + 12}" class="oc">${esc(count)}</text></g>`; };
  const clip = ([x, y], [tx, ty]) => { const dx = tx - x, dy = ty - y, t = Math.min(dx ? (W + 3) / Math.abs(dx) : 1e9, dy ? (H + 3) / Math.abs(dy) : 1e9); return [x + dx * t, y + dy * t]; };
  const edge = (a, b, num, label, dy = 0) => { const p = clip(B[a], B[b]), q = clip(B[b], B[a]); const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 + dy;
    return `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" marker-end="url(#oarr)"/><text x="${mx.toFixed(1)}" y="${(my + 3).toFixed(1)}" class="ov">${num} ${esc(label)}</text>`; };
  const chs = Object.entries(o.channels).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ');
  const read = o.sources_latest_read_at ? ` (latest read ${o.sources_latest_read_at.slice(0, 16).replace('T', ' ')} UTC)` : '';
  const EV = [
    ['①', 'event', 'organised by', 'community', `${o.edges['organised by']} links: data/communities.json events[], re-read at each community's public calendar; otherwise the event page's own organiser line (data/events.json organiser). An organiser is always an organisation, never a private person.`],
    ['②', 'event', 'about', 'topic', `${o.edges.about} links: data/events.json topics[], as the event page gives them.`],
    ['③', 'event', 'at', 'place', `${o.edges.at} links: data/events.json place, the area of the venue (or Online).`],
    ['④', 'event', 'listed on', 'channel', `the host of data/events.json url.`],
    ['⑤', 'community', 'reachable on', 'channel', `the hosts of data/communities.json links[] (public pages only). Channel links counted: ${chs || 'none'}; WhatsApp groups and X ${o.channels['WhatsApp group'] + o.channels.X ? 'as counted' : 'none yet'}.`],
    ['⑥', 'event', 'read from', 'source', `${c.source} public pages: data/events.json url and read_at, data/communities.json what.quoted_from and sources[]${read}.`],
    ['⑦', 'agent', 'wrote', 'source', `${c.agent} distinct agents in the "by" fields of data/*.json; every run is in the repository's history.`],
    ['⑧', 'person', 'instructs', 'agent', `CLAUDE.md, "Only Dinis instructs": Dinis Cruz, head conductor, is the one person in this picture, by role.`],
  ];
  const svg = `<svg class="onto" viewBox="0 0 360 410" role="img" aria-labelledby="otitle">
<title id="otitle">What the things are and how they join: ${c.event} events, ${c.community} communities, ${c.topic} topics, ${c.place} places, ${c.channel_links} channel links, ${c.source} sources, ${c.agent} agents, one person by role</title>
<defs><marker id="oarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="oa" d="M0 0L10 5L0 10z"/></marker></defs>
${edge('event', 'community', '①', 'organised by', -6)}${edge('event', 'topic', '②', 'about')}${edge('event', 'place', '③', 'at', 8)}${edge('event', 'channel', '④', 'listed on', 8)}
${edge('community', 'channel', '⑤', 'on')}${edge('event', 'source', '⑥', 'read from', -6)}${edge('agent', 'source', '⑦', 'wrote')}${edge('person', 'agent', '⑧', 'instructs')}
${box('person', 'person, by role', 'Dinis · head')}${box('agent', 'agents', c.agent)}${box('community', 'organisations', `${c.community} (${c.community_checked} checked)`)}
${box('source', 'sources', c.source)}${box('event', 'events', c.event, 'oe')}${box('channel', 'channels', `${c.channel_links} links`)}${box('topic', 'topics', c.topic)}${box('place', 'places', c.place)}
<text x="60" y="${B.community[1] - H - 6}" class="ov">outreach: ${(out.listed || 0) + (out['draft ready'] || 0) + (out.contacted || 0) + (out.answered || 0) + (out.joined || 0)} tracked</text>
</svg>`;
  return `<section class="ontology" aria-labelledby="oh"><h2 id="oh">What the things are and how they join</h2>
<p class="muted">Eight kinds of thing, eight verbs. The numbers are live: they are counted from the data each time the site is built.</p>
${svg}
<details class="oev"><summary>Where each line's evidence lives</summary><ol>${EV.map(([num, a, v, b, ev]) => `<li><strong>${num} ${esc(a)} → ${esc(v)} → ${esc(b)}</strong>: ${esc(ev)}</li>`).join('')}</ol></details>
</section>`;
}

// --- a force layout (Fruchterman-Reingold with gravity), deterministic (seeded), run at build time ------------------
function layout(nodes, edges) {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const W = 1000, k = Math.sqrt((W * W) / Math.max(1, nodes.length)), N = nodes.length;
  const P = nodes.map(() => ({ x: (rnd() - 0.5) * W, y: (rnd() - 0.5) * W }));
  const E = edges.map((e) => [idx.get(e.from), idx.get(e.to)]);
  const STEPS = 300;
  for (let it = 0; it < STEPS; it++) {
    const t = (W / 10) * (1 - it / STEPS) + 1, D = P.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = (k * k) / d / d;
      D[i].x += dx * f; D[i].y += dy * f; D[j].x -= dx * f; D[j].y -= dy * f;
    }
    for (const [a, b] of E) {
      const dx = P[a].x - P[b].x, dy = P[a].y - P[b].y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = d / k;
      D[a].x -= dx * f; D[a].y -= dy * f; D[b].x += dx * f; D[b].y += dy * f;
    }
    for (let i = 0; i < N; i++) {
      const g = 0.06 * Math.sqrt(P[i].x * P[i].x + P[i].y * P[i].y);   // gravity keeps loose topics near the middle
      const r = Math.sqrt(P[i].x * P[i].x + P[i].y * P[i].y) + 0.01;
      D[i].x -= (P[i].x / r) * g * k / 10; D[i].y -= (P[i].y / r) * g * k / 10;
      const m = Math.sqrt(D[i].x * D[i].x + D[i].y * D[i].y) + 0.01, s = Math.min(m, t) / m;
      P[i].x += D[i].x * s; P[i].y += D[i].y * s;
    }
  }
  nodes.forEach((n, i) => { n.x = Math.round(P[i].x); n.y = Math.round(P[i].y); });
}

// --- the page body (the shell, with the independence line, is build.mjs's page()) ---------------------------------
export function graphBody(graph, esc) {
  const ev = graph.nodes.filter((n) => n.type === 'event');
  const days = [...new Set(ev.map((n) => n.date))].sort();
  const kinds = [...new Set(ev.map((n) => n.kind))].sort();
  const count = (t) => graph.nodes.filter((n) => n.type === t).length;
  const neighbours = (id) => graph.edges.filter((e) => e.to === id).map((e) => graph.nodes.find((n) => n.id === e.from));
  const links = (n) => [n.ptnews && `<a href="${esc(n.ptnews)}">on pt.news</a>`, n.gamma_ray && `<a href="${esc(n.gamma_ray)}">GAMMA-Ray card</a>`].filter(Boolean).join(' · ');
  const group = (type, title) => graph.nodes.filter((n) => n.type === type).sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label))
    .map((n) => `<details class="gn" data-node="${esc(n.id)}"><summary>${esc(n.label)} <span class="muted">(${n.degree})</span></summary>
${links(n) ? `<div class="muted">${links(n)}</div>` : ''}<ul>${neighbours(n.id).map((e) => `<li data-ev="${esc(e.id)}"><a href="${esc(e.url)}">${esc(e.label)}</a> <span class="muted">${esc(e.date)}</span></li>`).join('')}</ul></details>`).join('');
  const chip = (name, value, label) => `<button type="button" class="chip" data-f="${name}" data-v="${esc(value)}" aria-pressed="false">${esc(label)}</button>`;
  return `
<h1>Connect the dots</h1>
${ontologyBody(graph, esc)}
<h2>The graph</h2>
<p class="muted">Each dot is an event, a community, a topic or a place; a line means one event's own page names it. Tap a dot to see what it joins.</p>
<p class="legend"><span class="dot t-event"></span>event (${ev.length}) <span class="dot t-community"></span>community (${count('community')}) <span class="dot t-topic"></span>topic (${count('topic')}) <span class="dot t-place"></span>place (${count('place')})</p>
<p class="muted" id="gcount" aria-live="polite"></p>
<div class="filters gout"><strong>Outreach</strong> ${OUTREACH.map((k) => chip('out', k, `${k} ${graph.outreach?.on_graph?.[k] ?? 0}`)).join('')}</div>
<p class="muted legend">The ring on a community dot is its outreach state: <span class="nw"><span class="ring o-listed"></span>listed</span> <span class="nw"><span class="ring o-draft-ready"></span>draft ready</span> <span class="nw"><span class="ring o-contacted"></span>contacted</span> <span class="nw"><span class="ring o-answered"></span>answered</span> <span class="nw"><span class="ring o-joined"></span>joined</span>.${graph.outreach?.tracker ? ` Counts only, never a contact. The whole tracker (data/outreach.json, ${esc(graph.outreach.tracker.updated || '')}): ${graph.outreach.tracker.organisers_listed} organisers listed, ${graph.outreach.tracker.drafts_ready} drafts ready, ${graph.outreach.tracker.contacted} contacted, ${graph.outreach.tracker.answered} answered, ${graph.outreach.tracker.joined} joined; the graph shows the ${Object.values(graph.outreach.on_graph).reduce((a, b) => a + b, 0)} it can match to a community.` : ''}</p>
<div class="gwrap"><svg id="graph" role="img" aria-label="Graph of events, communities, topics and places" viewBox="-500 -500 1000 1000"></svg>
<div class="gzoom"><button type="button" data-z="0.8" aria-label="Zoom in">+</button><button type="button" data-z="1.25" aria-label="Zoom out">−</button><button type="button" data-z="0" aria-label="Reset">⟲</button></div></div>
<details class="gfilters"><summary>Filter by topic, day or kind</summary>
<div class="filters" id="filters">
<div><strong>Find</strong> ${['AI agents', 'security', 'Portugal', 'founders', 'investors', 'developers'].map((q) => chip('q', q, q)).join('')}
<input id="gq" type="search" placeholder="topic, community, place…" aria-label="Filter the graph"></div>
<div><strong>Day</strong> ${days.map((d) => chip('day', d, new Date(d + 'T12:00:00Z').toUTCString().slice(0, 11))).join('')}</div>
<div><strong>Type</strong> ${kinds.map((k) => chip('kind', k, k)).join('')}</div>
<div><label><input type="checkbox" id="gcan"> hide cancelled</label> · <label><input type="checkbox" id="gstorm"> only what the storm moved</label></div>
</div></details>
<div id="gpanel" class="card" hidden></div>
<h2>Communities</h2>${group('community')}
<h2>Topics</h2>${group('topic')}
<h2>Places</h2>${group('place')}
<p class="muted">The data: <a href="/api/v1/graph.json">/api/v1/graph.json</a> (nodes and edges, each edge with its source and read time). Communities, places and topics already on <a href="https://promptugal.news/graph/">pt.news's graph</a> link to it. How this page was made: <a href="https://github.com/PrompTugal/PrompTugal__News__Fringe/blob/dev/work/05-graph.md">work/05</a> and <a href="https://github.com/PrompTugal/PrompTugal__News__Fringe/blob/dev/team/angelo/runs.md">every run behind it</a>.</p>
<script type="application/json" id="gdata">${JSON.stringify({ nodes: graph.nodes.map(({ id, type, label, x, y, degree, url, date, kind, status, storm_moved, topics, organiser, place, ptnews, gamma_ray, home, what, verified, outreach }) => ({ id, type, label, x, y, degree, url, date, kind, status, storm_moved, topics, organiser, place, ptnews, gamma_ray, home, what, verified, outreach })), edges: graph.edges.map((e) => [e.from, e.to, e.verb]) }).replace(/</g, '\\u003c')}</script>
<script src="/graph.js" defer></script>`;
}

export const graphCss = `
.filters>div{margin:6px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}.chip{font:inherit;font-size:13px;min-height:var(--chip-h);padding:0 var(--s3);text-transform:none;border-radius:99px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
.chip[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--bg)}#gq{font:inherit;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);min-width:0;flex:1 1 160px}
.gwrap{position:relative;border:1px solid var(--line);border-radius:8px;background:var(--card);touch-action:none}#graph{display:block;width:100%;height:auto;aspect-ratio:1/1;max-height:70vh}.gfilters{margin:var(--s2) 0}.gfilters>summary{cursor:pointer;font-weight:600;font-size:var(--fs-ui);padding:var(--s2) 0;color:var(--brand)}
.gzoom{position:absolute;top:8px;right:8px;display:flex;gap:4px}.gzoom button{font:inherit;width:32px;height:32px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
.t-event{fill:var(--t-event);background:var(--t-event)}.t-community{fill:var(--t-community);background:var(--t-community)}.t-topic{fill:var(--t-topic);background:var(--t-topic)}.t-place{fill:var(--t-place);background:var(--t-place)}
.legend .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 4px 0 10px}.legend{font-size:.85rem}
#graph line{stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}#graph line.on{stroke:var(--fg);stroke-opacity:.5}#graph circle{cursor:pointer;stroke:var(--card);stroke-width:1;vector-effect:non-scaling-stroke}
#graph text{fill:var(--fg);pointer-events:none;paint-order:stroke;stroke:var(--card)}#graph .off{opacity:.08}#graph .sel{stroke:var(--fg);stroke-width:3}#graph line.on{stroke-width:2}
.gn summary{cursor:pointer;padding:3px 0}.gn ul{margin:4px 0 8px}
#graph circle.o-listed,#graph circle.o-draft-ready,#graph circle.o-contacted,#graph circle.o-answered,#graph circle.o-joined{stroke-width:2.5}
.o-listed{stroke:var(--muted);border-color:var(--muted)}.o-draft-ready{stroke:var(--warn);border-color:var(--warn)}.o-contacted{stroke:var(--river);border-color:var(--river)}.o-answered{stroke:var(--brand);border-color:var(--brand)}.o-joined{stroke:var(--ok);border-color:var(--ok)}
#graph circle.sel{stroke:var(--fg);stroke-width:3}.legend .nw{white-space:nowrap;margin-left:8px}.legend .ring{display:inline-block;width:10px;height:10px;border-radius:50%;border:2.5px solid;margin:0 3px 0 0;vertical-align:-1px}
.ontology{margin:var(--s3) 0 var(--s5)}.onto{display:block;width:100%;max-width:560px;height:auto;margin:0 auto}
.onto .ob rect{fill:var(--card);stroke:var(--line);stroke-width:1.2}.onto .oe rect{stroke:var(--t-event);stroke-width:2}.onto .ot{fill:var(--fg);font-size:11px;font-weight:600;text-anchor:middle}
.onto .oc{fill:var(--muted);font-size:10.5px;text-anchor:middle}.onto line{stroke:var(--muted);stroke-width:1.2}.onto .oa{fill:var(--muted)}
.onto .ov{fill:var(--fg);font-size:9.5px;text-anchor:middle;paint-order:stroke;stroke:var(--bg);stroke-width:3px;stroke-linejoin:round}
.oev summary{cursor:pointer;font-weight:600;font-size:var(--fs-ui);color:var(--brand);padding:var(--s2) 0}.oev ol{padding-left:1.2em;font-size:.9rem}.oev li{margin:4px 0}.gout{margin:6px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}`;
