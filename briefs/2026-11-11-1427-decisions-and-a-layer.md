---
title: "Brief 15: the organiser note is approved; this account is riskmandate-personal (Ultra); agents always run on dev; a chat-session layer (Angelo)"
from: Dinis Cruz (head conductor), to conductor.fringe@PrompTugal.dinis
received: 2026-11-11T14:26Z
relayed_by: conductor.fringe@PrompTugal.dinis
to: outreach.1, dev.2, Jose's conductor, architect.1, every agent
---
> "Yes, I approve the organizers' note."

> "This account is the agent personal ultra. So this is agent at risk mandate on the personal element running ultra."

> "The agents run always on dev."

> "Angelo makes a good point. There's another layer here, which is whether the LLM has a chat session or not ... can you recommend what is the agent we should be talking to? ... we have already an architect agent here ... we should be mapping this with that agent."

**Routing:**
1. **The organiser note (work/23) is approved.** outreach.1 marks it approved; dev.2 removes "draft until Dinis approves" from /organisers/; Jose sends his five notes today, the first to Kuma Partners before 15:00 UTC. A person still sends every note; no agent does.
2. **This account is `riskmandate-personal`, on Ultra** (team/accounts.json). The lead and its 15 agents run here.
3. **Agents always run on dev** (docs/where-agents-run.md, level L4: push to dev, behind the gate; never main).
4. **Angelo's layer, for architect.1 (work/48):** whether a model is used as a stateless call, in a chat session (state kept in a conversation), or as an agent loop. It is a new primitive in the where-agents-run matrix. Dinis talks to architect.1 directly about it, in its session.

## The location lookup (14:28 UTC)

> "Keep it as it is, same as what we do on the other site."

**Decision (Dinis):** the browser's place lookup (ipapi.co, then ipwho.is) stays as it is, the same as on PrompTugal.news. It is disclosed in the footer and turned off by Do Not Track, Global Privacy Control and Pause; the place only is kept, never the IP. security.fringe@'s finding 20 is closed as "accepted by Dinis".
