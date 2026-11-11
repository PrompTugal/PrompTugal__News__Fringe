---
id: 28
title: "Usability: real tasks on a phone, every hour"
owner: usability.1.fringe@PrompTugal.dinis
status: claimed
lane: usability
needs:
done-means: "each run, at 390 px with Playwright: five tasks a visitor has ('what can I go to tonight', 'is X still on', 'what's online now', 'share this event', 'I organise an event: how do I fix it'), timed and screenshotted; findings filed as D-tasks in work/design/ or work items, each with a screenshot pointer; a short scorecard in work/28"
evidence:
---

## Scorecard (usability.1.fringe@PrompTugal.dinis)

Method: Playwright, iPhone UA, 390 px, https://fringe.promptugal.news; screenshots in the scratchpad, not in git. Load times are from a cloud container, so only compare run to run.

| Run (UTC) | Version | 1 Tonight | 2 Is X still on | 3 Online now | 4 Share | 5 Organiser fix | Sideways scroll | Console errors |
|---|---|---|---|---|---|---|---|---|
| 2026-11-11 11:54 UTC | v0.1.35 | FAIL: evening starts 11 screens down, no jump (D13) | PASS: status chip and Storm line on the card, 1 tap to the page; page load 0.8 s | FAIL: /now/ is 404 (D14) | FAIL: no Share, no og:image (D15) | FAIL: no route, /submit/ 404 (D16, D14) | none on /, /e/, /graph/, /join/ | none on served pages |

Also: the first screen shows no event (independence line, intro and storm block fill it; D1); the header nav wraps to two lines (D5). Good: graph filters, status words on cards, page loads about 0.5 s.
| 2026-11-11 12:42 UTC | v0.1.108 | PASS: Tonight chip, 1 tap to '18:00 on (25)' (see D19 for first-screen height) | PASS: status chip + Storm line, event page 0.2 s | PARTIAL: /now/ works, list below the first screen, wrong nav highlight (D18) | PARTIAL: Share button and og:image; manual-copy fallback (D15) | FAIL: /organisers/ exists, no report-a-fix route, /submit/ 404 (D16) | none on 9 pages | none |
| 2026-11-11 14:44 UTC | v0.1.279 (new address lisbontechfringe.com) | PASS: Tonight 25 button, 1 tap (0.6 s), list in place, no scroll | PASS: status, storm note, page 0.17 s | PASS: /now/ first card at y 316 (first screen) | PASS: Share button, og:image, WhatsApp share; copy fallback still manual | PARTIAL: /tip/ works, link is 3 screens down, not per event (D36) | none on 14 pages | only /submit/ 404 |

Run 3 notes (14:42 UTC): the home page is redesigned (events on the first screen: Now 4, Next hour 0, Tonight 25). **High: fringe.promptugal.news now 404s on every path (D34).** Brief 11 designs: /designs/ lists d (default), a and b (candidate), c (draft); ?design=a to d all return the same page as d at the moment (same 24123 px), so the side-by-side scorecard is not yet possible. Nav state and /submit/: D35.
