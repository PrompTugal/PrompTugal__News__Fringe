// /communities/ (work/04, BRIEF.md §3 item 2). Owner: conductor.fringe@PrompTugal.indi.
// The groups behind this week's events, from data/communities.json (admin/tools/communities.mjs): what each is (its own
// calendar's words, quoted), how to join (a public link only), its links and its events. Organisations only.
const safeUrl = (u) => (/^https:\/\//.test(u || '') ? u : null);

export function communitiesBody(communities, events, esc, { eventPath, hasPage }) {
  const byId = new Map(events.map((e) => [e.id, e]));
  const withCal = communities.filter((c) => c.sources?.length).length;
  const card = (c) => {
    const evs = (c.events || []).map((id) => byId.get(id)).filter(Boolean).sort((a, b) => String(a.start || a.date).localeCompare(String(b.start || b.date)));
    const links = (c.links || []).filter((l) => safeUrl(l.url) && l.label !== 'Luma calendar').map((l) => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join(' · ');
    const what = c.what?.text ? `<p>“${esc(c.what.text)}” <span class="muted">(its <a href="${esc(c.what.quoted_from)}" rel="noopener">calendar</a>, read ${esc(c.what.read_at.slice(0, 16).replace('T', ' '))} UTC)</span></p>` : '';
    const join = (c.links || []).find((l) => l.label === 'Luma calendar' && safeUrl(l.url));
    const joinHtml = join ? `<a href="${esc(join.url)}" rel="noopener">Follow its public calendar</a>` : '<span class="muted">How to join: unknown; see its events</span>';
    const evHtml = evs.map((e) => `<li><a href="${esc(hasPage(e) ? eventPath(e) : e.url)}">${esc(e.name)}</a> <span class="muted">${esc(e.date)}${e.status && e.status !== 'on' ? ' · ' + esc(e.status) : ''}</span></li>`).join('');
    return `<div class="card" id="${esc(c.id)}"><strong>${esc(c.name)}</strong> <span class="muted">· ${evs.length} event${evs.length === 1 ? '' : 's'}</span>${what}<p>${joinHtml}${links ? ' · ' + links : ''}</p>${evHtml ? `<details><summary>Its events this week</summary><ul>${evHtml}</ul></details>` : ''}</div>`;
  };
  return `<h1>Communities</h1>
<p>The groups behind this week's side events: ${communities.length} organisers, ${withCal} with a public calendar we read. What each says of itself is quoted from its own calendar, with the time we read it. Organisations only: no private people, no contact details. To join a group, use its public calendar or its events.</p>
<p class="muted">Also as data: <a href="/api/v1/communities.json">/api/v1/communities.json</a> · as a graph: <a href="/graph/">the map</a> · run one of these groups? <a href="/organisers/">For organisers</a>.</p>
${communities.map(card).join('\n')}`;
}
