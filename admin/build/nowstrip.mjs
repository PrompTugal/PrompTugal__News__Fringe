// The "Now · next hour · tonight" strip (D28, design.2.fringe@PrompTugal.dinis, for design.1's home page; brief 13:
// "very focused on now ... what's happening in the next hour, the next couple of bits, or even tonight").
// Three panels, three events each, today only. Desktop: three columns. Phone: three tabs, one panel at a time.
// Without JavaScript: the three panels stack, correct for the build time. With JavaScript it follows the reader's clock
// every 30 seconds (the same drawing function runs on the server and in the browser).
//
//   import { nowStrip, NOWSTRIP_CSS } from './nowstrip.mjs';
//   const strip = nowStrip(events, esc, { eventPath, hasPage }, new Date(BUILT), { isLisbon: (e) => e.lisbon !== false });
//   // put `strip` (HTML, with its own script) where the strip goes, and NOWSTRIP_CSS in the page's CSS.
// Options: isLisbon(e) -> boolean (default: true unless the event says lisbon === false, work/44); perPanel (3);
//          tonightFrom ('18:00' UTC, which is Lisbon time in November); links { now, next, tonight } (the "see all" targets).
import { span } from './now.mjs';
import { placeShort } from './cards.mjs';

const H = 3600000;

// ---- shared with the browser (no imports, single-quoted attributes) ----------------------------------------------
// D: { items: [{h, n, p, s, e, st, z, l}], from: 'HH:MM', per: n }   s/e in ms, z = anchor event, l = online
function nsEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function nsItem(i, now, mode) {
  var hm = function (t) { return new Date(t).toISOString().slice(11, 16); };
  var dn = function (t) { var d = new Date(t); return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()] + ' ' + d.getUTCDate(); };
  var multi = new Date(i.s).toISOString().slice(0, 10) !== new Date(i.e).toISOString().slice(0, 10);
  var when = hm(i.s), until = mode === 'now' ? 'until ' + (multi ? dn(i.e) + ' ' : '') + hm(i.e) + ' \u00b7 ' : '';
  var chip = i.st === 'moved' ? ' <span class=\'ns-chip\'>Moved</span>' : (i.st === 'unknown' ? ' <span class=\'ns-chip ns-dash\'>Unconfirmed</span>' : '');
  return '<li class=\'ns-i\'><span class=\'ns-t\'>' + when + '</span><div class=\'ns-c\'><a class=\'ns-n\' href=\'' + nsEsc(i.h) + '\'>' + nsEsc(i.n) + '</a>'
    + '<div class=\'ns-m\'>' + until + (i.l ? 'Online' : nsEsc(i.p)) + chip + '</div></div></li>';
}
function nsRender(D, now) {
  var items = D.items.filter(function (i) { return i.st !== 'cancelled'; }), per = D.per || 3;
  var day = new Date(now).toISOString().slice(0, 10), tonightS = Date.parse(day + 'T' + D.from + ':00Z'), endOfDay = Date.parse(day + 'T00:00:00Z') + 24 * 3600000;
  var byTier = function (a, b) { return (b.z - a.z) || (a.s - b.s); };
  var live = items.filter(function (i) { return i.s <= now && i.e > now && i.st !== 'unknown'; }).sort(byTier);
  var nextH = items.filter(function (i) { return i.s > now && i.s <= now + 3600000; }).sort(function (a, b) { return a.s - b.s; });
  var tonight = items.filter(function (i) { return i.s >= Math.max(tonightS, now) && i.s < endOfDay; }).sort(byTier);
  var panel = function (list, mode, empty) {
    return (list.length ? '<ul class=\'ns-l\'>' + list.slice(0, per).map(function (i) { return nsItem(i, now, mode); }).join('') + '</ul>' : '<p class=\'ns-none\'>' + empty + '</p>');
  };
  return {
    now: { n: live.length, html: panel(live, 'now', 'Nothing checked is on at this minute.') },
    next: { n: nextH.length, html: panel(nextH, 'next', 'Nothing starts in the next hour. See tonight.') },
    tonight: { n: tonight.length, html: panel(tonight, 'tonight', 'Nothing checked for tonight yet.') },
    clock: new Date(now).toISOString().slice(11, 16),
  };
}

// ---- server side ------------------------------------------------------------------------------------------------
export const NOWSTRIP_CSS = `
.ns{margin:12px 0 18px}
.ns-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 0 6px}
.ns-head h2{margin:0;font-size:1.15rem}.ns-clk{font:400 .875rem var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64)}
.ns-tabs{display:none}
.ns-grid{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
.ns-p{border-top:2px solid var(--ink,#121317);padding-top:6px}
.ns-p h3{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 4px;font:600 1.05rem/1.2 var(--serif,Georgia,serif)}
.ns-p h3 span{font:400 .875rem var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64)}
.ns-p.ns-now{border-top-color:var(--red,#c52830)}.ns-p.ns-now h3{color:var(--red,#c52830)}
.ns-l{list-style:none;margin:0;padding:0}
.ns-i{display:grid;grid-template-columns:3.4em minmax(0,1fr);column-gap:8px;padding:6px 0;border-bottom:1px solid var(--hair,#d9d2c1);position:relative}
.ns-i:last-child{border-bottom:0}
.ns-t{font:600 .9rem var(--mono,ui-monospace,Menlo,monospace);padding-top:2px;white-space:nowrap}
.ns-n{display:block;font:600 1rem/1.3 var(--serif,Georgia,serif);color:var(--ink,#121317);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ns-n::after{content:"";position:absolute;inset:0}
.ns-n:hover,.ns-n:focus-visible{text-decoration:underline;text-decoration-color:var(--green,#006600);text-underline-offset:3px}
.ns-m{font:400 .875rem/1.4 var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ns-chip{font:600 .8125rem var(--mono,ui-monospace,Menlo,monospace);text-transform:uppercase;letter-spacing:.06em;color:var(--warn,#8a5200);border:1px solid currentColor;padding:0 5px;border-radius:2px;margin-left:4px}.ns-dash{color:var(--ink-3,#595c64);border-style:dashed}
.ns-none{margin:4px 0 0;color:var(--ink-3,#595c64)}
.ns-all{display:inline-flex;align-items:center;min-height:44px;font:500 .9rem var(--mono,ui-monospace,Menlo,monospace);color:var(--cobalt,#1f4fa8)}
@media (min-width:700px){.ns-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}}
@media (max-width:699px){
  .ns.ns-js .ns-tabs{display:flex;gap:6px;margin:0 0 8px}
  .ns.ns-js .ns-tabs button{flex:1;min-height:44px;font:600 .9rem var(--sans,system-ui,sans-serif);border:2px solid var(--green,#006600);background:transparent;color:var(--green,#006600);border-radius:2px;cursor:pointer}
  .ns.ns-js .ns-tabs button[aria-selected="true"]{background:var(--green,#006600);color:var(--paper,#f6f3ec)}
  .ns.ns-js .ns-p{display:none;border-top:0}.ns.ns-js .ns-p.ns-on{display:block}.ns.ns-js .ns-p h3{display:none}
}`;

export function nowStrip(events, esc, { eventPath, hasPage }, at, { isLisbon = (e) => e.lisbon !== false, perPanel = 3, tonightFrom = '18:00', links = {} } = {}) {
  const now = at.getTime();
  const day = at.toISOString().slice(0, 10);
  const items = [];
  for (const e of events) {
    const sp = span(e);
    if (!sp || !isLisbon(e) || e.status === 'cancelled') continue;
    if (sp.s >= Date.parse(day + 'T00:00:00Z') + 24 * H || sp.e <= now) continue;   // today only: starts today and is not over yet (an overnight event still on counts)
    items.push({ h: hasPage(e) ? eventPath(e) : e.url, n: e.name, p: placeShort(e), s: sp.s, e: sp.e, st: e.status || 'unknown', z: 0, l: /^online\b/i.test(e.place || '') || e.status === 'online' ? 1 : 0 });
  }
  const D = { items, from: tonightFrom, per: perPanel };
  const r = nsRender(D, now);
  const lk = { now: '/now/', next: '/now/', tonight: '#tonight', ...links };
  const panel = (id, title, p, on) => `<section class="ns-p ns-${id}${on ? ' ns-on' : ''}" id="ns-${id}" role="tabpanel" aria-labelledby="ns-tab-${id}"><h3>${title} <span class="ns-count" data-c="${id}">${p.n}</span></h3><div class="ns-body" data-b="${id}">${p.html}</div><a class="ns-all" href="${esc(lk[id])}">See all &rarr;</a></section>`;
  const script = `(function(){try{var nsEsc=${nsEsc.toString()},nsItem=${nsItem.toString()},nsRender=${nsRender.toString()};
var root=document.getElementById('ns');if(!root)return;var D=JSON.parse(document.getElementById('ns-data').textContent);root.classList.add('ns-js');
var tabs=[].slice.call(root.querySelectorAll('.ns-tabs button'));
function show(id){tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.t===id?'true':'false')});[].slice.call(root.querySelectorAll('.ns-p')).forEach(function(p){p.classList.toggle('ns-on',p.id==='ns-'+id)})}
tabs.forEach(function(b){b.addEventListener('click',function(){show(b.dataset.t)})});
function run(){var r=nsRender(D,Date.now());['now','next','tonight'].forEach(function(k){root.querySelector('[data-b="'+k+'"]').innerHTML=r[k].html;root.querySelector('[data-c="'+k+'"]').textContent=r[k].n;var t=root.querySelector('#ns-tab-'+k+' span');if(t)t.textContent=r[k].n});root.querySelector('.ns-clk').textContent=r.clock+' UTC'}
run();setInterval(run,30000)}catch(e){}})();`;
  const tab = (id, label, on) => `<button type="button" role="tab" id="ns-tab-${id}" data-t="${id}" aria-selected="${on ? 'true' : 'false'}" aria-controls="ns-${id}">${label} <span>${r[id].n}</span></button>`;
  return `<section class="ns" id="ns" aria-label="Now, next hour and tonight"><div class="ns-head"><h2>Now, next hour, tonight</h2><span class="ns-clk">${r.clock} UTC</span></div>
<div class="ns-tabs" role="tablist">${tab('now', 'Now', true)}${tab('next', 'Next hour', false)}${tab('tonight', 'Tonight', false)}</div>
<div class="ns-grid">${panel('now', 'Now', r.now, true)}${panel('next', 'Next hour', r.next, false)}${panel('tonight', 'Tonight', r.tonight, false)}</div>
<script type="application/json" id="ns-data">${JSON.stringify(D).replace(/</g, '\\u003c')}</script><script>${script}</script></section>`;
}
