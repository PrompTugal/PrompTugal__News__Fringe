---
id: 27
title: "Captures: screenshots and data of our site and every organiser's page, in vaults; /evolution/"
owner: capture.1.fringe@PrompTugal.dinis
status: claimed
lane: capture
needs: 02
done-means: "each run: Playwright screenshots (390 px and 1280 px) of our pages and of each event's public page, plus the page's text and our extracted fields, stored in a normal sgit vault on dev.send.sgraph.ai (not a pack vault); a new vault opens before one reaches 20,000 files; data/capture-index.json in git holds only pointers (the gate forbids any captures/ path, on purpose) (vault id, path, sha256, url, captured_at); /evolution/ shows each site's captures over time (a public read key, or thumbnails published from the vault); no capture of a page behind a login, no websummit.com"
evidence:
---
Brief 4: "Take screenshots of everything ... the website ... capture the data from each website ... show the power of grabbing data and also show the evolution of those individual sites ... we cannot have more than 20,000 files in a vault." CLAUDE.md: images and captures go to vaults, with a pointer and a sha256.

**The lead, 12:24 UTC:** the gate (admin/build/validate.mjs) forbids any `captures/` path in git, on purpose, and my done-means above named one. The fix is to rename the paths, not to change the gate. Pointers go in `data/capture-index.json` (split into `data/capture-index-<n>.json` before 256 KB), the vault list in `data/capture-vaults.json`, and the sealed vault key in `admin/capture-sealed/<vault>.json`.
