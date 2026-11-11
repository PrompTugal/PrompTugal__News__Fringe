---
title: "Where agents run: the primitives, the matrix and the formula"
by: conductor.fringe@PrompTugal.dinis (the lead), from Dinis Cruz's brief 14 (talking with Angelo), 11 November 2026, 14:12 UTC
status: draft v0.2 (architect.1's corrections, §8), for Dinis and Angelo to correct
board: work/48
---
# Where agents run

> Dinis: "Try to use as much frontier models, so much open weight models as we can, because ... we are already maxing out a lot of our accounts ... the point here is not to slow down. The point here is now to engineer a lot of our actions that actually can be done by open weight models, where we keep Claude and others running in the current loop."

## 1. Two different things: an agent and an LLM call

| | **An LLM call** | **An agent** |
|---|---|---|
| What it is | one input, one output, from a model | a model in an environment, with tools, in a loop |
| What makes it | a prompt and a model | **a role, its craft, its rules (ABP), its context, its task, and its identity (a PKI key)** |
| Memory | none | its context, its status file, its inbox, its vaults |
| Where it runs | any model endpoint | any runtime that gives it a loop and tools |
| Examples here | the second opinion (Llama 3.3 70B on OpenRouter) | researcher.2, design.1, the lead |

**An agent is not where it runs.** The same agent (role, rules, key, context, task) can run on Claude Code today and on a laptop tomorrow, and inside one run it can make many LLM calls to many models on many accounts. The direction: **agents on near-frontier models; most LLM calls inside them on smaller, cheaper or open-weight models.** Claude already does this (Opus calling Sonnet and Haiku).

## 2. The primitives

### 2.1 Runtimes: where an agent's loop runs

| id | Runtime | Loop and tools | Notes |
|---|---|---|---|
| R1 | **Claude Code, cloud** (this account and the team's) | full: shell, git, browser, network, scheduled wakes | what runs today; quota is the bottleneck |
| R2 | **Claude Code, local** on our laptops | full, plus the laptop's own models | the bridge to the laptops' Ollama models: the laptop's agent **pulls** task packets and calls its own Ollama; nothing on the laptop is exposed |
| R3 | **ChatGPT** (an agent mode) | its own tools; no git of ours | talks to us through vaults, files or chat; our ABP hooks do not run there, so its output is checked where it lands |
| R4 | **Other agent providers** | varies | to add as we find them |
| R5 | **A person** with a chat window | the person is the loop | level 0: paste in, paste out |

### 2.2 Model endpoints: where an LLM call goes

| id | Endpoint | Models | Cost | Notes |
|---|---|---|---|---|
| M1 | Anthropic, through Claude | Opus, Sonnet, Haiku | quota | the agents' own brains |
| M2 | **OpenRouter** | open-weight (Llama, Qwen, DeepSeek) and others | metered, cheap | live: admin/tools/llm.mjs, /models/ |
| M3 | **Ollama on our laptops** | open-weight, local | free at the margin | private data never leaves; reached only by an agent on the same laptop (R2) |
| M4 | OpenAI | GPT models | metered | through ChatGPT (R3) or its API |

### 2.3 The I/O level: how data gets in and out of an agent

| level | Name | In and out by | Provenance |
|---|---|---|---|
| **L0** | chat | a person pastes in and copies out | none: the person vouches |
| **L1** | files | the agent returns a markdown file or a zip to download | the file's sha256, noted by whoever uploads it |
| **L2** | vault | the agent reads and writes an sgit vault, given to it or **made by it** | strong: a vault made by one session is that session's record (as on ruv.sgit) |
| **L3** | signed lanes | sealed, signed messages on append lanes (our inboxes, /tip/) | signature checked against data/keys.json |
| **L4** | git | the agent pushes to **dev** behind the gate (Dinis, 14:26 UTC: "the agents run always on dev"; never main); CI deploys | the commit, its Agent: trailer, its key |
| **L5** | full | git, vaults, lanes, network, wakes | all of the above |

### 2.3b The session layer (Angelo, 14:26 UTC)

| Mode | State | Example |
|---|---|---|
| stateless call | none: one input, one output | the second opinion via the router |
| chat session | a conversation's context, kept by the provider | a person with ChatGPT or Claude chat (L0); an API conversation |
| agent loop | its context, files, vaults, status, inbox, wakes | researcher.2, the lead |

The same model can serve all three; what changes is who holds the state and for how long. architect.1 maps it (work/48).

### 2.4 The other requirements of a task

| Primitive | Values |
|---|---|
| **Loop** | none (a single LLM call) / tools in a loop (an agent) |
| **Identity** | none / a session key (PKI) / a key registered in data/keys.json |
| **Judgement** | low (extract, classify) / medium (summarise, check) / high (design, code, decide, write for people) |
| **Data** | public / internal / private (people, keys): private stays on our runtimes or on local models (M3) |
| **Network** | none / public web (within sources.md) / our services only |
| **Time** | interactive / within the hour / batch |
| **Oversight** | none / reviewed output (the gate, a vault check) / ABP hooks in the loop (R1, R2): what a task that writes our repository or speaks for us needs |

## 3. Dinis's rule for "an agent"

**Anything acting as an agent has a PKI key and either write access to git (L4) or the ability to create and consume vaults (L2).** An agent with only vaults (a ChatGPT agent, say) is a full member: it receives its task in a vault and returns its work in a vault, signed. A chat-only helper (L0) is a tool used by a person, not an agent.

## 4. The formula

For a task *t*, write its needs: loop(t), io(t), identity(t), judgement(t), data(t), network(t), time(t). For each runtime *r* and model *m*, we know what it offers and what it costs. Then:

```
place(t) = the cheapest (r, m) such that
    io(r)        ≥ io(t)                       # it can get the data in and out
    loop(r)      ⊇ loop(t)                      # it has the tools the task needs
    identity(r)  ≥ identity(t)                  # it can sign, if the task must be signed
    trust(r, m)  ≥ data(t)                      # private data only on our runtimes or local models
    capability(m) ≥ judgement(t)                # the model is good enough for the judgement
    reach(r)     ⊇ network(t)                   # it can reach what the task must read
    latency(r,m) ≤ time(t)                      # it answers in time
    oversight(r) ≥ oversight(t)                 # its actions can be observed against the ABP
cost(r, m) = quota_pressure(r) × tokens(t) × price(m)      # quota is the scarce thing, so it weighs most
```

And inside an agent, for each LLM call *c*: **model(c) = the cheapest tier whose capability ≥ difficulty(c)**, through the router (admin/tools/llm.mjs, tiers in llm-models.json). Prefer M3 (local) when the data is private or the volume is large and latency does not matter.

## 5. The matrix today: our tasks, where they run now, where they could run

| Task (who does it today) | Loop | I/O | Judgement | Data | Now | Could run on |
|---|---|---|---|---|---|---|
| Extract an event's facts from its page (researcher.2) | call | L1 | low | public | R1 + Sonnet | **M2/M3 open-weight 70B**, driven by any agent |
| Second opinion on an event (dev.2) | call | L1 | low | public | M2 Llama 70B | M3 local, same model |
| Classify persona, topic, size, free/paid (researcher.2, ontologist.1) | call | L1 | low | public | R1 + Sonnet | **M2/M3** |
| Summarise a WhatsApp tip into fields (tips lane) | call | L3 | low to medium | private (a sender) | R1 | **M3 local** (private) |
| Translate pages to Portuguese | call | L1 | medium | public | none yet | **M2 open-weight** |
| Re-read events hourly (researcher.2) | agent | L4 | medium | public | R1 Sonnet | R2 laptop agent + M3 for the extraction |
| Screenshots and covers (capture.1) | agent | L2 | low | public | R1 Sonnet | **R2 laptop** (a browser and a vault) |
| Usability runs (usability.1) | agent | L4 | medium | public | R1 Sonnet | R2 laptop |
| Drafts for people to send (outreach.1) | agent | L4 | high | internal | R1 Sonnet | R1, or R3 ChatGPT through a vault |
| Designs (design.1 to 4) | agent | L4 | high | public | R1 Sonnet | R1; community designers on any runtime (L1, a folder) |
| Code, build, CI (dev.1, dev.2) | agent | L5 | high | internal | R1 Sonnet | R1 |
| Policies, architecture, security review | agent | L5 | high | internal | R1 Opus | R1 (frontier) |
| Routing, briefs from Dinis (the lead) | agent | L5 | high | internal | R1 Opus | R1 (frontier) |

**The shape:** keep the agents with high judgement on Claude (R1), and move the high-volume, low-judgement LLM calls (extraction, classification, second opinions, translation, tip parsing) to open-weight models: OpenRouter now, the laptops' Ollama next. That frees quota without slowing down.

## 6. The task packet: work that any runtime can pick up

So that a task can be done anywhere, it travels as a **packet** (a small folder, or a zip in a vault):

```
task.json     id, role, rules (link to its ABP), context links, inputs, the expected output,
              where the output goes (a vault id, or a branch), deadline, the requirements of §2.4
inputs/       the files it needs (public only, or sealed to the runtime's key)
SIGNATURE     the lead's signature over task.json
```

The runtime that takes it signs a claim, does the work, and writes the output, signed by its own key, to the named vault (or pushes a branch). The lead (or an agent with the grant) checks the signature and brings the result in. **/tasks/** on the site would list the open packets, with their requirements, so that a laptop, a ChatGPT agent or a contributor's agent can pick up the ones it can do.

## 7. Next steps (work/48)

1. Dinis and Angelo correct this draft (the runtimes, the levels, the rule in §3).
2. architect.1: put the matrix into data/runtimes.json and a page under "The agentic team", and add `runtime` and `io_level` to each agent's ABP.
3. dev.2: add an Ollama tier to the router for an agent running on the same laptop (R2), which pulls its work as task packets; no laptop exposes its Ollama to a cloud agent or to the internet. Move one task to it (the tips lane's parsing, which is private).
4. researcher.2 and ontologist.1: move extraction and classification calls to the router's open-weight tier; log them on /models/.
5. The lead: the task-packet format (task.json) and a first packet (translate today's event pages) for any runtime to pick up.

## 8. Changes in v0.2 (architect.1.fringe@PrompTugal.dinis, 14:23 UTC)

1. **The laptop bridge runs the other way.** v0.1 had a laptop expose its Ollama to one of our cloud agents. A cloud container cannot reach a laptop without opening the laptop to the network. So the laptop's own agent (R2) **pulls** task packets (§6) and calls its local Ollama (M3), and nothing is exposed. M3 is reached only from R2. (§2.1, §2.2, §7.3)
2. **Two constraints were missing from the formula.** `time(t)` was listed as a need but never checked: added `latency(r,m) ≤ time(t)`. And the ABP: our hooks run only on R1 and R2, so added **oversight** (§2.4) and `oversight(r) ≥ oversight(t)`. A task that writes our repository or speaks for us needs a runtime we can observe, or output that is reviewed where it lands (the gate, a vault check).
3. **R3 (ChatGPT) is not observed by our hooks.** It can be an agent under §3 (key plus vaults), but its work is checked when it lands, not while it runs. (§2.1)
4. **The data is in `data/runtimes.json`**: runtimes, endpoints, levels, requirements, the formula, the matrix, and each agent's runtime and I/O level today (every agent is on R1). Each agent's ABP page names them (abp/<agent>.md).

Not changed, for Dinis and Angelo: the rule in §3 (key plus git or vaults); whether L3 (signed lanes) alone makes an agent (our lanes are vaults underneath, so it already counts as L2); the matrix's "could run on" column, which is a proposal until a task actually moves.
