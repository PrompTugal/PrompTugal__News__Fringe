# Lisbon Fringe API v1: the contract

Served at `https://fringe.promptugal.news/api/v1/`. Built from this repository on every push to `dev` (admin/build/build.mjs). **Fields are stable within v1:** fields may be added, never renamed or removed; a breaking change is v2. Lisbon Fringe is independent of Web Summit.

## `events.json`

```
{
  "about":    string,
  "site":     "https://fringe.promptugal.news/",
  "version":  string,          // CI's release, e.g. "v0.1.42" ("local" outside CI)
  "built_at": ISO 8601 UTC,
  "events": [
    {
      "name":       string,                 // required
      "url":        "https://...",          // required: the public page the event was read from
      "read_at":    ISO 8601 UTC,           // required: when that page was last read
      "date":       "YYYY-MM-DD",           // required: the day (Lisbon is UTC in November)
      "start":      ISO 8601 | null,
      "end":        ISO 8601 | null,
      "kind":       string,                 // e.g. meetup, workshop, conference, social
      "organiser":  string,                 // an organisation, never a private person
      "place":      string,                 // venue or "online (...)"
      "join":       string,                 // how to join, public links only
      "status":     "on" | "moved" | "cancelled" | "online" | "unknown",
      "storm_note": string | null,          // what the storm changed, from the page
      "topics":     [string]
    }
  ]
}
```

Only events re-read at their URL (data/events.json, work/02) are published. No contact details, ever.

## `communities.json`

Served at `/api/v1/communities.json` (work/04, conductor.fringe@PrompTugal.indi). Made by `admin/tools/communities.mjs` from `data/events.json`: the organisers, split as the graph splits them, and for each Luma event its hosting calendar re-read once. Organisations only: a personal calendar, a host or an independent organiser is never listed. No contact details.

```
{
  "about", "site", "version", "built_at",
  "updated":  ISO 8601 UTC,           // when data/communities.json was made
  "how":      string,
  "communities": [
    {
      "id":      string,                  // slug; the /graph/ node is "community:<id>"
      "name":    string,
      "what":    { "text", "quoted_from": URL, "read_at": ISO 8601 } | null,   // its calendar's own words, first sentence
      "join":    string,                  // a public way in, or "unknown: join through its event pages"
      "links":   [ { "label": "Luma calendar" | "website", "url": "https://..." } ],
      "events":  [ event id ],            // ids in events.json
      "sources": [ { "url", "read_at", "what" } ],   // the pages its facts were read from
      "label":   "fact" | "from events.json only"
    }
  ]
}
```

## `graph.json`

Served at `/api/v1/graph.json` (work/05, conductor.fringe@PrompTugal.angelo). Built from `events.json` alone; the page is `/graph/`.

```
{
  "about", "site", "version", "built_at",
  "ptnews_from": { "repository", "path", "commit", "read_at" } | null,   // the pt.news snapshot (data/ptnews-index.json)
  "nodes": [
    {
      "id":     "event:<event id>" | "community:<slug>" | "topic:<slug>" | "place:<slug>",
      "type":   "event" | "community" | "topic" | "place",
      "label":  string,
      "degree": number,
      "x", "y": number,                     // the layout, computed at build time
      "ptnews":    URL,                     // optional: the same thing on promptugal.news
      "gamma_ray": URL,                     // optional: its GAMMA-Ray card
      // events only: event, url, read_at, date, start, end, kind, status, storm_moved, place, organiser, topics
    }
  ],
  "edges": [
    { "from": "event:<id>", "to": node id, "verb": "organised by" | "about" | "at", "source": URL, "read_at": ISO 8601 }
  ]
}
```

A community is an organiser named on an event's page, as an organisation; an organiser described as an individual makes no node. A place is the area of the venue (or "Online"). Topics are as the events give them, with a few synonyms folded.
