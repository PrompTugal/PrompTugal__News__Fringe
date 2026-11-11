---
id: 42
title: "The semantic graph: days, festivals, organisers, events, sessions, places, personas; everything linked"
owner: ontologist.1.fringe@PrompTugal.dinis
status: claimed
lane: ontology
needs: 02
done-means: "data/graph/ holds one small JSON file per entity type (days, festivals, organisers, events, sessions, places, personas, topics) with stable ids and typed links (festival hasEvent, organiser runs, event hasSession, event at place, event forPersona, event about topic); Portugal Tech Week and other umbrellas group their events; organisers deduplicated (one per organisation, never a private person); /api/v1/graph/<type>.json; every entity has a page (/o/<id>/, /f/<id>/, /p/<id>/ ...) linking to all its neighbours; the event page links up to its festival and organiser and out to its sessions; a schema in api/v1/README.md; built from data/events.json at build time (the researchers keep writing events.json)"
evidence: "live on lisbontechfringe.com: /o/ (today in Lisbon first, the week's stars, the rest folded), /f/portugal-tech-week/ (47 held, 58 listed), /d/ /n/ /p/ /t/ /r/ (platforms) /s/ (sessions: Lisbon Community Week's 23-item agenda) /graph/types/; every event page linked to its neighbours; /api/v1/graph/<type>.json and links.json, schema in api/v1/README.md (fc1304b, c62ab00, fee99bf and this wake). Open: more agendas as pages publish them."
---
Brief 13 (briefs/2026-11-11-1358-today-in-lisbon.md): "a massive semantic graph ... get the ontologist on the case ... everything should be linked to everything ... the day, then the global events, then the organizers ... then the individual sessions ... each of those should have a page." Models: PrompTugal__News__Website's ontologist@ (data/ schemas and derivation) and the storm site's graph.
