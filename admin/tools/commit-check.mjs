#!/usr/bin/env node
// Per-commit gate (security finding 45, dev.2.fringe@PrompTugal.dinis, 11 Nov 2026): validate.mjs checks only HEAD's tree, so a commit holding a file over
// 256 KB, a binary or a forbidden path would still reach dev if a LATER commit in the same push removed it (the bytes stay in history). This checks every
// commit in a range, on each file the commit adds or changes, with the same limits as validate.mjs, and names the offending commit. No history rewrite:
// it only refuses to push. Usage: node admin/tools/commit-check.mjs [range]   (default origin/dev..HEAD)
import { execFileSync } from 'node:child_process';
const range = process.argv[2] || 'origin/dev..HEAD';
const MAX = 256 * 1024;   // keep in step with validate.mjs
const BINARY_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|ico|pdf|zip|gz|tgz|7z|rar|mp4|mov|webm|mp3|wav|woff2?|ttf|otf|psd|sqlite|db|bin|exe|dmg|pkl|parquet)$/i;
const FORBIDDEN = /(^|\/)(node_modules|_site|\.sg_vault|\.sg-send|raw|captures|screenshots)\//;
const KEYFILE = /(^|\/)(vault-key-[^/]*|[^/]*\.vault-key|access-token\.json|[^/]*\.key)$/;
const git = (...a) => execFileSync('git', a, { maxBuffer: 256 << 20 }).toString();
const commits = git('rev-list', '--reverse', '--no-merges', range).split('\n').filter(Boolean);
const bad = [];
for (const c of commits) {
  // added or modified files in this commit: mode, type, blob sha, path
  const raw = git('diff-tree', '-r', '--root', '--no-commit-id', '--diff-filter=AM', '-z', '--raw', c).split('\0');
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const meta = raw[i].split(/\s+/), path = raw[i + 1], sha = meta[3];
    if (!sha || /^0+$/.test(sha)) continue;
    let size = 0; try { size = +git('cat-file', '-s', sha); } catch {}
    const why = size > MAX ? `${size} bytes, over 256 KB` : BINARY_EXT.test(path) ? 'a binary in git' : FORBIDDEN.test(path) ? 'a path that never goes in git' : KEYFILE.test(path) ? 'a key file' : null;
    if (why) bad.push(`${c.slice(0, 7)} (${git('log', '-1', '--format=%s', c).trim().slice(0, 70)}): ${path}: ${why}`);
  }
}
if (bad.length) { for (const b of bad) console.log('FAIL ' + b); console.log(`commit-check: ${bad.length} problem(s) in ${commits.length} commit(s) of ${range}: refusing to push (the file is in that commit's history even if a later commit removes it)`); process.exit(1); }
console.log(`commit-check: OK, ${commits.length} commit(s) in ${range}`);
