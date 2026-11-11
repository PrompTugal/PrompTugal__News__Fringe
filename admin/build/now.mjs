// work/16 (dev.2.fringe@PrompTugal.dinis): what is on now and in the next three hours.
// Server-renders the list for the build time (works without JavaScript); every event in the window of
// the week is in the markup with its start/end/read_at in ms, and /now.js re-filters by the reader's clock.
// Lisbon is on UTC in November, so ISO times with Z are the local times.
const H = 3600000;
const STATUS = { on: 'On', moved: 'Moved', cancelled: 'Cancelled', online: 'Online', unknown: 'Unknown' };
const ms = (s) => { const t = Date.parse(s); return Number.isNaN(t) ? null : t; };
const isOnline = (e) => /^online\b/i.test(e.place || '') || e.status === 'online';

// An event with no stated end counts as 2 hours long (marked "end not stated").
export function span(e) {
  const s = ms(e.start); if (s == null) return null;
  const en = ms(e.end);
  return { s, e: en ?? s + 2 * H, endStated: en != null };
}

// The quiet line (fable.fringe@ note 4, via the lead): the status was read at the organiser's page at this time; the reader checks before going.
export const readLine = (e, esc) => `Status last read at the organiser's page at ${esc(String(e.read_at).slice(11, 16))} UTC; check their page before you go.`;

export function nowItems(events, esc, { eventPath, hasPage }) {
  return events.map((e) => ({ e, sp: span(e) })).filter((x) => x.sp).sort((a, b) => a.sp.s - b.sp.s).map(({ e, sp }) => {
    const href = hasPage(e) ? eventPath(e) : e.url;
    const hm = (t) => new Date(t).toISOString().slice(11, 16);
    const mode = isOnline(e) ? 'Online' : 'In person';
    const st = STATUS[e.status] ? e.status : 'unknown';
    return `<li class="card nowitem" data-s="${sp.s}" data-e="${sp.e}" data-r="${ms(e.read_at) ?? 0}" hidden>
<a href="${esc(href)}"><strong>${esc(e.name)}</strong></a>
<span class="tag ${esc(st)}">${esc(STATUS[st])}</span><span class="tag">${mode}</span><span class="tag nowwhen"></span>
<div class="muted">${hm(sp.s)}${sp.endStated ? '–' + hm(sp.e) : ' (end not stated)'} UTC${e.place ? ' · ' + esc(e.place) : ''}${e.organiser ? ' · ' + esc(e.organiser) : ''}</div>
${e.storm_note && st !== 'on' ? `<div class="muted">Storm: ${esc(e.storm_note)}</div>` : ''}
<div class="muted nowread">${readLine(e, esc)}<span class="nowstale"></span></div></li>`;
  }).join('');
}

// Pre-rendered for `at` (the build time): unhide what is on now or starts within 3 hours.
export function nowBlock(events, esc, helpers, at, { limit = 0, heading = 'h2' } = {}) {
  let items = nowItems(events, esc, helpers);
  const t = at.getTime();
  let shown = 0;
  items = items.replace(/<li class="card nowitem" data-s="(\d+)" data-e="(\d+)" data-r="(\d+)" hidden>/g, (m, s, e, r) => {
    const on = +s <= t && +e > t, soon = +s > t && +s <= t + 3 * H;
    if (!(on || soon) || (limit && shown >= limit)) return m;
    shown++;
    return m.replace(' hidden', '');
  });
  const asOf = at.toISOString().slice(0, 16).replace('T', ' ');
  return `<section class="nowblock" data-limit="${limit}"><${heading}>On now and in the next 3 hours</${heading}>
<p class="muted nowasof">As of ${asOf} UTC (when this page was built; with JavaScript it follows your clock). Lisbon time is UTC in November. <a href="/now/">Everything on now</a>.</p>
<ul class="nowlist" style="list-style:none;padding:0;margin:0">${items}</ul>
<p class="nowempty muted"${shown ? ' hidden' : ''}>Nothing checked is on now or starting in the next 3 hours. <a href="/">All events</a>.</p></section>`;
}

export const nowPageBody = (events, esc, helpers, at) => `<h1>On now</h1>
<p>What is on right now and what starts in the next three hours, from events re-read at their public pages. In person, online, moved and cancelled are marked; a time read more than 3 hours ago says so. Not a warning service: for the storm see <a href="https://storm-charles.promptugal.news">storm-charles.promptugal.news</a>, <a href="https://www.ipma.pt/">IPMA</a> and <a href="https://www.prociv.gov.pt/">ANEPC</a>.</p>`
  + nowBlock(events, esc, helpers, at, { heading: 'h2' }) + `<script src="/now.js" defer></script>`;

// The tiny client: re-filters by the reader's clock, labels "on now" / "in N min", flags stale reads.
export const nowJs = `(function(){
function fmt(m){return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min'}
document.querySelectorAll('.nowblock').forEach(function(b){
  var now=Date.now(),H=3600000,limit=+b.dataset.limit||0,n=0;
  b.querySelectorAll('.nowitem').forEach(function(li){
    var s=+li.dataset.s,e=+li.dataset.e,r=+li.dataset.r,on=s<=now&&e>now,soon=s>now&&s<=now+3*H;
    var show=(on||soon)&&(!limit||n<limit);if(show)n++;li.hidden=!show;if(!show)return;
    li.querySelector('.nowwhen').textContent=on?'on now':'starts in '+fmt(Math.round((s-now)/60000));
    var age=now-r;li.querySelector('.nowstale').textContent=age>2*H?' Read '+Math.floor(age/H)+' h ago.':'';
  });
  var em=b.querySelector('.nowempty');if(em)em.hidden=n>0;
  var a=b.querySelector('.nowasof');if(a)a.textContent='Following your clock: '+new Date(now).toISOString().slice(0,16).replace('T',' ')+' UTC. Lisbon time is UTC in November.';
});})();`;
