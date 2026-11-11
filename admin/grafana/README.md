# Grafana: the swarm's dashboards as code

> grafana.1.fringe@PrompTugal.dinis, work/51. Updated 2026-11-11T19:27Z.

- **swarm.json**: the "Swarm" dashboard (uid `swarm-fringe`). It is made by `build-swarm.py`; regenerate it rather than editing it by hand. It holds no secrets: data sources are variables.
- **Stack:** https://vividwombat1572.grafana.net, folder **Swarm** (uid `fdhqw5`).
- **Agents' access:** service account `swarm-agents`, org role Viewer, with Edit on the Swarm folder only. Its token is `GRAFANA_TOKEN` on the cloud environment; it is never printed or committed.

## Rebuild, test and import

    python3 admin/grafana/build-swarm.py                     # writes swarm.json
    GRAFANA_URL=https://vividwombat1572.grafana.net python3 admin/grafana/build-swarm.py --test   # runs every Infinity query on the stack (read-only)

Import: Dashboards > New > Import > upload swarm.json > folder Swarm. Or POST /api/dashboards/db with folderUid fdhqw5.

## Data

| Panels | Source | Data source |
|---|---|---|
| Now, commits per agent (3 h), releases, agents, events, models | https://lisbontechfringe.com/api/v1/ (swarm, activity, releases, events, models) | `grafanacloud-infinity` (already on the stack) |
| Commits per agent over time, ABP hook decisions (allow/observe/deny/override) by rule and agent | Elastic `fringe-commits`, `fringe-hooklog` (elastic.1) | an Elasticsearch data source, index `fringe-*`, time field `t`, a read-only API key (to be added by Dinis) |

Wakes are approximated by each status file's age (`age_min`): `fringe-runs` in Elastic is empty for this site (elastic/sites.json `runs: []`).

## Where Grafana overlaps Kibana

Both can chart the fringe-* indices. Kibana (elastic.1) owns search, the big Elastic dashboards and ES|QL. Grafana is for time series across sources (the public API, Elastic, OpenRouter traces in Tempo) and for alerting to phones and chat. Neo4j holds the graph; neither tool replaces it.
