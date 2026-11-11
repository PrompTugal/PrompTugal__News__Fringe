# Kibana for the altitudes of execution: what we can use, and a demo for tomorrow

> Research by elastic.1.fringe@PrompTugal.dinis, 11 November 2026, 19:2x UTC, at Dinis's word: "an extensive research of the latest features of Kibana that we can use to help visualise and demo what we are doing here ... namely the multiple altitudes", taking in the Observability features he has enabled (Discover, Dashboards, Workflows, Alerts, Cases, SLOs). Facts are labelled: **[checked here]** was tried on our deployment at 19:1x UTC; **[docs]** is from Elastic's documentation or blog (sources at the end); **[hypothesis]** is a design idea, not yet built.

## 0. What we have

- **Version and licence [checked here]:** Kibana and Elasticsearch **9.5.6**, **Enterprise** licence (Elastic Cloud), so every feature below is licensed. The Observability solution view is on. The features API lists 65 apps, among them `agentBuilder`, `workflowsManagement`, `dashboard_v2`, `discover_v2`, `visualize_v2`, `maps_v2`, `graph`, `canvas`, `ml`, `slo`, `alerting_v2_*`, `observabilityCasesV3`, `streams`, `observabilityAIAssistant`, `searchPlayground` and `savedObjectsTagging`.
- **LLM connectors [checked here]:** Elastic's managed inference connectors are preconfigured (for example "Anthropic Claude Sonnet 3.7" through `.inference`), so the AI features work with no key of ours.
- **The data [checked here]:** 27 indices, about 15,700 documents. The altitude story is in `fringe-altitudes`, one signed unit per A3, A2, A1 and A0 (from architect.1's export), and `fringe-workloads` (placements, matrix, trials, reach, Angelo's runs and traces). Eight dashboards exist (docs/elastic-plan.md). architect.1 has also made one through the new Dashboards API: `fringe-flows-dashboard`, "the beginning, the middle, and ending" of each run.

## 1. The ranking: what shows the altitudes best

| # | Feature | What it shows of the altitudes | Status here |
|---|---|---|---|
| 1 | **ES\|QL** in Discover and Lens (`STATS ... BY altitude`, `LOOKUP JOIN`, `CHANGE_POINT`) | one query per question, live on stage: cost, validity and latency by altitude; joins of runs with placements | **[checked here]** works |
| 2 | **Vega** (with **Vega-Lite**, the "lite" one) | the **tree of a run**: A3 → A2 → A1/A0 drawn as a tree from `parent`; a swim-lane timeline from `born` to `signed_at` per key | **[docs]** Vega supports ES\|QL since 9.4; trees need full Vega |
| 3 | **Graph** (the app) | the network: agent ↔ run ↔ model ↔ environment ↔ primitive, the connections found by relevance | **[docs]** on Enterprise; works on `fringe-altitudes` keywords |
| 4 | **SLOs** | the altitude rules as targets with error budgets: "signatures verified 100%", "A1 calls valid at least 70%", "exposure at most 2" | **[checked here]** API ready, none yet |
| 5 | **Alerts and Cases** | a broken rule becomes an alert, and an alert becomes a case with its evidence (the ABP review, live) | **[docs]** rules and cases v2 enabled |
| 6 | **Workflows** | the steward loop *inside* Elastic: hourly, query, judge, open a case, ask an agent. It is itself an A2 loop we can show on its own altitude | **[checked here]** API ready, 0 workflows |
| 7 | **Agent Builder** (+ its **MCP server**) | ask the data in plain words on stage ("which units mix altitudes?"); custom ES\|QL tools; our agents can call it over MCP | **[checked here]** default agent present |
| 8 | **AI dashboards** (chat → ES\|QL dashboards, Vega-Lite charts from a sentence) | build a panel live from a question in front of the audience | **[docs]** GA in 9.5 |
| 9 | **Dashboards API** (as code, GA 9.5) and **collapsible sections, controls anywhere, ES\|QL variable controls** | one dashboard per altitude in sections; a control "altitude = A1" that drives every ES\|QL panel | **[docs]**, and architect.1 already uses the API |
| 10 | **AIOps** (log rate analysis, pattern analysis, change points) | why a spike happened: which agent or model explains the jump in retries | **[docs]**; `CHANGE_POINT` **[checked here]** |
| 11 | **Maps** (ES\|QL layers) | the events and venues of the week, beside the swarm that lists them | **[docs]**; our events have no coordinates yet |
| 12 | **Canvas** | a full-screen presentation workpad | **[docs]** for upgraded installs with existing workpads only: not for us |

## 2. Each feature, and how we would use it

### 2.1 ES|QL: the live query (best for the demo)

**[docs]** ES|QL is the piped query language now behind Discover, Lens, Maps, Vega, alerts and AI dashboards:
- `LOOKUP JOIN` is GA since 9.1.
- `CHANGE_POINT` (spikes, dips and trend changes, at least 22 values) is in preview since 9.1, and GA in Discover in 9.5.
- `FORK` is listed as preview.
- `BUCKET` gives time series.

**[checked here]** On `fringe-altitudes` today:

```
FROM fringe-altitudes
| STATS units = COUNT(*), usd = SUM(cost_usd), avg_ms = AVG(latency_ms), invalid = SUM(invalid) BY altitude, role
```

The query returns, by altitude:

| Altitude | Units | Cost (USD) | Notes |
|---|---|---|---|
| A3 | 1 agent | | |
| A2 | 4 loops and 1 packet | 0.0014 | |
| A1 | 100 LLM calls | 0.0072 | avg 2,353 ms; **38 invalid** |
| A0 | 2 compute | | |

One query is the whole altitude ladder with its cost. Then:

```
FROM websummit-commits, ptnews-commits, fringe-commits | WHERE t > "2026-11-09"
| STATS commits = COUNT(*) BY bucket = BUCKET(t, 1 hour) | CHANGE_POINT commits ON bucket
```

This finds a **trend change at 10 November 17:00 UTC** (p = 1.5e-7): the day the swarm's pace changed, found by the engine, not by us.

**[hypothesis] Use it as follows:**
- Add a `lookup` index `swarm-agents-lookup`, keyed by agent: its altitude, runtime, model, account and person, from `fringe-workloads` placements. Then `LOOKUP JOIN` every commit, run and hook event to its agent's placement: "what share of A1 work ran on an A3 runtime?" is then one query, which is the mixing-altitudes question across the whole history.
- Add ES|QL variable controls to the altitude dashboards (`?altitude`, `?person`).

### 2.2 Vega and Vega-Lite: draw the tree

**[docs]** Vega and Vega-Lite are Kibana's custom-chart grammars. Vega-Lite is the compact one (charts from a few lines). Full Vega has layouts: **tree**, **force-directed network** and **partition/sunburst**. Since 9.4 a Vega panel can read **ES|QL**. Since 9.5 the AI chat can write Vega-Lite from a sentence. Vega cannot run conditional queries or draw tables.

**[hypothesis] Three panels for the altitudes:**
1. **The run tree:** a Vega `tree` layout over `fringe-altitudes`, with nodes `id`, links `parent`, coloured by altitude, sized by cost, and red where `valid = false` or `verified = false`. It shows one run as the architecture it is: agent, loops, calls.
2. **Key lifelines (Vega-Lite):** one horizontal bar per key from `born` to `signed_at`, a lane per altitude. The A3 key spans the run, A2 keys nest inside it, and A1 keys are short ticks. It shows "every unit has its own identity, born and signed" at a glance.
3. **Sunburst of reach (Vega `partition`):** altitude → unit → primitives held, coloured needed versus exposed. Mixing altitudes is the red outer ring.

### 2.3 Graph: the network of who-ran-what-where

**[docs]** The Graph app explores relationships in an index: terms become vertices, and co-occurrence becomes connections ranked by relevance. You can expand, link, undo and save. It is on our licence.

**[hypothesis]** On `fringe-altitudes` and `fringe-workloads`, with vertices `runner`, `altitude`, `model`, `environment`, `reach_exposed` and `person`. On stage, start at "dinis", expand to the runs, then to the models and the environments. When Angelo's results land, his environment appears as a second cluster, and the shared packet links the two.

### 2.4 SLOs: the altitude rules as service levels

**[checked here]** The SLO API answers, with no SLOs yet.

**[docs]** An SLO is a target over a KQL or custom query, with an error budget and burn-rate alerts.

**[hypothesis] Five SLOs that are the operating model's rules:**

| SLO | Indicator (on) | Target |
|---|---|---|
| Every unit signs and verifies | `verified:true` / all units (`fringe-altitudes`) | 100% |
| A1 calls answer validly | `valid:true` / `role:"llm call"` | ≥ 70% (today 62%: **burning**) |
| No unit holds more than it needs | `reach_exposure <= 2` / units with reach | ≥ 95% (today 5 of 86 units with reach fail: every A2 loop and A0 compute unit, exposure 20 to 22) |
| Feeds land and nothing is held | `held:0 and errors:0` / submissions (`elastic-submissions`) | ≥ 99% |
| Agents finish their runs | runs with `outcome:ok` (`ptnews-runs`, `websummit-runs`) | ≥ 95% |

The SLO overview then shows the health of the operating model as a whole. This is the strongest single picture for the "governed agents" story.

### 2.5 Alerts and Cases: the review, live

**[docs]** Alerting rules (ES|QL, KQL, threshold, SLO burn rate) fire alerts, and Cases gathers alerts, visualisations, comments and files into one tracked item with its own timeline.

**[hypothesis] Rules:**
- unverified signature > 0;
- exposure > 2 on a new unit;
- a held submission;
- an ask for Dinis older than 2 hours;
- an R5, R8 or R9 `deny` in the hook log.

Each rule opens or updates a **case** per agent, so architect.1's hourly ABP review becomes a case list with evidence attached. On stage: a red alert, click, the case, the unit, its key.

### 2.6 Workflows: the steward loop, inside Elastic

**[docs]** Workflows are YAML (triggers, inputs, steps), GA in 9.4, with alert, scheduled and manual triggers. Their steps cover:
- Elasticsearch and Kibana actions;
- connectors;
- Agent Builder agents;
- Streams;
- workflows exposed back to Agent Builder as tools.

They are created by `POST /api/workflows/workflow`. **[checked here]** 0 workflows exist; the API answers.

**[hypothesis]** Two workflows:
1. `steward-hourly` (schedule): runs the ES|QL over `elastic-submissions` for held, errors and late feeds; opens or updates a case per agent; asks the AI agent to write a two-line summary into the case.
2. `altitude-check` (alert-triggered): when the exposure rule fires, it fetches the unit and its run, and attaches both to the case.

A workflow is an **A2 loop** in our own vocabulary, so we can show the platform running work at the right altitude.

### 2.7 Agent Builder and its MCP server: ask the data

**[docs]** Agent Builder makes chat agents over Elasticsearch, with built-in tools (search, ES|QL generation including JOINs) and **custom tools** (parameterised ES|QL, index search, workflows). It serves an **MCP server** at `{KIBANA_URL}/api/agent_builder/mcp` (API key or OAuth 2.1), and can itself call external MCP tools. **[checked here]** The default "Elastic AI Agent" is present, with its built-in tools.

**[hypothesis]** Make an **"Altitudes analyst"** agent with four custom ES|QL tools:
- `units_by_altitude(run)`
- `mixing(threshold)`
- `retries(model)`
- `compare_environments(packet)`

Our own agents (architect.1, Angelo's conductor) call it over MCP: a swarm agent (A3) asking a platform agent which runs an A1 query. That is the altitudes, crossing systems. It needs an API key per caller, for Dinis to decide.

### 2.8 AI dashboards and Vega-Lite from a sentence

**[docs]** In 9.5 (GA), Kibana's AI chat builds whole ES|QL-backed dashboards from a prompt in under a minute, and Vega-Lite charts (scatter, box plot, custom tooltips) from a sentence, with execute-and-verify loops and retries.

**[hypothesis]** On stage, ask: "a box plot of latency by attempt for LLM calls in fringe-altitudes". The chart appears, and it is built by an agent at A1 or A2 inside the platform.

### 2.9 Dashboards as code, sections and controls

**[docs]**
- **Dashboards API:** GA in 9.5, five endpoints (create, read, upsert, delete, list), by-value Lens panels; maps and Vega are coming. There is also a Terraform resource.
- **9.4 dashboards:** controls can be placed anywhere, and a control inside a collapsible section filters only that section. Collapsed sections don't load.
- **ES|QL variable controls:** GA, and chainable.
- **Read-only sharing:** "Can view" per dashboard.
- **Embedding:** from the Share menu.

**[hypothesis]**
- Rebuild "The altitudes of execution, live" with **one collapsible section per altitude** (A4 swarm, A3 agent, A2 loop, A1 call, A0 compute). Each section gets its own control and the same panels, scoped by its altitude. The dashboard *is* the ladder.
- Move our generator from saved-objects import to the Dashboards API, which is cleaner and versioned. Our kit stays: only the transport changes.

### 2.10 AIOps, Streams, Maps, Canvas

- **AIOps [docs]:**
  - log rate analysis (which fields explain a spike);
  - pattern analysis (groups messages into patterns);
  - change point detection.
  Uses for us **[hypothesis]**:
  - on the spike of invalid A1 calls, it would name the model or the item;
  - on `ptnews-runs`, it would name the agent behind a burst.
- **Streams [docs]:** log streams with AI "significant events" (a Discovery agent and a Judge agent); in technical preview. It is a candidate later, for raw hook logs swarm-wide.
- **Maps [docs]:** ES|QL layers (tooltips are not supported on them), heat maps on `geo_point`. Our events need coordinates first (`data/places.json` has `lat` and `lon` fields, mostly empty).
- **Canvas [docs]:** only for upgraded installs with existing workpads. Use dashboards in full-screen view instead.

## 3. The demo at Web Summit tomorrow (12 minutes)

1. **The swarm** (dashboard "PrompTugal swarm"), 1 min: 10,000+ commits, 188 agents, 7 people, three sites, all in one view.
2. **The ladder** ("The altitudes of execution, live"), 2 min: units by altitude over time, a run's tree, the keys born and signed, 109 of 110 verified.
3. **One query** (Discover, ES|QL), 2 min: the `STATS ... BY altitude` above. Then `CHANGE_POINT` finds the day the pace changed.
4. **The network** (Graph), 2 min: dinis → runs → model → environment. Angelo's cluster if his results have landed.
5. **The rules as SLOs** (SLO overview), 2 min: five SLOs. "A1 calls valid" is burning (62% against 70%). Click through to the alert and its case.
6. **Ask it** (Agent Builder), 2 min: "which units hold primitives they don't need, and in which run?"
7. **The loop that watches** (Workflows), 1 min: the steward workflow's last run and the case it opened.

## 4. What to build next, in order (each small)

1. **[now] SLOs** (five) and **alert rules** (five), from the tables above, through the APIs. *Low risk, high demo value.*
2. **[now]** The **run-tree Vega panel** and the **key-lifelines Vega-Lite panel** on dashboard 7.
3. **[now]** A **Graph workspace** saved on `fringe-altitudes`.
4. **[next] The "Altitudes analyst" agent** in Agent Builder, with four ES|QL tools. MCP access for our agents needs API keys, Dinis's decision.
5. **[next]** The **steward workflow** (hourly), which opens cases.
6. **[next]** `swarm-agents-lookup` as a lookup index, then `LOOKUP JOIN` panels.
7. **[later]** Move dashboards to the Dashboards API, with sections per altitude and ES|QL variable controls.
8. **[later]** Coordinates for venues, then Maps.

## 5. The credential (Dinis, 19:1x UTC)

"for now we will share that super user pwd but control that using ABPs so that only the elastic and architect agent can use that environment variable". So:
- only **elastic.1** and **architect.1** read `ELASTIC_CLOUD` and push directly;
- every other agent uses the **feed** (docs/elastic-guidance.md, section 3), which elastic.1 sends under the committing agent's name;
- the ABP rule is architect.1's to write (abp/ is its), and it has been told.

## Sources

- Kibana release notes: https://www.elastic.co/docs/release-notes/kibana
- What's new in Kibana Dashboards (9.4): https://www.elastic.co/search-labs/blog/kibana-dashboards-improvements
- Collapsible sections: https://www.elastic.co/search-labs/blog/kibana-dashboard-build-layout
- Variable controls: https://www.elastic.co/search-labs/pt/blog/kibana-dashboard-interactivity-variable-controls-overview
- Dashboards as code (API, Terraform): https://www.elastic.co/search-labs/blog/dashboards-as-code-kibana-api and https://www.elastic.co/search-labs/blog/kibana-dashboards-as-code-terraform-api
- AI dashboards and Vega-Lite: https://www.elastic.co/search-labs/blog/ai-dashboards-kibana-vega-lite and https://www.elastic.co/search-labs/blog/ai-dashboard-generation-elastic-agent-kibana
- Vega in Kibana: https://www.elastic.co/docs/explore-analyze/visualize/custom-visualizations-with-vega ; https://www.elastic.co/blog/custom-vega-visualizations-in-kibana
- Graph: https://www.elastic.co/docs/explore-analyze/visualize/graph
- ES|QL commands (LOOKUP JOIN, CHANGE_POINT): https://www.elastic.co/docs/reference/query-languages/esql/commands/processing-commands ; https://www.elastic.co/search-labs/blog/esql-elasticsearch-8-19-9-1 ; https://www.elastic.co/docs/reference/query-languages/esql/commands/lookup-join
- Agent Builder and MCP: https://www.elastic.co/docs/solutions/search/agent-builder/mcp-server ; https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools/custom-tools ; https://www.elastic.co/search-labs/blog/elasticsearch-agent-builder-mcp-aws-agentcore
- Workflows: https://www.elastic.co/search-labs/blog/elastic-workflows-automation ; https://www.elastic.co/docs/api/doc/kibana/operation/operation-post-workflows-workflow
- AIOps: https://www.elastic.co/guide/en/kibana/current/xpack-ml-aiops.html
- Streams significant events: https://www.elastic.co/docs/solutions/observability/streams/significant-events/operator-guide
- Maps heat map: https://www.elastic.co/guide/en/kibana/current/heatmap-layer.html
- Canvas: https://www.elastic.co/docs/explore-analyze/visualize/canvas
- Read-only dashboards and sharing: https://www.elastic.co/search-labs/blog/kibana-dashboards-read-only-permissions ; https://www.elastic.co/docs/explore-analyze/dashboards/sharing
