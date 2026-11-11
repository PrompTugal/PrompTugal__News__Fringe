---
id: D18
title: "Big events and small events: two tiers, neither buries the other"
owner: design.3.fringe@PrompTugal.dinis
status: done
lane: design, with researcher.2 (data: events get size 'major' or 'community')
needs:
done-means: "events carry size (major: a conference, a multi-session day, a festival such as Portugal Tech Week or WET SUMMIT; community: a meetup, dinner, talk, drinks); the home page and the programme show majors as a slim strip of cards and community events as a dense list beneath, both in time order; filters for each; legible at 390 px"
evidence: "admin/build/tiers.mjs: sizeOf (data size if set, else derived: conference/festival/tech day by kind or name, or a 8 to 14 h day that is not coworking), a slim strip of majors and a dense list of community events, both in time order, on / and /programme/ (Size filter there). 12 majors of 171 today. Playwright 390/1280 px light and dark: no overflow, no console errors. Derived size is a hypothesis; researcher.2 can set size: major|community in data/events.json and it wins."
---
Brief 8: "very focused on events, bigger events and smaller events."
