---
title: "Brief 13: today in Lisbon, now: what are you looking for, visual, a map, my schedule, organisers as rock stars, a semantic graph"
from: Dinis Cruz (head conductor), feedback on the live site, to conductor.fringe@PrompTugal.dinis
received: 2026-11-11T13:58Z
relayed_by: conductor.fringe@PrompTugal.dinis
to: every agent; the design agents, ontologist.1 (started for it), researcher.2, capture.1, dev.1, dev.2, outreach.1
board: work/42 to 46, work/design/D28 to D32
---
# Brief 13: today in Lisbon, now

## In Dinis's words (trimmed, in order)

> "It's looking pretty good ... really, really cool ... When I arrive at the homepage, at the moment, it feels very geeky ... first of all, you need to really think about what the person wants ... what are you looking for ... it needs to be super visual. All these things have screenshots. We need to make this very visible."

> "We can use local storage ... create the personalized schedule for what they want to go. They should be able to select things they want to do ... thumbs up ... just deselect it."

> "This needs to be very focused on now ... what's happening in the next hour, the next couple of bits, or even tonight. And also really start to have a mapping of what's happening in Lisbon ... you should see the dots on the map ... It needs to be very visual, very Lisbon-y ... very well designed ... look like a big event."

> "The WhatsApps are full of messages ... We need to allow them to come and give the data ... a really good data collection ... asking people to submit the data, give us the intel."

> "This bit here for storms, I think you need to put this on a separate section ... very designed."

> "We need to make a massive semantic graph of all this ... get the ontologist on the case. All of these should be JSON files, should be structured ... you can change all the URLs ... who are you? Are you an investor? Are you a founder? ... not who is the personality ... then personalized views ... everything should be linked to everything ... look at the work on the Storm website and the Newsroom website."

> "For now, focus on today ... Let's not pollute this with tomorrow ... stuck at the summit, now nowhere to go ... where they are in Lisbon, because transportation is not that good at the moment ... this list is too much ... you can't really connect the dots."

> "It's okay now to put on vaults, as long as the vault doesn't have more than 20,000 entries ... take a screenshot ... the gaming and entertainment pitch party on Luma, they have a screenshot there, you should be able to recycle this ... the timings ... where is it ... paid versus free ... create this massive database ... add the graph, so we can actually query using SQL."

> "Make the organizers of these events the rock stars ... the day, then the global events, then the organizers ... the main events ... then the individual sessions ... each of those should have a page ... missing from here is the agentic team section ... 101 organisers ... a lot is noise ... Portugal Tech Week is a whole organizer, so some of this stuff should be inside of it ... Covilhã Tech Day is not in Lisbon ... focus 100% of the website on today, in Lisbon."

## Routing (the lead)

| What | Where | Who |
|---|---|---|
| The home page: "What are you looking for?" (investor, founder, builder, curious; a role, never a person), now / next hour / tonight, a Lisbon map with dots, visual cards with each event's picture, a big-event feel; **today and Lisbon only** | D28 | design.1 (lead), design.3 (map), design.2 (now) |
| My day: pick events (☆ / ✓), a personal timeline kept in the browser (localStorage), shareable as a link | D29 | design.2 |
| The storm as its own designed section, /storm/; one quiet line on the home page | D30 | design.4 |
| The agentic team as a named section in the nav (from /how/, /dashboard/, /abp/, /changes/) | D31 | design.4 |
| The semantic graph: day, festival (umbrella), organiser, event, session, place, persona, all as JSON with stable ids and pages; organisers as the stars; Portugal Tech Week as an umbrella holding its sessions | work/42 | ontologist.1 (new) |
| Query it with SQL in the browser (/data/) | work/43 | dev.1, with ontologist.1 |
| Facts per event: free or paid (and price), neighbourhood, in Lisbon or not (Covilhã is not), today first | work/44 | researcher.2 |
| Event pictures: each event's own cover image from its public page, kept in a vault (a new vault before 20,000 files), public read, cropped to the cover (never a guest list) | work/45 | capture.1 |
| Data collection: "Give us the intel" everywhere (tip box on the home page, WhatsApp-ready share), every tip a listing | work/46 | dev.2, outreach.1 |

## Dinis, a few minutes later (about 14:00 UTC), on the programme page

> "There's a lot of options here that don't have data ... if I go to Beato, there's only two elements there. That's not enough ... start putting this in the map ... connecting the dots ... where can you go now ... everything should be a link ... in the page, you got Meetup, that should be a link there ... everything you register using Meetup, that's a section in itself ... every one of those, you should navigate to it ... take a screenshot, and then we can actually show the screenshot on the website."

**Added routing:**
- **No thin options.** A filter, a neighbourhood or a chip with fewer than 3 events today is folded into "Elsewhere in Lisbon" or hidden; neighbourhoods show on the map instead (design.1, design.3; D28).
- **Everything is a link.** The registration platform (Luma, Meetup, Eventbrite, Partiful, the organiser's own site) becomes an entity in the graph with its own page: "Events you register for on Meetup". So do organiser, umbrella, place, persona and topic (ontologist.1, work/42).
- **Screenshots of each event's page,** shown on the site (capture.1, work/45), within each platform's terms. sources.md says Eventbrite and Partiful forbid automated reading and Meetup is on hold for machines. For those, no automated screenshot: the card links out, and uses the organiser's own image when their own site allows it. Dinis decides whether a person-paced capture is acceptable for them.
