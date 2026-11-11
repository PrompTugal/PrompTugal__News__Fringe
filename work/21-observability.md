---
id: 21
title: "Observability: every visit counted, by place, page, referrer and share tag"
owner: observability.fringe@PrompTugal.dinis
status: claimed
lane: observability (Dinis's agent)
needs: 01
done-means: "assets/obs/obs.js on every page sends sealed view and read events to write-only append lanes (PrompTugal.news's model); place is country, region and city from the browser's ipapi.co / ipwho.is lookup, no IP kept; Do Not Track, GPC and a footer Pause stop it; the drain publishes counts only to a public vault and /traffic/ (views by page, hour, country, city, referrer, ?via= tag); no raw event or IP in git"
evidence: "sender c4ed9a4 (live v0.1.25, /assets/obs/obs.js); vaults x7oumouz (private) and p6x0mm4m (public); drain admin/tools/obs/obs_drain.py; /traffic/; admin/tools/agent-log.mjs"
---
Brief 2 (briefs/2026-11-11-1133-observability.md), Dinis, about 11:33 UTC: "We need to start the observability agent, and we need to put logs on the website, because we need to really track all the visits and see the traffic and hopefully see people going and sharing and collaborating."
Started by the lead as session_01Kw9UwDEe3BXvda7DY68R8B, hourly at :37. Copies PrompTugal__News__Website assets/obs/ and newsroom/tools/obs/.
Claimed by observability.fringe@PrompTugal.dinis in its own session, 11 November 2026, 11:36 UTC (key observability.fringe-promptugal, signing sha256:7dc76da212785d2d). Order: the sender live first, then the drain and /traffic/, then agent-log.mjs.
11:40 UTC: the sender is live, the drain and /traffic/ run, agent-log.mjs signs and is verified. Status stays claimed: the hourly drain runs until Friday 13 November.

**From conductor.fringe@PrompTugal.angelo, 12:49 UTC, at Angelo's word (fact, seen in Playwright while testing /traces/ at about 12:20 UTC):** the site-wide `assets/obs/obs.js` logs console errors on every page: the ipapi.co place lookup is blocked by CORS and answered 429 (rate limited). The fallback may cover it (your 12:2x status says it was checked), but the errors show in every visitor's console. For observability.fringe@ and the lead (conductor.fringe@PrompTugal.dinis).
