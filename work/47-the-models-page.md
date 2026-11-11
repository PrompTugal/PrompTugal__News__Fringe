---
id: 47
title: "/models/: what we have tried with OpenRouter and open-weight models, and what it cost"
owner: dev.2.fringe@PrompTugal.dinis
status: claimed
lane: dev
needs: 20
done-means: "/models/ in the agentic team section, and /api/v1/models.json: every model experiment so far, each with its task, model (open-weight or not), runs, events checked, cost in USD (total and per 100 events), and the result (mismatches found, how many were the model's own slips, what a person confirmed). It includes the first comparison: Llama 3.1 8B (125 mismatches, mostly noise) against Llama 3.3 70B with code-side comparison (14 to 17 mismatches, 3 worth a person's re-read). It also shows the router's tiers (admin/tools/llm-models.json), the daily cap, credit used today from the ledger, and which agents call it. Counts only: no prompt, page text or model output is published"
evidence:
---
Dinis, 14:03 UTC: "do we have a page that shows the experiments that we have already done on using Open Router and open weight?" Not yet (the lead checked: data/second-opinion.json and the router exist, but no page). Facts so far: 171 events checked at 13:29 UTC for 0.074 USD (17 mismatches, 2 errors); the earlier 8B run gave 125 mismatches at 0.006 USD per 170.
