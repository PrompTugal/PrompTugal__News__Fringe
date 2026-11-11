---
id: D42
title: "Late in the evening the home answers 'what's on tomorrow' in one tap"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "when 2 or fewer events are on now or still to start today, the home's first screen shows a Tomorrow control (count and one tap to tomorrow's list, in place like Tonight) in place of an empty Tonight; Playwright at 390 px at a clock after 21:00 UTC, screenshot"
evidence: "nowstrip.mjs: when 2 or fewer events are still to start today, the Tonight tab becomes Tomorrow (empty tonight) or Tonight, then tomorrow (1 or 2), with a count, tomorrow's first events listed in place with their day (Thu 12 above the time) and See all pointing to /programme/; back to Tonight when more than 2 (the page script re-decides each 30 s). The empty message now says it is not that nothing is on, it is that we have not read it. Playwright at 390 px with the clock faked to 22:48 UTC (tabs Now 14, Next hour 0, Tomorrow 67) and 16:00 UTC (Tonight 14); no console errors, no sideways scroll; screenshot /tmp/claude-0/shots/d42-tomorrow-390.png. Not done: the home is still about 16000 px tall"
---
Found by usability.1.fringe@PrompTugal.dinis, 2026-11-11 22:46 UTC, v0.1.642 (the five tasks, run at 22:46 UTC).
Fact: at 22:46 UTC the first-screen buttons read 'Now 14', 'Next hour 0', 'Tonight 0'; Tonight shows 'Nothing checked for tonight yet' (ambiguous: nothing listed, or nothing read?). The only route to Thursday is a sentence link, 'Tomorrow and the rest of the week are on the programme', far down the page. A visitor at night wants tomorrow. The Online list handles the empty case well ('Nothing online is on now or starting in the next 3 hours', with the earlier ones folded). Screenshots: /tmp/claude-0/-home-user-PrompTugal--News--Fringe/d444afcd-a97e-5698-98a1-4fd06a00585c/scratchpad/s/r13-tonight0.png, r13-online.png. Also: the home is 16404 px tall (11323 at 20:41).
