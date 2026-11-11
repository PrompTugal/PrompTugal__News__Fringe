---
title: "Hand-off: the altitudes of execution, for Angelo's team (the MVPs) and Silvio's team (the visualisations)"
by: architect.1.fringe@PrompTugal.dinis, at Dinis's word (briefs/2026-11-11-1546-altitudes-to-angelo-and-silvio.md)
date: 2026-11-11
---
# The altitudes of execution: the hand-off

**Start here:** the article, https://lisbontechfringe.com/agentic-team/articles/the-altitudes-of-execution/ (source: docs/articles/2026-11-11-the-altitudes-of-execution.md), then the seven slides, https://lisbontechfringe.com/agentic-team/operating-model/.

## What exists (all on dev)

| What | Where |
|---|---|
| The model as data: the altitudes (A4 swarm, A3 agent, A2 loop, A1 LLM call, A0 compute), the capability grammar (abp.sgit.ai's 23 primitives + 4 vault ones), identity, state, providers, environments | data/operating-model.json, /api/v1/operating-model.json |
| Where agents run: runtimes (now with Cloudflare R6 and AWS R7), endpoints, I/O levels, every agent's runtime | data/runtimes.json, docs/where-agents-run.md |
| The run in action: 51 board items, 3 loops, 81 LLM calls, 85 signatures verified | abp/tools/altitudes.mjs, data/work-altitudes.json |
| The reach of each unit (needed vs held vs exposure) | data/run-reach.json, slide 7 |
| Task packets: signed loops and LLM calls any environment can run | abp/tools/packets.mjs, tasks/ |
| Mixing altitudes, observed | rule R12 in abp/policies.json; the hook in .claude/hooks/abp.mjs |
| Dinis's words, as spoken | briefs/2026-11-11-1440-the-operating-model.md and this brief |

## For Angelo's team: the MVPs to run

Angelo co-designed this with Dinis; these are the smallest runs that prove it across environments.

1. **MVP 1: run our packets in your environment.** `tasks/2026-11-11-p1-place-12-items` (A1, 12 calls, no grant) and `tasks/2026-11-11-p2-cut-items-into-loops` (A2 loop, read.file.project only). Run: `node abp/tools/packets.mjs run --id <id> --as conductor.fringe@PrompTugal.angelo --env '<your runtime, account, model>' [--model <yours>] [--max-tokens 1500]`, then commit `tasks/<id>/result-<you>.json`. Our results are there as the baseline; yours is the first cross-environment comparison. `node abp/tools/packets.mjs verify` checks every signature.
2. **MVP 2: send us one.** Write a spec (see the two packets) with `"for": "conductor.fringe@PrompTugal.dinis"` or `"any"`, `node abp/tools/packets.mjs new --spec <file>`, commit. We run it here and commit a signed result.
3. **MVP 3: a sandboxed runner.** The packet's grant becomes the sandbox: the runner derives `node --permission` flags from the packet, so an A2 loop holds its 5 primitives, not the agent's 25 (slide 7). Proven by hand for one script; to be made the runner's default.
4. **MVP 4: one packet outside Claude.** An A1 packet in a Cloudflare Worker with Workers AI (a key made per invocation with Web Crypto), or an A2 loop in AWS Bedrock AgentCore. Needs an account and a scoped deploy credential from Dinis.

Your lane already has the graph and live views: the altitudes are a graph (data/operating-model.json graph: verbs with inverses, five altitudes), and a run (data/work-altitudes.json trace) is a live view waiting to be drawn.

## For Silvio's team: the visualisations

Dinis: "use this amazing visualisations to all of this in action". What exists to build on:

- Seven 1920x1080 slides, each drawn from data (admin/build/operating-model.mjs): the execution ladder, what each entity can reach, a distributed operating system, the altitudes of execution, mixing altitudes, the altitudes in action, the reach of each unit. Standalone at /agentic-team/operating-model/slide-1.html to slide-7.html.
- Two AI-drawn infographics (Gemini 3 Pro Image through our router): the altitudes of execution, and mixing altitudes. Kept outside git (images go to a vault); ask the lead or architect.1 for them.
- The infographic for where agents run: docs/where-agents-run.slide.html.

What is missing, and where a designer's eye matters most:
1. **The altitudes in action, live**: a run drawn as it happens (the plan, the loops starting, each LLM call with its key appearing, the merge verifying), from the signed files in a run folder or tasks/.
2. **The reach, felt**: slide 7 is a matrix; it should be obvious in one look that a 3-primitive job held 25.
3. **One picture per team**: the same altitudes drawn for each team's own swarm (below).

Every number should come from the data files, never typed; the site's family look (PrompTugal.news), 1920x1080 for slides, phone-first for pages.

## Then: our other teams

Dinis: "the idea is then to start applying this to our multiple teams, like the one we have here on the Lisbon Tech Fringe". For each team (its repository, its swarm):

1. **Map it**: its agents at their altitudes, their runtimes and accounts (data/runtimes.json shape), their grants (an abp/policies.json of its own, ported as this one was from PrompTugal.news's).
2. **Measure the reach**: one run with the needed / held / exposure table (data/run-reach.json shape).
3. **Cut the work**: board items into loops and calls (packet P2's shape), so work routes to the lowest altitude that suffices: open-weight calls and sandboxed loops, Claude agents for judgement.
4. **Exchange packets** between teams: the same signed format, each team's results verified where they land.

Questions, findings and results: the inboxes (architect.1.fringe-dinis, conductor.fringe-promptugal), or a result committed in tasks/.
