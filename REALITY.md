# What exists

> Kept by conductor.fringe@PrompTugal.dinis (session_01Kw9UwCFpT9ihNBcQFxkomq), 11 November 2026, 12:24 UTC. A thing not listed here does not exist.

## Exists

- **The repository** PrompTugal/PrompTugal__News__Fringe, default branch `dev`, holding:
  - the brief (BRIEF.md, KICKOFF.md, BRIEF-CORRECTIONS.md);
  - the swarm (SWARM.md, JOIN.md, team/roster.json, team/ROSTER.md);
  - this file and CLAUDE.md.
- **The site.** https://fringe.promptugal.news serves (fact, read 11:18 UTC): `/` and `/join/` answer 200, `/version.json` says v0.1.14 at commit a1f6b3d, `/api/v1/events.json` holds 69 events, and the home page carries the independence line. Deploy runs 12 to 14 succeeded.
- **The board** `work/`: items 01 to 13. Done: 02 (researcher.fringe@). Claimed: 01, 07 and 12 (dev.fringe@), 04 (conductor.fringe@PrompTugal.indi), 03 (researcher.fringe@), 13 (conductor.fringe@PrompTugal.vicky). The rest are open.
- **The join page build** (work/12, from dev.fringe@, b5cf5a3): `admin/build/build.mjs` builds `/` and `/join/` into `_site/`, and `.github/workflows/pages.yml` deploys from `dev`.
- **The pipeline** (work/01, dev.fringe@, on dev as 63a4c1a): `.github/workflows/deploy.yml` (replaces pages.yml), the gate `admin/build/validate.mjs` (OK locally), `admin/tools/release.sh`, series 0.1; the build makes `/api/v1/events.json`, `/llms.txt`, `version.json`, sitemap and 404. Events are published only from `data/events.json`, never the seed. The contract is `api/v1/README.md`.
- **Events data** `data/events.json` (work/02, researcher.fringe@, on dev as 787af1f): 69 events, 11 to 14 November, each re-read at its public URL between 10:47 and 10:57 UTC; the home page builds Today and Tomorrow from it. Phone width checked at 390 px: no sideways scroll.
- **Seed data:** `seed/events-2026-11-11-social-watch.json`, social.watch@'s first pass (21 events). Superseded by data/events.json.
- **Agents** (all Dinis's):
  - **conductor.fringe@PrompTugal.dinis**, the lead: session_01Kw9UwCFpT9ihNBcQFxkomq, since 11:14 UTC at Dinis's word (BRIEF-CORRECTIONS.md), its key in data/keys.json (signing sha256:d3c9e8a33293ef55), not yet in PrompTugal__News__Website board/keys.json;
  - **dev.fringe@PrompTugal.dinis**: session_01Kw9UwBuse9ub7C5zboJbMs, every two hours at :44, branch work/dev.fringe;
  - **researcher.fringe@PrompTugal.dinis**: session_01Kw9UwDtKvyL1hzQTwazVi3, started 10:46 UTC, hourly at :14, branch work/researcher.fringe;
  - **security.fringe@PrompTugal.dinis**: session_01Kw9UwEM3Xg32ANMHE6SZGS, started 10:46 UTC, every two hours at :29, branch work/security.fringe. Its first review is on dev: `security/reviews/2026-11-11-1048.md`.
- **Superseded:** session_01Kw9UwBGQe9BhMCbDw28aDA was the lead from 10:44 to 11:14 UTC; its key is marked superseded. Whether it still runs is unknown. Before it, conductor.B@ios.PrompTugal.dinis (session_01Kw9UwFFE4yEJ9omnf1asjz) was the lead from about 10:40 to 10:45 UTC; its key is marked superseded too. It now builds the Lisbon Fringe iOS app, which will read `/api/v1/events.json` and `communities.json`.

- **The swarm at full throttle** (brief 4, 11:56 UTC): 11 agents on the lead's account (team/ROSTER.md): fable (advisor), observability, design.1 to design.4, dev.1, dev.2, researcher.2, capture.1, usability.1. ROLES.md starts more on any account.
- **Event pages:** 70, at /e/<id>/ (work/22, 0fd5052), in the sitemap.
- **Inboxes:** 7 vaults (work/19), admin/tools/inboxes.py.
- **OpenRouter key:** a network secret on the lead's environment (the proxy adds it).

- **The control centre:** https://fringe.promptugal.news/dashboard/ (work/25, dev.1), five sections with health colours; /api/v1/swarm.json; /me/ (work/26) makes Dinis's key in his browser (not yet made by him).
- **Traffic:** counted since work/21 (13 reader views, 2 countries, by 12:07 UTC); /traffic/; drained every 15 minutes inside observability's hourly wake.
- **Pages:** /now/, /organisers/ (offer marked draft), /changes/, /how/, /graph/, /e/<id>/ (164 events).
- **The OpenRouter account is out of credit** (12:08 UTC): the router (admin/tools/llm.mjs) exists but every call returns 402.

## Does not exist yet

- **The storm block on the live site** (work/07): built (`/storm.js`); not checked on the served page by this session. **The rest of the board:** communities, the graph, the submit form, channel drafts, the design.
- **Six people's conductors:** Indi's (10:50 UTC, work/04) and Vicky's (11:05 UTC, work/13) have joined; Angelo, Silvio, Jose, Nimay, Daniela and Sarah are "not started".
- **conductor.C.fringe@PrompTugal.dinis** in this repository: Dinis says it runs on another Claude account; it has no status, key or commit here.
- **Keys in PrompTugal__News__Website board/keys.json** for the current lead, Indi's and Vicky's conductors and security.fringe@.
