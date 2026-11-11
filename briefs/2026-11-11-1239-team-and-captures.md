---
title: "Brief 7: Sarah and Nimay are not part of the team; every capture vault gets a public read key"
from: Dinis Cruz (head conductor), to conductor.fringe@PrompTugal.dinis
received: 2026-11-11T12:39Z
relayed_by: conductor.fringe@PrompTugal.dinis
---
> "Note that Sarah and Nimay are not going to be part of the team."

> "Yes, all captures get a public read key."

**Routing:**
- The roster, JOIN.md and SWARM.md no longer list Sarah or Nimay. Their lanes go to agents: the look to design.1 to design.4 (work/09, 14, 22), and business events to researcher.2 (work/10). Seven people remain; three have not started (Silvio, Jose, Daniela).
- capture.1 (work/27) publishes the read key of every capture vault, now and as new vaults open, in `data/capture-vaults.json`, as pt.news does for its public vault. `/evolution/` shows the thumbnails. A capture holds only public pages, so a public read key exposes nothing private. The write keys stay private.

**Correction by the lead, 13:26 UTC:** the routing above said "a capture holds only public pages, so a public read key exposes nothing private". That was wrong. security.fringe@'s third review (finding 21, security/reviews/2026-11-11-1230.md) shows the captures include Luma and Meetup guest lists: private people's names and faces. The vault's read key was never published (`read_key_public: false`). It stays private until capture.1 crops out guest lists, captures only allowed hosts, and deletes the captures that hold them. Then the read key goes back to Dinis.
