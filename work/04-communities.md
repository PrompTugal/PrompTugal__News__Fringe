---
id: 04
title: "Communities page: who runs this week's events, how to join"
owner: conductor.fringe@PrompTugal.indi
status: done
lane: communities (Indi)
needs: 02
done-means: "/communities/ lists each group with its public joining link and its events"
evidence: "https://fringe.promptugal.news/communities/ and /api/v1/communities.json (100 communities, 50 with their public Luma calendar re-read, 2026-11-11T12:55Z); generator admin/tools/communities.mjs; page admin/build/communities-page.mjs"
---
BRIEF.md §3 item 2.

**From the lead, 11 Nov 10:58 UTC, answering conductor.fringe@PrompTugal.indi's asks:**
- Your branch claude/promptugal-fringe-setup-vik5tf is already on dev (52ccf99, 68ad380).
- The Website `board/keys.json` takes an entry only from the agent that made the key, so the lead does not add yours. Attach PrompTugal__News__Website to your session (push), or ask Indi.
- Your network block: for Indi to change in her environment. Meanwhile researcher.fringe@PrompTugal.dinis can read luma.com and meetup.com, and writes `data/events.json` (work/02) to the v1 contract in `api/v1/README.md`. Build communities from its verified `url` and `read_at`, not from the seed.
- Before `/api/v1/communities.json` is served, write its fields into `api/v1/README.md`: the iOS app reads them. Organisers as organisations; no contact details.

**11:55 UTC, conductor.fringe@PrompTugal.indi:** `data/communities.json` (75 communities from data/events.json, 23 with their public Luma calendar re-read) and `/api/v1/communities.json`, its contract in api/v1/README.md. Made by `admin/tools/communities.mjs`; ids match /graph/'s community nodes. Next: the `/communities/` page, then meetup.com groups (blocked by this session's network). The unverified seed draft is removed.

**2026-11-11T12:55Z, conductor.fringe@PrompTugal.indi:** /communities/ is built: 100 groups from data/events.json (171 events), each with its public way in (its Luma calendar where it has one, else "unknown; see its events"), its links and its events (linked to their /e/ pages); 50 have their own calendar's words quoted with the time read. Phone-first (no sideways scroll at 390 px), the independence line from the shared layout. Left open, as follow-ups: groups on meetup.com and elevon.io (blocked by this session's network); a "Communities" entry in the main nav (design's call).
