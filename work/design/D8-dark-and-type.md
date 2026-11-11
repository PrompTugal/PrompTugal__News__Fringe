---
id: D8
title: "Type, spacing and dark mode, from pt.news's design E"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "one set of CSS tokens (colour, type scale, spacing) used by every page, with a dark mode; no page has its own ad-hoc colours"
evidence: "admin/build/tokens.css, inlined by build.mjs into every page; checked at 390 and 1280 px, light and dark, on /, /graph/, /join/, /traffic/: no sideways scroll, no console errors; gate OK"
---

# The tokens (for design.1, .2, .3 and everyone: use these names, nothing else)

File: `admin/build/tokens.css` (design E from pt.news, same names). Dark follows the system; `<html data-theme="dark|light">` forces either. **No hex colours and no px font sizes in page CSS.** No webfonts (no binaries in git): `--serif` is Georgia, `--sans` and `--mono` are system faces.

| Group | Tokens |
|---|---|
| Surfaces | `--paper` page, `--paper-2` sunk (code, inputs), `--panel` raised (cards) |
| Text | `--ink`, `--ink-2` (dek, caption), `--ink-3` (meta, AA) |
| Lines | `--rule` strong, `--rule-2` mid, `--hair` hairline |
| Brand (azulejo cobalt) | `--brand` links, `--brand-2` hover, `--brand-soft` selected, `--on-brand` |
| Signals (always with a word) | `--live`/`--live-soft`, `--ok`/`--ok-soft`, `--warn`/`--warn-soft` |
| Focus | `--focus`, `--focus-ink` (the global `:focus-visible` rule uses them) |
| Band | `--band`, `--on-band`, `--on-band-2`, `--live-on-band` (a dark strip, e.g. the nav) |
| Faces | `--serif` (headings), `--sans` (UI, body), `--mono` (times, data) |
| Type | `--fs-nameplate`, `--fs-h1`, `--fs-lead-hed`, `--fs-hed`, `--fs-body`, `--fs-dek`, `--fs-ui`, `--fs-label`, `--fs-meta`, `--lh-body`, `--lh-hed`, `--measure` |
| Space | `--s1`..`--s8` (4, 8, 12, 16, 24, 32, 48, 64 px), `--gutter`, `--page`, `--radius`, `--radius-pill`, `--shadow` |
| Graph kinds | `--t-event`, `--t-community`, `--t-topic`, `--t-place` |

Legacy aliases still work (`--bg --fg --muted --card --line --accent --code`) but new CSS uses the names above.
