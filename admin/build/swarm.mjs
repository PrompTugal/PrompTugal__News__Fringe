// /dashboard/ and /api/v1/swarm.json (work/25, dev.1.fringe@PrompTugal.dinis, 11 November 2026, at Dinis's word, brief 4:
// "I want to visualize how many conductors we actually have online ... I should have a dashboard for me to understand
// everything."). Reads team/roster.json, team/*/status.json, team/*/agents/*.json, data/inboxes/, work/ and work/design/,
// git log and data/obs/traffic.json. Public repository files only: no key, no contact detail. "Online" means the status
// file was updated in the last ONLINE_MIN minutes; the page's small script recomputes it from `updated` against the
// browser's clock after re-reading /api/v1/swarm.json. A time we cannot parse is "unknown", never "online".
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { talkBox } from './me.mjs';

export const ONLINE_MIN = 90;
const MAX_PROMPT = 200;

const clip = (s, n = MAX_PROMPT) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
const jread = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };
const parseT = (s) => { const t = Date.parse(s || ''); return Number.isNaN(t) ? null : t; };
const nameRole = (name) => String(name || '').split('.')[0].split('@')[0] || 'unknown';

function fm(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/); const o = {};
  if (m) for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"(.*)"$/, '$1'); }
  return o;
}

function changes(root, repo) {
  const fmt = '%h%x1f%aI%x1f%s';
  const parse = (out) => out.split('\n').filter(Boolean).map((l) => { const [hash, at, subject] = l.split('\x1f'); return { hash, at, subject: clip(subject, 160) }; });
  let list = [];
  try { list = parse(execFileSync('git', ['log', '-20', `--format=${fmt}`], { cwd: root, encoding: 'utf8', timeout: 10000 })); } catch { /* no git */ }
  return { list, shallow: list.length < 20 };
}

export async function collectSwarm({ root, roster, status, board, traffic, builtAt, repo }) {
  const now = parseT(builtAt);
  const stamp = (updated) => {
    const t = parseT(updated);
    return { updated: updated || null, age_min: t == null ? null : Math.max(0, Math.round((now - t) / 60000)), online: t != null && now - t <= ONLINE_MIN * 60000 };
  };
  const asks = [];
  const addAsks = (who, list) => asList(list).forEach((a) => asks.push({ from: who, text: clip(a, 400), to_dinis: /^\s*dinis\s*:/i.test(a) }));

  // people and their conductors
  const people = roster.people.map((p) => {
    const s = status[p.id];
    const st = stamp(s?.updated);
    addAsks(p.conductor, s?.asks);
    return {
      id: p.id, name: p.name, conductor: p.conductor, role: p.role, lane: s?.lane || p.suggested_lane, account: p.id,
      model: s?.model || null, started: !!s && !/^not started/i.test(p.state || '') || !!s,
      ...st, doing: asList(s?.doing).map((d) => clip(d)), state: clip(s?.state || p.state, 240),
    };
  });

  // agents: team/<id>/agents/*.json, plus agents a status file lists without a file of their own
  const agents = []; const seen = new Set();
  for (const d of readdirSync(join(root, 'team'))) {
    const dir = join(root, 'team', d, 'agents');
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      const a = jread(join(dir, f)) || {};
      const name = a.agent || a.by || f.replace(/\.json$/, '');
      seen.add(name); addAsks(name, a.asks);
      agents.push({ name, role: nameRole(name), account: a.account || d, person: d, model: a.model || (/fable/i.test(name) ? 'Fable' : null), wake: clip(a.wake, 80) || null,
        ...stamp(a.updated), state: clip(a.state, 240), doing: asList(a.doing).map((x) => clip(x)), file: `team/${d}/agents/${f}`, listed_only: false });
    }
  }
  for (const [pid, s] of Object.entries(status)) for (const a of asList(s.agents).map((x) => (typeof x === 'string' ? { name: x } : x))) {
    if (!a?.name || seen.has(a.name) || a.name === people.find((p) => p.id === pid)?.conductor) continue;
    seen.add(a.name);
    agents.push({ name: a.name, role: nameRole(a.name), account: a.account || pid, person: pid, model: a.model || null, wake: clip(a.wake, 80) || null,
      updated: null, age_min: null, online: false, state: 'listed in the status file of ' + pid + '; no status file of its own', doing: a.doing ? [clip(a.doing)] : [], file: `team/${pid}/status.json`, listed_only: true });
  }

  // inboxes: the lane exists; the count of waiting messages is read by the owner's drain, so it is unknown here
  const counts = jread(join(root, 'data/inbox-counts.json'))?.counts || {};
  const inboxes = existsSync(join(root, 'data/inboxes')) ? readdirSync(join(root, 'data/inboxes')).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const i = jread(join(root, 'data/inboxes', f)) || {};
    return { id: i.id || f.replace(/\.json$/, ''), agent: i.agent || null, updated: i.updated || null, messages: Number.isInteger(counts[i.id]) ? counts[i.id] : null };
  }) : [];

  // the board
  const tally = (items) => { const t = { open: 0, claimed: 0, done: 0, other: 0 }; for (const b of items) t[b.status in t ? b.status : 'other']++; return t; };
  const items = (dir) => existsSync(dir) ? readdirSync(dir).filter((f) => /^[A-Za-z]?\d+.*\.md$/.test(f)).sort().map((f) => ({ file: f, ...fm(readFileSync(join(dir, f), 'utf8')) })) : [];
  const work = items(join(root, 'work')); const design = items(join(root, 'work', 'design'));
  const slim = (b) => ({ id: b.id, title: clip(b.title, 120), owner: b.owner || null, status: b.status || 'open', lane: b.lane || null });

  const ch = changes(root, repo);
  const online = (l) => l.filter((x) => x.online).length;
  const byAcc = {};
  for (const x of [...people.filter((p) => p.updated), ...agents]) { const a = (byAcc[x.account] ||= { account: x.account, online: 0, total: 0 }); a.total++; if (x.online) a.online++; }
  const t = traffic?.totals || null;
  // health of the ecosystem (brief 6): who is onboarded, who can be reached, how the data flows
  const ev = jread(join(root, 'data/events.json'))?.events || [];
  const reads = ev.map((e) => e.read_at).filter(Boolean).sort();
  const keys = (jread(join(root, 'data/keys.json'))?.keys || []).filter((k) => !k.status || k.status === 'active').length;
  const pk = (jread(join(root, 'data/person-keys.json'))?.keys || []).filter((k) => !k.status || k.status === 'active').length;
  const outreach = jread(join(root, 'data/outreach.json'));
  const health = {
    onboarded: people.filter((p) => p.updated).map((p) => p.id), not_onboarded: people.filter((p) => !p.updated).map((p) => p.id),
    keys_active: keys, person_keys: pk, inboxes: inboxes.length,
    events: { count: ev.length, oldest_read: reads[0] || null, newest_read: reads.at(-1) || null, stale_over_3h: reads.filter((r) => now - parseT(r) > 3 * 3600000).length },
    traffic_drained: traffic?.generated || null,
  };

  return {
    about: `Lisbon Fringe's swarm, built from the repository's team/, work/ and data/ files. "online" means the status file was updated in the last ${ONLINE_MIN} minutes (UTC). Counts only; no key, contact detail or private person. Independent of Web Summit.`,
    built_at: builtAt, online_minutes: ONLINE_MIN,
    counts: {
      conductors_online: online(people), conductors_started: people.filter((p) => p.updated).length, conductors_total: people.length,
      agents_online: online(agents), agents_total: agents.length,
      inboxes: inboxes.length,
      by_account: Object.values(byAcc).sort((a, b) => b.online - a.online || a.account.localeCompare(b.account)),
    },
    people, agents, inboxes,
    board: { work: tally(work), design: tally(design), items: work.map(slim), design_items: design.map(slim) },
    asks_for_dinis: asks.filter((a) => a.to_dinis), asks_other: asks.filter((a) => !a.to_dinis).length,
    changes: ch.list, changes_note: ch.shallow ? 'The build checkout is shallow, so fewer than 20 changes are shown; the full list is at ' + repo + '/commits/dev.' : null,
    health, outreach: outreach ? { updated: outreach.updated, by: outreach.by, drafts_ready: outreach.drafts_ready, organisers_listed: outreach.organisers_listed, contacted: outreach.contacted, answered: outreach.answered, joined: outreach.joined } : null,
    traffic: t ? { generated: traffic.generated, views: t.views, reads: t.reads, tabs: t.tabs, countries: t.countries, shares: t.shares } : null,
  };
}

export const swarmCss = `.sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}.sg .card{margin:0}.sg b{display:block;font-size:1.6rem;line-height:1.1}
.row{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.dot{width:.7em;height:.7em;border-radius:50%;background:#999;display:inline-block;flex:none}.dot.on{background:var(--accent)}
.sw li{list-style:none;margin:0}.sw ul{padding:0}.sw .card .muted{margin:.2em 0 0}.bar{display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--line)}.bar i{display:block;height:100%}
.bar .d{background:var(--accent)}.bar .c{background:#2f6fd6}.bar .o{background:#c7a100}.ask{border-left:4px solid #d33}`;

export function swarmBody(s, esc, repo) {
  const c = s.counts;
  const age = (x) => (x.age_min == null ? 'time unknown' : x.age_min < 60 ? `${x.age_min} min ago` : `${Math.floor(x.age_min / 60)} h ${x.age_min % 60} min ago`);
  const who = (x, name, extra) => `<li class="card" data-u="${esc(x.updated || '')}"><div class="row"><span class="dot ${x.online ? 'on' : ''}" title="${x.online ? 'online' : 'not online'}"></span><strong>${esc(name)}</strong><span class="muted">${extra}</span></div>` +
    `<p class="muted"><span class="st">${x.online ? 'online' : x.updated ? 'quiet' : 'no status yet'}</span>${x.updated ? `, updated ${esc(x.updated)} (<span class="ag">${age(x)}</span>)` : ''}</p>` +
    (x.doing?.length ? `<p>${esc(x.doing[0])}</p>` : x.state ? `<p class="muted">${esc(x.state)}</p>` : '') + '</li>';
  const bar = (t) => { const n = t.open + t.claimed + t.done + t.other || 1; return `<div class="bar" role="img" aria-label="${t.done} done, ${t.claimed} claimed, ${t.open} open"><i class="d" style="width:${100 * t.done / n}%"></i><i class="c" style="width:${100 * t.claimed / n}%"></i><i class="o" style="width:${100 * t.open / n}%"></i></div><p class="muted">${t.done} done · ${t.claimed} claimed · ${t.open} open</p>`; };
  const asks = s.asks_for_dinis.length ? `<ul>${s.asks_for_dinis.map((a) => `<li class="card ask"><strong>${esc(a.from)}</strong><br>${esc(a.text)}</li>`).join('')}</ul>` : '<p class="muted">Nobody is asking Dinis anything right now.</p>';
  return `<div class="sw"><h1>The swarm</h1>
<p>Who is on, across accounts, now. Built ${esc(s.built_at.slice(0, 16).replace('T', ' '))} UTC from the repository; <span id="live">re-reading <a href="/api/v1/swarm.json">swarm.json</a> in your browser…</span> “Online” means a status file updated in the last ${s.online_minutes} minutes.</p>
<div class="sg" id="counts"><div class="card"><b id="n-c">${c.conductors_online}</b>conductors online (of ${c.conductors_started} started, ${c.conductors_total} people)</div><div class="card"><b id="n-a">${c.agents_online}</b>agents online (of ${c.agents_total})</div><div class="card"><b>${c.inboxes}</b>inboxes</div>${s.traffic ? `<div class="card"><b>${s.traffic.views}</b>views (<a href="/traffic/">traffic</a>)</div>` : ''}</div>
<h2>Health of the ecosystem</h2><ul>
<li class="card"><strong>Onboarded:</strong> ${s.health.onboarded.length} of ${s.people.length} people have a conductor with a status file${s.health.not_onboarded.length ? `. <span class="muted">Not yet: ${esc(s.health.not_onboarded.join(', '))}.</span>` : '.'}</li>
<li class="card"><strong>Can be reached:</strong> ${s.health.keys_active} active agent keys, ${s.health.inboxes} inboxes, ${s.health.person_keys} person key${s.health.person_keys === 1 ? '' : 's'} on the site${s.health.person_keys ? '' : ' (Dinis: make yours at <a href="/me/">/me/</a>)'}.</li>
<li class="card"><strong>Data flow:</strong> ${s.health.events.count} events, read at their sources between ${esc((s.health.events.oldest_read || '?').slice(11, 16))} and ${esc((s.health.events.newest_read || '?').slice(11, 16))} UTC; ${s.health.events.stale_over_3h} read more than 3 h before this build. Traffic ${s.health.traffic_drained ? 'last drained ' + esc(s.health.traffic_drained) + ' UTC' : 'not drained yet'}.</li></ul>
<h2>Outreach</h2>${s.outreach ? `<div class="sg"><div class="card"><b>${s.outreach.drafts_ready}</b>drafts ready</div><div class="card"><b>${s.outreach.organisers_listed}</b>organisers listed</div><div class="card"><b>${s.outreach.contacted}</b>contacted</div><div class="card"><b>${s.outreach.answered}</b>answered</div><div class="card"><b>${s.outreach.joined}</b>joined</div></div><p class="muted">From data/outreach.json, kept by ${esc(s.outreach.by || '')} at ${esc(s.outreach.updated || '')}. An agent never sends: a person does. Work with the desk: <a href="${repo}/blob/dev/work/29-outreach-desk.md">work/29</a>, drafts in <a href="${repo}/tree/dev/work/drafts">work/drafts</a>.</p>` : '<p class="muted">No outreach counts yet (work/29).</p>'}
<h2>By account</h2><p class="muted">The account is the person whose team/ folder the status file is in, unless the file says otherwise.</p><ul>${c.by_account.map((a) => `<li class="card"><strong>${esc(a.account)}</strong>: ${a.online} online of ${a.total}</li>`).join('')}</ul>
<h2>Dinis: asks waiting for you</h2>${asks}
${talkBox()}
<h2>Conductors</h2><ul>${s.people.map((p) => who(p, p.conductor, `${esc(p.name)} · ${esc(p.lane || '')}`)).join('')}</ul>
<h2>Agents</h2><ul>${s.agents.map((a) => who(a, a.name, `${esc(a.role)} · ${esc(a.account)}${a.model ? ' · ' + esc(a.model) : ''}`)).join('')}</ul>
<h2>The board</h2><h3>Work</h3>${bar(s.board.work)}<h3>Design</h3>${bar(s.board.design)}
<p class="muted"><a href="${repo}/tree/dev/work">All items</a></p>
<h2>Inboxes</h2><p class="muted">Each agent with a key has a write-only inbox (work/19). Waiting messages are read by the owner's drain, so a count shows only when the lead publishes data/inbox-counts.json.</p><ul>${s.inboxes.map((i) => `<li class="card">${esc(i.agent || i.id)}: ${i.messages == null ? 'count unknown' : i.messages + ' messages'}</li>`).join('')}</ul>
<h2>The last ${s.changes.length} changes</h2>${s.changes_note ? `<p class="muted">${esc(s.changes_note)}</p>` : ''}<ul>${s.changes.map((x) => `<li class="card"><a href="${repo}/commit/${esc(x.hash)}"><code>${esc(x.hash)}</code></a> <span class="muted">${esc(x.at.slice(11, 16))} UTC</span><br>${esc(x.subject)}</li>`).join('')}</ul>
<p class="muted">The data behind this page: <a href="/api/v1/swarm.json">/api/v1/swarm.json</a>.</p></div>`;
}

// the small script: re-reads swarm.json and recomputes "online" from `updated` against the browser's clock
export const swarmScript = `<script>(function(){var M=${ONLINE_MIN};function ok(u){var t=Date.parse(u||'');return !isNaN(t)&&Date.now()-t<=M*6e4}
fetch('/api/v1/swarm.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(s){var c=0,a=0;(s.people||[]).forEach(function(p){if(ok(p.updated))c++});(s.agents||[]).forEach(function(p){if(ok(p.updated))a++});
document.getElementById('n-c').textContent=c;document.getElementById('n-a').textContent=a;
document.getElementById('live').textContent='counted again in your browser at '+new Date().toISOString().slice(11,16)+' UTC (data built '+s.built_at.slice(11,16)+').';
document.querySelectorAll('li[data-u]').forEach(function(li){var o=ok(li.getAttribute('data-u'));li.querySelector('.dot').className='dot'+(o?' on':'');if(li.getAttribute('data-u'))li.querySelector('.st').textContent=o?'online':'quiet'})}).catch(function(){document.getElementById('live').textContent='could not re-read it just now.'})})();</script>`;
