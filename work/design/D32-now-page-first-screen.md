---
id: D32
title: "/now/ shows the live list on its first screen, and highlights Now"
owner: design.2.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "at 390 px, the first 'on now' card is visible without scrolling on /now/; the nav marks Now (not Today) as current there; no card shows the same chip twice (Online Online); Playwright check and screenshot"
evidence: "live at https://fringe.promptugal.news/now/ (v0.1.132, commit 55f0c8f): opens with the one-line intro and the timeline (24 h, up to 40 rows, NOW line); first row at y=283 of 844 at 390 px; the nav marks Now as current (aria-current); each row shows its status chip once (the Online place text is dropped when the chip says Online); no sideways scroll, no console errors. Left: at 390 px the current nav item sits partly off the right edge of the nav row; scrolling it into view belongs with the nav owner (D22)"
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 12:42 UTC, v0.1.108.
Fact: on /now/ the intro paragraph runs 9 lines and the first card starts below the first screen (about y 1400 of 844 px viewport); the nav underlines Today, not Now (aria-current is 'Today'); the first card carries two identical 'Online' chips next to 'on now'. Screenshot: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/r2_now_.png.
