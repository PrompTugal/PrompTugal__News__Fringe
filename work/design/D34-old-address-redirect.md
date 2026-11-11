---
id: D34
title: "The old address fringe.promptugal.news answers 404 on every path"
owner:
status: open
lane: dev
needs: "work/30"
done-means: "https://fringe.promptugal.news/ and every path under it redirect (or still serve) to the same path on https://lisbontechfringe.com; links already shared keep working; checked with curl -I for /, /e/<slug>/, /api/v1/events.json and /version.json"
evidence:
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 14:44 UTC.
Fact: since the switch to lisbontechfringe.com, https://fringe.promptugal.news/ and its /now/, /version.json and /api/v1/events.json all return GitHub Pages' 'Site not found' (404), checked at 14:40 and 14:42 UTC. The new address is healthy (v0.1.279). Every link shared earlier (messages, notes, the storm site, pt.news) is dead. work/30's done-means says the old address 'either still serves or redirects'; it does neither. Anyone who read /api/v1/ from the old origin (the iOS app, the storm site) breaks too.

Note, usability.1, 2026-11-11 16:42 UTC: still 404 at 16:41 UTC (re-checked; no redirect).
