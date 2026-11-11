// A page for every event at /e/<id>/ (work/22, dev.lead.fringe@PrompTugal.dinis). The organiser is the star:
// their name and their own page come first and largest; we point to them, never replace them.
// Built from data/events.json alone. Every value is escaped; only https links; no contact details.
const STATUS = { on: 'On', moved: 'Moved', cancelled: 'Cancelled', online: 'Online', unknown: 'Unknown' };
const STATUS_SAY = {
  on: 'On, as far as the organiser\'s page says.',
  online: 'Online.',
  moved: 'Moved.',
  cancelled: 'Cancelled.',
  unknown: 'Unknown: the organiser\'s page does not say.',
};

export const eventPath = (e) => `/e/${encodeURIComponent(e.id)}/`;
export const hasPage = (e) => typeof e.id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(e.id);
const isOnline = (e) => /^online\b/i.test(e.place || '') || e.status === 'online';

// The area: the place's last bracket "(Parque das Nações)", or "online"; null when the page gives none.
export function area(e) {
  if (isOnline(e)) return 'online';
  const m = String(e.place || '').match(/\(([^()]+)\)\s*$/);
  return m ? m[1].split(/[\/,]/)[0].trim().toLowerCase() : null;
}
let ORGS = null;   // work/23: the lead organisation's id, from organisers.mjs, when the build passes it
const orgKey = (e) => (ORGS?.of.get(e)?.[0]?.id) || String(e.organiser || '').replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase();

// work/23: each organisation named, linked to /organisers/ (organisations only)
const orgLinks = (e, esc) => { const l = ORGS?.of.get(e) || []; return l.length ? `<div class="muted" style="margin:-.3em 0 .6em">${l.map((o) => `<a href="/organisers/#${esc(encodeURIComponent(o.id))}">${esc(o.name)}</a>`).join(' · ')}: all their events</div>` : ''; };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function day(iso) {
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
  return isNaN(d) ? String(iso) : `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const hm = (iso) => (/T\d\d:\d\d/.test(String(iso)) ? String(iso).slice(11, 16) : null);
function when(e) {
  const s = e.start && hm(e.start), en = e.end && hm(e.end);
  const sameDay = !e.end || String(e.end).slice(0, 10) === String(e.start || e.date).slice(0, 10);
  if (!s) return `${day(e.date)}, time not stated`;
  if (!en) return `${day(e.start)}, from ${s}`;
  return sameDay ? `${day(e.start)}, ${s} to ${en}` : `${day(e.start)} ${s} to ${day(e.end)} ${en}`;
}

function related(e, all) {
  const k = orgKey(e), a = area(e), t = new Set(e.topics || []);
  return all.filter((o) => o !== e && hasPage(o)).map((o) => {
    const same = k && orgKey(o) === k;
    const shared = (o.topics || []).filter((x) => t.has(x)).length;
    const place = a && area(o) === a;
    const score = (same ? 100 : 0) + (place ? 3 : 0) + shared * 2;
    const why = same ? 'same organiser' : [place && (a === 'online' ? 'also online' : 'same area'), shared && 'shared topic'].filter(Boolean).join(', ');
    return { o, score, why, gap: Math.abs(Date.parse(o.start || o.date) - Date.parse(e.start || e.date)) || 0 };
  }).filter((r) => r.score > 0).sort((x, y) => y.score - x.score || x.gap - y.gap).slice(0, 6);
}

const CSS = `.star{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;padding:10px 12px;margin:10px 0;overflow-wrap:anywhere}
.star .by{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.star .org{font-size:1.2rem;line-height:1.25;font-weight:700;margin:.05em 0 .5em}.star .host{font-size:.9rem;color:var(--muted);margin:0 0 14px}
.star .go{display:block;text-align:center;background:var(--accent);color:var(--bg);font-weight:600;text-decoration:none;padding:10px 12px;min-height:44px;border-radius:8px;font-size:1rem}.star .go:hover,.star .go:focus-visible{filter:brightness(1.1)}
.facts{display:grid;grid-template-columns:max-content 1fr;gap:6px 12px;margin:0}.facts dt{color:var(--muted)}.facts dd{margin:0;overflow-wrap:anywhere;min-width:0}
@media (max-width:420px){.facts{grid-template-columns:5.2em 1fr;gap:4px 10px;font-size:.95rem}.facts dt{font-size:.85rem;padding-top:1px}}
.share{display:inline-flex;align-items:center;gap:6px;margin:.2em 0 .8em;font:inherit;font-weight:600;padding:10px 16px;min-height:44px;border-radius:8px;border:2px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer}.share:hover,.share:focus-visible{background:var(--accent);color:var(--bg)}.share-note{margin-left:8px}
blockquote{margin:.4em 0;padding:.3em .8em;border-left:3px solid var(--line);color:var(--fg)}.yours{border-left:4px solid var(--warn)}`;

// page(title, body, desc, head) and linkify come from build.mjs, so the layout, independence line and footer are the site's own.
export function eventPages(events, { page, esc, linkify, SITE, card, cardList, orgs, dense, intel = "" }) {
  ORGS = orgs || null;
  const list = events.filter(hasPage);
  return list.map((e) => {
    const url = SITE.replace(/\/$/, '') + eventPath(e);
    const org = e.organiser || 'The organiser (not named on the page)';
    const desc = `${e.name}, by ${org}. ${when(e)} (Lisbon time = UTC). ${isOnline(e) ? 'Online' : e.place || ''}. Status: ${STATUS[e.status] || 'Unknown'}. Register on the organiser's page.`.slice(0, 300);
    const title = `${e.name}: ${org} · Lisbon Tech Fringe`;
    const head = [
      ['og:type', 'article'], ['og:site_name', 'Lisbon Tech Fringe'], ['og:title', `${e.name}, by ${org}`], ['og:description', desc], ['og:url', url], ['og:image', SITE + 'assets/og/share.png'], ['og:image:width', '1200'], ['og:image:height', '630'],
    ].map(([p, v]) => `<meta property="${p}" content="${esc(v)}">`).join('')
      + `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}assets/og/share.png"><link rel="canonical" href="${esc(url)}">`;
    const st = STATUS[e.status] ? e.status : 'unknown';
    const facts = [
      ['Status', `<span class="chip ${esc(st)}">${esc(STATUS[st])}</span> ${esc(STATUS_SAY[st])}`
        + (e.storm_note ? `<blockquote>Storm: “${linkify(e.storm_note)}”</blockquote>` : '')],
      ['When', `${esc(when(e))}<div class="muted">Times are Lisbon time, which is UTC in November.</div>`],
      ['Where', isOnline(e) ? `Online${e.place && e.place.toLowerCase() !== 'online' ? ` <span class="muted">${linkify(e.place.replace(/^online\s*/i, ''))}</span>` : ''}` : linkify(e.place || 'Not stated')],
      e.join && ['How to join', linkify(e.join)],
      e.cost && ['Cost', `${esc(e.cost)} <span class="muted">(as stated)</span>`],
      e.kind && ['Kind', esc(e.kind)],
      (e.topics || []).length && ['Topics', e.topics.map((t) => `<span class="tag" style="margin:0 4px 4px 0">${esc(t)}</span>`).join('')],
      e.label && ['Label', `${esc(e.label)} <span class="muted">(fact: read on the organiser's page; evidence: read, but the page leaves it open; hypothesis: not confirmed at source)</span>`],
      e.note && ['Note', linkify(e.note)],
    ].filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    const rel = related(e, list);
    const body = `<style>${CSS}</style>
<div class="star"><div class="by">Organised by</div><div class="org">${esc(org)}</div>${orgLinks(e, esc)}
<a class="go" href="${esc(e.url)}">Register or see details on their page &rarr;</a>
<div class="muted" style="margin-top:8px">Opens ${esc(new URL(e.url).hostname.replace(/^www\./, ''))}: their page is the one that counts.</div></div>
<h1>${esc(e.name)}</h1>
<p class="sharerow" hidden><button type="button" class="share" id="share" data-url="${esc(url)}" data-title="${esc(e.name)}">Share this event</button><span class="muted share-note" id="share-note" role="status" aria-live="polite"></span></p>
<script>(function(){var b=document.getElementById('share'),n=document.getElementById('share-note');if(!b)return;b.parentNode.hidden=false;b.onclick=function(){var u=b.dataset.url,t=b.dataset.title;function done(m){n.textContent=m;setTimeout(function(){n.textContent=''},3000)}
if(navigator.share){navigator.share({title:t,text:t+' · Lisbon Tech Fringe',url:u}).catch(function(){})}
else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){done('Link copied')},function(){done('Copy this address: '+u)})}
else{done('Copy this address: '+u)}}})();</script>
<dl class="facts">${facts}</dl>
<p class="muted">Source: <a href="${esc(e.url)}">${esc(e.url)}</a>, read ${esc(String(e.read_at).slice(0, 16).replace('T', ' '))} UTC.</p>
${rel.length ? `<h2>Related events</h2>` + `<ul class="dense">${rel.map(({ o, why }) => dense(o, why)).join('')}</ul>` : ''}
${intel}
<p class="ind yours">Organisers: is this right? This page is yours to improve. See <a href="/join/">/join/</a>.</p>
<p class="muted"><a href="/">All events</a> · <a href="/graph/">The graph</a> · <a href="/api/v1/events.json">The data</a></p>`;
    return { id: e.id, path: eventPath(e), url, html: page(title, body, desc, head) };
  });
}
