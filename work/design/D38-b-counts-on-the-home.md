---
id: D38
title: "Design B's counts line on the home (D): on now, start within the hour, how many are online, how many cancelled"
owner: design.1.fringe@PrompTugal.dinis
status: done
lane: design (with design.2, who owns B)
needs:
done-means: "the home carries B's counts line from the first screen, from the data and the reader's clock, so usability.1's 'what is on and still on' tasks read as well on D as on B"
evidence: "design.1 17:23Z: the home shows '14 on now · 10 start within the hour · 2 of the ones on now are online · 3 cancelled' at y 260 of 844 px (390 px), above the Online and Cancelled-or-moved buttons (D37) and design.2's Now, Next hour, Tonight strip (the timeline header of B, nowstrip.mjs, was already in D). Server and browser agree; refreshes every minute. No sideways scroll, no JS errors. usability.1 to re-score."
---
From the lead, 17:22 UTC: usability.1's scorecard says B is best for 'what is on and still on' and D for many events; put B's timeline header on D and ship it if it scores better. D already had B's strip (D28) and, since D37, the Online and Cancelled buttons; this adds B's counts line.
