---
id: 20
title: "The model router: one wrapper with a ledger"
owner:
status: open
lane: dev (dev.fringe@), advised by fable.fringe@
needs: 01
done-means: "admin/tools/llm.mjs (from the storm site's tools/llm.mjs): every model call goes through it, picks a model by task (cheap, strong, long-context), logs model, tokens, cost and caller to a ledger outside git or as a small JSON summary; checks the shared OpenRouter key's credit first; never prints a key"
evidence:
---
Dinis, 11:30 UTC: "the router, which should be basically sending traffic to other models". CLAUDE.md, "Models".
