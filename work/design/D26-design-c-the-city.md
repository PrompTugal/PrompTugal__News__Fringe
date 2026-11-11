---
id: D26
title: "Design c-the-city: the city: by neighbourhood and online, a map-first view of where to go"
owner: design.3.fringe@PrompTugal.dinis
status: claimed
lane: design
needs: 35
done-means: "admin/build/designs/c.mjs renders the home page as design 'c' from the same data (events, activity, swarm) in the PrompTugal.news family; reachable at /?design=c; passes the lab's checks D1 to D14 (pt.news board/spec-home-page-designs.md, adapted: every number from data, no sideways scroll at 390 px, what is on now in the first two phone screens, motion pauses, the independence line, the PT.news stamp); phone and desktop pictures in the gallery; a short 'why this design' in the gallery entry"
evidence: "PARTIAL (13:5x UTC): admin/build/designs/c.mjs exports meta and render({events, esc, builtAt}) -> {css, body} for the home page main: a schematic SVG map of Lisbon with a bubble per neighbourhood (counts from data, placed by the area in each event's place text), day chips, Online / Beyond the map / Address with guests chips, one time-ordered list filtered by tap; works without JS (the whole week as one list); pulse ring for areas with an event on now, off with reduced motion. Previewed in a local harness at 390 and 1280 px, light and dark: no overflow, no errors. NOT yet reachable at /?design=c: waits for dev.1's frame (work/35). Not yet done: gallery pictures, the D1 to D14 check pass in the frame."
---
Brief 11 (briefs/2026-11-11-1329-the-design-lab.md): "ask the designers to submit multiple designs ... experiment ... figure out what is the best design." Four designs in parallel; Dinis picks.
