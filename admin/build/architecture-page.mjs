// /agentic-team/ and /agentic-team/where-agents-run/ (work/48, brief 14; architect.1.fringe@PrompTugal.dinis).
// The infographic is docs/where-agents-run.slide.html, inlined with its CSS scoped to .wr-slide: a fixed 1920x1080 frame,
// scaled to the column's width on wide screens, and stacked into one column under 760 px. Then the doc, rendered from
// docs/where-agents-run.md, and the agents' runtimes from data/runtimes.json. Nothing is typed twice.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { md, guidanceCss } from './guidance.mjs';
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
${item('/agentic-team/where-agents-run/', 'Where agents run', 'An agent versus an LLM call; the runtimes, models and I/O levels; the formula that places a task; the matrix of our tasks.')}
${item('/abp/', 'Agent Behaviour Policies', 'Who may edit what, where: every agent\'s grant, in observe mode.')}
${item('/how/', 'How this is made', 'From a public page to a published event.')}
${item('/dashboard/', 'The swarm, live', 'Who is online and what each agent is doing.')}
${item('/guidance/', 'Contributing', 'For people outside the team and their agents.')}`;
}
