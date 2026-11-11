---
title: "Hand-off to elastic.1: the agentic runs on Elastic (fringe-altitudes)"
by: architect.1.fringe@PrompTugal.dinis, at Dinis's word (18:3x UTC: "I want to use elastic to visualise the agentic runs that me and Angelo are doing")
for: elastic.1.fringe@PrompTugal.dinis (Elastic is yours: index, ingest, Kibana)
---
# The agentic runs on Elastic

**The data:** `data/altitude-runs.json`, written by `node abp/tools/runs-export.mjs [--run-dir DIR]` (architect.1 re-runs it whenever a run lands; it reads only signed sources). One document per unit of work, `id` stable (a re-push updates). Today: 110 units (A3 1, A2 5, A0 2, A1 102), 109 signatures verified. It grows as Dinis and Angelo run more: every task-packet result committed in `tasks/<id>/result-*.json`, from any environment, becomes documents.

**The index:** `fringe-altitudes`. Fields:

| Field | Type | What |
|---|---|---|
| id, run, parent | keyword | the unit, its run, its parent unit (a tree: A3 -> A2 -> A1; packet -> result -> A1) |
| run_kind | keyword | altitudes, packet, packet-result |
| altitude | keyword | A0 to A4 |
| role, unit | keyword / text | agent, loop, llm call, compute, packet |
| person, runner, issuer, for | keyword | dinis, angelo ...; who ran or issued it |
| environment | keyword | where it ran (R1 Claude Code cloud, Angelo's account, later Cloudflare and AWS) |
| key_fp | keyword | the unit's key fingerprint (never key material) |
| born, signed_at | date | the key's life: born to signed |
| duration_ms | long | |
| model | keyword | |
| cost_usd | double | |
| latency_ms | long | |
| valid, verified | boolean | the answer was valid; the signature verified |
| item, attempt | keyword / integer | for LLM calls |
| outputs, valid_outputs, valid_share | integer / double | for packet results |
| reach_needs, reach_held, reach_exposure | integer | capability primitives needed, held, held-not-needed (data/run-reach.json) |
| reach_exposed, grant | keyword (array) | which primitives |

**The dashboard: "The altitudes of execution, live"** (in the agentic-team space):

1. Units by altitude over time (a stacked timeline by `born`, coloured by altitude): every run drawn as it happened.
2. The tree of one run (a Vega graph or a table grouped by `parent`): agent, loops, calls.
3. Dinis's runs and Angelo's side by side (split by `person` and `environment`): the cross-environment comparison of the same packet (valid_share, cost_usd, latency_ms, model).
4. The keys: one row per key_fp, its life (born to signed_at) and `verified`; a red count of any unverified signature.
5. Cost and latency by model and altitude.
6. **Mixing altitudes:** reach_exposure by unit and altitude, with the units whose exposure is above 2 in red (the slide-7 finding, live).
7. Retries: share of LLM calls with valid = false, by model and max_tokens (the reasoning-budget finding).

**Never:** key material (fingerprints only, as the file already does), prompt text (only its sha256 is in the sources), any person's data.

**Later, from the hook logs:** R12 'altitude' events per agent (the hook log you already index as fringe-hooklog) joined on agent and time, so a loop's start in the hook log meets its signed unit here.
