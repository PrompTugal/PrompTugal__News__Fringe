// /programme/: the whole week as a festival programme (D3 follow-up, brief 5; design.3.fringe@PrompTugal.dinis).
// Browse by day, area and kind. Without JavaScript every day and every card is shown; with it, chips filter.
import { placeShort } from './cards.mjs';
import { bigCard, denseRow, split, sizeOf } from './tiers.mjs';
import { area } from './event-pages.mjs';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayName = (d) => { const x = new Date(d + 'T00:00:00Z'); return `${DAYS[x.getUTCDay()]} ${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`; };
// Where: Online, a named neighbourhood, or "Area not stated" (a source that names only a feed is not an area).
export function where(e) {
  if (area(e) === 'online') return 'Online';
  const m = String(e.place || '').match(/\(([^()]+)\)\s*$/);
  if (!m || /\b(feed|per|unknown|not stated)\b/i.test(m[1])) return 'Area not stated';
  return placeShort(e);
}
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const KIND = { 'side event': 'Side events', meetup: 'Meetups', online: 'Online talks', party: 'Parties', workshop: 'Workshops', conference: 'Conferences', unconference: 'Unconferences', other: 'Other' };
const kindOf = (e) => (KIND[e.kind] ? e.kind : 'other');

export const programmeCss = `
.pg-bar{position:sticky;top:0;z-index:5;background:var(--paper,var(--bg));border-bottom:1px solid var(--hair);padding:8px 0;margin:0 0 8px}
.pg-row{display:flex;gap:6px;overflow-x:auto;padding:3px 0;scrollbar-width:thin;align-items:center}
.pg-row>b{flex:none;position:sticky;left:0;background:var(--paper,var(--bg));z-index:1;padding:12px 4px 12px 0;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-3);min-width:3.6em}
.pg-chip{flex:none;min-height:44px;display:inline-flex;align-items:center;padding:0 14px;border-radius:99px;border:1.5px solid var(--hair);background:var(--panel);color:var(--ink,var(--fg));font:inherit;font-size:.92rem;cursor:pointer;text-decoration:none}
.pg-chip[aria-pressed=true]{background:var(--brand);color:var(--paper,var(--bg));border-color:var(--brand);font-weight:700}
.pg-count{font-size:.85rem;color:var(--ink-3);margin:4px 0 0}
.pg-day{scroll-margin-top:170px}.pg-day[hidden]{display:none}.pg-day .bigs-row{margin-bottom:4px}
.pg-empty{padding:16px;border:2px dashed var(--hair);border-radius:10px}`;

export function programmeBody({ events, esc }) {
  const days = [...new Set(events.map((e) => e.date))].sort();
  const areas = Object.entries(events.reduce((m, e) => { const w = where(e); m[w] = (m[w] || 0) + 1; return m; }, {}))
    .filter(([w, n]) => w !== 'Online' && w !== 'Area not stated' && n >= 2).sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const kinds = [...new Set(events.map(kindOf))].filter((k) => k !== 'other' || true);
  const chip = (group, val, label, pressed = false) => `<button type="button" class="pg-chip" data-g="${group}" data-v="${esc(val)}" aria-pressed="${pressed}">${esc(label)}</button>`;
  const attrs = (e) => ` data-day="${esc(e.date)}" data-where="${esc(slug(where(e)))}" data-kind="${esc(kindOf(e))}" data-live="${e.status === 'cancelled' ? 0 : 1}" data-size="${sizeOf(e)}"`;
  const sections = days.map((d) => {
    const { majors, community } = split(events.filter((e) => e.date === d));
    return `<section class="pg-day" id="d-${d}" data-day="${d}"><h2>${esc(dayName(d))} <span class="muted">(<span class="pg-n">${majors.length + community.length}</span>)</span></h2>
${majors.length ? `<ul class="bigs-row">${majors.map((e) => bigCard(e, { esc }, attrs(e))).join('')}</ul>` : ''}
${community.length ? `<ul class="dense">${community.map((e) => denseRow(e, { esc }, attrs(e))).join('')}</ul>` : ''}</section>`;
  }).join('');
  const whereChips = [chip('where', '', 'Anywhere', true), chip('where', 'online', 'Online'), chip('where', 'in-person', 'In person'), ...areas.map((a) => chip('where', slug(a), a))].join('');
  return `<style>${programmeCss}</style>
<h1>The programme</h1>
<p>Lisbon's week of side events, community nights and online sessions, all in one list. Choose a day, a place or a kind. Every entry links to the organiser's own page.</p>
<div class="pg-bar" role="group" aria-label="Filter the programme">
<div class="pg-row"><b>Day</b>${chip('day', '', 'All days', true)}${days.map((d) => chip('day', d, dayName(d).replace(/ \d+ \w+$/, '').slice(0, 3) + ' ' + dayName(d).split(' ')[1])).join('')}</div>
<div class="pg-row"><b>Where</b>${whereChips}</div>
<div class="pg-row"><b>Size</b>${chip('size', '', 'All sizes', true)}${chip('size', 'major', 'Big events')}${chip('size', 'community', 'Small and community')}</div>
<div class="pg-row"><b>Kind</b>${chip('kind', '', 'Any kind', true)}${kinds.map((k) => chip('kind', k, KIND[k])).join('')}<button type="button" class="pg-chip" id="pg-live" aria-pressed="false">Hide cancelled</button></div>
<p class="pg-count" id="pg-count" aria-live="polite">${events.length} events</p></div>
${sections}
<p class="pg-empty" id="pg-empty" hidden>Nothing matches those filters. Try "All days" or "Anywhere".</p>
<script>(function(){try{var f={day:'',where:'',kind:'',size:''},live=false,cards=[].slice.call(document.querySelectorAll('.big,.row')),secs=[].slice.call(document.querySelectorAll('.pg-day'));
function run(){var n=0;cards.forEach(function(c){var d=c.dataset,w=f.where,ok=(!f.day||d.day===f.day)&&(!f.kind||d.kind===f.kind)&&(!f.size||d.size===f.size)&&(!live||d.live==='1')&&(!w||(w==='in-person'?d.where!=='online':d.where===w));c.hidden=!ok;if(ok)n++});
secs.forEach(function(s){var v=s.querySelectorAll('.big:not([hidden]),.row:not([hidden])').length;s.hidden=!v;s.querySelector('.pg-n').textContent=v});
document.getElementById('pg-count').textContent=n+' of '+cards.length+' events';document.getElementById('pg-empty').hidden=n>0}
document.querySelectorAll('.pg-chip[data-g]').forEach(function(b){b.addEventListener('click',function(){f[b.dataset.g]=b.dataset.v;document.querySelectorAll('.pg-chip[data-g="'+b.dataset.g+'"]').forEach(function(o){o.setAttribute('aria-pressed',o===b)});run()})});
document.getElementById('pg-live').addEventListener('click',function(e){live=!live;e.target.setAttribute('aria-pressed',live);run()});
var h=(location.hash.match(/^#d-(\\d{4}-\\d\\d-\\d\\d)$/)||[])[1];if(h){var b=document.querySelector('.pg-chip[data-g=day][data-v="'+h+'"]');if(b)b.click()}}catch(e){}})();</script>`;
}
