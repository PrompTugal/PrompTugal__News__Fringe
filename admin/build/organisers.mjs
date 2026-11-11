// work/23 (dev.2.fringe@PrompTugal.dinis): one name per organisation, and the /organisers/ page.
// Organisations only, never private people (organisersOf drops "an independent organiser"). No contact details.
// data/organisers.json holds the curated part: canonical names and the spellings that fold into them.
// Everything else (events, counts) is derived from data/events.json at build time, so it never goes stale.
import { readFileSync, existsSync } from 'node:fs';
import { organisersOf } from './graph.mjs';

const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-') || 'x';

export function loadOrganisers(root, events) {
  const f = `${root}/data/organisers.json`;
  const cur = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).organisers || [] : [];
  const byAlias = new Map(), orgs = new Map();
  for (const o of cur) {
    orgs.set(o.id, { id: o.id, name: o.name, events: [], lead: [], url: o.url });
    for (const a of [o.name, ...(o.aliases || [])]) byAlias.set(norm(a), o.id);
  }
  const of = new Map();   // event -> [{id, name, lead}]
  for (const e of events) {
    const list = [];
    organisersOf(e.organiser).forEach((raw, i) => {
      let id = byAlias.get(norm(raw));
      if (!id) { id = slug(raw); byAlias.set(norm(raw), id); }
      if (!orgs.has(id)) orgs.set(id, { id, name: raw, events: [], lead: [] });
      const o = orgs.get(id);
      if (list.some((x) => x.id === id)) return;
      o.events.push(e); if (i === 0) o.lead.push(e);
      list.push({ id, name: o.name, lead: i === 0 });
    });
    of.set(e, list);
  }
  return { orgs: [...orgs.values()].filter((o) => o.events.length).sort((a, b) => b.lead.length - a.lead.length || b.events.length - a.events.length || a.name.localeCompare(b.name)), of };
}

export const organiserPath = (id) => `/organisers/#${encodeURIComponent(id)}`;

// The offer is exactly work/23's draft. It stays marked a draft until Dinis approves it (set APPROVED to true then).
const APPROVED = false;
export function organisersBody({ orgs }, esc, { eventPath, hasPage }) {
  const rows = orgs.map((o) => {
    const evs = [...o.events].sort((a, b) => String(a.start || a.date).localeCompare(String(b.start || b.date)));
    return `<div class="card" id="${esc(o.id)}"><strong>${esc(o.name)}</strong><span class="tag">${o.lead.length} led · ${o.events.length - o.lead.length} with others</span>
<ul style="margin:.4em 0 0;padding-left:1.2em">${evs.map((e) => `<li><a href="${esc(hasPage(e) ? eventPath(e) : e.url)}">${esc(e.name)}</a> <span class="muted">${esc(String(e.start || e.date).slice(0, 16).replace('T', ' '))}${e.start ? ' UTC' : ''}${o.lead.includes(e) ? '' : ' · with others'} · <a href="${esc(e.url)}">their page</a></span></li>`).join('')}</ul></div>`;
  }).join('');
  return `<h1>For organisers</h1>
${APPROVED ? '' : `<p class="ind yours"><strong>Draft until Dinis approves.</strong> This is the offer as drafted (work/23). Nobody has been contacted, and no agent messages an organiser.</p>`}
<p>Lisbon Tech Fringe is an independent guide to the side events around Web Summit Lisbon. It points people to <em>your</em> page; yours is the one that counts. If you run an event, here is what we offer.</p>
<ol>
<li><strong>A page for your event</strong> on Lisbon Tech Fringe, kept up to date.</li>
<li><strong>A report:</strong> who found your event through us, by place and channel (counts only, per event; see <a href="/traffic/">/traffic/</a> for the site as a whole).</li>
<li><strong>Join the team:</strong> one Claude Code session on your side, with the prompt on <a href="/join/">/join/</a>, as <code>conductor.fringe@PrompTugal.&lt;your id&gt;</code>. You get an inbox, our agents and the board, and you coordinate with the other organisers.</li>
</ol>
<p class="muted">Contact details are never published. Nobody is messaged by an agent.</p>
<h2>${orgs.length} organisers on the site</h2>
<p class="muted">Organisations only, as named on their own public event pages. Related events and <a href="/graph/">the graph</a> group by these names. Is a name wrong, or missing? It is yours to correct: see <a href="/join/">/join/</a>.</p>
${rows}`;
}
