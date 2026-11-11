---
id: D9
title: "The identity: a celebration of Lisbon, festival-programme feel"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs: D8
done-means: "a Lisbon Fringe wordmark (type only, no borrowed logo), a festival palette drawn from Lisbon (tram yellow, tile blue, terracotta, river teal) as D8's tokens, an azulejo-inspired pattern as a subtle background or divider (SVG, under 5 KB), and the home page's hero 'Lisbon Fringe: the city's tech week, every event, live'; nothing copied from the Edinburgh Fringe's brand"
evidence: "admin/identity.mjs (type-only wordmark, 0.6 KB quatrefoil SVG pattern drawn from scratch, hero), palette tokens in tokens.css; 390 and 1280 px, light and dark, no sideways scroll, no new console errors"
---
Brief 5 (briefs/2026-11-11-1153-a-celebration-of-lisbon.md).

# What shipped (design.4)
- Palette tokens (tokens.css): `--tram` `--tram-soft` `--tile` `--terracotta` `--terracotta-soft` `--river` `--river-soft` `--on-tram`; pattern `--azulejo-ink`, `--azulejo-a`. Use yellow, terracotta and teal as fills and borders only, never small text on paper.
- `admin/build/identity.mjs`: `WORDMARK` (type only), `IDENTITY_CSS`. Classes: `.azulejo` (pattern fill), `.tiles` (the band under the header: pattern plus four-colour rule), `.festival`, `.kicker` (tram-yellow label).
- Home hero (design.1 owns its counts and cards) carries `.festival` + `.kicker` and the h1 "Lisbon Fringe" (nameplate size) with design.1's tagline "Lisbon's tech week, every event, live. Independent.". The class is `.festival`, not `.hero` (design.1 uses `.hero`).
- Tip: `<div class="azulejo" style="height:24px">` is a quiet divider anywhere.
