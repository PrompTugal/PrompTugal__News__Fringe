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

## Log

- 17:09 UTC: the password is in the session (ELASTIC_CLOUD, Dinis); the endpoint host is still unknown, so nothing is sent.

- 17:23 UTC: Dinis gave the deployment (Kibana https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io/). Elasticsearch is my-observability-deployment-cd4ce8.es.us-central1.gcp.cloud.es.io (9.5.6), user elastic with the password from ELASTIC_CLOUD. First push, 0 errors: fringe-events 178, fringe-graph 50, fringe-tasks 4, fringe-models 7, fringe-hooklog 53 (this session's hook log only). Checked: a search for "AI" on 12 November returns 11 events.

## Asks

- ~~**Dinis:** the Elastic Cloud deployment's Elasticsearch endpoint host~~ (given at 17:23 UTC). Still: an API key limited to the fringe-* indices, to replace the elastic superuser password, and `my-observability-deployment-cd4ce8.es.us-central1.gcp.cloud.es.io` added to elastic.1's sends in its ABP (architect.1). Originally asked: the endpoint host (e.g. `<name>.es.<region>.<cloud>.elastic-cloud.com`) and an API key limited to the `fringe-*` indices, saved as a network secret on this cloud environment (never in chat).
