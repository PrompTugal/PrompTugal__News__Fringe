// The city map: a dot per event on a schematic of Lisbon, grouped by neighbourhood (D28, brief 13; design.3.fringe@PrompTugal.dinis).
// A drop-in for the home page (design.1 leads D28):
//
//   import { cityMap } from './city-map.mjs';
//   const m = cityMap({ events, esc, eventPath, hasPage, date: today, now: new Date(BUILT) });
//   page(..., `<style>${m.css}</style>` + m.html + m.js)
//
// - Only events on `date` (default: the date of `now`). Online events, events outside Lisbon and events whose address is shared only
//   with guests are NOT drawn; the note under the map counts them, so nothing is hidden and nothing is invented.
// - A dot is a real link to the event's page (works without JavaScript). With JavaScript a tap opens a small card first.
// - Events (on window): the map fires `citymap:select` {detail:{id}}; it listens to `citymap:filter` {detail:{ids:[...]|null}} to show only
//   those events (the "what are you looking for" roles). If an element with id `ev-<event id>` exists, a tap scrolls to it.
// - Dots: green = on, amber = moved, hollow grey = cancelled, hollow = unknown; a bigger dot with a ring = a major event;
//   a soft halo (reader's clock) = on now; the map itself does not animate. Neighbourhood centres are approximate; the map says it is schematic and not to scale.
import { AREAS, areaOf, slug } from './lisbon-areas.mjs';
import { timeRange } from './cards.mjs';
import { sizeOf } from './tiers.mjs';

const BOUNDS = { x0: -9.2, x1: -9.07, y0: 38.69, y1: 38.785 }, W = 400, H = 380;
const px = ([lon, lat]) => [((lon - BOUNDS.x0) / (BOUNDS.x1 - BOUNDS.x0)) * W, ((BOUNDS.y1 - lat) / (BOUNDS.y1 - BOUNDS.y0)) * H];
const SHORE = [[-9.2, 38.693], [-9.18, 38.697], [-9.15, 38.703], [-9.14, 38.7055], [-9.125, 38.708], [-9.11, 38.715], [-9.1, 38.735], [-9.085, 38.76], [-9.07, 38.777]];

export const cityMapCss = `
.cm{margin:8px 0}.cm-svg{display:block;width:100%;max-width:560px;height:auto;margin:0 auto;border:1px solid var(--hair);border-radius:12px;background:var(--paper-2,var(--card))}
.cm-water{fill:var(--river-soft,#dfe8f2);stroke:var(--river,#1f4fa8);stroke-width:1;opacity:.9}.cm-tag{font:italic 13px var(--serif);fill:var(--river,#1f4fa8);opacity:.8}
.cm-lab{font:600 10px var(--sans);fill:var(--ink-2);text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:var(--paper-2,#fff);stroke-width:3px}
.cm-dot circle.d{fill:var(--green,#006600);stroke:var(--panel,#fff);stroke-width:1.5}.cm-dot .hit{fill:transparent}
.cm-dot.moved circle.d{fill:var(--warn,#8a5200)}.cm-dot.cancelled circle.d{fill:var(--paper-2,#fff);stroke:var(--ink-3);stroke-width:1.5}.cm-dot.unknown circle.d{fill:var(--paper-2,#fff);stroke:var(--green,#006600);stroke-width:1.8}
.cm-dot.major circle.ring{fill:none;stroke:var(--green,#006600);stroke-width:1.2}
.cm-dot circle.pl{display:none}.cm-dot.on circle.pl{display:block;fill:var(--green,#006600);opacity:.16;r:9}
.cm-dot[hidden],.cm-dot.off{display:none}.cm-dot:focus-visible .d,.cm-dot.sel .d{stroke:var(--focus,#1f4fa8);stroke-width:3}
.cm-note{font:.72rem/1.45 var(--mono);color:var(--ink-3);margin:4px 0}
.cm-pop{margin:6px 0;padding:10px 12px;border:1px solid var(--hair);border-left:4px solid var(--green,#006600);border-radius:10px;background:var(--panel)}.cm-pop[hidden]{display:none}
.cm-pop b{display:block;font-weight:700;line-height:1.3}.cm-pop .m{font:.78rem/1.4 var(--mono);color:var(--ink-3);margin:2px 0 6px}.cm-pop a{font-weight:600}`;

function spiral(n, cx, cy, step) { // golden-angle spiral: a tidy cluster of n dots around (cx, cy)
  return Array.from({ length: n }, (_, i) => { const r = step * Math.sqrt(i + 0.35), a = i * 2.39996; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
}
function relax(nodes) {
  for (let it = 0; it < 160; it++) for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + 4;
    if (d < min) { const k = (min - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
  }
  for (const n of nodes) { n.x = Math.min(W - n.r - 2, Math.max(n.r + 2, n.x)); n.y = Math.min(H - n.r - 14, Math.max(n.r + 2, n.y)); }
}

export function cityMap({ events, esc, eventPath, hasPage, date, now = new Date() }) {
  const day = date || now.toISOString().slice(0, 10);
  const today = events.filter((e) => e.date === day);
  const by = new Map(), other = { online: 0, far: 0, guests: 0 };
  for (const e of today) {
    const a = areaOf(e);
    if (AREAS[a]) (by.get(a) || by.set(a, []).get(a)).push(e);
    else if (a === 'Online') other.online++; else if (a === 'Beyond the map') other.far++; else other.guests++;
  }
  const STEP = 8.4;
  const nodes = [...by.entries()].map(([k, list]) => { const [x, y] = px(AREAS[k]); return { k, list, x, y, r: STEP * Math.sqrt(list.length + 0.35) + 5 }; });
  relax(nodes);
  const water = `<polygon class="cm-water" points="${SHORE.map((p) => px(p).map((v) => v.toFixed(1)).join(',')).join(' ')} ${W},${H} 0,${H}"/>`;
  const dots = nodes.flatMap((n) => {
    const pts = spiral(n.list.length, n.x, n.y, STEP);
    return n.list.sort((a, b) => String(a.start).localeCompare(String(b.start))).map((e, i) => {
      const [x, y] = pts[i], st = ['moved', 'cancelled', 'unknown'].includes(e.status) ? e.status : 'on', major = sizeOf(e) === 'major';
      const href = hasPage(e) ? eventPath(e) : e.url;
      return `<a class="cm-dot ${st}${major ? ' major' : ''}" href="${esc(href)}" data-id="${esc(e.id || '')}" data-s="${Date.parse(e.start) || ''}" data-e="${Date.parse(e.end) || ''}" data-n="${esc(e.name)}" data-w="${esc(timeRange(e))}" data-a="${esc(n.k)}" data-o="${esc(String(e.organiser || '').replace(/\s*\((per|from|on|as|a)\b[^)]*\)\s*/gi, ' ').trim())}" aria-label="${esc(e.name)}, ${esc(timeRange(e))}, ${esc(n.k)}"><circle class="hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11"/><circle class="pl" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>${major ? `<circle class="ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5"/>` : ''}<circle class="d" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${major ? 6 : 5}"/></a>`;
    });
  }).join('');
  const labels = nodes.filter((n) => n.list.length >= 2).map((n) => `<text class="cm-lab" x="${n.x.toFixed(1)}" y="${(n.y + n.r + 9).toFixed(1)}">${esc(n.k)}</text>`).join('');
  const drawn = nodes.reduce((s, n) => s + n.list.length, 0);
  const notes = [other.online && `${other.online} online`, other.guests && `${other.guests} with an address shared only with guests`, other.far && `${other.far} outside Lisbon`].filter(Boolean).join(' · ');
  const html = `<section class="cm" id="citymap" data-date="${esc(day)}"><svg class="cm-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="Schematic map of Lisbon: one dot per event today, by neighbourhood. Not to scale.">${water}<text class="cm-tag" x="${W * 0.7}" y="${H * 0.86}">Rio Tejo</text>${labels}${dots}</svg>
<div class="cm-pop" hidden role="status"></div>
<p class="cm-note"><span id="cm-n">${drawn}</span> events on the map${notes ? `; not on the map: ${esc(notes)}` : ''}. Schematic, not to scale; neighbourhood positions are approximate.</p></section>`;
  const js = `<script>(function(){try{var m=document.getElementById('citymap');if(!m)return;var dots=[].slice.call(m.querySelectorAll('.cm-dot')),pop=m.querySelector('.cm-pop'),now=Date.now();
dots.forEach(function(d){var s=+d.dataset.s,e=+d.dataset.e;if(s&&s<=now&&(!e||e>now))d.classList.add('on')});
function show(d){dots.forEach(function(x){x.classList.toggle('sel',x===d)});pop.textContent='';var b=document.createElement('b'),mm=document.createElement('div'),a=document.createElement('a');b.textContent=d.dataset.n;mm.className='m';mm.textContent=d.dataset.w+' Lisbon · '+d.dataset.a+(d.dataset.o?' · '+d.dataset.o:'');a.href=d.getAttribute('href');a.textContent='Open the event';pop.appendChild(b);pop.appendChild(mm);pop.appendChild(a);pop.hidden=false}
dots.forEach(function(d){d.addEventListener('click',function(e){e.preventDefault();show(d);var id=d.dataset.id;window.dispatchEvent(new CustomEvent('citymap:select',{detail:{id:id}}));var t=id&&document.getElementById('ev-'+id);if(t){t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'})}})});
window.addEventListener('citymap:filter',function(e){var ids=e.detail&&e.detail.ids,n=0;dots.forEach(function(d){var ok=!ids||ids.indexOf(d.dataset.id)>-1;d.classList.toggle('off',!ok);if(ok)n++});document.getElementById('cm-n').textContent=n;pop.hidden=true})}catch(e){}})();</script>`;
  return { css: cityMapCss, html, js, counts: { drawn, ...other } };
}
