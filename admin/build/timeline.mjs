// D19 (design.2.fringe@PrompTugal.dinis): the now timeline, at the top of the home page.
// Brief 8 (Dinis, 12:40 UTC): "a timeline of what happens now. So that's actually super, super powerful."
// A vertical rail: what is on now, a NOW line, then what starts next. At most 6 rows, then a link to /now/.
// Correct without JavaScript at build time; with JavaScript the same code (pick and rowHtml are shipped to the
// browser as source) re-places the NOW line by the reader's clock every minute. Lisbon is on UTC in November.
import { span } from './now.mjs';
import { placeShort } from './cards.mjs';

const H = 3600000;

// ---- shared: these two functions run on the server and in the browser, so they use no imports ----------------
// items: [{h: href, n: name, p: place, s: start ms, e: end ms, st: status, x: 1 if the end is not stated}]
function pick(items, now, limit, hrs) {
  const live = items.filter((i) => i.st !== 'cancelled' && i.s <= now && i.e > now).sort((a, b) => a.s - b.s);
  const next = items.filter((i) => i.st !== 'cancelled' && i.s > now && i.s <= now + hrs * H).sort((a, b) => a.s - b.s);
  const maxLive = Math.min(live.length, Math.max(2, limit - Math.min(next.length, 3)));   // always leave room for what is next
  const nowRows = live.slice(0, maxLive);
  const nextRows = next.slice(0, Math.max(0, limit - nowRows.length));
  return { nowRows, nextRows, liveMore: live.length - nowRows.length, nextMore: next.length - nextRows.length, liveTotal: live.length };
}
function rowHtml(i, esc, now) {
  const hm = (t) => new Date(t).toISOString().slice(11, 16);
  const on = i.s <= now;
  const label = { on: 'On', online: 'Online', moved: 'Moved', unknown: 'Unknown' }[i.st] || 'Unknown';
  const st = { on: 1, online: 1, moved: 1, unknown: 1 }[i.st] ? i.st : 'unknown';
  const until = on ? `until ${hm(i.e)}${i.x ? ' (end not stated)' : ''}` : `${hm(i.s)}${i.x ? '' : '–' + hm(i.e)}`;
  return `<li class="tl-row ${on ? 'tl-live' : 'tl-next'}"><span class="tl-t">${hm(i.s)}</span><span class="tl-dot" aria-hidden="true"></span>`
    + `<div class="tl-c"><a class="tl-n" href='${esc(i.h)}'>${esc(i.n)}</a><div class="tl-m"><span class="chip ${st}">${label}</span> <span>${esc(st === 'online' || i.p === 'Online' ? '' : i.p + ' · ')}${until} UTC</span></div></div></li>`;
}
function render(items, now, limit, esc, hrs) {
  const r = pick(items, now, limit, hrs);
  const hm = new Date(now).toISOString().slice(11, 16);
  const nowLine = `<li class="tl-nowline" aria-label="Now, ${hm} UTC"><span class="tl-t">NOW</span><span class="tl-dot" aria-hidden="true"></span><span class="tl-c">${hm} UTC</span></li>`;
  const rows = r.nowRows.map((i) => rowHtml(i, esc, now)).join('') + nowLine + r.nextRows.map((i) => rowHtml(i, esc, now)).join('');
  const empty = !r.nowRows.length && !r.nextRows.length ? `<li class="tl-empty muted">Nothing checked is on now or in the next ${hrs} hours.</li>` : '';
  const more = [r.liveMore > 0 ? `${r.liveMore} more on now` : '', r.nextMore > 0 ? `${r.nextMore} more coming up` : ''].filter(Boolean).join(' · ');
  return { html: rows + empty, more, hm, liveTotal: r.liveTotal };
}

// ---- server side ------------------------------------------------------------------------------------------
export const TIMELINE_CSS = `
.timeline{margin:12px 0 18px}
.timeline h2{margin:0 0 2px;font-size:1.15rem}
.tl-sub{margin:0 0 6px;font-size:.85rem}
.tl{list-style:none;margin:0;padding:0;position:relative}
.tl::before{content:"";position:absolute;left:55px;top:8px;bottom:8px;width:2px;background:var(--hair,#d9d2c1)}
.tl li{display:grid;grid-template-columns:46px 20px 1fr;column-gap:4px;align-items:start;padding:5px 0;position:relative}
.tl-t{font-variant-numeric:tabular-nums;font-weight:700;font-size:.9rem;text-align:right;padding-top:1px}
.tl-dot{width:10px;height:10px;border-radius:50%;margin:5px 0 0 5px;background:var(--paper,#f6f3ec);border:2px solid var(--rule-2,#9d9580);position:relative;z-index:1;box-sizing:border-box}
.tl-live .tl-dot{background:var(--ok,#2b6a3c);border-color:var(--ok,#2b6a3c)}
.tl-c{min-width:0}
.tl-n{display:block;font-size:.95rem;font-weight:600;line-height:1.3;color:var(--ink,#121317);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-n:hover,.tl-n:focus-visible{text-decoration:underline}
.tl-m{font-size:.82rem;color:var(--ink-3,#595c64);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.tl-m .chip{font-size:.68rem;padding:0 7px}
.tl-nowline{color:var(--live,#b42318);font-weight:800;align-items:center!important;padding:6px 0!important}
.tl-nowline .tl-t{font-size:.8rem;letter-spacing:.06em}
.tl-nowline .tl-dot{width:14px;height:14px;margin:0 0 0 3px;background:var(--live,#b42318);border-color:var(--live,#b42318);box-shadow:0 0 0 4px var(--live-soft,#f8e4df)}
.tl-nowline .tl-c{font-size:.85rem;border-top:2px solid var(--live,#b42318);padding-top:2px;margin-top:2px}
.tl-jumps{margin:2px 0 var(--s2);font:500 12px/1.4 var(--mono);letter-spacing:.04em;color:var(--ink-3)}.tl-jumps a{margin-right:var(--s3);color:var(--ink)}.tl-jumps .tl-count{display:block;margin-top:2px}
.tl-more{margin:6px 0 0;font-size:.92rem}
.tl-more a{font-weight:600}
@media (min-width:640px){.tl::before{left:63px}.tl li{grid-template-columns:54px 20px 1fr}.tl-nowline .tl-dot{margin-left:3px}}`;

// events: the published events; esc; helpers: { eventPath, hasPage }; at: Date (the build time); limit: rows (6)
export function timelineBlock(events, esc, { eventPath, hasPage }, at, { limit = 6, hours = 12, full = false, jumps = '' } = {}) {
  const now = at.getTime();
  const items = [];
  for (const e of events) {
    const sp = span(e);
    if (!sp || e.status === 'cancelled') continue;
    if (sp.e <= now - H || sp.s > now + Math.max(36, hours + 2) * H) continue;   // only what can matter within the next day and a half
    items.push({ h: hasPage(e) ? eventPath(e) : e.url, n: e.name, p: placeShort(e), s: sp.s, e: sp.e, st: e.status || 'unknown', x: sp.endStated ? 0 : 1 });
  }
  const r = render(items, now, limit, esc, hours);
  const data = JSON.stringify(items).replace(/</g, '\\u003c');
  const moreText = r.more ? `${r.more}. ` : '';
  const client = `(function(){try{var esc=${esc.toString()},pick=${pick.toString()},rowHtml=${rowHtml.toString()},render=${render.toString()},H=${H};
var b=document.getElementById('timeline');if(!b)return;var D=JSON.parse(document.getElementById('tl-data').textContent),L=${limit},HR=${hours};
function run(){var now=Date.now(),r=render(D,now,L,esc,HR);b.querySelector('.tl').innerHTML=r.html;
var m=b.querySelector('.tl-more-text');if(m)m.textContent=r.more?r.more+'. ':'';
var a=b.querySelector('.tl-asof');if(a)a.textContent='Following your clock, '+r.hm+' UTC. Lisbon time is UTC in November.'}
run();setInterval(run,60000)}catch(e){}})();`;
  const head = full ? '' : '<h2 id="tl-h">Right now in Lisbon</h2>';
  const link = full ? '' : '<a href="/now/">See the full timeline &rarr;</a>';
  return `<section class="timeline${full ? ' tl-full' : ''}" id="timeline"${full ? '' : ' aria-labelledby="tl-h"'}>${head}
<p class="tl-sub muted tl-asof">As of ${r.hm} UTC when this page was built; with JavaScript it follows your clock. Lisbon time is UTC in November.</p>
${jumps}<ol class="tl">${r.html}</ol>
<p class="tl-more"><span class="tl-more-text">${esc(moreText)}</span>${link}</p>
<script type="application/json" id="tl-data">${data}</script><script>${client}</script></section>`;
}
