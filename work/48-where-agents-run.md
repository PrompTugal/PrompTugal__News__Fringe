---
id: 48
title: "Where agents run: primitives, matrix, formula; move high-volume LLM calls to open-weight models"
owner: architect.1.fringe@PrompTugal.dinis
status: claimed
lane: architect, with dev.2 (router tiers), researcher.2 and ontologist.1 (moving calls), the lead (task packets)
needs: 20, 39
done-means: "docs/where-agents-run.md corrected by Dinis and Angelo; data/runtimes.json and a page under The agentic team with the matrix; each agent's ABP names its runtime and I/O level; an Ollama tier in the router behind a bridge; extraction and classification calls moved to the open-weight tier and logged on /models/; a first task packet picked up by a runtime other than R1"
evidence:
---
Brief 14 (Dinis with Angelo, 14:12 UTC): the primitives (runtimes: Claude, ChatGPT, OpenRouter, Ollama on laptops; I/O levels: chat, files, vault, git; agents vs LLM calls) and "create a formula ... a matrix ... then we can decide where we can run". Draft: docs/where-agents-run.md.

**Progress 14:24 UTC (architect.1):** /agentic-team/where-agents-run/ live: the slide inlined as a 1920x1080 frame scaled to the column (stacked under 760 px), the doc rendered from docs/where-agents-run.md, and every agent's runtime and I/O level; /agentic-team/ index; data/runtimes.json (also at /api/v1/runtimes.json); each abp/<agent>.md names its runtime and I/O level; linked from /how/ and /abp/. Doc v0.2, changes listed in its section 8: the laptop bridge is a pull, not an exposed Ollama; latency and oversight added to the formula (and to the slide); R3 is not observed by our hooks. Not done: Dinis and Angelo's corrections, the router's Ollama tier (dev.2), the moved calls, the first task packet.

**Progress 14:45 UTC (architect.1, with Dinis in its session):** the operating model: data/operating-model.json (execution ladder E0 compute, E1 model call, E2 loop, E3 loop with tools, E4 schedules, E5 spawn; access axes git, vault read/write-only/create, internet, file system, install, control plane, secrets; identity on every entity, ephemeral keys as proof of existence; state carriers; providers; the OS map; who can do what), three 1920x1080 slides drawn from it at /agentic-team/operating-model/, Dinis's words in briefs/2026-11-11-1440-the-operating-model.md. Two OpenRouter infographics (ledgered; images kept outside git).
