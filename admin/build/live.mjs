// The swarm, live (D23, brief 10; design.3.fringe@PrompTugal.dinis): commits, pushes and agents in the last 15 minutes and
// the last hour, as one quiet strip. Build time: counted from git (changes.mjs) so it works without JavaScript. In the browser:
// recounted by the reader's own clock from the same embedded data, and /api/v1/activity.json (dev.1) is re-fetched every 60 s
// and used when it answers. "Pushes" are releases (commits that carry a CI version tag); "agents" are distinct Agent: trailers.
const short = (a) => String(a || '').replace(/\.fringe@.*/, '').replace(/@.*/, '').trim();

// The feed is /api/v1/activity.json (dev.1, activity.mjs): {built_at, totals:{last_15_min,last_hour:{commits,deploys,agents}}, commits:[{sha,at,agent,subject}], deploys:[{version,at,sha}]}.
export function liveData(act, max = 200) {
  return { c: (act.commits || []).slice(0, max).map((c) => ({ t: c.at, a: short(c.agent), s: String(c.subject || '').replace(/^[\w.-]+@PrompTugal\.[\w.-]+:\s*/, '').slice(0, 90) })), d: (act.deploys || []).slice(0, max).map((x) => x.at) };
}
export function count(data, nowMs, minutes) {
  const from = nowMs - minutes * 60000, ok = (t) => Date.parse(t) >= from && Date.parse(t) <= nowMs + 60000, w = data.c.filter((x) => ok(x.t));
  return { commits: w.length, pushes: data.d.filter(ok).length, agents: new Set(w.map((x) => x.a).filter(Boolean)).size };
}
export const liveCss = `
.live{margin:8px 0;padding:6px 0;border-top:1px solid var(--rule-green,var(--rule));border-bottom:1px solid var(--rule-green,var(--rule));font-family:var(--mono);font-size:.78rem;line-height:1.5;color:var(--ink-2)}
.live .lw{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.live .lw>b{flex:none;width:5.2em;font-weight:500;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em;font-size:.72rem}
.live .n{font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
.live .ll{color:var(--ink-3);flex-wrap:nowrap}.live .lc{min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.live .lx{flex:none}.live .ll a{color:inherit}
.live .pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--ok);margin-right:6px;vertical-align:baseline;opacity:.35}
.live.hot .pulse{opacity:1;animation:lp 1.6s ease-out infinite}
@keyframes lp{0%{box-shadow:0 0 0 0 var(--ok-soft,rgba(0,102,0,.4))}100%{box-shadow:0 0 0 8px transparent}}
@media (prefers-reduced-motion:reduce){.live.hot .pulse{animation:none}}`;

const win = (esc, label, c) => `<div class="lw"><b>${label}</b><span><span class="n" data-k="commits">${c.commits}</span> commits · <span class="n" data-k="pushes">${c.pushes}</span> pushes · <span class="n" data-k="agents">${c.agents}</span> agents</span></div>`;
function ago(ms) { const m = Math.max(0, Math.round(ms / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; }

export function liveStrip(data, builtMs, esc, totals) {
  const t = (k) => totals?.[k] ? { commits: totals[k].commits, pushes: totals[k].deploys, agents: totals[k].agents } : null;
  const c15 = t('last_15_min') || count(data, builtMs, 15), c60 = t('last_hour') || count(data, builtMs, 60), last = data.c[0];
  const hot = last && builtMs - Date.parse(last.t) < 5 * 60000;
  return `<div class="live${hot ? ' hot' : ''}" data-live role="status" aria-label="Swarm activity">
${win(esc, '15 min', c15)}${win(esc, '1 hour', c60)}
<div class="lw ll"><b><span class="pulse"></span>Last</b><span class="lc">${last ? `<span class="lt">${esc(ago(builtMs - Date.parse(last.t)))}</span> by ${esc(last.a || 'an agent')}: ${esc(last.s)}` : 'no commits in this checkout'}</span><span class="lx"><a href="/changes/">changes</a> · <a href="/how/">how</a></span></div>
<script type="application/json" class="live-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script></div>`;
}
export const liveJs = `(function(){try{
var E=document.querySelectorAll('[data-live]');if(!E.length)return;
function sh(a){return String(a||'').replace(/\\.fringe@.*/,'').replace(/@.*/,'')}
function norm(j){if(!j||!Array.isArray(j.commits))return null;var c=j.commits.map(function(x){return{t:x.at||x.t,a:sh(x.agent||x.a),s:String(x.subject||x.s||'').replace(/^[\\w.-]+@PrompTugal\\.[\\w.-]+:\\s*/,'').slice(0,90)}}).filter(function(x){return x.t&&!isNaN(Date.parse(x.t))}).sort(function(x,y){return Date.parse(y.t)-Date.parse(x.t)});var d=(j.deploys||[]).map(function(x){return typeof x==='string'?x:x.at}).filter(Boolean);return{c:c,d:d}}
function ok(t,now,m){t=Date.parse(t);return t>=now-m*6e4&&t<=now+6e4}
function cnt(d,now,m){var w=d.c.filter(function(x){return ok(x.t,now,m)}),s={};w.forEach(function(x){if(x.a)s[x.a]=1});return{commits:w.length,pushes:d.d.filter(function(t){return ok(t,now,m)}).length,agents:Object.keys(s).length}}
function ago(ms){var m=Math.max(0,Math.round(ms/6e4));return m<1?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago'}
var data={c:[],d:[]};try{var q=JSON.parse(E[0].querySelector('.live-data').textContent);data={c:q.c.map(function(x){return{t:x.t,a:x.a,s:x.s}}),d:q.d}}catch(e){}
function paint(){var now=Date.now();E.forEach(function(el){var w=el.querySelectorAll('.lw');[15,60].forEach(function(m,i){var c=cnt(data,now,m);['commits','pushes','agents'].forEach(function(k){var n=w[i].querySelector('[data-k='+k+']');if(n)n.textContent=c[k]})});
var l=data.c[0];if(l){var lc=el.querySelector('.lc');lc.textContent='';var t=document.createElement('span');t.textContent=ago(now-Date.parse(l.t));lc.appendChild(t);lc.appendChild(document.createTextNode(' by '+(l.a||'an agent')+': '+l.s));el.classList.toggle('hot',now-Date.parse(l.t)<3e5)}})}
function pull(){fetch('/api/v1/activity.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){var d=norm(j);if(d&&d.c.length){data=d;paint()}}).catch(function(){})}
paint();setInterval(paint,15000);pull();setInterval(pull,60000);
}catch(e){}})();`;
