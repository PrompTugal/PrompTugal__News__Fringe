// D28 (design.1.fringe@PrompTugal.dinis): the home page is TODAY, IN LISBON. It asks "What are you looking for?",
// filters by a role (never a person), shows now / next hour / tonight, and puts each event on a visual card:
// the organiser first, its own picture (data/event-images.json, work/45) or a typographic tile, free or paid, where, when.
// Everything is rendered on the server (works without JavaScript); JavaScript only filters and moves the clock.
// Roles are OUR READING of an event's topics and name (a hypothesis, said on the page), not what the organiser says.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { placeShort } from './cards.mjs';
import { nowStrip, NOWSTRIP_CSS } from './nowstrip.mjs';   // design.2.fringe@PrompTugal.dinis
import { AZULEJO_URI } from './identity.mjs';
import { loadOrganisers, organiserPath } from './organisers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ROLES = [
  ['all', 'Everything', null],
  ['investor', 'Investor', /investor|fundrais|venture|angel|family office|capital|\bvc\b|fintech|impact invest/i],
  ['founder', 'Founder', /founder|startup|pitch|growth|sales|legal|entrepreneur|fundrais|saas|go-to-market|hiring|careers/i],
  ['builder', 'Builder', /\bai\b|dev|engineer|deep ?tech|hardware|saas|data|product|design|\bux\b|code|\bit\b|robot|security|open ?source|automation/i],
  ['curious', 'Just curious', 'free'],
];
const roleOf = (e) => {
  const hay = `${(e.topics || []).join(' ')} ${e.name || ''}`;
  const r = ROLES.slice(1).filter(([, , re]) => (re === 'free' ? isFree(e) : re.test(hay))).map(([id]) => id);
  return r.length ? r : ['curious'];
};
function isFree(e) { return /^free\b/i.test(e.cost || '') && !/paid|eur\s*\d/i.test(e.cost || ''); }
export function priceOf(e) {
  const c = String(e.cost || '');
  if (isFree(e)) return { t: 'Free', k: 'free' };
  const m = c.match(/(?:EUR|€)\s*([\d.,]+)/i);
  if (m) return { t: /from|tier|up to/i.test(c) ? `From €${m[1]}` : `€${m[1]}`, k: 'paid' };
  return { t: /^unknown|not stated/i.test(c) || !c ? 'Price not stated' : 'Paid', k: 'unk' };
}
const OUTSIDE = /\b(estoril|cascais|sintra|covilh|porto\b|oeiras|set[uú]bal|coimbra|braga|faro)\b/i;
export const inLisbon = (e) => !OUTSIDE.test(`${e.place || ''} ${e.neighbourhood || ''}`);
const isOnline = (e) => /^online\b/i.test(e.place || '') || e.status === 'online' || e.kind === 'online';
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hoodOf = (e) => (e.neighbourhood ? String(e.neighbourhood).split(/[\/,]/)[0].trim() : '');   // only a neighbourhood the research named
const ELSE = 'Elsewhere in Lisbon';
const hm = (iso) => String(iso).slice(11, 16);
const orgName = (e) => String(e.organiser || 'Organiser not named').replace(/\s*\((per|from|on|as)\b[^)]*\)\s*/gi, ' ').trim();
const TILES = ['--tile', '--river', '--terracotta', '--tram', '--ok'];
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function images() {
  const f = join(root, 'data', 'event-images.json');
  if (!existsSync(f)) return {};
  try {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    const list = Array.isArray(j) ? j : Array.isArray(j.images) ? j.images : Object.entries(j.images || j).map(([id, v]) => ({ id, ...(typeof v === 'string' ? { url: v } : v) }));
    return Object.fromEntries(list.filter((x) => x && x.id && /^https:\/\//.test(x.url || x.image || '')).map((x) => [x.id, x.url || x.image]));
  } catch { return {}; }
}

export const homeCss = NOWSTRIP_CSS + `
.hm{--az:${AZULEJO_URI}}
.hm{margin-top:var(--s3)}
.hm-kick{font:400 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin:0 0 6px}
.hm h1{font:600 clamp(26px,6vw,40px)/1.08 var(--serif);letter-spacing:-.01em;margin:0 0 var(--s2);max-width:none}.hm h1 em{color:var(--ok)}
.hm-roles{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 calc(var(--gutter) * -1) var(--s3);padding:2px var(--gutter)}.hm-roles::-webkit-scrollbar{display:none}
.hm-chip{flex:none;min-height:44px;padding:0 16px;border-radius:99px;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink);font:600 14px/1 var(--sans);cursor:pointer}
.hm-chip[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.hm-note{font:400 11.5px/1.5 var(--mono);color:var(--ink-3);margin:0 0 var(--s3)}
.hm-when{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:2px solid var(--ink);border-radius:8px;overflow:hidden;margin:0 0 var(--s4)}
.hm-w{min-height:64px;padding:8px 10px;background:var(--paper);border:0;border-right:1px solid var(--hair);text-align:left;font:inherit;color:var(--ink);cursor:pointer}.hm-w:last-child{border-right:0}
.hm-w b{display:block;font:600 26px/1 var(--serif);font-variant-numeric:tabular-nums}.hm-w span{font:500 11px/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}
.hm-w[aria-pressed=true]{background:var(--ink);color:var(--paper)}.hm-w[aria-pressed=true] span{color:var(--paper)}.hm-w.live b{color:var(--live)}.hm-w.live[aria-pressed=true] b{color:var(--paper)}
.hm-where{margin:0 0 var(--s4)}.hm-where p{margin:0 0 6px}
.hm-hood{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 calc(var(--gutter) * -1);padding:2px var(--gutter)}.hm-hood::-webkit-scrollbar{display:none}
.hm-h{flex:none;min-height:36px;padding:0 12px;border-radius:99px;border:1px solid var(--hair);background:var(--panel);color:var(--ink-2);font:500 12.5px/1 var(--mono);cursor:pointer}.hm-h[aria-pressed=true]{border-color:var(--brand);color:var(--brand);font-weight:700}
.hm-sec{font:600 20px/1.2 var(--serif);margin:var(--s4) 0 var(--s3);padding-top:var(--s2);border-top:2px solid var(--ink)}.hm-sec small{font:400 12px/1 var(--mono);color:var(--ink-3);margin-left:8px}
.hm-grid{display:grid;grid-template-columns:1fr;gap:var(--s4);list-style:none;margin:0;padding:0}
.hm-c{position:relative;background:var(--panel);border:1px solid var(--hair);border-radius:8px;overflow:hidden;display:flex;flex-direction:column}
.hm-c[hidden]{display:none}.hm-c.past{opacity:.6}
.hm-img{display:block;height:132px;background:var(--paper-2);position:relative;overflow:hidden}.hm-img img{display:block;width:100%;height:100%;object-fit:cover}
.hm-tile{display:flex;align-items:flex-end;justify-content:space-between;padding:10px 12px;color:var(--paper);background:color-mix(in srgb,var(--c) 78%,var(--ink))}
.hm-tile b{font:600 44px/.9 var(--serif);letter-spacing:-.02em;opacity:.95}.hm-tile i{font:500 10.5px/1 var(--mono);font-style:normal;letter-spacing:.08em;text-transform:uppercase}
.hm-tile::before{content:"";position:absolute;inset:0;background:rgba(255,255,255,.14);-webkit-mask:var(--az) 0 0/28px 28px;mask:var(--az) 0 0/28px 28px}
.hm-body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:4px;flex:1}
.hm-org a{position:relative;z-index:1;color:inherit;text-decoration:none}.hm-org a:hover{color:var(--brand);text-decoration:underline}.hm-org{font:600 11px/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}
.hm-t{font:600 18px/1.25 var(--serif);margin:0}.hm-t a{color:var(--ink);text-decoration:none}.hm-t a::after{content:"";position:absolute;inset:0}.hm-t a:hover{color:var(--brand);text-decoration:underline}
.hm-m{font:400 12px/1.5 var(--mono);color:var(--ink-3)}
.hm-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;padding-top:6px}
.hm-tag{flex:none;font:500 10.5px/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;padding:3px 6px;border:1px solid var(--hair);border-radius:3px;color:var(--ink-2)}
.hm-tag.free{border-color:var(--ok);color:var(--ok)}.hm-tag.big{background:var(--ink);color:var(--paper);border-color:var(--ink)}.hm-tag.now{background:var(--live);color:var(--paper);border-color:var(--live)}.hm-tag.x{border-color:var(--live);color:var(--live)}
.hm-empty{padding:var(--s4);border:2px dashed var(--hair);border-radius:8px;color:var(--ink-2)}
.hm-more{display:block;width:100%;min-height:44px;margin:var(--s3) 0;background:var(--panel);border:1px dashed var(--ink-3);border-radius:6px;color:var(--ink-2);font:500 13px/1 var(--mono);cursor:pointer}
.hm-foot{margin:var(--s5) 0 var(--s3);font-size:14px;color:var(--ink-2)}.hm-storm{font:400 12.5px/1.5 var(--mono);color:var(--ink-3);border-top:1px solid var(--hair);padding-top:var(--s3);margin-top:var(--s5)}
@media(min-width:620px){.hm-grid{grid-template-columns:repeat(2,1fr)}}@media(min-width:960px){.hm-grid{grid-template-columns:repeat(3,1fr)}.hm-img{height:150px}}
`;

export function homeBody({ events, esc, eventPath, hasPage, now = new Date(), stormHref = 'https://storm-charles.promptugal.news' }) {
  const today = now.toISOString().slice(0, 10);
  const imgs = images();
  const day = events.filter((e) => e.start && String(e.start).slice(0, 10) === today).sort((a, b) => a.start.localeCompare(b.start));
  const inCity = day.filter((e) => inLisbon(e) && !isOnline(e));
  const online = day.filter((e) => inLisbon(e) && isOnline(e));
  const away = day.length - inCity.length - online.length;
  const t = now.getTime();
  const x = new Date(today + 'T00:00:00Z');
  const hoods = new Map();
  inCity.forEach((e) => { const h = hoodOf(e); if (h) hoods.set(h, (hoods.get(h) || 0) + 1); });
  const big = new Set([...hoods].filter(([, n]) => n >= 3).map(([h]) => h));   // Dinis, 14:00: a chip with fewer than 3 events is folded into 'Elsewhere in Lisbon'
  const hoodKey = (e) => { const h = hoodOf(e); return h && big.has(h) ? h : h ? ELSE : ''; };
  const goodHoods = [...hoods].filter(([h]) => big.has(h)).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const elseN = inCity.filter((e) => hoodKey(e) === ELSE).length;
  if (elseN >= 3) goodHoods.push([ELSE, elseN]);
  const O = loadOrganisers(root, events);

  const card = (e) => {
    const price = priceOf(e), isBig = e.size === 'major', org = orgName(e), lead = (O.of.get(e) || [])[0];
    const s = Date.parse(e.start), en = e.end ? Date.parse(e.end) : s + 36e5;
    const href = hasPage(e) ? eventPath(e) : e.url;
    const c = TILES[hash(org) % TILES.length];
    const media = imgs[e.id]
      ? `<span class="hm-img"><img src="${esc(imgs[e.id])}" alt="" loading="lazy" decoding="async"></span>`
      : `<span class="hm-img hm-tile" style="--c:var(${c})"><b>${esc([...org.replace(/[^\p{L}\p{N} ]/gu, '').trim()][0] || '·')}</b><i>${esc(e.kind || 'event')}</i></span>`;
    const roles = roleOf(e).join(' ');
    return `<li class="hm-c${e.status === 'cancelled' ? ' x' : ''}" data-s="${s}" data-e="${en}" data-r="${roles}" data-h="${esc(hoodKey(e))}">${media}
<div class="hm-body"><span class="hm-org">${lead ? `<a href="${esc(organiserPath(lead.id))}">${esc(org)}</a>` : esc(org)}</span><h3 class="hm-t"><a href="${esc(href)}">${esc(e.name)}</a></h3>
<span class="hm-m">${hm(e.start)}${e.end ? '–' + hm(e.end) : ''} UTC · ${esc(isOnline(e) ? 'Online' : placeShort(e))}</span>
<span class="hm-tags"><span class="hm-tag ${price.k}">${esc(price.t)}</span>${isBig ? '<span class="hm-tag big">Anchor</span>' : ''}${e.status === 'cancelled' ? '<span class="hm-tag x">Cancelled</span>' : e.status === 'moved' ? '<span class="hm-tag x">Moved</span>' : ''}<span class="hm-tag now" hidden>On now</span></span></div></li>`;
  };
  const state = (e) => { const s = Date.parse(e.start), en = e.end ? Date.parse(e.end) : s + 36e5; return t >= en ? 'past' : t >= s ? 'now' : 'next'; };
  const nowN = inCity.filter((e) => state(e) === 'now' && e.status !== 'cancelled').length;
  const nextN = inCity.filter((e) => { const s = Date.parse(e.start); return s > t && s <= t + 36e5 && e.status !== 'cancelled'; }).length;
  const tonN = inCity.filter((e) => Date.parse(e.end || e.start) >= Date.parse(today + 'T18:00:00Z') && e.status !== 'cancelled').length;

  const live = inCity.filter((e) => state(e) !== 'past'), past = inCity.filter((e) => state(e) === 'past');
  const roleChips = ROLES.map(([id, label], i) => `<button type="button" class="hm-chip" data-role="${id}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('');
  const hoodChips = goodHoods.length ? `<div class="hm-where"><div class="hm-hood" role="group" aria-label="Neighbourhood">${goodHoods.map(([h, n]) => `<button type="button" class="hm-h" data-hood="${esc(h)}" aria-pressed="false">${esc(h)} · ${n}</button>`).join('')}</div></div>` : '';
  const data = JSON.stringify({ today });

  return `<section class="hm" data-today="${today}"><p class="hm-kick">${DOW[x.getUTCDay()]} ${x.getUTCDate()} ${MON[x.getUTCMonth()]} · Lisbon</p>
<h1>What are you <em>looking for?</em></h1>
<div class="hm-roles" role="group" aria-label="What are you looking for?">${roleChips}</div>
${nowStrip(events, esc, { eventPath, hasPage }, now, { isLisbon: (e) => inLisbon(e) && !isOnline(e) })}
${hoodChips}
<!-- the map of Lisbon with a dot per event goes here (D28, design.3) -->
<div class="hm-sec" role="heading" aria-level="2" id="today">In Lisbon today<small id="hm-count">${inCity.length} events</small></div>
<ul class="hm-grid" id="hm-list">${live.map(card).join('')}${past.length ? `</ul><button type="button" class="hm-more" id="hm-past-b">Earlier today: ${past.length} already over. Show</button><ul class="hm-grid" id="hm-past" hidden>${past.map(card).join('')}` : ''}</ul>
<p class="hm-empty" id="hm-none" hidden>Nothing matches that right now. Try Everything, or look at <a href="/programme/">the whole programme</a>.</p>
${online.length ? `<div class="hm-sec" role="heading" aria-level="2" id="online">Online today<small>${online.length} events, no travel</small></div><ul class="hm-grid" id="hm-online">${online.map(card).join('')}</ul>` : ''}
<p class="hm-foot">Roles are our reading of each event&rsquo;s topics, not the organiser&rsquo;s claim; nothing is stored about you. Tomorrow and the rest of the week are on <a href="/programme/">the programme</a>.${away ? ` ${away} event${away === 1 ? '' : 's'} today ${away === 1 ? 'is' : 'are'} outside Lisbon and not shown here.` : ''} Missing something? <a href="/join/">Tell us</a>.</p>
</section>
<script>(function(){try{var R='all',W='',H='',cards=[].slice.call(document.querySelectorAll('.hm-c'));
function st(c,n){var s=+c.dataset.s,e=+c.dataset.e;return n>=e?'past':n>=s?'now':'next'}
function tick(){var n=Date.now(),N=0,X=0,T=0,eve=new Date(new Date(n).toISOString().slice(0,10)+'T18:00:00Z').getTime();
cards.forEach(function(c){if(c.classList.contains('x'))return;var s=+c.dataset.s,e=+c.dataset.e,k=st(c,n);if(c.closest('#hm-online'))return;if(k==='now')N++;if(s>n&&s<=n+36e5)X++;if(e>=eve)T++;
var b=c.querySelector('.hm-tag.now');if(b)b.hidden=k!=='now';c.classList.toggle('past',k==='past')});
apply()}
function apply(){var n=Date.now(),eve=new Date(new Date(n).toISOString().slice(0,10)+'T18:00:00Z').getTime(),shown=0,all=document.querySelectorAll('#hm-list .hm-c,#hm-past .hm-c');
cards.forEach(function(c){var ok=(R==='all'||c.dataset.r.split(' ').indexOf(R)>-1)&&(!H||c.dataset.h===H);var s=+c.dataset.s,e=+c.dataset.e;
if(W==='now')ok=ok&&n>=s&&n<e;if(W==='hour')ok=ok&&s>n&&s<=n+36e5;if(W==='tonight')ok=ok&&e>=eve;c.hidden=!ok;if(ok&&!c.closest('#hm-online'))shown++});
var p=document.getElementById('hm-past'),pb=document.getElementById('hm-past-b');if(p&&(R!=='all'||W||H)){p.hidden=false;if(pb)pb.hidden=true}
document.getElementById('hm-count').textContent=shown+(shown===1?' event':' events');document.getElementById('hm-none').hidden=shown>0}
function bind(sel,attr,set){[].slice.call(document.querySelectorAll(sel)).forEach(function(b){b.addEventListener('click',function(){var v=b.dataset[attr],on=b.getAttribute('aria-pressed')==='true';
[].slice.call(document.querySelectorAll(sel)).forEach(function(o){o.setAttribute('aria-pressed','false')});
if(attr==='role'){set(v);document.querySelector('[data-role="'+v+'"]').setAttribute('aria-pressed','true')}else{set(on?'':v);if(!on)b.setAttribute('aria-pressed','true')}apply()})})}
bind('.hm-chip','role',function(v){R=v});bind('.hm-h','hood',function(v){H=v});
var pb=document.getElementById('hm-past-b');if(pb)pb.addEventListener('click',function(){document.getElementById('hm-past').hidden=false;pb.remove()});
tick();setInterval(tick,60000)}catch(x){}})();</script>`;
}
