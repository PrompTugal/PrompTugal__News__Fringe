// Design A, "the programme" (work/design/D24, design.1.fringe@PrompTugal.dinis): the city's week as a printed festival programme.
// A week-at-a-glance strip (days x hours, shaded by how many events start), then one day at a time, hour by hour,
// with a "now" rule on today's row. Every number comes from data/events.json; nothing is typed in.
// Contract: render({ events, esc, eventPath, hasPage, now }) -> { css, body }. Server-rendered in full (works without JavaScript);
// JavaScript only picks today's tab from the visitor's clock and moves the now rule. Times are UTC (Lisbon is on UTC in November).
import { placeShort, STATUS } from '../cards.mjs';
import { sizeOf } from '../tiers.mjs';

export const meta = {
  id: 'a',
  name: 'The programme',
  maker: 'design.1.fringe@PrompTugal.dinis',
  tool: 'Claude Sonnet, hand-written HTML and CSS on the PT.news tokens',
  status: 'candidate',
  tagline: 'A printed festival programme: the whole week as one strip, then each day hour by hour. Built for the visitor who asks "what is on at 18:00 tomorrow?" rather than "what is on now?".',
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dparts = (d) => { const x = new Date(d + 'T00:00:00Z'); return { dow: DOW[x.getUTCDay()], n: x.getUTCDate(), mon: MON[x.getUTCMonth()] }; };
const hh = (iso) => String(iso).slice(11, 16);
const H0 = 6, H1 = 24;   // the strip's columns: 06:00 to 23:00 (earlier or later starts fold into the end columns)
const col = (h) => Math.min(H1 - 1, Math.max(H0, h));

export const css = `
.pa{--pa-rule:var(--ink);margin-top:var(--s3)}
.pa h2{border:0;padding:0;margin:0}
.pa-kick{font:400 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin:0 0 6px}
.pa-title{font:600 clamp(24px,5vw,34px)/1.1 var(--serif);margin:0 0 4px;letter-spacing:-.01em}.pa-title em{color:var(--ok)}
.pa-dek{color:var(--ink-2);margin:0 0 var(--s3);font-size:15px}
.pa-glance{border-top:2px solid var(--pa-rule);border-bottom:1px solid var(--hair);padding:var(--s3) 0;margin:var(--s3) 0}
.pa-g{display:grid;grid-template-columns:64px 1fr;gap:4px 8px;align-items:center}
.pa-g .gl{font:500 12px/1.1 var(--mono);color:var(--ink-2);text-decoration:none;white-space:nowrap}.pa-g a.gl:hover{color:var(--brand)}
.pa-g .gl b{display:block;font:600 15px/1 var(--serif);color:var(--ink)}
.pa-cells{display:grid;grid-template-columns:repeat(${H1 - H0},1fr);gap:2px}
.pa-cells i{display:block;height:22px;border-radius:2px;background:var(--paper-2);background:color-mix(in srgb,var(--ok) calc(var(--v) * 100%),var(--paper-2))}
.pa-g .ax{font:400 10px/1 var(--mono);color:var(--ink-3);display:flex;justify-content:space-between}
.pa-tabs{position:sticky;top:0;z-index:4;background:var(--paper);display:flex;gap:0;border-bottom:2px solid var(--pa-rule);margin:var(--s4) 0 0;overflow-x:auto;scrollbar-width:none}.pa-tabs::-webkit-scrollbar{display:none}
.pa-tab{flex:1 0 auto;min-height:48px;padding:6px 14px;background:none;border:0;border-bottom:4px solid transparent;margin-bottom:-2px;color:var(--ink-2);font:inherit;text-align:left;cursor:pointer}
.pa-tab b{display:block;font:600 17px/1.1 var(--serif);color:var(--ink)}.pa-tab small{font:400 11px/1.2 var(--mono)}
.pa-tab[aria-selected=true]{border-bottom-color:var(--live);background:var(--paper-2)}
.pa-day[hidden]{display:none}
.pa-hour{display:grid;grid-template-columns:56px 1fr;gap:0 12px;border-bottom:1px solid var(--hair);padding:10px 0;position:relative}
.pa-hour>b{font:600 22px/1 var(--serif);color:var(--ink);font-variant-numeric:tabular-nums}.pa-hour>b i{display:block;font:400 11px/1.4 var(--mono);font-style:normal;color:var(--ink-3)}
.pa-hour ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.pa-ev{display:block;text-decoration:none;color:inherit;min-width:0}.pa-ev a{color:var(--ink);text-decoration:none}
.pa-ev .t{display:block;font:600 16px/1.3 var(--serif);overflow-wrap:anywhere}.pa-ev a:hover .t{color:var(--brand);text-decoration:underline}
.pa-ev .m{display:block;font:400 11.5px/1.5 var(--mono);color:var(--ink-3);margin-top:2px;overflow-wrap:anywhere}
.pa-ev.big .t{font-size:18px}.pa-ev.big{border-left:4px solid var(--ok);padding-left:8px}
.pa-ev.x .t{text-decoration:line-through;color:var(--ink-3)}
.pa-st{display:inline-block;font:500 10.5px/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;padding:2px 5px;border:1px solid var(--hair);border-radius:3px;margin-right:4px;color:var(--ink-2)}
.pa-st.cancelled{border-color:var(--live);color:var(--live)}.pa-st.moved,.pa-st.unknown{border-color:var(--warn,var(--ink-3))}.pa-st.major{border-color:var(--ok);color:var(--ok)}
.pa-hour.cur{background:linear-gradient(90deg,var(--live-soft,transparent),transparent 40%)}
.pa-hour.cur::before{content:"NOW";position:absolute;left:0;top:-9px;font:600 10px/1 var(--mono);letter-spacing:.08em;color:var(--paper);background:var(--live);padding:3px 6px;border-radius:2px}
.pa-hour.cur::after{content:"";position:absolute;left:0;right:0;top:-1px;height:2px;background:var(--live)}
.pa-more{display:block;width:100%;min-height:44px;margin:8px 0;background:var(--panel);border:1px dashed var(--ink-3);border-radius:6px;color:var(--ink-2);font:500 13px/1 var(--mono);cursor:pointer}.pa-past{display:none}.pa-open .pa-past{display:grid}
.pa-foot{font-size:13px;color:var(--ink-3);margin:var(--s4) 0}
@media(min-width:720px){.pa-g{grid-template-columns:80px 1fr}.pa-cells i{height:28px}.pa-hour{grid-template-columns:84px 1fr;gap:0 20px}.pa-hour ul{grid-template-columns:repeat(2,1fr);gap:14px 24px}}
`;

export function render({ events, esc, eventPath, hasPage, now = new Date() }) {
  const dated = events.filter((e) => e.date && e.start);
  const days = [...new Set(dated.map((e) => e.date))].sort();
  const today = now.toISOString().slice(0, 10);
  const startDay = days.includes(today) ? today : days.find((d) => d > today) || days[0];
  const total = dated.length;

  // The glance: for each day, how many events start in each hour (06:00 to 23:00).
  const max = Math.max(1, ...days.flatMap((d) => {
    const c = {}; dated.filter((e) => e.date === d).forEach((e) => { const h = col(+hh(e.start).slice(0, 2)); c[h] = (c[h] || 0) + 1; });
    return Object.values(c);
  }));
  const glanceRows = days.map((d) => {
    const c = {}; const list = dated.filter((e) => e.date === d);
    list.forEach((e) => { const h = col(+hh(e.start).slice(0, 2)); c[h] = (c[h] || 0) + 1; });
    const p = dparts(d);
    const cells = Array.from({ length: H1 - H0 }, (_, i) => { const n = c[H0 + i] || 0;
      return `<i style="--v:${(n / max * 0.85).toFixed(2)}" title="${esc(`${p.dow} ${p.n} ${p.mon}, ${String(H0 + i).padStart(2, '0')}:00: ${n} start${n === 1 ? '' : 's'}`)}"></i>`; }).join('');
    return `<a class="gl" href="#pa-${d}" data-day="${d}"><b>${p.dow} ${p.n}</b>${list.length} events</a><div class="pa-cells" aria-hidden="true">${cells}</div>`;
  }).join('');
  const axis = `<span class="gl"></span><div class="ax" aria-hidden="true"><span>0${H0}</span><span>12</span><span>18</span><span>${H1 - 1}</span></div>`;

  const tabs = days.map((d) => { const p = dparts(d), n = dated.filter((e) => e.date === d).length;
    return `<button type="button" role="tab" class="pa-tab" id="pa-tab-${d}" data-day="${d}" aria-selected="${d === startDay}" aria-controls="pa-${d}"><b>${p.dow} ${p.n}</b><small>${n} events</small></button>`; }).join('');

  const evLine = (e) => {
    const big = sizeOf(e) === 'major';
    const href = hasPage(e) ? eventPath(e) : e.url;
    const range = `${hh(e.start)}${e.end ? '–' + hh(e.end) : ''}${e.end && e.end.slice(0, 10) !== e.start.slice(0, 10) ? ' +1d' : ''}`;
    const st = e.status === 'on' ? '' : `<span class="pa-st ${esc(e.status)}">${esc(STATUS[e.status] || 'Unknown')}</span>`;
    return `<li><div class="pa-ev${big ? ' big' : ''}${e.status === 'cancelled' ? ' x' : ''}"><a href="${esc(href)}"><span class="t">${esc(e.name)}</span></a><span class="m">${big ? '<span class="pa-st major">Anchor</span>' : ''}${st}${esc(range)} UTC · ${esc(placeShort(e))}</span></div></li>`;
  };
  const dayHtml = days.map((d) => {
    const list = dated.filter((e) => e.date === d).sort((a, b) => a.start.localeCompare(b.start) || (a.status === 'cancelled') - (b.status === 'cancelled'));
    const byHour = new Map();
    list.forEach((e) => { const h = hh(e.start).slice(0, 2); if (!byHour.has(h)) byHour.set(h, []); byHour.get(h).push(e); });
    const rows = [...byHour].map(([h, l]) => `<div class="pa-hour" data-h="${h}"><b>${h}<i>${l.length} start${l.length === 1 ? '' : 's'}</i></b><ul>${l.map(evLine).join('')}</ul></div>`).join('');
    const p = dparts(d);
    return `<section class="pa-day" id="pa-${d}" data-day="${d}" role="tabpanel" aria-labelledby="pa-tab-${d}"${d === startDay ? '' : ' hidden'}><p class="pa-kick" style="margin-top:12px">${p.dow} ${p.n} ${p.mon} · ${list.length} events · hours are UTC</p>${rows}</section>`;
  }).join('');

  const body = `<section class="pa"><p class="pa-kick">The programme · ${days.length} days</p>
<h1 class="pa-title">Lisbon&rsquo;s week, <em>hour by hour</em></h1>
<p class="pa-dek">${total} events across ${days.length} days, each re-read at its organiser&rsquo;s page. The stronger the green, the more events start in that hour.</p>
<div class="pa-glance"><div class="pa-g">${glanceRows}${axis}</div></div>
<div class="pa-tabs" role="tablist" aria-label="Day">${tabs}</div>
${dayHtml}
<p class="pa-foot">Anchors are the larger events (conferences and long multi-session days); everything else is a community event. Sizes are our reading, not the organisers&rsquo;. <a href="/programme/">Filter by area and kind</a>.</p></section>
<script>(function(){try{var tabs=[].slice.call(document.querySelectorAll('.pa-tab')),days=[].slice.call(document.querySelectorAll('.pa-day'));
function show(d){tabs.forEach(function(t){t.setAttribute('aria-selected',String(t.dataset.day===d))});days.forEach(function(s){s.hidden=s.dataset.day!==d});mark()}
function mark(){var n=new Date(),d=n.toISOString().slice(0,10),h=n.getUTCHours(),rows=[].slice.call(document.querySelectorAll('.pa-hour'));rows.forEach(function(r){r.classList.remove('cur')});
var s=document.getElementById('pa-'+d);if(!s||s.hidden)return;var best=null;[].slice.call(s.querySelectorAll('.pa-hour')).forEach(function(r){if(+r.dataset.h<=h)best=r});if(best)best.classList.add('cur');fold(s,best)}
function fold(s,cur){if(s.dataset.f||!cur)return;s.dataset.f='1';var all=[].slice.call(s.querySelectorAll('.pa-hour')),i=all.indexOf(cur),past=all.slice(0,Math.max(0,i-0));if(!past.length)return;var n=0;past.forEach(function(r){r.classList.add('pa-past');n+=r.querySelectorAll('li').length});var b=document.createElement('button');b.type='button';b.className='pa-more';b.textContent='Earlier today: '+n+' events started before '+cur.dataset.h+':00. Show';b.addEventListener('click',function(){s.classList.add('pa-open');b.remove()});past[0].parentNode.insertBefore(b,past[0])}
tabs.forEach(function(t,i){t.addEventListener('click',function(){show(t.dataset.day)});t.addEventListener('keydown',function(e){var j=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:-1;if(j>=0&&j<tabs.length){e.preventDefault();tabs[j].focus();show(tabs[j].dataset.day)}})});
[].slice.call(document.querySelectorAll('.pa-g a.gl')).forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();show(a.dataset.day);document.querySelector('.pa-tabs').scrollIntoView({block:'start'})})});
var today=new Date().toISOString().slice(0,10);if(document.getElementById('pa-'+today))show(today);else mark();setInterval(mark,60000)}catch(x){}})();</script>`;
  return { css, body };
}
