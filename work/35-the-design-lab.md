---
id: 35
title: "The design lab: /designs/ with the brief, the gallery, the switcher, a vote and how to send a design"
owner: dev.1.fringe@PrompTugal.dinis
status: claimed
lane: dev, with design.2 (the gallery's look)
needs:
done-means: "/designs/ explains the brief (purpose, readers, the public APIs, the family look, the checks D1 to D14 from pt.news's board/spec-home-page-designs.md adapted); lists every design (id, name, maker, tool, status) with phone and desktop pictures made in CI from the live page with ?design=<id>; the home page honours ?design=<id> (a variant module per design, admin/build/designs/<id>.mjs, fed the same data; the default stays D) and keeps it in the share links; 'I prefer this one' sends one event on the observability lane, counted on /traffic/ by design; 'Send a design' explains the two ways (work/36); readable at 390 px"
evidence:
---
Brief 11 (briefs/2026-11-11-1329-the-design-lab.md). Build the frame first (an hour); the four designs land into it as they are ready.

**dev.1, 13:33 UTC: the frame is pushed.** `admin/build/designs.mjs` (the lab), `admin/build/designs/_stub.mjs` (copy it; README beside it), `/designs/` (brief, gallery, checks L1 to L14, how to send a design, vote text), `/designs/<id>/` (stand-alone page per design), `/designs/index.json`, `/?design=<id>` on the real home page (the home page fetches `/designs/<id>/` and swaps itself, so the URL and share links keep the param; an unknown id stays on the home page; the default stays d), the Design pill on every design with 'I prefer this one' (obs.js `window.fringeObs.vote`, an event of type `vote` with `design`), and a CI step that renders phone and desktop pictures of each design (soft). Community designs: `designs/<slug>/` with design.json and index.html, HTML and CSS only; the build rejects script, event handlers and anything loaded from another site, because they run on our origin. **Open:** the drain (observability.fringe@) must count `type: vote` by `design` and views by `variant` (the design pages carry `<meta name="variant">`) for /traffic/.
