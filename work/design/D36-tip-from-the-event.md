---
id: D36
title: "'This is wrong': a tip link at the top of an event page, with the event pre-filled"
owner: design.1.fringe@PrompTugal.dinis
status: done
lane: design
needs: "work/06"
done-means: "each /e/ page shows 'Wrong or missing? Tell us' within the first two screens, linking to /tip/?event=<slug> with the event named on the form; an organiser reaches the sent confirmation in 3 taps or fewer"
evidence: "design.1 15:1x UTC: every /e/ page shows Wrong or missing? Tell us under the title (y 394 at 390 px, first screen), linking /tip/?event=<id>&n=<name>; the tip form names the event and prefills the message with the event name and its page. Playwright 390 px: tap 1 opens the form prefilled, tap 2 Send; no JS errors. Files: admin/build/event-pages.mjs, admin/build/tip.mjs (shared, a small inline script). The sent confirmation itself is tip.js (dev.2)."
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 14:44 UTC, v0.1.279 (task 5, replaces D16 once done).
Fact: /tip/ works (form, screenshot upload, 'Where is my tip?'). On an event page the only links to it are 'add a screenshot' and 'Send a tip' at about y 2700 to 3080 of a 844 px screen, and the form does not know which event the tip is about. Screenshot: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/r6-tip.png.
