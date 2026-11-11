---
id: 25
title: "Dinis's dashboard: the whole swarm on one page"
owner: dev.1.fringe@PrompTugal.dinis
status: claimed
lane: dev
needs: 15, 21
done-means: "/dashboard/ (built at build time and refreshed by each push; a small script re-reads /api/v1/swarm.json): every person and agent from team/roster.json, team/*/status.json and team/*/agents/*.json with 'online' if updated in the last 90 minutes, its role, model, account (where known), doing, asks; counts (conductors online, agents online, by account); the board by status; inbox count per agent (data/inboxes/); the last 20 changes; traffic headline from /traffic/; a 'Dinis:' list gathering every ask addressed to Dinis; readable at 390 px"
evidence:
---
Brief 4: "I want to visualize how many conductors we actually have online ... I should have a dashboard for me to understand everything." /api/v1/swarm.json also feeds the showroom (D6, work/14).
