#!/usr/bin/env node
// The Kibana side (elastic.1.fringe@PrompTugal.dinis, WS-215; Dinis, 11 November 2026: "a whole set of powerful
// dashboards ... show the rest of the team the art of the possible"). Builds the data views, Lens charts, saved
// searches, tags and dashboards as saved objects (elastic/kibana/objects.ndjson) and imports them, overwriting by id,
// so a re-run updates and never duplicates.
//
//   node admin/tools/elastic-kibana.mjs build                    write elastic/kibana/objects.ndjson
//   KIBANA_URL=https://<deployment>.kb.<region>... node admin/tools/elastic-kibana.mjs import
//
// The password or key comes from the environment (elastic-lib.mjs auth()), never printed.

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as K from './elastic-kibana-lib.mjs'
const { uid, add, objects, INDEPENDENT, DV, dataView, C, lens, metric, overTime, top, donut, table, heat, search, md, dashboard, L, S, V } = K

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && process.argv[2] === 'import') {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = path.join(ROOT, 'elastic', 'kibana', 'objects.ndjson')

// ---------- tags ----------
const TAGS = {
    swarm: add({ type: 'tag', id: uid('tag', 'swarm'), attributes: { name: 'PrompTugal swarm', description: 'All three sites', color: '#6092C0' }, references: [] }),
    fringe: add({ type: 'tag', id: uid('tag', 'fringe'), attributes: { name: 'Lisbon Tech Fringe', description: 'lisbontechfringe.com', color: '#D36086' }, references: [] }),
    ptnews: add({ type: 'tag', id: uid('tag', 'ptnews'), attributes: { name: 'PrompTugal.news', description: 'promptugal.news', color: '#54B399' }, references: [] }),
    websummit: add({ type: 'tag', id: uid('tag', 'websummit'), attributes: { name: 'Web Summit (sgit.ai)', description: 'web-summit.sgit.ai', color: '#E7664C' }, references: [] }),
}

// ---------- data views ----------
dataView('fringe-events', 'Fringe: events', 'start')
dataView('fringe-graph', 'Fringe: semantic graph', 'read_at')
dataView('fringe-tasks', 'Fringe: task packets and results', 'read_at')
dataView('fringe-models', 'Fringe: model router ledger', 'day')
dataView('fringe-hooklog', 'Fringe: ABP hook decisions', 't')
dataView('fringe-altitudes', 'The agentic runs: one unit per altitude (signed)', 't')
dataView('elastic-submissions', 'Elastic operations: every submission', 't')
dataView('fringe-*,ptnews-*,websummit-*,swarm-*,agents-*', 'Everything on Elastic (by ingest time)', 'ingested_at')
dataView('traces-generic.otel-default', 'OpenRouter traces (OTel): the A1 calls from the provider side', '@timestamp')
dataView('fringe-packets', 'Task packets: issued, run, every call (cross-conductor)', 't')
dataView('fringe-workloads', 'Distributed workloads: altitudes, runtimes, placements, traces', 't')
for (const s of ['fringe', 'ptnews', 'websummit']) for (const k of ['commits', 'content', 'entities', 'runs', 'status']) dataView(`${s}-${k}`, `${{ fringe: 'Fringe', ptnews: 'PrompTugal.news', websummit: 'Web Summit' }[s]}: ${k}`, 't')
for (const k of ['commits', 'content', 'entities', 'runs', 'status']) dataView(`fringe-${k},ptnews-${k},websummit-${k}`, `All sites: ${k}`, 't')
const ALL = k => DV[`fringe-${k},ptnews-${k},websummit-${k}`]


// =====================================================================================================
// 1. The swarm: all three sites
// =====================================================================================================
const D = {}
D.swarm = dashboard('swarm', 'PrompTugal swarm: three sites, one view', 'Every commit, page, record, run and status of the three sites the agentic team builds: Lisbon Tech Fringe, PrompTugal.news and the Web Summit site.', TAGS.swarm, [
    [[md('swarm-head', `## PrompTugal swarm: three sites, one view\nThe agentic team's three public repositories, read by **elastic.1.fringe@PrompTugal.dinis** and indexed here: **[Lisbon Tech Fringe](https://lisbontechfringe.com)** · **[PrompTugal.news](https://promptugal.news)** · **[Web Summit (sgit.ai)](https://web-summit.sgit.ai)**. Every document carries its source (a commit or a file at a commit), its read time and its signer. Use the **site**, **person** and **agent** fields as filters.\n\n_${INDEPENDENT}_`), V, 48, 7]],
    [[metric('sw-m1', 'Commits', ALL('commits'), C.count('Commits')), L, 8, 6], [metric('sw-m2', 'Agents who committed', ALL('commits'), C.unique('agent', 'Agents')), L, 8, 6],
     [metric('sw-m3', 'People behind them', ALL('commits'), C.unique('person', 'People')), L, 8, 6], [metric('sw-m4', 'Pages of writing', ALL('content'), C.count('Pages')), L, 8, 6],
     [metric('sw-m5', 'Records (events, companies, stories...)', ALL('entities'), C.count('Records')), L, 8, 6], [metric('sw-m6', 'Agent runs and wakes', ALL('runs'), C.count('Runs')), L, 8, 6]],
    [[overTime('sw-commits-site', 'Commits per hour, by site', ALL('commits'), 't', 'site', '', { interval: '1h' }), L, 32, 13], [donut('sw-site', 'Commits by site', ALL('commits'), 'site'), L, 16, 13]],
    [[top('sw-agents', 'The busiest agents (commits)', ALL('commits'), 'agent', '', { size: 20 }), L, 24, 18], [heat('sw-heat', 'Who works where: person by site', ALL('commits'), 'site', 'person'), L, 24, 18]],
    [[overTime('sw-person', 'Commits per hour, by person', ALL('commits'), 't', 'person', '', { interval: '1h', series: 'area_stacked' }), L, 48, 12]],
    [[table('sw-content', 'Writing by site and area', ALL('content'), [['site', 'Site', 3], ['area', 'Area', 25]], [C.count('Pages'), C.sum('words', 'Words')]), L, 24, 16],
     [table('sw-entities', 'Records by site and type', ALL('entities'), [['site', 'Site', 3], ['type', 'Type', 20]], [C.count('Records')]), L, 24, 16]],
    [[search('sw-latest', 'Latest commits, all sites', ALL('commits'), ['site', 'agent', 'title', 'files']), S, 48, 16]],
], { from: 'now-14d' })

// =====================================================================================================
// 2. Lisbon Tech Fringe
// =====================================================================================================
const fe = DV['fringe-events']
D.fringe = dashboard('fringe', 'Lisbon Tech Fringe: the week live', 'Side events around Web Summit Lisbon (11 to 14 November 2026), the swarm that builds lisbontechfringe.com, its policy hook and its model spend.', TAGS.fringe, [
    [[md('fringe-head', `## Lisbon Tech Fringe: the week live\nThe **${'178'}+ side events** around Web Summit Lisbon, each re-read at its public URL (\`read_at\`), and the swarm that keeps **[lisbontechfringe.com](https://lisbontechfringe.com)** current. Facts carry \`label: evidence\`; "unknown" is a valid status. For the storm, see IPMA, ANEPC and [storm-charles.promptugal.news](https://storm-charles.promptugal.news).\n\n_${INDEPENDENT}_ Official pages: [websummit.com](https://websummit.com).`), V, 48, 7]],
    [[metric('fr-m1', 'Events', fe, C.count('Events')), L, 10, 6], [metric('fr-m2', 'Organisers', fe, C.unique('organiser.raw', 'Organisers')), L, 10, 6],
     [metric('fr-m3', 'Free events', fe, C.count('Free'), 'cost:free'), L, 10, 6], [metric('fr-m4', 'Moved by the storm', fe, C.count('Moved'), 'storm_moved:true'), L, 9, 6],
     [metric('fr-m5', 'Not on (moved, cancelled, unknown)', fe, C.count('Not on'), 'not status:on'), L, 9, 6]],
    [[overTime('fr-hours', 'Events by start hour, by type', fe, 'start', 'type', '', { interval: '3h' }), L, 32, 14], [donut('fr-status', 'Status', fe, 'status'), L, 16, 14]],
    [[top('fr-topics', 'Topics', fe, 'topics', '', { size: 15 }), L, 16, 16], [top('fr-personas', 'Who it is for', fe, 'personas'), L, 16, 16], [donut('fr-size', 'Size', fe, 'size'), L, 16, 16]],
    [[search('fr-events', 'The events, soonest first', fe, ['name', 'type', 'organiser', 'place', 'status', 'cost', 'url'], '', 'start', 'asc'), S, 48, 18]],
    [[overTime('fr-commits', 'The swarm: commits per hour, by agent', DV['fringe-commits'], 't', 'agent', '', { interval: '1h' }), L, 32, 14], [top('fr-agents', 'Agents by commits', DV['fringe-commits'], 'agent', '', { size: 15 }), L, 16, 14]],
    [[table('fr-hook', 'ABP hook: decisions by agent and tool', DV['fringe-hooklog'], [['agent', 'Agent', 20], ['decision', 'Decision', 5], ['tool_kind', 'Kind', 10]], [C.count('Calls')]), L, 24, 14],
     [top('fr-models', 'Model router: spend by model (USD)', DV['fringe-models'], 'model', 'group:by_model', { metricCol: C.sum('cost_usd', 'USD') }), L, 24, 14]],
    [[search('fr-asks', 'Status files with asks for Dinis', DV['fringe-status'], ['agent', 'state', 'n'], 'tags:asks-dinis'), S, 24, 14],
     [table('fr-board', 'The board, briefs and docs (pages by area)', DV['fringe-content'], [['area', 'Area', 20]], [C.count('Pages'), C.sum('words', 'Words')]), L, 24, 14]],
    [[table('fr-graph', 'The semantic graph: nodes', DV['fringe-graph'], [['node', 'Node', 6], ['name.raw', 'Name', 30]], [C.count('Documents')]), L, 24, 14],
     [table('fr-places', 'Places, organisers and communities', DV['fringe-entities'], [['type', 'Type', 6], ['title.raw', 'Name', 30]], [C.count('Records')]), L, 24, 14]],
], { from: '2026-11-11T00:00:00.000Z', to: '2026-11-15T00:00:00.000Z' })

// =====================================================================================================
// 3. PrompTugal.news
// =====================================================================================================
const pe = DV['ptnews-entities'], pr = DV['ptnews-runs']
D.ptnews = dashboard('ptnews', 'PrompTugal.news: the agentic newsroom', 'The newsroom of promptugal.news: its stories from idea to article, the companies, organisations, events and evidence it tracks, and the desks of agents that run it.', TAGS.ptnews, [
    [[md('pt-head', `## PrompTugal.news: the agentic newsroom\nThe newsroom behind **[promptugal.news](https://promptugal.news)**: stories moving from idea to article, the companies, organisations, events and places it maps for Web Summit week, the evidence each claim rests on, and the agents' run reports. Read from [the public repository](https://github.com/PrompTugal/PrompTugal__News__Website); people's profiles are not indexed.\n\n_${INDEPENDENT}_`), V, 48, 8]],
    [[metric('pt-m1', 'Stories', pe, C.count('Stories'), 'type:story'), L, 8, 6], [metric('pt-m2', 'Companies', pe, C.count('Companies'), 'type:company'), L, 8, 6],
     [metric('pt-m3', 'Organisations', pe, C.count('Organisations'), 'type:organisation'), L, 8, 6], [metric('pt-m4', 'Events', pe, C.count('Events'), 'type:event'), L, 8, 6],
     [metric('pt-m5', 'Agent runs', pr, C.count('Runs')), L, 8, 6], [metric('pt-m6', 'Tool calls in runs', pr, C.sum('n', 'Tool calls')), L, 8, 6]],
    [[donut('pt-story-status', 'Stories: where each is (idea to published)', pe, 'status', 'type:story'), L, 16, 15], [donut('pt-types', 'Records by type', pe, 'type'), L, 16, 15], [top('pt-areas', 'Writing by area', DV['ptnews-content'], 'area', '', { size: 12 }), L, 16, 15]],
    [[overTime('pt-runs', 'Agent runs per hour, by agent', pr, 't', 'agent', '', { interval: '1h' }), L, 32, 14], [top('pt-run-agents', 'Tool calls by agent', pr, 'agent', '', { metricCol: C.sum('n', 'Tool calls'), size: 15 }), L, 16, 14]],
    [[overTime('pt-commits', 'Commits per hour, by person', DV['ptnews-commits'], 't', 'person', '', { interval: '1h', series: 'area_stacked' }), L, 32, 13], [top('pt-commit-agents', 'Agents by commits', DV['ptnews-commits'], 'agent', '', { size: 15 }), L, 16, 13]],
    [[search('pt-stories', 'Stories, newest first', pe, ['title', 'status', 'agent', 'url'], 'type:story'), S, 24, 16], [search('pt-companies', 'Companies', pe, ['title', 'url', 'status'], 'type:company'), S, 24, 16]],
    [[search('pt-content', 'Newsroom writing, newest first (full text searchable)', DV['ptnews-content'], ['title', 'area', 'agent', 'words']), S, 48, 16]],
    [[search('pt-status', 'The desks: each agent\'s status', DV['ptnews-status'], ['agent', 'state', 'n']), S, 48, 14]],
], { from: 'now-10d' })

// =====================================================================================================
// 4. Web Summit (web-summit.sgit.ai)
// =====================================================================================================
const we = DV['websummit-entities']
D.websummit = dashboard('websummit', 'Web Summit site: the team\'s field guide', 'web-summit.sgit.ai: the sessions and side events the team picked, the companies, the model research runs (xray), the team\'s agents and their wakes, and every commit since 28 October.', TAGS.websummit, [
    [[md('ws-head', `## Web Summit site (web-summit.sgit.ai): the team's field guide\nThe team's own guide to Web Summit week at **[web-summit.sgit.ai](https://web-summit.sgit.ai)**: sessions and side events picked for the team, the companies, the model research runs ("xray": leads, not facts, until sourced), and the agents and wakes behind it. Read from [the public repository](https://github.com/SGit-AI/SGit-AI__Website__Web-Summit); people folders, mail, meetings and the CRM are not indexed.\n\n_${INDEPENDENT}_`), V, 48, 8]],
    [[metric('ws-m1', 'Commits', DV['websummit-commits'], C.count('Commits')), L, 8, 6], [metric('ws-m2', 'Sessions picked', we, C.count('Sessions'), 'type:session'), L, 8, 6],
     [metric('ws-m3', 'Side events', we, C.count('Side events'), 'type:side-event'), L, 8, 6], [metric('ws-m4', 'Companies', we, C.count('Companies'), 'type:company'), L, 8, 6],
     [metric('ws-m5', 'Model research runs', we, C.count('Runs'), 'type:xray'), L, 8, 6], [metric('ws-m6', 'Research spend (USD)', we, C.sum('cost_usd', 'USD'), 'type:xray'), L, 8, 6]],
    [[overTime('ws-commits', 'Commits per day, by person', DV['websummit-commits'], 't', 'person', '', { interval: '1d' }), L, 32, 14], [donut('ws-person', 'Commits by person', DV['websummit-commits'], 'person'), L, 16, 14]],
    [[top('ws-agents', 'Agents by commits', DV['websummit-commits'], 'agent', '', { size: 20 }), L, 16, 18], [top('ws-areas', 'Writing by area', DV['websummit-content'], 'area', '', { size: 20 }), L, 16, 18], [donut('ws-types', 'Records by type', we, 'type'), L, 16, 18]],
    [[search('ws-sessions', 'Sessions and side events the team picked', we, ['type', 'title', 'url'], 'type:session or type:side-event'), S, 24, 16], [search('ws-xray', 'Model research runs (leads, not facts)', we, ['title', 'cost_usd'], 'type:xray'), S, 24, 16]],
    [[overTime('ws-runs', 'Wakes per day, by agent', DV['websummit-runs'], 't', 'agent', '', { interval: '1d' }), L, 24, 13], [search('ws-status', 'The team\'s agents: status', DV['websummit-status'], ['agent', 'state']), S, 24, 13]],
    [[search('ws-content', 'Everything written, newest first (full text searchable)', DV['websummit-content'], ['title', 'area', 'agent', 'words']), S, 48, 16]],
], { from: 'now-16d' })

// =====================================================================================================
// 5. The policy review (ABP), across what is indexed
// =====================================================================================================
D.abp = dashboard('abp', 'The agentic team: who did what, and under which policy', 'For the hourly ABP review: hook decisions by agent, rule and tool; commits by agent and area across the three sites; status asks for Dinis.', TAGS.swarm, [
    [[md('abp-head', `## Who did what, and under which policy\nThe ABP hook's decisions (\`fringe-hooklog\`) beside every commit on the three sites. Today the hook log holds the sessions that pushed it; each agent adding \`node admin/tools/elastic.mjs push --kind hooklog\` to its wake makes this swarm-wide (docs/elastic-plan.md). Decision \`observe\` means outside the grant, logged; \`deny\` means an enforced rule (R5, R8, R9) fired.`), V, 48, 5]],
    [[donut('abp-decision', 'Hook decisions', DV['fringe-hooklog'], 'decision'), L, 16, 14], [top('abp-kind', 'Calls by kind', DV['fringe-hooklog'], 'tool_kind'), L, 16, 14], [top('abp-rule', 'Rules touched', DV['fringe-hooklog'], 'rule', 'rule:*'), L, 16, 14]],
    [[overTime('abp-time', 'Hook events over time, by decision', DV['fringe-hooklog'], 't', 'decision', '', { interval: '10m' }), L, 48, 12]],
    [[search('abp-events', 'Hook events, newest first (commands redacted)', DV['fringe-hooklog'], ['agent', 'tool', 'tool_kind', 'decision', 'rule', 'target']), S, 48, 16]],
    [[heat('abp-heat', 'Commits: agent by site', ALL('commits'), 'site', 'agent'), L, 24, 20], [search('abp-asks', 'Asks for Dinis, all sites', ALL('status'), ['site', 'agent', 'state', 'n'], 'tags:asks-dinis'), S, 24, 20]],
], { from: 'now-24h', refresh: 60000 })

// =====================================================================================================
// 6. Distributed workloads (Dinis and Angelo): the altitudes of execution
// =====================================================================================================
const wl = DV['fringe-workloads']
const F = f => `facet:${f}`
D.workloads = dashboard('workloads', 'Distributed workloads: the altitudes of execution (Dinis and Angelo)', 'Where the agentic team\'s work runs and at what altitude: A4 swarm, A3 agent, A2 loop, A1 LLM call, A0 compute; the runtimes (R), model endpoints (M), I/O levels (L) and session modes (S); every agent\'s placement, every board item at its lowest altitude, the open-weight trials, the task packets run in other environments, the reach of each unit, and Angelo\'s run log and traces.', TAGS.swarm, [
    [[md('wl-head', `## Distributed workloads: the altitudes of execution\nDinis and Angelo's model of where the agentic team's work runs (briefs 14, 15 and the operating model, 11 November 2026). **The same shape at every size**: an objective, a mandate, a grant, a key pair, a signed result; only the altitude changes: **A4** swarm (agents of agents) · **A3** agent (a loop with an identity and a wake) · **A2** loop with tools · **A1** one LLM call · **A0** compute. Each placement names its runtime (**R1** Claude Code cloud ...), model endpoint (**M1** Anthropic, **M2/M3** open-weight via the router ...), I/O level (**L0** chat to **L5**) and session mode (**S0** stateless call, **S1** chat session, **S2** agent loop).\n\n> "Try to use as much frontier models, so much open-weight models as we can ... the point here is not to slow down." (Dinis)\n\nSources: [where agents run](https://lisbontechfringe.com/agentic-team/where-agents-run/) · [the operating model](https://lisbontechfringe.com/agentic-team/operating-model/) · data/runtimes.json, data/operating-model.json, data/work-altitudes.json (signed), data/run-reach.json, tasks/, team/angelo/.`), V, 48, 10]],
    [[metric('wl-m1', 'Agents placed', wl, C.unique('agent', 'Agents placed'), F('placement')), L, 8, 6], [metric('wl-m2', 'Board items at an altitude', wl, C.count('Board items'), F('work')), L, 8, 6],
     [metric('wl-m3', 'Packet outputs (other environments)', wl, C.count('Outputs'), F('output')), L, 8, 6], [metric('wl-m4', 'Open-weight trial answers right', wl, C.count('Right'), 'facet:trial-row and correct:true'), L, 8, 6],
     [metric('wl-m5', "Angelo's agentic activities", wl, C.count('Activities'), F('run')), L, 8, 6], [metric('wl-m6', 'Trace steps (one event page)', wl, C.count('Steps'), F('trace')), L, 8, 6]],
    [[top('wl-work-alt', 'Board items by lowest altitude', wl, 'altitude', F('work'), { label: 'Altitude' }), L, 16, 14], [heat('wl-work-heat', 'Board items: altitude by status', wl, 'altitude', 'status', F('work')), L, 16, 14],
     [donut('wl-out-alt', 'Packet outputs by altitude (a second placement)', wl, 'altitude', F('output')), L, 16, 14]],
    [[heat('wl-place-heat', 'Agents: runtime by I/O level', wl, 'runtime', 'io_level', F('placement')), L, 16, 14], [donut('wl-place-model', 'Agents by model endpoint', wl, 'model', F('placement')), L, 16, 14],
     [donut('wl-place-mode', 'Agents by session mode (S0, S1, S2)', wl, 'mode', F('placement')), L, 16, 14]],
    [[search('wl-matrix', 'The matrix: each task, who does it now, and what could', wl, ['name', 'role', 'loop', 'io_level', 'judgement', 'data_class', 'now', 'could', 'mode'], F('task')), S, 48, 15]],
    [[table('wl-reach', 'Reach of each unit: primitives needed, held, exposed, missing', wl, [['name.raw', 'Unit', 10], ['altitude', 'Altitude', 5]], [C.sum('needed', 'Needed'), C.sum('held', 'Held'), C.sum('exposed', 'Exposed'), C.sum('missing', 'Missing')], F('reach')), L, 24, 14],
     [search('wl-trials', 'Open-weight trials (A1 calls): model, cost, latency, result', wl, ['name', 'model', 'cost_usd', 'latency_ms', 'text'], F('trial')), S, 24, 14]],
    [[overTime('wl-runs-time', "Angelo's agentic activities over time (tool calls)", wl, 't', 'agent', F('run'), { interval: '30m', metricCol: C.sum('calls', 'Tool calls') }), L, 24, 14],
     [overTime('wl-trace-time', 'Trace of one event page: steps by kind', wl, 't', 'step_kind', F('trace'), { interval: '10m' }), L, 24, 14]],
    [[search('wl-runs', "Angelo's run log: one line per agentic activity", wl, ['agent', 'name', 'calls', 'text'], F('run')), S, 24, 16], [search('wl-trace', 'The trace, step by step (humans as "a person")', wl, ['n', 'step_kind', 'agent', 'name', 'label'], F('trace'), 't', 'asc'), S, 24, 16]],
    [[overTime('wl-commits', 'Commits by the architect and Angelo\'s agents', ALL('commits'), 't', 'agent', 'agent:architect.1.fringe@PrompTugal.dinis or person:angelo', { interval: '1h' }), L, 32, 14],
     [top('wl-commit-agents', 'Who builds it (commits)', ALL('commits'), 'agent', 'agent:architect.1.fringe@PrompTugal.dinis or person:angelo', { size: 15 }), L, 16, 14]],
    [[search('wl-vocab', 'The vocabulary: altitudes, runtimes, endpoints, I/O levels, modes', wl, ['facet', 'id', 'name', 'text'], 'facet:(altitude or runtime or endpoint or io_level or mode)', 'id', 'asc'), S, 48, 16]],
], { from: '2026-11-11T00:00:00.000Z', to: 'now+1h', refresh: 300000 })

// =====================================================================================================
// 7. The altitudes of execution, live (architect.1's spec: docs/handoffs/2026-11-11-altitudes-on-elastic.md)
// =====================================================================================================
const al = DV['fringe-altitudes']
D.altitudes = dashboard('altitudes', 'The altitudes of execution, live', 'Every unit of every agentic run Dinis and Angelo make: the A3 agent, its A2 loops, A1 LLM calls and A0 compute, task packets and each environment\'s results; each signed by its own key, born and signed, with its model, cost, verification and reach.', TAGS.swarm, [
    [[md('al-head', `## The altitudes of execution, live\nEvery **unit of work** in the agentic runs Dinis and Angelo make, one document each, from signed sources only (\`data/altitude-runs.json\`, written by architect.1's \`abp/tools/runs-export.mjs\`). A run is a tree: **A3** agent → **A2** loops → **A1** LLM calls and **A0** compute; or a **task packet** → each environment's **result** → its calls. Every unit has its own key (\`key_fp\`), born when it starts and signing its result; \`verified\` is that signature checked. **Reach** counts capability primitives: needed, held, and **exposure** (held but not needed): above 2 is the *mixing altitudes* finding.\n\nCompanion: [Distributed workloads](#/view/${uid('dash', 'workloads')}) (placements, matrix, Angelo's run log and traces). Fingerprints only, never key material; prompts only as their sha256.`), V, 48, 8]],
    [[metric('al-m1', 'Units', al, C.count('Units')), L, 8, 6], [metric('al-m2', 'Runs', al, C.unique('run', 'Runs')), L, 8, 6], [metric('al-m3', 'Signatures verified', al, C.count('Verified'), 'verified:true'), L, 8, 6],
     [metric('al-m4', 'Unverified signatures (should be 0)', al, { ...C.sum('unverified', 'Unverified'), params: { emptyAsNull: false } }), L, 8, 6], [metric('al-m5', 'Model spend (USD)', al, C.sum('cost_usd', 'USD')), L, 8, 6],
     [metric('al-m6', 'Units mixing altitudes (exposure > 2)', al, C.count('Mixing'), 'mixing:true'), L, 8, 6]],
    // 1. units over time by altitude
    [[overTime('al-time', '1. Units by altitude over time (when each key was born)', al, 't', 'altitude', '', { interval: 'auto' }), L, 48, 13]],
    // 2. the tree of one run
    [[table('al-tree', '2. The tree of each run: depth, altitude and role', al, [['run', 'Run', 10], ['depth', 'Depth', 5], ['altitude', 'Altitude', 5], ['role', 'Role', 6]], [C.count('Units'), C.sum('cost_usd', 'USD'), C.sum('invalid', 'Invalid answers')]), L, 24, 18],
     [search('al-tree-units', '2. Units, in the order they were born (filter on a run)', al, ['run', 'depth', 'altitude', 'role', 'unit', 'parent', 'verified'], '', 't', 'asc'), S, 24, 18]],
    // 3. Dinis and Angelo side by side
    [[table('al-people', "3. Dinis's runs and Angelo's, by environment", al, [['person', 'Person', 5], ['environment', 'Environment', 8], ['altitude', 'Altitude', 5]], [C.count('Units'), C.avg('valid_share', 'Valid share (results)'), C.sum('cost_usd', 'USD'), C.avg('latency_ms', 'Latency ms (avg)')]), L, 32, 14],
     [donut('al-people-donut', '3. Units by person', al, 'person'), L, 16, 14]],
    // 4. the keys
    [[table('al-keys', '4. The keys: one per unit, born to signed, verified', al, [['key_fp', 'Key fingerprint', 120], ['altitude', 'Altitude', 5]], [C.count('Units'), C.sum('unverified', 'Unverified'), C.max('duration_ms', 'Life ms (born to signed)')]), L, 24, 16],
     [donut('al-verified', '4. Signatures: verified or not', al, 'verified'), L, 12, 16], [top('al-life', '4. Key life by altitude (avg ms, born to signed)', al, 'altitude', '', { metricCol: C.avg('duration_ms', 'ms') }), L, 12, 16]],
    // 5. cost and latency by model and altitude
    [[table('al-models', '5. Cost and latency by model and altitude', al, [['model', 'Model', 10], ['altitude', 'Altitude', 5]], [C.count('Calls'), C.sum('cost_usd', 'USD'), C.avg('latency_ms', 'Avg latency ms'), C.max('latency_ms', 'Max latency ms')], 'model:*'), L, 24, 13],
     [overTime('al-latency', '5. Latency of each LLM call over time (avg ms)', al, 't', 'model', 'role:"llm call"', { interval: '1m', series: 'line', metricCol: C.avg('latency_ms', 'ms') }), L, 24, 13]],
    // 6. mixing altitudes
    [[top('al-mixing', '6. Mixing altitudes: reach exposure by unit (held, not needed)', al, 'unit.raw', 'reach_exposure:*', { size: 15, metricCol: C.max('reach_exposure', 'Exposure'), label: 'Unit' }), L, 24, 16],
     [table('al-mixing-alt', '6. Reach by altitude: needed, held, exposed (avg)', al, [['altitude', 'Altitude', 5]], [C.avg('reach_needs', 'Needed'), C.avg('reach_held', 'Held'), C.avg('reach_exposure', 'Exposed'), C.count('Units')], 'reach_exposure:*'), L, 24, 16]],
    // 7. retries
    [[table('al-retries', '7. Retries: LLM calls by model, attempt and validity', al, [['model', 'Model', 6], ['attempt', 'Attempt', 5], ['valid', 'Valid', 3]], [C.count('Calls'), C.avg('latency_ms', 'Avg latency ms')], 'role:"llm call"'), L, 24, 14],
     [donut('al-valid', '7. LLM calls: valid answers (false = retried)', al, 'valid', 'role:"llm call"'), L, 12, 14], [top('al-items', '7. Items that needed most attempts', al, 'item', 'role:"llm call"', { metricCol: C.max('attempt', 'Attempts'), size: 10 }), L, 12, 14]],
], { from: '2026-11-11T00:00:00.000Z', to: 'now+1h', refresh: 60000 })

// =====================================================================================================
// 8. Elastic operations: who submits what (elastic.1 keeps the deployment)
// =====================================================================================================
const subs = DV['elastic-submissions'], every = DV['fringe-*,ptnews-*,websummit-*,swarm-*,agents-*']
D.ops = dashboard('ops', 'Elastic operations: who submits what', 'For elastic.1 and Dinis: every submission by every agent (push or feed), what was held back by the privacy checks, which indices exist, who owns them and when each was last fed.', TAGS.swarm, [
    [[md('ops-head', `## Elastic operations: who submits what\nAny agent submits to its own index with \`admin/tools/elastic-submit.mjs\` (push) or commits a JSON file with an \`elastic_feed\` header that elastic.1 sends each hour (feed); dashboards come from a spec in the agent's own path (\`admin/tools/elastic-dashboard.mjs\`). The rules: **docs/elastic-guidance.md**. A **held** document failed the privacy checks (an email, a phone, a key) and was not sent; **errors** are mapping rejections. Indices are \`<fringe|ptnews|websummit|swarm|agents>-<kind>\`, owned by the agent that created them.`), V, 48, 6]],
    [[metric('ops-m1', 'Submissions', subs, C.count('Submissions')), L, 8, 6], [metric('ops-m2', 'Agents submitting', subs, C.unique('agent', 'Agents')), L, 8, 6], [metric('ops-m3', 'Documents sent', subs, C.sum('sent', 'Sent')), L, 8, 6],
     [metric('ops-m4', 'Held back by the checks', subs, { ...C.sum('held', 'Held'), params: { emptyAsNull: false } }), L, 8, 6], [metric('ops-m5', 'Mapping errors', subs, { ...C.sum('errors', 'Errors'), params: { emptyAsNull: false } }), L, 8, 6],
     [metric('ops-m6', 'Documents on Elastic', every, C.count('Documents')), L, 8, 6]],
    [[overTime('ops-time', 'Submissions over time, by agent', subs, 't', 'agent', '', { interval: '1h' }), L, 32, 13], [donut('ops-via', 'Push or feed', subs, 'via'), L, 16, 13]],
    [[table('ops-indices', 'Indices: documents, ingested by, last fed', every, [['_index', 'Index', 60], ['ingested_by', 'Ingested by', 3]], [C.count('Documents'), { ...C.max('ingested_at', 'Last fed'), dataType: 'date' }]), L, 32, 18],
     [table('ops-owners', 'Submissions by agent and index', subs, [['agent', 'Agent', 20], ['index', 'Index', 30]], [C.count('Submissions'), C.sum('sent', 'Sent'), C.sum('held', 'Held'), C.sum('errors', 'Errors')]), L, 16, 18]],
    [[search('ops-held', 'Submissions with documents held back or errors (look at these)', subs, ['agent', 'index', 'via', 'sent', 'held', 'errors', 'source'], 'held > 0 or errors > 0'), S, 48, 12]],
    [[search('ops-all', 'Every submission, newest first', subs, ['agent', 'index', 'via', 'sent', 'held', 'errors', 'owner', 'source']), S, 48, 14]],
], { from: 'now-7d', to: 'now', refresh: 60000 })

// =====================================================================================================
// 9. A1 calls, from OpenRouter (OTel traces via OpenRouter Broadcast; prompts kept out of every panel)
// =====================================================================================================
const otr = DV['traces-generic.otel-default'], GEN = 'name:"LLM Generation"', A = 'attributes.', OR = 'attributes.trace.metadata.openrouter.'
D.openrouter = dashboard('openrouter', 'A1 calls, from OpenRouter', 'Every model call the swarm makes through the router (admin/tools/llm.mjs), as OpenRouter sees it: model, provider, tokens, cost, time to first token and latency. OpenTelemetry traces sent by OpenRouter Broadcast to Elastic. Prompts are in the traces by Dinis\'s decision, and on no panel here: read them in Discover by drill-down.', TAGS.swarm, [
    [[md('or-head', `## A1 calls, from OpenRouter\nEvery model call the swarm makes through the router (\`admin/tools/llm.mjs\`) is an **A1 unit** in the altitudes. Here it is from the **provider's side**: OpenRouter sends one OpenTelemetry trace per call to Elastic (Broadcast, \`service.name: openrouter\`): the model asked and served, the provider that answered, tokens, cost, time to first token and the router's own latency. The same calls are in our ledger and, when they are part of a run, in [The altitudes of execution, live](#/view/${uid('dash', 'altitudes')}).\n\nPrompts and completions are kept in the traces by Dinis's decision, and on **no panel here**: open a trace in Discover to read one.`), V, 48, 7]],
    [[metric('or-m1', 'Model calls', otr, C.count('Calls'), GEN), L, 8, 6], [metric('or-m2', 'Cost (USD)', otr, C.sum(A + 'gen_ai.usage.total_cost', 'USD'), GEN), L, 8, 6],
     [metric('or-m3', 'Tokens in', otr, C.sum(A + 'gen_ai.usage.input_tokens', 'Tokens in'), GEN), L, 8, 6], [metric('or-m4', 'Tokens out', otr, C.sum(A + 'gen_ai.usage.output_tokens', 'Tokens out'), GEN), L, 8, 6],
     [metric('or-m5', 'Time to first token (avg ms)', otr, C.avg(OR + 'provider_time_to_first_token_ms', 'ms'), GEN), L, 8, 6], [metric('or-m6', "Router's own latency (avg ms)", otr, C.avg(OR + 'router_latency_ms', 'ms'), GEN), L, 8, 6]],
    [[overTime('or-time', 'Calls over time, by model', otr, '@timestamp', A + 'gen_ai.request.model', GEN, { interval: 'auto' }), L, 32, 13], [donut('or-provider', 'Who served them (provider)', otr, OR + 'provider_name', GEN), L, 16, 13]],
    [[top('or-cost', 'Cost by model (USD)', otr, A + 'gen_ai.request.model', GEN, { metricCol: C.sum(A + 'gen_ai.usage.total_cost', 'USD'), label: 'Model' }), L, 16, 13],
     [top('or-ttft', 'Time to first token by model (avg ms)', otr, A + 'gen_ai.request.model', GEN, { metricCol: C.avg(OR + 'provider_time_to_first_token_ms', 'ms'), label: 'Model' }), L, 16, 13],
     [donut('or-finish', 'How calls ended (finish reason)', otr, A + 'gen_ai.response.finish_reasons', GEN), L, 16, 13]],
    [[table('or-table', 'Open-weight and frontier side by side: per model and provider', otr, [[A + 'gen_ai.request.model', 'Model', 15], [OR + 'provider_name', 'Provider', 10]],
        [C.count('Calls'), C.sum(A + 'gen_ai.usage.total_cost', 'USD'), C.avg(A + 'gen_ai.usage.input_tokens', 'Avg tokens in'), C.avg(A + 'gen_ai.usage.output_tokens', 'Avg tokens out'), C.avg(OR + 'provider_time_to_first_token_ms', 'Avg TTFT ms'), C.avg(OR + 'router_latency_ms', 'Avg router ms')], GEN), L, 48, 13]],
    [[search('or-calls', 'Each call, newest first (no prompt text: open one to read it)', otr, [A + 'gen_ai.request.model', OR + 'provider_name', A + 'gen_ai.usage.input_tokens', A + 'gen_ai.usage.output_tokens', A + 'gen_ai.usage.total_cost', OR + 'provider_time_to_first_token_ms', A + 'gen_ai.response.finish_reasons', 'trace_id'], GEN, '@timestamp'), S, 48, 16]],
], { from: 'now-24h', to: 'now', refresh: 60000 })

// =====================================================================================================
// 10. The cross-conductor test (Dinis and Angelo): packets issued by one conductor, run by the other
// =====================================================================================================
const pk = DV['fringe-packets']
D.cross = dashboard('cross', 'Cross-conductor test: Dinis and Angelo, live', "Task packets issued by one person's conductor and run by the other's, through OpenRouter: who issued, who ran, in which environment and account, which models, at what cost and latency, and whether every call signed. Beside it, OpenRouter's own traces of the same calls, split by API key.", TAGS.swarm, [
    [[md('x-head', `## Cross-conductor test: Dinis and Angelo, live\nAt Dinis's word (20:3x UTC): the lead (conductor.fringe@PrompTugal.dinis) issued task packets **p3** and **p4** (A1, cheap tier) to **conductor.fringe@PrompTugal.angelo**; Angelo's conductor issues two back. Each result lands on dev as \`tasks/<id>/result-<runner>.json\`, with every A1 call signed by its own key. **elastic.1 ingests each result within about a minute of it landing.** Left: our side (packets, results, calls). Right and below: **OpenRouter's side**, the same calls as OpenTelemetry traces, split by the API key that made them. Prompts are on no panel (only their sha256 in the packets).\n\nCompanions: [The altitudes of execution, live](#/view/${uid('dash', 'altitudes')}) · [A1 calls, from OpenRouter](#/view/${uid('dash', 'openrouter')}) · [Distributed workloads](#/view/${uid('dash', 'workloads')}).`), V, 48, 8]],
    [[metric('x-m1', 'Packets issued', pk, C.count('Packets'), 'doc:packet'), L, 8, 6], [metric('x-m2', 'Results returned', pk, C.count('Results'), 'doc:result'), L, 8, 6],
     [metric('x-m3', 'Cross-conductor results', pk, { ...C.count('Cross'), params: { emptyAsNull: false } }, 'doc:result and cross:true'), L, 8, 6], [metric('x-m4', 'A1 calls inside results', pk, C.count('Calls'), 'doc:call'), L, 8, 6],
     [metric('x-m5', 'Cost of the calls (USD)', pk, C.sum('cost_usd', 'USD'), 'doc:call'), L, 8, 6], [metric('x-m6', 'Avg latency per call (ms)', pk, C.avg('latency_ms', 'ms'), 'doc:call'), L, 8, 6]],
    [[table('x-flow', 'Who issued what to whom', pk, [['packet', 'Packet', 20], ['issuer_person', 'Issued by', 5], ['runner_person', 'Run by', 5]], [C.count('Documents'), C.sum('calls', 'Calls'), C.sum('cost_usd', 'USD')], 'doc:packet or doc:result'), L, 24, 14],
     [table('x-side', 'Side by side: person, environment, account, model', pk, [['runner_person', 'Runner', 5], ['environment', 'Environment', 5], ['account', 'Account', 5], ['model', 'Model', 8]], [C.count('Calls'), C.sum('cost_usd', 'USD'), C.avg('latency_ms', 'Avg ms'), C.max('latency_ms', 'Max ms')], 'doc:call'), L, 24, 14]],
    [[overTime('x-time', 'Calls over time, by runner', pk, 't', 'runner_person', 'doc:call', { interval: '1m' }), L, 24, 13], [heat('x-ok', 'Valid answers: runner by model (count of ok calls)', pk, 'runner_person', 'model', 'doc:call and ok:true'), L, 24, 13]],
    [[search('x-results', 'Results as they land (newest first)', pk, ['packet', 'runner', 'environment', 'account', 'calls', 'cost_usd', 'valid_share', 'signed', 'cross'], 'doc:result'), S, 48, 12]],
    [[search('x-calls', 'Every A1 call: model, latency, cost, its own key (no prompt: only its sha256)', pk, ['packet', 'runner_person', 'input', 'try', 'model', 'ok', 'latency_ms', 'cost_usd', 'key_fp', 'prompt_sha256'], 'doc:call'), S, 48, 14]],
    [[overTime('x-or-key', "OpenRouter's side: calls over time, by API key", DV['traces-generic.otel-default'], '@timestamp', 'attributes.trace.metadata.openrouter.api_key_name', 'name:"LLM Generation"', { interval: '1m' }), L, 24, 13],
     [table('x-or-table', "OpenRouter's side: per key and model", DV['traces-generic.otel-default'], [['attributes.trace.metadata.openrouter.api_key_name', 'API key (name)', 6], ['attributes.gen_ai.request.model', 'Model', 8]], [C.count('Calls'), C.sum('attributes.gen_ai.usage.total_cost', 'USD'), C.avg('attributes.trace.metadata.openrouter.provider_time_to_first_token_ms', 'Avg TTFT ms')], 'name:"LLM Generation"'), L, 24, 13]],
], { from: 'now-3h', to: 'now', refresh: 30000 })

// ---------- build / import ----------
const cmd = process.argv[2]
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, objects.map(o => JSON.stringify(o)).join('\n') + '\n')
console.log(`${objects.length} saved objects (${Object.keys(D).length} dashboards) -> elastic/kibana/objects.ndjson`)
if (cmd === 'import') {
    const j = await K.importObjects(process.env.KIBANA_URL)
    for (const [k, id] of Object.entries(D)) console.log(`  ${k}: ${String(process.env.KIBANA_URL).replace(/\/+$/, '')}/app/dashboards#/view/${id}`)
    if (!j.success) process.exit(1)
}
