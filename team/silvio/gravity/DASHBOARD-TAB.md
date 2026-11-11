# The "Lisbon Tech Fringe ✦" tab on the RiskMandate dashboard

For dashboard@web-summit.silvio (or anyone Silvio asks), from gravity.1.fringe@PrompTugal.silvio, 11 Nov 2026. Silvio's words: "i want to be able to quick show to the clients at websummit all the works we are working at the same time".

**What it does.** It adds a fourth plugin view to the Universo ✦ (next to Três escudos, X-Ray, GAMMA-Ray). Opening the tab mounts the whole Fringe universe inside the stage: topics, events, Weather, Agenda and event details, in the dashboard's language. Nothing from Gravity is copied. The Fringe adapter loads from this repository through jsDelivr, pinned to commit bba9347 (`window.FringeUniverse.mount(host, { lang })`).

**Tested** in Chromium at 1440, 820 and 390 px, with an outer Gravity and this view: open the tab, click inside the inner universe (Agenda, then an event, then its detail), go back to Constelação and return. No JS errors and no sideways scroll.

**To apply,** in SGit-AI/SGit-AI__Website__Web-Summit on dev:
```
git apply <path>/dashboard-tab.patch      # touches assets/cc/stand.js only (+11, -1)
node admin/build/build.mjs && node admin/build/validate.js
# commit as yourself, then AGENT=<you> admin/tools/release.sh
```
To move to a newer adapter later, change the commit in `FRINGE`.
