# Moving the swarm onto Elastic Cloud: the plan

> Kept by elastic.1.fringe@PrompTugal.dinis, 11 November 2026, 16:36 UTC. Mandate: Dinis, 16:30 UTC, in architect.1's session ("I want to move us to Elastic, because we're going to use the Elastic Cloud here to do a bunch of stuff"; briefs/2026-11-11-1630-r5-r8-r9-enforced-and-elastic.md). Material for the lead and Dinis; nothing here is sent to Elastic until Dinis gives the deployment and a key.

## Status (16:36 UTC)

- **Fact:** no Elastic deployment is attached to this swarm yet. Its endpoint host and an API key are asked of Dinis (team/dinis/agents/elastic.1.json, asks).
- **Fact:** this session's network reaches cloud.elastic.co and api.elastic-cloud.com (read 16:35 UTC); whether it reaches the deployment's own host is unknown until we have it.
- **Ready without a key:** the index design (below), its strict mappings in `elastic/mappings/`, and `admin/tools/elastic.mjs`, which builds and checks every document locally before anything is sent. First build (16:36 UTC): events 178, graph 38, tasks 4, models 7, this session's hook log 28 documents; 0 privacy findings. `fringe-runs` is not built yet: the run records are sealed to observability's drain key, so it needs observability.fringe@'s drain or a copy of its output.

## What goes first, and why

| Order | Index | Source today | Why it goes first |
|---|---|---|---|
| 1 | `fringe-hooklog` | each session's `~/.abp/log/<session>.jsonl` (the ABP hook's decisions) | Today each machine's log stays on that machine: the hourly policy review (architect.1, `abp.mjs review`) sees commits only, not calls. One index makes the review swarm-wide. The highest value per byte, and the one no other tool gives us. |
| 2 | `fringe-runs` | `admin/tools/agent-log.mjs` records (type web-summit.agent-run/v1), drained by observability.fringe@ | Who ran, when, what they read and did, across accounts: the dashboard's numbers become queries. Written beside the existing lane, never instead of it. |
| 3 | `fringe-events` | `data/events.json` (178 events, each with url and read_at) | Full-text and faceted search (day, kind, topic, place, persona, cost) and "what's on near me now" with a geo_point, for /now/ and the iOS app. The site stays static: Elastic is an extra reader, never the source of truth. |
| 4 | `fringe-graph` | `data/graph/*.json` (festivals, organisers, personas, sessions) | The semantic graph as documents with their edges, for "events like this one" and organiser pages. |
| 5 | `fringe-tasks` | `tasks/*/packet.json` and `result-*.json` | Task packets and their signed results, searchable by altitude, agent and outcome. |
| 6 | `fringe-models` | `data/models-ledger.json` (day summaries only) | Spend and calls per model and agent per day. Summaries only: never request or response text (CLAUDE.md). |

Later, once 1 to 6 hold: the dashboards (Kibana) for the hook log and the runs, and a read-only search key for the site.

## The index design

- **One index per kind** (above), each with an explicit mapping (`elastic/mappings/<kind>.json`), dynamic mapping off (`"dynamic": "strict"`), so a stray field fails loudly instead of leaking in.
- **Every document carries:**
  - `source`: where it came from (a repository path at a commit, or a public URL);
  - `read_at`: the UTC time it was read (from the source when it has one, else the clock at ingest);
  - `signer`: the agent whose key signed or committed it (the `Agent:` trailer, the hook log's `agent`, the result's signer), with its key id from data/keys.json;
  - `ingested_at`, `ingested_by` (elastic.1's name) and `commit` (the repository commit read).
- **Document ids are stable** (`<kind>:<id>` hashed), so a re-ingest updates, never duplicates.
- **Hypotheses stay labelled:** an event's `status` (on, moved, cancelled, unknown) and `check` go in as they are; nothing is inferred at ingest.

## What never goes to Elastic

- Contact details, private people, guest lists, submissions' contact fields: the ingest tool drops any field named like a contact (email, phone, contact, attendees) and fails on a value that looks like an email or a phone number.
- Keys, tokens, vault keys: the hook log already redacts commands; the tool runs a second redaction (anything key-shaped is replaced) and fails closed.
- Model request or response text; raw captures; anything behind a login.
- The Elastic key itself: it lives only as a network secret on the cloud environment (the proxy adds it) or in the environment of the process, never in the repository, a log or the conversation (R8).

## The ingest tool

`admin/tools/elastic.mjs` (Node, no dependencies):

```
node admin/tools/elastic.mjs build  --kind events|graph|tasks|models|hooklog   # documents to elastic/out/ (outside git), checked
node admin/tools/elastic.mjs check  --kind ...                                  # the privacy checks only
node admin/tools/elastic.mjs mapping --kind ...                                 # prints the mapping
ELASTIC_URL=https://<host> node admin/tools/elastic.mjs push --kind ...         # _bulk to the index; the key from the proxy
```

## Steps and their altitudes

1. A0: the mappings and the build and checks (this run).
2. A0: first push of `fringe-events` and `fringe-graph` (public data, lowest risk) once the host and key are here.
3. A0: `fringe-hooklog` from this session's log; then ask the lead how each machine sends its own (a line in each agent's wake, after agent-log.mjs).
4. A2: the Kibana views and the review's queries, with architect.1.

## Live on Elastic Cloud (17:40 UTC)

At Dinis's word (17:3x UTC): "start putting as much data as you can in Elastic ... not just one dashboard for the fringe ... also one for the main PrompTugal website, and one for the Web Summit site". Kibana: https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io (log in with your own Elastic Cloud account).

**The data (about 15,000 documents, 20 indices):**

| Site | Repository | Indices |
|---|---|---|
| Lisbon Tech Fringe | PrompTugal/PrompTugal__News__Fringe | fringe-events, -graph, -tasks, -models, -hooklog (admin/tools/elastic.mjs); fringe-commits, -content, -entities, -status (admin/tools/elastic-sites.mjs) |
| PrompTugal.news | PrompTugal/PrompTugal__News__Website | ptnews-commits (4,400), -content (717), -entities (894: stories, companies, organisations, events, places, evidence), -runs (1,717), -status |
| Web Summit site | SGit-AI/SGit-AI__Website__Web-Summit | websummit-commits (5,266), -content (630), -entities (293: sessions, side events, companies, channels, plan, xray metadata), -runs, -status |

Every commit is attributed from its `Agent:` trailer (read from the body when git does not parse it), else the agent named in its subject; 43 of 10,124 stay unattributed. The person is the last part of the agent's name. Never indexed: people profiles (data/people, people/), mail, meetings, CRM, cast and team rosters, sealed data, inboxes, outreach desks, keys files (elastic/sites.json, "never"); model research text (xray: metadata only).

**The dashboards** (admin/tools/elastic-kibana.mjs, saved objects generated by it, outside git (they outgrew the 256 KB rule), imported by id so a re-run updates):

1. [PrompTugal swarm: three sites, one view](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/1da64aaa-b205-96e6-f1c0-c0fc2d14d21b)
2. [Lisbon Tech Fringe: the week live](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/7b9dd4c4-44c0-5e50-8aea-61fd6d0a8bce)
3. [PrompTugal.news: the agentic newsroom](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/2b70a3e5-934d-a6a6-47a7-aeb0c3e86fc5)
4. [Web Summit site: the team's field guide](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/2dc54923-4403-396d-1248-9ea115980957)
5. [The agentic team: who did what, and under which policy](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/0352d7e2-ae87-b872-92d0-07935940f0f4)

6. [Distributed workloads: the altitudes of execution (Dinis and Angelo)](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/d92f4855-670e-f9d4-2337-db284d6856f6): from fringe-workloads (admin/tools/elastic-workloads.mjs, 252 documents in 15 facets: runtimes, endpoints, I/O levels, modes, agent placements, the matrix, altitudes, open-weight trials, board items by altitude, reach, task packets and outputs, Angelo's run log and traces; humans in traces written as "a person").

7. [The altitudes of execution, live](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/b6e128c4-656b-1555-c326-44248b5b62f9): from fringe-altitudes (admin/tools/elastic-altitudes.mjs, architect.1's data/altitude-runs.json and spec docs/handoffs/2026-11-11-altitudes-on-elastic.md): units over time, each run's tree, Dinis and Angelo by environment, the keys and their verification, cost and latency by model, mixing altitudes, retries.

8. [Elastic operations: who submits what](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/be32994e-fc12-7ec8-e93b-315c6135a4e6): every submission by every agent (push or feed), held back and errors, every index and when it was last fed.

**Every agent submits** (from 19:00 UTC, Dinis: "make sure that you're not a bottleneck"): docs/elastic-guidance.md. Push to your own index (admin/tools/elastic-submit.mjs; the owner is kept in the index's _meta), or commit a feed (a JSON with "elastic_feed", sent hourly by elastic.1 under the committing agent's name), and make your own dashboards from a spec (admin/tools/elastic-dashboard.mjs, kit admin/tools/elastic-kibana-lib.mjs). The catalog: data/elastic-catalog.json, fed to swarm-elastic-catalog.

25 data views (one per index, plus "All sites" views for commits, content, entities, runs and status), four tags, saved searches for the documents themselves (full-text search over every page of writing).

**To refresh:** `ELASTIC_URL=... node admin/tools/elastic.mjs push --kind all; node admin/tools/elastic-sites.mjs push --site all; KIBANA_URL=... node admin/tools/elastic-kibana.mjs import` (clones of the two other sites in ~/promptugal/, `git pull` first).

## Log

- 17:09 UTC: the password is in the session (ELASTIC_CLOUD, Dinis); the endpoint host is still unknown, so nothing is sent.

- 17:23 UTC: Dinis gave the deployment (Kibana https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/). Elasticsearch is my-observability-deployment-cd4ce8.es.us-central1.gcp.cloud.es.io (9.5.6), user elastic with the password from ELASTIC_CLOUD. First push, 0 errors: fringe-events 178, fringe-graph 50, fringe-tasks 4, fringe-models 7, fringe-hooklog 53 (this session's hook log only). Checked: a search for "AI" on 12 November returns 11 events.

- 18:10 UTC wake: refreshed, 0 errors: fringe-events 179, fringe-hooklog 116, fringe-commits 486, ptnews-commits 4,416, ptnews-runs 1,724, websummit-commits 5,277; 112 Kibana objects re-imported. No new brief.

- 18:28 UTC: at Dinis's word ("a new dashboard that is going to focus on the work me and Angelo are doing on distributed workloads"): fringe-workloads (252 documents) and dashboard 6, rendered with 0 error panels.

- 18:34 UTC: fringe-altitudes (110 units, 109 verified, 0 held) and dashboard 7 from architect.1's export and spec (material; Dinis's ask of 18:2x covers it); 44 panels, 0 errors. Findings on it: 38% of LLM calls invalid and retried; 5 compute and loop units with reach exposure 20 to 22. No unit of Angelo's yet.

- 19:00 UTC: at Dinis's word, every agent can submit: guidance, submit, feeds, own dashboards, the catalog and the operations dashboard; tested (an email held back, a contact field dropped, another agent refused on an owned index, a bad name refused, a feed sent). architect.1 told by session message, at Dinis's word, with the commands and four candidate indices for the work with Dinis and Angelo.

- 19:08 UTC: architect.1 owns swarm-flows (60) and swarm-abp-reviews (63, pushed through elastic-submit.mjs); ABP 0.4.1 R8e keeps ELASTIC_CLOUD to elastic.1 and architect.1. The APM endpoint answers: OTLP traces of the runs can go to Elastic APM directly (a token to decide).

- 19:10 UTC wake: 27 indices, 16,019 documents refreshed, 0 errors; fringe-altitudes 132 units (a second run at 18:57: A3 2, A2 8, A1 118, A0 4), 130 verified; the 2 without are the A3 agent units, which sign with the session key, not a per-unit key (not a failure); no unit of Angelo's yet; submissions in the hour: architect.1 swarm-abp-reviews 0 held 0 errors; nothing to write back. No new brief.

- 19:30 UTC: at Dinis's word ('can you now generate some traffic?'), 28 model calls through the router (task WS-215/elastic-traffic/classify-event: 12 public Fringe events; cheap deepseek-v4-flash 12, check llama-3.3-70b 12, strong claude-sonnet-5.5 4), 0.0105 USD, all ledgered; OpenRouter sent 56 spans to traces-generic.otel-default. Dashboard 9 [A1 calls, from OpenRouter](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/abaa023e-80ff-61c8-c8c4-1026793833ed): 28 panels, 0 errors, no prompt text on any panel. Seen: 7 providers served them; time to first token about 130 to 200 ms (open weight) against 1,877 ms (Sonnet); 17.9% ended at 'length' (max_tokens 200 too low, 2 of 4 Sonnet calls included).

- 20:11 UTC wake: 27 indices, about 16,300 documents refreshed. fringe-events had 30 rejected: read_at with trailing punctuation ('2026-11-11T11:55:00Z;' x27, '...Z.' x3) since researcher.2's 33587a6; my ingest now takes the leading ISO time (0 errors), and researcher.2 is told. Mirrors are now pruned: a record gone from its source file leaves Elastic (events 1, graph 12, models 3 removed). Submissions in the hour: architect.1 swarm-flows (live, through logSubmission) and swarm-abp-reviews (68), 0 held, 0 errors. OpenRouter: 55 calls traced so far (27 new Sonnet calls from another agent, about 0.44 USD). No new brief.

- 20:35 UTC: the cross-conductor test (Dinis's word, relayed by the lead at 20:3x): fringe-packets (admin/tools/elastic-packets.mjs: packets, results, A1 calls and each run's flow events) and dashboard 10 [Cross-conductor test: Dinis and Angelo, live](https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/app/dashboards#/view/c05d37c3-bf3c-6cb2-e2c9-a7dda8441c97) (34 panels, 0 errors). A watcher re-ingests within about a minute of any change to tasks/, the models ledger or the altitude runs until about 22:3x UTC. Results: Angelo's conductor ran p3 6/6 and p4 4/4 valid; the lead ran Angelo's p3-persona-for-6-events 4/6 and p5 2/4. OpenRouter's side: 10 calls on key dc:promptugal:agents match Angelo's. The generated Kibana objects left git (over 256 KB); pushIndex now adds new fields to existing indices.

- 21:10 UTC wake: 28 indices, 16,656 documents refreshed, 0 errors (fringe-entities: 7 removed, gone from the source); fringe-packets 99 (6 packets, 6 results, 39 calls, 48 flow events; 4 cross-conductor results). Submissions in the hour: architect.1 swarm-flows 4 pushes, 120 events, 0 held, 0 errors. OpenRouter: 89 calls traced (42 on dc:promptugal:agents, 47 on dc:newsroom.ai:browser:oct-2026, about 0.45 USD). The swarm-flows export for neo4j.1 is now 110 events. data/events.json still has 30 malformed read_at (researcher.2 asked; trimmed at ingest). No new brief.

- 22:09 UTC wake: 28 indices, 16,805 documents refreshed, 0 errors; fringe-packets unchanged (99). Submissions in the hour: architect.1 swarm-flows 48 events, 0 held, 0 errors. OpenRouter: 150 calls traced (103 on dc:promptugal:agents, up 61 this hour; 47 on dc:newsroom.ai:browser:oct-2026; about 0.47 USD in all). data/events.json still has 30 malformed read_at (researcher.2 asked at 20:1x; trimmed at ingest). No new brief.

- 23:09 UTC wake: 28 indices, 16,883 documents refreshed, 0 errors (fringe-content: 1 removed, gone from the source). Submissions in the hour: architect.1 swarm-flows 48 events, 0 held, 0 errors. OpenRouter: 453 calls traced, 406 on dc:promptugal:agents (303 more this hour, about 0.37 USD on that key; dashboard 9 shows which models), 47 on dc:newsroom.ai:browser:oct-2026. data/events.json still has 30 malformed read_at (trimmed at ingest). No new brief.

- 00:10 UTC wake: 28 indices, 18,421 documents refreshed, 0 errors. swarm-flows grew to 1,534 events: swarm.1.fringe@PrompTugal.dinis in R8 GitHub Actions (PrompTugal__News__Swarm__Runs) wrote 1,216 live events this hour (19 flows), 0 held, 0 errors. The export for neo4j.1 is now compact and chunked (columns plus rows, repeated values in a dict, chunks of at most 200 KB: 2 chunks, 344 KB instead of 1,004 KB), so it stays under the 256 KB rule (finding 45). OpenRouter: 807 calls traced, 760 on dc:promptugal:agents (354 this hour, about 0.93 USD on that key). data/events.json still has 30 malformed read_at. No new brief.

- 07:11 UTC wake (first after night hours): 28 indices, 18,819 documents refreshed, 0 errors. Overnight (00:10 to 07:00 UTC) on Elastic: no agent submissions, no new swarm-flows events (swarm.1's last at 00:00:54 UTC; 1,534 events in all): the swarm agents spent the night building the demo packs (stage, harness, vaults, audience), not executing runs, and are ready for Dinis at 07:00 (swarm.1.dev: 'Elastic drawn'). OpenRouter: 827 calls traced (760 on dc:promptugal:agents, unchanged overnight; 67 on dc:newsroom.ai:browser:oct-2026, 20 overnight). data/events.json still has 30 malformed read_at (researcher.2 asked; trimmed at ingest). No new brief since brief 16.

## Asks

- ~~**Dinis:** the Elastic Cloud deployment's Elasticsearch endpoint host~~ (given at 17:23 UTC). Still: an API key limited to the fringe-* indices, to replace the elastic superuser password, and `my-observability-deployment-cd4ce8.es.us-central1.gcp.cloud.es.io` added to elastic.1's sends in its ABP (architect.1). Originally asked: the endpoint host (e.g. `<name>.es.<region>.<cloud>.elastic-cloud.com`) and an API key limited to the `fringe-*` indices, saved as a network secret on this cloud environment (never in chat).
