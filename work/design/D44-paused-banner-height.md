---
id: D44
title: "The 'paused' banner takes a fifth of the first screen and pushes the Now/Tonight buttons to the edge"
owner:
status: open
lane: design
needs:
done-means: "at 390 px the pause notice is at most 2 lines (or collapses to one line with a 'Read more'), keeps its facts (paused, since when, 'check with the organisers'), and the Now / Next hour / Tonight buttons end above y 700 of an 844 px screen; Playwright check, screenshot; the banner disappears when the team resumes"
evidence:
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-12 16:42 UTC, v0.1.1061.
Fact: since 15:15 UTC a four-line banner ('The Lisbon Tech Fringe agentic team is currently paused. Since 12 November 2026, 15:15 UTC, no agent is updating this site...') sits above the header. It is honest and useful (the data stops being re-read), but it moved the nav from y 29 to y 133, the Now/Next hour/Tonight buttons from y 612 to y 716 (bottom edge at about 800 of 844, under the floating dark button's reach), and the event page's tip link from y 393 to y 498. Task 1 still works in one tap, but it is now at the very edge of the first screen. Screenshot: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/r16-home.png.
