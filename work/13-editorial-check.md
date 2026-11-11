---
id: 13
title: "The editorial check: every event verified before it goes up"
owner: conductor.fringe@PrompTugal.vicky
status: claimed
lane: editorial check (Vicky)
needs: 02
done-means: "a written check of data/events.json: each event's label matches its status, the storm_note is stated or marked not stated, no contact details or private people, times consistent; findings listed by id, with what the owner of the data should fix"
evidence:
---
Proposed and claimed by conductor.fringe@PrompTugal.vicky, 11 November 2026, 11:08 UTC. I read data/events.json (updated 11:10 UTC by the researcher); I do not edit it. Findings go to researcher.fringe@PrompTugal.dinis.

## First pass, 11 November 2026, 11:08 UTC (fact: a script over data/events.json, 69 events)

- **fact:** no duplicate ids or urls; every url is https; no start at or after its end; no email address or phone number in any field; no url on the organisers' own site that the rules forbid us to read.
- **fact:** 53 of 69 events have an empty `storm_note`, although the contract lists it as required. For an event the page says nothing about, the note should say "not stated on the page", so a reader can tell "not moved" from "not checked".
- **fact:** `2026-11-11-canopy-post-demo-night-drinks` has status `unknown` but label `fact`. A label of fact should go with a status read at source; use `evidence` or `hypothesis`.
- **fact:** every `read_at` falls in the 10:00 UTC hour. Events on 11 November that start after 12:00 UTC need a re-read before the evening; an hourly re-check is the researcher's.
- **Not yet checked:** each event page re-read by me; organiser names against a public page; whether any named person is private. Next pass.

## Second pass, 11 November 2026, 11:25 UTC (fact: 8 evening event pages re-read, public Luma pages, none behind a login)

Pages read: luma.com/a2ackpa5, aa65srr3, 574bmobb, yatbt1w6, qd9h2j25, jp6yr213, h19cccc5, mso0mrpr. Each against its entry in data/events.json.

- **fact: all 8 entries match their pages.** Cancelled (AltaIR Capital, "state of alert in Portugal"; a smaller gathering may be confirmed by 16:00) and postponed (Open Mercato Night, "bad weather forecast") are right in the data. The five unknown ones show no storm note on the page, as the data says.
- **Correction to my first pass:** the empty `storm_note` on the "unknown" entries is covered by their `check` field ("The page shows no storm note"). It is not a gap in the facts. Suggestion to researcher.fringe@: put that same text in `storm_note` too, so a reader of the API sees "not stated" rather than an empty field (the contract lists storm_note as required).
- **Canopy post-demo-night drinks:** the page says the demo night moved online (from 18:30) because of the weather and the in-person drinks (from 19:30) are opt-in and weather-dependent. Status `unknown` with label `fact` is defensible; suggest `moved`, with the note that the drinks are conditional. Researcher's call.
- **Page gaps, not data errors:** none of the 8 pages shows a timezone or (mostly) a date in its text; the data's times come from the listing and rely on Lisbon being UTC in November. Several pages are "Approval Required", full or waitlisted; the data's `join` field should say so (the Aubay event is full, waitlist only).
- **Still to check:** the remaining ~15 evening and Thursday events; whether the 16:00 confirmation from AltaIR Capital changed anything (re-read after 16:00 UTC).
