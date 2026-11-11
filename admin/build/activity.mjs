// /api/v1/activity.json (work/32 via brief 10, dev.1.fringe@PrompTugal.dinis, 11 November 2026, at Dinis's word:
// "see live how many commits, pushes and agents happened in the last 15 minutes and the last hour"). Built from git:
// every commit on dev from the last 3 hours (committer time, UTC; agent from the Agent: trailer, else the subject's
// "<agent>:" prefix), every deploy (CI pushes a tag v<series>.<run> for each; its time is its commit's, which is the push's),
// and build-time totals for 15 minutes and 1 hour. A page counts by the reader's clock from the lists; the totals are as
// of built_at. No author name or e-mail is read, only the agent label.
import { execFileSync } from 'node:child_process';

export const WINDOW_H = 3;
const git = (root, args, t = 15000) => execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: t, maxBuffer: 16 << 20 });

function commits(root, sinceMs) {
  const out = git(root, ['log', `--since=${new Date(sinceMs).toISOString()}`, '--format=%h%x1f%cI%x1f%s%x1f%(trailers:key=Agent,valueonly,separator=%x2c)%x1e']);
  return out.split('\x1e').map((r) => r.trim()).filter(Boolean).map((r) => {
    const [sha, at, subject, trailer] = r.split('\x1f');
    const m = /^([A-Za-z0-9._-]+@PrompTugal\.[A-Za-z0-9_-]+):/.exec(subject || '');
    const agent = (trailer || '').split(',')[0].trim() || m?.[1] || 'unknown';
    return { sha, at: new Date(at).toISOString(), agent, subject: String(subject || '').slice(0, 160) };
  });
}
function deploys(root, sinceMs) {
  const out = git(root, ['for-each-ref', '--sort=-creatordate', '--format=%(refname:short)|%(creatordate:iso-strict)|%(*objectname:short)%(objectname:short)', 'refs/tags/v*']);
  return out.split('\n').filter(Boolean).map((l) => { const [version, at, sha] = l.split('|'); return { version, at: new Date(at).toISOString(), sha }; })
    .filter((d) => Date.parse(d.at) >= sinceMs);
}

export function collectActivity({ root, builtAt }) {
  const now = Date.parse(builtAt), since = now - WINDOW_H * 3600000;
  let list = [], dep = [], note = null;
  try {
    list = commits(root, since);
    // CI clones shallow: if history does not yet reach the window's start, deepen a little (CI only), best effort
    for (let i = 0; process.env.GITHUB_SHA && i < 3; i++) {
      const shallow = git(root, ['rev-parse', '--is-shallow-repository']).trim() === 'true';
      const tail = list.at(-1);
      if (!shallow || (tail && Date.parse(tail.at) < since + 600000) || list.length === 0 && i > 0) break;
      try { git(root, ['fetch', '-q', '--deepen=100', 'origin', 'dev'], 25000); list = commits(root, since); } catch { break; }
    }
    dep = deploys(root, since);
  } catch (e) { note = 'git history was not readable at build time'; }
  const win = (min) => {
    const from = now - min * 60000, c = list.filter((x) => Date.parse(x.at) >= from), d = dep.filter((x) => Date.parse(x.at) >= from);
    return { minutes: min, commits: c.length, deploys: d.length, agents: new Set(c.map((x) => x.agent).filter((a) => a !== 'unknown')).size };
  };
  return {
    about: 'Lisbon Fringe activity from git: commits on dev (committer time, UTC, agent from the Agent: trailer or the subject prefix) and deploys (each CI release tag, at its commit time, which is the push). Totals are as of built_at; count by your own clock from the lists. A deploy is one site release, so several pushes that arrive together can make one.',
    built_at: builtAt, window_hours: WINDOW_H, note,
    totals: { last_15_min: win(15), last_hour: win(60), last_3_hours: win(180) },
    commits: list, deploys: dep,
  };
}
