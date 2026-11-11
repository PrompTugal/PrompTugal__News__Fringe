// /agentic-team/operating-model/ (work/48; Dinis in architect.1's session, 14:40 UTC; architect.1.fringe@PrompTugal.dinis).
// Three 1920x1080 slides drawn from data/operating-model.json (nothing typed twice): the execution ladder, what each entity
// can reach, and the distributed operating system with identity across it. Each is also a standalone page (slide-N.html)
// for screenshots; on the site page each is a scaled frame that stacks under 760 px.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const FONTS = `@font-face{font-family:Newsreader;src:url(https://promptugal.news/assets/fonts/newsreader-variable.woff2) format("woff2");font-weight:200 800}
@font-face{font-family:"IBM Plex Sans";src:url(https://promptugal.news/assets/fonts/plex-sans-variable.woff2) format("woff2");font-weight:100 700}
@font-face{font-family:"IBM Plex Mono";src:url(https://promptugal.news/assets/fonts/plex-mono-400.woff2) format("woff2")}`;
// the slide CSS, scoped to .om (so it can sit inside a page); the family look of docs/where-agents-run.slide.html
const CSS = `.om{--paper:#f6f3ec;--panel:#fffdf8;--ink:#121317;--ink2:#3f424a;--ink3:#595c64;--hair:#d9d2c1;--red:#c52830;--green:#006600;--cobalt:#1f4fa8;--gsoft:#e2eedf;--csoft:#e3eaf7;--rsoft:#f6e1e2;
width:1920px;height:1080px;background:var(--paper);color:var(--ink);font-family:"IBM Plex Sans",sans-serif;padding:44px 72px 34px;overflow:hidden;position:relative;box-sizing:border-box}
.om *{box-sizing:border-box;margin:0;padding:0}
.om .top{display:flex;justify-content:space-between;font-family:"IBM Plex Mono";font-size:20px;color:var(--ink2)}
.om .rule{height:5px;background:var(--green);margin:16px 0 18px}
.om .head{display:flex;justify-content:space-between;align-items:flex-end;gap:40px}
.om h1{font-family:Newsreader;font-weight:650;font-size:68px;line-height:1;letter-spacing:-1px}
.om h1 em{color:var(--green);font-style:italic;font-weight:500}
.om .q{font-family:Newsreader;font-style:italic;font-size:22px;color:var(--ink2);max-width:820px;text-align:right;line-height:1.3}
.om .k{font-family:"IBM Plex Mono";color:var(--green);font-size:17px;letter-spacing:3px;text-transform:uppercase;padding-bottom:7px;border-bottom:3px solid var(--ink);margin-bottom:12px}
.om .bar{position:absolute;left:72px;right:72px;bottom:28px;background:var(--ink);color:var(--paper);padding:11px 22px;display:flex;justify-content:space-between;align-items:center}
.om .bar b{font-family:Newsreader;font-size:28px;font-weight:600}.om .bar span{font-size:16px;color:#e8e4da}
.om .mono{font-family:"IBM Plex Mono"}
/* 1: ladder */
.om .ladwrap{display:grid;grid-template-columns:1fr 330px;gap:30px;margin-top:24px}
.om .lad{display:flex;flex-direction:column-reverse;gap:8px}
.om .rung{display:grid;grid-template-columns:90px 260px 1fr 470px;align-items:center;background:var(--panel);border:1px solid var(--hair);border-left:8px solid var(--green);padding:10px 16px;min-height:86px}
.om .rung b.id{font-family:"IBM Plex Mono";font-size:30px;color:var(--green)}
.om .rung h3{font-family:Newsreader;font-size:32px;font-weight:650}
.om .rung p{font-size:18px;color:var(--ink2);line-height:1.3}
.om .rung .who{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.om .chip{font-family:"IBM Plex Mono";font-size:14px;border:1.5px solid var(--ink3);padding:3px 8px;border-radius:3px;background:#fff;white-space:nowrap}
.om .chip.g{border-color:var(--green);color:var(--green)}.om .chip.c{border-color:var(--cobalt);color:var(--cobalt)}.om .chip.r{border-color:var(--red);color:var(--red)}
.om .across{display:flex;flex-direction:column;gap:10px}
.om .acr{flex:1;background:var(--ink);color:var(--paper);padding:16px 18px;display:flex;flex-direction:column;justify-content:center}
.om .acr h3{font-family:Newsreader;font-size:30px;font-weight:600;color:#6dbb7e}.om .acr p{font-size:17px;line-height:1.35;color:#e8e4da;margin-top:6px}
/* 2: access matrix */
.om table.ax{width:100%;border-collapse:collapse;margin-top:18px;font-size:17px}
.om table.ax th{font-family:"IBM Plex Mono";font-size:15px;letter-spacing:1px;text-transform:uppercase;color:var(--green);text-align:left;padding:6px 8px;border-bottom:3px solid var(--ink)}
.om table.ax td{padding:7px 8px;border-bottom:1px solid var(--hair);vertical-align:top;line-height:1.25}
.om table.ax td:first-child{font-weight:600;width:300px}
.om table.ax td.rg{font-family:"IBM Plex Mono";color:var(--green);font-weight:600;width:90px}
.om .lv0{color:var(--ink3)}.om .lv1{background:var(--csoft)}.om .lv2{background:var(--gsoft)}.om .lv3{background:var(--rsoft)}
.om .legend{display:flex;gap:18px;margin-top:12px;font-size:15px;color:var(--ink2);align-items:center}
.om .legend span{display:inline-block;width:18px;height:14px;margin-right:6px;vertical-align:middle;border:1px solid var(--hair)}
.om .fsg{display:grid;grid-template-columns:420px 520px 1fr;gap:28px;margin-top:22px}
.om .gr ol{list-style:none;counter-reset:g}.om .gr li{counter-increment:g;position:relative;padding:8px 0 8px 44px;border-bottom:1px solid var(--hair);font-size:18px;line-height:1.3}
.om .gr li::before{content:counter(g);position:absolute;left:0;top:8px;width:30px;height:30px;border-radius:50%;background:var(--green);color:var(--paper);font-weight:700;display:grid;place-items:center;font-size:16px}
.om .alt{display:flex;flex-direction:column;gap:6px}.om .alt div{background:var(--panel);border:1px solid var(--hair);border-left:8px solid var(--cobalt);padding:8px 12px}
.om .alt b{font-family:Newsreader;font-size:24px}.om .alt p{font-size:15px;color:var(--ink2)}.om .alt i{display:block;font-style:normal;font-family:"IBM Plex Mono";font-size:13px;color:var(--green);margin-top:3px}
.om .rch{display:flex;flex-direction:column;gap:6px}.om .rch>div{display:grid;grid-template-columns:96px 1fr;gap:8px;align-items:start;padding:6px 0;border-bottom:1px solid var(--hair)}
.om .rch>div>b{font-family:"IBM Plex Mono";color:var(--green);font-size:17px}.om .rch .chips{display:flex;flex-wrap:wrap;gap:5px}.om .rch .chip{font-size:12.5px;padding:2px 6px}
.om .chip.u-no{border-color:var(--red);color:var(--red)}.om .chip.u-yes{border-color:var(--green);color:var(--green)}.om .chip.prop{border-style:dashed;border-color:var(--cobalt);color:var(--cobalt)}
/* 3: OS */
.om .osw{display:grid;grid-template-columns:250px 1fr 250px;gap:18px;margin-top:22px;height:700px}
.om .band{background:var(--ink);color:var(--paper);padding:18px;display:flex;flex-direction:column;gap:10px}
.om .band h3{font-family:Newsreader;font-size:30px;font-weight:600;color:#6dbb7e}.om .band.p h3{color:#f07278}
.om .band p{font-size:16px;line-height:1.35;color:#e8e4da}
.om .layers{display:flex;flex-direction:column;gap:8px}
.om .layer{flex:1;display:grid;grid-template-columns:290px 1fr;align-items:center;background:var(--panel);border:1px solid var(--hair);border-left:8px solid var(--cobalt);padding:8px 16px}
.om .layer h3{font-family:Newsreader;font-size:27px;font-weight:650}
.om .layer p{font-size:18px;color:var(--ink2)}
.om .layer:nth-child(odd){border-left-color:var(--green)}`;
const NARROW = `@media (max-width:760px){
.om-frame{aspect-ratio:auto!important;overflow:visible!important;border:0!important}
.om-frame .om{position:static!important;transform:none!important;width:auto!important;height:auto!important;padding:14px!important;overflow:visible!important}
.om .top{flex-direction:column;gap:4px;font-size:13px}.om .head{flex-direction:column;align-items:flex-start;gap:8px}.om h1{font-size:38px}.om .q{text-align:left;font-size:17px}
.om .ladwrap,.om .osw{grid-template-columns:1fr;height:auto}.om .rung{grid-template-columns:60px 1fr;gap:4px 10px}.om .rung p,.om .rung .who{grid-column:1/-1;justify-content:flex-start}
.om .rung h3{font-size:24px}.om .rung b.id{font-size:22px}.om .layer{grid-template-columns:1fr}.om .fsg{grid-template-columns:1fr}.om .rch>div{grid-template-columns:1fr}.om .layer h3{font-size:22px}
.om .axw{overflow-x:auto}.om table.ax{min-width:900px;font-size:14px}.om .bar{position:static;flex-direction:column;align-items:flex-start;gap:4px;margin-top:16px}.om .bar b{font-size:20px}.om .legend{flex-wrap:wrap}}`;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const top = (n) => `<div class="top"><div>a PrompTugal.news site · the agentic team · the operating model ${n}/${SLIDES.length}</div><div>Lisbon Tech Fringe · Dinis Cruz with Angelo · 11 Nov 2026</div></div><div class="rule"></div>`;
const bar = (t) => `<div class="bar"><b>lisbontechfringe.com · the agentic team</b><span>${esc(t)}</span></div>`;

export function loadModel() { return JSON.parse(readFileSync(join(root, 'data/operating-model.json'), 'utf8')); }

function ladder(M) {
  const at = {}; for (const w of M.who.items) { const r = w.rung.split(' ')[0]; (at[r] ||= []).push(w.entity.replace(/\s*\(.*?\)\s*/g, ' ').replace(/, e\.g\..*/, '').trim()); }
  const cls = (r) => (+r.slice(1) >= 4 ? 'g' : +r.slice(1) >= 2 ? 'c' : '');
  return `${top(1)}<div class="head"><h1>The <em>execution</em> ladder</h1><div class="q">"What they are depends on where they are and what they can do."</div></div>
<div class="ladwrap"><div class="lad">${M.ladder.rungs.map((r) => `<div class="rung"><b class="id">${r.id}</b><h3>${esc(r.name)}</h3><p>${esc(r.what)}<br><span class="mono" style="font-size:14px;color:var(--ink3)">${esc(r.example)}</span></p><div class="who">${(at[r.id] || []).map((e) => `<span class="chip ${cls(r.id)}">${esc(e)}</span>`).join('')}</div></div>`).join('')}</div>
<div class="across"><div class="acr"><h3>Tools</h3><p>cut across the rungs: a loop acts through them (E3), and a single call can be handed them too.</p></div><div class="acr"><h3>Storage</h3><p>what it can mount: a file system, git, vaults. State in, evidence out.</p></div><div class="acr"><h3>Identity</h3><p>a key on every rung, even a chat. An ephemeral key proves the agent existed at that moment.</p></div></div></div>
${bar('data/operating-model.json · work/48 · a draft for Dinis and Angelo to correct')}`;
}

function access(M) {
  const axes = ['git', 'vault', 'internet', 'filesystem', 'install', 'control_plane'];
  const lvl = (ax, v) => { v = String(v); if (/^none|^no$/.test(v)) return 'lv0'; if (ax === 'control_plane') return /sessions/.test(v) ? 'lv3' : 'lv1'; if (/write dev|create|open|system|persistent/.test(v)) return 'lv2'; return 'lv1'; };
  return `${top(2)}<div class="head"><h1>What it can <em>reach</em></h1><div class="q">"The capabilities that the agent has at that moment in time ... what network and what resources he has access to, and whether he can install things."</div></div>
<div class="axw"><table class="ax"><thead><tr><th>Entity</th><th>Rung</th>${axes.map((a) => `<th>${esc(a.replace('_', ' '))}</th>`).join('')}<th>Identity</th></tr></thead><tbody>
${M.who.items.map((w) => `<tr><td>${esc(w.entity)}</td><td class="rg">${esc(w.rung)}</td>${axes.map((a) => `<td class="${lvl(a, w[a])}">${esc(w[a])}</td>`).join('')}<td>${esc(w.identity)}</td></tr>`).join('')}
</tbody></table></div>
<div class="legend"><b class="mono" style="color:var(--green)">LEVELS</b><div><span class="lv0" style="background:none"></span>none</div><div><span class="lv1"></span>some</div><div><span class="lv2"></span>full on that axis</div><div><span class="lv3"></span>the control plane: can start others</div><div class="mono" style="color:var(--ink3)">vault: read-only · write-only (append lane) · read-write · create</div></div>
${bar('Access axes: git · vault · internet · file system · install · control plane · secrets (data/operating-model.json)')}`;
}

function os(M) {
  return `${top(3)}<div class="head"><h1>A distributed <em>operating system</em></h1><div class="q">"We decouple even more than we have now on who's actually doing the task."</div></div>
<div class="osw"><div class="band"><h3>Identity</h3><p>${esc(M.identity.rule)}</p><p>${esc(M.identity.ephemeral)}</p></div>
<div class="layers">${M.os.map.map((l) => `<div class="layer"><h3>${esc(l.os)}</h3><p>${esc(l.here)}</p></div>`).join('')}</div>
<div class="band p"><h3>Policy</h3><p>Every process runs under a grant: abp/policies.json, one per agent, deny by default.</p><p>Observe mode: logged, never blocked; enforcement rule by rule, at Dinis's word; a conductor can always override.</p><p>State travels as vaults (even zips) and signed task packets.</p></div></div>
${bar('Processes · kernel · file systems · IPC · permissions · drivers (data/operating-model.json)')}`;
}


function graph(M) {
  const C = M.capabilities, G = M.graph;
  const by = {}; for (const p of C.primitives) (by[p.reach] ||= []).push(p);
  for (const p of C.proposed.items) (by[p.reach] ||= []).push({ ...p, prop: true });
  return `${top(4)}<div class="head"><h1>Meaning through <em>connectivity</em></h1><div class="q">"Everything connects to everything, and nobody has to share a schema." Fractal Semantic Graphs, newsroom.sgit.ai</div></div>
<div class="fsg"><div class="gr"><div class="k">The grammar (five rules)</div><ol>${G.grammar.map((g) => `<li>${esc(g)}</li>`).join('')}</ol>
<p style="font-size:15px;color:var(--ink2);margin-top:10px">Edges here: ${G.edges.slice(0, 8).map((e) => `<span class="mono" style="font-size:13px">${esc(e[0])}/${esc(e[1])}</span>`).join(' · ')}</p></div>
<div><div class="k">Zoom: one grammar, five ontologies</div><div class="alt">${G.altitudes.map((a) => `<div><b>${esc(a.id)}</b><p>${esc(a.ontology)}</p><i>&darr; ${esc(a.jump)}</i></div>`).join('')}</div></div>
<div><div class="k">What it can do: verb.object.reach</div><div class="rch">${C.reaches.map((r) => `<div><b>${esc(r.id)}</b><div class="chips">${(by[r.id] || []).map((p) => `<span class="chip ${p.prop ? 'prop' : 'u-' + p.undo}">${esc(p.id)}</span>`).join('')}</div></div>`).join('')}</div>
<p style="font-size:14px;color:var(--ink3);margin-top:8px"><span class="chip u-yes">undo: yes</span> <span class="chip">with effort</span> <span class="chip u-no">no undo</span> <span class="chip prop">proposed: the vault axis</span> · 23 primitives from abp.sgit.ai</p></div></div>
${bar('newsroom.sgit.ai (Fractal Semantic Graphs) · abp.sgit.ai (the capability grammar) · data/operating-model.json')}`;
}
export const SLIDES = [ladder, access, os, graph];
export function slidePage(i) {
  const M = loadModel();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1920"><title>The operating model ${i + 1}/${SLIDES.length}</title><style>${FONTS}body{margin:0}${CSS}</style></head><body><div class="om">${SLIDES[i](M)}</div><p style="font:16px sans-serif;margin:12px 72px">Lisbon Tech Fringe is independent of Web Summit and not run by its organisers. For anything official, see <a href="https://websummit.com/">the organisers' official site</a>.</p></body></html>`;
}

export function operatingModelBody(esc2, REPO) {
  const M = loadModel();
  const frames = SLIDES.map((f, i) => `<div class="om-frame"><div class="om">${f(M)}</div></div><p class="muted"><a href="/agentic-team/operating-model/slide-${i + 1}.html">Slide ${i + 1} at 1920x1080</a></p>`).join('');
  return `<style>${FONTS}${CSS}
.om-frame{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;margin:12px 0 4px;border:1px solid var(--hair,#ccc)}
.om-frame .om{position:absolute;top:0;left:0;transform-origin:0 0;transform:scale(var(--om-s,.4))}${NARROW}</style>
<p class="muted"><a href="/agentic-team/">The agentic team</a> · a draft for Dinis and Angelo to correct (work/48)</p>
<h1>The operating model</h1>
<p>${esc2(M.about)}</p>
${frames}
<script>(function(){function f(){document.querySelectorAll('.om-frame').forEach(function(e){if(innerWidth>760)e.style.setProperty('--om-s',e.clientWidth/1920)})}addEventListener('resize',f);f()})()</script>
<h2>Still open</h2><ul>${M.open.map((o) => `<li>${esc2(o)}</li>`).join('')}</ul>
<p class="muted">The data: <a href="/api/v1/operating-model.json">/api/v1/operating-model.json</a> (<code>data/operating-model.json</code>). Where each agent runs: <a href="/agentic-team/where-agents-run/">where agents run</a>. Who may edit what: <a href="/abp/">the ABPs</a>. Dinis's words: <a href="${esc2(REPO)}/blob/dev/briefs/2026-11-11-1440-the-operating-model.md">the brief</a>.</p>`;
}
