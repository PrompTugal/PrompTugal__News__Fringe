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
  const log = () => { try { return parse(execFileSync('git', ['log', '-30', `--format=${fmt}`], { cwd: root, encoding: 'utf8', timeout: 10000 })); } catch { return []; } };
  list = log();
  // CI clones with depth 1 (CLAUDE.md): deepen a little, best effort, only in CI, so the page has a recent history
  if (list.length < 30 && process.env.GITHUB_SHA) { try { execFileSync('git', ['fetch', '-q', '--depth=40', 'origin', 'dev'], { cwd: root, timeout: 20000, stdio: 'ignore' }); list = log(); } catch { /* keep what we have */ } }
  return { list: list.slice(0, 30), shallow: list.length < 20 };
}

export async function collectSwarm({ root, roster, status, board, traffic, activity, builtAt, repo }) {
  const now = parseT(builtAt);
  const stamp = (updated) => {
    const t = parseT(updated);
    return { updated: updated || null, age_min: t == null ? null : Math.max(0, Math.round((now - t) / 60000)), online: t != null && now - t <= ONLINE_MIN * 60000 };
  };
  const asks = [];
  const addAsks = (who, list, at) => asList(list).forEach((a) => asks.push({ from: who, at: at || '', text: clip(a, 400), to_dinis: /^\s*dinis\s*:/i.test(a) }));

  // people and their conductors
  const people = roster.people.map((p) => {
    const s = status[p.id];
    const st = stamp(s?.updated);
    addAsks(p.conductor, s?.asks, s?.updated);
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
      seen.add(name); addAsks(name, a.asks, a.updated);
      agents.push({ name, role: nameRole(name), account: a.account || d, person: d, model: a.model || (/fable/i.test(name) ? 'Fable' : null), wake: clip(a.wake, 80) || null,
        ...stamp(a.updated), state: clip(a.state, 240), doing: asList(a.doing).map((x) => clip(x)), file: `team/${d}/agents/${f}`, listed_only: false });
    }
  }
  // (objects are kept as objects: asList() would turn them into JSON text, which then never matched `seen`)
  for (const [pid, s] of Object.entries(status)) for (const a of (Array.isArray(s.agents) ? s.agents : s.agents ? [s.agents] : []).map((x) => (typeof x === 'string' ? { name: x } : x))) {
    if (!a?.name || seen.has(a.name) || a.name === people.find((p) => p.id === pid)?.conductor) continue;
    seen.add(a.name);
    agents.push({ name: a.name, role: nameRole(a.name), account: a.account || pid, person: pid, model: a.model || null, wake: clip(a.wake, 80) || null,
      updated: null, age_min: null, online: false, state: 'stopped or not reporting: listed in the status file of ' + pid + ', no status file of its own', doing: a.doing ? [clip(a.doing)] : [], file: `team/${pid}/status.json`, listed_only: true });
  }

  // inboxes: the lane exists; the count of waiting messages is read by the owner's drain, so it is unknown here
  const counts = jread(join(root, 'data/inbox-counts.json'))?.inboxes || {};
  const inboxes = existsSync(join(root, 'data/inboxes')) ? readdirSync(join(root, 'data/inboxes')).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const i = jread(join(root, 'data/inboxes', f)) || {};
    return { id: i.id || f.replace(/\.json$/, ''), agent: i.agent || null, updated: i.updated || null, messages: Number.isInteger(counts[i.id]?.messages) ? counts[i.id].messages : null, last_at: counts[i.id]?.last_at || null };
  }) : [];

  // the board
  const tally = (items) => { const t = { open: 0, claimed: 0, done: 0, other: 0 }; for (const b of items) t[b.status in t ? b.status : 'other']++; return t; };
  const items = (dir) => existsSync(dir) ? readdirSync(dir).filter((f) => /^[A-Za-z]?\d+.*\.md$/.test(f)).sort().map((f) => ({ file: f, ...fm(readFileSync(join(dir, f), 'utf8')) })) : [];
  const work = items(join(root, 'work')); const design = items(join(root, 'work', 'design'));
  const slim = (b) => ({ id: b.id, title: clip(b.title, 120), owner: b.owner || null, status: b.status || 'open', lane: b.lane || null });

  const ch = changes(root, repo);
  const online = (l) => l.filter((x) => x.online).length;
  const byAcc = {};
  for (const x of [...people.filter((p) => p.updated), ...agents.filter((a) => !a.listed_only)]) { const a = (byAcc[x.account] ||= { account: x.account, online: 0, total: 0 }); a.total++; if (x.online) a.online++; }
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

  // the five sections of the control centre (brief 6), each with a health colour: green, amber or red
  const hrs = (iso) => (iso && parseT(iso) ? (now - parseT(iso)) / 3600000 : null);
  const lastBy = {}; for (const c of ch.list) { const m = /^([A-Za-z0-9._-]+@PrompTugal\.[A-Za-z0-9_-]+):/.exec(c.subject); if (m && !lastBy[m[1]]) lastBy[m[1]] = c.at; }
  const dinisAsks = asks.filter((a) => a.to_dinis).length;
  const stale = health.events.stale_over_3h, newest = hrs(health.events.newest_read);
  const trafficAge = hrs(traffic?.generated);
  const lastHour = (traffic?.by_hour || []).at(-1) || null;
  const via = (traffic?.by_via || []).slice(0, 8);
  const hc = (ok, warn) => (ok ? 'green' : warn ? 'amber' : 'red');
  const ago = (h) => (h == null ? 'never' : h < 1 ? Math.round(h * 60) + ' min ago' : h.toFixed(1) + ' h ago');

  // Jose's dashboard proposal (work/drafts/jose/dashboard-proposal.md), approved by Dinis about 18:10 UTC, 11 Nov 2026;
  // built by conductor.fringe@PrompTugal.jose. Additive: every field above stays as it was.
  // (1) for readers, now: what someone in Lisbon gets from the site at this hour
  const today = String(builtAt || '').slice(0, 10);
  const toCome = ev.filter((e) => e.date === today && parseT(e.start) != null && parseT(e.start) >= now && e.status !== 'cancelled');
  const viaViews = traffic?.via_detail ? Object.entries(traffic.via_detail).map(([k, v]) => [k, v?.views ?? 0]) : (traffic?.by_via || []).map(([k, n]) => [k, n]);
  const readers = {
    today, events_to_come_today: toCome.length, online_to_come_today: toCome.filter((e) => e.status === 'online').length,
    reread_last_hour: ev.filter((e) => { const r = parseT(e.read_at); return r != null && r <= now && now - r <= 3600000; }).length,
    views_last_hour: lastHour ? { hour: lastHour[0], views: lastHour[1] } : null,
    views_by_channel: viaViews.sort((a, b) => b[1] - a[1]),
  };
  // (2) outreach as a funnel, with who sent each note (organisations only; the sender is a team id)
  const tracker = jread(join(root, 'data/outreach-tracker.json'))?.organisers || [];
  const outreach_sent = tracker.filter((r) => r.state && r.state !== 'drafted')
    .map((r) => ({ organiser: clip(r.organiser, 90), state: r.state, sent_by: r.sent_by || null, sent_at: r.sent_at || null }))
    .sort((a, b) => String(b.sent_at).localeCompare(String(a.sent_at)) || a.organiser.localeCompare(b.organiser));
  const sent_by = {}; for (const r of outreach_sent) if (r.sent_by) sent_by[r.sent_by] = (sent_by[r.sent_by] || 0) + 1;
  const organiser_visits = viaViews.find(([k]) => k === 'organiser')?.[1] ?? 0;
  // (3) today, by person: a status file's `today` list when it has one, else its latest timed `done` lines
  const timeOf = (x) => { const m = /^\D{0,12}?(\d{1,2}):(\d{2})/.exec(String(x)); return m ? +m[1] * 60 + +m[2] : null; };
  const today_by_person = people.filter((p) => status[p.id]).map((p) => {
    const s = status[p.id];
    if (Array.isArray(s.today) && s.today.length) return { id: p.id, name: p.name, source: 'today', items: asList(s.today).slice(0, 3).map((x) => clip(x, 170)), updated: s.updated || null };
    const d = asList(s.done).map((x, i) => ({ x, i, t: timeOf(x) }));
    const timed = d.filter((o) => o.t != null).sort((a, b) => b.t - a.t || b.i - a.i);
    return { id: p.id, name: p.name, source: 'latest done', items: (timed.length ? timed.slice(0, 2) : d.slice(-2)).map((o) => clip(o.x, 170)), updated: s.updated || null };
  });
  // (4) the asks for Dinis, ranked: a deadline still ahead first (soonest), then urgent, then newest; a passed deadline last
  const dueOf = (txt) => { const m = /\b(?:before|by|until)\s+(\d{1,2}):(\d{2})/i.exec(txt); if (!m || +m[1] > 23 || +m[2] > 59) return null; const d = new Date(now); d.setUTCHours(+m[1], +m[2], 0, 0); return d.getTime(); };
  const dinis_ranked = asks.filter((a) => a.to_dinis).map((a) => {
    const due = dueOf(a.text), urgent = /\b(urgent|asap|blocked|blocking|right now)\b/i.test(a.text);
    const tier = due != null && due >= now ? 0 : urgent ? 1 : due == null ? 2 : 3;
    return { from: a.from, at: a.at || null, text: a.text, due: due == null ? null : new Date(due).toISOString().slice(0, 16) + 'Z', urgent, tier };
  }).sort((x, y) => x.tier - y.tier || (x.tier === 0 ? x.due.localeCompare(y.due) : String(y.at).localeCompare(String(x.at))));
  // the top three come from three different senders where possible, so one busy status file cannot fill them
  const dinis_top = []; for (const a of dinis_ranked) if (dinis_top.length < 3 && !dinis_top.some((b) => b.from === a.from)) dinis_top.push(a);
  for (const a of dinis_ranked) if (dinis_top.length < 3 && !dinis_top.includes(a)) dinis_top.push(a);
  dinis_ranked.sort((x, y) => (dinis_top.includes(y) ? 1 : 0) - (dinis_top.includes(x) ? 1 : 0) || dinis_top.indexOf(x) - dinis_top.indexOf(y));
  // (5) only the exceptions: conductors and agents that are quiet or not reporting
  const exceptions = [
    ...people.filter((p) => p.updated && !p.online).map((p) => ({ name: p.conductor, kind: 'conductor', why: 'quiet', age_min: p.age_min })),
    ...agents.filter((a) => !a.online).map((a) => ({ name: a.name, kind: 'agent', why: a.listed_only ? 'stopped or not reporting' : a.updated ? 'quiet' : 'no time in its status file', age_min: a.age_min })),
  ].sort((a, b) => (b.age_min ?? 1e9) - (a.age_min ?? 1e9));
  const watched = people.filter((p) => p.updated).length + agents.length;
  // (6) every colour says why, in words
  const notJoined = people.filter((p) => !p.updated), quietC = people.filter((p) => p.updated && !p.online);
  const why = {
    where: health.events.count === 0 ? 'no events live' : stale ? `${stale} events not re-read at source for over 3 h` : '',
    onboarded: [notJoined.length ? `${notJoined.length} of ${people.length} people have not joined (${notJoined.map((p) => p.id).join(', ')})` : '', quietC.length ? `${quietC.length} conductors quiet for over ${ONLINE_MIN} min (${quietC.map((p) => p.id).join(', ')})` : ''].filter(Boolean).join('; '),
    communicating: !inboxes.length ? 'no inboxes yet' : dinisAsks ? `${dinisAsks} asks are waiting for Dinis` : '',
    data: [newest == null ? 'no event re-read yet' : newest >= 2 ? `events last re-read ${ago(newest)} (over 2 h)` : '', trafficAge == null ? 'traffic never drained' : trafficAge >= 3 ? `traffic last drained ${ago(trafficAge)} (over 3 h)` : ''].filter(Boolean).join('; '),
    outreach: !outreach ? 'no outreach desk yet' : !outreach.contacted ? 'no organiser contacted yet' : '',
  };

  const sections = [
    { key: 'where', title: 'Where are we', health: hc(health.events.count > 0 && stale === 0, health.events.count > 0), headline: `${health.events.count} events live; ${tally(work).done} of ${work.length} work items done` },
    { key: 'onboarded', title: 'Who is onboarded', health: hc(online(people) >= people.filter((p) => p.updated).length && people.filter((p) => !p.updated).length === 0, online(people) > 0), headline: `${health.onboarded.length} of ${people.length} people joined; ${online(people)} conductors and ${online(agents)} of ${agents.filter((a) => !a.listed_only).length} agents online` },
    { key: 'communicating', title: 'What is communicating', health: hc(dinisAsks === 0 && inboxes.length > 0, inboxes.length > 0), headline: `${inboxes.length} inboxes; ${asks.length} open asks, ${dinisAsks} for Dinis` },
    { key: 'data', title: 'How the data flows', health: hc(newest != null && newest < 2 && trafficAge != null && trafficAge < 3, newest != null && newest < 6), headline: `events re-read ${newest == null ? '?' : newest < 1 ? Math.round(newest * 60) + ' min' : newest.toFixed(1) + ' h'} ago; traffic drained ${trafficAge == null ? 'never' : trafficAge < 1 ? Math.round(trafficAge * 60) + ' min ago' : trafficAge.toFixed(1) + ' h ago'}` },
    { key: 'outreach', title: 'Outreach', health: hc(outreach && outreach.contacted > 0, outreach && outreach.drafts_ready > 0), headline: outreach ? `${outreach.organisers_listed} organisers listed, ${outreach.contacted} contacted, ${outreach.answered} answered, ${outreach.joined} joined` : 'no desk yet' },
  ].map((x) => ({ ...x, why: x.health === 'green' ? '' : why[x.key] || 'see the section' }));
  const bad = sections.filter((x) => x.health !== 'green');
  const overall = { health: sections.some((x) => x.health === 'red') ? 'red' : bad.length ? 'amber' : 'green' };
  overall.text = overall.health === 'green' ? 'Swarm healthy: every section is green' : `Swarm ${overall.health === 'red' ? 'broken' : 'needs a look'}: ` + bad.map((x) => `${x.title.toLowerCase()}: ${x.why}`).join('; ');
  overall.reasons = bad.map((x) => ({ key: x.key, title: x.title, health: x.health, why: x.why }));
  const ask_groups = {}; for (const a of asks) { const k = a.to_dinis ? 'Dinis' : a.from; (ask_groups[k] ||= []).push(a); }
  const flow = { version: process.env.VERSION || 'local', last_commit_by_agent: lastBy, last_capture: jread(join(root, 'data/captures.json'))?.updated || null, traffic_last_hour: lastHour, by_via: via };

  return {
    activity: activity ? activity.totals : null,
    overall, sections, flow, asks_by_addressee: Object.entries(ask_groups).sort(([a], [b]) => (a === 'Dinis' ? -1 : b === 'Dinis' ? 1 : a.localeCompare(b))).map(([to, list]) => ({ to, count: list.length, asks: list.sort((x, y) => String(y.at).localeCompare(String(x.at))).map((a) => clip(a.text, 300)) })),
    about: `Lisbon Tech Fringe's swarm, built from the repository's team/, work/ and data/ files. "online" means the status file was updated in the last ${ONLINE_MIN} minutes (UTC). Counts only; no key, contact detail or private person. Independent of Web Summit.`,
    built_at: builtAt, online_minutes: ONLINE_MIN,
    counts: {
      conductors_online: online(people), conductors_started: people.filter((p) => p.updated).length, conductors_total: people.length,
      agents_online: online(agents), agents_total: agents.filter((a) => !a.listed_only).length, agents_stopped: agents.filter((a) => a.listed_only).length,
      inboxes: inboxes.length,
      by_account: Object.values(byAcc).sort((a, b) => b.online - a.online || a.account.localeCompare(b.account)),
    },
    people, agents, inboxes,
    board: { work: tally(work), design: tally(design), items: work.map(slim), design_items: design.map(slim) },
    asks_for_dinis: asks.filter((a) => a.to_dinis), asks_open: asks.length, asks_other: asks.filter((a) => !a.to_dinis).length,
    changes: ch.list, changes_note: ch.shallow ? 'The build checkout is shallow, so fewer than 20 changes are shown; the full list is at ' + repo + '/commits/dev.' : null,
    health, outreach: outreach ? { updated: outreach.updated, by: outreach.by, drafts_ready: outreach.drafts_ready, organisers_listed: outreach.organisers_listed, contacted: outreach.contacted, answered: outreach.answered, joined: outreach.joined } : null,
    traffic: t ? { generated: traffic.generated, views: t.views, reads: t.reads, tabs: t.tabs, countries: t.countries, shares: t.shares } : null,
    // added by Jose's proposal (approved by Dinis, 11 Nov 2026): see the comment in collectSwarm
    readers, outreach_sent, outreach_sent_by: sent_by, organiser_visits, today_by_person,
    dinis_top, dinis_ranked,
    exceptions, exceptions_note: `${watched - exceptions.length} of ${watched} conductors and agents reporting within ${ONLINE_MIN} min, as of the build`,
  };
}

export const swarmCss = `.sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}.sg .card{margin:0}.sg b{display:block;font-size:1.6rem;line-height:1.1}
.row{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.dot{width:.7em;height:.7em;border-radius:50%;background:#999;display:inline-block;flex:none}.dot.on{background:var(--accent)}
.sw li{list-style:none;margin:0}.sw ul{padding:0}.sw .card .muted{margin:.2em 0 0}.bar{display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--line)}.bar i{display:block;height:100%}
.cc{max-width:1200px;overflow-wrap:anywhere}.cc .pg>*,.cc .cols>*{min-width:0}main:has(.cc){max-width:1200px}.pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr));gap:12px;align-items:start}
.pn{background:var(--card);border:1px solid var(--line);border-top:6px solid #999;border-radius:8px;padding:4px 14px 10px}.pn.green{border-top-color:#1a9a5b}.pn.amber{border-top-color:#e0a100}.pn.red{border-top-color:#d33}
.pn h2{margin:.6em 0 .2em}.pn h3{font-size:1rem;margin:.8em 0 .3em}.hl{font-size:1.05rem;margin:.2em 0 .6em;font-weight:600}.hd{display:inline-block;width:.85em;height:.85em;border-radius:50%;margin-right:.45em;vertical-align:baseline;background:#999}.hd.green{background:#1a9a5b}.hd.amber{background:#e0a100}.hd.red{background:#d33}
.ov{font-size:1.15rem;font-weight:600;margin:.3em 0 .6em}.fold{margin:10px 0}.fold summary{cursor:pointer}details>summary{cursor:pointer}.pg{grid-template-columns:repeat(auto-fit,minmax(min(100%,370px),1fr))!important}.kv{padding-left:1.1em}.kv li{list-style:disc;margin:.25em 0}.ask ul{margin:.2em 0;padding-left:1.1em}.ask li{list-style:disc}.ask.me{border-left:4px solid #d33;padding-left:8px;margin:6px 0}
.cols{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:0 12px}.bar .d{background:var(--accent)}.bar .c{background:#2f6fd6}.bar .o{background:#c7a100}.ask{border-left:4px solid #d33}
.why{margin:-.3em 0 .7em;font-size:.95rem}.ov a{color:inherit}.rd h2,.tbp h2{margin:.9em 0 .3em}.rd .sg b{font-size:1.9rem}
.fun{display:flex;flex-wrap:wrap;align-items:stretch;gap:4px}.fun .card{margin:0;flex:1 1 0;min-width:4.6em;padding:6px 4px;text-align:center;font-size:.85rem;overflow-wrap:normal;word-break:normal;hyphens:none}.fun b{display:block;font-size:1.5rem;line-height:1.1}.fun .ar{align-self:center;color:var(--muted)}
.chip{display:inline-block;border:1px solid var(--line);border-radius:10px;padding:0 .45em;font-size:.8rem;margin-right:.35em;white-space:nowrap}.chip.due{border-color:#d33;color:#d33}.chip.urg{border-color:#e0a100}
.tbp ul{padding:0;margin:0}.tbp li.card{margin:0 0 6px}.tbp p{margin:.2em 0}.sent{padding-left:1.1em}.sent li{list-style:disc;margin:.2em 0}`;

export function swarmBody(s, esc, repo) {
  const c = s.counts, f = s.flow;
  const age = (x) => (x.age_min == null ? 'time unknown' : x.age_min < 60 ? `${x.age_min} min ago` : `${Math.floor(x.age_min / 60)} h ${x.age_min % 60} min ago`);
  const hhmm = (iso) => (iso ? esc(String(iso).slice(11, 16)) + ' UTC' : 'unknown');
  const who = (x, name, extra) => `<li class="card" data-u="${esc(x.updated || '')}"><div class="row"><span class="dot ${x.online ? 'on' : ''}" title="${x.online ? 'online' : 'not online'}"></span><strong>${esc(name)}</strong><span class="muted">${extra}</span></div>` +
    `<p class="muted"><span class="st">${x.online ? 'online' : x.updated ? 'quiet' : 'no status yet'}</span>${x.updated ? `, updated ${esc(x.updated)} (<span class="ag">${age(x)}</span>)` : ''}</p>` +
    (x.doing?.length ? `<p>${esc(x.doing[0])}</p>` : x.state ? `<p class="muted">${esc(x.state)}</p>` : '') + '</li>';
  const bar = (t) => { const n = t.open + t.claimed + t.done + t.other || 1; return `<div class="bar" role="img" aria-label="${t.done} done, ${t.claimed} claimed, ${t.open} open"><i class="d" style="width:${100 * t.done / n}%"></i><i class="c" style="width:${100 * t.claimed / n}%"></i><i class="o" style="width:${100 * t.open / n}%"></i></div><p class="muted">${t.done} done · ${t.claimed} claimed · ${t.open} open</p>`; };
  const H = Object.fromEntries(s.sections.map((x) => [x.key, x]));
  const panel = (k, inner) => `<section class="pn ${H[k].health}" id="s-${k}"><h2><span class="hd ${H[k].health}" role="img" aria-label="health: ${H[k].health}"></span>${esc(H[k].title)}</h2><p class="hl">${esc(H[k].headline)}</p>${H[k].why ? `<p class="why"><strong>Why ${H[k].health}:</strong> ${esc(H[k].why)}</p>` : ''}${inner}</section>`;
  const R = s.readers, short = (n) => String(n || '').replace('.fringe@PrompTugal.', '@').replace('@PrompTugal.', '@');
  const accounts = c.by_account.map((a) => `<li>${esc(a.account)}: <strong>${a.online}</strong> of ${a.total} online</li>`).join('');
  const ev = s.health.events;
  const where = `<ul class="kv"><li>Site <strong id="v-ver">${esc(f.version)}</strong> <span class="muted" id="v-age"></span></li><li>Events live: <strong>${ev.count}</strong>; read at source from ${hhmm(ev.oldest_read)} (stalest) to ${hhmm(ev.newest_read)} (freshest)</li><li>Work board: ${bar(s.board.work)}</li><li>Design board: ${bar(s.board.design)}</li></ul>`;
  const onboarded = `<p class="muted">Not yet joined: ${esc(s.health.not_onboarded.join(', ') || 'nobody')}. Joined: ${esc(s.health.onboarded.join(', '))}.</p><ul class="kv">${accounts}</ul>`;
  const li = (l) => l.map((t) => `<li>${esc(t.length > 170 ? t.slice(0, 169) + '…' : t)}</li>`).join('');
  const dg = s.asks_by_addressee.find((g) => g.to === 'Dinis'), others = s.asks_by_addressee.filter((g) => g.to !== 'Dinis');
  const rk = s.dinis_ranked || [];
  const askLi = (a) => `<li>${a.tier === 0 ? `<span class="chip due">due ${hhmm(a.due)}</span>` : a.urgent ? '<span class="chip urg">urgent</span>' : ''}${esc(a.text.length > 170 ? a.text.slice(0, 169) + '…' : a.text)} <span class="muted">(from ${esc(short(a.from))}${a.at ? ', status ' + hhmm(a.at) : ''})</span></li>`;
  const asks = (rk.length ? `<div class="ask me"><strong>Dinis: the top ${Math.min(3, rk.length)} of ${rk.length}</strong> <span class="muted">(a deadline still ahead first, then urgent, then newest)</span><ul>${rk.slice(0, 3).map(askLi).join('')}</ul>${rk.length > 3 ? `<details><summary>${rk.length - 3} more for Dinis</summary><ul>${rk.slice(3).map(askLi).join('')}</ul></details>` : ''}</div>` : dg ? `<div class="ask me"><strong>Dinis: waiting for you</strong> (${dg.count})<ul>${li(dg.asks.slice(0, 5))}</ul></div>` : '<p class="muted">Nothing waiting for Dinis.</p>') +
    (others.length ? `<details><summary>Asks for others: ${others.reduce((n, g) => n + g.count, 0)} from ${others.length} agents</summary>${others.map((g) => `<div class="ask"><strong>${esc(g.to)}</strong> (${g.count})<ul>${li(g.asks)}</ul></div>`).join('')}</details>` : '');
  const A = s.activity, act = (w) => `<strong>${w.commits}</strong> commits, <strong>${w.deploys}</strong> deploys, <strong>${w.agents}</strong> agents`;
  const ex = s.exceptions || [];
  const exList = ex.length ? `<h3>Needs attention (${ex.length})</h3><ul class="kv">${ex.slice(0, 8).map((x) => `<li><strong>${esc(short(x.name))}</strong>: ${esc(x.why)}${x.age_min != null ? `, last status ${age(x)}` : ''}</li>`).join('')}</ul>${ex.length > 8 ? `<details><summary>${ex.length - 8} more</summary><ul class="kv">${ex.slice(8).map((x) => `<li>${esc(short(x.name))}: ${esc(x.why)}${x.age_min != null ? `, last status ${age(x)}` : ''}</li>`).join('')}</ul></details>` : ''}` : '<h3>Needs attention</h3><p class="muted">Nobody: every conductor and agent reported recently.</p>';
  const inboxList = `<ul class="kv">${s.inboxes.map((i) => { const lc = f.last_commit_by_agent[i.agent]; return `<li>${esc((i.agent || i.id).replace('@PrompTugal.', '@'))}: ${i.messages == null ? 'messages ?' : i.messages + ' message' + (i.messages === 1 ? '' : 's') + (i.last_at ? ', last ' + hhmm(i.last_at) : '')}${lc ? ', last commit ' + hhmm(lc) : ''}</li>`; }).join('')}</ul><p class="muted">Counts from data/inbox-counts.json (the lead's count of each lane; read or not is up to each agent).</p>`;
  const comm = `${A ? `<p class="hl" id="act">Last 15 min: ${act(A.last_15_min)}<br>Last hour: ${act(A.last_hour)}</p><p class="muted">As of the build; this line recounts by your clock from <a href="/api/v1/activity.json">activity.json</a>.</p>` : ''}${exList}<p class="muted">${esc(s.exceptions_note || '')}.</p><details><summary>All ${s.inboxes.length} inboxes</summary>${inboxList}</details><h3>Open asks, by addressee</h3>${asks}`;
  const tl = f.traffic_last_hour;
  const data = `<ul class="kv"><li>Last researcher re-read: <strong>${hhmm(ev.newest_read)}</strong></li><li>Last capture (work/27): ${f.last_capture ? esc(f.last_capture) : 'none yet'}</li><li>Last deploy: <span id="v-dep" class="muted">checking version.json…</span></li><li>Traffic in the last hour: ${tl ? `<strong>${tl[1]}</strong> views (${esc(tl[0])})` : 'no views yet'}${s.traffic ? ` · ${s.traffic.views} views in all, ${s.traffic.countries} countries · <a href="/traffic/">traffic</a>` : ''}</li><li>Gate: green (a deploy is built only after <code>validate.mjs</code> passes; this page is that build)</li></ul>`;
  const o = s.outreach, sent = s.outreach_sent || [], sb = Object.entries(s.outreach_sent_by || {});
  const outreach = o ? `<div class="fun" role="list" aria-label="outreach funnel"><div class="card" role="listitem"><b>${o.organisers_listed}</b>listed</div><span class="ar" aria-hidden="true">→</span><div class="card" role="listitem"><b>${o.contacted}</b>contacted</div><span class="ar" aria-hidden="true">→</span><div class="card" role="listitem"><b>${o.answered}</b>answered</div><span class="ar" aria-hidden="true">→</span><div class="card" role="listitem"><b>${o.joined}</b>joined</div></div>
<p>Visits from organiser notes (<code>?via=organiser</code>): <strong>${s.organiser_visits ?? 0}</strong>${sb.length ? ` · sent by ${sb.map(([k, n]) => `<strong>${esc(k)}</strong> ${n}`).join(', ')}` : ''}</p>
${sent.length ? `<h3>Notes sent (${sent.length})</h3><ul class="sent">${sent.map((r) => `<li><strong>${esc(r.organiser)}</strong>: ${esc(r.state)}${r.sent_by ? ' by ' + esc(r.sent_by) : ''}${r.sent_at ? ', ' + hhmm(r.sent_at) : ''}</li>`).join('')}</ul>` : '<p class="muted">No note sent yet.</p>'}
<p class="muted">${o.drafts_ready} drafts ready. Visits by ?via= channel: ${f.by_via.length ? f.by_via.map(([k, n]) => `${esc(k)} ${n}`).join(' · ') : 'none yet'}. An agent never sends: a person does. <a href="${repo}/blob/dev/work/23-tracker.md">tracker</a> · <a href="${repo}/blob/dev/work/29-outreach-desk.md">work/29</a> · <a href="${repo}/tree/dev/work/drafts">drafts</a>.</p>` : '<p class="muted">No outreach counts yet (work/29).</p>';
  const readersBlock = R ? `<section class="rd" aria-label="For readers, now"><h2>For readers, now</h2><div class="sg"><div class="card"><b>${R.events_to_come_today}</b>events still to come today</div><div class="card"><b>${R.online_to_come_today}</b>of them online</div><div class="card"><b>${R.reread_last_hour}</b>events re-read at source in the last hour</div><div class="card"><b>${R.views_last_hour ? R.views_last_hour.views : 0}</b>views ${R.views_last_hour ? 'in the hour from ' + esc(String(R.views_last_hour.hour).slice(11, 16)) + ' UTC' : 'this hour'}</div></div>
<p class="muted">As of the build (${esc(s.built_at.slice(11, 16))} UTC). Views by channel, all of today: ${R.views_by_channel.length ? R.views_by_channel.map(([k, n]) => `${esc(k)} ${n}`).join(' · ') : 'none tagged yet'}. <a href="/now/">What is on now</a> · <a href="/traffic/">traffic</a>.</p></section>` : '';
  const tbp = (s.today_by_person || []).length ? `<section class="tbp" aria-label="Today, by person"><h2>Today, by person</h2><ul class="cols">${s.today_by_person.map((p) => `<li class="card"><strong>${esc(p.name)}</strong>${p.updated ? ` <span class="muted">· status ${hhmm(p.updated)}</span>` : ''}${p.items.map((x) => `<p>${esc(x)}</p>`).join('')}${p.source === 'today' ? '' : '<p class="muted">latest lines of their status file</p>'}</li>`).join('')}</ul></section>` : '';
  const reasons = (s.overall.reasons || []).length ? `Swarm ${s.overall.health === 'red' ? 'broken' : 'needs a look'}: ` + s.overall.reasons.map((r) => `<a href="#s-${esc(r.key)}">${esc(r.title.toLowerCase())}</a>: ${esc(r.why)}`).join('; ') : esc(s.overall.text);
  return `<div class="sw cc"><h1>Control centre</h1>
<p class="ov ${s.overall.health}"><span class="hd ${s.overall.health}"></span>${reasons}</p>
<p class="muted">Built ${esc(s.built_at.slice(0, 16).replace('T', ' '))} UTC from the repository; <span id="live">re-reading <a href="/api/v1/swarm.json">swarm.json</a> in your browser…</span> Online = status file updated in the last ${s.online_minutes} minutes. Health: <span class="hd green"></span> good · <span class="hd amber"></span> needs a look · <span class="hd red"></span> broken.</p>
${readersBlock}
${tbp}
<h2>The swarm</h2>
<div class="sg" id="counts"><div class="card"><b id="n-c">${c.conductors_online}</b>conductors online (of ${c.conductors_started} joined, ${c.conductors_total} people)</div><div class="card"><b id="n-a">${c.agents_online}</b>agents online (of ${c.agents_total})</div><div class="card"><b>${c.inboxes}</b>inboxes</div><div class="card"><b>${ev.count}</b>events live</div></div>
<div class="pg">${panel('where', where)}${panel('onboarded', onboarded)}${panel('communicating', comm)}${panel('data', data)}${panel('outreach', outreach)}</div>
${talkBox()}
<details class="fold"><summary><h2 style="display:inline">Conductors</h2> <span class="muted">(show)</span></summary><ul class="cols">${s.people.map((p) => who(p, p.conductor, `${esc(p.name)} · ${esc(p.lane || '')}`)).join('')}</ul></details>
<details class="fold"><summary><h2 style="display:inline">Agents</h2> <span class="muted">(show)</span></summary><ul class="cols">${s.agents.map((a) => who(a, a.name, `${esc(a.role)} · ${esc(a.account)}${a.model ? ' · ' + esc(a.model) : ''}`)).join('')}</ul></details>
<details class="fold"><summary><h2 style="display:inline">The last ${s.changes.length} changes</h2> <span class="muted">(show)</span></summary>${s.changes_note ? `<p class="muted">${esc(s.changes_note)}</p>` : ''}<ul class="cols">${s.changes.map((x) => `<li class="card"><a href="${repo}/commit/${esc(x.hash)}"><code>${esc(x.hash)}</code></a> <span class="muted">${esc(x.at.slice(11, 16))} UTC</span><br>${esc(x.subject)}</li>`).join('')}</ul></details>
<p class="muted">The data behind this page: <a href="/api/v1/swarm.json">/api/v1/swarm.json</a>.</p></div>`;
}

// the small script: re-reads swarm.json and recomputes "online" from `updated` against the browser's clock
export const swarmScript = `<script>(function(){var M=${ONLINE_MIN};function ok(u){var t=Date.parse(u||'');return !isNaN(t)&&Date.now()-t<=M*6e4}
fetch('/api/v1/swarm.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(s){var c=0,a=0;(s.people||[]).forEach(function(p){if(ok(p.updated))c++});(s.agents||[]).forEach(function(p){if(ok(p.updated))a++});
fetch('/api/v1/activity.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(a){var el=document.getElementById('act');if(!el)return;function w(m){var f=Date.now()-m*6e4,c=a.commits.filter(function(x){return Date.parse(x.at)>=f}),d=a.deploys.filter(function(x){return Date.parse(x.at)>=f}),g={};c.forEach(function(x){g[x.agent]=1});return '<strong>'+c.length+'</strong> commits, <strong>'+d.length+'</strong> deploys, <strong>'+Object.keys(g).length+'</strong> agents'}el.innerHTML='Last 15 min: '+w(15)+'<br>Last hour: '+w(60)}).catch(function(){});fetch('/version.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(v){var m=Math.round((Date.now()-Date.parse(v.pushed_at||v.built_at))/6e4);document.getElementById('v-ver').textContent=v.version;document.getElementById('v-age').textContent='pushed '+(isNaN(m)?'?':m<60?m+' min ago':Math.floor(m/60)+' h '+m%60+' min ago');var b=Date.parse(v.built_at),p=Date.parse(v.pushed_at);document.getElementById('v-dep').textContent=v.version+' at '+(v.commit||'').slice(0,7)+', push to served '+(isNaN(b-p)?'?':Math.round((b-p)/1000)+' s')}).catch(function(){});document.getElementById('n-c').textContent=c;document.getElementById('n-a').textContent=a;
document.getElementById('live').textContent='counted again in your browser at '+new Date().toISOString().slice(11,16)+' UTC (data built '+s.built_at.slice(11,16)+').';
document.querySelectorAll('li[data-u]').forEach(function(li){var o=ok(li.getAttribute('data-u'));li.querySelector('.dot').className='dot'+(o?' on':'');if(li.getAttribute('data-u'))li.querySelector('.st').textContent=o?'online':'quiet'})}).catch(function(){document.getElementById('live').textContent='could not re-read it just now.'})})();</script>`;
