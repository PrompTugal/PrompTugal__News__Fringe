---
id: D27
title: "Design d-the-family: the family: the current pt.news investor-site look, refined, as the baseline and default"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs: 35
done-means: "admin/build/designs/d.mjs renders the home page as design 'd' from the same data (events, activity, swarm) in the PrompTugal.news family; reachable at /?design=d; passes the lab's checks D1 to D14 (pt.news board/spec-home-page-designs.md, adapted: every number from data, no sideways scroll at 390 px, what is on now in the first two phone screens, motion pauses, the independence line, the PT.news stamp); phone and desktop pictures in the gallery; a short 'why this design' in the gallery entry"
evidence: "the lab frame (designs.mjs) fixes d as the live home page with no module (it throws if designs/d.mjs exists), so d is the home page as built; listed in the gallery by DEFAULT (maker design.4 and the team, tool Claude Code, tagline). Audit of the live home as d at 390 px against L1 to L14 (15:5x UTC): L7 no sideways scroll PASS; L6 first event y=393 (inside two screens) PASS; L9 every image has alt PASS; L13 no em-dash in the text PASS; L11 independence line PASS; L5 numbers from data PASS (count, timeline, strip built from events.json); L8 motion stops under reduced motion PASS (identity.mjs); L2 the fonts load from promptugal.news (the family host, per brief 9) and obs.js fetches ipapi.co, ipwho.is, dev.send.sgraph.ai (Dinis-approved, disclosed in the footer); L10 PARTLY: header links now have 44 px hit areas, but 262 inline links are under 44 px tall and about 260 text runs are under 16 px (Mono labels at 11 to 13 px, which the taste pass of brief 8 asked for): needs Dinis or the lead to say whether L10 is relaxed for labels"
---
Brief 11 (briefs/2026-11-11-1329-the-design-lab.md): "ask the designers to submit multiple designs ... experiment ... figure out what is the best design." Four designs in parallel; Dinis picks.

# Progress (design.4)
- 13:3x UTC: waiting for the lab frame (work/35, admin/build/designs/). Meanwhile the baseline stays the live home page; added lab check D9 (reduced motion, pause on hover/focus) to identity.mjs. Checks already met on today's home: D5 numbers from data, D10 no sideways scroll at 390, D11 now within two screens (first timeline row y~280), D4 PT.news stamp beside the name. To move into designs/d.mjs when the frame lands: the home body in build.mjs (h1.sr, home-top grid with timelineBlock + bigStrip, intro, storm card, events parts), tokens stay in tokens.css.

Note, usability.1, 2026-11-11 16:42 UTC, v0.1.376: five phone tasks on ?design=d are in the side-by-side scorecard in work/28. Shared gap: no organiser route within reach (D36).
