---
title: "Brief 9: the name is Lisbon Tech Fringe (lisbontechfringe.com); the look of pt.news's investor site; the PrompTugal.news family"
from: Dinis Cruz (head conductor), to conductor.fringe@PrompTugal.dinis
received: 2026-11-11T12:49Z
relayed_by: conductor.fringe@PrompTugal.dinis
to: every agent, the design agents first
supersedes: brief 8's name ("Lisbon Tech Week"); the rest of brief 8 stands
board: D21 (renamed), D22, work/30
---
# Brief 9: Lisbon Tech Fringe

## In Dinis's words

> "I just bought **lisbontechfringe.com** ... relay that to the team, specially the design."

> "Try to figure out what we did with the design team for the investors deck on PrompTugal.news ... because I really like how they came out, the design, the look and feel ... We should be having something like that ... a nice Lisbon-y kind of website ... very well designed, very well focused, and very well good from the outreach."

> "Do this in bits ... The first things to do is actually also make sure we reuse the logo from PrompTugal.news ... This is part of that website, it's part of that family ... but we now need a new identity for **Lisbon Tech Fringe**, but it's part of that group."

> "Push something that I can start to share, because this is already quite useful the way it is. It just needs to look a bit better. At the moment, it looks quite amateur."

## What "the investor deck look" is (the lead found it, 12:49 UTC)

PrompTugal.news's investor site, https://promptugal.news/investors/, and its decks (PrompTugal__News__Website `board/team/investors/decks/deck.css`, `design/brand/README.txt`, `board/spec-investor-decks-brand.md`). Brand v2.0:
- **Paper and ink:** paper `#f6f3ec`, paper-2 `#ece7db`, panel `#fffdf8`, ink `#121317`, ink-2 `#3f424a`, hairline `#d9d2c1`. The name's red `#c52830` and green `#006600` (on dark: `#f07278`, `#6dbb7e`), plus cobalt `#1f4fa8`.
- **Type:** Newsreader for headings, with italic for the suffix; IBM Plex Sans for the interface; IBM Plex Mono for metadata (times, sources, versions). pt.news serves the fonts with CORS (`https://promptugal.news/assets/fonts/newsreader-variable.woff2`, `plex-sans-variable.woff2`, `plex-mono-400.woff2`), so link them there. Never commit a font: the gate forbids binaries.
- **The feel:** thin green rules, numbered kickers ("01 · Now"), generous margins, restraint, editorial calm, and no loud colour blocks.
- **The logo:** the outlined SVGs in PrompTugal__News__Website `assets/brand/`: `pt-news-stamp-light.svg` and `-dark.svg` (the PT.news stamp, minimum 96 px), `promptugal-wordmark-light.svg` and `-dark.svg` (minimum 240 px), and `favicon.svg`. SVG is text, so copy them into `assets/brand/` here.

## What it means (the lead's reading)

1. **The name is Lisbon Tech Fringe** everywhere (it replaces brief 8's "Lisbon Tech Week"). Its wordmark is set in the brand's way: "Lisbon Tech" in Newsreader 600 ink, "Fringe" in Newsreader italic in the brand's green (or red; design.4 decides), the way ".news" sits in PrompTugal.news.
2. **Part of the PrompTugal.news family:** the PT.news stamp sits in the header beside the wordmark, linking https://promptugal.news, with "a PrompTugal.news site" in small Plex Mono. The favicon is a variant of the PT favicon.
3. **The investor-site look**, applied to the events: paper, ink, rules, Newsreader headings, Plex body, Mono times. "Lisbon-y" comes through restraint: one azulejo hairline, the tram yellow as a single accent at most. Never loud.
4. **In bits, shipped now:** first the name, logo and header (one push), then the tokens and type (one push), then the cards and timeline in the new look. Each push must be shareable.
5. **The domain lisbontechfringe.com** becomes the site's address once its DNS points here (work/30). Until then it stays fringe.promptugal.news.

## Routing

| Task | Who | First push |
|---|---|---|
| D21: rename to **Lisbon Tech Fringe**, PT.news stamp in the header, favicon | design.1 | within 30 min |
| D22: the pt.news investor-site look: tokens, fonts linked from promptugal.news, rules and kickers; the taste pass (D20) folds in | design.4 | within 45 min |
| D2 again: the share card in the new name and look | design.2 | after D21 |
| D18, D19 restyled in the new look | design.3, design.2 | after D22 |
| work/30: lisbontechfringe.com, everything ready on our side; DNS and the Pages setting are Dinis's | dev.1 | now |
