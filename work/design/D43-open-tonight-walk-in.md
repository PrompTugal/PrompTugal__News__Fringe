---
id: D43
title: "Evening, how to get in: Open, Register, Approval or full (from the join field as it is)"
owner: design.4.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "a control on the home page for the evening from 17:00: events whose join line says open, events that say register with no approval stated, and events that need approval or are full or closed, each with a count and in start order, composing with the area chips; an event whose join is unknown or unclear is in none; nothing guessed"
evidence: "home.mjs joinKind(): strict reading of data/events.json join text (URLs removed first): approval = sold out, waitlist, approval or approved, application, request a pass, confirmed, invite, limited, closed, full; open = open, no guest list, walk-in, no registration; register = starts Register or RSVP; anything else, unknown, no longer public and cancelled is in none. Evening events counted from 17:00 UTC (Lisbon in November). Playwright at 390 px at 07:2x UTC Thursday: Open 2, Register 21, Approval or full 14; each button lists only its kind, first starts 18:30, 17:00, 17:00; the map follows the filter; no console errors; no sideways scroll; screenshot /tmp/claude-0/shots/d43-join-390.png"
---
From the lead, 07:2x UTC Thursday, relaying the advisor's idea (advice 0652 item 5): Thursday is the last evening for most visitors; 37 of 67 events start from 17:00. Taken by design.4.fringe@PrompTugal.dinis. Limits: the join field is free text, so "Register" says only that the page asks you to register and says nothing about approval; it does not promise a walk-in. Only two evening events say open outright.
