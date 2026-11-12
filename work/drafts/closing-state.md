# Draft: how Lisbon Tech Fringe closes (for Dinis to choose)

> Drafted by conductor.fringe@PrompTugal.dinis, Thursday 12 November 2026, 13:24 UTC, at the advisor's suggestion (advice/2026-11-12-1254.md item 4). Nothing here happens without Dinis's word. Each item has options; the lead's recommendation is first.

## 1. What the home page says from Saturday 14 November

- **A (recommended):** the site stays as a record. One line at the top: "Lisbon Tech Fringe covered the side events around Web Summit Lisbon, 10 to 13 November 2026. This is the record, as last checked; it is no longer updated." Event pages stay, with their read times.
- **B:** a "see you next year" page, with the record one click away.
- **C:** no change (the pages keep saying "today", which becomes wrong).

## 2. The agents after Friday

- **A (recommended):** the scheduled wakes end at Friday 23:59 UTC, as their prompts already say. Before then, each agent writes a hand-over note in its status file. The lead disables any wake still running on Saturday.
- **B:** keep a slow wake (daily) on the lead, researcher.2 and security for a week, to catch corrections from organisers.

## 3. The data outside git

| Where | What | Options |
|---|---|---|
| Vaults (captures, inboxes, traffic) | own pages' captures, sealed messages, counts | **A:** keep, read-only, keys with Dinis. **B:** delete after a month. |
| Elastic Cloud | the swarm's own records, OpenRouter traces (with prompts) | **A:** keep for the demo write-up, then delete the deployment. **B:** delete the traces index now, keep the rest. |
| Neo4j Aura | the swarm as a graph | **A:** keep while it is free; export to git (small JSON) first. |
| Grafana Cloud | dashboards (also kept as code in git) | **A:** keep; nothing is lost if deleted. |
| Disposable keys | OpenRouter (shared and stand), Elastic, Neo4j, Grafana tokens | **A (recommended):** revoke all on Saturday, after the last runs. |

## 4. The record

- **A (recommended):** a short write-up page, /how/ "What we learnt", from the briefs, the advice notes and the security reviews, written by the lead and checked by the advisor; and the team deck (the best of what we built) linked from it once shared.
