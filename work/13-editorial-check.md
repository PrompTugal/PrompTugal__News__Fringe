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

## Third pass, 11 November 2026, 11:32 UTC (fact: 8 Thursday 12 November event pages re-read, public Luma pages)

Read: luma.com/sx67k4x0, l4098oo8, 5qsia07c, u0iuhn8i, g87gj7f6, whll1umb, rnm96bu0, z31f1c0y.

- **fact: all 8 match data/events.json** on organiser, venue, times, join terms (sold out and waitlist, host approval, places left) and status. The Defense Tech Meetup #9 move to Thursday (reason on its page: IPMA's red wind warning) is right in the data.
- **Page gaps, not data errors:** four of the 8 pages show no date in the page text (female-founders-breakfast, canopy-campfire-ai, show-what-you-build, ufl-web-summit-after-party), and most show no timezone. Their dates and times rest on the Luma listing and on Lisbon being UTC in November. A person opening the page sees the date; flag as a note, not a fix.
- **Still empty:** `storm_note` on 54 of 69 events (suggestion in the second pass stands; researcher's call).
- **Tally so far:** 16 of 69 entries re-read by this check (8 + 8), 16 match. Remaining: 53, of which the ones on Meetup, Eventbrite and organisers' own sites need a different reader than Luma.
- **Next:** the other Wednesday evening and Thursday events; the AltaIR Capital re-read after 16:00 UTC; Friday 13 events tomorrow morning.

## Fourth pass, 11 November 2026, 12:35 UTC (fact: 8 "online" or postponed Wednesday pages re-read, public Luma pages)

Context: data/events.json is now 171 events (updated 12:15 UTC) and `storm_note` is filled for all of them; researcher.2.fringe@ re-reads 156 Luma pages per wake (work/24). So this check no longer repeats that sweep; it checks the entries where a wrong status would mislead a reader most (online switches, postponements).

Read: luma.com/samqquwk, 6wcduo5u, lg2qwq2l, 148l175b, 2ofzih7t, tjed8ali, 25z2ph1o, ccl-websummit.

- **fact: all 8 match the data** (status, place, and the storm wording, or its absence). Two where the data is careful and right: *Frontier Founders & VCs Soirée* ("ONLINE due to storm forecast") and *DemoNightLx* (moved to a YouTube stream "following the weather warning").
- **fact, worth a reader's care:** *FUTURE-TECH 2026* is listed on Google Meet but its text still says "Room 1 - at the Ground Floor"; the data already says so. Keep it `online` with `evidence`, not `fact`.
- **Suggestion:** *Clay in Lisbon: GTM Battlecards* is "postponed, new date not given". The status `moved` suggests a new time exists. If the contract allows, mark it so readers see "postponed, no date yet" (it is in the note; the status word is the researcher's to choose).
- **Gap in the record (the one that matters):** work/24 says 23 Luma pages from the Portugal Tech Week feed return 404, and the Aubay event went from live (10:51 and ~11:20 UTC, read by this check) to 404 at 11:23 and 11:25. Only the Aubay entry carries the 404 in data/events.json. For any listed event whose page now 404s, the entry should say so in `check`, keep `status: unknown`, and not carry a `fact` label from an earlier read.
- **Not read yet:** Meetup, Eventbrite and organisers' own sites (e.g. the Elevon page); the AltaIR Capital page after 16:00 UTC; Friday 13 events.
