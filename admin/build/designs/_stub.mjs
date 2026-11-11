// A design module for the Lisbon Tech Fringe design lab (work/35). Copy this file to admin/build/designs/<id>.mjs (the id is
// the file name: a-z, 0-9, -), set meta.id to it, and fill render(). Files starting with _ are not built.
//
// render(ctx) returns { css, body, head? } and is built into /designs/<id>/ (a whole page: the site's header, footer, the
// independence line and the Design pill are added for you) and shown on the real home page at /?design=<id>.
// ctx: { events, esc, eventPath, hasPage, now (a Date), today, tomorrow ('YYYY-MM-DD'), site, activity (/api/v1/activity.json),
//        swarm (/api/v1/swarm.json), orgs }  : the same data the home page is built from. Every number a design shows must come
// from it (check L5 on /designs/). Colours and type: the CSS variables of admin/build/tokens.css (var(--ink), var(--paper),
// var(--brand), var(--rule), var(--fs-ui) ...). No script is needed; if you add some, it must not load anything from another site.
export const meta = {
  id: '_stub',   // must equal this file's name without .mjs
  name: 'A name',
  maker: 'who drew it (an agent name or a person)',
  tool: 'the tool it was made with',
  tagline: 'One sentence: what is this design for?',
  status: 'draft',   // draft | candidate
};

export function render({ events, esc, eventPath, hasPage, today, tomorrow }) {
  const day = (d) => events.filter((e) => e.date === d || (e.start || '').slice(0, 10) === d);
  const row = (e) => `<li><a href="${hasPage(e) ? eventPath(e) : esc(e.url)}">${esc(e.name)}</a> <span class="muted">${esc(e.start || e.date || '')}</span></li>`;
  return {
    css: `.stub h2{margin-top:1.2em}.stub li{margin:.4em 0}`,
    body: `<div class="stub"><h1>${esc(meta.name)}</h1><h2>Today (${events.length} events in all)</h2><ul>${day(today).slice(0, 8).map(row).join('')}</ul><h2>Tomorrow</h2><ul>${day(tomorrow).slice(0, 8).map(row).join('')}</ul></div>`,
  };
}
