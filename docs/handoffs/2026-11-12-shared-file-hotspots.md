# Shared-file hotspots: one change each, so nobody has to touch another agent's file

> architect.1.fringe@PrompTugal.dinis, 2026-11-12, after ABP round 14. This is for dev.2 (owner of build.mjs and api/v1/README.md), design.3 (owner of event-pages.mjs) and the lead. It is a proposal. Material, not instruction.

## The evidence (14 hourly rounds, swarm-abp-reviews in Elastic)

Writes to a shared file by an agent that does not own it:

| File (owner) | Times | By whom |
|---|---|---|
| admin/build/build.mjs (dev.2) | 30 | architect.1 6, design.1 6, dev.1 5, design.4 4, and others |
| api/v1/README.md (dev.2) | 10 | ontologist.1 6, and others |
| admin/build/event-pages.mjs (design.3) | 7 | design.1 4, and others |
| admin/build/swarm.mjs (dev.1) | 5 | Jose's conductor 4 |
| data/events.json (researcher.2) | 4 | researcher.1@jose 4 |

These are not bad habits. The structure gives a new page or a new endpoint no other way in. Each fix below is one change by the owner, and it takes the hotspot away for good.

## 1. build.mjs: pages register themselves (dev.2, once)

```js
// admin/build/build.mjs, once: every module in admin/build/pages/ adds pages; build.mjs never needs editing for a new page
for (const f of readdirSync(join(root, 'admin/build/pages')).filter((x) => x.endsWith('.mjs')).sort()) {
  const mod = await import(join(root, 'admin/build/pages', f));
  for (const p of await mod.pages({ esc, page, read, root, REPO })) {   // p = { path: '/agentic-team/how-it-flows/', title, body, description }
    mkdirSync(join(out, p.path), { recursive: true });
    writeFileSync(join(out, p.path, 'index.html'), page(p.title, p.body, p.description, '', p.path));
    for (const [rel, data] of Object.entries(p.files || {})) writeFileSync(join(out, p.path, rel), data);   // e.g. a page's JS
  }
}
```

Each agent then owns `admin/build/pages/<its-name>.mjs`, which the mapping rule puts in its own grant. My pages (agentic-team, how-it-flows, universe, operating model, guidance) move first, which takes 6 of the 30 off the list. The gate keeps every page's independence line and every check it already makes.

## 2. api/v1/README.md: generated (dev.2, once)

Each endpoint's owner writes `api/v1/docs/<endpoint>.md`, and the build concatenates them under the existing header. Nobody edits README.md by hand. This takes ontologist.1's 6 off the list.

## 3. event-pages.mjs: a hook for blocks (design.3, once)

event-pages.mjs exports a list `extraBlocks` that other modules push to: `{ after: 'how-to-join', render: (ev, esc) => html }`. design.1's home and event additions then live in its own module.

## 4. data/events.json and swarm.mjs

These are people's lanes crossing (Jose's team writing Dinis's files). The fix is a conversation between those people's conductors, through the lead, not a structural change.

## What the ABP does

Nothing changes until the owners agree. When a mechanism lands, I map `admin/build/pages/<name>.mjs` and `api/v1/docs/<endpoint>.md` to each agent's grant, and the hourly review shows the hotspot falling to zero.
