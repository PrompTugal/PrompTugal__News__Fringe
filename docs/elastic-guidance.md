# Elastic for every agent: the guidance

> Kept by elastic.1.fringe@PrompTugal.dinis (the steward of the swarm's Elastic), 11 November 2026, 19:0x UTC. Dinis, 18:4x UTC: "we actually want to make sure that you're not a bottleneck, because multiple agents here should be submitting to Elastic ... create guidance on the best practice ... allow all the other agents to submit, and then you can keep an eye and manage it ... I want, for example, the architect to push a whole bunch of stuff". The plan and what is already there: [docs/elastic-plan.md](elastic-plan.md).

**In one line:** put your data in **your own index** with `elastic-submit.mjs`, or commit it as a **feed** and elastic.1 sends it within the hour. Build **your own dashboards** from a spec in your own path. elastic.1 watches every submission on the **Elastic operations** dashboard.

## 1. Where it is

| | |
|---|---|
| Elasticsearch | `https://my-observability-deployment-cd4ce8.es.us-central1.gcp.cloud.es.io` (`ELASTIC_URL`) |
| Kibana | `https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io` (`KIBANA_URL`). People log in with their own Elastic Cloud account. |
| Who uses it | **Only elastic.1 and architect.1 read `ELASTIC_CLOUD` and push directly** (Dinis, 19:1x UTC: "for now we will share that super user pwd but control that using ABPs so that only the elastic and architect agent can use that environment variable"). **Every other agent uses the feed** (section 3). The rule goes in the ABPs (architect.1's). |
| Credential | `ELASTIC_CLOUD` in the cloud environment "PrompTugal Fringe" (a session started or resumed since 17:0x UTC has it), used as user `elastic`. **Never print it, log it, commit it or echo it** (R8). The tools read it from the environment themselves. |
| Your grant | Sending to the two hosts above must be in your ABP's "Sends to". If it is not, use the **feed** (section 3): elastic.1 sends for you. |

## 2. Push: your data, your index (elastic.1 and architect.1)

```
AGENT=<your agent name> ELASTIC_URL=https://my-observability-deployment-cd4ce8.es.us-central1.gcp.cloud.es.io \
  node admin/tools/elastic-submit.mjs --index swarm-<kind> --file <docs.json | docs.ndjson> \
  [--id <field>] [--time <field>] [--source <url or repo path>] [--about "one line"] [--dry]
```

- **The index name:** `<prefix>-<kind>`, lower case. The prefix is `fringe`, `ptnews` or `websummit` for one site's data, `swarm` for data about the agentic team (runs, packets, altitudes, reviews), or `agents` for one agent's own working data. Examples: `swarm-altitude-runs`, `swarm-abp-reviews`, `agents-architect-1-checks`.
- **Ownership:** the agent that creates an index owns it; its name is written in the index's own `_meta.owner`. Only the owner writes to it after that; anyone else is refused. Indices made by elastic.1 (fringe-events, fringe-altitudes, the three sites' indices ...) are the steward's. To add to data someone else owns, send it to your own index and ask the owner in your status asks.
- **One document per thing, with a stable `id`.** Re-submitting the same `id` updates the document and never duplicates it. Re-push the whole set whenever it changes; that is the normal way to keep an index current.
- **Time:** name the field that says when the thing happened (`--time born`), else `t`, `read_at` or the time of submission is used. Kibana's time picker filters on it.
- **Fields:** flat is best (`model`, `cost_usd`, `latency_ms`, `altitude`). Strings become `keyword` (exact: filters, terms, tables) with a `.text` sub-field for full-text search. Fields named `text`, `body`, `summary`, `description`, `why` and `notes` are full text only. ISO dates are detected. Numbers stay numbers, so don't quote them. **Keep a field's type the same in every document**: the first document fixes it, and a later number in a string field is a mapping error.
- **Provenance is added for you:** `source` (your file at its commit, or `--source`), `read_at`, `signer` (you), `commit`, `ingested_at`, `ingested_by`, `t`, `id`. CLAUDE.md asks every item to carry its source and the time it was read, so give a real `source` URL or repository path when the data came from elsewhere.
- **Try it first** with `--dry`: the checks run and nothing is sent.

## 3. Feed: commit it, elastic.1 sends it (every other agent)

Some agents have no Elastic host in their grant, or no session with `ELASTIC_CLOUD`. For them, commit a JSON file anywhere in your own paths with this header:

```json
{
  "elastic_feed": { "index": "swarm-<kind>", "owner": "<your agent name>", "id": "id", "time": "born", "docs": "docs", "about": "one line" },
  "docs": [ { "id": "...", "born": "2026-11-11T18:40:00Z", "...": "..." } ]
}
```

elastic.1 runs `node admin/tools/elastic-feeds.mjs` at every hourly wake (:07 UTC). It finds every committed JSON with a top-level `elastic_feed` and submits the documents for the file's owner. **The owner is the `Agent:` trailer of the file's last commit**, and it must match `elastic_feed.owner`, or the feed is skipped and reported. So a feed always lands under the name of the agent that committed it.

## 4. Never (the checks hold these back, but don't rely on them)

- **No contact details, no private people:** fields named like a contact (`email`, `phone`, `contact`, `attendees`, `guests`, `speakers`, `people` ...) are dropped. A document whose text looks like an email address or a phone number is **held back** and named, not sent. Agent names (`role@PrompTugal.id`) are fine.
- **No keys or tokens:** anything key-shaped (API keys, bearer tokens, private key blocks, long mixed tokens) holds a document back. Key **fingerprints** (`sha256:…16 hex`) are fine.
- **No model request or response text, and no prompts:** send their sha256, model, cost, latency and validity. No raw captures, nothing behind a login, nothing from websummit.com read by machine.
  - **One exception, Dinis's decision (19:26 UTC):** "actually I want to see the prompts". OpenRouter's traces go to Elastic with Privacy Mode **off**, so prompts and completions are in `traces-*` (`gen_ai.input.messages`, `gen_ai.output.messages`), as Kibana's own AI Agent traces already are. They stay in `traces-*` only: never copied into another index, never on a shared or demo dashboard (panels use model, tokens, cost and latency), and read in Discover by drill-down. Retention: kept indefinitely (Dinis, 20:25 UTC: 'ok for a longer retention'; Elastic's managed traces@lifecycle rolls over at 30 days and never deletes).
- **No people profiles, mail, meetings, CRM, inboxes or sealed data,** even when they are public in a repository.

A held document never reaches Elastic. Every submission and its held count is on the operations dashboard: fix the source, then re-submit.

## 5. Your own dashboards

Write a spec module in your own path (copy [elastic/examples/dashboard-spec.example.mjs](../elastic/examples/dashboard-spec.example.mjs)), then:

```
AGENT=<you> KIBANA_URL=https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io \
  node admin/tools/elastic-dashboard.mjs --spec <your path>/dashboard-spec.mjs [--dry]
```

- The kit is `admin/tools/elastic-kibana-lib.mjs`, the same one every steward dashboard is built with:
  - `dataView`
  - metric columns `C.count`, `C.unique`, `C.sum`, `C.avg`, `C.max`
  - panels `metric`, `overTime`, `top`, `donut`, `table`, `heat`, `search`, `md`
  - `dashboard` and `tag`
- Every id is **namespaced by your name**, so you cannot overwrite anyone's objects, and re-running updates yours in place. Data views are shared by index pattern: define yours with the same time field everyone uses for that index.
- **Every dashboard opens with a markdown panel** that says what it shows, where the data comes from (files, tools, agents), and the independence line (`K.INDEPENDENT`) when it shows anything public.
- **Panel titles are claims:** say what is counted ("LLM calls: valid answers"), not the field name. Label hypotheses as hypotheses, and keep "unknown" visible rather than filtered out.
- Give it a sensible default time range and refresh (`{ from, to, refresh }`): events run 11 to 14 November, and the swarm's history starts 28 October.
- **Check it renders:** open it in Kibana, or screenshot it headless. A Lens object with no `typeMigrationVersion` fails to import with a 500: the kit sets it.

## 6. The audit trail (every submission)

`elastic-submit.mjs` and the feeds log one line per submission to `elastic-submissions`. A tool that writes **live**, one event at a time (architect.1's `flow.mjs` into `swarm-flows`), logs its totals itself, once per flush or per flow:

```js
import { logSubmission } from './admin/tools/elastic-lib.mjs'   // from the repository root
await logSubmission({ agent: '<you>', index: 'swarm-flows', via: 'live', sent: 42, errors: 0, held: 0, source: 'abp/tools/flow.mjs', commit: '<sha>' })
```

The fields are `t` (date, default now), `agent`, `index`, `via` (`push`, `feed` or `live`), `owner` (default the agent), `source` and `commit` (keyword), and `sent`, `errors` and `held` (long).

## 6b. Elastic to git: exports for agents that may not read Elastic

R8e keeps `ELASTIC_CLOUD` to elastic.1 and architect.1. An agent that needs data from Elastic asks elastic.1, which exports the fields it needs to `data/elastic-export-<index>.json` with `admin/tools/elastic-export.mjs`, re-run at every hourly wake. The privacy checks run on every document. Today: `data/elastic-export-swarm-flows.json`, for neo4j.1.

## 7. What elastic.1 does (the steward)

- **Every hour at :07 UTC:**
  - re-pushes the three sites, the workloads and the altitudes;
  - sends the committed feeds;
  - re-imports the steward dashboards;
  - reads the operations dashboard: who submitted, what was held, mapping errors.
- Writes back to an agent through its status file or commits ("For: <agent>") when its data is held back, mistyped or mis-owned.
- Keeps this guidance, the kit, the tools and the index catalog (`data/elastic-catalog.json`, fed to `swarm-elastic-catalog`).
- Does not write to your index or your dashboards.

## 8. Index catalog (what exists, who owns it)

See `data/elastic-catalog.json` (also on Elastic as `swarm-elastic-catalog`, and on the operations dashboard). Today the steward's: `fringe-events`, `-graph`, `-tasks`, `-models`, `-hooklog`, `-workloads`, `-altitudes`; `<site>-commits`, `-content`, `-entities`, `-runs`, `-status` for fringe, ptnews and websummit; `elastic-submissions` (the audit trail); `swarm-elastic-selftest` (the example's data).
