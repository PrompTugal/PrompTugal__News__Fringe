// The workflow is the picture: one trace (team/<id>/traces/*.json, lisbon-fringe-trace/1) drawn as a swim-lane
// timeline, at /traces/<event_id>/ (a draft, not linked yet). designer.fringe@PrompTugal.angelo for
// conductor.fringe@PrompTugal.angelo, at Angelo's ask, 11 November 2026 (WS-215).
// One lane per kind of actor, time left to right on a desktop and top to bottom on a phone. Hand-offs are drawn
// only where two steps share a piece of evidence (a commit or a run), so every line is in the record. Idle stretches
// over five minutes are folded into a hatched break; dense bursts in one lane fold into one group you can open.
// The layout is computed here, in units of 0 to 1000 along time, so CSS alone places the marks (no JS for layout);
// JS only opens a step's details. Without JS every mark is a link to its line in the ordered list under the picture.
// No libraries, no fonts, no third-party requests. Every value from the trace goes through esc().

const REPO_DEFAULT = 'https://github.com/PrompTugal/PrompTugal__News__Fringe';
const GAP = 300;          // seconds of quiet that fold into a break
const BREAK = 34;         // units a break takes
const PAD = 16;           // units before the first and after the last moment
const MIN = 13;           // units between two marks in one lane
const GROUP_GAP = 75;     // seconds between steps in one lane that make a burst
const GROUP_MIN = 5;      // steps in a burst before it folds into a group
const LH = 60;            // lane height (px) on a desktop; the CSS uses the same number

const LANES = [
  { id: 'people', label: 'People', short: 'People', note: 'humans: their steps are rarely timed' },
  { id: 'source', label: "Organiser's page", short: 'Source', note: 'the public page, and each time it was read' },
  { id: 'research', label: 'Researchers', short: 'Research', note: 'agents that read sources and write the entry' },
  { id: 'lead', label: 'Lead and conductors', short: 'Lead', note: 'routing, merging, and their sub-agents' },
  { id: 'build', label: 'Builders and designers', short: 'Build', note: 'agents that change the page builder' },
  { id: 'ci', label: 'CI and deploys', short: 'CI', note: 'runs (open dot) and deploys (version tick)' },
];
const laneOf = (s) => {
  const who = String(s.who || '');
  if (s.kind === 'source-read' || /\borganiser\b/i.test(who)) return 'source';
  if (s.kind === 'human') return 'people';
  if (s.kind === 'ci' || s.kind === 'deploy') return 'ci';
  if (/^researcher/i.test(who)) return 'research';
  if (s.kind === 'sub-agent' || /^(a sub-agent of )?conductor/i.test(who)) return 'lead';
  return 'build';
};

const KIND_WORD = { human: 'person', agent: 'agent', 'sub-agent': 'sub-agent', 'source-read': 'source read', ci: 'CI run', deploy: 'deploy' };
const ms = (t) => { const v = Date.parse(t); return Number.isFinite(v) ? v : NaN; };
const hms = (t) => (Number.isFinite(t) ? new Date(t).toISOString().slice(11, 19) : 'unknown');
const hm = (t) => new Date(t).toISOString().slice(11, 16);
const dur = (a, b) => { const s = Math.round((b - a) / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h} h ${m} min` : r ? `${m} min ${r} s` : `${m} min`; };
const num = (x) => Math.round(x * 10) / 10;
const shortWho = (w) => String(w || '').replace(/\.fringe@PrompTugal\.\w+$/, '').replace(/@[\w.]+$/, '');
const firstTime = (s) => { const m = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)\s*(?:\((v[\d.]+))?/.exec(String(s || '')); return m ? { t: ms(m[1]), v: m[2] || '' } : null; };

export function traceBody(trace, esc, opts = {}) {
  const repo = opts.repo || REPO_DEFAULT;
  const raw = Array.isArray(trace.steps) ? trace.steps : [];
  const totals = trace.totals || {};
  const steps = raw.map((s, i) => {
    const n = Number(s.n) || i + 1, t = ms(s.t), before = ms(s.before);
    const untimed = !Number.isFinite(t);
    return { ...s, n, ts: untimed ? before : t, untimed, lane: laneOf(s), hyp: s.label === 'hypothesis' };
  }).filter((s) => Number.isFinite(s.ts));
  const lanes = LANES.filter((l) => steps.some((s) => s.lane === l.id));
  const li = Object.fromEntries(lanes.map((l, i) => [l.id, i]));

  // --- milestones and the outage, from the record -------------------------------------------------------------
  const firstLive = firstTime(totals.page_first_live), liveNow = firstTime(totals.live_at);
  const day = (steps.find((s) => !s.untimed)?.t || '').slice(0, 10);
  const outages = [];
  for (const s of steps) {
    const m = /\bfailed\b/i.test(s.what || '') && /from (\d\d:\d\d:\d\d) to (\d\d:\d\d:\d\d)/.exec(s.what || '');
    if (m && day) {
      const runs = /runs? (\d+) to (\d+)/.exec(s.what), stuck = /stayed at (v[\d.]+)/.exec(s.what);
      outages.push({ from: ms(`${day}T${m[1]}Z`), to: ms(`${day}T${m[2]}Z`), n: s.n,
        runs: runs ? +runs[2] - +runs[1] + 1 : 0, label: runs ? `runs ${runs[1]} to ${runs[2]} failed` : 'deploys failed', stuck: stuck ? stuck[1] : '' });
    }
  }
  const milestoneStep = firstLive && steps.find((s) => s.kind === 'deploy' && s.version === firstLive.v);

  // --- items: single steps, or a burst folded into a group -----------------------------------------------------
  const items = [];
  for (const l of lanes) {
    const ls = steps.filter((s) => s.lane === l.id).sort((a, b) => a.ts - b.ts || a.n - b.n);
    let run = [];
    const flush = () => {
      if (run.length >= GROUP_MIN) items.push({ group: true, lane: l.id, steps: run, t0: run[0].ts, t1: run[run.length - 1].ts });
      else for (const s of run) items.push({ lane: l.id, steps: [s], t0: s.ts, t1: s.ts });
      run = [];
    };
    for (const s of ls) {
      const solo = s.untimed || s === milestoneStep;
      if (solo) { flush(); items.push({ lane: l.id, steps: [s], t0: s.ts, t1: s.ts }); continue; }
      if (run.length && s.ts - run[run.length - 1].ts > GROUP_GAP * 1000) flush();
      run.push(s);
    }
    flush();
  }

  // --- the time axis: linear within activity, idle stretches folded -------------------------------------------
  const moments = [...new Set([...items.flatMap((it) => [it.t0, it.t1]), ...outages.flatMap((o) => [o.from, o.to]),
    ...(firstLive ? [firstLive.t] : []), ...(liveNow ? [liveNow.t] : [])].filter(Number.isFinite))].sort((a, b) => a - b);
  const befores = new Set(steps.filter((s) => s.untimed).map((s) => s.ts));
  const room = (t) => (befores.has(t) ? MIN + 8 : 0);   // an untimed step sits just before its "before": keep it out of the break
  const breaks = [];
  let active = 0;
  for (let i = 1; i < moments.length; i++) { const g = (moments[i] - moments[i - 1]) / 1000; if (g > GAP) breaks.push([moments[i - 1], moments[i]]); else active += g; }
  const rate = (1000 - 2 * PAD - breaks.reduce((a, [, b]) => a + BREAK + room(b), 0)) / Math.max(active, 1);
  const anchors = [[moments[0], PAD]];
  for (let i = 1; i < moments.length; i++) {
    const g = (moments[i] - moments[i - 1]) / 1000;
    anchors.push([moments[i], anchors[i - 1][1] + (g > GAP ? BREAK + room(moments[i]) : g * rate)]);
  }
  const at = (t) => {
    if (t <= anchors[0][0]) return anchors[0][1];
    for (let i = 1; i < anchors.length; i++) if (t <= anchors[i][0]) {
      const [ta, ua] = anchors[i - 1], [tb, ub] = anchors[i];
      return tb === ta ? ub : ua + (ub - ua) * (t - ta) / (tb - ta);
    }
    return anchors[anchors.length - 1][1];
  };

  // place, then keep MIN units between neighbours in a lane (untimed steps sit just before their "before")
  for (const it of items) {
    it.p = at(it.t0) - (it.steps[0].untimed ? MIN : 0);
    it.w = it.group ? Math.max(at(it.t1) - at(it.t0), 26) : 0;
  }
  for (const l of lanes) {
    const li_ = items.filter((it) => it.lane === l.id).sort((a, b) => a.p - b.p);
    for (let i = 1; i < li_.length; i++) { const prev = li_[i - 1], need = prev.p + prev.w + MIN; if (li_[i].p < need) li_[i].p = need; }
  }
  const maxEnd = Math.max(...items.map((it) => it.p + it.w));
  const scale = maxEnd > 1000 - 4 ? (1000 - 4) / maxEnd : 1;   // a squeeze if the nudges ran past the end
  for (const it of items) { it.p *= scale; it.w *= scale; it.c = it.p + it.w / 2; }
  const P = (t) => at(t) * scale;
  const itemOf = new Map(); for (const it of items) for (const s of it.steps) itemOf.set(s.n, it);

  // --- hand-offs: two steps in different lanes that share evidence ---------------------------------------------
  const byTime = [...steps].sort((a, b) => a.ts - b.ts || a.n - b.n);
  const links = new Map();
  byTime.forEach((s, i) => {
    const ev = new Set((s.evidence || []).map(String).filter((e) => /^[0-9a-f]{7,40}$|^https:\/\/github\.com\/.*\/runs\/\d+/.test(e)));
    for (let j = i - 1; j >= 0; j--) {
      const q = byTime[j];
      if (!(q.evidence || []).some((e) => ev.has(String(e)))) continue;
      const a = itemOf.get(q.n), b = itemOf.get(s.n);
      if (a !== b) links.set(`${items.indexOf(a)}-${items.indexOf(b)}`, { a, b, run: q.lane === 'ci' && s.lane === 'ci', human: q.lane === 'people' });
      break;
    }
  });
  const yH = (it) => (li[it.lane] + 0.5) * LH, xV = (it) => (li[it.lane] + 0.5) * 100;
  const pathH = ({ a, b }) => { const x1 = num(a.group ? a.p + a.w : a.p), x2 = num(b.group ? b.p : b.p), y1 = yH(a), y2 = yH(b), m = num((x1 + x2) / 2);
    return y1 === y2 ? `M${x1} ${y1}H${x2}` : `M${x1} ${y1}C${m} ${y1} ${m} ${y2} ${x2} ${y2}`; };
  const pathV = ({ a, b }) => { const y1 = num(a.group ? a.p + a.w : a.p), y2 = num(b.p), x1 = xV(a), x2 = xV(b), m = num((y1 + y2) / 2);
    return x1 === x2 ? `M${x1} ${y1}V${y2}` : `M${x1} ${y1}C${x1} ${m} ${x2} ${m} ${x2} ${y2}`; };
  const linkCls = (k) => (k.run ? 'run' : k.human ? 'hand human' : 'hand');
  const svgH = `<svg class="tr-svg tr-h" viewBox="0 0 1000 ${lanes.length * LH}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${[...links.values()].map((k) => `<path class="${linkCls(k)}" d="${pathH(k)}"/>`).join('')}</svg>`;
  const svgV = `<svg class="tr-svg tr-v" viewBox="0 0 ${lanes.length * 100} 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">${[...links.values()].map((k) => `<path class="${linkCls(k)}" d="${pathV(k)}"/>`).join('')}</svg>`;

  // --- marks ----------------------------------------------------------------------------------------------------
  const sv = (o) => Object.entries(o).map(([k, v]) => `--${k}:${typeof v === 'number' ? num(v) : v}`).join(';');
  const describe = (s) => `${s.untimed ? `time unknown, before ${hms(ms(s.before))}` : hms(s.ts)} UTC, ${KIND_WORD[s.kind] || s.kind}, ${shortWho(s.who)}${s.hyp ? ', hypothesis' : ''}: ${String(s.what || '').slice(0, 140)}`;
  let dn = 0;
  const marks = items.slice().sort((a, b) => a.p - b.p).map((it) => {
    const i = li[it.lane];
    if (it.group) {
      const ss = it.steps, kinds = new Set(ss.map((s) => s.kind));
      const vers = ss.filter((s) => s.kind === 'deploy' && s.version).map((s) => s.version);
      const isCi = kinds.has('deploy') || kinds.has('ci');
      const noun = isCi ? `${ss.filter((s) => s.kind === 'ci').length} runs, ${vers.length} deploys` : `${ss.length} commits by ${new Set(ss.map((s) => s.who)).size} agents`;
      const lab = `${noun}, ${hms(it.t0)} to ${hms(it.t1)} UTC${vers.length ? `, ${vers[0]} to ${vers[vers.length - 1]}` : ''}. Open the group.`;
      return `<a class="tr-g l-${it.lane}" href="#s-${ss[0].n}" data-s="${ss.map((s) => s.n).join(',')}" style="${sv({ p: it.p, w: it.w, i })}" aria-label="${esc(lab)}"><span class="n">${ss.length}</span><span class="gl" aria-hidden="true">${isCi ? 'runs and deploys' : 'commits'}</span></a>`;
    }
    const s = it.steps[0], ms_ = s === milestoneStep;
    const cls = ['tr-m', `k-${s.kind}`, s.kind === 'deploy' && !ms_ && dn++ % 2 ? 'alt' : '', s.untimed ? 'untimed' : '', s.hyp ? 'hyp' : '', ms_ ? 'star' : ''].filter(Boolean).join(' ');
    const ver = s.kind === 'deploy' && s.version ? `<span class="ver" aria-hidden="true">${esc(ms_ ? s.version : String(s.version).split('.').pop())}</span>` : '';
    const whisk = s.untimed ? `<span class="tr-whisk" style="${sv({ p: it.p, i, len: Math.min(it.p, 34) })}" aria-hidden="true"></span>` : '';
    return `${whisk}<a class="${cls}" href="#s-${s.n}" data-s="${s.n}" style="${sv({ p: it.p, i })}" aria-label="${esc(describe(s))}">${s.hyp ? '<span class="q" aria-hidden="true">?</span>' : ''}${ver}</a>`;
  }).join('');

  // --- axis: ticks at the start of each stretch of activity, hatched breaks between ---------------------------
  const ticks = [];
  let last = -1e9;
  const tick = (t) => { const p = P(t); if (p - last < 52) return; last = p; ticks.push(`<span class="tr-tick" style="${sv({ p })}">${esc(hm(t))}</span>`); };
  tick(moments[0]);
  for (const [a, b] of breaks) tick(b);
  const brk = breaks.map(([a, b]) => { const p = P(a) + 3, q = P(b) - 3 - room(b) * scale; return q > p ? `<span class="tr-brk" style="${sv({ p, w: q - p })}" title="${esc(`${dur(a, b)} with no step in the record`)}"><span>+${Math.round((b - a) / 60000)} min</span></span>` : ''; }).join('');
  const lines = [];
  if (firstLive) lines.push(`<span class="tr-line first" style="${sv({ p: P(firstLive.t) })}"><span class="tr-chip">First live ${esc(hms(firstLive.t))}${firstLive.v ? ` · ${esc(firstLive.v)}` : ''}</span></span>`);
  if (liveNow) lines.push(`<span class="tr-line now" style="${sv({ p: P(liveNow.t) })}"><span class="tr-chip">Live ${esc(hms(liveNow.t))}${liveNow.v ? ` · ${esc(liveNow.v)}` : ''}</span></span>`);
  const outs = li.ci === undefined ? '' : outages.map((o) => `<a class="tr-out" href="#s-${o.n}" data-s="${o.n}" style="${sv({ p: P(o.from), w: Math.max(P(o.to) - P(o.from), 8), i: li.ci })}" aria-label="${esc(`${o.label}, ${hms(o.from)} to ${hms(o.to)} UTC${o.stuck ? `: the site stayed at ${o.stuck}` : ''}`)}"><span aria-hidden="true">${o.runs ? `${o.runs} × failed` : 'failed'}</span></a>`).join('');
  const bands = lanes.map((l, i) => `<span class="tr-band" style="${sv({ i })}"></span><span class="tr-lab" style="${sv({ i })}"><b>${esc(l.label)}</b><small>${esc(l.note)}</small></span>`).join('');

  // --- the header strip ----------------------------------------------------------------------------------------
  const firstRead = steps.filter((s) => s.kind === 'source-read' && !s.untimed).sort((a, b) => a.ts - b.ts)[0];
  const firstTimed = steps.filter((s) => !s.untimed).sort((a, b) => a.ts - b.ts)[0];
  const failed = outages.reduce((a, o) => a + o.runs, 0);
  const stat = (v, k) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`;
  const stats = [
    firstRead && firstLive ? stat(dur(firstRead.ts, firstLive.t), 'first read of the source to page live') : '',
    firstTimed && firstLive ? stat(dur(firstTimed.ts, firstLive.t), 'first timed step to page live') : '',
    totals.humans != null ? stat(totals.humans, 'people') : '',
    totals.agents != null ? stat(totals.agents, 'agents') : '',
    totals.commits != null ? stat(totals.commits, 'commits') : '',
    totals.deploys != null ? stat(failed ? `${totals.deploys} + ${failed} failed` : totals.deploys, 'deploys') : '',
    stat(steps.length, 'steps'),
  ].join('');

  // --- the text alternative: every step, in order ---------------------------------------------------------------
  const evLink = (e) => {
    e = String(e);
    if (/^[0-9a-f]{7,40}$/.test(e)) return `<a href="${esc(`${repo}/commit/${e}`)}"><code>${esc(e.slice(0, 7))}</code></a>`;
    if (/^https:\/\//.test(e)) { let txt = e; try { const u = new URL(e); const r = /\/runs\/(\d+)/.exec(u.pathname); txt = r ? `run ${r[1]}` : u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, ''); } catch {} return `<a href="${esc(e)}">${esc(txt)}</a>`; }
    if (/^[\w][\w./-]*$/.test(e) && !e.includes('..')) return `<a href="${esc(`${repo}/blob/dev/${e}`)}"><code>${esc(e)}</code></a>`;
    return esc(e);
  };
  const runLink = (r) => { const m = /run (\d+)/.exec(String(r || '')); return m ? `<a href="${esc(`${repo}/actions/runs/${m[1]}`)}">run ${esc(m[1])}</a>` : esc(r); };
  const listed = [...steps].sort((a, b) => a.n - b.n).map((s) => {
    const meta = [s.model ? `model: ${esc(s.model)}` : '', s.work_item ? `work item: ${esc(s.work_item)}` : '',
      s.on_dev ? `on dev: ${evLink(s.on_dev)}` : '', s.published_by ? `published by: ${runLink(s.published_by)}` : '',
      s.label_session === 'hypothesis' ? 'its session is a hypothesis' : '', s.note ? esc(s.note) : ''].filter(Boolean).join(' · ');
    return `<li id="s-${s.n}" class="k-${esc(s.kind)}${s.hyp ? ' hyp' : ''}${s.untimed ? ' untimed' : ''}" value="${s.n}">
<p class="s-h"><span class="s-t">${s.untimed ? `before ${esc(hms(ms(s.before)))}` : esc(hms(s.ts))}</span> <span class="s-kd">${esc(KIND_WORD[s.kind] || s.kind)}</span> <span class="s-lb ${s.hyp ? 'hyp' : 'fact'}">${s.hyp ? 'hypothesis' : 'fact'}</span></p>
<p class="s-who">${esc(s.who)}</p><p class="s-what">${esc(s.what)}</p>
<p class="s-ev">Evidence: ${(s.evidence || []).map(evLink).join(', ') || 'none'}${meta ? `<br><span class="s-meta">${meta}</span>` : ''}</p></li>`;
  }).join('');
  const gaps = (trace.gaps || []).map((g) => `<li>${esc(g)}</li>`).join('');
  const nUntimed = steps.filter((s) => s.untimed).length, nHyp = steps.filter((s) => s.hyp).length;
  const name = opts.eventName || trace.event_id;

  return `<style>${traceCss}</style><article class="tr">
<p class="tr-kick">Trace · draft</p>
<h1>How this page was made</h1>
<p class="tr-dek">Every step that made <a href="${esc(trace.page || '#')}">${esc(name)}</a>, from the record: who did what, and when, from the first commit to the page live. The workflow is the picture.</p>
<dl class="tr-stats">${stats}</dl>
<ul class="tr-key" aria-label="Key">
<li><i class="k k-human"></i>person</li><li><i class="k k-human untimed"></i>person, time unknown</li><li><i class="k k-source-read"></i>source read</li><li><i class="k k-agent"></i>agent commit</li><li><i class="k k-sub-agent"></i>sub-agent</li><li><i class="k k-ci"></i>CI run</li><li><i class="k k-deploy"></i>deploy (version)</li><li><i class="k hyp k-agent"></i>hypothesis</li><li><i class="k grp"></i>a burst, folded</li><li><i class="k out"></i>failed deploys</li><li><i class="k hand"></i>hand-off (shared evidence)</li>
</ul>
<figure class="tr-fig" aria-labelledby="tr-cap">
<div class="tr-heads" aria-hidden="true" style="${sv({ lanes: lanes.length })}">${lanes.map((l) => `<span>${esc(l.short)}</span>`).join('')}</div>
<div class="tr-scroll"><div class="tr-plot" style="${sv({ lanes: lanes.length })}">${bands}
<div class="tr-track">${brk}${ticks.join('')}${lines.join('')}${svgH}${svgV}${outs}${marks}</div></div></div>
<figcaption id="tr-cap" class="muted">${steps.length} steps in ${lanes.length} lanes, ${nUntimed} of them untimed (hollow, with a dashed tail: some time before) and ${nHyp} a hypothesis (dashed, with a question mark). Quiet stretches over ${GAP / 60} minutes are folded (hatched). Lines join two steps only where they share a commit or a run. Tap a mark for its evidence; the same steps are listed in order below.</figcaption>
</figure>
<div id="tr-detail" class="tr-detail" role="dialog" aria-modal="false" aria-labelledby="tr-detail-h" hidden></div>
<section class="tr-gaps" aria-labelledby="tr-gaps-h"><h2 id="tr-gaps-h">What the record cannot show</h2><ul>${gaps}</ul></section>
<h2 id="tr-list-h">Every step, in order</h2>
<ol class="tr-steps" aria-labelledby="tr-list-h">${listed}</ol>
<p class="muted">Traced by ${esc(trace.traced_by || 'unknown')} at ${esc(trace.traced_at || 'unknown')}, repository head <code>${esc(trace.repo_head || '')}</code>. ${esc(trace.privacy || '')}</p>
</article>
<script>${traceJs}</script>`;
}

const traceJs = `(function(){
var fig=document.querySelector('.tr-fig'),box=document.getElementById('tr-detail');if(!fig||!box)return;var from=null;
function step(n){return document.getElementById('s-'+n);}
function close(){box.hidden=true;box.innerHTML='';var c=fig.querySelector('[aria-current]');if(c)c.removeAttribute('aria-current');if(from){from.focus();from=null;}}
function head(t){return '<div class="tr-dh"><h2 id="tr-detail-h">'+t+'</h2><button type="button" class="tr-x" aria-label="Close">×</button></div>';}
function one(n,back){var li=step(n);if(!li)return;box.innerHTML=head('Step '+n)+(back?'<button type="button" class="tr-back" data-back="'+back+'">Back to the group</button>':'')+'<div class="tr-db">'+li.innerHTML+'</div>';}
function many(ns,label){var h='<ul class="tr-gl">';ns.forEach(function(n){var li=step(n);if(!li)return;var t=li.querySelector('.s-t').textContent,w=li.querySelector('.s-who').textContent,x=li.querySelector('.s-what').textContent;h+='<li><button type="button" data-n="'+n+'"><span class="s-t">'+t+'</span> <b></b> <span></span></button></li>';});box.innerHTML=head(label)+h+'</ul>';
var bs=box.querySelectorAll('[data-n]');for(var i=0;i<bs.length;i++){var li=step(bs[i].getAttribute('data-n'));bs[i].querySelector('b').textContent=li.querySelector('.s-who').textContent.replace(/\\.fringe@PrompTugal\\.\\w+$/,'');bs[i].querySelector('span:last-child').textContent=li.querySelector('.s-what').textContent.slice(0,110);}}
fig.addEventListener('click',function(e){var a=e.target.closest('a[data-s]');if(!a)return;e.preventDefault();var c=fig.querySelector('[aria-current]');if(c)c.removeAttribute('aria-current');a.setAttribute('aria-current','true');from=a;var ns=a.getAttribute('data-s').split(',');
if(ns.length>1){many(ns,a.getAttribute('aria-label').replace(/ Open the group\\.$/,''));box.setAttribute('data-group',ns.join(','));}else{one(ns[0]);box.removeAttribute('data-group');}box.hidden=false;var f=box.querySelector('button');if(f)f.focus();});
box.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.classList.contains('tr-x'))return close();if(b.hasAttribute('data-n')){one(b.getAttribute('data-n'),'1');box.querySelector('.tr-back').focus();return;}if(b.hasAttribute('data-back')){var ns=box.getAttribute('data-group').split(',');many(ns,from.getAttribute('aria-label').replace(/ Open the group\\.$/,''));box.querySelector('[data-n]').focus();}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!box.hidden)close();});
})();`;

export const traceCss = `
.tr{--lh:${LH}px;--ax:56px;--gut:168px;--v:1.55px;--hd:40px;max-width:none}
.tr>p,.tr>h1,.tr>h2,.tr>ol,.tr>section{max-width:48rem}
.tr-kick{margin:var(--s4) 0 0;font:600 var(--fs-label)/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--terracotta)}
.tr h1{margin-top:.2em}.tr-dek{font-size:var(--fs-dek);color:var(--ink-2);margin:0 0 var(--s4)}
.tr-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;margin:0 0 var(--s4);background:var(--hair);border:1px solid var(--hair);border-radius:var(--radius);max-width:none}
.tr-stats div{background:var(--panel);padding:var(--s2) var(--s3)}.tr-stats dt{font-size:var(--fs-label);color:var(--ink-3);line-height:1.3;order:2}.tr-stats div{display:flex;flex-direction:column-reverse;justify-content:flex-end}
.tr-stats dd{margin:0;font:600 var(--fs-hed)/1.2 var(--serif);font-variant-numeric:tabular-nums;color:var(--ink)}
.tr-stats div:first-child{background:var(--tram-soft)}.tr-stats div:first-child dd{color:var(--ink)}
.tr-key{display:flex;flex-wrap:wrap;gap:var(--s1) var(--s4);list-style:none;padding:0;margin:0 0 var(--s3);font-size:var(--fs-meta);color:var(--ink-2);max-width:none}
.tr-key li{display:flex;align-items:center;gap:6px;margin:0}
.tr-fig{margin:0 0 var(--s4);border:1px solid var(--hair);border-radius:var(--radius);background:var(--panel);padding:var(--s2) 0 var(--s3);max-width:none}
.tr-fig figcaption{padding:var(--s2) var(--s3) 0;max-width:48rem}
.tr-scroll{overflow-x:auto;overscroll-behavior-x:contain}
.tr-plot{position:relative;min-width:880px;height:calc(var(--ax) + var(--lanes) * var(--lh) + 8px)}
.tr-heads{display:none}
.tr-band{position:absolute;left:var(--gut);right:0;top:calc(var(--ax) + var(--i) * var(--lh));height:var(--lh);border-top:1px solid var(--hair)}
.tr-band:nth-of-type(4n+1){background:var(--paper)}
.tr-lab{position:absolute;left:var(--s3);width:calc(var(--gut) - var(--s4));top:calc(var(--ax) + var(--i) * var(--lh));height:var(--lh);display:flex;flex-direction:column;justify-content:center;line-height:1.2}
.tr-lab b{font-size:var(--fs-ui);font-weight:600}.tr-lab small{font-size:11px;color:var(--ink-3)}
.tr-track{position:absolute;left:calc(var(--gut) + 14px);right:22px;top:0;bottom:0}
.tr-svg{position:absolute;left:0;top:var(--ax);width:100%;height:calc(var(--lanes) * var(--lh));overflow:visible;pointer-events:none}.tr-v{display:none}
.tr-svg path{fill:none;stroke:var(--rule-2);stroke-width:1.5;vector-effect:non-scaling-stroke;opacity:.8}
.tr-svg path.human{stroke:var(--terracotta);stroke-width:2}.tr-svg path.run{stroke:var(--ok);stroke-width:3;opacity:.45}
.tr-tick{position:absolute;left:calc(var(--p) * .1%);top:30px;transform:translateX(-50%);font:600 11px/1 var(--mono);color:var(--ink-3);white-space:nowrap}
.tr-tick::after{content:"";position:absolute;left:50%;top:14px;height:8px;border-left:1px solid var(--rule-2)}
.tr-brk{position:absolute;left:calc(var(--p) * .1%);width:calc(var(--w) * .1%);top:var(--ax);bottom:8px;background:repeating-linear-gradient(135deg,transparent 0 5px,var(--hair) 5px 7px);border-inline:1px dashed var(--rule-2)}
.tr-brk span{position:absolute;top:4px;left:50%;transform:translateX(-50%) rotate(180deg);writing-mode:vertical-rl;font:11px/1 var(--mono);color:var(--ink-3);white-space:nowrap;background:var(--panel);padding:3px 1px}
.tr-line{position:absolute;left:calc(var(--p) * .1%);top:6px;bottom:8px;border-left:2px dashed var(--ok)}
.tr-line.first{border-left:3px solid var(--tram)}
.tr-chip{position:absolute;top:0;left:-1px;transform:translateX(-50%);font:600 11px/1.2 var(--sans);white-space:nowrap;padding:3px 6px;border-radius:var(--radius-pill);background:var(--ok-soft);color:var(--ink);border:1px solid var(--ok)}
.tr-line.first .tr-chip{background:var(--tram);color:var(--on-tram);border-color:var(--tram);transform:translateX(-100%)}
.tr-line.now .tr-chip{transform:translateX(-100%)}
.tr-m,.tr-g,.tr-out{position:absolute;text-decoration:none;color:var(--ink)}
.tr-m{left:calc(var(--p) * .1%);top:calc(var(--ax) + (var(--i) + .5) * var(--lh));width:24px;height:24px;margin:-12px 0 0 -12px;display:grid;place-items:center;border-radius:50%;z-index:2}
.tr-m::before{content:"";width:12px;height:12px;box-sizing:border-box;background:var(--c,var(--brand));border:2px solid var(--c,var(--brand))}
.k-human{--c:var(--terracotta)}.k-source-read{--c:var(--river)}.k-agent{--c:var(--brand)}.k-sub-agent{--c:var(--brand)}.k-ci{--c:var(--ink-3)}.k-deploy{--c:var(--ok)}
.tr-m.k-human::before,.k.k-human{border-radius:50%;width:14px;height:14px}
.tr-m.k-source-read::before,.k.k-source-read{transform:rotate(45deg)}
.tr-m.k-sub-agent::before,.k.k-sub-agent{background:transparent;border-style:dotted;border-width:2px}
.tr-m.k-ci::before,.k.k-ci{border-radius:50%;background:var(--panel);width:10px;height:10px}
.tr-m.k-deploy::before,.k.k-deploy{width:4px;height:18px;border-width:0;border-radius:1px}
.tr-m.untimed::before,.k.untimed{background:transparent;border-style:dashed}
.tr-m.hyp::before,.k.hyp{background:transparent;border-style:dashed;outline:2px dashed var(--c);outline-offset:2px}
.tr-m .q{position:absolute;top:-10px;right:-8px;font:700 12px/1 var(--sans);color:var(--c)}
.tr-m .ver{position:absolute;top:22px;left:50%;transform:translateX(-50%);font:600 10px/1 var(--mono);color:var(--ok);white-space:nowrap}
.tr-m.alt .ver{top:-12px}
.tr-m.star{width:34px;height:34px;margin:-17px 0 0 -17px;z-index:3}
.tr-m.star::before{width:22px;height:22px;border:2px solid var(--ink);background:var(--tram);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.tr-m.star .ver{top:30px;color:var(--ink);background:var(--tram);padding:2px 4px;border-radius:var(--radius)}
.tr-whisk{position:absolute;left:calc((var(--p) - var(--len)) * .1%);width:calc(var(--len) * .1%);top:calc(var(--ax) + (var(--i) + .5) * var(--lh));border-top:2px dashed var(--terracotta);opacity:.7;-webkit-mask:linear-gradient(90deg,transparent,#000);mask:linear-gradient(90deg,transparent,#000)}
.tr-g{left:calc(var(--p) * .1%);width:calc(var(--w) * .1%);min-width:28px;top:calc(var(--ax) + (var(--i) + .5) * var(--lh));height:26px;margin-top:-13px;display:flex;align-items:center;gap:6px;padding:0 8px;border-radius:var(--radius-pill);background:var(--brand-soft);border:2px solid var(--brand);font:600 12px/1 var(--sans);overflow:hidden;white-space:nowrap;z-index:2}
.tr-g.l-ci{background:var(--ok-soft);border-color:var(--ok)}
.tr-g .n{font-variant-numeric:tabular-nums}.tr-g .gl{font-weight:400;color:var(--ink-2);overflow:hidden;text-overflow:ellipsis}
.tr-g:hover,.tr-m:hover{filter:brightness(1.1)}.tr-g:hover{border-style:dashed}
.tr-out{left:calc(var(--p) * .1%);width:calc(var(--w) * .1%);top:calc(var(--ax) + var(--i) * var(--lh) + 6px);height:calc(var(--lh) - 12px);background:repeating-linear-gradient(135deg,var(--live-soft) 0 6px,transparent 6px 9px);border:2px solid var(--live);border-radius:var(--radius);display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;font:700 11px/1 var(--sans);color:var(--live);z-index:1}
.tr [aria-current]{outline:3px solid var(--focus);outline-offset:1px;box-shadow:0 0 0 5px var(--focus-ink)}
.tr-key .k{display:inline-block;width:12px;height:12px;box-sizing:border-box;background:var(--c,var(--brand));border:2px solid var(--c,var(--brand));flex:none}
.tr-key .k.untimed,.tr-key .k.hyp{background:transparent;border-style:dashed}
.tr-key .k.grp{width:22px;border-radius:var(--radius-pill);background:var(--brand-soft);border-color:var(--brand)}
.tr-key .k.out{width:22px;background:var(--live-soft);border-color:var(--live)}
.tr-key .k.hand{width:22px;height:0;border:0;border-top:2px solid var(--rule-2);background:none}
.tr-key .k.k-deploy{width:4px;height:14px}
.tr-detail{position:fixed;z-index:20;right:var(--s4);bottom:var(--s4);width:min(26rem,calc(100vw - 2 * var(--gutter)));max-height:min(70vh,34rem);overflow:auto;background:var(--panel);color:var(--ink);border:1px solid var(--rule-2);border-top:4px solid var(--brand);border-radius:var(--radius);box-shadow:var(--shadow);padding:var(--s3) var(--s4);font-size:var(--fs-ui);overflow-wrap:anywhere}
.tr-dh{display:flex;justify-content:space-between;align-items:start;gap:var(--s2)}.tr-dh h2{margin:0;padding:0;border:0;font-size:var(--fs-dek)}
.tr-x,.tr-back,.tr-gl button{font:inherit;color:var(--ink);background:var(--paper-2);border:1px solid var(--hair);border-radius:var(--radius);cursor:pointer;min-height:36px}
.tr-x{min-width:36px;font-size:20px;line-height:1}.tr-back{margin:var(--s2) 0;padding:0 var(--s3)}
.tr-gl{list-style:none;padding:0;margin:var(--s2) 0 0}.tr-gl li{margin:4px 0}.tr-gl button{display:block;width:100%;text-align:left;padding:6px 8px;line-height:1.35}.tr-gl .s-t{font-family:var(--mono);color:var(--ink-3)}
.tr-db p,.tr-steps p{margin:.15em 0;border:0;padding:0;background:none}
.tr-gaps{background:var(--warn-soft);border-left:4px solid var(--warn);padding:var(--s2) var(--s4) var(--s3);border-radius:var(--radius);margin:var(--s5) 0}
.tr-gaps h2{border:0;padding:0;margin:.4em 0}.tr-gaps ul{padding-left:1.2em;margin:0;font-size:var(--fs-ui)}
.tr-steps{padding-left:2.4em;font-size:var(--fs-ui)}.tr-steps li{margin:0 0 var(--s3);padding-left:var(--s2);border-left:3px solid var(--c,var(--hair));overflow-wrap:anywhere}
.tr-steps li:target{background:var(--tram-soft)}
.tr .s-h .s-t{font:600 var(--fs-ui)/1 var(--mono)}.tr .s-kd{color:var(--ink-3);font-size:var(--fs-label);text-transform:uppercase;letter-spacing:.05em}
.tr .s-lb{font-size:var(--fs-label);padding:0 6px;border-radius:var(--radius-pill);border:1px solid var(--ok);color:var(--ok)}.tr .s-lb.hyp{border:1px dashed var(--warn);color:var(--warn)}
.tr .s-who{font-weight:600}.tr .s-ev,.tr .s-meta{color:var(--ink-2);font-size:var(--fs-meta)}
li.untimed .s-t{color:var(--terracotta)}
@media (max-width:759px){
 .tr-scroll{overflow:clip}
 .tr-heads{display:grid;grid-template-columns:repeat(var(--lanes),1fr);position:sticky;top:0;z-index:5;margin-left:var(--hd);background:var(--panel);border-bottom:1px solid var(--rule-2);font:600 11px/1.1 var(--sans);text-align:center;color:var(--ink-2)}
 .tr-heads span{padding:6px 0;overflow:hidden;text-overflow:ellipsis}
 .tr-plot{min-width:0;height:calc(1000 * var(--v) + 40px)}
 .tr-lab{display:none}
 .tr-band{left:calc(var(--hd) + var(--i) * (100% - var(--hd)) / var(--lanes));width:calc((100% - var(--hd)) / var(--lanes));right:auto;top:0;bottom:0;height:auto;border-top:0;border-left:1px solid var(--hair)}
 .tr-track{left:var(--hd);right:0;top:18px;bottom:22px}
 .tr-h{display:none}.tr-v{display:block;top:0;height:calc(1000 * var(--v))}
 .tr-tick{left:auto;right:calc(100% + 4px);top:calc(var(--p) * var(--v));transform:translateY(-50%)}
 .tr-tick::after{display:none}
 .tr-brk{left:0;right:0;width:auto;top:calc(var(--p) * var(--v));height:calc(var(--w) * var(--v));bottom:auto;border-inline:0;border-block:1px dashed var(--rule-2)}
 .tr-brk span{top:50%;bottom:auto;left:4px;right:auto;transform:translateY(-50%);writing-mode:horizontal-tb}
 .tr-line{left:0;right:0;top:calc(var(--p) * var(--v));bottom:auto;border-left:0;border-top:2px dashed var(--ok)}
 .tr-line.first{border-left:0;border-top:3px solid var(--tram)}
 .tr-chip,.tr-line.first .tr-chip,.tr-line.now .tr-chip{left:2px;right:auto;top:2px;transform:none}
 .tr-line.first .tr-chip{top:auto;bottom:3px}
 .tr-m{left:calc((var(--i) + .5) / var(--lanes) * 100%);top:calc(var(--p) * var(--v))}
 .tr-m .ver,.tr-m.alt .ver{top:50%;left:auto;right:20px;transform:translateY(-50%)}.tr-m.alt .ver{right:auto;left:20px}.tr-m.star .ver{right:32px}
 .tr-m.k-deploy::before,.tr-key .k.k-deploy{width:16px;height:4px}
 .tr-whisk{left:calc((var(--i) + .5) / var(--lanes) * 100%);top:calc((var(--p) - var(--len)) * var(--v));height:calc(var(--len) * var(--v));width:0;border-top:0;border-left:2px dashed var(--terracotta);-webkit-mask:linear-gradient(180deg,transparent,#000);mask:linear-gradient(180deg,transparent,#000)}
 .tr-g{left:calc((var(--i) + .5) / var(--lanes) * 100%);top:calc(var(--p) * var(--v));width:28px;min-width:0;height:calc(var(--w) * var(--v));min-height:28px;margin:0 0 0 -14px;padding:4px 0;flex-direction:column;justify-content:flex-start;border-radius:14px}
 .tr-g .gl{display:none}
 .tr-out{left:calc(var(--i) * 100% / var(--lanes) + 3px);width:calc(100% / var(--lanes) - 6px);top:calc(var(--p) * var(--v));height:calc(var(--w) * var(--v));writing-mode:vertical-rl;align-items:center;padding:0}
 .tr-detail{left:var(--gutter);right:var(--gutter);bottom:var(--s3);width:auto;max-height:60vh}
}
@media (prefers-reduced-motion:no-preference){.tr-detail:not([hidden]){animation:tr-in .15s ease-out}@keyframes tr-in{from{transform:translateY(8px);opacity:0}}}
`;
