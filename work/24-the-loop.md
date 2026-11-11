---
id: 24
title: "The loop: consume every organiser's public feed, on a schedule"
owner: researcher.2.fringe@PrompTugal.dinis
status: claimed
lane: researcher.fringe@
needs: 02
done-means: "sources.md lists every public calendar and events site we read (Luma calendars, events.portugaltechweek.com, Meetup, Eventbrite) with what its terms allow; the researcher re-reads each at least hourly until Friday 13 and records new, changed and cancelled events in data/events.json with read_at; a change shows on /changes/ (work/15)"
evidence:
---
Brief 3, Dinis: "We should be consuming what they have, and again, we can run this thing on a loop."
First case: Portugal Tech Week Palace said in public that today's sessions moved fully online (https://events.portugaltechweek.com/). The lead's sub-agent is checking it at 11:37 UTC.

**First case done (the lead's sub-agent, read 11:39 to 11:41 UTC, fact):** all 11 PTW Palace sessions in the public claim are in data/events.json. 9 show an online location on Luma. Legal Roast and Cisco show an empty location field, and their text still names Palace rooms, so they stay "unknown". Only Wexio and DemoNightLx give the storm as the reason. PTW's own feed (https://events.portugaltechweek.com/events.json, generated 10 Nov 18:13 UTC) still lists today as in person, so it is stale; read the Luma pages, not the feed. Seven more Palace sessions in that feed returned **404 on Luma at 11:40 UTC** (coworking, Fake by Default, GDG Sovereign VC, Portugal to the U.S., Corporate-Startup Partnerships, Tech Art Lisboa, Apify After Hours). They are not added: removed or made private is a hypothesis. Researcher, re-check them at your next wake. Corrections applied by the lead to data/events.json, read_at 11:40 UTC.

**Wake 1, researcher.2.fringe@PrompTugal.dinis, 11:55 UTC (fact):** 61 existing Luma events re-read at source (no time changed; Kuma H2H 2.0 now shows an online Zoom location). The 7 PTW Palace Wednesday sessions are still 404 at 11:54 UTC, along with 16 more Wednesday events from PTW's feed (23 in all); Palace sessions on Thursday and Friday are live. The feed (10 Nov, 18:13 UTC) has 125 Luma links we lacked: 102 live, 94 within 11 to 14 Nov added to data/events.json (164 events). Some feed dates differ from the Luma page (e.g. 3 events are on later dates); the page wins. Hypothesis: the 404s were removed or made private by their hosts.

**Wake 2, researcher.2.fringe@PrompTugal.dinis, 12:20 UTC (fact):** 156 Luma events re-read; Agents Are Ready is now titled 'postponed till tomorrow, 12th Nov' (set moved); 23 Luma 404s unchanged; 4 Luma calendars read, 7 new events added (171). Meetup, Eventbrite, Partiful not yet read.
