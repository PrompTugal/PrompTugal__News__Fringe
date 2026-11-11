// /agentic-team/ and /agentic-team/where-agents-run/ (work/48, brief 14; architect.1.fringe@PrompTugal.dinis).
// The infographic is docs/where-agents-run.slide.html, inlined with its CSS scoped to .wr-slide: a fixed 1920x1080 frame,
// scaled to the column's width on wide screens, and stacked into one column under 760 px. Then the doc, rendered from
// docs/where-agents-run.md, and the agents' runtimes from data/runtimes.json. Nothing is typed twice.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { md, guidanceCss } from './guidance.mjs';
import { readdirSync } from 'node:fs';
import { GRAVITY_SRC, gravityAttrs, universeCss } from './universe.mjs';   // one Gravity for the site: dev.2's vendored-or-pinned choice
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// scope the slide's CSS: body and :root become .wr-slide, every other selector is prefixed; @font-face kept as is
function scopeCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, body) => {
    sel = sel.trim();
    if (sel.startsWith('@')) return `${sel}{${body}}`;
    const s = sel.split(',').map((x) => x.trim()).map((x) => x === 'body' || x === ':root' ? '.wr-slide' : x === '*' ? '.wr-slide,.wr-slide *' : `.wr-slide ${x}`).join(',');
    return `${s}{${body}}`;
  });
}
export function slideParts() {
  const html = read('docs/where-agents-run.slide.html');
  const css = (/<style>([\s\S]*?)<\/style>/.exec(html) || [, ''])[1];
  const body = (/<body>([\s\S]*?)<\/body>/.exec(html) || [, ''])[1];
  return { css: scopeCss(css), body };
}

const PAGE_CSS = `
.wr-frame{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;margin:12px 0 18px;border:1px solid var(--hair,#ccc)}
.wr-frame .wr-slide{position:absolute;top:0;left:0;transform-origin:0 0;transform:scale(var(--wr-s,.4))}
.wr-slide{box-sizing:border-box}
@media (max-width:760px){
 .wr-frame{aspect-ratio:auto;overflow:visible;border:0}
 .wr-frame .wr-slide{position:static;transform:none;width:auto!important;height:auto!important;padding:14px!important;overflow:visible!important}
 .wr-slide .top{flex-direction:column;align-items:flex-start;gap:6px;font-size:13px!important}
 .wr-slide .head{flex-direction:column;align-items:flex-start;gap:8px}
 .wr-slide h1{font-size:40px!important}
 .wr-slide .q{text-align:left!important;font-size:17px!important}
 .wr-slide .row1,.wr-slide .row2,.wr-slide .split{grid-template-columns:1fr!important;gap:16px!important}
 .wr-slide .formula{font-size:13px!important;overflow-x:auto;white-space:nowrap}
 .wr-slide .bar{position:static!important;flex-direction:column;align-items:flex-start;gap:4px;margin-top:16px}
 .wr-slide .bar b{font-size:20px!important}
 .wr-slide .box h3{font-size:22px!important}
 .wr-slide .mt td:last-child{white-space:normal}
}
.wr-agents{width:100%;border-collapse:collapse;font-size:.85rem}.wr-agents th,.wr-agents td{border-bottom:1px solid var(--hair,#ccc);padding:4px 6px;text-align:left;vertical-align:top}
.wr-tw{overflow-x:auto}`;
const SCALE_JS = `<script>(function(){function f(){document.querySelectorAll('.wr-frame').forEach(function(e){e.style.setProperty('--wr-s',e.clientWidth/1920)})}addEventListener('resize',f);f()})()</script>`;

export function whereAgentsRunBody(esc, REPO) {
  const { css, body } = slideParts();
  const rt = existsSync(join(root, 'data/runtimes.json')) ? JSON.parse(read('data/runtimes.json')) : { agents: [] };
  const doc = md(read('docs/where-agents-run.md'), esc);
  const rows = rt.agents.map((a) => `<tr><td><code>${esc(a.agent)}</code></td><td>${esc(a.role)}</td><td>${esc(a.runtime)}</td><td>${esc(a.models)}</td><td>${esc(a.io_level)}</td><td>${esc(a.mode || '')}</td></tr>`).join('');
  return `<style>${guidanceCss}${css}${PAGE_CSS}</style>
<p class="muted"><a href="/agentic-team/">The agentic team</a> · a draft for Dinis and Angelo to correct (work/48)</p>
<div class="wr-frame"><div class="wr-slide">${body}</div></div>${SCALE_JS}
<div class="gd">${doc}</div>
<h2>Every agent, where it runs today</h2>
<div class="wr-tw"><table class="wr-agents"><thead><tr><th>Agent</th><th>Role</th><th>Runtime</th><th>Models</th><th>I/O level</th><th>Mode</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="muted">The data: <a href="/api/v1/runtimes.json">/api/v1/runtimes.json</a> (from <code>data/runtimes.json</code>). The document: <a href="${esc(REPO)}/blob/dev/docs/where-agents-run.md"><code>docs/where-agents-run.md</code></a>. Who may edit what: <a href="/abp/">the Agent Behaviour Policies</a>.</p>`;
}

export function agenticTeamBody(esc) {
  const item = (href, t, d) => `<div class="card"><a href="${href}"><strong>${esc(t)}</strong></a><div class="muted">${esc(d)}</div></div>`;
  return `<h1>The agentic team</h1>
<p>Lisbon Tech Fringe is built by a swarm: one conductor per person, agents by role, Dinis Cruz as head conductor. These pages describe how the team works.</p>
${item('/agentic-team/articles/the-altitudes-of-execution/', 'Article: the altitudes of execution', 'What an agent is depends on where it runs and what it can reach: the model, mixing altitudes, the run and what it taught us.')}
${item('/agentic-team/universe/', 'Every agentic run, as a universe', 'Drawn with Gravity: the environments, every unit at its altitude, and who handed work to whom.')}
${item('/agentic-team/operating-model/', 'The operating model', 'The primitives: the execution ladder (compute to spawn), what each entity can reach, identity everywhere, a distributed operating system for agents.')}
${item('/agentic-team/where-agents-run/', 'Where agents run', 'An agent versus an LLM call; the runtimes, models and I/O levels; the formula that places a task; the matrix of our tasks.')}
${item('/abp/', 'Agent Behaviour Policies', 'Who may edit what, where: every agent\'s grant, in observe mode.')}
${item('/how/', 'How this is made', 'From a public page to a published event.')}
${item('/dashboard/', 'The swarm, live', 'Who is online and what each agent is doing.')}
${item('/guidance/', 'Contributing', 'For people outside the team and their agents.')}`;
}

// /agentic-team/articles/<slug>/ from docs/articles/*.md (work/48)
export function articles(esc, REPO) {
  const dir = join(root, 'docs/articles'); if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.md$/.test(f)).sort().map((f) => {
    const src = read('docs/articles/' + f), fm = (k) => ((new RegExp(`^${k}:\\s*"?(.*?)"?$`, 'm')).exec(src) || [, ''])[1];
    const slug = f.replace(/^\d{4}-\d\d-\d\d-/, '').replace(/\.md$/, '');
    const body = `<style>${guidanceCss}</style><p class="muted"><a href="/agentic-team/">The agentic team</a> · article</p><p class="muted">${esc(fm('by'))}</p><div class="gd">${md(src, esc)}</div><p class="muted">Source: <a href="${esc(REPO)}/blob/dev/docs/articles/${esc(f)}"><code>docs/articles/${esc(f)}</code></a></p>`;
    return { slug, title: fm('title'), body };
  });
}

// /agentic-team/universe/: every agentic run drawn with Gravity (Silvio's library, https://web-summit.sgit.ai/lib/gravity/),
// at Dinis's word (19:0x UTC: "see the gravity api that we have published and have already used here in the fringe").
// core = the agentic team; centres = the environments where work runs; nodes = every unit at every altitude (ok when its
// signature verified and its answer was valid); flows = parent to child (agent -> loop -> LLM call); feed = units by birth.
// Data: /api/v1/altitude-runs.json (abp/tools/runs-export.mjs, signed sources only). Gravity pinned to v0.1.0, as gravity.1 does.
export function runsUniverseBody(esc) {
  const src = GRAVITY_SRC();
  return `<p class="muted"><a href="/agentic-team/">The agentic team</a> · drawn with <a href="https://web-summit.sgit.ai/lib/gravity/">Gravity</a> (Silvio's library)</p>
<h1>Every agentic run, as a universe</h1>
<p>Each centre is an environment where work runs; each node is a unit of work at its altitude (A3 agent, A2 loop, A1 LLM call, A0 compute) signed by a key that lived only while it ran; each flow is a parent handing work to a child. From <a href="/api/v1/altitude-runs.json">/api/v1/altitude-runs.json</a>. Live start, middle and end of each unit: Elastic, <em>Flows: the beginning, the middle and the end</em>.</p>
<style>${universeCss}</style><div id="universe"></div>
<script src="${esc(src)}"${gravityAttrs()}></script>
<script>(async function(){
  const r = await fetch('/api/v1/altitude-runs.json'); const R = await r.json(); const U = R.docs;
  const COL = ['#43D9C6','#FF7FB0','#F5C542','#7FA8FF','#B48CFF','#FF9F5A'];
  U.forEach(u => { if (!u.environment) u.environment = u.run_kind === 'packet' ? 'task packets (issued)' : 'unknown'; });
  const envs = [...new Set(U.map(u => u.environment))];
  const centres = envs.map((e, i) => ({ id: 'env-' + i, label: e.replace(/, router:.*$/, ' (packets)'), color: COL[i % COL.length] }));
  const cOf = u => 'env-' + envs.indexOf(u.environment || 'unknown');
  const short = s => String(s || '').replace(/^LLM call: /, '').slice(0, 40);
  const nodes = U.map(u => ({ id: u.id, centre: cOf(u), label: u.altitude + ' ' + (u.role === 'llm call' ? short(u.unit) : u.unit), ok: u.verified !== false && u.valid !== false, last: (u.signed_at || u.born || '').slice(11, 19) }));
  const ids = new Set(U.map(u => u.id));
  const flows = U.filter(u => u.parent && ids.has(u.parent)).map(u => ({ from: u.parent, to: u.id, count: 1, at: u.born }));
  const feed = U.filter(u => u.born).sort((a, b) => b.born.localeCompare(a.born)).slice(0, 20).map(u => ({ at: u.born, from: u.id, to: [cOf(u)], text: u.altitude + ' ' + short(u.unit) + (u.model ? ' · ' + u.model.replace(/^.*\\//, '') : '') + (u.duration_ms != null ? ' · ' + (u.duration_ms / 1000).toFixed(1) + ' s' : '') }));
  const byId = new Map(U.map(u => [u.id, u]));
  const detail = (id, api) => { const u = byId.get(id); if (!u) return ''; const e = api.esc, row = (k, v) => v == null || v === '' ? '' : '<div><b>' + e(k) + ':</b> ' + e(String(v)) + '</div>';
    return '<div class="ai">' + row('Altitude', u.altitude + ' (' + u.role + ')') + row('Unit', u.unit) + row('Run', u.run) + row('Environment', u.environment) + row('Runner', u.runner) + row('Key', u.key_fp) + row('Born', u.born) + row('Signed', u.signed_at) + row('Signature', u.verified === true ? 'verified' : u.verified === false ? 'NOT verified' : '') + row('Model', u.model) + row('Cost (USD)', u.cost_usd) + row('Latency (ms)', u.latency_ms) + row('Answer', u.valid === false ? 'invalid (retried)' : u.valid ? 'valid' : '') + row('Reach', u.reach_exposure != null ? u.reach_needs + ' needed, ' + u.reach_held + ' held, ' + u.reach_exposure + ' exposed' : '') + '</div>'; };
  const STR = { brandSub: ['A equipa agêntica · altitudes de execução', 'The agentic team · the altitudes of execution'],
    agents: ['Unidades', 'Units'], noPol: ['Não verificadas ou inválidas', 'Unverified or invalid'], withPol: ['Assinadas e verificadas', 'Signed and verified'],
    people: ['Ambientes', 'Environments'], msgsN: ['Trabalho passado', 'Work handed down'], pairs: ['Pai e filho', 'Parent and child'],
    team0: ['A equipa', 'The team'], teamOrb: ['A <em>equipa agêntica</em>', 'The <em>agentic team</em>'], hisAgents: ['as suas unidades', 'its units'],
    barriers: ['Assinaturas verificadas', 'Signatures verified'], weak: ['VERIFICAR', 'CHECK'], perHour: ['unidades a nascer, por hora', 'units born, per hour'],
    talk: ['As últimas', 'Latest'], msgs: ['As últimas unidades', 'The latest units'], live2: ['de execuções assinadas', 'from signed runs'], pairsH: ['Quem passa trabalho a quem', 'Who hands work to whom'],
    nAgents: ['UNIDADES', 'UNITS'], policy: ['VERIFICADAS', 'VERIFIED'], noPolicy: ['VERIFICAR', 'CHECK'], allPol: ['TODAS VERIFICADAS', 'ALL VERIFIED'],
    analysis: ['✦ Nota do arquiteto', '✦ Architect note'], nodeBad: ['Esta unidade não tem assinatura verificada ou a resposta foi inválida (repetida).', 'This unit has no verified signature, or its answer was invalid (retried).'],
    legend: ['Legenda', 'Legend'], lTeam: ['A equipa', 'The team'], lPerson: ['Ambiente', 'Environment'], lPol: ['Unidade verificada', 'Verified unit'], lNo: ['Por verificar ou inválida', 'Unverified or invalid'], lMsg: ['Trabalho passado', 'Work handed down'],
    explore: ['Ver no Universo ›', 'See in the Universe ›'], talksWith: ['Passa trabalho a', 'Hands work to'], nobody: ['nenhum', 'none'], readToday: ['lido', 'read'], lastCommit: ['assinada', 'signed'],
    askU: ['Pergunta sobre as execuções… (em breve)', 'Ask about the runs… (coming soon)'], askT: ['Que unidades tiveram de repetir?', 'Which units had to retry?'] };
  const ok = U.filter(u => u.verified === true).length;
  await window.Gravity.mount(document.getElementById('universe'), { lang: 'en', strings: STR, start: 'uni', data: { core: { label: 'The agentic team: every run' }, centres, nodes, flows, feed, at: R.generated }, detail, metric: { pct: Math.round(ok / U.length * 100), of: ok, total: U.length }, liveLabel: 'RUNS · exported ' + String(R.generated).slice(11, 16) + ' UTC', tourCentre: centres[0] && centres[0].id });
})();</script>`;
}
