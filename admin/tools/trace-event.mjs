#!/usr/bin/env node
// trace-event.mjs <event-id> [--runs runs.json] [--out file.json]
// Rebuilds the git (and, given a runs file, the CI) part of an event page's trace: every commit that changed the
// event's entry in data/events.json (with the read_at it recorded), every commit to the files its page /e/<id>/ is
// built from (from the commit that created the page builder on), every other data file that names the event, who
// made each (Agent trailer, session, model), author and committer time, the work item, the commit that brought it
// onto dev, and the first successful deploy run that published it. Human steps (briefs, Dinis's words) are added by
// hand: the record of a person's act is a file, not a commit (team/angelo/traces/README.md).
// No dependencies, Node 18. tracer.fringe@PrompTugal.angelo, 11 November 2026 (WS-215).
//
// The runs file is the JSON of GitHub's "list workflow runs" (an array, or {workflow_runs: [...]}) with id,
// run_number, name, head_sha, conclusion, created_at, updated_at. Without it, the trace has no ci/deploy steps.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const id = args.find(a => !a.startsWith('--'));
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (!id) { console.error('usage: trace-event.mjs <event-id> [--runs runs.json] [--out file.json]'); process.exit(2); }

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 }).trim();
const tryGit = (...a) => { try { return git(...a); } catch { return null; } };
const SERIES = (tryGit('show', 'HEAD:admin/series.txt') || '0.1').trim();
const BUILDER = ['admin/build/event-pages.mjs', 'admin/build/build.mjs', 'admin/build/cards.mjs',
  'admin/build/identity.mjs', 'admin/build/organisers.mjs', 'admin/build/graph.mjs', 'admin/build/tokens.css',
  'admin/build/validate.mjs', 'admin/build/og', 'data/organisers.json', 'admin/series.txt', '.github/workflows/deploy.yml'];

function info(sha) {
  const raw = git('log', '-1', '--date=iso-strict', '--format=%H%x00%P%x00%ad%x00%cd%x00%s%x00%b', sha);
  const [full, parents, ad, cd, subject, body] = raw.split('\0');
  const tr = k => (body.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi')) || [])[1]?.trim() || null;
  const model = (tr('Co-Authored-By') || '').replace(/\s*<.*$/, '') || null;
  const session = (tr('Claude-Session') || '').match(/session_[A-Za-z0-9]+/)?.[0] || null;
  const agent = tr('Agent') || (subject.match(/^([\w.]+@[\w.]+):/) || [])[1] || 'unknown';
  const work = [...new Set((subject + ' ' + body).match(/work\/\d+/g) || [])];
  return { sha: full, short: full.slice(0, 7), parents: parents.split(' ').filter(Boolean), authored: utc(ad),
    committed: utc(cd), subject, agent, session, model, for: tr('For'), issue: tr('Issue'), work };
}
const utc = s => new Date(s).toISOString().replace('.000Z', 'Z');

// The commit on dev's first-parent line that first contains `sha`: the push that brought it onto dev.
const firstParent = git('rev-list', '--first-parent', '--reverse', 'HEAD').split('\n');
function landing(sha) {
  for (const c of firstParent) if (c === sha || tryGit('merge-base', '--is-ancestor', sha, c) !== null) return c;
  return null;
}

function entryAt(sha) {
  const t = tryGit('show', `${sha}:data/events.json`);
  if (!t) return null;
  try { const d = JSON.parse(t); return (Array.isArray(d) ? d : d.events || []).find(e => e.id === id) || null; }
  catch { return 'unparseable'; }
}

const steps = [];
const commits = new Map();
const note = (c, extra) => { commits.set(c.sha, c); return extra; };

// 1. the entry's history
const evCommits = git('log', '--reverse', '--format=%H', '--', 'data/events.json').split('\n').filter(Boolean);
let prev = null, firstEntry = null;
for (const sha of evCommits) {
  const cur = entryAt(sha);
  if (JSON.stringify(cur) === JSON.stringify(prev)) continue;
  if (cur && typeof cur === 'object') {
    const c = info(sha); note(c);
    const changed = prev && typeof prev === 'object'
      ? Object.keys({ ...prev, ...cur }).filter(k => JSON.stringify(prev[k]) !== JSON.stringify(cur[k])) : ['created'];
    if (cur.read_at && (!prev || prev.read_at !== cur.read_at))
      steps.push({ t: cur.read_at, kind: 'source-read', who: c.agent, session: c.session, model: c.model,
        what: `read the organiser's public page (${cur.url}) as recorded in read_at`, evidence: [c.short, cur.url],
        work_item: c.work[0] || null, label: 'fact' });
    steps.push({ t: c.authored, committed: c.committed, kind: 'agent', who: c.agent, session: c.session, model: c.model,
      what: `${prev ? 'changed' : 'created'} the entry in data/events.json (${changed.join(', ')}): ${c.subject}`,
      evidence: [c.short], work_item: c.work[0] || null, label: 'fact', sha: c.sha, role: 'entry' });
    if (!firstEntry) firstEntry = c;
  } else if (prev) {
    const c = info(sha); note(c);
    steps.push({ t: c.authored, kind: 'agent', who: c.agent, what: `removed the entry: ${c.subject}`, evidence: [c.short], label: 'fact', sha: c.sha, role: 'entry' });
  }
  prev = cur;
}
if (!firstEntry) { console.error(`no entry ${id} in any version of data/events.json`); process.exit(1); }

// 2. the page builder, from the commit that created event-pages.mjs on
const pageBorn = git('log', '--reverse', '--format=%H', '--diff-filter=A', '--', 'admin/build/event-pages.mjs').split('\n')[0];
const bornT = pageBorn ? info(pageBorn).authored : null;
for (const sha of git('log', '--reverse', '--format=%H', '--', ...BUILDER).split('\n').filter(Boolean)) {
  const c = info(sha);
  if (bornT && c.authored < bornT && sha !== pageBorn) continue;
  if (commits.has(sha)) continue;
  const files = git('show', '--name-only', '--format=', sha).split('\n').filter(f => BUILDER.some(b => f === b || f.startsWith(b + '/')));
  note(c);
  steps.push({ t: c.authored, committed: c.committed, kind: 'agent', who: c.agent, session: c.session, model: c.model,
    what: `${sha === pageBorn ? 'created the page builder' : 'changed the page builder'} (${files.join(', ')}): ${c.subject}`,
    evidence: [c.short], work_item: c.work[0] || null, label: 'fact', sha: c.sha, role: 'builder' });
}

// 3. other files that name the event (added or removed the id string), outside events.json
for (const sha of git('log', '--reverse', '--format=%H', `-S${id}`, '--', '.', ':(exclude)data/events.json', ':(exclude)_site').split('\n').filter(Boolean)) {
  if (commits.has(sha)) continue;
  const c = info(sha); note(c);
  const files = git('show', '--name-only', '--format=', sha).split('\n').filter(f => (tryGit('show', `${sha}:${f}`) || '').includes(id));
  steps.push({ t: c.authored, committed: c.committed, kind: 'agent', who: c.agent, session: c.session, model: c.model,
    what: `named the event in ${files.join(', ') || 'a file'}: ${c.subject}`, evidence: [c.short], work_item: c.work[0] || null,
    label: 'fact', sha: c.sha, role: 'mention' });
}

// 4. landing on dev, and the deploy that published it
let runs = [];
if (opt('--runs')) { const r = JSON.parse(readFileSync(opt('--runs'), 'utf8')); runs = (Array.isArray(r) ? r : r.workflow_runs || []); }
runs.sort((a, b) => a.created_at.localeCompare(b.created_at));
const deploys = new Map();
for (const s of [...steps]) {
  if (!s.sha) continue;
  const land = landing(s.sha);
  if (land && land !== s.sha) {
    const l = info(land); note(l);
    if (!steps.some(x => x.sha === land && x.role === 'landing'))
      steps.push({ t: l.committed, kind: 'agent', who: l.agent, session: l.session, model: l.model,
        what: `brought ${s.evidence[0]} onto dev: ${l.subject}`, evidence: [l.short, s.evidence[0]], work_item: l.work[0] || null,
        label: 'fact', sha: l.sha, role: 'landing' });
  }
  s.on_dev = land ? land.slice(0, 7) : 'unknown';
  if (!runs.length) continue;
  const run = runs.find(r => r.conclusion === 'success' && /deploy|pages/.test(r.name || '') &&
    (r.head_sha === s.sha || tryGit('merge-base', '--is-ancestor', s.sha, r.head_sha) !== null));
  s.published_by = run ? `run ${run.id}` : 'unknown';
  if (run && !deploys.has(run.id)) {
    const v = /deploy/.test(run.name) ? `v${SERIES}.${run.run_number}` : null;
    deploys.set(run.id, true);
    steps.push({ t: run.created_at, kind: 'ci', who: 'GitHub Actions', what: `workflow '${run.name}' run ${run.run_number} started on ${run.head_sha.slice(0, 7)} (build, gate${v ? ', version ' + v : ''})`,
      evidence: [`https://github.com/PrompTugal/PrompTugal__News__Fringe/actions/runs/${run.id}`, run.head_sha.slice(0, 7)], label: 'fact', version: v });
    steps.push({ t: run.updated_at, kind: 'deploy', who: 'GitHub Actions', what: `deployed to GitHub Pages${v ? ' as ' + v : ''} (run ${run.run_number}, ${run.conclusion}; the run's last update time)`,
      evidence: [`https://github.com/PrompTugal/PrompTugal__News__Fringe/actions/runs/${run.id}`], label: 'fact', version: v });
  }
}

steps.sort((a, b) => a.t.localeCompare(b.t));
for (const s of steps) { delete s.sha; for (const k of Object.keys(s)) if (s[k] === null) delete s[k]; }
const out = { event_id: id, page: `https://fringe.promptugal.news/e/${id}/`, generated_by: 'admin/tools/trace-event.mjs',
  generated_at: utc(new Date().toISOString()), head: git('rev-parse', '--short', 'HEAD'), steps,
  totals: { steps: steps.length, commits: commits.size, agents: [...new Set([...commits.values()].map(c => c.agent))].length, deploys: deploys.size } };
const json = JSON.stringify(out, null, 2) + '\n';
if (opt('--out')) writeFileSync(opt('--out'), json); else process.stdout.write(json);
