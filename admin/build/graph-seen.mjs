// work/42 (ontologist.1.fringe@PrompTugal.dinis): supersede, never delete (Fractal Semantic Graphs, rule 4).
// Every event id ever published in data/events.json is kept in data/graph/seen.json, so when an id leaves the file
// (renamed, merged, removed) its old page still answers: where it went, or that it is no longer listed, and why we
// cannot say more. seen.json is made by this tool from git history, never by hand:
//   node admin/build/graph-seen.mjs --update      (needs full history: git fetch --unshallow origin dev)
// CI clones with depth 1, so the build only reads seen.json; it never walks history itself.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = 'data/graph/seen.json';

export function loadSeen(root) {
  try { return existsSync(join(root, FILE)) ? JSON.parse(readFileSync(join(root, FILE), 'utf8')).events || [] : []; } catch { return []; }
}

// Ids seen before but not in events.json now, each with its successor where one is plain to see: the current event
// at the same URL (an id renamed), else none (removed; the reason is in git, not guessed here).
export function retired(root, events) {
  const now = new Set(events.map((e) => e.id));
  const byUrl = new Map(events.map((e) => [e.url, e]));
  return loadSeen(root).filter((s) => !now.has(s.id)).map((s) => {
    const next = byUrl.get(s.url);
    return { ...s, status: next ? 'superseded' : 'no longer listed', superseded_by: next ? next.id : null };
  });
}

function update(root) {
  const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (git('rev-parse', '--is-shallow-repository').trim() === 'true') { console.error('graph-seen: shallow clone; run git fetch --unshallow origin dev first'); process.exit(1); }
  const commits = git('log', '--reverse', '--format=%H %cI', '--', 'data/events.json').trim().split('\n').filter(Boolean).map((l) => l.split(' '));
  const seen = new Map(loadSeen(root).map((s) => [s.id, s]));
  for (const [sha, at] of commits) {
    let evs; try { evs = JSON.parse(git('show', `${sha}:data/events.json`)).events || []; } catch { continue; }
    const here = new Set();
    for (const e of evs) {
      if (typeof e.id !== 'string' || !e.id) continue;
      here.add(e.id);
      const s = seen.get(e.id) || { id: e.id, first_seen: at, first_commit: sha.slice(0, 7) };
      Object.assign(s, { name: e.name, url: e.url, date: e.date, last_seen: at, last_commit: sha.slice(0, 7), removed_in: null, removed_at: null, removed_by: null });
      seen.set(e.id, s);
    }
    for (const s of seen.values()) if (!here.has(s.id) && !s.removed_in) Object.assign(s, { removed_in: sha.slice(0, 7), removed_at: at, removed_by: git('log', '-1', '--format=%s', sha).trim().slice(0, 240) });   // the commit that took it out, and its subject as written
  }
  const out = { about: 'Every event id ever published in data/events.json, with when it was first and last seen (commit time, UTC) and its last name and URL. Made by admin/build/graph-seen.mjs --update from git history; never edited by hand. The build gives each id no longer in events.json a page that says where it went (supersede, never delete).',
    updated: new Date().toISOString().slice(0, 16) + 'Z', by: 'ontologist.1.fringe@PrompTugal.dinis', events: [...seen.values()].sort((a, b) => a.id.localeCompare(b.id)) };
  mkdirSync(join(root, 'data/graph'), { recursive: true });
  writeFileSync(join(root, FILE), JSON.stringify(out, null, 1) + '\n');
  const cur = new Set((JSON.parse(readFileSync(join(root, 'data/events.json'), 'utf8')).events || []).map((e) => e.id));
  console.log(`graph-seen: ${seen.size} ids ever seen over ${commits.length} commits; ${[...seen.keys()].filter((id) => !cur.has(id)).length} not in events.json now`);
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--update')) update(join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
