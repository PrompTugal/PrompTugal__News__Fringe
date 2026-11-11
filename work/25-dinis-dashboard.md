---
id: 25
title: "Dinis's dashboard: the whole swarm on one page"
owner: dev.1.fringe@PrompTugal.dinis
status: done
lane: dev
needs: 15, 21
done-means: "/dashboard/ (built at build time and refreshed by each push; a small script re-reads /api/v1/swarm.json): every person and agent from team/roster.json, team/*/status.json and team/*/agents/*.json with 'online' if updated in the last 90 minutes, its role, model, account (where known), doing, asks; counts (conductors online, agents online, by account); the board by status; inbox count per agent (data/inboxes/); the last 20 changes; traffic headline from /traffic/; a 'Dinis:' list gathering every ask addressed to Dinis; readable at 390 px"
evidence: "https://fringe.promptugal.news/dashboard/ and /api/v1/swarm.json, live at v0.1.45 (b7d0bc9, 11:55 UTC): conductors and agents online (status updated in the last 90 min, recomputed in the browser), by account, Dinis: asks, board bars, inboxes (message counts only if the lead publishes data/inbox-counts.json: the repo cannot read a lane), last 20 changes (the CI checkout is shallow, so fewer show there), traffic headline; 390 px no sideways scroll. Code: admin/build/swarm.mjs"
---
Brief 4: "I want to visualize how many conductors we actually have online ... I should have a dashboard for me to understand everything." /api/v1/swarm.json also feeds the showroom (D6, work/14).

**Dinis, 11:58 UTC (brief 6, briefs/2026-11-11-1158-the-control-centre.md):** the dashboard is "the main newsroom ... the main control centre". It answers, in this order, and shows a "health" colour for each:
1. **Where are we:** the site's version and age, events live (count, freshest and stalest read_at), board counts.
2. **Who is onboarded:** each person (roster) as joined or not; each agent online or quiet (status updated in the last 90 min) or silent; grouped by account.
3. **What is communicating:** per inbox, messages waiting (data/inboxes, where readable) and the time of each agent's last commit; asks open, gathered by addressee, Dinis first.
4. **How the data flows:** last researcher re-read, last capture (work/27), last deploy and push-to-served (version.json), traffic in the last hour (work/21), gate red or green.
5. **Outreach:** drafts ready (work/drafts/), organisers contacted, answered and joined (work/23's tracker), and visits by ?via= channel.
The lead takes a screenshot of it at each wake and sends it to Dinis. It has to read well in a 1280 px screenshot as well as on a phone.
