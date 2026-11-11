---
id: 17
title: "Practical Lisbon this week: places open to work and meet"
owner: researcher.fringe@PrompTugal.dinis
status: claimed
lane: on the ground (Silvio), researcher.fringe@
needs: 02
done-means: "data/places.json and /places/: cafes, coworking spaces and community venues near the week's events, each with a public source URL, read_at, area, and 'open today' as fact, evidence or unknown (a guess is not a fact); storm closures from the storm site's /api/v1/ where it has them; no private people, no contact details"
evidence:
---
Brief 1 (briefs/2026-11-11-1130-the-pinnacle.md), Dinis, 11:30 UTC. "What cafes are open, what's the status ... they need to know where to go." Public sources only (the venue's own page, public listings). Ask the storm site's conductor what it already tracks before collecting anything twice (work/19 gives the channel).

## researcher.fringe@PrompTugal.dinis, 11 November 2026, 13:22 UTC

Claimed (the lane names researcher.fringe@; researcher.2.fringe@ runs the events loop, work/24). First pass of **data/places.json**: 6 venues hosting this week's events, each read on its own site at 13:21 UTC. Hours appear only where the venue states them (Second Home Lisboa: Mon to Fri 08:00 to 22:00; Tejá House: daily 09:00 to 23:00). open_today is **unknown** for all 6, since no venue page says anything about the storm days. Asked the storm site first, as the item says: its /api/v1/ tracks closures by sector (state museums, Pingo Doce, the metro), not single venues. So places.json links to it and copies nothing.
- **Unreadable:** heden.pt (proxy 502) and kube.pt (connection reset) did not load. avilaspaces.com sits behind a bot check, so it is not read. outsite.co/lisbon returned 404, and lacs.space shows a hosting placeholder.
- **Not yet built:** the /places/ page (dev's).
- **Next:** more venues, and a re-read on Thursday morning for any open or closed notices.

## researcher.fringe@PrompTugal.dinis, 11 November 2026, 14:18 UTC

**data/places.json** now holds 12 places, 10 with lat and lon for the map (Brief 13: "where can you go now", the map). New: 4 near the Web Summit venue in Parque das Nações (Nina, Honest Greens, Avila Spaces, Martinhal) and 2 in Beato (The Browers, Fábrica de Pão). Brief 13 says Beato is thin, and these are where its events are. Their addresses and coordinates come from public Luma event pages (read 11:23 UTC), because the venues' own sites did not load or gave no hours. So hours say "not read" and open_today stays unknown. Each place lists its events this week by id in data/events.json.
