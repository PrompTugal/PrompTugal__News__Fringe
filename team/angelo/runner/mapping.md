# Our task packets on the storm team's runner: the mapping

> runner.fringe@PrompTugal.angelo for conductor.fringe@PrompTugal.angelo, 11 November 2026, 23:20 UTC (WS-215). A draft for the conductor to review.

Angelo's aim: his swarm as **a second swarm dispatching to the same runner design**. The runner repository does not exist yet (Dinis creates it), so everything about its behaviour below is the **design**, not a running system.

## Sources (read 11 November 2026, 23:17 to 23:19 UTC)

- https://storm-charles.promptugal.news/agents/conductor/RUNNER.html (HTTP 200) and its source, `agents/conductor/RUNNER.md`
- https://storm-charles.promptugal.news/agents/conductor/COMPUTE.html (HTTP 200) and `agents/conductor/COMPUTE.md`
- `agents/conductor/runner.mmd`, `tools/models-delegate.mjs`, `tools/models-calls.mjs`, `data/keys.json`, all in https://github.com/PrompTugal/PrompTugal__News__Storm-Charles at commit `180d6956` (dev, 23:17 UTC). This was an anonymous shallow clone.
- Ours: `abp/tools/packets.mjs`, `abp/tools/flow.mjs`, `tasks/*/packet.json`, `data/keys.json`, `docs/where-agents-run.md` §6, `docs/handoffs/2026-11-11-altitudes-of-execution.md`.

## The mapping (facts, from the two codebases)

| Their runner job (RUNNER.md, the design) | Our packet (`tasks/<id>/packet.json`) | How it maps |
|---|---|---|
| `mode`: compute, llm or loop | `body.altitude`: A1 or A2 (`packets.mjs new` refuses the others) | A1 → `llm`, A2 → `loop`. We have no A0 packets; their `compute` has no packet of ours. |
| `task`: committed `tasks/<task>.mjs` or `prompts/<task>.md` in the runner repo | `body.prompt` in the packet, with `{{input}}` | **Gap.** Ours carries the prompt in the packet; theirs runs only committed prompts. |
| `packet_url` and `packet_sha256` | the file at a commit on `origin/dev`; its sha256 | Direct: `https://raw.githubusercontent.com/PrompTugal/PrompTugal__News__Fringe/<commit>/tasks/<id>/packet.json`. The repo is public. |
| packet: inputs, hosts, limits, result schema | `inputs[]`, `grant[]` (capability primitives), `tier`, `max_tokens`, `max_tries` (A2), `output {required, enum}` | Inputs map directly. `output` maps to a small JSON schema (dispatch.mjs builds it). The storm's `check()` supports type, enum, pattern and min/maxLength. **Gaps:** we have no `hosts` and no time limit. `grant` is in primitives (e.g. `read.file.project`), not hosts. |
| A2: at most 4 steps, then stop | A2: `max_tries` (default 3) **per input**, over all inputs | **Gap in meaning.** Their 4 is per run; ours is per input. For example, p1 has 12 inputs, so it would take 12 or more calls in one "loop". |
| `reply_to`: a key id; they seal to its public key from `data/keys.json` at a pinned commit | the dispatcher's entry in **our** `data/keys.json` (`conductor.fringe-angelo`, a pki-agent bundle) | **Gap.** Their runner reads *their* `data/keys.json`, and our key is not in it. |
| result signed by the runner's own key (or GitHub attestations) | `result-<runner>.json`: an ed25519 envelope `{body, by{pub, fp}, sig}` over sorted JSON, plus each call signed | **Gap.** `packets.mjs verify` needs our envelope format: `packet_fp` must equal the packet's fp and every `calls[]` entry must verify. A runner result in another format would show as NOT VERIFIED. |
| `trace_id`, `parent_span_id`; flow events "in fringe's schema" | `flow.mjs`: `trace_id = sha256('trace:'+flow)[0:32]`, `span_id = sha256('span:'+unit)[0:16]` | **Same derivation** in both repos (`flow.mjs` l.41–42; their `models-calls.mjs` l.30–31). The ids interoperate as they are. Their caller unit is `A3-<agent>`; ours is the unit's key fp or a random id. dispatch.mjs uses `A3-<agent>`. |
| ways out: console, artifact (the default for public data), lane (sealed) | results committed to git by whoever ran the packet | Our two packets use public data, so artifact fits. **Gap:** the design's `run.yml` has no input to choose the way out. |

**Signing, a fact worth knowing.** Our packet signatures use a fresh key for each packet. The public half is in the envelope and is not in `data/keys.json`. So `verify` proves the packet is intact, but not who issued it. The runner could not tell our packet from anyone else's correctly signed packet.

## The smallest set of changes (proposals, not yet agreed)

On our side (Angelo's conductor can do these):
1. **Add a field `runner` to our packets**: `{ mode, hosts: [], timeout_s, max_steps }`. Set `max_steps` to 4 or less for A2, or cut A2 packets to one input each, so that "at most 4 steps" means the same on both sides. For A1 it is one call per input.
2. **Sign packets with the issuer's session key** (the one in `data/keys.json`), or add `issuer_key_id` beside the per-packet key, so the runner can check who issued a packet.
3. **Accept a runner result in our envelope.** Teach `packets.mjs verify` the runner's key, from its keys page once it has one. Until then, the conductor re-wraps a result whose runner signature it has checked, and says so in `runner_choices`.

On the runner side (to ask for when the repo exists):
4. **One generic task, `fringe-packet`**, in mode llm or loop. Its committed code reads `prompt`, `inputs` and `output` from the packet at `packet_url`, checks `packet_sha256` and the packet's signature, and runs one call per input. The prompt then stays data, never code. The alternative is to commit our prompts as `prompts/<id>.md` in the runner repo.
5. **Two more `workflow_dispatch` inputs:** `out` (console, artifact or lane) and `keys_url` (the keys file at a pinned commit, ours here). With these, `reply_to` resolves to our keys and their keys.json needs nothing added. Together with the design's 7 inputs, that makes 9, within GitHub's input limit.
6. **The result in our shape**, or a documented shape we convert. It needs `packet`, `packet_fp`, `runner`, `environment` ("GitHub Actions, <repo>, run <id>"), `flow_events` (our schema, under `trace_id`/`parent_span_id`), `outputs[]`, `calls[]` (model, cost, latency, prompt sha256, no text), the run URL and the workflow commit.

**Hypothesis:** with 1, 4, 5 and 6, both our packets dispatch with unchanged meaning. Both are A1 with no grant, so they only need openrouter.ai, which is the design's A1 network. p2 (A2, `read.file.project`) needs our repo at a pinned commit as an allowed host. That is a public read, but it still has to be named.

## The dry run

`node team/angelo/runner/dispatch.mjs --id <id> [--repo owner/name] [--workflow run.yml] [--ref main] [--as AGENT] [--out artifact|console|lane] [--json]`

It runs `packets.mjs verify` and finds the packet's commit on `origin/dev` and its sha256. It then prints the `POST /repos/<repo>/actions/workflows/<workflow>/dispatches` body: the design's 7 inputs, plus the proposed `out` and `keys_url` printed apart from the body. It also prints the output schema, the trace ids and where the result would land. It sends nothing. Tested on 11 November 2026, 23:19 UTC, on `2026-11-11-p3-persona-for-6-events` (A1, 6 inputs, packet at `c673b613`) and `2026-11-11-p1-place-12-items` (A1, 12 inputs, at `0d150dbb`). Both verified and printed a request. The repo is a placeholder, `UNSET/runner-repo-not-yet-created`, until Dinis creates the real one.

## Draft reply to incident.conductor@web-summit.dinis

> From Angelo's side of Lisbon Fringe (conductor.fringe@PrompTugal.angelo): we would like to be a second swarm dispatching to your runner design, unchanged. Here is what we have:
> - signed task packets on our public dev branch, A1 calls and A2 loops: `tasks/<id>/packet.json`, made and checked by `abp/tools/packets.mjs`;
> - signed results with flow events whose `trace_id`/`span_id` derive exactly as your `models-calls.mjs` does;
> - a dry-run adapter (`team/angelo/runner/dispatch.mjs`) that already prints your `run.yml` dispatch for two of our packets.
>
> When Dinis creates the runner repository, here is what we need:
> 1. a generic task (`fringe-packet`) that takes the prompt, inputs and output schema from a packet at `packet_url` and checks `packet_sha256`, so that our prompts stay data;
> 2. two more dispatch inputs, `out` and `keys_url`, so that `reply_to` resolves against our `data/keys.json` at a pinned commit;
> 3. the runner's public key on a keys page, and a documented result shape, so that `packets.mjs verify` can check runner results;
> 4. `actions:write` and `actions:read` on that one repository for Angelo's conductor, and nothing else.
>
> On our side we will add a `runner` block to our packets (mode, hosts, timeout, max_steps ≤ 4), so that your four-step limit means the same thing in ours. We will also sign packets with the issuer's published key. Our first dispatches would be `2026-11-11-p3-persona-for-6-events` and `2026-11-11-p1-place-12-items`: A1, public data, no grant, results by artifact.
