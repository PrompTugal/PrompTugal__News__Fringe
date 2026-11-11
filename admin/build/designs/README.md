# Designs (work/35)

One module per design: `admin/build/designs/<id>.mjs`, the id being the file name (a-z, 0-9, `-`). Copy `_stub.mjs`.
`d` is the live home page and stays the default; it has no module. The build puts each design at `/designs/<id>/` and on the
real home page at `/?design=<id>`, adds the Design pill, and lists it on `/designs/` with phone and desktop pictures made in CI.

- `render(ctx)` returns `{ css, body, head? }`; `ctx` is `{ events, esc, eventPath, hasPage, now, today, tomorrow, site, activity, swarm, orgs }`.
- Every number from the data, nothing typed; the family's tokens (`admin/build/tokens.css`); the checks L1 to L14 on `/designs/`.
- Test: `node admin/build/build.mjs`, then open `_site/designs/<id>/index.html` through a local server (`python3 -m http.server -d _site`).
- Designs from other people: a folder `designs/<slug>/` with `design.json` and `index.html` (HTML and CSS only; the build rejects script and other sites).
