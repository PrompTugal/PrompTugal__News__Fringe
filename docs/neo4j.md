# The swarm in Neo4j

> By neo4j.1.fringe@PrompTugal.dinis, 11 November 2026, 19:41 UTC. WS-215. Started by architect.1 at Dinis's word (19:33 UTC: "also can you spin up an neo4j agent?").

The Lisbon Tech Fringe swarm loaded into Neo4j as a property graph. It covers the fringe graph, the agentic runs, the grants, the hourly findings, the commits on dev and Dinis's words. It can be queried in Cypher and drawn in Neo4j Browser or Bloom.

## What is in it (fact, read 2026-11-11T19:40Z, repo head 23442b9)

2,236 nodes and 6,886 relationships (19:43 UTC, with the live flows). The counts by label and by verb are in `data/neo4j-stats.json`.

| Source | Becomes |
|---|---|
| `/api/v1/graph.json` (built by `admin/build/build.mjs`; the loader reads `_site/` if it is built, else the live site) | `:Event`, `:Community`, `:Topic`, `:Place` and `:Festival`. Their edges are `IS_ABOUT`, `HAPPENS_IN`, `IS_ORGANISED_BY` and `IS_PART_OF`, and each carries `source` and `read_at`. |
| `data/altitude-runs.json` | `:Run` `CONTAINS` `:Unit`, and a unit `HANDS_TO` its child units, from parent to child. Each unit `IS_AT` an `:Altitude` (A4 to A0). The key that signed a unit appears as `(:Key)-[:SIGNED {verified}]->(:Unit)`. A unit that holds reach it does not need gets `EXPOSES` edges to `:Reach`. The unit also `CALLS` a `:Model` and `WORKS_ON` an `:Item` of the board. |
| `abp/policies.json` | `:Role` and `:Agent`, linked by `PLAYS` and `WORKS_AT`. Grants become `MAY_WRITE` a `:Path` (a glob) and `MAY_SEND_TO` a `:Host`. Shared files become `(:Agent)-[:OWNS]->(:File)`, and each core rule a `:Rule` with its mode. |
| `abp/reviews/`, through `node abp/tools/abp.mjs review-export` | `:Review` `RECORDS` `:Finding`. Each finding `BREACHES` a `:Rule`, `FLAGS` an `:Agent`, `CONCERNS` a `:File` and `CITES` a `:Commit`. |
| `git log` on dev since 9 November | `:Agent` `AUTHORED` `:Commit`, which `CHANGES` a `:File` or a `:Brief`, `IS_FOR` (from the `For:` trailer) and `FOLLOWS` its parent. A commit that changes a file only another role may write `CROSSES_INTO` that `:Role`. `:Person` `SAID` a `:Word`, and the commit that quotes it `ACTS_ON` it. |
| `data/keys.json` | `(:Agent)-[:HOLDS_KEY]->(:Key)`, by fingerprint only. No key material is ever read or stored. |
| Elastic swarm-flows: `data/elastic-export-swarm-flows.json` (exported by architect.1 and elastic.1, 62 events, read 2026-11-11T19:35:13Z; `--flows FILE` reads another) | Each unit's start, step and end events become one `:Span`, with its start time, end time and duration. A span `BELONGS_TO` its `:Flow` and, where it has one, its OTel `:Trace`. It `IS_CHILD_OF` its parent span: through `unit_id` and `parent_id` first, then `parent_span_id`, because only the newest events carry the OTel ids. The span is linked as `(:Key)-[:SIGNED]->(:Span)` and `(:Agent)-[:EMITTED]->(:Span)`. Where its key matches a recorded unit, the span `IS_LIVE_VIEW_OF` that `:Unit`. |

Every node also has the label `:Fringe`, so `--wipe` removes only what the loader made.

## The grammar

`neo4j/grammar.json` follows the fractal semantic graph grammar (Dinis Cruz, newsroom.sgit.ai, also in `admin/build/graph-model.mjs` GRAMMAR). Every relationship type is a verb with a subject, an object and an inverse a person would say. For example, `AUTHORED` reads backwards as "was authored by", and `EXPOSES` as "is held without need by". There is no `relates_to`: the loader refuses any type that is not in the grammar. Neo4j stores one direction, so the inverse is kept on every relationship (`e.inverse`) and on a `:Verb` node for each verb.

## How to run it

```sh
pip install neo4j
git fetch --unshallow origin dev                                               # the commits layer needs the full history
python3 admin/tools/neo4j-load.py --emit /tmp/fringe.cypher                    # Cypher only, no database (about 1.2 MB)
python3 admin/tools/neo4j-load.py --load --wipe                                # into NEO4J_CLOUD (Aura), when it holds the URI
python3 admin/tools/neo4j-load.py --load --wipe --uri neo4j+s://<id>.databases.neo4j.io   # NEO4J_CLOUD holds the password only
python3 admin/tools/neo4j-load.py --load --wipe --uri bolt://127.0.0.1:7687 --password-file ~/promptugal/.neo4j-local-pw
python3 admin/tools/neo4j-query.py [--only lanes-crossed] [--out data/neo4j-answers.json]
```

`NEO4J_CLOUD` can hold either JSON (`uri`, `username`, `password`, `database`) or the `NEO4J_URI=` / `NEO4J_PASSWORD=` text that Aura gives on download. Neither tool prints a password or the credentials in a URI.

## Where Neo4j runs (Dinis's decision)

- **Before 20:00 UTC:** Neo4j Community 5.26 ran in the first neo4j.1 session's container, on 127.0.0.1 only, with a random password in a 0600 file that was never printed. That container ended with the session, so the local database is gone. `data/neo4j-answers.json` (19:40 to 19:43 UTC) is from it.
- **Aura (fact, 20:06 UTC):** Dinis's instance is `4c760d12` (AuraDB Professional, Google Cloud europe-west1; from his console screenshot, 20:04 UTC). Its URI is `neo4j+s://4c760d12.databases.neo4j.io`, with user `neo4j` and database `neo4j`. `NEO4J_CLOUD` holds only the password. From this cloud container, the Bolt port (7687) is refused, because only HTTPS leaves, through the session's proxy. Neo4j's Query API over HTTPS (`/db/neo4j/query/v2`) answers, and a `RETURN 1` with these credentials returned 1.
- **Loaded (fact, 20:09 UTC, at Dinis's word, 20:07 UTC: "yes, load it into Aura"):** `--load --wipe --http` put 2,269 nodes and 7,052 relationships into Aura, the same numbers the loader built (repo head 550ee00). It took 49 seconds over the Query API. The 14 questions then ran against Aura (`data/neo4j-answers.json`, read 20:09:27Z), and `data/neo4j-stats.json` holds Aura's own counts by label and by verb. Against the 19:43 local load (2,236 and 6,886), the differences are all growth since then: 15 more commits, a new review round with 4 findings, one more of Dinis's words, and one more role and agent in `abp/policies.json`.
- **To reload:** `python3 admin/tools/neo4j-load.py --load --wipe --http --uri neo4j+s://4c760d12.databases.neo4j.io`, then `python3 admin/tools/neo4j-query.py --http --uri neo4j+s://4c760d12.databases.neo4j.io --out data/neo4j-answers.json`. `--wipe` deletes only nodes labelled `:Fringe`. Open it in the Aura console with Query or Bloom, using the Browser queries below.

## The questions and what they answer

`neo4j/queries.cypher` holds 14 named questions. The rows below were first read from the local load (19:40:52Z). Since 20:09:27Z, `data/neo4j-answers.json` holds the answers from Aura; there, `lanes-crossed` has 34 pairs and `agents-without-grant` has none.

- **Which units held more reach than they needed** (`reach-beyond-need`): all 4 A0 compute units needed 3 capabilities and held 25. All 6 A2 loops needed 5 and held 25. Every one of them held `execute.process.host`, `read.credential.host`, `delete.file.host` and `create.schedule.*` without needing them (`reach-most-exposed`). This is the "why is A0:Compute:Plan run with A3 privileges" question, as a number.
- **Which agents cross which lanes** (`lanes-crossed`): there are 29 agent-to-lane pairs. The top three are architect.1 into dev's and design's lanes (7 commits: `admin/build/build.mjs`, `validate.mjs` and `universe.mjs`), ontologist.1 into dev's and researcher's lanes (5 commits: `api/v1/README.md`), and conductor.fringe@…jose into dev's lane (4 commits: `admin/build/swarm.mjs`). A file in two lanes (such as build.mjs, in both dev and design) counts in each.
- **Shared files changed by others** (`shared-files-touched-by-others`): `admin/build/build.mjs` (owner dev.2) has 59 commits by other agents, `api/v1/README.md` has 14 and `admin/build/event-pages.mjs` has 12.
- **The path from Dinis's word to a commit** (`word-to-commit`): 23 quoted words, each linked to the commit that acted on it. For example, "can you spin up an neo4j agent?" (19:33) leads to architect.1 and commit 23442b9 at 19:34:10Z. As a path: `(:Person {id:'dinis'})-[:SAID]->(:Word)<-[:ACTS_ON]-(:Commit)<-[:AUTHORED]-(:Agent)`.
- **The live flows** (`flow-trees`, `live-matches-signed`): in `flow-20261111T185613-run2`, one A4 span hands work to an A3, which hands it to 3 A2 loops, 16 A1 calls and 2 A0 compute units. All 23 spans finished, and the longest took 56.9 s. All 21 spans below A3 match a signed unit in `data/altitude-runs.json` by key. The A4 and A3 spans have no recorded twin, and neither do the test flows.
- Also: the findings by agent and rule, each run's tree by altitude with its cost, the units with no verified signature (the 2 A3 roots), the agents that commit with no grant (grafana.1, 4 commits), the files with the most writers (`data/keys.json` 22, `build.mjs` 15), the busiest organisers in the fringe graph, and the grammar with how often each verb is used.

These are facts about the repository as it was read. The lane crossings are computed from the role globs in `abp/policies.json`, so they are a hypothesis about intent: a crossing may have been agreed in an inbox.

## To see it (Neo4j Browser)

```cypher
// one run, from the agent down to its calls, with the keys that signed each unit
MATCH p = (:Agent)-[:RAN]->(:Run {name:'altitudes-2026-11-11T18:57'})-[:CONTAINS]->(:Unit)<-[:SIGNED]-(:Key) RETURN p LIMIT 150;
// Dinis's words, the agents that acted on them, and the files they changed
MATCH p = (:Person {id:'dinis'})-[:SAID]->(:Word)<-[:ACTS_ON]-(c:Commit)<-[:AUTHORED]-(:Agent), q = (c)-[:CHANGES]->(:File) RETURN p, q;
// the lanes: agents, their roles and the lanes their commits cross into
MATCH p = (a:Agent)-[:PLAYS]->(:Role), q = (a)-[:AUTHORED]->(:Commit)-[:CROSSES_INTO]->(:Role) RETURN p, q;
```

## Rules kept

The loader reads public material only: the repository and our own site. It stores no contact details and no private people. Persons appear only as the person ids in agent names (the conductors). Keys appear as fingerprints, never key material. The loader never uses ELASTIC_CLOUD (R8e).
