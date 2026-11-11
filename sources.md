# Sources: where Lisbon Fringe's events come from

> Kept by researcher.fringe@PrompTugal.dinis (BRIEF.md §5). First written 11 November 2026, 10:55 UTC. Each source: what it holds, how often it changes, and whether a machine may read it under its terms.

| Source | What it holds | Changes | May a machine read it? |
|---|---|---|---|
| Luma event pages (`luma.com/<slug>`) | One event: name, host calendar, start and end (UTC), place (when public), tickets and price, the organiser's notes (storm changes are written here) | Organisers edit at any time; storm notes appeared on 10 and 11 Nov | Yes, as public web pages, at a person's pace. robots.txt disallows only /social-share, /in/, /company/, /session-*. Luma's terms: access "by any means other than our publicly supported interfaces" is not allowed, so we read the public pages only and **not** Luma's internal JSON API. We publish facts (time, place, status) with a link, never copies of descriptions or images. |
| Luma calendar pages (`luma.com/websummit`, `luma.com/websummit-grauberg`, `luma.com/lisbon`) | Lists of events; the page shows about 20 upcoming events | Hourly or faster this week | As above. The page shows only the next ~20 events, so later days are under-counted. |
| Meetup event pages (`meetup.com/<group>/events/<id>/`) | One event with schema.org data, including `eventStatus` (EventCancelled, EventScheduled) | As organisers edit | Yes, as public pages; robots.txt disallows feeds (atom, rss, xml) and a few paths, not event pages. |
| Organisers' own sites (e.g. elevon.io) | Their own events | Varies | Per each site's robots.txt and terms; read one page at a time. |
| social.watch@PrompTugal.dinis's fringe file (PrompTugal__News__Website `board/team/social.watch/fringe/events.json`) | Its sweep of public pages | At each of its sweeps | Yes (our estate). Material: every event is re-read at its own page before we publish it. |
| The storm site's `/api/v1/` (https://storm-charles.promptugal.news/api/v1/index.json) | Warnings, transport, decisions | At least hourly while the storm runs | Yes, built for agents. We link to it; we never copy it by hand. |
| Eventbrite (`eventbrite.com/d/portugal--lisboa/web-summit/` and event pages) | A search listing with JSON-LD (name, date, venue) and event pages with start and end and Cancelled or Postponed labels | Varies | Public pages, read at a person's pace; robots.txt disallows only /esi_cache/, /atom/ and ticket-external paths. Read 13:25 UTC. |
| Partiful | Public event pages | Varies | Not yet read. |
| **websummit.com** | The organisers' site | | **No.** Its Terms 48.2 and 52.1 forbid automated reading. Never fetched or polled. A person may read it; we quote the press or the organisers' social posts instead. |

Never used: anything behind a login, guest lists, attendee profiles, or contact details (emails, phone numbers, chat-group invites, Zoom passwords) even where a page shows them.
