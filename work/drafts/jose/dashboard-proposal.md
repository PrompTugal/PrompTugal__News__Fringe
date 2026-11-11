# Proposal: six changes to /dashboard/ (from Jose)

> From Jose Bota, written with conductor.fringe@PrompTugal.jose, 11 November 2026, 18:00 UTC. **For Dinis to decide**; dev.1.fringe@PrompTugal.dinis owns /dashboard/ (work/25, `admin/build/swarm.mjs`). A proposal, not a task: nothing here changes the page until Dinis says so.
>
> Based on Jose's screenshot of https://lisbontechfringe.com/dashboard/ at about 16:58 UTC, and the data files the page already reads.

## Why

The page is good at showing that the swarm is busy. It is weaker at the three things people ask Dinis about: **is the site useful to readers, is outreach working, and who did what**. Those numbers exist, but they sit in cards 04 and 05, or in collapsed sections at the bottom.

## The six changes

| # | Change | Data it needs (already in the repository) | Effort |
|---|---|---|---|
| 1 | **Reader numbers first**, above the cards: events still to come today, events re-read at source in the last hour, visitors in the last hour by channel (`?via=` whatsapp, linkedin, organiser) | `data/events.json` (start, status, read_at); `data/obs/traffic.json` (by_hour, by_via) | small |
| 2 | **Outreach as a funnel**: drafted → sent → answered → joined, then one row per note sent: organisation, sent by (a person), time, and visits from `?via=organiser` | `data/outreach-tracker.json` already holds state, sent_by and sent_at (5 rows sent by jose at 16:23 UTC); `data/obs/traffic.json` by_via | small |
| 3 | **"Today, by person"**: one line per person with their two or three main results today, e.g. "Jose: 5 organiser notes sent; LinkedIn post up" | each `team/<id>/status.json` `done` list (or a short `today` field the conductors add) | small |
| 4 | **Sort the asks for Dinis**: the top three that are urgent or time-bound, each with its age and deadline; the other asks folded away | the asks in every status file; a deadline is often already in the text ("before 15:00 UTC") | medium |
| 5 | **Card 03 shows exceptions only**: agents that are silent, stale or blocked; the rest folded into "N agents OK" | `data/inbox-counts.json`, last commit per agent (already computed) | small |
| 6 | **Say why the light is yellow**, in words, with a link: e.g. "yellow: 2 agents silent for over an hour; 39 asks waiting" | the same checks that set the colour today | small |

2 and 3 are the quickest wins: the data is there, and they make each person's work visible, which is what a dashboard shared with partners should do.

## What it does not change

No new data collection, no personal data: organisations only in the outreach rows, people only by their team id. Counts stay counts.
