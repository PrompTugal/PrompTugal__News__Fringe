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

## Side-by-side: the four designs at 390 px (brief 11), 2026-11-11 16:42 UTC, v0.1.376

Method: Playwright, iPhone UA, 390 x 844, https://lisbontechfringe.com/?design=<id>; the designs switch in the browser (the served HTML is the same). 'Screens' are y / 844. Cloud load times (a 1.5 s, b 1.6 s, c 1.5 s, d 2.0 s) differ little. No sideways scroll and no console errors on any. Screenshots (scratchpad, not in git): s/r7-a.png, r7-b.png, r7-c.png, r7-d.png.

| Task | a: The programme (D24) | b: The timeline (D25) | c: The city (D26) | d: The family (D27, default) |
|---|---|---|---|---|
| Page height | 5577 px | 15032 px | 10949 px | 22670 px |
| An event on the first screen | No (heatmap and day tabs; first row at 1.8 screens) | Almost: clock, counts, three buttons, first card at the fold | No (map first; list at 2.3 screens) | **Yes** (rows at 0.5 screen) |
| 1 Tonight | PARTIAL: no Tonight control; hour-ordered list with 'Earlier today' folded away; evening is further down | **PASS**: TONIGHT button on the first screen, 1 tap to the 18:00 start | FAIL: no Tonight control, no evening view | **PASS**: 'Tonight 26' button, 1 tap, list changes in place, no scroll |
| 2 Is X still on | PARTIAL: first 'Cancelled' at 2.3 screens | **PASS**: header says '3 cancelled'; card at 3.6 screens | PARTIAL: first 'Cancelled' at 1.8 screens | WEAK: first 'Cancelled' at 5.8 screens |
| 3 What's online now | PARTIAL: Online badge at 0.8 screen, no filter | PARTIAL: header says '3 of the ones on now are online'; badge at 1.4 screens | PARTIAL: 'Online 21' chip on the first screen, but tapping it shows nothing without scrolling | FAIL: no online control; first Online badge at 18.7 screens |
| 4 Share | PASS (event page, 2 taps) | PASS (2 taps) | PASS (2 taps) | PASS (2 taps) |
| 5 Organiser fix (/tip/ link) | FAIL: 6.4 screens down | FAIL: 17.6 screens | FAIL: 12.8 screens | FAIL: 25.5 screens |

Reading: b is the best at 'what is on and is it still on' (a live clock, counts of on now, online and cancelled, three buttons). d is the best at 'show me events at once' and has the working Tonight button, but is 22670 px long, with no online control and the weakest cancelled signal. a is the shortest page and the best overview of the week (the heatmap), but it hides the events the visitor wants behind the grid. c is the best at 'where', and weakest at 'when'. None puts the organiser route within reach; all four need the same fix (D36). A merge worth considering: b's header and buttons on top of d's list.
| 2026-11-11 18:42 UTC | v0.1.459 | PASS: Tonight 17, 1 tap, in place, no scroll | PASS: 'Cancelled or moved 5' tab on the first screen, 1 tap, list at 1.4 screens; counts line says '3 cancelled' | PARTIAL: 'Online today 22' on the first screen, but lands on all day's events incl. past ones (D39); counts differ (D40) | PASS: Share button | PASS: tip link at the top of each event page, event pre-filled | none | none |

Run 5 notes (2026-11-11 18:42 UTC): page height of the home is 9663 px (was 22670 at 16:41); design agents acted on the 16:41 scorecard (D37, D38). The old address still 404s (D34).
| 2026-11-11 20:41 UTC | v0.1.551 | PASS: Tonight 4, 1 tap, in place | PASS: 'Cancelled or moved 5', 1 tap, list at 1.4 screens | PASS: Online today 22, 1 tap, list starts with on now/next (D39 fixed) | PASS | PASS: tip link at the top of the event page, pre-filled | none | 1 on every page: ipapi.co CORS (D41) |

Run 6 notes (2026-11-11 20:41 UTC): all five tasks pass on the live home at 390 px. D39 and D40 verified fixed. Home page 11323 px (9663 at 18:41). Old address still 404 (D34). New: D41.
| 2026-11-11 22:46 UTC | v0.1.642 | PASS (empty state): Tonight 0 says 'Nothing checked for tonight yet' (wording, D42); no Tomorrow control | PASS: 'Cancelled or moved 5', 1 tap | PASS: Online list says nothing is on now/next, earlier ones folded | PASS | PASS | none | none (D41 gone) |

Run 7 notes (2026-11-11 22:46 UTC): the D41 console error is gone (no console errors on /, /e/). Home page 16404 px. Old address still 404 (D34, 11 hours). New: D42 (tomorrow, at night).
| 2026-11-12 00:41 UTC | v0.1.718 | PASS: the home rolled to Thursday after midnight; 'Tonight 27' (Thursday 18:00 on), 1 tap, in place | PASS: 'Cancelled or moved 3', 1 tap | PASS (no control, correct): no online events on Thursday in the data, so the Online control is hidden and the counts say '0 online' | PASS | PASS | none | none |

Run 8 notes (2026-11-12 00:41 UTC, after midnight): the home handles the date change; Wednesday events running past midnight show as 'Wed 11 ... until Thu 12 02:00'. Home 6029 px. D42 (a Tomorrow control late in the evening) is still open. Old address still 404 (D34, 13 hours).
