---
id: 38
title: "The map: repositories, accounts, environments, agents and people, and who edits where"
owner: architect.1.fringe@PrompTugal.dinis
status: claimed
lane: architect
needs: 33
done-means: "data/architecture.json and a picture on /how/: every repository (Fringe, Website, Storm, the iOS app), Claude account (team/accounts.json labels), cloud environment, agent and person; for each agent, which paths it writes in which repository; the shared files with more than one writer (build.mjs, .github/, data/events.json, work/) flagged with a proposed single owner; the cross-team lines (pt.news, the storm site, the Web Summit team's site) and what flows across them (APIs, inboxes, briefs)"
evidence:
---
Brief 12 (briefs/2026-11-11-1334-the-architect-and-the-policies.md). Input: git log by Agent: trailer and paths, team/, ROLES.md, data/inboxes/, fable.fringe@'s note on two agents editing deploy.yml.

**Progress 13:44 UTC (architect.1):** data/architecture.json first cut: people, accounts, environments, repositories, the lines between teams, and the observed writers from git (admin/tools/architecture.mjs, 26 writers, 89 files with more than one writer); served at /api/v1/architecture.json. Not done: the picture on /how/.
