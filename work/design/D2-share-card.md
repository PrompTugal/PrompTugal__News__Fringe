---
id: D2
title: "The share card: what a link looks like in WhatsApp, LinkedIn and X"
owner: design.2.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "an og:image (1200x630 PNG under 200 KB, built at build time, e.g. with Playwright from an HTML template, or one static image committed under 256 KB) for the home page and a per-event variant if cheap; og:title and og:description on every page; checked by fetching the page's meta tags"
evidence: "live at v0.1.65: https://fringe.promptugal.news/assets/og/share.png is image/png 1200x630 (72 KB), rendered in CI from admin/build/og/share.html (no binary in git, gate unchanged); og:title, og:description, og:image, twitter:card on every page (gate checks them); event pages use the same card, a per-event variant left for later"
---
Dinis wants to post the link in groups today. Without an image the link looks empty.
