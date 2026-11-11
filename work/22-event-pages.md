---
id: 22
title: "A page for every event: the organiser is the star"
owner: dev.lead.fringe@PrompTugal.dinis
status: done
lane: dev (dev.fringe@), the look (design agents)
needs: 02
done-means: "every event in data/events.json has /e/<id>/: its name, the organiser's name and their own links first and largest (register, live stream, Luma), status (on, online, moved, cancelled, unknown) with the storm note, start and end (UTC = Lisbon), place or 'online', cost if stated, the source URL and read_at, related events (same organiser, topic, place), and a line 'Organisers: this page is yours to improve, see /organisers/'; listed in the sitemap; an Open Graph card per event for sharing; no contact details, no private people"
evidence: "commit 3aa8d6c on dev (admin/build/event-pages.mjs): 70 pages at /e/<id>/, all in sitemap.xml, linked from the home cards and /graph/; live e.g. https://fringe.promptugal.news/e/2026-11-11-ai-video-blueprint-2027/. Checked at 390 px with Playwright: no sideways scroll, no console errors. The organisers line points to /join/ (no /organisers/ page exists yet)."
---
Brief 3 (briefs/2026-11-11-1137-make-them-the-star.md), Dinis: "Every single event that exists, we need to have the page on our site, and we should be linking and making that event better ... This is about making them the star. This is not about taking traffic from them."
Every outbound link to the organiser carries `?ref=fringe.promptugal.news` only where their own page allows it; nothing hides or replaces their link.
