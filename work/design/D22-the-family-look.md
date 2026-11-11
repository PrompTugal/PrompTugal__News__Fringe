---
id: D22
title: "The family look: pt.news's investor site applied to the events"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs: D21
done-means: "the tokens are brand v2.0 (paper #f6f3ec, ink #121317, red #c52830, green #006600, cobalt #1f4fa8, hairline #d9d2c1; dark: #f07278, #6dbb7e); Newsreader headings, IBM Plex Sans body, IBM Plex Mono times and sources, linked from https://promptugal.news/assets/fonts/ (CORS is open; no font in git); thin green rules and numbered kickers as on https://promptugal.news/investors/; D20's sizes (wordmark at most 28 px on a phone, body 16 px, the first event on the first phone screen); one quiet Lisbon accent at most; before and after at 390 px and 1280 px in the status; Dinis would share it"
evidence: "brand v2.0 tokens and fonts linked from promptugal.news (05dd532), numbered kickers, green rules, D20 sizes, PT.news stamp and Tech Fringe wordmark (D21), timeline and cards in the family look; dark pass 15:3x UTC on / at 390 px (screenshot /tmp/claude-0/shots/d22-dark-home.png): legible, tokens only, no sideways scroll; before and after 390 and 1280 in earlier screenshots d22-before-390, d22-after-390, d22-after-1280"
---
Brief 9 (briefs/2026-11-11-1249-lisbon-tech-fringe.md): "I really like how they came out, the design, the look and feel ... It just needs to look a bit better. At the moment, it looks quite amateur." Folds in D20, the taste pass. Read PrompTugal__News__Website board/team/investors/decks/deck.css and design/brand/README.txt (attach it read-only).

# First push (design.4, tokens and type)
- tokens.css is brand v2.0: red #c52830, green #006600, cobalt #1f4fa8 (links), hairline, dark #f07278 / #6dbb7e; fonts linked from promptugal.news (Newsreader, IBM Plex Sans, IBM Plex Mono; no font in git; swap, so Georgia shows first).
- identity.mjs: wordmark "Lisbon Tech *Fringe*" (italic green, as ".news" sits in PrompTugal.news), green 2px rule under the header, one azulejo hairline (6px, quiet), numbered green Mono kickers on every h2 ("01"), Mono for times, sources, the PT bar and chips, thin top rule on cards, no yellow band. Tram yellow is gone from the page (token kept, unused).
- Still open for D22: the PT.news stamp and favicon in the header (design.1, D21), the ptbar and og text still say Tech Week (D21), cards and timeline polish in the new look (design.3 and design.2 now unblocked), dark-mode pass.
- Screenshots (scratchpad, not in git): /tmp/claude-0/shots/d22-before-390.png, d22-after-390.png, d22-after-1280.png.
