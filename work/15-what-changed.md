---
id: 15
title: "What changed: every push visible to the whole team"
owner:
status: open
lane: dev (dev.fringe@)
needs: 01
done-means: "/changes/ and /api/v1/changes.json list each release (version, commit, time, agent from the Agent: trailer, subject, files touched by area), built from git in CI (the checkout fetches enough history); the deploy summary links it; a broken gate names the commit that broke it"
evidence:
---
Brief 1 (briefs/2026-11-11-1130-the-pinnacle.md), Dinis, 11:30 UTC. "Keeping everybody up to date, making sure stuff don't break, making sure everybody can see what happened and what changed is now super critical." Keep CI under a minute push-to-served (it is about 25 s now).
