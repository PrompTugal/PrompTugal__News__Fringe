// Builds the static site into _site/ from the repository's own files.
// No dependencies. Run: node admin/build/build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraph, graphBody, graphCss } from './graph.mjs';   // work/05, conductor.fringe@PrompTugal.angelo

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '_site');
const read = (p) => readFileSync(join(root, p), 'utf8');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REPO = 'https://github.com/PrompTugal/PrompTugal__News__Fringe';
const SITE = 'https://fringe.promptugal.news/';
const VERSION = process.env.VERSION || 'local';   // CI owns the number: v<admin/series.txt>.<run>; nobody writes it
const BUILT = new Date().toISOString();

// --- inputs --------------------------------------------------------------
const roster = JSON.parse(read('team/roster.json'));
const status = {};
for (const d of readdirSync(join(root, 'team'))) {
  const f = join(root, 'team', d, 'status.json');
  if (existsSync(f) && statSync(join(root, 'team', d)).isDirectory()) {
    try { status[d] = JSON.parse(readFileSync(f, 'utf8')); } catch { status[d] = { state: 'status.json unreadable' }; }
  }
}
function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (!m) return fm;
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return fm;
}
const board = readdirSync(join(root, 'work'))
  .filter((f) => /^\d+.*\.md$/.test(f)).sort()
  .map((f) => ({ file: f, ...frontMatter(read(`work/${f}`)) }));

// Events: only data/events.json, which holds events re-read at their URL (work/02). The seed is never published as is.
const eventsFile = existsSync(join(root, 'data/events.json')) ? JSON.parse(read('data/events.json')) : null;
const events = (eventsFile?.events || []).filter((e) => e.name && /^https:\/\//.test(e.url || '') && e.read_at);
const today = BUILT.slice(0, 10);
const tomorrow = new Date(Date.parse(today) + 86400000).toISOString().slice(0, 10);

const join_md = read('JOIN.md');
const prompt = (join_md.split(/\n---\n/)[1] || '').trim();
const ids = roster.people.map((p) => p.id);

// --- layout --------------------------------------------------------------
const INDEPENDENCE = `Lisbon Fringe is independent of Web Summit and not run by its organisers. For anything official, see <a href="https://websummit.com/">the organisers' official site</a>.`;
const css = `
:root{--bg:#fbfaf7;--fg:#1b1b1b;--muted:#5d5d5d;--card:#fff;--line:#e4e1da;--accent:#0b6e4f;--code:#f2efe8}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#ececec;--muted:#a8a8a8;--card:#1d1d1d;--line:#333;--accent:#5fd3a6;--code:#222}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:16px}a{color:var(--accent)}
header{border-bottom:1px solid var(--line)}header nav{max-width:720px;margin:0 auto;padding:12px 16px;display:flex;gap:16px;align-items:baseline;flex-wrap:wrap}
header strong{font-size:1.1rem}h1{font-size:1.6rem;line-height:1.2;margin:.6em 0 .3em}h2{font-size:1.2rem;margin:1.6em 0 .5em}
.ind{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);padding:10px 12px;border-radius:6px;font-size:.92rem}
.card{overflow-wrap:anywhere;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px;margin:8px 0}
.muted{color:var(--muted);font-size:.9rem}pre{background:var(--code);padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word;font-size:.85rem;margin:0}
.copy{position:relative}.copy button{position:absolute;top:8px;right:8px;font:inherit;font-size:.85rem;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
code{background:var(--code);padding:1px 4px;border-radius:4px}ol li,ul li{margin:.3em 0}
.tag{display:inline-block;font-size:.75rem;padding:1px 8px;border-radius:99px;border:1px solid var(--line);margin-left:6px}
.tag.lvl-red{border-color:#d33;color:#d33}.tag.lvl-orange{border-color:#e07b00;color:#e07b00}.tag.lvl-yellow{border-color:#c7a100}#storm-live h3{font-size:1rem;margin:.8em 0 .3em}#storm-live ul{padding-left:1.2em;margin:.3em 0}
.tag.open{border-color:#c7a100}.tag.claimed{border-color:#2f6fd6}.tag.done{border-color:var(--accent)}
footer{max-width:720px;margin:24px auto;padding:16px;border-top:1px solid var(--line)}`;
const page = (title, body, desc) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"><style>${css}</style></head><body>
<header><nav><strong><a href="/">Lisbon Fringe</a></strong><a href="/graph/">Graph</a><a href="/join/">Join the team</a><a href="https://storm-charles.promptugal.news">Storm Charles</a></nav></header>
<main><p class="ind">${INDEPENDENCE}</p>${body}</main>
<footer class="muted">${INDEPENDENCE}<br>Built from <a href="${REPO}">the repository</a> at ${BUILT.slice(0, 16).replace('T', ' ')} UTC · <a href="/version.json">${esc(VERSION)}</a>.</footer>
</body></html>`;

// --- events -------------------------------------------------------------
// Text with any https URL in it: escaped, and each URL a link whose text is its host (long URLs broke the phone layout).
function linkify(text) {
  return String(text ?? '').split(/(https:\/\/[^\s<>"')]+)/).map((part, i) => {
    if (i % 2 === 0) return esc(part);
    let host = 'link'; try { host = new URL(part).hostname.replace(/^www\./, ''); } catch {}
    return `<a href="${esc(part)}">${esc(host)}</a>`;
  }).join('');
}
const STATUS = { on: 'On', moved: 'Moved', cancelled: 'Cancelled', online: 'Online', unknown: 'Unknown' };
function eventCard(e) {
  const when = [e.start && e.start.slice(11, 16), e.end && e.end.slice(11, 16)].filter(Boolean).join('–');
  return `<div class="card"><a href="${esc(e.url)}"><strong>${esc(e.name)}</strong></a><span class="tag ${esc(e.status)}">${esc(STATUS[e.status] || 'Unknown')}</span>
<div class="muted">${linkify([when && when + ' UTC', e.place, e.organiser].filter(Boolean).join(' · '))}</div>
${e.join ? `<div>How to join: ${linkify(e.join)}</div>` : ''}${e.storm_note ? `<div class="muted">Storm: ${linkify(e.storm_note)}</div>` : ''}
<div class="muted">Source read ${esc(String(e.read_at).slice(0, 16).replace('T', ' '))} UTC</div></div>`;
}
function eventsHtml() {
  if (!events.length) return `<h2>Events</h2><p class="muted">The event listings arrive here once each one has been checked at its public source.</p>`;
  const day = (d, label) => { const list = events.filter((e) => e.date === d).sort((a, b) => String(a.start).localeCompare(String(b.start)));
    return `<h2>${label}, ${d}</h2>` + (list.map(eventCard).join('') || '<p class="muted">Nothing checked yet for this day.</p>'); };
  const later = events.filter((e) => e.date > tomorrow).length;
  return day(today, 'Today') + day(tomorrow, 'Tomorrow') + (later ? `<p class="muted">${later} more later this week in <a href="/api/v1/events.json">the data</a>.</p>` : '');
}

// --- / -------------------------------------------------------------------
const home = page('Lisbon Fringe', `
<h1>Lisbon Fringe</h1>
<p>An independent guide to the alternative, community and side events around Web Summit Lisbon this week: what is on, where, when and how to join.</p>
<div class="card"><strong>The storm.</strong> For weather warnings and what moved because of Storm Charles, see
<a href="https://storm-charles.promptugal.news">storm-charles.promptugal.news</a>, <a href="https://www.ipma.pt/">IPMA</a> and <a href="https://www.prociv.gov.pt/">ANEPC</a>. This site is not a warning service.
<div id="storm-live"><p class="muted">The storm site's latest is loading…</p></div></div>
<script src="/storm.js" defer></script>
${eventsHtml()}
<h2>Build it with us</h2>
<p>Lisbon Fringe is built by a team where everyone runs one conductor. <a href="/join/">Bring yours in five minutes</a>.</p>
`, 'An independent guide to the side events around Web Summit Lisbon.');

// --- /join/ --------------------------------------------------------------
const steps = (SWARM_STEPS()).map((s) => `<li>${s}</li>`).join('');
function SWARM_STEPS() {
  return [
    `Open a new Claude Code session in your own account with <a href="${REPO}">PrompTugal/PrompTugal__News__Fringe</a> attached.`,
    `Copy the prompt below and replace <code>&lt;id&gt;</code> with your id.`,
    `Paste it. Your conductor reads SWARM.md and BRIEF.md, makes its key, writes <code>team/&lt;id&gt;/status.json</code> and claims an item on the board.`,
    `If your account cannot push to the repository, ask Dinis for push access.`,
  ];
}
const rosterRows = roster.people.map((p) => {
  const s = status[p.id];
  const state = s?.state || p.state || 'not started';
  const doing = s?.doing ? `<div class="muted">Doing: ${esc(typeof s.doing === 'string' ? s.doing : JSON.stringify(s.doing))}</div>` : '';
  return `<div class="card"><strong>${esc(p.name)}</strong> <code>${esc(p.id)}</code><span class="tag">${esc(state)}</span>
<div class="muted">${esc(p.conductor)} · lane: ${esc(s?.lane || p.suggested_lane)}</div>${doing}</div>`;
}).join('');
const boardRows = ['open', 'claimed', 'done'].map((st) => {
  const items = board.filter((b) => (b.status || 'open') === st);
  return `<h3>${st[0].toUpperCase() + st.slice(1)} (${items.length})</h3>` + (items.map((b) => `<div class="card">
<a href="${REPO}/blob/dev/work/${esc(b.file)}"><strong>${esc(b.id)}. ${esc(b.title)}</strong></a><span class="tag ${esc(st)}">${esc(st)}</span>
<div class="muted">Owner: ${esc(b.owner || 'nobody yet')} · lane: ${esc(b.lane)}</div></div>`).join('') || '<p class="muted">None.</p>');
}).join('');
const joinPage = page('Join Lisbon Fringe', `
<h1>Bring your conductor in five minutes</h1>
<p>Each person on the team runs one conductor for Lisbon Fringe in their own Claude account. Dinis is the head conductor. The work lives on <a href="${REPO}/tree/dev/work">the board</a>. How it works: <a href="${REPO}/blob/dev/SWARM.md">SWARM.md</a>.</p>
<h2>Steps</h2><ol>${steps}</ol>
<h2>Your id</h2><p>${ids.map((i) => `<code>${esc(i)}</code>`).join(' ')}</p>
<h2>The prompt</h2>
<div class="copy"><button type="button" id="copy">Copy</button><pre id="prompt">${esc(prompt)}</pre></div>
<h2>The team</h2>${rosterRows}
<h2>The board</h2>${boardRows}
<script>document.getElementById('copy').onclick=async function(){var t=document.getElementById('prompt').innerText;try{await navigator.clipboard.writeText(t);this.textContent='Copied'}catch(e){var r=document.createRange();r.selectNodeContents(document.getElementById('prompt'));var s=getSelection();s.removeAllRanges();s.addRange(r);this.textContent='Selected: copy it'}};</script>
`, 'How a team member brings their own conductor to Lisbon Fringe.');

// --- /graph/ (work/05) ----------------------------------------------------
const ptnews = existsSync(join(root, 'data/ptnews-index.json')) ? JSON.parse(read('data/ptnews-index.json')) : null;
const graph = buildGraph(events, ptnews);
const graphPage = page('Connect the dots: Lisbon Fringe', `<style>${graphCss}</style>` + graphBody(graph, esc), 'The fringe as a graph: events, communities, topics and places, with filters.');

// --- write ---------------------------------------------------------------
mkdirSync(join(out, 'join'), { recursive: true });
writeFileSync(join(out, 'index.html'), home);
writeFileSync(join(out, 'join', 'index.html'), joinPage);
mkdirSync(join(out, 'graph'), { recursive: true });
writeFileSync(join(out, 'graph', 'index.html'), graphPage);
writeFileSync(join(out, 'graph.js'), read('admin/build/graph.js'));
writeFileSync(join(out, 'CNAME'), 'fringe.promptugal.news\n');
writeFileSync(join(out, '404.html'), page('Not found', '<h1>Not found</h1><p><a href="/">Lisbon Fringe</a> · <a href="/join/">Join</a></p>', 'Page not found.'));
mkdirSync(join(out, 'api', 'v1'), { recursive: true });
writeFileSync(join(out, 'api', 'v1', 'README.md'), read('api/v1/README.md'));
writeFileSync(join(out, 'api', 'v1', 'events.json'), JSON.stringify({ about: 'Lisbon Fringe events, each re-read at its public URL (read_at, UTC). Independent of Web Summit.', site: SITE, version: VERSION, built_at: BUILT, events }, null, 2) + '\n');
writeFileSync(join(out, 'api', 'v1', 'graph.json'), JSON.stringify({ about: 'The Lisbon Fringe graph: events, communities (organisers, as organisations), topics and places. Every edge comes from one event and carries its source URL and read_at. Independent of Web Summit.', site: SITE, version: VERSION, built_at: BUILT, ptnews_from: ptnews?.from || null, ...graph }, null, 1) + '\n');
writeFileSync(join(out, 'llms.txt'), `# Lisbon Fringe\n\n> An independent guide to the alternative, community and side events around Web Summit Lisbon, 9 to 15 November 2026. Independent of Web Summit; for anything official see the organisers' site. Not a warning service: for the storm see https://storm-charles.promptugal.news, IPMA and ANEPC.\n\n- [Events (JSON)](${SITE}api/v1/events.json): each event with its source URL and the time it was read\n- [The graph (JSON)](${SITE}api/v1/graph.json): events, communities, topics and places, each edge with its source\n- [Join the team](${SITE}join/)\n- [Repository](${REPO})\n`);
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${SITE}</loc></url>\n<url><loc>${SITE}join/</loc></url>\n<url><loc>${SITE}graph/</loc></url>\n</urlset>\n`);
writeFileSync(join(out, 'version.json'), JSON.stringify({ version: VERSION, commit: process.env.GITHUB_SHA || '', pushed_at: process.env.PUSHED_AT || '', built_at: BUILT }, null, 2) + '\n');
writeFileSync(join(out, 'version.txt'), VERSION + '\n');
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'storm.js'), read('admin/build/storm.js'));
console.log(`built _site/ ${VERSION}: /, /join/, /graph/ (${graph.nodes.length} nodes, ${graph.edges.length} edges), ${events.length} events (${roster.people.length} people, ${board.length} board items, ${Object.keys(status).length} status files)`);
