// work/37 (dev.2.fringe@PrompTugal.dinis): every release as a page and as JSON.
// A release = one CI tag (v<series>.<run>) = the tagged commit plus every commit since the previous tag. CI tags the commit each deploy
// builds, not every commit, so an untagged commit belongs to the FIRST tag that contains it (the next tag). Commits newer than the last
// tag belong to the release being built now (VERSION). Each release also carries what it changed in data/events.json (by id and field).
// Needs the CI checkout to hold the tags and enough history (deploy.yml: fetch-depth 500, fetch-tags). Commit metadata only; nothing private.
import { execFileSync } from 'node:child_process';

const SHORT = (v) => (v == null ? null : String(v).length > 140 ? String(v).slice(0, 140) + '…' : v);
const skipField = new Set(['read_at']);   // a re-read alone is counted, not listed as a change

export function buildReleases(root, commits, VERSION) {
  const git = (...a) => execFileSync('git', a, { cwd: root, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const tagAt = {};
  try { for (const l of git('for-each-ref', '--format=%(objectname) %(refname:short)', 'refs/tags').split('\n')) { const [h, t] = l.split(' '); if (h && /^v\d+\.\d+\.\d+$/.test(t || '')) tagAt[h] = t; } } catch {}
  const chron = [...commits].reverse();   // oldest first
  const releases = []; let pending = [];
  for (const c of chron) {
    pending.push(c);
    if (tagAt[c.commit]) { releases.push({ version: tagAt[c.commit], commits: pending, tip: c.commit }); pending = []; }
  }
  if (pending.length || (VERSION !== 'local' && !releases.some((r) => r.version === VERSION))) releases.push({ version: VERSION, commits: pending, tip: pending.at(-1)?.commit || chron.at(-1)?.commit, current: true });
  const cache = new Map();
  const eventsAt = (sha) => { if (!cache.has(sha)) { let v = null; try { v = JSON.parse(git('show', `${sha}:data/events.json`)).events || []; } catch {} cache.set(sha, v); } return cache.get(sha); };
  let prevTip = null;
  releases.forEach((r, i) => {
    for (const c of r.commits) c.version = r.version;
    const touched = r.commits.some((c) => c.areas.data);
    const base = i === 0 ? (r.commits[0] ? `${r.commits[0].commit}^` : null) : prevTip;
    r.window_start = i === 0;
    let data = { added: [], removed: [], changed: [], reread: 0, known: !touched };
    if (touched && r.tip && base) { const was = eventsAt(base), now = eventsAt(r.tip); if (was && now) data = diffEvents(was, now); }
    r.data = data;
    prevTip = r.tip;
    const agents = [...new Set(r.commits.map((c) => c.agent).filter(Boolean))];
    const areas = {}; for (const c of r.commits) for (const [k, n] of Object.entries(c.areas)) areas[k] = (areas[k] || 0) + n;
    const last = r.commits.at(-1);
    r.summary = { version: r.version, time: last?.time || null, tip: r.tip ? r.tip.slice(0, 7) : null, commit_count: r.commits.length, agents, areas, current: !!r.current,
      data: { known: data.known, added: data.added.length, removed: data.removed.length, changed: data.changed.length, reread: data.reread } };
  });
  releases.reverse();   // newest first
  return releases;
}

function diffEvents(was, now) {
  const w = new Map(was.map((e) => [e.id || e.url, e])), n = new Map(now.map((e) => [e.id || e.url, e]));
  const out = { added: [], removed: [], changed: [], reread: 0, known: true };
  for (const [id, e] of n) {
    const o = w.get(id);
    if (!o) { out.added.push({ id, name: e.name, status: e.status, start: e.start }); continue; }
    const fields = [];
    for (const k of new Set([...Object.keys(o), ...Object.keys(e)])) {
      if (JSON.stringify(o[k]) === JSON.stringify(e[k])) continue;
      if (skipField.has(k)) continue;
      fields.push({ field: k, from: SHORT(typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]), to: SHORT(typeof e[k] === 'object' ? JSON.stringify(e[k]) : e[k]) });
    }
    if (fields.length) out.changed.push({ id, name: e.name, fields }); else if (o.read_at !== e.read_at) out.reread++;
  }
  for (const [id, o] of w) if (!n.has(id)) out.removed.push({ id, name: o.name });
  return out;
}

// ---- pages and JSON
export const releasePath = (v) => `/changes/${encodeURIComponent(v)}/`;
const t16 = (t) => String(t || '').slice(0, 16).replace('T', ' ');
export function releasesIndexBody(releases, esc) {
  return `<h1>What changed</h1>
<p>Every release, newest first. A release is one tag CI gave a deploy (<code>v0.1.N</code>): its tagged commit plus every commit since the previous tag. Click one to see exactly what shipped, and what it changed in the events data. All of it as JSON: <a href="/api/v1/releases.json">/api/v1/releases.json</a>, one file per release at <code>/api/v1/releases/&lt;version&gt;.json</code>.</p>
` + releases.map((r) => { const s = r.summary, d = s.data;
    return `<div class="card"><a href="${releasePath(r.version)}"><strong>${esc(r.version)}</strong></a>${s.current ? '<span class="tag">this build</span>' : ''}
<div class="muted">${esc(t16(s.time))} UTC · ${s.commit_count} commit${s.commit_count === 1 ? '' : 's'} · ${esc(s.agents.slice(0, 4).join(', ') || 'unknown agent')}${s.agents.length > 4 ? ` +${s.agents.length - 4}` : ''}</div>
<div class="muted">${Object.entries(s.areas).map(([k, n]) => `${esc(k)} ${n}`).join(', ') || 'no files'}${d.known && (d.added || d.removed || d.changed) ? ` · events: +${d.added} −${d.removed} ~${d.changed}` : ''}</div></div>`; }).join('');
}
export function releaseBody(r, esc, REPO, prev, next, live = () => true) {
  const ev = (e, inner) => (live(e.id) ? `<a href="/e/${encodeURIComponent(e.id)}/">${inner}</a>` : inner);
  const d = r.data, s = r.summary;
  const evs = (title, list, f) => list.length ? `<h2>${title} (${list.length})</h2><ul>${list.map(f).join('')}</ul>` : '';
  return `<h1>${esc(r.version)}</h1>
<p class="muted">${esc(t16(s.time))} UTC · ${s.commit_count} commit${s.commit_count === 1 ? '' : 's'} · tip <code>${esc(s.tip || '')}</code>${s.current ? ' · the build you are reading' : ''}${r.window_start ? ' · the oldest release in the history this build can see: it may hold earlier commits' : ''}.
JSON: <a href="/api/v1/releases/${encodeURIComponent(r.version)}.json">releases/${esc(r.version)}.json</a>. <a href="/changes/">All releases</a>${prev ? ` · <a href="${releasePath(prev)}">older: ${esc(prev)}</a>` : ''}${next ? ` · <a href="${releasePath(next)}">newer: ${esc(next)}</a>` : ''}</p>
<h2>Commits</h2>` + r.commits.slice().reverse().map((c) => `<div class="card"><strong>${esc(c.subject.slice(0, 200))}</strong>
<div class="muted">${esc(t16(c.time))} UTC · ${esc(c.agent || 'unknown agent')} · <a href="${REPO}/commit/${esc(c.commit)}"><code>${esc(c.short)}</code></a></div>
<div class="muted">${c.files_total} file${c.files_total === 1 ? '' : 's'}: ${Object.entries(c.areas).map(([k, n]) => `${esc(k)} ${n}`).join(', ') || 'none'}</div></div>`).join('')
    + `<h2>Events data in this release</h2>` + (!d.known ? '<p class="muted">Not available: the history this build can see does not reach the events file as it was before this release.</p>'
      : (d.added.length + d.removed.length + d.changed.length + d.reread === 0 ? '<p class="muted">No change to <code>data/events.json</code>.</p>' : `<p class="muted">${d.reread} event${d.reread === 1 ? '' : 's'} re-read with no other change.</p>`
        + evs('Added', d.added, (e) => `<li>${ev(e, esc(e.name))} <span class="muted">${esc(e.status || '')} ${esc(t16(e.start))}</span></li>`)
        + evs('Removed', d.removed, (e) => `<li>${esc(e.name)} <code>${esc(e.id)}</code></li>`)
        + evs('Changed', d.changed, (e) => `<li>${ev(e, esc(e.name))}<ul>${e.fields.map((f) => `<li><code>${esc(f.field)}</code>: ${esc(f.from ?? '(none)')} → ${esc(f.to ?? '(none)')}</li>`).join('')}</ul></li>`)));
}
export const releaseJson = (r, meta) => ({ ...meta, ...r.summary, window_start: r.window_start, commits: r.commits.map(({ commit, short, time, agent, subject, files_total, areas }) => ({ commit, short, time, agent, subject, files_total, areas })), data: r.data });
