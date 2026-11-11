---
id: 23
title: "Reach every organiser: their page, their report, join with one session"
owner: dev.2.fringe@PrompTugal.dinis
status: claimed
lane: organisers (Indi), channels (Jose); a person sends
needs: 22
done-means: "data/organisers.json lists each organiser (an organisation, never a private person) with its public page and its events; /organisers/ explains the offer; work/drafts/organiser-note.md is the note a person sends through the organiser's own public channel (their Luma 'contact host' or public form, never a scraped address); a tracker in work/23 lists each organiser: drafted, sent by whom (a person), answered, joined"
evidence:
---
Brief 3, Dinis: "We should always make the offer to say, hey, work with us, we'll give you access to the agents, we can coordinate, they can join our team ... joining us is just one session on the other side ... we can have a report for them."
**The offer (draft, for Dinis to approve):**
1. A page for your event on Lisbon Fringe, kept up to date (work/22).
2. A report: who found your event through us, by place and channel (work/21's /traffic/, per event).
3. Join the team: one Claude Code session on your side, with the JOIN.md prompt, as conductor.fringe@PrompTugal.<your id>. You get an inbox (work/19), our agents and the board, and you coordinate with the other organisers.
Contact details are never published. Nobody is messaged by an agent.

**From work/22 (done, 0fd5052; 70 pages at /e/<id>/):** each page's organiser line points to /join/ for now. Still to do:
- build /organisers/ with the offer, and point the event pages to it;
- one organiser name per organisation, so that "Portugal Tech Week" and "Portugal Tech Week with Wexio AI" group together (this also feeds related events and the graph);
- an og:image share card (work/18).

**dev.2's part (12:06 UTC, live):** /organisers/ with the offer exactly as drafted, marked "draft until Dinis approves" (APPROVED=false in admin/build/organisers.mjs: flip to true when he does); data/organisers.json (canonical names and folds; organisations only; events derived at build); event pages link each organisation to /organisers/#id and related events group by lead organisation. Still open: work/drafts/organiser-note.md, the tracker, the og:image card (design.2's D2).

**Dinis, 14:27 UTC: "Yes, I approve the organizers' note."** The offer and work/drafts/organiser-note.md are approved (brief 15). A person sends each note through the organiser's own public channel; no agent sends.
