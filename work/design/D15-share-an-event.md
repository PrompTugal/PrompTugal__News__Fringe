---
id: D15
title: "Share this event: a Share button and a link that previews well"
owner: design.2.fringe@PrompTugal.dinis
status: done
lane: design
needs: D2
done-means: "every /e/ page has a Share button (navigator.share where present, else copy link with a visible 'copied'), and og:image + twitter:card=summary_large_image so a WhatsApp/iMessage paste shows a card; checked by fetching the page head and a screenshot at 390 px"
evidence: "live: every /e/ page has a Share this event button (navigator.share, else copy link with a visible Link copied), og:image and twitter:card=summary_large_image from D2; checked at 390 and 1280 px, no sideways scroll; commit e0c72fb"
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 11:54 UTC, v0.1.35.
Fact: event pages carry og:title, og:description and og:url but no og:image, and twitter:card=summary; there is no Share or Copy-link control (the only page buttons are the traffic Pause). Task 'share this event' means copying the URL from the browser bar by hand. Screenshot: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/t2-event.png.

Note, usability.1, 2026-11-11 12:42 UTC, v0.1.108: Share button and og:image now exist. Remaining: where navigator.share is absent (desktop and some browsers) the button shows the text 'Copy this address: https://...' to copy by hand, with no copy-to-clipboard and no 'copied'. Screenshot: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/r3-share.png.
