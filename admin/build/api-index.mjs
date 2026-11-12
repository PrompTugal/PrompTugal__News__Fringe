// /api/v1/index.json (lead's item, 12 Nov 2026, dev.1.fringe@PrompTugal.dinis): a small index of every /api/v1/ endpoint the build
// writes, one line each with its URL. Built from the files already in _site/api/v1/ (nothing typed by hand): the line is the file's
// own `about` text (first sentence) when it has one, else a plain description from its name.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const first = (s) => { s = String(s || '').replace(/\s+/g, ' ').trim(); const m = s.match(/^(.{20,200}?[.!?])(\s|$)/); return (m ? m[1] : s).slice(0, 220); };

export function apiIndex({ out, SITE, VERSION, BUILT }) {
  const base = join(out, 'api', 'v1');
  const eps = [];
  for (const f of walk(base).sort()) {
    const rel = relative(base, f).split('\\').join('/');
    if (rel === 'index.json') continue;
    const type = rel.endsWith('.json') ? 'json' : rel.endsWith('.md') ? 'markdown' : 'file';
    let line = '';
    if (type === 'json') { try { const j = JSON.parse(readFileSync(f, 'utf8')); line = first(j.about || j.description || j.title || ''); if (!line && Array.isArray(j)) line = `A list of ${j.length} items.`; } catch { line = 'JSON (could not be read at build time).'; } }
    else if (type === 'markdown') line = first(readFileSync(f, 'utf8').replace(/^#.*\n/m, '').replace(/^>\s*/gm, ''));
    if (rel === 'README.md') line = 'The contract: what each endpoint holds and how stable its fields are.';
    eps.push({ path: '/api/v1/' + rel, url: SITE + 'api/v1/' + rel, type, bytes: statSync(f).size, about: line, described: !!line });
  }
  // a folder of many files with no description of their own (one release record per version, say) is one entry, not a hundred
  const byDir = {};
  for (const e of eps) { const d = e.path.split('/').slice(0, -1).join('/'); (byDir[d] ||= []).push(e); }
  const res = [];
  for (const e of eps) {
    const d = e.path.split('/').slice(0, -1).join('/'), grp = byDir[d];
    if (d !== '/api/v1' && grp.length > 10 && grp.filter((x) => !x.described).length / grp.length > 0.8) {
      if (grp[0] === e) res.push({ path: d + '/<name>.json', url: SITE + d.slice(1) + '/', type: 'json', count: grp.length, example: e.url, about: `${grp.length} files, one per item (for example ${e.path}); the list that names them is the folder's parent endpoint.` });
      continue;
    }
    res.push({ ...e, about: e.about || 'No description in the file.' });
  }
  for (const e of res) delete e.described;
  eps.length = 0; eps.push(...res);
  return { about: 'Every endpoint under /api/v1/ that this build wrote, with one line each. Built from the files themselves, so it is always complete for this version. Independent of Web Summit.', site: SITE, version: VERSION, built_at: BUILT, count: eps.length, endpoints: eps };
}
