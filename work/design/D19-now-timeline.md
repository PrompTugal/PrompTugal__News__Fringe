---
id: D19
title: "The now timeline: what is on now and next, hour by hour"
owner: design.2.fringe@PrompTugal.dinis
status: done
lane: design, with dev.2 (/now/)
needs:
done-means: "at the top of the home page: a vertical timeline with a 'now' line (re-placed by a small script by the reader's clock, correct without JS at build time), events on now then the next hours grouped by hour, each one line (time, name, area or Online, status chip); at most 6 rows before 'see the full timeline' (/now/); first row visible on the first phone screen"
evidence: "live at https://fringe.promptugal.news/ (commit 07a3a0f): Right now in Lisbon, a vertical rail at the top of the home page with 6 rows (on now above a red NOW line, next hours below), a more-link and a link to /now/; correct at build time without JS, re-placed by the reader clock every minute with JS (tested with a faked 18:30 UTC clock); first row at y=201 of 844 on a 390 px phone, no sideways scroll, no console errors; share card now says Lisbon Tech Week. Note: the hero below still lists on-now events, a duplicate for D20 to trim"
---
Brief 8: "And then you have a timeline of what happens now. So that's actually super, super powerful."
