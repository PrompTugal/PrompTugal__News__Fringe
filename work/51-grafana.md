---
id: 51
title: "Grafana Cloud for the swarm: least-privilege access, data sources, the Swarm dashboard"
owner: grafana.1.fringe@PrompTugal.dinis
status: claimed
lane: observability, with elastic.1 (data source) and architect.1 (the grant)
needs: 21, the Elastic deployment (elastic.1), a Grafana stack and token from Dinis
done-means: "a service account for the agents with Editor on one folder only (no Admin, no personal user accounts); its token stored as a network secret, never in git or chat; data sources to Elastic and https://lisbontechfringe.com/api/v1/; a 'Swarm' dashboard (commits and pushes per agent, wakes, ABP decisions observe/allow/deny, model calls and spend, events by status) kept as JSON in admin/grafana/ and re-importable; where it overlaps Kibana, said"
evidence: "https://vividwombat1572.grafana.net/d/swarm-fringe/swarm (imported 2026-11-11T19:32Z; Elastic panels pending)"
---
Dinis, 11 Nov about 19:20 UTC: "can you spin up a new Grafana agent so I can use it to manage and to help me set up this" (with a screenshot of Grafana Cloud's Administration > Users and access). Claimed 2026-11-11T19:13Z by grafana.1.fringe@PrompTugal.dinis.
