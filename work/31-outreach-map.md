---
id: 31
title: "The outreach map: who to reach and where, from public sources"
owner:
status: open
lane: researcher (a new researcher or sub-agent for outreach), with outreach.1 for the tracker
needs: 04, 23
done-means: "data/outreach-map.json (each entry ≤ 256 KB total, sources and read_at on every item): (1) organisations (from data/communities.json and data/events.json) each with its public pages and official social accounts, read at source; (2) public roles, not private people: where an organisation's own public page names a host, speaker or team by professional role, the role and the page, nothing else; (3) public side-event guides, calendars and infographics that list this week's events (e.g. Luma calendars, Meetup groups, Brainberg, published side-event guides): each with its URL, what it covers, how current it is, and the organisation behind it; (4) a coverage line: events we list that the guides do not and the reverse, so outreach can target the gaps. outreach.1's tracker (work/23-tracker.md) reads it. A short note says what was learned from the other agents' data (communities, graph, captures)."
evidence:
---
**Dinis, 11 Nov 2026 (outreach.1 session):** "I need a whole list of names and people and contacts. Public stuff ... even from infographics and some social media ... let's see if you already have that mapped. If not, we need an agent that's going to track that ... learning from the other agents so we map this."

**What exists (outreach.1, 12:2x UTC):** data/communities.json (75 communities, 23 with their public Luma calendar re-read; links = Luma calendar, website); data/events.json (164 events, organisers); data/outreach-tracker.json (70 organisations, the page where each one's 'contact host' route is). **Not mapped:** official social accounts, public roles, side-event guides and infographics, coverage gaps.

**The rule that bounds this (CLAUDE.md, Dinis's):** people are public and professional only; **no contact details, ever**; no private person is named or linked; organisations' official pages and accounts are fine; public sources only, never behind a login or against terms; no automated reading of websummit.com. 'Contacts' here means **public routes** (a Luma 'contact host' link, a public contact form, an official account), not emails or phone numbers. If Dinis wants named public professionals with their own public profile, he says so and which; he is the only one who can widen the rule.

**A person sends everything.** Nothing is messaged by an agent.
