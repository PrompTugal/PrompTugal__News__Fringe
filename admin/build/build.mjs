// Builds the static site into _site/ from the repository's own files.
// No dependencies. Run: node admin/build/build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraph, graphBody, graphCss } from './graph.mjs';   // work/05, conductor.fringe@PrompTugal.angelo
import { loadEvolution, evolutionBody, evolutionCss } from './evolution.mjs';   // work/27, capture.1.fringe@PrompTugal.dinis
import { trafficBody, trafficCss } from './traffic.mjs';   // work/21, observability.fringe@PrompTugal.dinis
import { meBody, meCss } from './me.mjs';   // work/26
import { collectSwarm, swarmBody, swarmCss, swarmScript } from './swarm.mjs';   // work/25, dev.1.fringe@PrompTugal.dinis
import { eventPages, eventPath, hasPage } from './event-pages.mjs';
import { bigStrip, denseRow, denseList, split, sizeOf, TIER_CSS } from './tiers.mjs';   // D18, design.3.fringe@PrompTugal.dinis
import { programmeBody } from './programme.mjs';   // D3 follow-up, design.3.fringe@PrompTugal.dinis
import { howBody } from './how.mjs';   // D11, design.3.fringe@PrompTugal.dinis
import { eventCard as card, cardList, sortDay, CARD_CSS } from './cards.mjs';   // D3, design.3.fringe@PrompTugal.dinis   // work/22, dev.lead.fringe@PrompTugal.dinis
import { WORDMARK, IDENTITY_CSS } from './identity.mjs';   // D9, design.4.fringe@PrompTugal.dinis
import { loadOrganisers, organisersBody } from './organisers.mjs';   // work/23, dev.2.fringe@PrompTugal.dinis
import { readChanges, changesBody } from './changes.mjs';   // work/15, dev.2.fringe@PrompTugal.dinis
import { nowBlock, nowPageBody, nowJs, span as evSpan } from './now.mjs';
import { timelineBlock, TIMELINE_CSS } from './timeline.mjs';   // D19, design.2.fringe@PrompTugal.dinis   // work/16, dev.2.fringe@PrompTugal.dinis
import { traceBody } from './trace-page.mjs';   // Angelo's traces, designer.fringe@PrompTugal.angelo

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '_site');
const read = (p) => readFileSync(join(root, p), 'utf8');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REPO = 'https://github.com/PrompTugal/PrompTugal__News__Fringe';
const ORIGIN = JSON.parse(readFileSync(join(root, 'admin/site.json'), 'utf8')).origin.replace(/\/+$/, '');   // work/30: the one setting for the address
const SITE = ORIGIN + '/';
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
const links = existsSync(join(root, 'data/links.json')) ? JSON.parse(read('data/links.json')) : {};
const WHATSAPP = /^https:\/\//.test(links.whatsapp_group || '') ? `<p class="wa"><a href="${esc(links.whatsapp_group)}" rel="noopener">Join the Lisbon Tech Week WhatsApp group</a></p>` : '';
const INDEPENDENCE = `Lisbon Tech Week is independent of Web Summit and not run by its organisers. For anything official, see <a href="https://websummit.com/">the organisers' official site</a>.`;
const tokens = readFileSync(join(root, 'admin', 'build', 'tokens.css'), 'utf8'); // D8: the one set of design tokens
const css = tokens + `
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--paper);color:var(--ink);font:var(--fs-body)/var(--lh-body) var(--sans)}
main{max-width:var(--page);margin:0 auto;padding:var(--gutter)}main>*{max-width:48rem}a{color:var(--brand)}a:hover{color:var(--brand-2)}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;box-shadow:0 0 0 5px var(--focus-ink)}
header{border-bottom:1px solid var(--rule-2);background:var(--paper)}header nav{max-width:var(--page);margin:0 auto;padding:var(--s2) var(--gutter) 0;font-size:var(--fs-ui)}
.brand{display:inline-block;padding:var(--s1) 0;font:600 var(--fs-hed)/1.2 var(--serif)}.brand a{color:var(--ink);text-decoration:none}
.nav{display:flex;flex-wrap:wrap;gap:0 var(--s1);margin:0 calc(var(--s2) * -1);padding:0;list-style:none}.nav li{margin:0}
.nav a{display:block;padding:var(--s3) var(--s2) calc(var(--s3) - 3px);min-height:44px;color:var(--ink-2);text-decoration:none;font-weight:500;border-bottom:3px solid transparent}
.nav a:hover{color:var(--brand)}.nav a[aria-current="page"]{color:var(--ink);border-bottom-color:var(--brand);font-weight:600}
h1,h2,h3{font-family:var(--serif);line-height:var(--lh-hed);font-weight:600}h1{font-size:var(--fs-h1);margin:.6em 0 .3em}h2{font-size:var(--fs-hed);margin:1.6em 0 .5em;padding-top:var(--s2);border-top:2px solid var(--rule)}
.ind{background:var(--panel);border:1px solid var(--hair);border-left:4px solid var(--brand);padding:var(--s3);border-radius:var(--radius);font-size:var(--fs-ui)}
.card{overflow-wrap:anywhere;background:var(--panel);border:1px solid var(--hair);border-radius:var(--radius);padding:var(--s3);margin:var(--s2) 0}
.muted{color:var(--ink-3);font-size:var(--fs-meta)}pre{background:var(--paper-2);padding:var(--s3);border-radius:var(--radius);white-space:pre-wrap;word-break:break-word;font:var(--fs-ui)/1.5 var(--mono);margin:0}
.copy{position:relative}.copy button{position:absolute;top:var(--s2);right:var(--s2);font:inherit;font-size:var(--fs-ui);padding:var(--s1) var(--s3);border-radius:var(--radius);border:1px solid var(--rule-2);background:var(--panel);color:var(--ink);cursor:pointer}
code{background:var(--paper-2);padding:1px var(--s1);border-radius:var(--radius);font-family:var(--mono);font-size:.9em}ol li,ul li{margin:.3em 0}
.tag{display:inline-block;font-size:var(--fs-label);padding:1px var(--s2);border-radius:var(--radius-pill);border:1px solid var(--hair);margin-left:6px}
.tag.lvl-red{border-color:var(--live);color:var(--live)}.tag.lvl-orange{border-color:var(--warn);color:var(--warn)}.tag.lvl-yellow{border-color:var(--warn)}#storm-live h3{font-size:var(--fs-dek);margin:.8em 0 .3em}#storm-live ul{padding-left:1.2em;margin:.3em 0}
.tag.open{border-color:var(--warn)}.tag.claimed{border-color:var(--brand)}.tag.done{border-color:var(--ok)}
.ptbar{background:var(--ink);font-size:var(--fs-meta);text-align:center}.ptbar a{display:block;padding:6px var(--gutter);color:var(--paper);text-decoration:none;font-weight:600;letter-spacing:.02em}.ptbar a:hover{text-decoration:underline;color:var(--paper)}
.hero{padding:var(--s2) 0 var(--s1)}.hero h1{margin:.2em 0 .1em}.hero .tag-line{margin:0 0 .6em;color:var(--ink-3)}.hero .count{font-weight:600;margin:0 0 .6em}.hero .card{margin:6px 0;padding:var(--s2) var(--s3)}.hero .when{font-variant-numeric:tabular-nums;color:var(--brand);font-weight:600;font-size:var(--fs-meta)}.hero .muted{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}.btn{display:block;text-align:center;background:var(--brand);color:var(--paper);font-weight:600;text-decoration:none;padding:var(--s3) var(--s4);border-radius:var(--radius);margin:var(--s3) 0;min-height:44px}.btn:hover{color:var(--paper)}
footer{max-width:var(--page);margin:var(--s5) auto;padding:var(--gutter);border-top:1px solid var(--rule-2)}${CARD_CSS}${TIER_CSS}${TIMELINE_CSS}
.jumps{position:sticky;top:0;z-index:20;display:flex;gap:6px;padding:8px 0;margin:8px 0;background:var(--bg);overflow-x:auto}
.jumps a{flex:0 0 auto;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;font-size:.95rem;border-radius:99px;border:2px solid var(--accent);color:var(--accent);font-weight:700;text-decoration:none;background:var(--bg)}
.jumps a:hover,.jumps a:focus-visible{background:var(--accent);color:var(--bg)}
.jump{scroll-margin-top:64px}#now,#tomorrow,#events{scroll-margin-top:64px}
.earlier{margin:12px 0}.earlier summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600}
.showroom-list{list-style:none;padding:0;margin:.5em 0;font-size:.9rem}.showroom-list li{margin:.25em 0}${IDENTITY_CSS}`;
// D5: the one navigation. Flip `live` to true when a page ships (Now: work/16, Organisers: work/23); no JavaScript.
const NAV = [['Today', '/', true], ['Programme', '/programme/', true], ['Now', '/now/', true], ['Map', '/graph/', true], ['Organisers', '/organisers/', true], ['How', '/how/', true], ['Traffic', '/traffic/', true], ['Join', '/join/', true]];
const navHtml = (here) => `<header><nav aria-label="Main"><span class="brand"><a href="/">${WORDMARK}</a></span>
<ul class="nav">${NAV.filter((n) => n[2]).map(([label, href]) => `<li><a href="${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul></nav><div class="tiles" aria-hidden="true"></div></header>`;
const OG_IMAGE = SITE + 'assets/og/share.png';   // work/design D2: 1200x630, rendered in CI from admin/build/og/share.html (never in git)
const ogDefault = (title, desc) => [['og:type', 'website'], ['og:site_name', 'Lisbon Tech Week'], ['og:title', title], ['og:description', desc], ['og:image', OG_IMAGE], ['og:image:width', '1200'], ['og:image:height', '630']]
  .map(([p, v]) => `<meta property="${p}" content="${esc(v)}">`).join('') + `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${OG_IMAGE}">`;
const page = (title, body, desc, head = '', here = '/') => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">${/og:title/.test(head) ? head : ogDefault(title, desc) + head}<style>${css}</style></head><body>
<div class="ptbar"><a href="https://promptugal.news">Lisbon Tech Week · a PrompTugal.news site <span aria-hidden="true">↗</span></a></div>
${navHtml(here)}
<p class="ind">Independent of Web Summit · <a href="https://websummit.com/">official site</a></p>
<main>${WHATSAPP}${body}</main>
<footer class="muted">${INDEPENDENCE}<br>Built from <a href="${REPO}">the repository</a> at ${BUILT.slice(0, 16).replace('T', ' ')} UTC · <a href="/version.json">${esc(VERSION)}</a>. <a href="/traffic/">Traffic</a> · <a href="/changes/">Changes</a> · <a href="/evolution/">Evolution</a> · <a href="/dashboard/">Swarm</a>.</footer>
<script src="/assets/obs/obs.js" defer></script>
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
const eventCard = (e) => card(e, { esc });
function eventsHtml() {
  if (!events.length) return `<h2>Events</h2><p class="muted">The event listings arrive here once each one has been checked at its public source.</p>`;
  // D13 (design.2): today in jump-able parts. In person by time of day (past ones folded), online in its own part, so each event appears once.
  const t0 = Date.parse(BUILT), isOnl = (e) => /^online\b/i.test(e.place || '') || e.status === 'online';
  const over = (e) => { const sp = evSpan(e); return sp && sp.e <= t0; };
  const bigs = split(events.filter((e) => e.date >= today)).majors;   // D18: the strip; the lists below hold the community events
  const small = (l) => l.filter((e) => sizeOf(e) !== 'major');
  const todayAll = small(sortDay(events.filter((e) => e.date === today)));
  const online = todayAll.filter(isOnl), inPerson = todayAll.filter((e) => !isOnl(e));
  const earlier = inPerson.filter(over), rest = inPerson.filter((e) => !over(e));
  const evening = rest.filter((e) => String(e.start).slice(11, 16) >= '18:00'), daytime = rest.filter((e) => String(e.start).slice(11, 16) < '18:00');
  const sec = (id, title, list, note = '') => `<h3 id="${id}" class="jump">${title} <span class="muted">(${list.length})</span></h3>${note}` + (list.length ? denseList(list, { esc }) : '<p class="muted">Nothing checked in this part.</p>');
  const tom = small(sortDay(events.filter((e) => e.date === tomorrow)));
  const later = events.filter((e) => e.date > tomorrow).length;
  return bigStrip(bigs, { esc }, 'Big events this week') + `<h2>Small events today, ${today}</h2>`
    + (daytime.length ? sec('later-today', 'Later today, before 18:00', daytime) : '')
    + sec('tonight', 'Tonight, 18:00 on', evening)
    + sec('online', 'Online today, any time', online)
    + (earlier.length ? `<details id="earlier" class="earlier"><summary>Earlier today (${earlier.length} already over)</summary>${denseList(earlier, { esc })}</details>` : '')
    + `<h2 id="tomorrow">Tomorrow, ${tomorrow}</h2>` + (tom.length ? denseList(tom, { esc }) : '<p class="muted">Nothing checked yet for this day.</p>')
    + (later ? `<p class="muted">${later} more later this week: <a href="/programme/">browse the whole programme by day, place and kind</a>.</p>` : '');
}


// --- the first screen (design D1): what this is, the count, what is on now or next ---
const nowMs = Date.parse(BUILT);
const heroEvents = events.filter((e) => e.status !== 'cancelled' && e.start);
const isOn = (e) => /^online\b/i.test(e.place || '') || e.status === 'online';
function heroCount(list, d) {
  const t = list.filter((e) => e.date === d);
  return `${t.length} event${t.length === 1 ? '' : 's'} today, ${t.filter(isOn).length} online, ${t.filter((e) => e.status === 'cancelled').length} cancelled by the storm`;
}
function nowNext(list, ms) {
  const live = list.filter((e) => e.status !== 'cancelled' && e.start && Date.parse(e.start) <= ms && (!e.end || Date.parse(e.end) > ms));
  const next = list.filter((e) => e.status !== 'cancelled' && e.start && Date.parse(e.start) > ms).sort((a, b) => a.start.localeCompare(b.start));
  return [...live.map((e) => [e, 'On now']), ...next.map((e) => [e, 'Next'])].slice(0, 3);
}
function heroCard([e, label]) {
  const t = (x) => String(x).slice(11, 16);
  return `<div class="card"><span class="when">${label} · ${t(e.start)}${e.end ? '–' + t(e.end) : ''} UTC</span><br><a href="${esc(hasPage(e) ? eventPath(e) : e.url)}"><strong>${esc(e.name)}</strong></a><div class="muted">${esc([e.place, e.organiser].filter(Boolean).join(' · '))}</div></div>`;
}
const heroData = JSON.stringify(events.map((e) => ({ id: e.id, name: e.name, url: e.url, date: e.date, start: e.start, end: e.end, status: e.status, place: e.place, organiser: e.organiser })).map((e) => e)).replace(/</g, '\\u003c');
const hero = `<section class="hero festival"><span class="kicker">Lisbon · this week</span><h1>Lisbon <em>Tech Week</em></h1>
<p class="tag-line">Lisbon&rsquo;s tech week, every event, live. Independent.</p>
<p class="count" id="hero-count">${esc(heroCount(events, today))}</p>
<a class="btn" href="#events">See all events</a>
<div id="hero-list">${nowNext(heroEvents, nowMs).map(heroCard).join('') || '<p class="muted">Nothing more checked for today.</p>'}</div>
</section>
<script>(function(){try{var E=${heroData},now=Date.now(),d=new Date(now).toISOString().slice(0,10),t=E.filter(function(e){return e.date===d});
if(!t.length)return;var on=function(e){return /^online\\b/i.test(e.place||'')||e.status==='online'};
document.getElementById('hero-count').textContent=t.length+' event'+(t.length===1?'':'s')+' today, '+t.filter(on).length+' online, '+t.filter(function(e){return e.status==='cancelled'}).length+' cancelled by the storm';
var ok=E.filter(function(e){return e.status!=='cancelled'&&e.start}),p=function(x){return Date.parse(x)};
var live=ok.filter(function(e){return p(e.start)<=now&&(!e.end||p(e.end)>now)}).map(function(e){return[e,'On now']}),
nx=ok.filter(function(e){return p(e.start)>now}).sort(function(a,b){return a.start<b.start?-1:1}).map(function(e){return[e,'Next']}),
r=live.concat(nx).slice(0,3);if(!r.length)return;
var box=document.getElementById('hero-list');box.textContent='';r.forEach(function(x){var e=x[0],c=document.createElement('div');c.className='card';var w=document.createElement('span');w.className='when';w.textContent=x[1]+' · '+e.start.slice(11,16)+(e.end?'–'+e.end.slice(11,16):'')+' UTC';var l=document.createElement('a');l.setAttribute('href',/^[a-z0-9][a-z0-9-]*$/.test(e.id||'')?'/e/'+encodeURIComponent(e.id)+'/':e.url);var st=document.createElement('strong');st.textContent=e.name;l.appendChild(st);var m=document.createElement('div');m.className='muted';m.textContent=[e.place,e.organiser].filter(Boolean).join(' · ');c.appendChild(w);c.appendChild(document.createElement('br'));c.appendChild(l);c.appendChild(m);box.appendChild(c)})}catch(x){}})();</script>`;

// --- / -------------------------------------------------------------------
const home = page('Lisbon Tech Week', `
${timelineBlock(events, esc, { eventPath, hasPage }, new Date(BUILT), { limit: 6 })}
<nav class="jumps" aria-label="Jump to"><a href="#timeline">Now</a><a href="#tonight">Tonight</a><a href="#online">Online</a><a href="#tomorrow">Tomorrow</a></nav>
${hero}
<p class="muted">An independent guide to the alternative, community and side events around Web Summit Lisbon this week: what is on, where, when and how to join.</p>
<div class="card"><strong>The storm.</strong> For weather warnings and what moved because of Storm Charles, see
<a href="https://storm-charles.promptugal.news">storm-charles.promptugal.news</a>, <a href="https://www.ipma.pt/">IPMA</a> and <a href="https://www.prociv.gov.pt/">ANEPC</a>. This site is not a warning service.
<div id="storm-live"><p class="muted">The storm site's latest is loading…</p></div></div>
<script src="/storm.js" defer></script>
<div id="events"></div>${eventsHtml()}
<h2>How this is made</h2>
<div class="card">Built in the open by a swarm: one conductor per person, agents by role, Dinis as head. <a href="/how/"><strong>See how it is made</strong></a> · <a href="/join/">Bring your conductor in five minutes</a>.</div>
<!--SHOWROOM-->
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
const joinPage = page('Join Lisbon Tech Week', `
<h1>Bring your conductor in five minutes</h1>
<p>Each person on the team runs one conductor for Lisbon Tech Week in their own Claude account. Dinis is the head conductor. The work lives on <a href="${REPO}/tree/dev/work">the board</a>. How it works: <a href="${REPO}/blob/dev/SWARM.md">SWARM.md</a>.</p>
<h2>Steps</h2><ol>${steps}</ol>
<h2>Your id</h2><p>${ids.map((i) => `<code>${esc(i)}</code>`).join(' ')}</p>
<h2>The prompt</h2>
<div class="copy"><button type="button" id="copy">Copy</button><pre id="prompt">${esc(prompt)}</pre></div>
<h2>The team</h2>${rosterRows}
<h2>The board</h2>${boardRows}
<script>document.getElementById('copy').onclick=async function(){var t=document.getElementById('prompt').innerText;try{await navigator.clipboard.writeText(t);this.textContent='Copied'}catch(e){var r=document.createRange();r.selectNodeContents(document.getElementById('prompt'));var s=getSelection();s.removeAllRanges();s.addRange(r);this.textContent='Selected: copy it'}};</script>
`, 'How a team member brings their own conductor to Lisbon Tech Week.', '', '/join/');

// --- /graph/ (work/05) ----------------------------------------------------
const ptnews = existsSync(join(root, 'data/ptnews-index.json')) ? JSON.parse(read('data/ptnews-index.json')) : null;
const graph = buildGraph(events, ptnews, existsSync(join(root, 'data/communities.json')) ? JSON.parse(read('data/communities.json')).communities : []);   // work/05 uses work/04's communities
const graphPage = page('Connect the dots: Lisbon Tech Week', `<style>${graphCss}</style>` + graphBody(graph, esc), 'The fringe as a graph: events, communities, topics and places, with filters.', '', '/graph/');

// --- write ---------------------------------------------------------------
mkdirSync(join(out, 'join'), { recursive: true });
writeFileSync(join(out, 'index.html'), home);   // rewritten with the showroom strip after the swarm is collected (D6)
writeFileSync(join(out, 'join', 'index.html'), joinPage);
mkdirSync(join(out, 'programme'), { recursive: true });
writeFileSync(join(out, 'programme', 'index.html'), page('The programme: Lisbon Tech Week', programmeBody({ events, esc }), 'The whole week of Lisbon side events: browse by day, place and kind.', '', '/programme/'));
mkdirSync(join(out, 'how'), { recursive: true });
const count = (d, re) => { try { return readdirSync(join(root, d)).filter((f) => re.test(f)).length; } catch { return 0; } };
const nAgents = readdirSync(join(root, 'team')).reduce((a, d) => a + count(`team/${d}/agents`, /\.json$/) + (existsSync(join(root, 'team', d, 'status.json')) ? 1 : 0), 0);
writeFileSync(join(out, 'how', 'index.html'), page('How Lisbon Tech Week is made', howBody({ esc, REPO, n: { events: events.length, people: roster.people.length, agents: nAgents, board: board.length, boardDone: board.filter((b) => b.status === 'done').length, briefs: count('briefs', /\.md$/), inboxes: count('data/inboxes', /\.json$/) } }), 'How Lisbon Tech Week is made: a swarm of conductors and agents, one conductor per person, Dinis as head.', '', '/how/'));
mkdirSync(join(out, 'graph'), { recursive: true });
writeFileSync(join(out, 'graph', 'index.html'), graphPage);
writeFileSync(join(out, 'graph.js'), read('admin/build/graph.js'));
writeFileSync(join(out, 'CNAME'), new URL(ORIGIN).host + '\n');
writeFileSync(join(out, '404.html'), page('Not found', '<h1>That page is not here</h1><p>It may have moved, or it is not built yet. Try one of these:</p><p><a class="btn" href="/">Today in Lisbon</a></p><ul><li><a href="/#events">All events, today and tomorrow</a></li><li><a href="/api/v1/events.json">Every event as data</a></li><li><a href="/join/">Join the team</a></li></ul>', 'Page not found.'));
mkdirSync(join(out, 'api', 'v1'), { recursive: true });
writeFileSync(join(out, 'api', 'v1', 'README.md'), read('api/v1/README.md'));
writeFileSync(join(out, 'api', 'v1', 'events.json'), JSON.stringify({ about: 'Lisbon Tech Week events, each re-read at its public URL (read_at, UTC). Independent of Web Summit.', site: SITE, version: VERSION, built_at: BUILT, events }, null, 2) + '\n');
writeFileSync(join(out, 'api', 'v1', 'graph.json'), JSON.stringify({ about: 'The Lisbon Tech Week graph: events, communities (organisers, as organisations), topics and places. Every edge comes from one event and carries its source URL and read_at. Independent of Web Summit.', site: SITE, version: VERSION, built_at: BUILT, ptnews_from: ptnews?.from || null, ...graph }, null, 1) + '\n');
// Communities (work/04, conductor.fringe@PrompTugal.indi): data/communities.json, made by admin/tools/communities.mjs.
if (existsSync(join(root, 'data/communities.json'))) {
  const cm = JSON.parse(read('data/communities.json'));
  writeFileSync(join(out, 'api', 'v1', 'communities.json'), JSON.stringify({ about: cm.about, site: SITE, version: VERSION, built_at: BUILT, updated: cm.updated, how: cm.how, communities: cm.communities }, null, 2) + '\n');
}
writeFileSync(join(out, 'llms.txt'), `# Lisbon Tech Week\n\n> An independent guide to the alternative, community and side events around Web Summit Lisbon, 9 to 15 November 2026. Independent of Web Summit; for anything official see the organisers' site. Not a warning service: for the storm see https://storm-charles.promptugal.news, IPMA and ANEPC.\n\n- [Events (JSON)](${SITE}api/v1/events.json): each event with its source URL and the time it was read\n- [The graph (JSON)](${SITE}api/v1/graph.json): events, communities, topics and places, each edge with its source\n- [Join the team](${SITE}join/)\n- [Repository](${REPO})\n`);
const orgs = loadOrganisers(root, events);
mkdirSync(join(out, 'organisers'), { recursive: true });
writeFileSync(join(out, 'organisers', 'index.html'), page('For organisers: Lisbon Tech Week', organisersBody(orgs, esc, { eventPath, hasPage }), 'What Lisbon Tech Week offers organisers of side events, and who is listed.'));
const changes = readChanges(root);
mkdirSync(join(out, 'changes'), { recursive: true });
writeFileSync(join(out, 'changes', 'index.html'), page('What changed: Lisbon Tech Week', changesBody(changes, esc, REPO), 'Every release of Lisbon Tech Week: version, commit, time, agent and files touched.'));
writeFileSync(join(out, 'api', 'v1', 'changes.json'), JSON.stringify({ about: 'Lisbon Tech Week releases from git: version (CI tag), commit, UTC time, agent, subject, files touched by area.', site: SITE, version: VERSION, built_at: BUILT, ...changes }, null, 1) + '\n');
const ePages = eventPages(events, { page, esc, linkify, SITE, card, cardList, orgs, dense: (o, why) => denseRow(o, { esc }, '', why, true) });   // work/22: /e/<id>/
for (const p of ePages) { mkdirSync(join(out, p.path), { recursive: true }); writeFileSync(join(out, p.path, 'index.html'), p.html); }
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${SITE}</loc></url>\n<url><loc>${SITE}join/</loc></url>\n<url><loc>${SITE}how/</loc></url>\n<url><loc>${SITE}programme/</loc></url>\n<url><loc>${SITE}graph/</loc></url>\n<url><loc>${SITE}traffic/</loc></url>\n<url><loc>${SITE}evolution/</loc></url>\n${ePages.map((p) => `<url><loc>${esc(p.url)}</loc></url>\n`).join('')}</urlset>\n`);
writeFileSync(join(out, 'version.json'), JSON.stringify({ version: VERSION, commit: process.env.GITHUB_SHA || '', pushed_at: process.env.PUSHED_AT || '', built_at: BUILT }, null, 2) + '\n');
writeFileSync(join(out, 'version.txt'), VERSION + '\n');
writeFileSync(join(out, '.nojekyll'), '');
mkdirSync(join(out, 'now'), { recursive: true });
writeFileSync(join(out, 'now', 'index.html'), page('On now: Lisbon Tech Week', `<h1>On now</h1>
<p class="muted">What is on now and in the next 24 hours, from events re-read at their public pages. Not a warning service: for the storm see <a href="https://storm-charles.promptugal.news">storm-charles.promptugal.news</a>.</p>
${timelineBlock(events, esc, { eventPath, hasPage }, new Date(BUILT), { limit: 40, hours: 24, full: true })}`, 'What is on now and in the next 24 hours around Web Summit Lisbon.', '', '/now/'));
writeFileSync(join(out, 'now.js'), nowJs);
writeFileSync(join(out, 'storm.js'), read('admin/build/storm.js'));
// observability (work/21): the sender and its public config on every page, and /traffic/ from the drain's counts
mkdirSync(join(out, 'assets', 'obs'), { recursive: true });
for (const f of ['obs.js', 'obs.json']) writeFileSync(join(out, 'assets', 'obs', f), read(`assets/obs/${f}`));
const traffic = existsSync(join(root, 'data/obs/traffic.json')) ? JSON.parse(read('data/obs/traffic.json')) : null;
mkdirSync(join(out, 'traffic'), { recursive: true });
writeFileSync(join(out, 'traffic', 'index.html'), page('Traffic: Lisbon Tech Week', `<style>${trafficCss}</style>` + trafficBody(traffic, esc, ORIGIN), 'Who reads Lisbon Tech Week and how its links spread: counts only.', '', '/traffic/'));
if (traffic) writeFileSync(join(out, 'traffic', 'traffic.json'), JSON.stringify(traffic, null, 1) + '\n');
// /me/ (work/26), /dashboard/ and /api/v1/swarm.json (work/25)
for (const d of ['assets/me', 'assets/vendor/pki/2026-11-06']) { mkdirSync(join(out, d), { recursive: true }); for (const f of readdirSync(join(root, d)).filter((x) => /\.js$/.test(x))) writeFileSync(join(out, d, f), read(`${d}/${f}`)); }
mkdirSync(join(out, 'me'), { recursive: true });
writeFileSync(join(out, 'me', 'index.html'), page('Your key: Lisbon Tech Week', `<style>${meCss}</style>` + meBody(), 'Make your key and passkey in the browser, and message the lead.'));
// /traces/<event_id>/ (a draft, not linked yet): how one page was made, drawn from team/angelo/traces/*.json
for (const f of existsSync(join(root, 'team/angelo/traces')) ? readdirSync(join(root, 'team/angelo/traces')).filter((x) => x.endsWith('.json')) : []) {
  const tr = JSON.parse(read(`team/angelo/traces/${f}`)), ev = events.find((e) => e.id === tr.event_id);
  if (!/^[a-z0-9-]+$/.test(tr.event_id || '')) continue;
  mkdirSync(join(out, 'traces', tr.event_id), { recursive: true });
  writeFileSync(join(out, 'traces', tr.event_id, 'index.html'), page(`How this page was made: ${ev?.name || tr.event_id}`, traceBody(tr, esc, { eventName: ev?.name, repo: REPO }), 'Every human, agent, source-read, CI and deploy step that made one Lisbon Tech Week page, with its evidence.', '', ''));
}
// /evolution/ (work/27): each site's captures over time, from the pointers in data/captures/
mkdirSync(join(out, 'evolution'), { recursive: true });
writeFileSync(join(out, 'evolution', 'index.html'), page('Evolution: Lisbon Tech Week', `<style>${evolutionCss}</style>` + evolutionBody(loadEvolution(root), esc), 'Screenshots and page text of Lisbon Tech Week and every organiser page, hour by hour: what changed.', '', '/evolution/'));
// /dashboard/ and /api/v1/swarm.json (work/25)
const swarm = await collectSwarm({ root, roster, status, board, traffic, builtAt: BUILT, repo: REPO });
mkdirSync(join(out, 'dashboard'), { recursive: true });
writeFileSync(join(out, 'dashboard', 'index.html'), page('The swarm: Lisbon Tech Week', `<style>${swarmCss}${meCss}</style>` + swarmBody(swarm, esc, REPO) + swarmScript, 'Who is online in the Lisbon Tech Week swarm: conductors, agents, the board and the latest changes.'));
writeFileSync(join(out, 'api', 'v1', 'swarm.json'), JSON.stringify(swarm, null, 1) + '\n');
// D6 the showroom strip on the home page: counts from swarm.json, last 5 changes from changes (both built from the repository)
{
  const c = swarm.counts, last = (changes.commits || []).slice(0, 5);
  const hhmm = (t) => String(t).slice(11, 16);
  const showroom = `<div class="card showroom"><strong>Right now: ${c.agents_online} agents and ${c.conductors_online} conductors online</strong>
<span class="muted">(of ${c.agents_total} agents and ${c.conductors_started} conductors started; online = status updated in the last ${swarm.online_minutes} minutes)</span>
<ul class="showroom-list">${last.map((x) => `<li><span class="muted">${esc(hhmm(x.time))} UTC</span> <code>${esc(String(x.agent || '').replace(/\.fringe@.*/, '').replace(/@.*/, ''))}</code> ${esc(x.subject)}</li>`).join('')}</ul>
<a href="/dashboard/">The swarm dashboard</a> · <a href="/changes/">Every change</a></div>`;
  writeFileSync(join(out, 'index.html'), home.replace('<!--SHOWROOM-->', showroom));
}
console.log(`built _site/ ${VERSION}: /, /join/, /graph/ (${graph.nodes.length} nodes, ${graph.edges.length} edges), ${events.length} events, ${ePages.length} event pages (${roster.people.length} people, ${board.length} board items, ${Object.keys(status).length} status files)`);
