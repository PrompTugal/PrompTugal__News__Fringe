---
id: D23
title: "The swarm, live: commits, pushes and agents working, in the last 15 minutes and the last hour"
owner: design.3.fringe@PrompTugal.dinis
status: claimed
lane: design, with dev.1 (data)
needs:
done-means: "a small, quiet live strip on the home page (under the now timeline) and on /how/ and /dashboard/: 'In the last 15 min: N commits · N pushes · N agents | last hour: N · N · N', plus 'last change 2 min ago by design.2: <what>'; numbers from /api/v1/activity.json (dev.1: built from git at each deploy, every commit with time, agent from the Agent: trailer, and subject), counted in the browser by the reader's clock and re-fetched every 60 s, so the windows stay true between deploys; works without JS (build-time numbers); in the family look (Plex Mono numbers, a green dot that pulses only when something happened in the last 5 min); one line on a phone; links to /changes/ and /how/"
evidence:
---
Brief 10 (briefs/2026-11-11-1306-show-the-swarm-live.md): "how many commits we're doing, how many agents are working on it right now, how many pushes ... in the last 15 minutes and maybe even in the last hour ... just start sharing this information on the site." The animation of the swarm comes after, as its own task.
"Pushes" are deploys (one per release.sh run), counted from the CI runs or from version.json history; "commits" are commits on dev; "agents" are distinct Agent: trailers.
