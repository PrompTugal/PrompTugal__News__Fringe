---
title: "The Agent Behaviour Policies of Lisbon Fringe"
by: architect.1.fringe@PrompTugal.dinis
started: 2026-11-11
board: work/39 (brief 12)
model: PrompTugal__News__Website board/abp/ (abp@PrompTugal.dinis, since 6 November 2026), ported, not reinvented; RiskMandate's Agent Behaviour Policy and Licence to Operate (https://riskmandate.ai/agent-behaviour-policy.html)
---
# The Agent Behaviour Policies (ABP)

**Dinis (brief 12):** "agent behavior policies that literally say who can edit what, who can edit in multiple environments, and for example, what parts of even the GitHub repo an agent can touch."

**Dinis's ruling, 13:36 UTC:** "for now, you should start with observe mode so we can learn. So it should not be blocking ... we take two or three rounds of execution, and only when we know that a particular thing is safe, we start to maybe a bit more enforcement. But for now, you should always have an escape hatch, and conductor should be able to override it."

## The files

| File | What it is |
|---|---|
| `policies.json` | the policy as data: eleven core rules, the tools, a grant per role and per agent (paths here and in other repositories, hosts, tools), the shared files with one proposed owner each, a mode per rule (all `observe`), the override escape hatch. Deny by default. |
| `<agent>.md` | one ABP per agent, generated (`node abp/tools/abp.mjs build`), never edited by hand |
| `index.json` | every grant flattened, for /abp/ on the site |
| `overrides.json` | (when needed) the escape hatch: `{"items":[{"rule","agent","by","why","at","until"}]}`, written by a conductor or Dinis |
| `tools/abp.mjs` | `build`, `check` (commit paths against the Agent: trailer's grant: the gate prints WARN, never fails), `review` (the hourly review), `test` |
| `../.claude/settings.json`, `../.claude/hooks/abp.mjs` | the hooks every session in this repository runs: they re-anchor the agent's ABP at every start, resume and compaction, and log every tool call to `~/.abp/log/` |

## How it holds, today

1. **By policy, re-anchored.** The `SessionStart` hook prints the agent's own ABP back into its context from disk; the `UserPromptSubmit` hook adds a one-line anchor.
2. **By the record, in observe mode.** The `PreToolUse` hook decides from `policies.json` and logs `allow`, `observe` (would deny) or `override`. It blocks nothing. The gate (`admin/build/validate.mjs`, check 6) prints a WARN for each path a commit writes outside its Agent:'s grant, and never fails on it.
3. **By review.** Every hour the architect runs `node abp/tools/abp.mjs review` and writes what each observe event teaches: a grant too tight (a relaxation proposed to Dinis), a habit to change (a note to the agent's inbox), a rule that looks safe.

**Who the session is:** the label of its own session key (`~/.sg-send/keys/*/metadata.json`), e.g. `design.1.fringe@PrompTugal.dinis`, or `ABP_AGENT`. A session with no key is *unidentified*: the core rules hold and its writes are logged as unidentified.

**A broken hook never stops an agent.** Every mode catches its own errors and exits 0, and the commands end in `|| true`.

## Towards enforcement (only by Dinis)

A rule moves from `observe` to `enforce` only after two or three rounds of logs show it is safe, and only by Dinis's decision, recorded in `policies.json` `enforcement.rules.<R>` with the date and his words. Even then, a conductor or Dinis can override it (`abp/overrides.json`, or `ABP_OVERRIDE='<rule>:<why>'` with `ABP_OVERRIDE_BY`), and the hook logs the override with who, why and when.

## What the hooks cannot see

- What a script does once started (a Node or Python program can write any file or send anywhere); the commit's paths are checked afterwards by the gate and the review.
- Shell writes to ordinary paths (`>`, `sed -i`) are checked only for the protected paths; the rest is caught by the commit check.
- A session that does not load this repository's project settings, or whose user disabled hooks.
- Who is really behind a key label.
- Other sessions' hook logs live in their own containers: the review sees them only through their commits and run logs.
