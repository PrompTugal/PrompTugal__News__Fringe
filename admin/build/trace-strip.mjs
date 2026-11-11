// "How this page was made" as one line: a metro line under an article, from the ask to the page live.
// designer.fringe@PrompTugal.angelo for conductor.fringe@PrompTugal.angelo, at Angelo's ask, 11 November 2026 (WS-215).
// traceStrip(trace, esc, opts) takes one trace (lisbon-fringe-trace/1, team/<id>/traces/*.json) and returns a
// self-contained block: HTML, scoped CSS (.ts-*) and a few lines of JS for tap-to-open. Stations are evenly spaced, as on
// a metro map, and always run left to right; the strip adapts to its own width (container queries): about 6 stations on
// a phone, 9 on a tablet, up to 14 on a desktop, picked by how much each step tells the story. A long quiet stretch is a
// dashed segment, the failed deploys a red one, the first time the page went live the destination. Without JS it is still
// a sentence and a link to every step. No libraries, fonts or requests; every value goes through esc().

const GAP = 300;                 // seconds: a longer quiet stretch is drawn dashed
const LEVELS = [6, 9, 14];       // stations shown: phone, tablet, desktop
const BURST_GAP = 75, BURST_MIN = 5;

const ms = (t) => { const v = Date.parse(t); return Number.isFinite(v) ? v : NaN; };
const hm = (t) => (Number.isFinite(t) ? new Date(t).toISOString().slice(11, 16) : '');
const shortWho = (w) => String(w || '').replace(/\.fringe@PrompTugal\.\w+$/, '').replace(/@[\w.]+$/, '');
const firstTime = (s) => { const m = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)\s*(?:\((v[\d.]+))?/.exec(String(s || '')); return m ? { t: ms(m[1]), v: m[2] || '' } : null; };
const isPrivate = (w) => /private person/i.test(String(w || ''));
const isOrganiser = (w) => /\borganiser\b/i.test(String(w || ''));
const firstName = (w) => (isPrivate(w) ? 'A tip' : isOrganiser(w) ? 'Organiser' : String(w || '').split(/\s+/)[0]);
const words = (s, n) => String(s || '').split(/[,;:(]/)[0].trim().split(/\s+/).filter((w) => !w.includes('/')).slice(0, n).join(' ');

export function traceStrip(trace, esc, opts = {}) {
  const repo = opts.repo || 'https://github.com/PrompTugal/PrompTugal__News__Fringe';
  const full = opts.traceUrl || `/traces/${trace.event_id}/`;
  const totals = trace.totals || {};
  const steps = (trace.steps || []).map((s, i) => {
    const t = ms(s.t), untimed = !Number.isFinite(t);
    return { ...s, n: Number(s.n) || i + 1, ts: untimed ? ms(s.before) : t, untimed };
  }).filter((s) => Number.isFinite(s.ts)).sort((a, b) => a.ts - b.ts || a.n - b.n);
  if (!steps.length) return '';
  const firstLive = firstTime(totals.page_first_live), liveNow = firstTime(totals.live_at);
  const day = (steps.find((s) => !s.untimed)?.t || '').slice(0, 10);

  // --- candidate stations, each with a score (how much it tells the story) -------------------------------------
  const stops = [];
  const add = (o) => stops.push(o);
  const agentish = (s) => s.kind === 'agent' || s.kind === 'sub-agent';
  // bursts of agent commits fold into one station
  const inBurst = new Set();
  { let run = [];
    const flush = () => { if (run.length >= BURST_MIN) { run.forEach((s) => inBurst.add(s.n));
      add({ score: 60, kind: 'burst', t: run[0].ts, t1: run[run.length - 1].ts, steps: run,
        short: `${run.length} commits`, long: `${run.length} commits by ${new Set(run.map((s) => s.who)).size} agents` }); } run = []; };
    for (const s of steps.filter(agentish)) { if (run.length && s.ts - run[run.length - 1].ts > BURST_GAP * 1000) flush(); run.push(s); }
    flush(); }
  const start = steps.find((s) => s.kind === 'human' && s.untimed && !isPrivate(s.who) && !isOrganiser(s.who));
  let firstRead = null, firstEntry = null, firstDeploy = null;
  for (const s of steps) {
    if (inBurst.has(s.n)) continue;
    const what = String(s.what || '');
    if (s === start) { add({ score: 95, kind: 'start', s, short: `${firstName(s.who)} asks`, long: `${firstName(s.who)} asks for it` }); continue; }
    if (s.kind === 'human') {
      if (s.untimed) add({ score: isOrganiser(s.who) ? 50 : 25, kind: 'human', s, short: firstName(s.who), long: isOrganiser(s.who) ? 'Organiser updates its page' : isPrivate(s.who) ? 'A tip (anonymous)' : firstName(s.who) });
      else add({ score: 70, kind: 'human', s, short: firstName(s.who), long: `${firstName(s.who)}: ${words(what, 3)}` });
    } else if (s.kind === 'source-read') {
      const first = !firstRead; if (first) firstRead = s;
      add({ score: first ? 80 : s.who.startsWith('a sub-agent') ? 45 : 40, kind: s.who.startsWith('a sub-agent') ? 'sub-agent' : 'read', s,
        short: first ? 'Read' : 'Re-read', long: first ? "Organiser's page read" : s.who.startsWith('a sub-agent') ? 'A sub-agent re-reads' : `${shortWho(s.who)} re-reads` });
    } else if (s.kind === 'deploy') {
      if (firstLive && s.version === firstLive.v) add({ score: 100, kind: 'live', s, short: 'Live', long: `Page live · ${s.version}` });
      else if (!firstDeploy) { firstDeploy = s; add({ score: 30, kind: 'deploy', s, short: 'Deploy', long: `First deploy · ${s.version || ''}` }); }
    } else if (agentish(s)) {
      if (/created the entry/.test(what) && !firstEntry) { firstEntry = s; add({ score: 75, kind: 'agent', s, short: 'Entry', long: 'Entry written' }); }
      else if (/created the page builder/.test(what)) add({ score: 72, kind: 'agent', s, short: 'Page built', long: 'Page builder made' });
      else if (/changed the entry/.test(what)) add({ score: s.kind === 'sub-agent' ? 45 : 35, kind: s.kind, s, short: 'Updated', long: s.kind === 'sub-agent' ? 'A sub-agent updates' : 'Entry updated' });
      else if (!/^\(context\)/.test(what)) add({ score: 20, kind: s.kind, s, short: shortWho(s.who).split('.')[0], long: shortWho(s.who) });
    }
  }
  // the outage: a step that says deploys failed from one time to another
  for (const s of steps) {
    const m = /\bfailed\b/i.test(s.what || '') && /from (\d\d:\d\d:\d\d) to (\d\d:\d\d:\d\d)/.exec(s.what || '');
    if (m && day) { const r = /runs? (\d+) to (\d+)/.exec(s.what), n = r ? +r[2] - +r[1] + 1 : 0, a = ms(`${day}T${m[1]}Z`), b = ms(`${day}T${m[2]}Z`);
      add({ score: 90, kind: 'out', s, t: a, t1: b, short: n ? `${n} failed` : 'Failed', long: `${n ? `${n} deploys` : 'Deploys'} failed · ${Math.round((b - a) / 60000)} min down` }); }
  }
  if (liveNow) add({ score: 90, kind: 'now', t: liveNow.t, short: 'Now', long: `Live now · ${liveNow.v}`, s: null });
  for (const o of stops) if (o.t == null) o.t = o.s.ts;
  // an untimed step sits just before its 'before'; the ask opens the line
  const sortKey = (o) => (o.kind === 'start' ? -Infinity : o.s?.untimed ? o.t - 1 : o.t);
  stops.sort((a, b) => sortKey(a) - sortKey(b) || b.score - a.score);
  // keep at most the biggest level; each station gets the smallest level it shows at
  const ranked = [...stops].sort((a, b) => b.score - a.score || a.t - b.t);
  ranked.forEach((o, i) => { o.lvl = LEVELS.findIndex((n) => i < n); });
  const shown = stops.filter((o) => o.lvl >= 0);
  // a quiet stretch before a station, at each level (the previous station shown at that level)
  shown.forEach((o, i) => {
    o.quiet = LEVELS.map((_, L) => { for (let j = i - 1; j >= 0; j--) if (shown[j].lvl <= L) return o.t - (shown[j].t1 || shown[j].t) > GAP * 1000; return false; });
    o.afterOut = LEVELS.map((_, L) => { for (let j = i - 1; j >= 0; j--) if (shown[j].lvl <= L) return shown[j].kind === 'out'; return false; });
  });

  // --- the headline: one sentence that works alone -------------------------------------------------------------
  const mins = firstRead && firstLive ? Math.round((firstLive.t - firstRead.ts) / 60000) : null;
  const facts = [totals.humans != null && `${totals.humans} people`, totals.agents != null && `${totals.agents} agents`,
    totals.commits != null && `${totals.commits} commits`, totals.deploys != null && `${totals.deploys} deploys`].filter(Boolean);
  const head = mins != null ? `From the organiser's page to this page in ${mins} min` : 'How this page was made';

  // --- stations -------------------------------------------------------------------------------------------------
  const evLink = (e) => { e = String(e);
    if (/^[0-9a-f]{7,40}$/.test(e)) return `<a href="${esc(`${repo}/commit/${e}`)}">commit ${esc(e.slice(0, 7))}</a>`;
    if (/^https:\/\//.test(e)) { let txt = 'source'; try { const u = new URL(e), r = /\/runs\/(\d+)/.exec(u.pathname); txt = r ? `run ${r[1]}` : u.hostname.replace(/^www\./, ''); } catch {} return `<a href="${esc(e)}">${esc(txt)}</a>`; }
    if (/^[\w][\w./-]*$/.test(e) && !e.includes('..')) return `<a href="${esc(`${repo}/blob/dev/${e}`)}">${esc(e.split('/').pop())}</a>`;
    return esc(e); };
  const uid = `ts-${String(trace.event_id || 'x').replace(/[^a-z0-9-]/gi, '').slice(0, 40)}`;
  const KW = { start: 'a person', human: 'a person', read: 'a source read', agent: 'an agent', 'sub-agent': 'a sub-agent', deploy: 'a deploy', live: 'the page went live', burst: 'a burst of agent commits', out: 'a disruption', now: 'live now' };
  const lis = shown.map((o, i) => {
    const when = o.kind === 'burst' || o.kind === 'out' ? `${hm(o.t)} to ${hm(o.t1)}` : o.s?.untimed ? `before ${hm(o.t)}` : hm(o.t);
    const whenShort = o.s?.untimed ? `≤${hm(o.t)}` : hm(o.t);
    const s = o.s;
    let body;
    if (o.kind === 'burst') body = `<p>${esc(o.long)}, folded into one stop: ${esc([...new Set(o.steps.map((x) => shortWho(x.who)))].join(', '))}.</p><p><a href="${esc(`${full}#s-${o.steps[0].n}`)}">Each commit in the full trace</a></p>`;
    else if (o.kind === 'now') body = `<p>The version live when the trace was taken.</p><p><a href="${esc(full)}">The full trace</a></p>`;
    else body = `<p class="ts-who">${esc(s.who)}</p><p>${esc(String(s.what || '').slice(0, 220))}${String(s.what || '').length > 220 ? '…' : ''}</p>
<p class="ts-ev">${(s.evidence || []).slice(0, 3).map(evLink).join(' · ')} · <a href="${esc(`${full}#s-${s.n}`)}">step ${esc(s.n)}</a></p>`;
    const cls = ['ts-stop', `ts-${o.kind}`, `ts-l${o.lvl}`, s?.label === 'hypothesis' ? 'ts-hyp' : '',
      ...o.quiet.map((q, L) => (q ? `ts-q${L}` : '')), ...o.afterOut.map((q, L) => (q ? `ts-o${L}` : ''))].filter(Boolean).join(' ');
    return `<li class="${cls}"><button type="button" class="ts-btn" aria-expanded="false" aria-controls="${uid}-${i}" aria-label="${esc(`${o.long}, ${when} UTC: ${KW[o.kind] || o.kind}`)}"><span class="ts-dot" aria-hidden="true"></span><span class="ts-lab" aria-hidden="true"><span class="ts-s">${esc(o.short)}</span><span class="ts-lg">${esc(o.long)}</span></span><span class="ts-t" aria-hidden="true"><span class="ts-s">${esc(whenShort)}</span><span class="ts-lg">${esc(when)}</span></span></button>
<div class="ts-tip" id="${uid}-${i}" role="region" aria-label="${esc(o.long)}"><p class="ts-th"><b>${esc(o.long)}</b> <span>${esc(when)} UTC</span>${s?.label === 'hypothesis' ? ' <em>hypothesis</em>' : ''}</p>${body}</div></li>`;
  }).join('');

  return `<style>${STRIP_CSS}</style><section class="tstrip" id="${uid}" aria-labelledby="${uid}-h">
<p class="ts-head" id="${uid}-h"><span class="ts-k">How this page was made</span> <b>${esc(head)}</b>${facts.length ? ` <span class="ts-facts">· ${esc(facts.join(' · '))}</span>` : ''}</p>
<ol class="ts-line">${lis}</ol>
<p class="ts-foot"><a href="${esc(full)}">See every step</a> <span>· from the git record, with evidence</span></p>
</section><script>${STRIP_JS.replace('__ID__', uid)}</script>`;
}

const STRIP_JS = `(function(){var r=document.getElementById('__ID__');if(!r)return;r.classList.add('ts-js');
function shut(x){var o=r.querySelectorAll('.ts-open');for(var i=0;i<o.length;i++)if(o[i]!==x){o[i].classList.remove('ts-open');o[i].querySelector('.ts-btn').setAttribute('aria-expanded','false');}}
r.addEventListener('click',function(e){var b=e.target.closest('.ts-btn');if(!b)return;var li=b.parentNode,on=!li.classList.contains('ts-open');shut();li.classList.toggle('ts-open',on);b.setAttribute('aria-expanded',on?'true':'false');});
document.addEventListener('click',function(e){if(!r.contains(e.target))shut();});
r.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=r.querySelector('.ts-open');shut();if(o)o.querySelector('.ts-btn').focus();}});})();`;

const STRIP_CSS = `
.tstrip{container-type:inline-size;position:relative;margin:var(--s4,16px) 0;padding:var(--s3,12px) var(--s3,12px) var(--s2,8px);background:var(--card,var(--panel));border:1px solid var(--line,var(--hair));border-radius:var(--radius,3px);color:var(--fg,var(--ink));font-family:var(--sans,system-ui,sans-serif);max-width:none}
.tstrip p{margin:0}
.ts-head{font-size:15px;line-height:1.35}.ts-head b{font-family:var(--serif,Georgia,serif);font-size:18px}
.ts-k{display:block;font:700 11px/1.4 var(--sans,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase;color:var(--terracotta,#c4552d)}
.ts-facts{color:var(--muted,var(--ink-3));white-space:normal}
.ts-line{display:flex;list-style:none;margin:var(--s3,12px) 0 0;padding:0;--ts-y:22px;--ts-line:var(--accent,var(--brand))}
.ts-stop{flex:1 1 0;min-width:0;margin:0;position:static;text-align:center}
.ts-btn{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;min-height:72px;padding:calc(var(--ts-y) + 14px) 2px 2px;margin:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;border-radius:var(--radius,3px)}
.ts-btn::before{content:"";position:absolute;top:var(--ts-y);left:-50%;width:100%;height:6px;margin-top:-3px;background:var(--ts-line)}
.ts-stop:first-child .ts-btn::before{background:linear-gradient(90deg,transparent,var(--ts-line));opacity:.5}
.ts-btn:focus-visible{outline:3px solid var(--focus,#ffbf1f);outline-offset:-2px}
.ts-dot{position:absolute;top:var(--ts-y);left:50%;width:18px;height:18px;margin:-9px 0 0 -9px;box-sizing:border-box;border-radius:50%;background:var(--card,var(--panel));border:4px solid var(--ts-c,var(--ts-line));z-index:1;transition:transform .15s}
.ts-btn:hover .ts-dot,.ts-open .ts-dot{transform:scale(1.25)}
.ts-lab{display:block;margin-top:2px;font:600 12px/1.2 var(--sans,system-ui,sans-serif);overflow-wrap:anywhere;max-width:100%}
.ts-lg{display:none}
.ts-t{display:block;font:11px/1.3 var(--mono,ui-monospace,monospace);color:var(--muted,var(--ink-3));white-space:nowrap}
/* actor kinds: colour and shape, so the label never has to explain */
.ts-start,.ts-human{--ts-c:var(--terracotta,#c4552d)}
.ts-read{--ts-c:var(--river,#1f8a8a)}.ts-read .ts-dot{border-radius:3px;transform:rotate(45deg)}
.ts-agent{--ts-c:var(--accent,var(--brand))}.ts-agent .ts-dot{border-radius:3px}
.ts-sub-agent{--ts-c:var(--accent,var(--brand))}.ts-sub-agent .ts-dot{border-radius:3px;border-style:dotted}
.ts-deploy{--ts-c:var(--ok,#2b6a3c)}.ts-deploy .ts-dot{width:8px;margin-left:-4px;border-radius:2px;background:var(--ok,#2b6a3c);height:22px;margin-top:-11px}
.ts-burst .ts-dot{width:34px;margin-left:-17px;border-radius:999px;background:var(--brand-soft,var(--card));border-color:var(--accent,var(--brand))}
.ts-start .ts-dot{border-style:dashed;opacity:.75}.ts-start .ts-t{font-style:italic}
.ts-hyp .ts-dot{border-style:dashed}
.ts-live{--ts-c:var(--tram,#f2b705)}
.ts-live .ts-dot{width:34px;height:34px;margin:-17px 0 0 -17px;border:0;border-radius:0;background:var(--tram,#f2b705);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.ts-t .ts-s,.ts-live .ts-s{white-space:nowrap}
.ts-live .ts-lab{background:var(--tram,#f2b705);color:var(--on-tram,#121317);padding:1px 6px;border-radius:999px}
.ts-now{--ts-c:var(--ok,#2b6a3c)}.ts-now .ts-dot{background:var(--ok,#2b6a3c);box-shadow:0 0 0 4px var(--ok-soft,transparent)}
.ts-out{--ts-c:var(--live,#b42318)}.ts-out .ts-dot{border-radius:3px;background:var(--live,#b42318);transform:rotate(45deg)}
.ts-out .ts-lab,.ts-out .ts-t{color:var(--live,#b42318)}
@media (prefers-reduced-motion:no-preference){.ts-now .ts-dot{animation:ts-pulse 2.4s ease-out infinite}@keyframes ts-pulse{0%{box-shadow:0 0 0 0 var(--ok,#2b6a3c)}100%{box-shadow:0 0 0 10px transparent}}}
/* the details of a station: a panel under the line, the strip's width */
.ts-tip{display:none;position:absolute;left:0;right:0;top:100%;margin-top:-6px;z-index:10;padding:var(--s3,12px);background:var(--card,var(--panel));border:1px solid var(--rule-2,var(--line));border-top:4px solid var(--ts-c,var(--ts-line));border-radius:var(--radius,3px);box-shadow:var(--shadow,0 8px 24px rgba(0,0,0,.15));text-align:left;font-size:14px;line-height:1.45;overflow-wrap:anywhere}
.ts-tip p+p{margin-top:4px}.ts-th span{font-family:var(--mono,monospace);color:var(--muted,var(--ink-3));font-size:12px}.ts-th em{font-size:12px;color:var(--warn,#8a5200)}
.ts-who{font-weight:600}.ts-ev{font-size:13px;color:var(--muted,var(--ink-3))}
.tstrip:not(.ts-js) .ts-stop:hover .ts-tip,.tstrip:not(.ts-js) .ts-stop:focus-within .ts-tip,.ts-open .ts-tip{display:block}
.ts-foot{margin-top:var(--s1,4px);font-size:13px;color:var(--muted,var(--ink-3))}.ts-foot a{font-weight:600}
/* density: about 6 stations on a phone, 9 on a tablet, 14 on a desktop */
.ts-l1,.ts-l2{display:none}
.ts-q0 .ts-btn::before{background:repeating-linear-gradient(90deg,var(--ts-line) 0 6px,transparent 6px 11px)}
.ts-o0 .ts-btn::before{background:repeating-linear-gradient(135deg,var(--live,#b42318) 0 5px,var(--live-soft,transparent) 5px 9px);height:8px;margin-top:-4px}
@container (min-width:560px){
 .ts-l1{display:block}
 .ts-q0 .ts-btn::before{background:var(--ts-line)}
 .ts-q1 .ts-btn::before{background:repeating-linear-gradient(90deg,var(--ts-line) 0 6px,transparent 6px 11px)}
 .ts-o0 .ts-btn::before{height:6px;margin-top:-3px;background:var(--ts-line)}
 .ts-o1 .ts-btn::before{background:repeating-linear-gradient(135deg,var(--live,#b42318) 0 5px,var(--live-soft,transparent) 5px 9px);height:8px;margin-top:-4px}
 .ts-head b{font-size:20px}
}
@container (min-width:900px){
 .ts-l2{display:block}
 .ts-q1 .ts-btn::before{background:var(--ts-line)}
 .ts-q2 .ts-btn::before{background:repeating-linear-gradient(90deg,var(--ts-line) 0 6px,transparent 6px 11px)}
 .ts-o1 .ts-btn::before{height:6px;margin-top:-3px;background:var(--ts-line)}
 .ts-o2 .ts-btn::before{background:repeating-linear-gradient(135deg,var(--live,#b42318) 0 5px,var(--live-soft,transparent) 5px 9px);height:8px;margin-top:-4px}
 .ts-s{display:none}.ts-lg{display:inline}
 .ts-stop:first-child .ts-btn::before{background:linear-gradient(90deg,transparent,var(--ts-line))}
}
`;
