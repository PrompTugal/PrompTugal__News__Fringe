// Connect the dots: the fringe graph (work/05, BRIEF.md §3 item 3). Owner: conductor.fringe@PrompTugal.angelo.
// Builds one data model from data/events.json alone: nodes are events, communities (the organisers, as organisations),
// topics and places (the area of each venue); every edge comes from one event's own fields, so every edge carries that
// event's source URL and read_at. Where pt.news already has the community, place or topic (data/ptnews-index.json, a
// snapshot of PrompTugal__News__Website data/), the node links to its page, and to its GAMMA-Ray card when it has one.
// The layout is computed here, once, so a phone only draws it. No people: an organiser described as an individual
// ("an independent organiser") makes no node.

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
  const degree = {}; for (const ed of edges) { degree[ed.from] = (degree[ed.from] || 0) + 1; degree[ed.to] = (degree[ed.to] || 0) + 1; }
  for (const n of list) n.degree = degree[n.id] || 0;
  layout(list, edges);
  return { nodes: list, edges };
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
<p>The fringe as a graph: ${ev.length} events, ${count('community')} communities, ${count('topic')} topics and ${count('place')} places. Every line comes from one event's own page, read at the time it shows. Tap a dot to see what it joins.</p>
<div class="filters" id="filters">
<div><strong>Find</strong> ${['AI agents', 'security', 'Portugal', 'founders', 'investors', 'developers'].map((q) => chip('q', q, q)).join('')}
<input id="gq" type="search" placeholder="topic, community, place…" aria-label="Filter the graph"></div>
<div><strong>Day</strong> ${days.map((d) => chip('day', d, new Date(d + 'T12:00:00Z').toUTCString().slice(0, 11))).join('')}</div>
<div><strong>Type</strong> ${kinds.map((k) => chip('kind', k, k)).join('')}</div>
<div><label><input type="checkbox" id="gcan"> hide cancelled</label> · <label><input type="checkbox" id="gstorm"> only what the storm moved</label></div>
</div>
<p class="muted" id="gcount" aria-live="polite"></p>
<div class="gwrap"><svg id="graph" role="img" aria-label="Graph of events, communities, topics and places" viewBox="-500 -500 1000 1000"></svg>
<div class="gzoom"><button type="button" data-z="0.8" aria-label="Zoom in">+</button><button type="button" data-z="1.25" aria-label="Zoom out">−</button><button type="button" data-z="0" aria-label="Reset">⟲</button></div></div>
<p class="legend"><span class="dot t-event"></span>event <span class="dot t-community"></span>community <span class="dot t-topic"></span>topic <span class="dot t-place"></span>place</p>
<div id="gpanel" class="card" hidden></div>
<h2>Communities</h2>${group('community')}
<h2>Topics</h2>${group('topic')}
<h2>Places</h2>${group('place')}
<p class="muted">The data: <a href="/api/v1/graph.json">/api/v1/graph.json</a> (nodes and edges, each edge with its source and read time). Communities, places and topics already on <a href="https://promptugal.news/graph/">pt.news's graph</a> link to it. How this page was made: <a href="https://github.com/PrompTugal/PrompTugal__News__Fringe/blob/dev/work/05-graph.md">work/05</a> and <a href="https://github.com/PrompTugal/PrompTugal__News__Fringe/blob/dev/team/angelo/runs.md">every run behind it</a>.</p>
<script type="application/json" id="gdata">${JSON.stringify({ nodes: graph.nodes.map(({ id, type, label, x, y, degree, url, date, kind, status, storm_moved, topics, organiser, place, ptnews, gamma_ray, home, what, verified }) => ({ id, type, label, x, y, degree, url, date, kind, status, storm_moved, topics, organiser, place, ptnews, gamma_ray, home, what, verified })), edges: graph.edges.map((e) => [e.from, e.to, e.verb]) }).replace(/</g, '\\u003c')}</script>
<script src="/graph.js" defer></script>`;
}

export const graphCss = `
.filters>div{margin:6px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}.chip{font:inherit;font-size:.85rem;padding:3px 10px;border-radius:99px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
.chip[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--bg)}#gq{font:inherit;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);min-width:0;flex:1 1 160px}
.gwrap{position:relative;border:1px solid var(--line);border-radius:8px;background:var(--card);touch-action:none}#graph{display:block;width:100%;height:auto;aspect-ratio:1/1;max-height:80vh}
.gzoom{position:absolute;top:8px;right:8px;display:flex;gap:4px}.gzoom button{font:inherit;width:32px;height:32px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
.t-event{fill:var(--t-event);background:var(--t-event)}.t-community{fill:var(--t-community);background:var(--t-community)}.t-topic{fill:var(--t-topic);background:var(--t-topic)}.t-place{fill:var(--t-place);background:var(--t-place)}
.legend .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 4px 0 10px}.legend{font-size:.85rem}
#graph line{stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}#graph line.on{stroke:var(--fg);stroke-opacity:.5}#graph circle{cursor:pointer;stroke:var(--card);stroke-width:1;vector-effect:non-scaling-stroke}
#graph text{fill:var(--fg);pointer-events:none;paint-order:stroke;stroke:var(--card)}#graph .off{opacity:.08}#graph .sel{stroke:var(--fg);stroke-width:3}#graph line.on{stroke-width:2}
.gn summary{cursor:pointer;padding:3px 0}.gn ul{margin:4px 0 8px}`;
