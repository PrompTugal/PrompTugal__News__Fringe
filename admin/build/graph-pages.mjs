// work/42 (ontologist.1.fringe@PrompTugal.dinis): the graph's pages and /api/v1/graph/<type>.json.
// Every entity gets a page that links to all its neighbours; organisers are the stars (brief 13).
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildModel, TYPES, VERBS, GRAMMAR, PREFIX, pathOf } from './graph-model.mjs';

const CSS = `.gx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:.6rem;margin:.6rem 0}
.gx-star{border:1px solid var(--line,#ddd);border-radius:10px;padding:.7rem .8rem;display:block;text-decoration:none;color:inherit}
.gx-star strong{display:block;font-size:1.05em}.gx-star .n{font-size:1.6em;font-weight:700;line-height:1}
.gx-chips a{display:inline-block;margin:.15rem .25rem .15rem 0;padding:.1rem .55rem;border:1px solid var(--line,#ddd);border-radius:99px;text-decoration:none;font-size:.9em}
.gx-ev li{margin:.25rem 0}.gx-gram{border-collapse:collapse;font-size:.9em;display:block;overflow-x:auto}.gx-gram td,.gx-gram th{padding:.25rem .5rem;border-bottom:1px solid var(--line,#ddd);text-align:left;vertical-align:top}.gx-up{font-size:.9em}`;

export function writeGraph({ root, out, events, page, esc, eventPath, hasPage, SITE, VERSION, BUILT }) {
  const m = buildModel(root, events);
  const B = m.byId;
  const name = (type, id) => B[type + 's']?.get(id)?.name || id;
  const a = (type, id, label) => `<a href="${pathOf(type, id)}">${esc(label ?? name(type, id))}</a>`;
  const evLink = (id) => { const e = B.events.get(id); const src = events.find((x) => x.id === id); return `<a href="${esc(src && hasPage(src) ? eventPath(src) : e.url)}">${esc(e.name)}</a>`; };
  const when = (e) => e.start ? `${e.start.slice(8, 10)}/${e.start.slice(5, 7)} ${e.start.slice(11, 16)} UTC` : e.day;
  const evList = (ids, { lead } = {}) => {
    const evs = [...new Set(ids)].map((id) => B.events.get(id)).sort((x, y) => String(x.start || x.day).localeCompare(String(y.start || y.day)));
    return `<ul class="gx-ev">${evs.map((e) => `<li>${evLink(e.id)} <span class="muted">${esc(when(e))}${e.place ? ' · ' + a('place', e.place) : ''}${e.festival ? ' · ' + a('festival', e.festival) : ''}${lead && !lead.includes(e.id) ? ' · with others' : ''}${e.in_lisbon || e.city === 'online' ? '' : ` · <strong>not in Lisbon (${esc(e.city)})</strong>`}${e.status !== 'on' ? ` · ${esc(e.status)}` : ''} · <a href="${esc(e.url)}">their page</a></span></li>`).join('')}</ul>`;
  };
  const chips = (type, ids) => `<p class="gx-chips">${[...new Set(ids)].map((id) => a(type, id)).join('')}</p>`;
  const neighbours = (ids, key) => { const c = new Map(); for (const id of ids) for (const x of [].concat(B.events.get(id)[key] || [])) if (x) c.set(x, (c.get(x) || 0) + 1); return [...c.entries()].sort((p, q) => q[1] - p[1]).map(([k]) => k); };
  const orgsOf = (ids) => { const c = new Map(); for (const id of ids) for (const o of B.events.get(id).organisers) c.set(o.id, (c.get(o.id) || 0) + 1); return [...c.entries()].sort((p, q) => q[1] - p[1]).map(([k]) => k); };
  const links = (ls) => ls?.length ? `<p>${ls.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(' · ')}</p>` : '';
  const api = (t) => `<p class="muted">As data: <a href="/api/v1/graph/${t}.json">/api/v1/graph/${t}.json</a> · <a href="/graph/types/">every type</a> · <a href="/graph/">the map of it all</a></p>`;
  const write = (path, title, body, desc) => { mkdirSync(join(out, path), { recursive: true }); writeFileSync(join(out, path, 'index.html'), page(`${title}: Lisbon Tech Fringe`, `<style>${CSS}</style>${body}`, desc, '', '/organisers/')); };
  const star = (o) => `<a class="gx-star" href="${pathOf('organiser', o.id)}"><span class="n">${o.events.length}</span><strong>${esc(o.name)}</strong><span class="muted">${o.lead.length} led${o.events.length - o.lead.length ? ` · ${o.events.length - o.lead.length} with others` : ''}${o.festivals.length ? ' · runs a festival' : ''}</span></a>`;

  // --- organisers: the stars ---------------------------------------------------------------------------------------
  for (const o of m.organisers) {
    const up = o.part_of ? `<p class="gx-up">Part of ${a('organiser', o.part_of)}.</p>` : '';
    const parts = m.organisers.filter((x) => x.part_of === o.id);
    write(`${PREFIX.organiser}/${o.id}`, o.name, `<p class="gx-up"><a href="/o/">Organisers</a></p><h1>${esc(o.name)}</h1>${up}
${o.what?.text ? `<blockquote>${esc(o.what.text)}</blockquote><p class="muted">In its own words, from <a href="${esc(o.what.quoted_from)}">its calendar</a>, read ${esc(String(o.what.read_at).slice(0, 16).replace('T', ' '))} UTC.</p>` : ''}
${links(o.links)}
${o.festivals.length ? `<h2>Runs</h2>${chips('festival', o.festivals)}` : ''}
${parts.length ? `<h2>Its programmes</h2>${chips('organiser', parts.map((x) => x.id))}` : ''}
<h2>${o.events.length} event${o.events.length === 1 ? '' : 's'}</h2>${evList(o.events, { lead: o.lead })}
<h2>Around it</h2><p class="muted">Days</p>${chips('day', neighbours(o.events, 'day'))}<p class="muted">Places</p>${chips('place', neighbours(o.events, 'place'))}
<p class="muted">For</p>${chips('persona', neighbours(o.events, 'personas'))}<p class="muted">About</p>${chips('topic', neighbours(o.events, 'topics').slice(0, 20))}
<p class="muted">Runs events with</p>${chips('organiser', orgsOf(o.events).filter((x) => x !== o.id))}
<p class="muted">An organisation, as named on its own public event pages. Is this wrong, or is it yours? See <a href="/organisers/">for organisers</a>.</p>${api('organisers')}`,
    `${o.name}: its side events in Lisbon this week, on Lisbon Tech Fringe.`);
  }
  // /o/: today in Lisbon first (brief 13: "focus 100% ... on today, in Lisbon"), then the week's stars, then the rest
  // folded (brief 13: "101 organisers ... a lot is noise"). Hosts and sponsors are linked, never counted as stars.
  const day0 = BUILT.slice(0, 10);
  const todayIds = (o) => o.lead.filter((id) => { const e = B.events.get(id); return e.day === day0 && e.in_lisbon && e.status !== 'cancelled'; });
  const nowOrgs = m.organisers.filter((o) => todayIds(o).length)
    .sort((x, y) => todayIds(y).length - todayIds(x).length || String(B.events.get(todayIds(x)[0]).start).localeCompare(String(B.events.get(todayIds(y)[0]).start)));
  const todayStar = (o) => { const ids = todayIds(o); const e = B.events.get(ids[0]);
    return `<a class="gx-star" href="${pathOf('organiser', o.id)}"><span class="n">${ids.length}</span><strong>${esc(o.name)}</strong><span class="muted">today${e.start ? `, from ${esc(e.start.slice(11, 16))}` : ''}${e.place ? ` · ${esc(name('place', e.place))}` : ''}</span></a>`; };
  const stars = m.organisers.filter((o) => o.lead.length >= 2 || o.festivals.length);
  const rest = m.organisers.filter((o) => !stars.includes(o));
  write(PREFIX.organiser, 'Organisers', `<h1>The organisers</h1><p>The people who make this week are its organisers: organisations, never a private person. Each links to its events, places, days and partners.</p>
${m.festivals.length ? `<p class="muted">Festivals</p>${chips('festival', m.festivals.map((f) => f.id))}` : ''}
<h2>Today in Lisbon: ${nowOrgs.length} organisers</h2>${nowOrgs.length ? `<div class="gx-grid">${nowOrgs.map(todayStar).join('')}</div>` : '<p class="muted">None leads an event in Lisbon today.</p>'}
<h2>The week's stars</h2><p class="muted">Leading two or more events this week, or running a festival.</p><div class="gx-grid">${stars.map(star).join('')}</div>
<details><summary>Everyone else: ${rest.length} organisations with one event, or named as partner, host or sponsor</summary>${chips('organiser', rest.map((o) => o.id))}</details>
<p class="muted">${events.length - m.events.filter((e) => e.organisers.length).length} events name no organisation (a personal calendar, or an independent organiser) and are not listed here. What we offer organisers: <a href="/organisers/">/organisers/</a>.</p>${api('organisers')}`,
  'The organisations behind today\'s side events in Lisbon, and the week\'s: who runs what, where and when.');

  // --- festivals ---------------------------------------------------------------------------------------------------
  for (const f of m.festivals) write(`${PREFIX.festival}/${f.id}`, f.name, `<p class="gx-up"><a href="/o/">Organisers</a></p><h1>${esc(f.name)}</h1>
<p>A festival: a week-long programme that holds many events.${f.organiser ? ` Run by ${a('organiser', f.organiser)}.` : ''}</p>${links(f.links)}
<p class="muted">Days</p>${chips('day', f.days)}
<h2>${f.events.length} events it runs, or a partner runs under its name</h2><p class="muted">${esc(f.holds_when || '')}</p>
<p class="muted">With</p>${chips('organiser', orgsOf(f.events).filter((x) => x !== f.organiser))}${evList(f.events)}
<h2>${f.listed.length} more in its public feed</h2><p class="muted">${esc(f.lists_when || '')}; run by their own organisers.</p>${evList(f.listed)}${api('festivals')}`,
  `${f.name}: every event it holds and lists this week in Lisbon.`);

  // --- days, places, personas, topics ------------------------------------------------------------------------------
  for (const d of m.days) write(`${PREFIX.day}/${d.id}`, d.name, `<h1>${esc(d.name)}</h1>${d.festivals.length ? `<p class="muted">Festivals on</p>${chips('festival', d.festivals)}` : ''}
<p class="muted">Organisers</p>${chips('organiser', orgsOf(d.events))}<p class="muted">Places</p>${chips('place', neighbours(d.events, 'place'))}
<p class="muted">For</p>${chips('persona', neighbours(d.events, 'personas'))}<h2>${d.events.length} events</h2>${evList(d.events)}${api('days')}`, `Every side event in Lisbon on ${d.name}.`);
  for (const p of m.places) write(`${PREFIX.place}/${p.id}`, p.name, `<h1>${esc(p.name)}</h1><p>${p.city === 'online' ? 'Online events.' : p.city === 'Lisbon' ? (p.name === 'Lisbon' ? 'In Lisbon, where the page names no neighbourhood (often: the address goes to guests).' : 'A neighbourhood of Lisbon.') : `<strong>Not in Lisbon:</strong> ${esc(p.city)}.`}</p>
<p class="muted">Days</p>${chips('day', neighbours(p.events, 'day'))}<p class="muted">Organisers</p>${chips('organiser', orgsOf(p.events))}<h2>${p.events.length} events</h2>${evList(p.events)}${api('places')}`, `Side events this week in ${p.name}.`);
  for (const p of m.personas) write(`${PREFIX.persona}/${p.id}`, p.name, `<h1>${esc(p.ask)}</h1><p>Events for: <strong>${esc(p.name)}</strong> (a role, never a person). <span class="muted">By rule, a hypothesis: ${esc(p.rule)}.</span></p>
<p class="muted">Days</p>${chips('day', neighbours(p.events, 'day'))}<p class="muted">Organisers</p>${chips('organiser', orgsOf(p.events).slice(0, 30))}<h2>${p.events.length} events</h2>${evList(p.events)}${api('personas')}`, `This week's Lisbon side events for: ${p.name}.`);
  for (const t of m.topics) write(`${PREFIX.topic}/${t.id}`, t.name, `<h1>${esc(t.name)}</h1><p class="muted">Organisers</p>${chips('organiser', orgsOf(t.events))}<h2>${t.events.length} events</h2>${evList(t.events)}${api('topics')}`, `Side events in Lisbon this week about ${t.name}.`);
  // --- sessions: each with its event, festival, day and place ---------------------------------------------------
  const hm = (t) => (t ? String(t).slice(11, 16) : '');
  const sessList = (ids) => `<ol class="gx-ev">${ids.map((id) => B.sessions.get(id)).map((x) => `<li><span class="muted">${esc(hm(x.start))}–${esc(hm(x.end))}</span> ${a('session', x.id)}${x.kind && x.kind !== 'talk' ? ` <span class="muted">· ${esc(x.kind)}</span>` : ''}</li>`).join('')}</ol>`;
  for (const x of m.sessions) {
    const sib = B.events.get(x.event).sessions; const i = sib.indexOf(x.id);
    write(`${PREFIX.session}/${x.id}`, x.name, `<p class="gx-up">A session of ${evLink(x.event)}</p><h1>${esc(x.name)}</h1>
<p><strong>${esc(hm(x.start))}–${esc(hm(x.end))} UTC</strong> (Lisbon time) on ${a('day', x.day)}${x.place ? ` · ${a('place', x.place)}` : ''}${x.festival ? ` · part of ${a('festival', x.festival)}` : ''}</p>
<p class="muted">From the agenda on <a href="${esc(x.url)}">the event's own page</a>, read ${esc(String(x.read_at).slice(0, 16).replace('T', ' '))} UTC. Timings may change: their page is the one that counts.</p>
<p>${i > 0 ? `&larr; ${a('session', sib[i - 1])}` : ''}${i > 0 && i < sib.length - 1 ? ' · ' : ''}${i < sib.length - 1 ? `${a('session', sib[i + 1])} &rarr;` : ''}</p>
<h2>The whole agenda</h2>${sessList(sib)}${api('sessions')}`, `${x.name}: a session at ${B.events.get(x.event).name}, ${hm(x.start)} UTC.`);
  }

  const today = BUILT.slice(0, 10);
  for (const r of m.platforms) {
    const now = r.events.filter((id) => B.events.get(id).day === today), later = r.events.filter((id) => B.events.get(id).day !== today);
    write(`${PREFIX.platform}/${r.id}`, `Events on ${r.name}`, `<p class="gx-up"><a href="/graph/types/">The graph</a></p><h1>Events you register for on ${esc(r.name)}</h1>
<p>${r.id === 'own-site' ? `Events whose page is on the organiser's own site${r.hosts.length ? ` (${r.hosts.map(esc).join(', ')})` : ''}.` : `Registration is on ${esc(r.name)}: their page is the one that counts.`}</p>
<p class="muted">Organisers</p>${chips('organiser', orgsOf(r.events))}
<h2>Today: ${now.length} event${now.length === 1 ? '' : 's'}</h2>${now.length ? evList(now) : '<p class="muted">None today.</p>'}
${later.length ? `<h2>The rest of the week: ${later.length}</h2>${evList(later)}` : ''}${api('platforms')}`,
    `Lisbon side events this week that you register for on ${r.name}.`);
  }
  write('graph/types', 'The graph, by type', `<h1>The graph, by type</h1><p>Every thing on the site is linked to everything it touches. Who are you? ${chips('persona', m.personas.map((p) => p.id))}</p>
<h2>Days</h2>${chips('day', m.days.map((d) => d.id))}${m.sessions.length ? `<h2>Events with an agenda</h2>${chips('event', [...new Set(m.sessions.map((x) => x.event))])}` : ''}<h2>Festivals</h2>${chips('festival', m.festivals.map((f) => f.id))}<h2>Organisers</h2><p><a href="/o/">All ${m.organisers.length}</a></p>
<h2>Places</h2>${chips('place', m.places.map((p) => p.id))}<h2>Where you register</h2>${chips('platform', m.platforms.map((r) => r.id))}<h2>Topics</h2>${chips('topic', m.topics.map((t) => t.id))}
<h2>The grammar</h2><p class="muted">Every link is a verb, read both ways; nothing merely "relates to" anything (the five rules of <a href="https://newsroom.sgit.ai/articles/introducing-fractal-semantic-graphs.html">fractal semantic graphs</a>). Every link that comes from an event carries that event's page and the time it was read.</p>
<table class="gx-gram"><thead><tr><th>A …</th><th>verb</th><th>a …</th><th>read back</th><th>links</th></tr></thead><tbody>${Object.entries(GRAMMAR).map(([v, g]) => `<tr><td>${esc(g.from)}</td><td><strong>${esc(g.says)}</strong> <code>${esc(v)}</code></td><td>${esc(g.to)}</td><td>${esc(g.to)} <em>${esc(g.inverse)}</em> ${esc(g.from)}</td><td>${m.links.filter((l) => l.verb === v).length}</td></tr>`).join('')}</tbody></table>
<h2>As data</h2><ul>${TYPES.map((t) => `<li><a href="/api/v1/graph/${t}.json">/api/v1/graph/${t}.json</a></li>`).join('')}<li><a href="/api/v1/graph/links.json">/api/v1/graph/links.json</a> (every typed link)</li></ul>`,
  'Lisbon Tech Fringe as a semantic graph: days, festivals, organisers, events, places, personas and topics.');

  // --- the API -----------------------------------------------------------------------------------------------------
  mkdirSync(join(out, 'api', 'v1', 'graph'), { recursive: true });
  const head = (t) => ({ about: `Lisbon Tech Fringe semantic graph (work/42): ${t}. Derived from data/events.json at build time; organisations only; no contact details. Independent of Web Summit.`, site: SITE, version: VERSION, built_at: BUILT, type: t });
  const withPage = (x) => ({ ...x, page: SITE + pathOf(x.type, x.id).slice(1) });
  for (const t of TYPES) writeFileSync(join(out, 'api', 'v1', 'graph', `${t}.json`), JSON.stringify({ ...head(t), [t]: m[t].map((x) => (t === 'events' ? { ...x, page: (() => { const s = events.find((e) => e.id === x.id); return s && hasPage(s) ? SITE + eventPath(s).slice(1) : x.url; })() } : withPage(x))) }, null, 1) + '\n');
  writeFileSync(join(out, 'api', 'v1', 'graph', 'links.json'), JSON.stringify({ ...head('links'), verbs: VERBS, grammar: GRAMMAR, links: m.links }, null, 1) + '\n');
  writeFileSync(join(out, 'api', 'v1', 'graph', 'index.json'), JSON.stringify({ ...head('index'), types: Object.fromEntries([...TYPES, 'links'].map((t) => [t, { url: `${SITE}api/v1/graph/${t}.json`, count: (m[t] || []).length }])), verbs: VERBS, grammar: GRAMMAR, pages: Object.fromEntries(Object.entries(PREFIX).map(([k, p]) => [k, `/${p}/<id>/`])) }, null, 1) + '\n');
  // The event page's row of links to every neighbour (organiser, umbrella, day, place, platform, persona, topic).
  const eventLinks = (id) => {
    const e = B.events.get(id); if (!e) return '';
    const row = (k, v) => v ? `<dt>${k}</dt><dd class="gx-chips">${v}</dd>` : '';
    return `<style>${CSS}</style>` + row('Organisers', e.organisers.map((o) => a('organiser', o.id)).join(''))
      + row('Festival', [e.festival, ...e.listed_by].filter(Boolean).map((f) => a('festival', f, name('festival', f) + (f === e.festival ? '' : ' (in its feed)'))).join(''))
      + row('Day', a('day', e.day)) + row('Place', e.place ? a('place', e.place) + (e.in_lisbon || e.city === 'online' ? '' : ` <strong>not in Lisbon</strong>`) : '')
      + row('Register on', e.platform ? a('platform', e.platform) : '') + row('For', e.personas.map((p) => a('persona', p)).join(''))
      + row('About', e.topics.map((t) => a('topic', t)).join(''))
      + (e.sessions.length ? row('Sessions', `${e.sessions.length} on the agenda`) + `<dt></dt><dd>${sessList(e.sessions)}</dd>` : '');
  };
  return { ...m, eventLinks };
}
