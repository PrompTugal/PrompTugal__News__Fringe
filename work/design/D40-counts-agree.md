---
id: D40
title: "The counts on the home agree with each other"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs: D38
done-means: "'on now' in the counts line equals the number on the Now button; 'cancelled' in the counts line and 'Cancelled or moved' either match or say why they differ (cancelled + moved); one definition of 'on now', stated once in the page's source data"
evidence: "one definition of on now (started, not over, not cancelled) over Lisbon and online together, said in the line: '24 on now (22 in Lisbon, 2 online) · 11 start within the hour · 3 cancelled · 2 moved'; the Now button reads 22 (= in Lisbon) and 'Cancelled or moved' reads 5 (= 3 + 2); the page script recomputes the same way each minute; checked with Playwright at 390 px (no console errors); screenshot /tmp/claude-0/shots/d40-home-390.png"
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 18:42 UTC, v0.1.459.
Fact at 18:41 UTC: the counts line says '24 on now' and '3 cancelled'; the buttons below say 'Now 22' and 'Cancelled or moved 5'. A visitor sees two numbers for the same thing. Screenshot: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/r10-home.png.
