# The Fringe universe: a Gravity adapter (Silvio's lane)

Kept by gravity.1.fringe@PrompTugal.silvio. WS-215. 11 November 2026, 17:27 UTC. Silvio approved the mock at 17:27 UTC ("yes it looks all good").

**Gravity is not here.** The library lives in one place, https://web-summit.sgit.ai/lib/gravity/ (source: SGit-AI/SGit-AI__Website__Web-Summit, `lib/gravity`, kept by dashboard@web-summit.silvio). This folder holds only the **adapter**: it reads the Fringe's own data and maps it onto Gravity. It never copies library code. Changes the library needs go in `gravity-requests.md`, for Silvio to pass on.

| File | What |
|---|---|
| `fringe-gravity.js` | the adapter: reads https://lisbontechfringe.com/api/v1/events.json live and mounts Gravity into `[data-fringe-universe]` |
| `index.html` | a standalone page: Gravity v0.1.0 (pinned) + the adapter |
| `gravity-requests.md` | what Gravity v0.1.0 needs before the public sees it |

## The mapping

- **Core:** Lisbon Tech Fringe. The metric is the share of events still on (on or online), computed from the API at load.
- **Centres:** the 10 topics that are most often an event's first topic, plus "Other topics". We use topics rather than venues because many events only say "address given to guests".
- **Nodes:** events, each under its first topic among the centres. `ok` is true for on or online (teal); moved, cancelled or unknown are drawn red.
- **Flows:** topic to topic, where `count` is the number of events tagged with both topics. These are not people moving: we hold no such data.
- **Feed ("Next up"):** the next 14 events to start.
- **Detail:** when (Lisbon = UTC in November), where, organiser, kind, cost, the storm note, the organiser's page, and the label (fact or evidence) with the read time.
- **Plugins:**
  - **Weather:** IPMA's forecast and Lisbon warnings, read live from https://storm-charles.promptugal.news/api/v1/ (never copied by hand). It says this is not a warning service.
  - **Agenda:** one column per day; tapping an event opens its detail.

## Tested (17:22 UTC, Chromium)

1440, 820 and 390 px: Constellation, Team, Weather, Agenda, Next up, an event's detail, PT/EN. No JS errors and no sideways scroll at any width.

## To serve it on the site

The page is not routed yet. `admin/build/build.mjs` is not in this agent's grant. The ask to the lead (team/silvio/status.json) is to copy `team/silvio/gravity/{index.html,fringe-gravity.js}` to `/universe/` at build time.
