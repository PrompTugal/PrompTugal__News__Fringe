// Design B, "the timeline" (D25, design.2.fringe@PrompTugal.dinis, brief 11: the design lab).
// The idea: the page is one timeline. The NOW line leads at the top, what is on now sits right under it, and
// everything else flows down the hours, in the order it will happen, with the days as chapters. Bigger events
// (anchors) are set larger inside their hour; the many small ones stay in line. Nothing is hidden by size:
// each hour shows six, the rest open under "N more in this hour".
// The family: PrompTugal.news's investor-site look (paper, ink, Newsreader, Plex Mono, a green rail, a red NOW).
// Correct without JavaScript at build time; with JavaScript the NOW line, the clock and the lists follow the
// reader's clock every minute (the same drawing function runs on the server and in the browser).
//
// Contract (work/35, dev.1): `meta` and `render(ctx)` -> { css, body, script }; ctx = { events, activity, swarm, at,
// esc, eventPath, hasPage, sizeOf, placeShort }. The header, the PT.news bar, the independence line and the footer
// are the shell's, shared by every design.
import { span } from '../now.mjs';

export const meta = {
  id: 'b',
  name: 'The timeline',
  maker: 'design.2.fringe@PrompTugal.dinis',
  tool: 'Claude Code (Sonnet 5.5)',
  why: 'A visitor at an event week asks one question: what can I go to now, and then? So the page is a timeline: the NOW line first, what is on now under it, then each hour down the day. Big events are set larger in their hour, small ones stay in line, so neither buries the other.',
};

const H = 3600000;

// ---- shared with the browser (no imports, single-quoted href) -----------------------------------------------
// items: [{h, n, o, p, s, e, st, x: end not stated, z: anchor (major), l: online}]
function bEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function bRow(i, now) {
  var hm = function (t) { return new Date(t).toISOString().slice(11, 16); };
  var label = { on: 'On', online: 'Online', moved: 'Moved', unknown: 'Unknown' }[i.st] || 'Unknown';
  var st = { on: 1, online: 1, moved: 1, unknown: 1 }[i.st] ? i.st : 'unknown';
  var when = i.s <= now ? 'until ' + hm(i.e) + (i.x ? ' (end not stated)' : '') : hm(i.s) + (i.x ? '' : '\u2013' + hm(i.e));
  var where = i.l ? '' : bEsc(i.p) + ' \u00b7 ';
  return '<li class=\'b-ev st-' + st + (i.z ? ' b-major' : '') + '\'>'
    + (i.z ? '<span class=\'b-k\'>Anchor</span>' : '')
    + '<a class=\'b-n\' href=\'' + bEsc(i.h) + '\'>' + bEsc(i.n) + '</a>'
    + '<div class=\'b-m\'><span class=\'b-chip\'>' + label + '</span> ' + when + ' UTC \u00b7 ' + where + (bEsc(i.o) || 'organiser not named') + '</div></li>';
}
function bList(list, now, show, noun) {
  var shown = list.slice(0, show).map(function (i) { return bRow(i, now); }).join('');
  var rest = list.slice(show);
  return '<ul class=\'b-list\'>' + shown + '</ul>'
    + (rest.length ? '<details class=\'b-more\'><summary>' + rest.length + ' more ' + noun + '</summary><ul class=\'b-list\'>' + rest.map(function (i) { return bRow(i, now); }).join('') + '</ul></details>' : '');
}
function bRender(D, now) {
  var H = 3600000, items = D.items;
  var hm = function (t) { return new Date(t).toISOString().slice(11, 16); };
  var dayKey = function (t) { return new Date(t).toISOString().slice(0, 10); };
  var byTier = function (a, b) { return (b.z - a.z) || (a.s - b.s); };
  var live = items.filter(function (i) { return i.s <= now && i.e > now; }).sort(byTier);
  var today = dayKey(now), tomorrow = dayKey(now + 24 * H);
  var until = Math.max(now + 12 * H, Date.parse(tomorrow) + 24 * H);
  var next = items.filter(function (i) { return i.s > now && i.s <= until; }).sort(function (a, b) { return a.s - b.s; });
  var within = next.filter(function (i) { return i.s <= now + H; }).length;
  var online = live.filter(function (i) { return i.l; }).length;
  var dayName = function (k) {
    var d = new Date(k + 'T00:00:00Z');
    var w = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()];
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
    return (k === today ? 'Today' : k === tomorrow ? 'Tomorrow' : w) + ' \u00b7 ' + w.slice(0, 3) + ' ' + d.getUTCDate() + ' ' + m;
  };
  var out = '<li class=\'b-h b-nowrow\'><span class=\'b-hr b-nowt\'>NOW</span><div class=\'b-c\'><div class=\'b-nowline\'><span>' + hm(now) + ' UTC</span></div></div></li>';
  out += '<li class=\'b-h\' id=\'b-on\'><span class=\'b-hr\'></span><div class=\'b-c\'><h3 class=\'b-hh\'>On now <span class=\'b-cnt\'>' + live.length + '</span></h3>'
    + (live.length ? bList(live, now, 6, 'on now') : '<p class=\'b-none\'>Nothing checked is on at this minute. The next starts below.</p>') + '</div></li>';
  var lastDay = today, groups = [], hasTom = false, tonightDone = false;
  next.forEach(function (i) {
    var k = dayKey(i.s) + ' ' + hm(i.s).slice(0, 2);
    var g = groups[groups.length - 1];
    if (!g || g.k !== k) { g = { k: k, day: dayKey(i.s), hour: hm(i.s).slice(0, 2) + ':00', list: [] }; groups.push(g); }
    g.list.push(i);
  });
  groups.forEach(function (g) {
    if (g.day !== lastDay) { out += '<li class=\'b-day\'' + (g.day === tomorrow ? ' id=\'b-tomorrow\'' : '') + '><span>' + dayName(g.day) + '</span></li>'; lastDay = g.day; if (g.day === tomorrow) hasTom = true; }
    g.list.sort(byTier);
    var tn = (!tonightDone && g.day === today && g.hour >= '18:00'); if (tn) tonightDone = true;
    out += '<li class=\'b-h\'' + (tn ? ' id=\'b-tonight\'' : '') + '><span class=\'b-hr\'>' + g.hour + '</span><div class=\'b-c\'>' + bList(g.list, now, 6, 'in this hour') + '</div></li>';
  });
  if (!groups.length) out += '<li class=\'b-h\'><span class=\'b-hr\'></span><div class=\'b-c\'><p class=\'b-none\'>Nothing checked starts in the window yet.</p></div></li>';
  var stats = '<b>' + live.length + '</b> on now \u00b7 <b>' + within + '</b> start within the hour \u00b7 <b>' + online + '</b> of the ones on now are online' + (D.cx ? ' \u00b7 <b>' + D.cx + '</b> cancelled by the storm' : '');
  var jumps = '<a href=\'#b-on\'>On now</a>' + (tonightDone ? '<a href=\'#b-tonight\'>Tonight</a>' : '') + (hasTom ? '<a href=\'#b-tomorrow\'>Tomorrow</a>' : '');
  return { flow: out, clock: hm(now), stats: stats, jumps: jumps, sig: live.length + ':' + within + ':' + tonightDone + hasTom };
}

// ---- server side ---------------------------------------------------------------------------------------------
const CSS = `
.b{--g:var(--green,#006600);--r:var(--red,#c52830);--bi:var(--ink,#121317);max-width:1120px;margin:0 auto;padding:6px 0 28px;display:grid;gap:0;grid-template-columns:minmax(0,1fr)}
.b *{box-sizing:border-box}
.b-aside{padding:14px 0 10px}
.b-kick{font:400 .78rem/1.4 var(--mono,ui-monospace,Menlo,Consolas,monospace);letter-spacing:.14em;text-transform:uppercase;color:var(--g);margin:0}
.b-clock{font:600 clamp(40px,12vw,64px)/1 var(--serif,Georgia,serif);margin:4px 0 2px;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.b-clock small{font:400 .78rem/1 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.06em;color:var(--ink-3,#595c64);margin-left:8px}
.b-stats{font-size:.95rem;color:var(--ink-2,#3f424a);margin:0}
.b-stats b{color:var(--bi);font-weight:600}
.b-jump{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}.b-jump a{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:1.5px solid var(--g);color:var(--g);font:600 .8rem var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border-radius:2px}.b-jump a:hover,.b-jump a:focus-visible{background:var(--g);color:var(--paper,#f6f3ec)}
.b-h,.b-day{scroll-margin-top:12px}
.b-act{margin:12px 0 0;padding-top:10px;border-top:1px solid var(--hair,#d9d2c1);font:400 .82rem/1.5 var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-2,#3f424a)}
.b-act a{color:inherit}
.b-flow{list-style:none;margin:8px 0 0;padding:0}
.b-h{display:grid;grid-template-columns:50px minmax(0,1fr);column-gap:32px;position:relative;padding:0 0 14px}
.b-h::before{content:"";position:absolute;left:61px;top:0;bottom:0;width:2px;background:var(--g);opacity:.5}
.b-hr{font:600 .92rem/1.2 var(--mono,ui-monospace,Menlo,monospace);text-align:right;padding-top:3px;position:relative;white-space:nowrap}
.b-hr::after{content:"";position:absolute;right:-18px;top:5px;width:12px;height:12px;border-radius:50%;background:var(--paper,#f6f3ec);border:2px solid var(--g);z-index:1}
.b-c{min-width:0}
.b-nowrow{padding-bottom:8px}.b-nowrow::before{top:50%}
.b-nowt{color:var(--r);letter-spacing:.08em;font-weight:700;padding-right:8px}
.b-nowt::after{width:16px!important;height:16px!important;right:-20px!important;top:2px!important;background:var(--r)!important;border-color:var(--r)!important;box-shadow:0 0 0 4px var(--red-soft,#f8e4df)}
.b-nowline{border-top:2px solid var(--r);color:var(--r);font:700 .85rem/1.6 var(--mono,ui-monospace,Menlo,monospace);padding-top:1px;margin-top:10px}
.b-hh{font:600 1.25rem/1.2 var(--serif,Georgia,serif);margin:0 0 6px}
.b-cnt{font:400 .8rem var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64);margin-left:6px}
.b-day{list-style:none;margin:6px 0 12px;padding:8px 0 0;border-top:1px solid var(--bi)}
.b-day span{font:600 1.05rem/1.2 var(--serif,Georgia,serif);display:block;padding-left:0}
.b-list{list-style:none;margin:0;padding:0}
.b-ev{position:relative;padding:7px 0 8px;border-bottom:1px solid var(--hair,#d9d2c1)}
.b-ev:last-child{border-bottom:0}
.b-n{display:block;font:600 1.02rem/1.3 var(--serif,Georgia,serif);color:var(--bi);text-decoration:none;overflow-wrap:anywhere}
.b-n::after{content:"";position:absolute;inset:0}
.b-n:hover,.b-n:focus-visible{text-decoration:underline;text-decoration-color:var(--g);text-underline-offset:3px}
.b-m{font:400 .78rem/1.5 var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64);margin-top:2px;overflow-wrap:anywhere}
.b-chip{display:inline-block;font:600 .66rem/1.5 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.08em;text-transform:uppercase;padding:0 6px;border:1px solid currentColor;border-radius:2px;margin-right:2px;vertical-align:1px}
.st-on .b-chip{color:var(--g)}.st-online .b-chip{color:var(--cobalt,#1f4fa8)}.st-moved .b-chip{color:var(--warn,#8a5200)}.st-unknown .b-chip{color:var(--ink-3,#595c64);border-style:dashed}
.b-major{background:var(--panel,#fffdf8);border:1px solid var(--bi);border-left:4px solid var(--g);margin:8px 0;padding:10px 12px 11px}
.b-major .b-n{font-size:1.15rem;line-height:1.22}
.b-k{display:block;font:600 .66rem/1 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.14em;text-transform:uppercase;color:var(--g);margin-bottom:4px}
.b-more{margin:4px 0 2px}.b-more summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font:500 .82rem var(--mono,ui-monospace,Menlo,monospace);color:var(--cobalt,#1f4fa8)}
.b-none{margin:0;color:var(--ink-3,#595c64)}
.b-foot{margin:14px 0 0;font-size:.95rem}.b-foot a{color:var(--cobalt,#1f4fa8)}
@media (min-width:600px){.b-major .b-n{font-size:1.28rem}}
@media (min-width:900px){
  .b{grid-template-columns:300px minmax(0,1fr);column-gap:48px;padding-top:18px}
  .b-aside{position:sticky;top:12px;align-self:start;padding-top:0}
  .b-clock{font-size:76px}
  .b-flow{margin-top:0}
}
@media (prefers-reduced-motion:no-preference){.b-nowt::after{animation:b-pulse 2.4s ease-in-out infinite}}
@keyframes b-pulse{0%,100%{box-shadow:0 0 0 4px var(--red-soft,#f8e4df)}50%{box-shadow:0 0 0 8px transparent}}
`;

export function render(ctx) {
  const { events, activity, at, eventPath, hasPage, sizeOf, placeShort, esc } = ctx;
  const now = at.getTime();
  const items = [];
  let cx = 0;
  const today = at.toISOString().slice(0, 10);
  for (const e of events) {
    if (e.status === 'cancelled') { if (e.date === today) cx++; continue; }
    const sp = span(e);
    if (!sp || sp.e <= now || sp.s > now + 72 * H) continue;
    items.push({
      h: hasPage(e) ? eventPath(e) : e.url, n: e.name, o: String(e.organiser || '').replace(/\s*\((per|from|on|as|a)\b[^)]*\)\s*/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 64),
      p: placeShort(e), s: sp.s, e: sp.e, st: e.status || 'unknown', x: sp.endStated ? 0 : 1, z: sizeOf(e) === 'major' ? 1 : 0,
      l: /^online\b/i.test(e.place || '') || e.status === 'online' ? 1 : 0,
    });
  }
  const D = { items, cx };
  const r = bRender(D, now);
  const t = activity?.totals;
  const act = t ? `The swarm that builds this, in the last 15 minutes: <b>${esc(t.last_15_min?.commits)}</b> commits by <b>${esc(t.last_15_min?.agents)}</b> agents. <a href="/how/">How it is made</a>` : '';
  const body = `<section class="b" id="b" aria-label="The timeline">
<div class="b-aside"><p class="b-kick">01 &middot; Now in Lisbon</p>
<div class="b-clock" id="b-clock">${r.clock}<small>UTC</small></div>
<p class="b-stats" id="b-stats">${r.stats}</p>
<nav class="b-jump" id="b-jump" aria-label="Jump to">${r.jumps}</nav>
${act ? `<p class="b-act">${act}</p>` : ''}</div>
<div class="b-main"><ol class="b-flow" id="b-flow">${r.flow}</ol>
<p class="b-foot">Everything later this week: <a href="/programme/">the programme</a> &middot; <a href="/api/v1/events.json">the data</a>.</p></div>
<script type="application/json" id="b-data">${JSON.stringify(D).replace(/</g, '\\u003c')}</script></section>`;
  const script = `(function(){try{var bEsc=${bEsc.toString()},bRow=${bRow.toString()},bList=${bList.toString()},bRender=${bRender.toString()};
var D=JSON.parse(document.getElementById('b-data').textContent),last='';
function run(){var now=Date.now(),r=bRender(D,now),f=document.getElementById('b-flow');
document.getElementById('b-clock').innerHTML=r.clock+'<small>UTC</small>';document.getElementById('b-stats').innerHTML=r.stats;document.getElementById('b-jump').innerHTML=r.jumps;
if(f.querySelector('details[open]'))return;if(r.sig!==last){f.innerHTML=r.flow;last=r.sig}else{var n=f.querySelector('.b-nowline span');if(n)n.textContent=r.clock+' UTC'}}
run();setInterval(run,30000)}catch(e){}})();`;
  return { css: CSS, body, script };
}
