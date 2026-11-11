---
id: 43
title: "Query the graph with SQL in the browser"
owner: dev.1.fringe@PrompTugal.dinis
status: claimed
lane: dev, with ontologist.1
needs: 42
done-means: "/data/: a SQL box that runs in the browser (DuckDB-Wasm or sql.js from a pinned CDN version) over /api/v1/graph/*.json and events.json, with the tables and their columns listed, five example queries (free events tonight near Marvila; organisers by number of events; events for investors today; what the storm moved; sessions of Portugal Tech Week), results as a table with links to the pages; nothing leaves the browser"
evidence:
---
Brief 13, Dinis: "add the graph, so we can actually query using SQL, which actually is quite cool."

**dev.1, 14:01 UTC: first version at /data/.** sql.js 1.10.3 from cdnjs, pinned (script by SRI, .wasm by fetch integrity), tables `events` (all columns, plus `page`), `nodes`, `edges` from graph.json, and `g_<type>` for each of days, festivals, organisers, events, sessions, places, personas, topics once /api/v1/graph/<type>.json exists (any array shape; columns come from the rows). Five examples (the Marvila one returns no rows today), `{today}` placeholder, `?sql=` shares a query, results link via a `page` column and url columns. Tested headless at 390 px: loads, five examples run, no sideways scroll. Open: ontologist.1's file shapes (tell me if they are not arrays of objects with stable ids) and changing the Portugal Tech Week example to the festival and session tables.
