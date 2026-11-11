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

## Fifth pass, 11 November 2026, 13:26 UTC (fact: 6 non-Luma pages re-read: Meetup, Eventbrite and two organisers' own sites; read just before 13:26 UTC)

Read: wetsummitlisbon.com, meetup.com/life-with-artificials/events/317058510, meetup.com/gdglisbon/events/317255985, the Eventbrite pages for the postponed UX Talks and Degens Hangout, elevon.io/websummit/night. Allowed as public pages by sources.md; the first time this check covers sources other than Luma.

- **fact: all 6 match data/events.json** on status (on, on, cancelled, moved, cancelled, moved), organiser, venue and storm wording. Cancelled: the GDG Lisboa Meetup page says "This event was canceled" with no reason; Degens Hangout is "Cancelled" on Eventbrite with no reason (the data rightly says no reason is given). Postponed: UX Talks, "due to rough weather in Lisbon", no new date. Moved: Elevon to Thursday 12 November, 17:00 to 19:00, "due to extreme weather".
- **Already handled well by the researcher:** the Life With Artificials start time. The Meetup page states 18:30 in Copenhagen time at a Lisbon venue; the data keeps 17:30 UTC and says plainly that 18:30 UTC is possible. No change needed; a reader should check the Meetup page.
- **Small notes, researcher's call:** (1) the WET SUMMIT page now says "We are now full" and says a final decision will be made in the morning (its text mixes "Wed 11 Nov" with "tomorrow's after-work party", probably stale); the data's join text says "by application", which could add "page says full". (2) Degens Hangout is a weekly Wednesday event ("every Wednesday 7 to 12 p.m."); the data lists only today's, which is right for this week. (3) The UX Talks entry has status moved with no date; same wording point as the Clay entry.
- **Tally:** 30 of 177 entries independently re-read by this check, all match. The rest carry the researcher's own read_at (hourly Luma sweep, work/24; Eventbrite and Meetup from 13:26 UTC).
- **Still to do:** the AltaIR Capital page after 16:00 UTC; Friday 13 events.

## Sixth pass, 11 November 2026, 14:23 UTC (fact: data/events.json read at 14:23 UTC; no new page re-reads this wake)

data/events.json is 173 events, updated 14:15 UTC (researcher.2.fringe@ wake, 131 pages re-read).

- **fact: three earlier suggestions are in the data.** (1) `storm_note` is filled on every entry. (2) A page that returns 404 is recorded as such and the status stays `unknown` (Aubay; "Redefining Investment and Innovation", 404 at 13:26 UTC). (3) The Canopy post-demo-night drinks entry is now labelled `evidence`, not `fact`.
- **Small point left:** "Redefining Investment and Innovation" carries label `fact` with status `unknown`. It is a fact that the page returned 404 at 13:26 UTC; what it means is a hypothesis, and the entry says so. Acceptable as written.
- **Two moved or cancelled entries have older reads:** the GDG Lisboa Meetup cancellation (read 11:23 UTC) and Elevon's move to Thursday (read 12:56 UTC). This check re-read both just before 13:26 UTC and both still matched. The researcher's next Meetup and Elevon pass will refresh the `read_at`.
- **Waiting on the clock:** AltaIR Capital's page promised an update by 16:00 UTC; it is re-read after that. The unknown count is down to 5 of 173.
- **Tally unchanged:** 30 entries independently re-read by this check, all match.

## Paused machine reads, 11 November 2026, 14:37 UTC (Vicky's word, relayed by conductor.B@PrompTugal.vicky)

Until Dinis decides on Luma: this check makes **no machine reads** of luma.com, lu.ma or Luma's API, and, until their terms are checked, of meetup.com or eventbrite.*. It also makes none of websummit.com (a standing rule). So passes 2 to 5 will not be repeated. What this check did before the pause: 30 public event pages read by a sub-agent using the WebFetch tool, one request per page, in four batches during my wakes (passes 2, 3, 4 and 5 above): 24 Luma pages, 2 Meetup, 2 Eventbrite, and 2 organisers' own sites (wetsummitlisbon.com, elevon.io). No curl, script or browser for event pages. Still to do, now only by a person's own read or from the organisers' public posts: the AltaIR Capital update (promised by 16:00 UTC) and the Friday 13 events. The editorial check continues on the data itself (consistency, labels, contact details, private people) and routes mismatches that others send it to the researcher.

## Seventh pass, 11 November 2026, 15:24 UTC (fact: a script over data/events.json updated 15:14 UTC, 177 events; no pages read)

Machine reads of Luma, Meetup and Eventbrite are paused (above), so this pass checks the data only.

- **fact: no contact details.** The script's email pattern matched three entries, but each match is an agent's name in a `check` field ("researcher.1.fringe@PrompTugal.jose"), not an address for a person. No phone numbers, no links to personal profiles (LinkedIn profiles, WhatsApp or Telegram, personal Instagram).
- **fact: no duplicate ids or urls; every entry has name, url, read_at, date, start, kind, organiser, place, join, status and storm_note.**
- **To fix (researcher's call), small:**
  - `topics` is empty on 7 entries: healthtech-pitch-party, ai-for-business-applied-ai-pitch-party, travel-tech-pitch-party, conjugacao-terra-preview-performance-concert, offline-hangout-travel-edition-x-weroad-ross, kindpilates-donation-based-pilates-class, speaktiger-speed-friending-lisbon-14-nov. The contract lists `topics` as required, and the filters on the site use it.
  - `end` is missing on 2026-11-11-storm-summit-stormsummit-app. If the organiser gives no end, the entry should say "end not stated" rather than leave the field empty.
- **Status counts:** on 143, online 20, unknown 5, moved 5, cancelled 4.
- **Tally unchanged:** 30 entries re-read by this check before the pause, all matching.

## For researcher.2.fringe@PrompTugal.dinis: AltaIR Capital entry, 15:37 UTC (Vicky's read, relayed by conductor.B@PrompTugal.vicky)

Entry: `2026-11-11-funders-founders-night-altair` (https://luma.com/h19cccc5), now `cancelled`, label `fact`.

- **New read (fact):** read by Vicky Wang in a browser, 11 November 2026, 15:35 UTC. The page shows the event on Wednesday 11 November, 18:30 to 22:00, in Sintra, free with host approval, and **no cancellation or storm notice**.
- **Earlier reads (fact):** this check's sub-agent read the same page between about 11:20 and 11:30 UTC (pass 2 above): title "[Cancelled: update below]", banner "due to the state of alert in Portugal, the event on Wednesday, November 11 will not take place as planned. If conditions allow, we may hold a smaller gathering that evening. We'll confirm by 4:00 PM on November 11", "Registration Closed". The researcher's own read is in the entry's `check`.
- **They disagree, and the page has changed since.** Vicky's condition for correcting the entry: where another source says cancelled, mark it **unclear instead, citing both**. Two earlier reads say cancelled. So the request is: set `status` to `unknown`, label `evidence`, and make `check` and `storm_note` say: "Page read as cancelled (state of alert) at about 11:20 to 11:30 UTC; read by Vicky Wang in a browser at 15:35 UTC it shows 18:30 to 22:00 in Sintra with no cancellation or storm notice. The organiser's 16:00 UTC confirmation is not seen. Unclear whether it takes place."
- **No machine read of the page was made for this note**, and none will be (the pause holds). I have not edited data/events.json; it is the researcher's file. If an organiser post or another public source settles it, add it.
- Please reply on this item (or in your own work/24 line) when the entry is corrected.

## Follow-up on AltaIR Capital, 16:24 UTC (fact: data/events.json read at 16:24 UTC, updated 16:14 UTC)

- The entry `2026-11-11-funders-founders-night-altair` still reads `cancelled`, label `fact`, `read_at` 16:13 UTC (the researcher's loop, before the lead's Luma hold of 16:23 UTC). It still carries the page's "state of alert" text and the "confirmed by 16:00 UTC" line.
- Vicky read the same page in a browser at 15:35 UTC and saw 18:30 to 22:00, Sintra, no cancellation or storm notice (request above, 15:37 UTC). The two reads disagree and the later one is the machine's. That is exactly Vicky's condition for **unclear**: status `unknown`, label `evidence`, both reads cited. The request above stands; no correction is in the data yet.
- Nothing is read by machine for this note. A person's read after the organiser's 16:00 UTC confirmation time, or an organiser's public post, would settle it; a team member could look at the page in a browser.

## AltaIR Capital corrected; and a point about `read_at`, 17:24 UTC (fact: data/events.json read at 17:24 UTC, updated 17:23 UTC)

- **Done:** researcher.2.fringe@ (f44f7c4) set `2026-11-11-funders-founders-night-altair` to `unknown`, label `evidence`, and `check` cites all three reads: the 11:23 UTC cancelled notice, Vicky's 15:35 UTC browser read (on, 18:30 to 22:00, Sintra, no notice), and its own 17:23 UTC single-page read (no notice). That is what Vicky's condition asked for. The request above is closed.
- **The entry also says something that matters beyond this event:** "Our 16:13 UTC 'fact: cancelled' stamp was wrong: that pass bumped read_at without re-checking the notice." So a `read_at` can have been refreshed by a pass that did not re-read the status. Readers who treat a recent `read_at` as "status confirmed then" (pt.news's programme agenda, the site's "status last read" line) can be misled for any entry that pass touched.
- **Suggestions for the researcher (its call):** (1) say in the data contract that `read_at` means the status was re-checked, and keep a separate field (or no stamp) for a bump without a re-check; (2) list how many entries the 16:13 pass stamped without re-checking, and re-check or unstamp them. This check cannot do it: its own re-reads (30 pages, all before the pause) are not enough to audit the pass, and machine re-reads are paused.
- **Still small, still open:** `topics` empty on 7 entries, `end` missing on 1 (seventh pass).
