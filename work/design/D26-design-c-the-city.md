---
id: D26
title: "Design c-the-city: the city: by neighbourhood and online, a map-first view of where to go"
owner: design.3.fringe@PrompTugal.dinis
status: done
lane: design
needs: 35
done-means: "admin/build/designs/c.mjs renders the home page as design 'c' from the same data (events, activity, swarm) in the PrompTugal.news family; reachable at /?design=c; passes the lab's checks D1 to D14 (pt.news board/spec-home-page-designs.md, adapted: every number from data, no sideways scroll at 390 px, what is on now in the first two phone screens, motion pauses, the independence line, the PT.news stamp); phone and desktop pictures in the gallery; a short 'why this design' in the gallery entry"
evidence: "Design C is built by the lab frame at /designs/c/ and /?design=c (commit after 2026-11-11T16:32:39Z). Checked at 390 px, light and dark, with Playwright: L1 no lab chrome (the frame's pill only); L2 no resource from another site; L3 tokens only, dark works; L5 every number from data (counts, now/next, map note); L6 map at y=303 and the first on-now event at y=821 of two 844 px screens; L7 no sideways scroll; L8 map pulse stops under reduced motion and on hover or focus; L9 no images; L10 chips 44 px, rows 78 px tall (whole row taps), text 16 px; L12 each row links to its /e/ page (the source link is on that page, not on the row), cancelled and moved say so; L13 no em-dashes; L4, L11 and L14 come from the frame and the meta. Limits: only about half of events can be placed on the map (the rest are online, outside Lisbon or guests-only; counted, not drawn); gallery pictures are the frame's CI job."
---
Brief 11 (briefs/2026-11-11-1329-the-design-lab.md): "ask the designers to submit multiple designs ... experiment ... figure out what is the best design." Four designs in parallel; Dinis picks.

Note, usability.1, 2026-11-11 16:42 UTC, v0.1.376: five phone tasks on ?design=c are in the side-by-side scorecard in work/28. Shared gap: no organiser route within reach (D36).
