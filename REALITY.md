# What exists

> Kept by conductor.fringe@PrompTugal.dinis (session_01Kw9UwBGQe9BhMCbDw28aDA), 11 November 2026, 11:00 UTC. A thing not listed here does not exist.

## Exists

- **The repository** PrompTugal/PrompTugal__News__Fringe, default branch `dev`, holding:
  - the brief (BRIEF.md, KICKOFF.md, BRIEF-CORRECTIONS.md);
  - the swarm (SWARM.md, JOIN.md, team/roster.json, team/ROSTER.md);
  - this file and CLAUDE.md.
- **The board** `work/`: items 01 to 12. Claimed: 01, 07 and 12 (dev.fringe@), 04 (conductor.fringe@PrompTugal.indi), 02 and 03 (researcher.fringe@). The rest are open.
- **The join page build** (work/12, from dev.fringe@, b5cf5a3): `admin/build/build.mjs` builds `/` and `/join/` into `_site/`, and `.github/workflows/pages.yml` deploys from `dev`. **It does not serve yet:** both Pages runs (43005902882, 43006170870) failed because Pages is not enabled (Dinis).
- **The pipeline** (work/01, dev.fringe@, on dev as 63a4c1a): `.github/workflows/deploy.yml` (replaces pages.yml), the gate `admin/build/validate.mjs` (OK locally), `admin/tools/release.sh`, series 0.1; the build makes `/api/v1/events.json`, `/llms.txt`, `version.json`, sitemap and 404. Events are published only from `data/events.json`, never the seed. The contract is `api/v1/README.md`.
- **Events data** `data/events.json` (work/02, researcher.fringe@, on dev as 787af1f): 50 events, 11 to 14 November, each re-read at its public URL at 10:47 or 10:51 UTC; the home page builds Today and Tomorrow from it (47 cards). Known bug: at phone width long URLs overflow sideways (sent to dev.fringe@).
- **Seed data:** `seed/events-2026-11-11-social-watch.json`, social.watch@'s first pass (21 events). Superseded by data/events.json.
- **Agents** (all Dinis's):
  - **conductor.fringe@PrompTugal.dinis**, the lead: session_01Kw9UwBGQe9BhMCbDw28aDA, since 10:44 UTC, hourly at :44, its key in data/keys.json and in PrompTugal__News__Website board/keys.json (c96f661), signing sha256:cb7afbe3025a6ec1;
  - **dev.fringe@PrompTugal.dinis**: session_01Kw9UwBuse9ub7C5zboJbMs, every two hours at :44, branch work/dev.fringe;
  - **researcher.fringe@PrompTugal.dinis**: session_01Kw9UwDtKvyL1hzQTwazVi3, started 10:46 UTC, hourly at :14, branch work/researcher.fringe;
  - **security.fringe@PrompTugal.dinis**: session_01Kw9UwEM3Xg32ANMHE6SZGS, started 10:46 UTC, every two hours at :29, branch work/security.fringe.
- **Superseded:** conductor.B@ios.PrompTugal.dinis (session_01Kw9UwFFE4yEJ9omnf1asjz) was the lead from about 10:40 to 10:45 UTC; its key is marked superseded. It now builds the Lisbon Fringe iOS app, which will read `/api/v1/events.json` and `communities.json`.

## Does not exist yet

- **The site.** Nothing serves at fringe.promptugal.news or at the github.io address: Pages is off and the DNS is not pointed (Dinis).
- **The storm block** (work/07) is built (/storm.js) but not served. **The rest of the board:** communities, the graph, the submit form, channel drafts, the design.
- **The other people's conductors:** only Indi's has joined (conductor.fringe@PrompTugal.indi, 10:50 UTC, work/04); the other seven are "not started".
