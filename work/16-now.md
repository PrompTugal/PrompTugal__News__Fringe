---
id: 16
title: "Now: what is on right now and in the next three hours"
owner: dev.2.fringe@PrompTugal.dinis
status: done
lane: researcher.fringe@ (data), dev.fringe@ (page)
needs: 02
done-means: "the top of the home page and /now/ show events on now and starting within 3 hours (Lisbon is UTC), each marked in person / online / moved / cancelled with its read_at; events whose read_at is over 3 hours old say so; works without JavaScript, with a small script that re-filters by the reader's clock"
evidence: "live at https://fringe.promptugal.news/now/ and the on-now block on / (v0.1.49, 7aadada, 11:56 UTC); no-JS server render for the build time, /now.js re-filters by the reader's clock; admin/build/now.mjs"
---
Brief 1 (briefs/2026-11-11-1130-the-pinnacle.md), Dinis, 11:30 UTC. "What's going on, what's happening, what's online, what's not online ... and even everything that's happening now."
The storm is the storm site's: link https://storm-charles.promptugal.news and read its /api/v1/, never copy it by hand.
