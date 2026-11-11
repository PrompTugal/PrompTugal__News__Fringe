---
title: "Brief 12: an architect, and Agent Behaviour Policies: who may edit what, where; public guidance for contributors"
from: Dinis Cruz (head conductor), to conductor.fringe@PrompTugal.dinis
received: 2026-11-11T13:33Z
relayed_by: conductor.fringe@PrompTugal.dinis
to: architect.1 (started for it), every agent and conductor, external contributors
board: work/38 (the map), work/39 (the ABPs), work/40 (public guidance)
---
# Brief 12: the architect and the policies

## In Dinis's words

> "This cross-team collaboration is now very important, which basically it's why you really want to have an architect start mapping all this stuff across and really start thinking about where people edit, where are the lines. And in fact, this is where the agent behavior policies now become super critical. And I know Indi already created one, but you now need to start creating agent behavior policies that literally say who can edit what, who can edit in multiple environments, and for example, what parts of even the GitHub repo an agent can touch, because we can then map it from there."

> "This is the kind of guidance that needs to go on the website ... remember that we're now going to have even external contributors. So it's almost like that kind of public CLAUDE.md becomes super critical ... we need to have all sorts of guidance, all sorts of information here."

## The model (the lead found it)

PrompTugal__News__Website `board/abp/` (abp@PrompTugal.dinis, since 6 November):
- `policies.json`, the policy as data: core rules, the tools allowed, and one grant per agent (the paths it writes, the hosts it sends to). It is deny by default.
- One ABP page per agent, generated from it.
- Hooks in `.claude/settings.json` in **observe mode**: a call outside the grant is logged, not blocked. Dinis: "blocking should always be the last worst case scenario."
- A run report per run, and an hourly review of every commit's paths against its author's grant.
- Its source is RiskMandate's Agent Behaviour Policy and Licence to Operate (https://riskmandate.ai/agent-behaviour-policy.html).

Indi's conductor made an ABP for its own work (Dinis); the architect reads it and builds on it.

## Routing

| Item | What | Owner |
|---|---|---|
| work/38 | The map: every repository, Claude account, environment, agent and person, and who edits which paths (a picture on /how/) | architect.1 |
| work/39 | The ABPs: `abp/policies.json` (paths per role and agent, across repositories and environments), one page per agent, observe-mode hooks, the gate checking each commit's paths against its Agent: trailer (warn first) | architect.1 |
| work/40 | Public guidance: /guidance/ and CONTRIBUTING.md, "the public CLAUDE.md" for external contributors and their agents: how to join, what you may touch, how to send a design or an event, the rules | architect.1, with outreach.1 |

## Dinis's ruling on enforcement (13:36 UTC)

> "On these policies, for now, you should start with observe mode so we can learn. So it should not be blocking ... we take two or three rounds of execution, and only when we know that a particular thing is safe, we start to maybe a bit more enforcement. But for now, you should always have an escape hatch, and conductor should be able to override it for now ... but also we log it, so we learn, and that's part of the exercise here."

**Rules for work/39:**
1. **Observe only.** No hook and no gate check blocks anything; a call or a commit outside a grant is logged as `observe`.
2. **Two or three rounds first.** A rule moves towards enforcement only after two or three rounds (wakes) of logs show it is safe, and then only by Dinis's decision, rule by rule, recorded in abp/policies.json with its date and his words.
3. **An escape hatch, always.** Even an enforced rule can be overridden by a conductor (and by Dinis): the override names who, why and when, and is logged.
4. **Log everything, to learn.** Every observe event and every override goes to the run log, and the architect's hourly review lists them, with what each teaches.
