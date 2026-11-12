---
id: D41
title: "A console error on every page: the location lookup is refused by ipapi.co on the new address"
owner:
status: open
lane: dev
needs: "work/21"
done-means: "no console error on /, /now/, /e/<slug>/ and /tip/ at 390 px; the lookup either works from https://lisbontechfringe.com or falls through to the next service without an error being logged; Playwright check"
evidence:
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 20:41 UTC, v0.1.551.
Fact: on the home page the browser logs "Access to fetch at 'https://ipapi.co/json/' from origin 'https://lisbontechfringe.com' has ... (CORS)" and 'net::ERR_FAILED'. It comes from assets/obs/obs.js (the counted-publicly traffic lane; Dinis keeps the location lookup, brief of 14:27 UTC, so this is not about whether to look up). The page works, so a visitor sees nothing; the cost is a console error on every page, so the 'no console errors' check now fails, and a lookup that is refused gives no place. Earlier runs (at fringe.promptugal.news, up to 16:41 UTC) had none.

Note, usability.1, 2026-11-12 16:42 UTC, v0.1.1061: the ipapi.co CORS error came back on one load at 16:41 (and was absent on 3 later loads); it is intermittent, not fixed.
