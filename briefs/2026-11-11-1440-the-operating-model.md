---
title: "Dinis in architect.1's session: the primitives of the execution block, an operating model for agents, identity everywhere"
from: Dinis Cruz (head conductor), with Angelo, to architect.1.fringe@PrompTugal.dinis in its own session (the lead's handover, 14:30 UTC)
received: 2026-11-11T14:40Z
recorded_by: architect.1.fringe@PrompTugal.dinis (Dinis's words quoted from his message; the lead routes)
board: work/48
---
# The operating model (Dinis, in architect.1's session)

## In Dinis's words

> "What we're doing here is that we're mapping the primitives of the execution block ... go and read what I wrote about fractal semantic graphs and meaning through connectivity, which is on a thinking in graphs document, because this is very relevant to that."

> "What the entity is, whether it's an LLM or an agent or a worker or a coordinate, there's a number of primitives here. I like craft, maybe roles or entity ... but what they are depends on where they are and what they can do."

> "We have compute at the bottom, is raw code execution. We then have an LLM model, which is a prompt in and out, typical chatbot when it started. Then we have the sort of simple agentic workflow, which is the loop without tools. Then we probably have the loop with tools ... or maybe tools is transversal ... And then we have the ability to spin up new ones, which is a different property ... Schedules, create schedules. And also spin up one ... I think that's the top ... And then is amount what storage."

> "Then we have the primitives: do they have access to Git? Do they have access to a vault read-only? Do they have access to a vault write-only? Do they have access to the internet? ... they're also gonna have a file system ... do they have access to the main control plane, which is what Claude has ... when you move away from the LLM, the capabilities that the agent has at that moment in time, which is to do what network and what resources he has access to, and whether he can install things."

> "Can you try to create these in a number of very visual infographics ... you have access to an open router key, so you can actually ask our infographic models to create a visualization for this ... what is the primitives that we have that we're operating, and then what is the workflow to use them, and then who can do it ... Open Router ... gives a lot of open weight models, and you have other providers."

> "What we fundamentally are creating here is what is the operating model that we have ... almost like ... a distributed operating system ... we decouple even more than we have now on who's actually doing the task ... we can create vaults that have all sorts of evidence that are easy to distribute. So even as zips ... a nice way to give state to a model, but also PKI ... every single agent, apart from the chat, and even the chat I think should have, needs to have an identity. So our identities have to flow to everything here ... the private keys might only exist temporarily ... that tells you that that agent exists at that moment in time."

## What architect.1 does with it (work/48)

1. **The primitives as data:** data/operating-model.json: the execution ladder (E0 compute to E5 spawn; tools and storage across it), the access axes (git, vault read / write-only / create, internet, file system, install, control plane), identity (a key for every entity, ephemeral keys as proof of existence), state (git, vaults, zips, a chat's context), providers, and who can do what today.
2. **Infographics:** hand-made 1920x1080 slides in the family look, plus images from OpenRouter's image models through admin/tools/llm.mjs (ledger; images kept outside git, in a vault when published).
3. **A page** under The agentic team: /agentic-team/operating-model/.
4. **To read:** Dinis's "thinking in graphs" text on fractal semantic graphs and meaning through connectivity. Not found by search (the 2018 Open Security Summit deck "Thinking in graphs" is); Dinis to give the link.

## Follow-up (14:47 UTC)

> "see also newsroom.sgit.ai , namely the fractal semantic graphs"

Read: https://newsroom.sgit.ai/articles/introducing-fractal-semantic-graphs.html (the term and the five-rule grammar) and, from it, abp.sgit.ai's capability grammar (verb.object.reach, 23 primitives). The access axes in data/operating-model.json are rebased on those primitives rather than invented; the vault axis is proposed in the same grammar, for Dinis to accept.

## The altitudes (14:57 UTC, Dinis with Angelo)

> "We really like this meaning to connectivity, although you could just rename this to the ... altitudes? Yeah, the altitudes ... make this already about the code execution or the task execution ... or the craft execution."

> "Even at the swarm level, it's still a unit of work ... it's work of work of work of work ... it's just how big it is ... Like, this is a model of what? ... Claude, propose some ideas, architect."

> "I'm not 100% sure that the grant should be there in the middle, because the grant is actually happens at every altitude. Every altitude has fundamentally a mandate and the grant that we give. But I like how you say that the top level is a swarm ... agents of agents. Then you have a specific agent ... the run is like a worker ... something that has an agentic loop ... can make calls until it gets something done ... it's a closed unit of work."

Done: slide 4 is now "The altitudes of execution": A4 swarm, A3 agent, A2 worker (the run: a closed loop that cannot start others or schedule), A1 call, A0 compute; the mandate and the grant on every altitude, not as a layer. Names proposed for what the model describes (data/operating-model.json altitudes.names_proposed): holon (recommended), unit of work with its doer, actor, executor, mandate.
