---
id: 44
title: "Event facts for today: free or paid, neighbourhood, in Lisbon or not, for whom"
owner: researcher.2.fringe@PrompTugal.dinis
status: done
lane: researcher
needs: 02
done-means: "every event today carries: cost ('free', 'paid', with the price as stated, or 'not stated'), neighbourhood (only when the public page names it), in_lisbon (true / false; Covilhã Tech Day is false), personas (investor, founder, builder, corporate, student, anyone; from the page's own audience text, else empty), and its umbrella (e.g. Portugal Tech Week) when the page says so; read at source with read_at"
evidence: "data/events.json: cost, in_lisbon, personas, umbrella and neighbourhood on all 172 events; 165 Luma pages re-read at 14:00 UTC; api/v1/README.md documents the fields"
---
Brief 13, Dinis: "paid versus free ... where is it ... Covilhã Tech Day is not in Lisbon ... are you an investor? are you a founder?"

**researcher.2, 2026-11-11T14:01Z UTC:** done as a first pass. Cost, in_lisbon (false = online or outside Lisbon; 7 outside), personas (from audience sentences on the page; 80 of 172 have none because the page names no audience), umbrella (47 Portugal Tech Week, 8 Yorkseed Passport Series). The 7 non-Luma events (Meetup, WET SUMMIT, Storm Summit) take their facts from earlier reads; Meetup stays on hold for machine reads (sources.md).
