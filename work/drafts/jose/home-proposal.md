# Proposal: seven changes to the home page (from Jose)

> From Jose Bota, written with conductor.fringe@PrompTugal.jose, 11 November 2026, 18:32 UTC. **For design.1 (owner of the home, D28) and Dinis to decide**; nothing here is built by Jose's agents. Seen on the home as built from dev at 18:15 UTC, at 390 px and 1280 px, with the browser clock at 18:31 UTC.

## Why

At 18:30, someone stuck in Lisbon opens the site to find **something to go to tonight**. The home is good (the roles, the map, the cards), but at that hour its first screen mostly shows events that started at noon, and tonight's events are folded away. And WhatsApp, which brings almost every tagged visit (156 of 157), has no "share tonight" button.

## The seven changes

| # | What we saw (18:31 UTC) | Proposal |
|---|---|---|
| 1 | The card list shows the first cards by start time: the 12:00, 14:30 and 16:00 events "on now", then the 17:00 ones; the 29 cards from 17:30 to 22:00 are folded away. | Order by **what starts next** first, then what is on now (long-running ones last); after 17:00 UTC open on **Tonight** by default. |
| 2 | "Next hour" and "Tonight" list the same three 19:00 events. | **Tonight** = what starts after the next hour, so the columns don't repeat. |
| 3 | The counts line says "24 on now"; the Now tab says "Now 22". | One definition for "on now", or say what the difference is (online, outside Lisbon). |
| 4 | Every title in the three columns is cut to one line ("Valois Lisbon: T…", "Indvstry Power …"). | Two lines per title (line-clamp: 2) and the place on the line below. |
| 5 | The only share on the home is the tip ask ("Seen a side event that is not listed…"). | A **Share tonight's list** button by "Now, next hour, tonight": WhatsApp (`/now/?via=whatsapp`) and LinkedIn (`?via=linkedin`), and the same on every event page. WhatsApp is the channel that works. |
| 6 | The first thing a visitor reads is the swarm ticker ("2 commits · 0 pushes · 1 agents in 15 min"). | On the home, move the ticker to the agentic-team strip at the bottom (brief 13: "it feels very geeky"); keep it on the team pages. |
| 7 | The design pill ("Design d", "◧") floats over the map and cards on a phone. | Show it only on /designs/ or with `?design=`. |

## A data note (for researcher.2), and a question

"Side Events Guide IRL: meet us during Web Summit (Wednesday)" (`2026-11-11-side-events-guide-irl`) runs, in data/events.json, from 2026-11-11T14:30Z to 2026-11-12T17:30Z: the organiser's page listed a window from Wednesday 14:30 to Thursday 17:30 (its note), so the end date is as listed. But its check says the Luma page returned 404 when re-read at 14:15 UTC and that its "status stays unknown", while its `status` field says `on`. So the home shows it **ON NOW** all night, for a page that no longer answers.

- For researcher.2: should its status be `unknown`, as its own check says?
- For design.1: a two-day "come find us" window shown as ON NOW at night reads as an event happening now; show such windows as "open until Thu 17:30" rather than in Now.

## Why from Jose's lane

Jose's lane is the channels. Changes 1, 2 and 5 decide whether a link shared in a WhatsApp group at 18:30 lands on something useful, and whether the reader shares it on.
