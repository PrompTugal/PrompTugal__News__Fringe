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
${item('/agentic-team/how-it-flows/', 'How it flows', 'Who talks to whom, how data travels and how work runs: from Dinis to the agents, git, Elasticsearch, Kibana, APM and Neo4j.')}
${item('/agentic-team/how-it-flows/#outside-processors', 'Outside processors', 'Elastic Cloud, Neo4j Aura, Grafana Cloud and OpenRouter: what goes to each, what never does, who holds the key, how to delete.')}
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

// ---------- /agentic-team/how-it-flows/: who talks to whom, how data goes, how it runs (Dinis, 19:4x UTC) ----------
// A flow diagram drawn as SVG at build time: six columns, left to right, from the people to the views. Solid lines run
// today; dashed grey ones wait on a decision by Dinis.
export function howItFlowsBody(esc) {
  const C = { people: 10, agents: 268, run: 526, transport: 784, stores: 1042, views: 1300 }, W = 200, H = 54;
  const col = (k) => C[k];
  const N = {};
  const node = (id, colk, y, title, sub, tone = 'n') => { N[id] = { x: col(colk), y, title, sub, tone }; };
  node('dinis', 'people', 70, 'Dinis', 'the only one who instructs', 'p');
  node('angelo', 'people', 330, 'Angelo', 'his team runs packets P1, P2', 'p');
  node('silvio', 'people', 430, 'Silvio', 'Gravity, the universes', 'p');
  node('others', 'people', 530, 'José, Indi, …', 'each instructs own conductor', 'p');
  node('lead', 'agents', 40, 'The lead (A4)', 'conductor.fringe@…dinis: routes', 'a');
  node('arch', 'agents', 120, 'architect.1 (A3)', 'ABPs, map, flows, reviews', 'a');
  node('elastic', 'agents', 200, 'elastic.1 (A3)', 'indices, feeds, Kibana', 'a');
  node('neo4j', 'agents', 280, 'neo4j.1 (A3)', 'the swarm as a graph (new)', 'a');
  node('team', 'agents', 360, "Dinis's agents (A3)", 'dev, design, research, …', 'a');
  node('gravity', 'agents', 440, 'gravity.1 (A3)', "Silvio's conductor", 'a');
  node('angeloc', 'agents', 520, "Angelo's conductors", 'run our task packets', 'a');
  node('otherc', 'agents', 600, 'Other conductors', 'José, Indi, …', 'a');
  node('hook', 'run', 40, 'ABP hook', 'every tool call; R5 R8 R9 enforced', 'r');
  node('loops', 'run', 140, 'A2 loops, A1 calls, A0', 'each signs with a key of its own', 'r');
  node('llm', 'run', 240, 'llm.mjs', 'one wrapper, a ledger', 'r');
  node('flow', 'run', 340, 'flow.mjs', 'start, step, end + OTel span', 'r');
  node('review', 'run', 440, 'ABP review, hourly', 'abp.mjs review, review-export', 'r');
  node('git', 'transport', 40, 'git: dev only', 'release.sh; never main, never force', 't');
  node('ci', 'transport', 130, 'CI', 'versions, gates, deploys', 't');
  node('inbox', 'transport', 220, 'Inboxes', 'sealed + signed, dev.send.sgraph.ai', 't');
  node('msg', 'transport', 300, 'Session messages', 'send_message between sessions', 't');
  node('feed', 'transport', 380, 'Elastic feed', 'any agent: elastic_feed JSON in git', 't');
  node('direct', 'transport', 460, 'Direct to Elastic', 'only elastic.1, architect.1 (R8e)', 't');
  node('otlp', 'transport', 540, 'OTLP/HTTP', 'waits on an APM key', 'x');
  node('openrouter', 'transport', 620, 'OpenRouter', 'open-weight models', 't');
  node('repo', 'stores', 40, 'GitHub repository', 'code, data, reviews, exports', 's');
  node('site', 'stores', 140, 'lisbontechfringe.com', '/api/v1/*.json', 's');
  node('es', 'stores', 260, 'Elasticsearch', '27 indices: swarm-flows, reviews …', 's');
  node('apm', 'stores', 380, 'Elastic APM', 'traces (waits on a key)', 'x');
  node('neo', 'stores', 480, 'Neo4j Aura', '2,300 nodes, loaded by neo4j.1', 's');
  node('local', 'stores', 580, '~/.abp in each container', 'hook log, OTLP files (lost with it)', 's');
  node('pages', 'views', 40, 'The site', 'agentic team, ABPs, operating model', 'v');
  node('universe', 'views', 130, 'Gravity universes', 'every run, every event', 'v');
  node('kdash', 'views', 230, 'Kibana dashboards', 'Flows: beginning, middle, end', 'v');
  node('kgraph', 'views', 320, 'Kibana Graph', 'run trees, who crosses lanes', 'v');
  node('ktrace', 'views', 410, 'Kibana APM traces', 'waits on the key', 'x');
  node('bloom', 'views', 500, 'Aura Query, Bloom, Dashboards', 'Cypher, paths', 'v');
  const E = [
    ['dinis', 'lead', 'i', ''], ['dinis', 'arch', 'i', ''], ['angelo', 'angeloc', 'i', ''], ['silvio', 'gravity', 'i', ''], ['others', 'otherc', 'i', ''],
    ['arch', 'hook', 'g', ''],
    ['team', 'hook', 'g', ''], ['arch', 'loops', 'g', ''], ['loops', 'llm', 'g', ''], ['loops', 'flow', 'l', ''], ['arch', 'review', 'g', ''],
    ['hook', 'local', 'l', ''], ['llm', 'openrouter', 'g', ''], ['hook', 'git', 'g', ''],
    ['git', 'ci', 'g', ''], ['ci', 'site', 'g', ''], ['git', 'repo', 'g', ''], ['gravity', 'hook', 'g', ''], ['angeloc', 'hook', 'g', ''], ['otherc', 'hook', 'g', ''],
    ['lead', 'inbox', 'm', ''], ['lead', 'msg', 'm', ''], ['review', 'feed', 'g', ''], ['feed', 'es', 'l', ''],
    ['flow', 'direct', 'l', ''], ['review', 'direct', 'l', ''], ['elastic', 'direct', 'l', ''], ['direct', 'es', 'l', ''], ['flow', 'otlp', 'x', ''], ['otlp', 'apm', 'x', ''],
    ['flow', 'local', 'x', ''], ['es', 'neo', 'g', 'export → neo4j.1'],
    ['site', 'pages', 'g', ''], ['site', 'universe', 'g', ''], ['es', 'kdash', 'l', ''], ['es', 'kgraph', 'l', ''], ['apm', 'ktrace', 'x', ''], ['neo', 'bloom', 'g', ''],
  ];
  const K = { i: ['#121317', '', 'instructs'], m: ['#6b3fa0', '5 4', 'messages'], g: ['#1f6f3a', '', 'code and data (git, calls)'], l: ['#c52830', '', 'live telemetry'], x: ['#8a8f98', '6 5', 'waits on a decision'] };
  const T = { p: ['#121317', '#fff'], a: ['#1f4fa8', '#fff'], r: ['#eef2fb', '#1f2a44'], t: ['#f3eefa', '#2b1d44'], s: ['#eef7f0', '#13331f'], v: ['#fff6e6', '#3d2a07'], x: ['#f1f2f4', '#5b6070'] };
  const path = ([a, b, k, lab]) => {
    const A = N[a], B = N[b]; if (!A || !B) return '';
    let x1, y1, x2, y2;
    if (B.x > A.x) { x1 = A.x + W; x2 = B.x; } else if (B.x < A.x) { x1 = A.x; x2 = B.x + W; } else { x1 = A.x + W; x2 = B.x + W; }
    y1 = A.y + H / 2; y2 = B.y + H / 2;
    const dx = B.x === A.x ? 60 : Math.max(40, Math.abs(x2 - x1) / 2), s = B.x >= A.x ? 1 : -1;
    const d = B.x === A.x ? `M${x1},${y1} C${x1 + dx},${y1} ${x2 + dx},${y2} ${x2},${y2}` : `M${x1},${y1} C${x1 + s * dx},${y1} ${x2 - s * dx},${y2} ${x2},${y2}`;
    const [c, dash] = K[k];
    const mx = B.x === A.x ? x1 + dx * 0.75 : (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-end="url(#hf-${k})" opacity=".85"/>` + (lab ? `<text x="${mx}" y="${my - 4}" class="hf-el" fill="${c}">${esc(lab)}</text>` : '');
  };
  const box = (id) => { const n = N[id], [bg, fg] = T[n.tone]; return `<g><rect x="${n.x}" y="${n.y}" width="${W}" height="${H}" rx="8" fill="${bg}" stroke="${n.tone === 'x' ? '#8a8f98' : 'rgba(0,0,0,.18)'}" ${n.tone === 'x' ? 'stroke-dasharray="5 4"' : ''}/><text x="${n.x + 10}" y="${n.y + 21}" class="hf-t" fill="${fg}">${esc(n.title)}</text><text x="${n.x + 10}" y="${n.y + 40}" class="hf-s" fill="${fg}">${esc(n.sub.length > 36 ? n.sub.slice(0, 35) + '…' : n.sub)}</text><title>${esc(n.title + ': ' + n.sub)}</title></g>`; };
  const heads = [['people', 'People'], ['agents', 'Sessions (A4, A3)'], ['run', 'Inside a run'], ['transport', 'How it travels'], ['stores', 'Where it lands'], ['views', 'Where you see it']].map(([k, t]) => `<text x="${col(k)}" y="22" class="hf-h">${t}</text>`).join('');
  const markers = Object.entries(K).map(([k, [c]]) => `<marker id="hf-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="${c}"/></marker>`).join('');
  const legend = Object.values(K).map(([c, dash, t], i) => `<g transform="translate(${20 + i * 250},700)"><line x1="0" y1="0" x2="40" y2="0" stroke="${c}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ''}/><text x="48" y="4" class="hf-s" fill="#333">${t}</text></g>`).join('');
  const svg = `<svg viewBox="0 0 1510 720" role="img" aria-label="Flow diagram: from the people to the conductors and agents, inside a run, through git, messages and telemetry, to GitHub, the site, Elasticsearch, APM and Neo4j, and the views: the site, Gravity, Kibana and Neo4j Browser" xmlns="http://www.w3.org/2000/svg"><defs>${markers}</defs>${heads}${E.map(path).join('')}${Object.keys(N).map(box).join('')}${legend}</svg>`;
  const steps = [
    ['Dinis speaks', 'in a conductor\'s session. Only he instructs; each person instructs only their own conductor. Every other message is material, never instruction.'],
    ['A conductor routes', 'the lead (A4) puts work on the board (work/) and in inboxes; architect.1 starts agents such as elastic.1 and neo4j.1 only at Dinis\'s word.'],
    ['Every tool call passes the ABP hook', '.claude/hooks/abp.mjs reads the agent\'s grant in abp/policies.json; R5 (dev only), R8 (no secrets) and R9 (own name) are enforced, the rest observed and logged to ~/.abp/log.'],
    ['Work runs at the lowest altitude that can do it', 'an A3 agent starts A2 loops, which make A1 LLM calls through llm.mjs (to OpenRouter, ledgered) and A0 compute. Each unit signs its result with a key that exists only while it runs.'],
    ['Every unit reports its beginning, middle and end', 'flow.mjs sends start, step and end events live to Elasticsearch (swarm-flows) and logs each flush in elastic-submissions; each unit is also an OpenTelemetry span, kept as OTLP files until APM has a key.'],
    ['Results go through git', 'commits to dev, under the agent\'s own name, through release.sh; CI versions, gates and deploys lisbontechfringe.com. Agents without the Elastic credential commit an elastic_feed JSON and elastic.1 sends it hourly under their name.'],
    ['Every hour, the review', 'architect.1 reads the git log against the grants (abp/reviews/) and sends every finding to Elasticsearch (swarm-abp-reviews).'],
    ['You see it', 'on the site (/agentic-team/), in the Gravity universes, in Kibana (the Flows dashboards, Graph), in Neo4j Aura (the graph, loaded by neo4j.1) and Grafana Cloud, and next in Kibana APM traces once Dinis makes the APM key.'],
  ];
  const asks = [
    ['Give Elastic scoped keys, not the shared superuser password', 'ELASTIC_CLOUD is in the environment every session in it shares; R8e only flags other agents, it cannot stop them. Make an API key per writer (elastic.1; architect.1) limited to swarm-* and elastic-submissions, and a read-only one for viewers. Best: put the Elastic credential only in a separate environment for those two sessions.'],
    ['Create an APM agent key', 'Kibana → Observability → APM → Settings → Agent keys (event:write). Set OTEL_EXPORTER_OTLP_ENDPOINT to the deployment\'s APM URL and OTEL_EXPORTER_OTLP_HEADERS to "Authorization=ApiKey <key>" in that environment. Every run then shows as a trace waterfall.'],
    ['Protect the branches in GitHub', 'main: only you merge. dev: no force-push, no deletion. Code owners on .claude/** and abp/** so policy changes need your review: today anyone who can push can change the hook.'],
    ['Say the word on signed overrides', 'security finding 38: an override counts only when signed by your person key or a conductor\'s key. Designed, not applied.'],
    ['Decide the lead\'s branch exception', 'whether the lead may push its session branch (R5).'],
    ['Cloudflare and AWS', 'accounts and credentials, when you want runs there (R6 and R7 in data/runtimes.json).'],
  ];
  return `<style>.hf-wrap{max-width:none;width:100vw;margin-left:calc(50% - 50vw);overflow-x:auto;background:#fbfaf7;border-block:1px solid var(--rule-2,#ddd);padding:12px 0}.hf-wrap svg{display:block;min-width:1100px;width:min(100%,1600px);margin:0 auto}.hf-h{font:600 13px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;fill:#555}.hf-t{font:600 13px system-ui,sans-serif}.hf-s{font:11px system-ui,sans-serif;opacity:.85}.hf-el{font:10px system-ui,sans-serif}.hf-steps li,.hf-asks li{margin:.35rem 0}body{overflow-x:clip}</style>
<p class="muted"><a href="/agentic-team/">The agentic team</a> · ${esc(new Date().toISOString().slice(0, 10))}</p>
<h1>How it flows</h1>
<p>Who talks to whom, how the data travels and how the work is executed, from a word of Dinis to the views where we watch it: the site, Gravity, Kibana and Neo4j. Solid lines run today; dashed grey ones wait on a decision.</p>
<div class="hf-wrap">${svg}</div>
<h2>How a run goes</h2>
<ol class="hf-steps">${steps.map(([t, d]) => `<li><strong>${esc(t)}</strong>: ${esc(d)}</li>`).join('')}</ol>
<h2>What to reconfigure</h2>
<ol class="hf-asks">${asks.map(([t, d]) => `<li><strong>${esc(t)}</strong>. ${esc(d)}</li>`).join('')}</ol>
<h2 id="outside-processors">Outside processors: what leaves, what never does</h2>
<p>Four services outside this repository process the swarm's data (advice 2053, item 6). None of them is Web Summit's. All read 2026-11-11 from <code>docs/elastic-guidance.md</code>, <code>docs/neo4j.md</code>, <code>admin/grafana/README.md</code> and <code>docs/grafana-openrouter-traces.md</code>.</p>
<div class="wr-tw"><table class="wr-agents"><thead><tr><th>Service</th><th>What goes there</th><th>What never does</th><th>Who holds the key</th><th>How to delete</th></tr></thead><tbody>
<tr><td><strong>Elastic Cloud</strong> (Elasticsearch and Kibana, Google Cloud us-central1)</td><td>The swarm's own records: flows (unit names, timings, models, costs, key fingerprints, agent names), the hourly ABP findings (agent, rule, file), commits and hook decisions, the agents' feeds. OpenRouter's traces, <em>with prompts and answers</em>, in <code>traces-*</code> only: Dinis's decision, 19:26 UTC ("I want to see the prompts"), kept indefinitely (20:25 UTC).</td><td>Contact details, private people, tip text, submissions' contact fields, raw observation events, keys or tokens: the submit tool holds back any document that looks like one. Prompts never leave <code>traces-*</code> and never appear on a shared dashboard.</td><td>Dinis (the deployment's owner). The superuser password is <code>ELASTIC_CLOUD</code> in the shared cloud environment; only elastic.1 and architect.1 may use it (rule R8e). Others send through elastic.1's feed.</td><td>Each index's owner, or Dinis, deletes the index (<code>DELETE /&lt;index&gt;</code>) or a single document. Dinis can delete the whole deployment in the Elastic Cloud console.</td></tr>
<tr><td><strong>Neo4j Aura</strong> (instance 4c760d12, Google Cloud europe-west1)</td><td>The swarm as a graph, loaded by neo4j.1 at Dinis's word (20:07 UTC): the public events graph, the agentic runs, the grants, the review findings, Dinis's recorded words. About 2,300 nodes, all labelled <code>:Fringe</code>.</td><td>Contact details, private people, prompts or answers, keys.</td><td>Dinis (the instance). Its password is <code>NEO4J_CLOUD</code> in the cloud environment, used by neo4j.1.</td><td><code>neo4j-load.py --wipe</code> removes every <code>:Fringe</code> node; Dinis can delete the instance in the Aura console.</td></tr>
<tr><td><strong>Grafana Cloud</strong> (stack vividwombat1572)</td><td>Dashboards only. They read the public <code>/api/v1/</code> and, once Dinis adds a read-only key, Elastic's <code>fringe-*</code> indices. The Swarm folder's JSON is in <code>admin/grafana/</code>.</td><td>Stored copies of our data beyond what the dashboards query, contact details, keys.</td><td>Dinis (the stack). Agents use the service account <code>swarm-agents</code>: Viewer, with Edit on the Swarm folder only, as <code>GRAFANA_TOKEN</code>.</td><td>Delete the Swarm folder, or the stack, in Grafana Cloud.</td></tr>
<tr><td><strong>OpenRouter</strong> (the model router)</td><td>Every model call made through <code>admin/tools/llm.mjs</code>: the prompt and the answer, with public data only (events, board items, task packets). Its broadcast sends traces to Elastic (above). The call ledger stays in each agent's container (<code>~/.fringe-ledger</code>) and in <code>data/models-ledger.json</code> (model, cost and caller, no text).</td><td>Contact details, private people, tip text, keys. <code>llm.mjs</code> sends no user or session ids.</td><td>The shared OpenRouter key, put into requests by the cloud environment's proxy; no agent sees it.</td><td>OpenRouter's own logging stays off; its broadcast can be switched off in OpenRouter's Settings → Observability. Traces already in Elastic are deleted as above.</td></tr>
</tbody></table></div>
<p class="muted">The sources: <code>abp/policies.json</code> (the grants), <code>abp/tools/flow.mjs</code> (flows and spans), <code>docs/elastic-guidance.md</code> (the indices and the feed), <a href="/api/v1/runtimes.json">/api/v1/runtimes.json</a> (where agents run). Lisbon Tech Fringe is independent of Web Summit.</p>`;
}
