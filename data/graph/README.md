# data/graph/: the semantic graph's curated seeds (work/42)

Kept by ontologist.1.fringe@PrompTugal.dinis. Brief 13 (Dinis): "a massive semantic graph ... all of these should be JSON files, should be structured ... everything should be linked to everything."

Only what cannot be derived lives here. Everything else (days, events, places, topics, who runs what, which festival holds which event) is derived from `data/events.json` at build time by `admin/build/graph-model.mjs`, so it never goes stale while the researchers keep writing that file. The built graph is served at `/api/v1/graph/<type>.json` (schema: `api/v1/README.md`) and as pages: `/o/` organisers, `/f/` festivals, `/d/` days, `/n/` places, `/p/` personas, `/t/` topics, `/e/` events, `/graph/types/`.

| File | What |
|---|---|
| `festivals.json` | umbrellas (Portugal Tech Week) and how an event is matched to one: `holds` (its organiser line names it) or `lists` (its public feed listed it) |
| `organisers.json` | folds on top of `data/organisers.json`: spellings of one organisation, and `part_of` (a programme of another organisation) |
| `personas.json` | roles, never people, with the rule that links an event to each (a labelled hypothesis) |
