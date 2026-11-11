# Traces: how a Lisbon Fringe page came to be

At Angelo's ask (11 November 2026): "track each and every step of the human and agentic process, with times, that has generated an article". A **trace** is one JSON file per page: every step that made it, earliest to latest, each with its time, who did it and the evidence. Written by tracer.fringe@PrompTugal.angelo for conductor.fringe@PrompTugal.angelo (WS-215).

| File | Page | Steps | First step | Live |
|---|---|---|---|---|
| [`2026-11-11-ptw-classroom-deep-work-wexio.json`](2026-11-11-ptw-classroom-deep-work-wexio.json) | [/e/2026-11-11-ptw-classroom-deep-work-wexio/](https://fringe.promptugal.news/e/2026-11-11-ptw-classroom-deep-work-wexio/) | 77 | 10:24:48 UTC (the repository) | first live 11:42:50 (v0.1.29); v0.1.69 at 12:03:48 |

## The format (lisbon-fringe-trace/1)

Adapted from the team's `ws-trace/1` (`team/reporter/traces/` in SGit-AI/SGit-AI__Website__Web-Summit): the same idea (steps with evidence, people's steps marked, `evidence_note` where the record holds none), flattened for one page rather than a workflow with in/out/handoff.

- Top: `about`, `event_id`, `page`, `built_by`, `traced_by`, `traced_at` (from `date -u`), `repo_head`, `generator`, `shape`, `privacy`, `steps[]`, `gaps[]`, `totals`.
- A step: `n`, `t` (ISO UTC; `"unknown"` with `before` when the record has no time), `kind` (`human`, `agent`, `sub-agent`, `source-read`, `ci`, `deploy`), `who`, `session` and `model` (from the `Claude-Session` and `Co-Authored-By` trailers), `what`, `evidence[]` (commit sha, file or URL; never empty), `work_item`, `label` (`fact` or `hypothesis`), `committed` (committer time when it differs from the author time), `on_dev` (the first-parent commit on dev that holds it), `published_by` (the first successful deploy run that contains it).
- `t` for a commit is its author time; a `source-read` is the entry's `read_at`; a `ci` step is the run's `created_at`, a `deploy` step its `updated_at`. CI numbers the version `v<admin/series.txt>.<run_number>`.
- `gaps[]` says what cannot be traced and why. A guessed time is never written.

## The method (so the next one is cheap)

```
git pull -q --rebase origin dev
# 1. the deploy runs: GitHub's "list workflow runs" for PrompTugal/PrompTugal__News__Fringe, saved as JSON
#    (the GitHub MCP tool actions_list, method list_workflow_runs, perPage 100; or
#    gh api repos/PrompTugal/PrompTugal__News__Fringe/actions/runs?per_page=100 > runs.json)
# 2. the git and CI steps, generated:
node admin/tools/trace-event.mjs <event-id> --runs runs.json --out gen.json
# 3. by hand: the human steps and the labels
grep -rl <event-id> work briefs team data    # who else named it; was it checked (work/13)?
grep -n "received:" briefs/*.md              # the times Dinis's briefs arrived
curl -s https://fringe.promptugal.news/version.json   # what is live now
```

`trace-event.mjs` (Node 18, no dependencies, about 10 s) finds: every commit that changed the event's entry in `data/events.json` (field by field, with its `read_at` as a source-read step); every commit to the files the page is built from (`admin/build/event-pages.mjs`, `build.mjs`, `cards.mjs`, `identity.mjs`, `organisers.mjs`, `graph.mjs`, `tokens.css`, `validate.mjs`, `og/`, `data/organisers.json`, `admin/series.txt`, `.github/workflows/deploy.yml`) from the commit that created the page builder on; other files that name the event; the commit that brought each onto dev; and the first successful deploy run that published it. What it cannot see is added by hand: a person's words (BRIEF.md, KICKOFF.md, `briefs/`), an organiser's own change, and a sub-agent behind a conductor's commit.

## Rules

Public sources only; never websummit.com. A private person (for example a WhatsApp sender) is never named or linked. No contact details. Session ids are the trailers already public in the commits.
