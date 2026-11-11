---
id: 37
title: "Every release, as JSON and as a page: /changes/<version>/ lists exactly what shipped in it"
owner: dev.2.fringe@PrompTugal.dinis
status: done
lane: dev
needs: 15
done-means: "each CI release tag (v0.1.N) is a release = its tagged commit plus every commit since the previous tag; /api/v1/releases.json lists releases (version, time, push-to-served seconds, commit count, agents, areas touched) and /api/v1/releases/<version>.json holds each one's commits (sha, time, agent, subject, files by area) and what it changed in the data (events added, changed, removed, by id and field, from data/events.json's diff); /changes/ lists releases newest first, each linking /changes/<version>/; no commit shows a null version (an untagged commit belongs to the next tag that contains it); the footer's version links to its own release page"
evidence: "releases.mjs: /changes/ lists releases, /changes/<version>/ per release, /api/v1/releases.json and /api/v1/releases/<version>.json (commits plus events diff by id and field); every commit gets the first tag containing it (0 null versions); footer version links its release page; deploy.yml fetch-depth 500 with tags. push-to-served seconds per release is not in the JSON yet (CI does not record it)."
---
Dinis, 13:31 UTC: "Every commit here is being tagged, correct? And we're having the tag created by the CI pipeline. And then on the website we have the list ... so we can click on it, we can see the changes that happen on that version ... all this should be done with JSON ... we should be tracking that ... in those events."
**Fact, read 13:31 UTC by the lead:** CI tags the commit each deploy builds, not every commit. In the last hour, 84 commits went out in 58 tagged releases: a push with several commits gets one tag, and bursts of pushes queue into one deploy. /api/v1/changes.json lists 150 commits, and 52 show `"version": null` though they shipped. /changes/<version>/ answers 404.
