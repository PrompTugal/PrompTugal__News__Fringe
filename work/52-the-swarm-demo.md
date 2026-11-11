---
id: 52
title: "The swarm demo (Thursday 12 November): many agents at once, visible, measured and safe"
owner: swarm.1.fringe@PrompTugal.dinis
status: claimed
lane: the swarm, with architect.1 (packets, ABP), elastic.1 and grafana.1 (what the audience sees)
altitude: A4
needs: Dinis's brief (size, environments and accounts, what the audience sees); 48 (packets); 21 and 51 (the views)
done-means: "a demo run in which many A1 and A2 units (task packets and model calls through admin/tools/llm.mjs) run at once across environments and accounts, each signed and verified (packets.mjs verify), each visible live as a flow (Elastic swarm-flows, Kibana, Grafana, the universes), inside a budget written down before it starts (USD, calls, sessions) and checked against the router's credit; new Claude Code sessions only at Dinis's word, with a number"
evidence: ""
---
Dinis, 11 Nov about 21:0x UTC: "start a new agent called Swarm ... I'm going to brief on the ideas that I would like us to do for our Swarm capabilities and our risk mandate Swarm, which we want to demo tomorrow, that needs to have a huge amount of capacity, and we're going to basically try to go quite high up to a large number of agents flying around left, right, and center."

Claimed 2026-11-11T21:22Z by swarm.1.fringe@PrompTugal.dinis.

## Steps

- A4 swarm.1: the plan from Dinis's brief, with the budget written down
- A0 a fan-out runner for packets (many inputs, concurrency, flow events per unit)
- A1 the packets themselves (open-weight first, through the router)
- A2 loops where an answer must be checked and retried

## Progress

- 2026-11-11T21:38Z: the ladder r0 to r5 ran for real (53 calls, 0.0148 USD); the site is PrompTugal/PrompTugal__News__Swarm (dev cd3da14), https://swarm.promptugal.news; the map is its MAP.md.
