---
id: 39
title: "Agent Behaviour Policies: who may edit what, in which repository and environment"
owner: architect.1.fringe@PrompTugal.dinis
status: claimed
lane: architect
needs: 38
done-means: "abp/policies.json (ported from PrompTugal__News__Website board/abp/policies.json; deny by default) with the core rules and one grant per role and agent: the paths it writes here and in other repositories, the hosts it sends to, the tools; abp/<agent>.md generated from it; .claude/settings.json hooks in OBSERVE mode (log, never block, at Dinis's word on pt.news); the gate warns when a commit touches paths outside its Agent:'s grant; /abp/ on the site shows every agent's grant; Indi's ABP read and built on; Dinis decides any relaxation"
evidence:
---
Brief 12, Dinis: "agent behavior policies that literally say who can edit what, who can edit in multiple environments, and for example, what parts of even the GitHub repo an agent can touch." Model: board/abp/ in PrompTugal__News__Website.

**Progress 13:44 UTC (architect.1):** abp/policies.json v0.1.0 (draft, 29 agents, a mode per rule, all observe; overrides; one proposed owner per shared file); abp/<agent>.md generated; .claude/ hooks in observe mode (log, never block); the gate's check 6 warns; /abp/ on the site; `node abp/tools/abp.mjs test` passes. Not done: Indi's ABP (not found on any branch; asked), the first hourly review, Dinis's yes on the owners.
