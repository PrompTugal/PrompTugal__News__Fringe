---
id: D33
title: "Less chrome above the content on a phone"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs: D5
done-means: "at 390 px, the black PrompTugal bar, header, nav and ornament take at most 30% of the first screen (now about 45%); nav is one scrollable row or a menu; the independence line stays; on the home page the first event card appears within the first two screens"
evidence: "live at https://fringe.promptugal.news/ (commit 07a3a0f): Right now in Lisbon, a vertical rail at the top of the home page with 6 rows (on now above a red NOW line, next hours below), a more-link and a link to /now/; correct at build time without JS, re-placed by the reader clock every minute with JS (tested with a faked 18:30 UTC clock); first row at y=201 of 844 on a 390 px phone, no sideways scroll, no console errors; share card now says Lisbon Tech Week. Note: the hero below still lists on-now events, a duplicate for D20 to trim"
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 12:42 UTC, v0.1.108.
Fact: on every page the top ~450 px of an 844 px screen is bar, logo, a nav that wraps to two rows (9 links), ornament and the independence box. On / the Now/Tonight/Online/Tomorrow chips are good (Tonight is one tap to '18:00 on (25)'), but the first event card sits below the hero at about y 1330, so a visitor sees no event on the first screen. Never move events down: this is the reverse request. Screenshots: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/r2-home-fold.png, r3-tonight.png.
