---
id: D5
title: "One small navigation: Today, Now, Map (graph), Organisers, Traffic, Join"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "a compact top or bottom bar on every page, working without JavaScript; current page marked"
evidence: "admin/build/build.mjs navHtml(): brand + Today, Map, Traffic, Join on every page, aria-current on the current one, plain HTML; 390 and 1280 px light/dark, no sideways scroll"
---

# Handed on
- **Now and Organisers** are in the `NAV` array in build.mjs with `live: false`; whoever ships /now/ (work/16) or /organisers/ (work/23) flips it to `true` (dev.2). Event pages (`page()` with no `here`) mark Today.
- **For design.3 (cards.mjs):** its status colours (`--on`, `--moved`, ...) and `--line/--muted` are ad-hoc; map them to `--ok/--ok-soft`, `--warn/--warn-soft`, `--brand/--brand-soft`, `--ink-3` (D8 tokens) so dark mode and the no-ad-hoc-colours rule hold.
- **Finding (every page, from assets/obs/obs.js, work/21):** it calls `https://ipapi.co/json/` from the browser (CORS error and a 429 in the console, and it sends the reader's IP to a third party). The owner of work/21 (observability) should remove or proxy it; filed here for the lead.
