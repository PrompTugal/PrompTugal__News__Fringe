# Swarm runs: every run starts with a push (design for swarm.1)

> architect.1.fringe@PrompTugal.dinis, 2026-11-11, for swarm.1.fringe@PrompTugal.dinis and the demo on 12 November. At Dinis's word, in architect.1's session, 23:4x UTC: "for provenance and for traceability, every run should start with the GitHub action. And the GitHub action is what determines what type of run it is ... and then that maps to the commit ... So then the push triggers the information." Then: "yes can you send in the plan". This is material for swarm.1: Dinis instructs it, and its own conductor routes it.

Repository: **PrompTugal/PrompTugal__News__Swarm__Runs** (public). Its grant is in abp/policies.json: swarm.1 writes requests/**, .github/workflows/** and docs/**, and the Action writes runs/**.

## 1. The shape

```
agent (A3)  --commit-->  requests/<id>/packet.json   (signed by the agent's key)
                |
              push to dev
                v
GitHub Action   reads packet.kind  -> the job for that kind (A0 | A1 | A2)
                verifies the packet's signature  -> refuses an unsigned packet or an unknown key
                runs inside the packet's budget  -> calls, tokens, USD, minutes
                emits flow events (start / step / end; OTel ids from the run id)
                v
commit back     runs/<id>/result.json        (signed by a key that lived only during the run)
                runs/<id>/flow-events.json
                runs/<id>/provenance.json    (commit, workflow run, attestation)
                + flow events to Elastic swarm-flows; the commit and run URL in every event
```

One run is one commit, one workflow run and one result. GitHub ties them together, and none of it rests on an agent's word.

## 2. The request (the packet)

The packet uses the same format as `abp/tools/packets.mjs` in the fringe repo (`new` / `verify`), plus three fields:

- `kind`: `A0` (compute only), `A1` (one call per input, no tools) or `A2` (a closed loop until valid, `max_tries`). A3 never runs here: an agent with memory and its own wake stays a Claude Code session and only *starts* runs by committing requests. That keeps altitudes from mixing, by construction (R12).
- `budget`: `{ "max_calls": N, "max_tokens_per_call": 1200, "max_usd": 0.50, "max_minutes": 10 }`. The job stops at the first limit it reaches and records which one.
- `model`: `{ "tier": "cheap" }` or an exact model. Use `max_tokens` of 1200 or more for a reasoning model. That is today's finding: at 300, DeepSeek V4 Flash used up the budget before the JSON answer, so the lead got 6/10 where Angelo got 10/10.

The id is `requests/<YYYYMMDD-HHMM>-<slug>/`. The packet is signed with the requester's session key. The Action checks it against the public keys in PrompTugal__News__Fringe `data/keys.json`: read at run time, or vendored into the repo by a commit.

## 3. The workflow

```yaml
on:
  push:
    branches: [dev]
    paths: ['requests/**']
  workflow_dispatch: {}            # for a re-run; it still needs a committed request
permissions: { contents: read }    # the default; only the results job asks for write
concurrency: { group: 'run-${{ github.sha }}', cancel-in-progress: false }
jobs:
  plan:     # A0: list the new request folders in this push (git diff), verify each packet, emit a matrix by kind
  run:      # needs: plan; matrix over requests; runs-on: ubuntu-latest; timeout-minutes from the budget
            # env: OPEN_ROUTER_KEY: ${{ secrets.OPEN_ROUTER_KEY }}, ELASTIC_CLOUD: ${{ secrets.ELASTIC_CLOUD }}, ELASTIC_URL: ${{ vars.ELASTIC_URL }}
  commit:   # needs: run; permissions: { contents: write, id-token: write, attestations: write }
            # writes runs/<id>/*, attests, commits "swarm-runs: result <id> for <sha>"; paths filter keeps it from re-triggering
```

- **The run id** is `<request id>@<GITHUB_SHA:0:12>#<GITHUB_RUN_ID>.<GITHUB_RUN_ATTEMPT>`. `FLOW_ID` is set to it, so `flow.mjs`'s trace_id and span_id come from the commit. Every flow event carries `commit`, `run_url` and `requester`. In Kibana, one click goes from a bar on the Gantt to the commit and the Actions log.
- **Flows** are the fringe's `abp/tools/flow.mjs`, used as-is: `FLOW_RUNNER` = the requester, and `FLOW_ENV` = `R8 GitHub Actions, PrompTugal__News__Swarm__Runs` (a new runtime; architect.1 adds it to data/runtimes.json). Events are idempotent (`_id = flow:seq`).
- **The model calls** go through the fringe's `admin/tools/llm.mjs`, the one wrapper with its ledger. It reads `OPEN_ROUTER_KEY`. Set `LLM_DAILY_CAP_USD` from the budget.
- **Provenance:** `actions/attest-build-provenance` on `runs/<id>/result.json`. It binds the result to this workflow, this commit and this run, signed by GitHub's OIDC identity, so a third party can check it with `gh attestation verify` without trusting us. The result is also signed by the run's own short-lived Ed25519 key, the same pattern as packets.mjs.

## 4. Secrets: the rules (abp/policies.json, repositories)

Dinis added four secrets at 23:4x UTC: ELASTIC_CLOUD, GRAFANA_TOKEN, OPEN_ROUTER_KEY and SG_SEND_ACCESS_TOKEN.

- Workflows trigger only on `push` and `workflow_dispatch`, **never `pull_request_target`**, so a fork's pull request never sees a secret.
- A secret reaches a step only through `env:`, at the step that needs it. **Never `echo` it, never write it to a file, never put it in a URL.** Never print prompts, answers or the environment: Actions logs are public.
- Use a secret only if a workflow needs it. GRAFANA_TOKEN and SG_SEND_ACCESS_TOKEN should be deleted unless the demo uses them; tell Dinis which.
- ELASTIC_CLOUD is the superuser password. It is fine for the demo; after it, Dinis replaces it with a key limited to `swarm-*` (create_doc, create_index, write), and elastic-lib.mjs already reads `ELASTIC_API_KEY`.
- **Dinis's settings:**
  - Actions → General: workflow permissions read-only by default.
  - Branches: protect dev and main, with no force-push, and main only by Dinis.
  - Only the people and agents he chooses can push.

## 5. What never goes in the repository

Prompt or answer text: store only its sha256, the model, cost, latency and validity. Also never: keys, contact details, private people, websummit.com read by machine, binaries, or any file over 256 KB. The result is small JSON. A run that needs to keep text keeps it out of git, the same rule as CLAUDE.md here.

## 6. For the demo (12 November)

1. Before the demo, commit two requests: an A1 (one call per event for 10 events, `cheap`, max_tokens 1200) and an A2 (a loop placing 12 board items at their altitude, max_tries 3). Then push.
2. On screen, in order: the commit → the Actions run (plan → run matrix → commit) → the result commit → Kibana "Flows: the beginning, the middle and the end" (bars appear live) → `gh attestation verify runs/<id>/result.json`.
3. Then a third request, pushed live: the audience sees the push start the run.

## 7. Questions back

Put these in swarm.1's status asks for Dinis, or send them to architect.1:
- whether the Action reads the fringe's data/keys.json at run time or a vendored copy;
- how many runs the demo needs at once (Actions allows about 20 concurrent jobs on most plans);
- whether GRAFANA_TOKEN or SG_SEND_ACCESS_TOKEN is used at all.
