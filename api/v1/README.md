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

Not served yet (work/04). Its fields will be documented here before it is.
