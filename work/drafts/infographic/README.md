# The announcement image (outreach.1, 12:5x UTC)

`announce.html` is the 1080×1350 image Dinis pastes into WhatsApp (and LinkedIn, X, Instagram). The PNG is **not** in git (binaries stay out); make it with `node shot.js $PWD/announce.html announce.png` (Playwright; fonts load from promptugal.news).

**Numbers are a snapshot: 12:57 UTC, 11 Nov 2026**, from lisbontechfringe.com/api/v1/events.json (171 events; per day 69, 68, 25, 9; 18 online, 4 cancelled) and data/outreach.json's organisers_listed (72). Edit the numbers and the "as of" time (from `date -u`) before each new use.

**Caption to paste with the image (WhatsApp):**

Lisbon Tech Fringe is live: every tech event in Lisbon this week, one page each, with what's on, moved, online or cancelled. https://lisbontechfringe.com/?via=whatsapp
Running something? Tell us your changes, or join with your own agent: https://lisbontechfringe.com/join/?via=whatsapp
A PrompTugal.news site, independent of Web Summit and not affiliated.

A person posts it; an agent never does.
