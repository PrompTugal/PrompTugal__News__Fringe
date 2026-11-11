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
      "topics":     [string],
      "cost":        "free" | "free, with paid tiers up to EUR n" | "paid, EUR n" | "not stated",   // added; from the page's ticket info
      "in_lisbon":   true | false,            // added: false for online events and events outside Lisbon (Covilhã, Mértola, Santarém, Sintra, Estoril)
      "personas":    [string],                // added: investor, founder, builder, corporate, student, anyone; from sentences on the page that name an audience; empty when the page names none
      "umbrella":    string | absent,         // added: e.g. "Portugal Tech Week", when the page or its calendar says so
      "neighbourhood": string | absent,       // added: the area as the public page names it (Luma's address area when the address is shown, or an area named in the place); absent when the address is given to guests only. Never guessed from a hidden address
      "size":       "major" | "community",   // added: major = conference, festival or multi-session day (PTW days, WET SUMMIT); community = meetup, dinner, talk, drinks
      "lane":       "business" | absent,    // added: founders', investors' and partners' meetups (work/10); absent = not tagged
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
      "what":    null,                    // ALWAYS null since 9ab2db7 (11 Nov): the Luma calendars' own words are no longer quoted (Luma's terms, work/49). Kept so readers of the old shape do not break; was { "text", "quoted_from": URL, "read_at": ISO 8601 }
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
      "outreach":  "listed" | "draft ready" | "contacted" | "answered" | "joined",   // communities only, optional (work/32): the state in data/outreach-tracker.json, matched by community id, then normalised name; never a contact, channel or name
      // events only: event, url, read_at, date, start, end, kind, status, storm_moved, place, organiser, topics
    }
  ],
  "edges": [
    { "from": "event:<id>", "to": node id, "verb": "organised by" | "about" | "at", "source": URL, "read_at": ISO 8601 }
  ],
  "outreach": {                             // work/32: counts only
    "on_graph": { "listed", "draft ready", "contacted", "answered", "joined": number },   // community nodes in each state
    "tracker":  { "by", "updated", "organisers_listed", "drafts_ready", "contacted", "answered", "joined" } | null   // data/outreach.json as it is
  },
  "ontology": {                             // work/32: the counts behind the picture on /graph/
    "counts":   { "community", "community_checked", "event", "place", "topic", "channel_links", "source", "agent", "person_by_role": number },
    "channels": { "Luma", "Meetup", "LinkedIn", "X", "WhatsApp group", "Eventbrite", "website": number },   // link hosts in events' url and communities' links[]
    "sources_latest_read_at": ISO 8601 | null,
    "edges":    { "organised by", "about", "at": number }
  }
}
```

A community is an organiser named on an event's page, as an organisation; an organiser described as an individual makes no node. A place is the area of the venue (or "Online"). Topics are as the events give them, with a few synonyms folded.

## `graph/<type>.json`: the semantic graph (work/42)

Served at `/api/v1/graph/<type>.json` (ontologist.1.fringe@PrompTugal.dinis). Built from `data/events.json` at build time by `admin/build/graph-model.mjs`, with the curated seeds in `data/graph/` (festivals, organiser folds, personas). Every file has `about, site, version, built_at, type` and one array named after its type. Ids are stable slugs; `page` is the entity's page on the site (pages may move; ids do not). Organisations only, never a private person; no contact details. `index.json` lists the files, counts and verbs.

| file (SQL table, work/43) | columns |
|---|---|
| `days` | `id` (YYYY-MM-DD), `name`, `events` [event id], `festivals` [festival id], `page` |
| `festivals` | `id`, `name`, `organiser` (organiser id), `links` [{label, url}], `holds_when`, `lists_when`, `events` [event id: runs, or a partner runs under its name], `listed` [event id: in its public feed], `days` [day id], `page` |
| `organisers` | `id`, `name`, `links` [{label, url}], `what` {text, quoted_from, read_at} \| null, `part_of` (organiser id) \| null, `events` [event id], `lead` [event id it leads], `festivals` [festival id], `page` |
| `events` | `id` (as in events.json), `name`, `url`, `read_at`, `day`, `start`, `end`, `kind`, `size`, `status`, `storm_moved`, `cost`, `free` (true \| false \| null), `city` ("Lisbon" \| "online" \| a town \| "unknown"), `in_lisbon`, `place` (place id), `organisers` [{id, lead, role}] (role: runs, coRuns, hosts, supports), `festival` (festival id) \| null, `listed_by` [festival id], `personas` [persona id], `topics` [topic id], `sessions` [session id], `platform` (platform id: the host of `url`), `page` |
| `sessions` | `id` (`<event id>--HHMM`), `event`, `name` (the title only, never a speaker), `kind` (talk, panel, workshop, break, unconference, party), `day`, `start`, `end`, `place`, `festival`, `url` (the event page the agenda was read from), `read_at`, `label`, `page` (/s/&lt;id&gt;/); curated in data/graph/sessions.json |
| `places` | `id`, `name` (the neighbourhood as the page names it, else the city, else "Online"), `city`, `events` [event id], `page` |
| `personas` | `id` (investor, founder, builder, corporate, student, anyone: roles, never people), `name`, `ask`, `rule`, `label` ("hypothesis (by rule)"), `events` [event id], `page` |
| `topics` | `id`, `name`, `events` [event id], `page` |
| `platforms` | `id` (luma, meetup, eventbrite, partiful, own-site), `name`, `hosts` [host, for own-site], `events` [event id], `page` (/r/&lt;id&gt;/) |
| `retired` | every event id the site once published that is no longer in events.json: `id`, `name`, `url`, `date`, `first_seen`, `last_seen`, `removed_in` (commit), `removed_at`, `removed_by` (that commit's subject), `status` (superseded \| no longer listed), `superseded_by` (event id, same URL) \| null. Its old page /e/&lt;id&gt;/ stays and says where it went (supersede, never delete). From data/graph/seen.json, made by `node admin/build/graph-seen.mjs --update` from git history |
| `links` | `from`, `verb`, `to`, `source` (the event's URL), `read_at`; `verbs` gives each verb's subject and object type: hasEvent, lists (festival→event), runs, coRuns, hosts ("hosted by": the venue), supports ("powered by") (organiser→event), runsFestival, partOf, onDay, at, forPersona, about, hasSession, registerOn (event→platform) |

For SQL, `links` is the one edge table: e.g. `SELECT o.name, count(*) FROM links l JOIN organisers o ON o.id = l.from WHERE l.verb = 'runs' GROUP BY 1 ORDER BY 2 DESC`.
