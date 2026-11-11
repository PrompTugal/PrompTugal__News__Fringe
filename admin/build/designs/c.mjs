// Design C, "the city" (D26, brief 11; design.3.fringe@PrompTugal.dinis): by neighbourhood and online, a map-first view of where to go.
// Contract (same as design A): `design` and `render(ctx)` -> { css, body } for the home page's <main> (the frame adds the
// PT.news header, the independence line, the footer and the live ticker). ctx = { events, esc, eventPath, hasPage, now (Date) }.
// No tiles, no third-party map: a schematic of Lisbon drawn in SVG from public neighbourhood names. Not to scale; it says so.
// Every number comes from data/events.json. Without JavaScript the whole week is one time-ordered list with each event's area written out.
import { eventPath, hasPage } from '../event-pages.mjs';
import { STATUS } from '../cards.mjs';
import { denseRow, sizeOf } from '../tiers.mjs';

export const design = {
  id: 'c', name: 'The city', maker: 'design.3.fringe@PrompTugal.dinis', tool: 'Claude Code (Sonnet), SVG and a little JavaScript',
  why: 'Most people choose where first and what second: from their hotel, the venue they are already at, or the river. A schematic map of Lisbon with a bubble for every neighbourhood tells you in one glance where the evening is, and one tap lists it.',
};

// Neighbourhood centres, as public place names (lon, lat). Approximate: used only to place bubbles on a schematic.
const AREAS = {
  'Parque das Nações': [-9.094, 38.768], 'Moscavide': [-9.103, 38.775], 'Beato': [-9.1105, 38.7226], 'Anjos': [-9.1347, 38.7253], 'Penha de França': [-9.1294, 38.7283],
  'Martim Moniz': [-9.136, 38.7165], 'Castelo / Mouraria': [-9.1335, 38.7139], 'Alfama': [-9.1285, 38.7118], 'Baixa': [-9.1375, 38.7105], 'Bica / Chiado': [-9.1435, 38.7096],
  'Cais do Sodré': [-9.1448, 38.7060], 'Santos': [-9.153, 38.7075], 'Alcântara': [-9.1779, 38.7036], 'Belém': [-9.193, 38.6967], 'Rato': [-9.1545, 38.7195],
  'Marquês / Avenidas': [-9.1495, 38.7255], 'Saldanha': [-9.1456, 38.7339], 'Picoas': [-9.1485, 38.7310],
};
const FAR = ['Estoril', 'Sintra', 'Cascais', 'Santarém', 'Covilhã', 'Mértola'];
const RULES = [
  [/parque das na[cç][oõ]es|alameda dos oceanos|cais das naus|dom jo[aã]o ii\b|meo arena|bojador|oriente\b/i, 'Parque das Nações'], [/moscavide/i, 'Moscavide'],
  [/beato|infante dom henrique|unicorn factory|tv\. grilo/i, 'Beato'], [/ptw palace|palácio ptw|gomes freire|\banjos\b|almirante reis|alm\. reis/i, 'Anjos'],
  [/penha de fran[cç]a|neves ferreira/i, 'Penha de França'], [/martim moniz/i, 'Martim Moniz'], [/castelo|mouraria|tancos/i, 'Castelo / Mouraria'], [/alfama/i, 'Alfama'],
  [/baixa|rua do com[eé]rcio|pra[cç]a do com[eé]rcio/i, 'Baixa'], [/bica|chiado|nova do carvalho/i, 'Bica / Chiado'],
  [/cais do sodr[eé]|24 de julho|dom lu[ií]s i|palmeira|tej[aá] house/i, 'Cais do Sodré'], [/casa do impacto|santos|s[aã]o bento|marqu[eê]s de abrantes/i, 'Santos'],
  [/alc[aâ]ntara|lx factory/i, 'Alcântara'], [/bel[eé]m|maat/i, 'Belém'], [/\brato\b|campo de ourique/i, 'Rato'],
  [/marqu[eê]s de pombal|duque de loul[eé]|avenidas novas|5 de outubro/i, 'Marquês / Avenidas'], [/saldanha|pedro nunes/i, 'Saldanha'], [/picoas|sousa martins/i, 'Picoas'],
];
const FARRE = new RegExp(`\\b(${FAR.join('|')})\\b`, 'i');
export const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// One group per event: a named neighbourhood, Online, Beyond the map (another town), or "Address with guests" when the page does not say.
export function groupOf(e) {
  const p = String(e.place || '');
  if (/^online\b/i.test(p) || e.status === 'online') return 'Online';
  const m = p.match(/\(([^()]+)\)\s*$/);
  const text = (m ? m[1] + ' ' : '') + p;
  const far = text.match(FARRE); if (far) return 'Beyond the map';
  for (const [re, name] of RULES) if (re.test(text)) return name;
  return 'Address with guests';
}

// Spread overlapping bubbles apart while keeping them near their true place (deterministic).
function layout(nodes, W, H) {
  for (let it = 0; it < 120; it++) for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j]; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + 3;
    if (d < min) { const k = (min - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
  }
  for (const n of nodes) { n.x = Math.min(W - n.r - 2, Math.max(n.r + 2, n.x)); n.y = Math.min(H - n.r - 2, Math.max(n.r + 2, n.y)); }
  return nodes;
}

const BOUNDS = { x0: -9.2, x1: -9.07, y0: 38.69, y1: 38.785 }, W = 400, H = 380;
const px = ([lon, lat]) => [((lon - BOUNDS.x0) / (BOUNDS.x1 - BOUNDS.x0)) * W, ((BOUNDS.y1 - lat) / (BOUNDS.y1 - BOUNDS.y0)) * H];
const SHORE = [[-9.2, 38.693], [-9.18, 38.697], [-9.15, 38.703], [-9.14, 38.7055], [-9.125, 38.708], [-9.11, 38.715], [-9.1, 38.735], [-9.085, 38.76], [-9.07, 38.777]];

export const css = `
.cy h1.sr{position:absolute;left:-9999px}
.cy .kick{font:500 .72rem/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--green,var(--accent));margin:14px 0 4px}
.cy .lead{font:600 1.35rem/1.2 var(--serif);margin:0 0 8px}.cy .lead i{color:var(--green,var(--accent))}
.cy-days{display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px;margin:0}
.cy-chip{flex:none;min-height:44px;display:inline-flex;align-items:center;gap:6px;padding:0 13px;border-radius:99px;border:1.5px solid var(--hair);background:var(--panel);color:var(--ink,var(--fg));font:inherit;font-size:.9rem;cursor:pointer}
.cy-chip b{font:600 .8rem var(--mono);color:var(--ink-3)}.cy-chip[aria-pressed=true]{background:var(--green,var(--accent));border-color:var(--green,var(--accent));color:var(--paper,var(--bg))}.cy-chip[aria-pressed=true] b{color:inherit}
.cy{max-width:var(--page,720px);margin:0 auto;padding:0 var(--gutter,16px)}.cy-map{display:block;width:100%;max-width:560px;margin-left:auto;margin-right:auto;height:auto;margin:4px 0;border:1px solid var(--hair);border-radius:12px;background:var(--paper-2,var(--card))}
.cy-water{fill:var(--river-soft,#dfe8f2);stroke:var(--river,#1f4fa8);stroke-width:1;opacity:.9}.cy-tag{font:italic 13px var(--serif);fill:var(--river,#1f4fa8);opacity:.8}
.cy-node{cursor:pointer}.cy-node circle{fill:var(--panel);stroke:var(--green,var(--accent));stroke-width:1.6;transition:fill .15s}
.cy-node text{font:600 12px var(--mono);fill:var(--ink);text-anchor:middle;pointer-events:none}.cy-nm{display:none;font:600 10.5px var(--sans);fill:var(--ink-2);text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:var(--paper-2,#fff);stroke-width:3px}.cy-nm.show,.cy-nm.sel{display:block}
.cy-node[aria-pressed=true] circle{fill:var(--green,var(--accent))}.cy-node[aria-pressed=true] text:not(.nm){fill:var(--paper,#fff)}
.cy-node.zero{opacity:.35}.cy-node:focus-visible circle{stroke:var(--focus,#1f4fa8);stroke-width:3}
.cy-node.on circle{animation:cyp 2s ease-out infinite}@keyframes cyp{0%{stroke-width:1.6}50%{stroke-width:5}100%{stroke-width:1.6}}
@media (prefers-reduced-motion:reduce){.cy-node.on circle{animation:none;stroke-width:4}}
.cy-note{font:.72rem/1.4 var(--mono);color:var(--ink-3);margin:2px 0 8px}
.cy-zones{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.cy-head{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--rule-green,var(--rule));margin-top:14px;padding-top:6px}
.cy-head h2{margin:0;padding:0;border:0;font:600 1.15rem var(--serif)}.cy-head span{font:.78rem var(--mono);color:var(--ink-3)}
.cy-list{margin-top:4px}.cy-list .row[hidden]{display:none}.cy-empty{padding:14px;border:1.5px dashed var(--hair);border-radius:10px}`;

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = (d) => { const x = new Date(d + 'T00:00:00Z'); return `${DAY[x.getUTCDay()]} ${x.getUTCDate()} ${MON[x.getUTCMonth()]}`; };

export function render({ events, esc }) {
  const list = events.filter((e) => e.start || e.date).sort((a, b) => String(a.start || a.date).localeCompare(String(b.start || b.date)));
  const days = [...new Set(list.map((e) => e.date))].sort();
  const g = new Map(); for (const e of list) { const k = groupOf(e); g.set(k, (g.get(k) || 0) + 1); }
  const named = [...g.keys()].filter((k) => AREAS[k]);
  const nodes = layout(named.map((k) => { const [x, y] = px(AREAS[k]); return { k, x, y, r: Math.min(24, 12 + 2.4 * Math.sqrt(g.get(k))) }; }), W, H);
  const water = `<polygon class="cy-water" points="${SHORE.map((p) => px(p).map((v) => v.toFixed(1)).join(',')).join(' ')} ${W},${H} 0,${H}"/>`;
  const svg = `<svg class="cy-map" viewBox="0 0 ${W} ${H}" role="group" aria-label="Schematic map of Lisbon by neighbourhood; not to scale">${water}<text class="cy-tag" x="${W * 0.7}" y="${H * 0.86}">Rio Tejo</text>
${nodes.map((n) => `<g class="cy-node" data-g="${esc(slug(n.k))}" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(n.k)}"><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}"/><text x="${n.x.toFixed(1)}" y="${(n.y + 4).toFixed(1)}" class="ct">${g.get(n.k)}</text></g>`).join('')}
${nodes.map((n) => `<text class="cy-nm${g.get(n.k) >= 3 ? ' show' : ''}" data-g="${esc(slug(n.k))}" x="${n.x.toFixed(1)}" y="${(n.y + n.r + 11).toFixed(1)}">${esc(n.k)}</text>`).join('')}</svg>`;
  const zones = ['Online', 'Beyond the map', 'Address with guests'].filter((k) => g.has(k)).map((k) => `<button type="button" class="cy-chip" data-g="${esc(slug(k))}" aria-pressed="false">${esc(k)} <b>${g.get(k)}</b></button>`).join('');
  const rows = list.map((e) => denseRow(e, { esc }, ` data-g="${esc(slug(groupOf(e)))}" data-d="${esc(e.date)}" data-s="${Date.parse(e.start) || ''}" data-e="${Date.parse(e.end) || ''}"`, groupOf(e) === 'Address with guests' ? '' : (groupOf(e) === 'Online' ? '' : groupOf(e)), true)).join('');
  const chips = [`<button type="button" class="cy-chip" data-d="" aria-pressed="true">All week <b>${list.length}</b></button>`, ...days.map((d) => `<button type="button" class="cy-chip" data-d="${esc(d)}" aria-pressed="false">${esc(dayLabel(d))} <b>${list.filter((e) => e.date === d).length}</b></button>`)].join('');
  const mapped = list.filter((e) => AREAS[groupOf(e)]).length;
  const script = `<script>(function(){try{var f={g:'',d:''},rows=[].slice.call(document.querySelectorAll('.cy-list .row')),nodes=[].slice.call(document.querySelectorAll('.cy-node')),dc=[].slice.call(document.querySelectorAll('.cy-chip[data-d]')),zc=[].slice.call(document.querySelectorAll('.cy-zones .cy-chip')),now=Date.now();
function tog(el,v){el.setAttribute('aria-pressed',v)}
function run(){var cnt={},live={},n=0;rows.forEach(function(r){var d=r.dataset,okd=!f.d||d.d===f.d;if(okd){cnt[d.g]=(cnt[d.g]||0)+1;if(+d.s<=now&&(!d.e||+d.e>now))live[d.g]=1}var ok=okd&&(!f.g||d.g===f.g);r.hidden=!ok;if(ok)n++});
[].slice.call(document.querySelectorAll('.cy-nm')).forEach(function(l){l.classList.toggle('sel',f.g===l.dataset.g)});nodes.forEach(function(x){var k=x.dataset.g,c=cnt[k]||0;x.querySelector('.ct').textContent=c;x.classList.toggle('zero',!c);x.classList.toggle('on',!!live[k]);tog(x,f.g===k)});
zc.forEach(function(z){tog(z,f.g===z.dataset.g);z.querySelector('b').textContent=cnt[z.dataset.g]||0});
dc.forEach(function(c){tog(c,f.d===c.dataset.d)});
var t=document.getElementById('cy-title'),sel=nodes.concat(zc).filter(function(x){return f.g&&x.dataset.g===f.g})[0];
t.textContent=sel?(sel.getAttribute('aria-label')||sel.textContent.replace(/\\d+$/,'').trim()):'All of Lisbon';document.getElementById('cy-count').textContent=n+' event'+(n===1?'':'s');document.getElementById('cy-empty').hidden=n>0}
function pickG(k){f.g=f.g===k?'':k;run()}
nodes.forEach(function(x){x.addEventListener('click',function(){pickG(x.dataset.g)});x.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pickG(x.dataset.g)}})});
zc.forEach(function(z){z.addEventListener('click',function(){pickG(z.dataset.g)})});
dc.forEach(function(c){c.addEventListener('click',function(){f.d=c.dataset.d;run()})});
var d0=new Date(now).toISOString().slice(0,10),b=dc.filter(function(c){return c.dataset.d===d0})[0];if(b){f.d=d0}run()}catch(e){}})();</script>`;
  const body = `<div class="cy"><h1 class="sr">Lisbon Tech Fringe: the city</h1>
<div class="kick">01 · The city</div><p class="lead">Where is it happening? <i>Tap a neighbourhood.</i></p>
<div class="cy-days" role="group" aria-label="Day">${chips}</div>
${svg}
<p class="cy-note">Schematic of Lisbon, not to scale. ${mapped} of ${list.length} events name a neighbourhood the page can place; the rest are online, outside Lisbon, or have an address shared only with guests.</p>
<div class="cy-zones" role="group" aria-label="Online and other places">${zones}</div>
<div class="cy-head"><h2 id="cy-title">All of Lisbon</h2><span id="cy-count">${list.length} events</span></div>
<ul class="dense cy-list">${rows}</ul><p class="cy-empty" id="cy-empty" hidden>Nothing here on this day. Try another day or "All week".</p></div>${script}`;
  return { css, body };
}
