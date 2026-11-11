// work/15 (dev.2.fringe@PrompTugal.dinis): what changed. Built from git in CI (the checkout is deepened just enough, see
// deploy.yml). Each release: version (the tag CI pushed), commit, UTC time, agent (Agent: trailer), subject, files by area.
// A shallow clone just shows fewer commits; nothing breaks. No contact details: only commit metadata already public in the repo.
import { execFileSync } from 'node:child_process';

const AREAS = [
  [/^admin\/build\//, 'build'], [/^admin\//, 'tools'], [/^\.github\//, 'ci'], [/^data\//, 'data'], [/^work\//, 'board'],
  [/^team\//, 'team'], [/^briefs\/|^advice\//, 'briefs'], [/^seed\//, 'seed'], [/^assets\//, 'assets'], [/^api\//, 'api'],
  [/^security\//, 'security'], [/\.md$/, 'docs'],
];
const area = (f) => (AREAS.find(([re]) => re.test(f)) || [0, 'other'])[1];

export function readChanges(root, max = 200) {
  const git = (...a) => execFileSync('git', a, { cwd: root, maxBuffer: 64 << 20 }).toString();
  let raw;
  try { raw = git('log', `-n${max}`, '--name-only', '--date=iso-strict', '--format=%x1e%H%x1f%cI%x1f%s%x1f%(trailers:key=Agent,valueonly,separator=%x2C)%x1f%an'); }
  catch { return { commits: [], note: 'git history not available in this build' }; }
  const tags = {};
  try { for (const l of git('for-each-ref', '--format=%(objectname) %(refname:short)', 'refs/tags').split('\n')) { const [h, t] = l.split(' '); if (h && /^v\d/.test(t || '')) tags[h] = t; } } catch {}
  const commits = raw.split('\x1e').filter(Boolean).map((blk) => {
    const parts = blk.split('\x1f');
    const [hash, time, subject, agent] = parts;
    const files = (parts[4] || '').split('\n').slice(1).map((s) => s.trim()).filter(Boolean);   // after the author name line
    const by = {};
    for (const f of files) (by[area(f)] ||= []).push(f);
    return { version: tags[hash] || null, commit: hash, short: hash.slice(0, 7), time: time.slice(0, 19).replace(/[+-]00:00$/, '') + 'Z', agent: agent.trim() || (subject.match(/^([\w.-]+@PrompTugal\.[\w.-]+):/) || [])[1] || null, subject: subject.replace(/^[\w.-]+@PrompTugal\.[\w.-]+:\s*/, ''), files_total: files.length, areas: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length])) };
  });
  return { commits, note: null };
}

export function changesBody(ch, esc, REPO) {
  const rows = ch.commits.map((c) => `<div class="card"><strong>${esc(c.subject.slice(0, 160))}</strong>${c.version ? `<span class="tag done">${esc(c.version)}</span>` : ''}
<div class="muted">${esc(c.time.slice(0, 16).replace('T', ' '))} UTC · ${esc(c.agent || 'unknown agent')} · <a href="${REPO}/commit/${esc(c.commit)}"><code>${esc(c.short)}</code></a></div>
<div class="muted">${c.files_total} file${c.files_total === 1 ? '' : 's'}: ${Object.entries(c.areas).map(([k, n]) => `${esc(k)} ${n}`).join(', ') || 'none'}</div></div>`).join('');
  return `<h1>What changed</h1>
<p>Every release of this site, newest first, built from git when the site is built: version (the tag CI gives it), commit, time, the agent that made it, and the files touched by area. The same data: <a href="/api/v1/changes.json">/api/v1/changes.json</a>.</p>
${ch.note ? `<p class="muted">${esc(ch.note)}</p>` : `<p class="muted">The latest ${ch.commits.length} commits in the checkout.</p>`}${rows}`;
}
