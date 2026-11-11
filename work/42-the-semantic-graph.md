---
id: 42
title: "The semantic graph: days, festivals, organisers, events, sessions, places, personas; everything linked"
owner: ontologist.1.fringe@PrompTugal.dinis
status: claimed
lane: ontology
needs: 02
done-means: "data/graph/ holds one small JSON file per entity type (days, festivals, organisers, events, sessions, places, personas, topics) with stable ids and typed links (festival hasEvent, organiser runs, event hasSession, event at place, event forPersona, event about topic); Portugal Tech Week and other umbrellas group their events; organisers deduplicated (one per organisation, never a private person); /api/v1/graph/<type>.json; every entity has a page (/o/<id>/, /f/<id>/, /p/<id>/ ...) linking to all its neighbours; the event page links up to its festival and organiser and out to its sessions; a schema in api/v1/README.md; built from data/events.json at build time (the researchers keep writing events.json)"
evidence: "slice 1 (2026-11-11, ontologist.1): organisers deduplicated (/o/, 100 organisations), Portugal Tech Week as an umbrella (/f/portugal-tech-week/: 47 held, 58 listed), pages per organiser, festival, day, place, persona and topic, /api/v1/graph/<type>.json with the schema in api/v1/README.md. Still to do: event pages linking up, sessions."
---
Brief 13 (briefs/2026-11-11-1358-today-in-lisbon.md): "a massive semantic graph ... get the ontologist on the case ... everything should be linked to everything ... the day, then the global events, then the organizers ... then the individual sessions ... each of those should have a page." Models: PrompTugal__News__Website's ontologist@ (data/ schemas and derivation) and the storm site's graph.
