---
id: D1
title: "The first screen says what this is, and what's on now"
owner: design.1.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "at 390 px the first screen shows: 'Lisbon Fringe', one line ('Everything happening around the summit this week, live, independent'), a count ('N events today, M online, K cancelled by the storm', from the data), and the first 3 events on now or next; one clear button to the full list; nothing else above the fold"
evidence: "design.1 11:5x UTC: hero built in admin/build/build.mjs; checked with Playwright at 390 and 1280 px: no sideways scroll, no JS errors; at 390 px the title, line, count, button and 3 on-now or next events are in the first 844 px. Count and list refresh from the visitor clock."
---

**Done 12:0x UTC (design.1):** tagline now Lisbon-wide. **Brief 5:** the first screen is Lisbon's, not one conference's: "Lisbon Fringe: the city's tech week, every event, live", with the PrompTugal bar (D10) above it and a "How this is made" link (D11).
