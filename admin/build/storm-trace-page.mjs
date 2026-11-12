// /graph/trace/: the Storm Charles team's trace (WS-214), drawn as a timeline by agent, coloured by altitude.
// Reads data/storm-trace.json (made by admin/tools/storm-trace.mjs from their public site) and renders the page's
// frame, the legend, the controls, a table view and the list of source files; admin/build/storm-trace.js draws the
// SVG in the browser from the same JSON, served next to the page. No dependencies, no third-party requests.
// trace.view.fringe@PrompTugal.angelo for conductor.fringe@PrompTugal.angelo, 11 November 2026 (WS-215).

export const ALT_WORDS = {
  A4: ['swarm', 'the team as a whole (the incident swarm, A4-ws214)'],
  A3: ['agent session', 'a session of an agent: a bar from its first to its last commit'],
  A2: ['loop', 'a loop an agent runs (a delegated task over several models)'],
  A1: ['model call', 'LLM calls: one bar per call, or per hour where only the ledger counts them'],
  A0: ['compute', 'compute: a CI run (build, gate, deploy), from start to end'],
};

const hhmm = (iso) => String(iso || '').slice(11, 16);
const day = (iso) => String(iso || '').slice(0, 10);

export function stormTraceBody(snap, esc) {
  if (!snap) return `<h1>The storm team's trace</h1><p class="muted">No snapshot yet: run <code>admin/tools/storm-trace.mjs</code>.</p>`;
  const src = snap.source, c = snap.counts, str = snap.strings;
  const first = new Date(Date.parse(snap.t0) + 1000 * Math.min(...snap.spans.map((x) => x[2]), ...snap.agents.flatMap((g) => g.sessions.map((x) => x[0])))).toISOString();
  const altCount = (i) => snap.spans.filter((s) => s[1] === i).length;
  const legend = snap.alts.map((a, i) => `<span class="stv-k"><span class="stv-sw stv-${a.toLowerCase()}"></span><b>${a}</b> ${esc(ALT_WORDS[a][0])}${a === 'A4' ? '' : ` <span class="muted">(${a === 'A3' ? snap.agents.reduce((n, g) => n + g.sessions.length, 0) + ' sessions' : altCount(i)})</span>`}</span>`).join('');
  const chip = (v, label, on = true) => `<button type="button" class="chip" data-alt="${v}" aria-pressed="${on}">${label}</button>`;
  const rows = snap.order.map((i) => {
    const g = snap.agents[i], by = (k) => snap.spans.filter((s) => s[0] === i && s[1] === k).length;
    return `<tr><th scope="row">${esc(g.name)}</th><td>${esc(g.role || '')}</td><td>${g.sessions.length}</td><td>${by(2)}</td><td>${by(3)}</td><td>${by(4)}</td><td>${g.n.steps}</td><td>${g.n.calls}</td><td>${esc([g.runtime, g.io].filter(Boolean).join(' · '))}</td></tr>`;
  }).join('');
  const files = snap.files.map((f) => `<li><a href="${esc(snap.files_base + f.path)}">${esc(f.path)}</a> <span class="muted">${f.bytes ?? ''} bytes · read ${esc(hhmm(f.read_at))} UTC · sha256 <code>${esc((f.sha256 || '').slice(0, 12))}…</code>${f.index_sha256_matches === false ? ' · differs from their index (the file changed after the index was written)' : ''}${f.error ? ' · <b>not read</b>: ' + esc(f.error) : ''}</span></li>`).join('');
  const sch = snap.schema;
  return `
<h1>The storm team's trace</h1>
<p class="dek">What the Storm Charles incident team's ${c.agents} agents did from ${esc(hhmm(first))} UTC on ${esc(day(first))} to ${esc(hhmm(snap.t1))} UTC on ${esc(day(snap.t1))}: one row per agent, its sessions, loops, model calls and compute, coloured by altitude. Tap a mark or a name for its details.</p>
<p class="stv-src muted">Their data, not ours: read from <a href="${esc(src.site)}">storm-charles.promptugal.news</a> (<a href="${esc(src.api)}">api</a>, <a href="${esc(src.trace)}">trace</a>, <a href="${esc(src.units)}">units</a>, <a href="${esc(src.calls)}">model calls</a>, <a href="${esc(src.altitudes)}">altitudes</a>; context: <a href="${esc(src.runner)}">RUNNER</a>, <a href="${esc(src.compute)}">COMPUTE</a>) at <b>${esc(hhmm(snap.read_at))} UTC, ${esc(day(snap.read_at))}</b>; their trace was updated at ${esc(hhmm(src.trace_updated))} UTC. Written in our swarm-flows schema, with <a href="#schema">the differences</a> listed below. Lisbon Tech Fringe is independent of Web Summit, and this is not a warning service: for the storm, <a href="https://www.ipma.pt/">IPMA</a> and <a href="https://www.prociv.gov.pt/">ANEPC</a>.</p>
<p class="stv-sum"><b>${c.agents}</b> agents · <b>${c.spans}</b> spans · <b>${c.steps}</b> commits and messages · <b>${c.calls}</b> model calls (${(c.tokens_in / 1e6).toFixed(2)}M tokens in, ${(c.tokens_out / 1e6).toFixed(2)}M out, $${c.cost_usd.toFixed(2)}) · ${c.trace_docs} trace events from ${c.trace_files} files</p>
<p class="stv-legend">${legend}<span class="stv-k"><span class="stv-sw stv-step"></span>commits and messages (per 10 min)</span><span class="stv-k"><span class="stv-sw stv-call"></span>model calls (per 5 min)</span><span class="stv-k"><span class="stv-sw stv-open"></span>started, no end recorded</span><span class="stv-k"><span class="stv-sw stv-bad"></span>outlined: failed or cancelled</span></p>
<div class="stv-ctl" id="stv-ctl">
<div><strong>Show</strong> ${chip('A3', 'A3 sessions')}${chip('A2', 'A2 loops')}${chip('A1', 'A1 calls')}${chip('A0', 'A0 compute')}${chip('steps', 'commits')}${chip('calls', 'model calls')}</div>
<div><label><strong>Agent</strong> <select id="stv-agent"><option value="">all agents</option>${snap.order.map((i) => `<option value="${i}">${esc(snap.agents[i].name)}</option>`).join('')}</select></label>
<label><strong>Time</strong> <select id="stv-win"><option value="0">the whole trace</option><option value="12">the last 12 hours</option><option value="6">the last 6 hours</option><option value="2">the last 2 hours</option><option value="1">the last hour</option></select></label>
<label><input type="checkbox" id="stv-quiet" checked> hide agents with nothing in view</label></div>
</div>
<p class="muted" id="stv-count" aria-live="polite"></p>
<div class="stv-wrap"><svg id="stv" role="img" aria-label="Timeline of the Storm Charles team's agents, coloured by altitude; the table below holds the same counts"></svg><div id="stv-tip" class="stv-tip" hidden></div></div>
<noscript><p class="muted">The timeline needs JavaScript; the table below holds the same counts.</p></noscript>
<div id="stv-panel" class="card" hidden></div>
<details class="stv-table"><summary>The same, as a table</summary><div class="stv-scroll"><table><thead><tr><th scope="col">Agent</th><th scope="col">Role</th><th scope="col">A3 sessions</th><th scope="col">A2 loops</th><th scope="col">A1 calls</th><th scope="col">A0 runs</th><th scope="col">Commits, messages</th><th scope="col">Model calls</th><th scope="col">Runtime · I/O</th></tr></thead><tbody>${rows}</tbody></table></div></details>
<h2>Altitudes</h2>
<ul class="stv-alts">${snap.alts.map((a) => `<li><span class="stv-sw stv-${a.toLowerCase()}"></span><b>${a}</b>: ${esc(ALT_WORDS[a][1])}.</li>`).join('')}</ul>
<p class="muted">The altitudes are the fringe's (<a href="https://github.com/PrompTugal/PrompTugal__News__Fringe/blob/dev/docs/where-agents-run.md">where agents run</a>); which agent sits where is the storm team's librarian's mapping (<a href="${esc(src.altitudes)}">altitudes.json</a>, updated ${esc(src.altitudes_updated || '')}).</p>
<h2 id="schema">Their data against our schema</h2>
<p>They write their trace in our swarm-flows schema (<a href="https://github.com/PrompTugal/PrompTugal__News__Fringe/blob/dev/data/elastic-export-swarm-flows.json">data/elastic-export-swarm-flows.json</a>). What differs, as read:</p>
<ul>
<li>Fields only in theirs: ${sch.fields_only_theirs.map((f) => `<code>${esc(f)}</code>`).join(', ') || 'none'}.</li>
<li>Our fields not on every one of their events: ${sch.fields_missing_in_some_of_theirs.map((f) => esc(f)).join('; ') || 'none'}.</li>
<li>Altitudes: ours ${esc(sch.altitudes.ours.join(', '))}; their events ${esc(sch.altitudes.theirs.join(', '))}; their units ${esc(sch.altitudes.in_units.join(', '))}.</li>
<li>Roles: ours ${esc(sch.roles.ours.join(', '))}; theirs ${esc(sch.roles.theirs.join(', '))}.</li>
${sch.notes.map((n) => `<li>${esc(n)}</li>`).join('\n')}
</ul>
<h2>The files read</h2>
<p class="muted">Every file was read over HTTPS from their public site by <code>admin/tools/storm-trace.mjs</code>; its sha256 and the time it was read are kept. Model calls are text-free at the source (no prompt, no answer). The snapshot: <a href="/graph/trace/storm-trace.json">storm-trace.json</a>${snap.trimmed_before ? ` (spans before ${esc(snap.trimmed_before)} left out to keep it under 256 KB)` : ''}.</p>
<details><summary>${snap.files.length} files</summary><ul class="stv-files">${files}</ul></details>
<script src="/storm-trace.js" defer></script>`;
}

export const stormTraceCss = `
.stv-wrap{--alt-a4:#e87ba4;--alt-a3:#2a78d6;--alt-a2:#eb6834;--alt-a1:#1baf7a;--alt-a0:#eda100}
.stv-legend,.stv-alts{--alt-a4:#e87ba4;--alt-a3:#2a78d6;--alt-a2:#eb6834;--alt-a1:#1baf7a;--alt-a0:#eda100}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) :is(.stv-wrap,.stv-legend,.stv-alts){--alt-a4:#d55181;--alt-a3:#3987e5;--alt-a2:#d95926;--alt-a1:#199e70;--alt-a0:#c98500}}
:root[data-theme="dark"] :is(.stv-wrap,.stv-legend,.stv-alts){--alt-a4:#d55181;--alt-a3:#3987e5;--alt-a2:#d95926;--alt-a1:#199e70;--alt-a0:#c98500}
.stv-src{font-size:var(--fs-ui);line-height:1.5}.stv-sum{font-size:var(--fs-ui)}
.stv-legend{display:flex;flex-wrap:wrap;gap:var(--s1) var(--s3);font-size:var(--fs-meta);margin:var(--s2) 0}.stv-k{white-space:nowrap}
.stv-sw{display:inline-block;width:14px;height:8px;border-radius:2px;margin-right:4px;vertical-align:1px}
.stv-a4{background:var(--alt-a4)}.stv-a3{background:var(--alt-a3)}.stv-a2{background:var(--alt-a2)}.stv-a1{background:var(--alt-a1)}.stv-a0{background:var(--alt-a0)}
.stv-open{border:1px dashed var(--ink-3);width:10px;height:6px}.stv-bad{background:var(--alt-a0);outline:1px solid var(--live)}.stv-step{background:var(--ink-3);width:3px;height:10px}.stv-call{background:var(--ink);width:3px;height:10px}
.stv-ctl>div{display:flex;flex-wrap:wrap;gap:6px var(--s3);align-items:center;margin:6px 0;font-size:var(--fs-ui)}
.stv-ctl .chip{font:inherit;font-size:13px;min-height:var(--chip-h);padding:0 var(--s3);text-transform:none;letter-spacing:0;border-radius:99px;border:1px solid var(--hair);background:var(--panel);color:var(--ink);cursor:pointer}
.stv-ctl .chip[aria-pressed=true]{background:var(--brand);border-color:var(--brand);color:var(--on-brand)}
.stv-ctl select{font:inherit;min-height:36px;max-width:100%;padding:0 var(--s2);border:1px solid var(--hair);border-radius:var(--radius);background:var(--panel);color:var(--ink)}
.stv-ctl label{display:inline-flex;gap:6px;align-items:center;max-width:100%}
.stv-wrap{position:relative;border:1px solid var(--hair);border-radius:var(--radius);background:var(--panel);margin:var(--s2) 0}
#stv{display:block;width:100%;height:auto;font-family:var(--sans)}
#stv .ax{stroke:var(--hair);stroke-width:1}#stv .axd{stroke:var(--rule-2);stroke-width:1}#stv .axt{fill:var(--ink-3);font-size:11px}#stv .axt.d{fill:var(--ink-2);font-weight:600}
#stv .ln{fill:var(--ink-2);font-size:11.5px;cursor:pointer;paint-order:stroke;stroke:var(--panel);stroke-width:3px;stroke-linejoin:round}#stv .ln:hover{fill:var(--brand);text-decoration:underline}#stv .lsep{stroke:var(--hair);stroke-width:1}
#stv .a3{fill:var(--alt-a3);fill-opacity:.22}#stv .a2{fill:var(--alt-a2)}#stv .a1{fill:var(--alt-a1)}#stv .a0{fill:var(--alt-a0)}
#stv .bad{stroke:var(--live);stroke-width:.75}#stv .open{fill-opacity:.15;stroke:var(--ink-3);stroke-width:.75;stroke-dasharray:2 1}#stv .st{fill:var(--ink-3)}#stv .ca{fill:var(--ink)}
#stv .sel{stroke:var(--ink);stroke-width:1.5}#stv .now{stroke:var(--live);stroke-dasharray:3 3}
.stv-tip{position:absolute;pointer-events:none;background:var(--ink);color:var(--paper);font-size:12px;padding:4px 8px;border-radius:var(--radius);max-width:260px;z-index:2}
#stv-panel dl{display:grid;grid-template-columns:max-content 1fr;gap:2px var(--s3);margin:var(--s2) 0;font-size:var(--fs-ui)}#stv-panel dt{color:var(--ink-3)}#stv-panel dd{margin:0;overflow-wrap:anywhere}
#stv-panel .x{float:right;font:inherit;min-height:36px;border:1px solid var(--hair);background:var(--panel);color:var(--ink);border-radius:var(--radius);cursor:pointer}
.stv-scroll{overflow-x:auto}.stv-table table{border-collapse:collapse;font-size:var(--fs-ui);min-width:640px}.stv-table th,.stv-table td{text-align:left;padding:3px 8px;border-bottom:1px solid var(--hair);font-variant-numeric:tabular-nums}
.stv-table summary,.stv-files+summary{cursor:pointer;font-weight:600;min-height:36px;display:flex;align-items:center}
.stv-alts{list-style:none;padding:0}.stv-files{font-size:var(--fs-meta);overflow-wrap:anywhere}
`;
