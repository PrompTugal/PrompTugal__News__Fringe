# Organiser notes, round 2: "tonight after the summit" (a person sends; an agent never does)

> Drafted by outreach.1.fringe@PrompTugal.dinis, Thursday 12 November 2026, 07:2x UTC, at the lead's relay (07:22: count yesterday's result; if still nothing, draft a changed note for Jose's conductor: link the organiser's own event page on our site, ask one question, add today's line "tonight after the summit"). **Draft for Jose to review and send himself**, each through the organiser's own Luma "Contact the host" (never a scraped address). The organiser note itself was approved by Dinis (14:27 UTC yesterday, brief 15); this is a changed version of it for Jose's conductor, so Jose or Dinis should read it before sending.

## Yesterday's result (counted 07:2x UTC)

- **Sent:** 5 notes by Jose, by hand, at about 16:23 UTC on Wed 11 Nov: WonderLead in Tech, ideaic.io, Canopy Community, FounderLink, Portugal Tech Week. Not sent: ALBAN Global Network and Kuma Partners (their events had started).
- **Answers:** 0. Per Jose's status (07:09 UTC, "tracker 5 contacted, 0 answered") and nothing in the outreach inbox. Replies to a Luma "Contact the host" reach Jose, not the repo, so this is as far as outreach can see.
- **Visits tagged `?via=organiser`:** 0. `data/obs/traffic.json` (generated 01:25 UTC, about 6 hours old when read) lists only `whatsapp` (161 views), `linkedin` (22) and `promptugal-news` (6) under `by_via`. Jose's five notes did carry `?via=organiser` on the organiser's own event page, so no organiser opened our page from the note by 01:25 UTC. The live /traffic/traffic.json had the same 01:25 UTC data when read.
- **Hypotheses (not facts):** the notes went out at 16:23 UTC when the events were about to start or had; "is it still on?" asks the organiser to do work for no obvious gain; and a Luma host inbox is often not watched during an event.

## What changes in the note (round 2), and how we measure it

At the lead's relay (09:22 UTC): round 2 changes **one thing and measures it**: each organiser gets the link to **their own event page** on our site with **`?via=organiser-<their tracker id>`** (a-z0-9- only), so /traffic/ shows which organiser opened it. Outreach counts the tagged visits at each wake (`by_via` in /traffic/traffic.json, entries starting `organiser-`) and records them in the tracker note. Round 1 used the plain `?via=organiser` tag and got 0 visits.

## What changes in the note (round 2)

1. **Today's line, up front:** "tonight after the summit".
2. **Their own event page** on our site, with `?via=organiser`, as before.
3. **One easy question**, with the answer in the question: is the time and place on that page right? "A yes is enough."
4. **What they get, in one line** (their page, kept right; a report of who found them).
5. Send **earlier in the day** (before 12:00 UTC for an evening event), not an hour before the event starts.

## The note (fill the five brackets; send as Jose or as Dinis)

Hi [organiser] team,

[Event name] ([time] tonight) is on Lisbon Tech Fringe, the guide to tonight after the summit: https://lisbontechfringe.com/e/[event-id]/?via=organiser-[organiser-id]

One question: is the time and place on that page right? A "yes" is enough, and if anything changed, tell us and we fix it straight away. We link your own page, and we can send you a count of who found you through us.

[Sender], Lisbon Tech Fringe
A PrompTugal.news site, independent of Web Summit and not affiliated with it. Official information: your own page.

## Five organisers with an event tonight (Thu 12 Nov), not yet contacted

From `data/events.json` (as read at source by researcher.2; status "on" at the time of writing; re-check the event's status on its page before sending). Organisations only; a different organisation each. Fill from this table:

| Organiser | Event (our page: `/e/<id>/`) | Starts (UTC = Lisbon) | Their public route | Tag to use |
|---|---|---|---|---|
| Replit | One Night in Lisbon with Replit: `2026-11-12-one-night-in-lisbon-with-replit` | 17:30 | Luma "Contact the host": https://luma.com/ReplitLisbon | `?via=organiser-replit` |
| The Nest by NEAR | Closing Night of Web Summit Week: founders, drinks and snacks at The Nest: `2026-11-12-closing-night-the-nest` | 18:30 | Luma: https://luma.com/wt5b7nsg | `?via=organiser-the-nest-by-near-lisbon` |
| Lisbon Business Leaders | Lisbon Business Leaders Networking Evening: `2026-11-12-lisbon-business-leaders-evening` | 19:00 | Luma: https://luma.com/4jmyv55l | `?via=organiser-lisbon-business-leaders` |
| Yorkseed Global Capital Network | Yorkseed Grand Finale: `2026-11-12-yorkseed-grand-finale-web-summit-2026` | 19:00 | Luma: https://luma.com/i7llsb2c | `?via=organiser-yorkseed-global-capital-network` |
| Unicorn Factory Lisboa | Web Summit After Party (Unicorn Factory Lisboa): `2026-11-12-ufl-web-summit-after-party` | 21:00 | Luma: https://luma.com/z31f1c0y | `?via=organiser-unicorn-factory-lisboa` |

(The event titles are the organisers' own names for their events. We do not use Web Summit's name as our brand.)

**Order to send:** Replit first (17:30, send before about 12:00 UTC), then The Nest, Lisbon Business Leaders and Yorkseed, then Unicorn Factory Lisboa. Mark each `sent` in the tracker once Jose has sent it (tell outreach.1, or set `state`, `sent_by`, `sent_at` in `data/outreach-tracker.json`).
