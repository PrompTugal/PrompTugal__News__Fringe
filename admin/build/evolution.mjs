// /evolution/ (work/27): each site's captures over time, built from data/capture-index.json and runs/*.json (pointers only).
// capture.1.fringe@PrompTugal.dinis. No image is published here: the screenshots live in the capture vaults (data/capture-vaults.json);
// until Dinis says to publish a public read key, the page shows the timeline, the hashes and what changed between runs.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function loadEvolution(root) {
  const idxf = join(root, 'data/capture-index.json');
  if (!existsSync(idxf)) return null;
  const idx = JSON.parse(readFileSync(idxf, 'utf8'));
  const runs = [];
  for (const r of idx.runs) { const f = join(root, 'data', r.file); if (existsSync(f)) runs.push(JSON.parse(readFileSync(f, 'utf8'))); }
  runs.sort((a, b) => a.run.localeCompare(b.run));
  const vaults = existsSync(join(root, 'data/capture-vaults.json')) ? JSON.parse(readFileSync(join(root, 'data/capture-vaults.json'), 'utf8')) : { vaults: [] };
  // per site -> per url -> the sequence of captures
  const sites = {};
  for (const run of runs) for (const c of run.captures) {
    const s = (sites[c.site] ||= {}), u = (s[c.url] ||= []);
    u.push({ run: run.run, at: c.captured_at, width: c.width, status: c.http_status, error: c.error, text: c.files?.text?.sha256 || null,
      shot: c.files?.screenshot?.sha256 || null, vault: run.vault.id, path: c.files?.screenshot?.path || null, our_status: c.our_status, found: c.name_found_on_page });
  }
  return { runs, sites, vaults: vaults.vaults };
}

export function evolutionBody(ev, esc) {
  if (!ev || !ev.runs.length) return `<h1>Evolution</h1><p>No captures yet. The capture agent (work/27) writes screenshots and page text to vaults every hour; this page will show each site over time.</p>`;
  const hosts = Object.keys(ev.sites).sort((a, b) => (a.startsWith('fringe') ? -1 : b.startsWith('fringe') ? 1 : a.localeCompare(b)));
  const nruns = ev.runs.length, first = ev.runs[0].captured_at, last = ev.runs[nruns - 1].captured_at;
  const total = ev.runs.reduce((n, r) => n + r.count, 0);
  let changed = 0, rows = '';
  for (const h of hosts) {
    const urls = Object.entries(ev.sites[h]);
    let ch = 0, caps = 0;
    const list = urls.map(([u, seq]) => {
      caps += seq.length;
      const w = seq.filter(x => x.width === Math.max(...seq.map(y => y.width)) || true);
      const texts = [...new Set(w.filter(x => x.text).map(x => x.text))];
      const did = texts.length > 1; if (did) ch++;
      const dots = w.map(x => `<span class="dot ${x.error ? 'bad' : ''}" title="${esc(x.at + (x.error ? ' ' + x.error : ' ' + (x.status || '')))}"></span>`).join('');
      return `<li><a href="${esc(u)}" rel="noopener">${esc(u.replace(/^https?:\/\//, '').slice(0, 70))}</a> ${dots}${did ? ' <strong class="chg">page text changed ' + (texts.length - 1) + '×</strong>' : ''}</li>`;
    }).join('');
    changed += ch;
    rows += `<details${h.startsWith('fringe') ? ' open' : ''}><summary><strong>${esc(h)}</strong> · ${urls.length} page${urls.length > 1 ? 's' : ''} · ${caps} captures · ${ch} changed</summary><ul class="evl">${list}</ul></details>`;
  }
  const vrows = ev.vaults.map(v => `<li>vault <code>${esc(v.id)}</code> (${esc(v.status)}, a normal vault on dev.send.sgraph.ai${v.read_key_public ? ', public read key' : ', read key kept private'})</li>`).join('');
  return `<h1>Evolution</h1>
<p>Lisbon Tech Fringe photographs its own pages and every organiser's public event page every hour, and keeps the screenshot, the visible text and the fields we extracted. Here is what that shows over time: each page, each capture, and where the page's text changed between captures. Independent of Web Summit; we never capture websummit.com or anything behind a login.</p>
<p class="muted"><strong>Fact</strong> (from data/capture-index.json): ${nruns} run${nruns > 1 ? 's' : ''}, ${total} captures, ${esc(first.slice(0, 16).replace('T', ' '))} to ${esc(last.slice(0, 16).replace('T', ' '))} UTC · ${changed} page${changed === 1 ? '' : 's'} changed text between runs. Each dot is one capture; a red dot is a page we could not capture.</p>
${rows}
<h2>Where the pictures are</h2>
<p>Screenshots and text are stored encrypted in normal vaults (never in git; git holds only pointers with the vault id, path and sha256). A public viewer for them waits on Dinis's word.</p><ul>${vrows}</ul>`;
}

export const evolutionCss = `.evl{list-style:none;padding:0;margin:.5rem 0 1rem}.evl li{padding:.3rem 0;border-bottom:1px solid #8884;word-break:break-word}.dot{display:inline-block;width:.6rem;height:.6rem;border-radius:50%;background:#2a8a4a;margin-right:.15rem}.dot.bad{background:#c0392b}.chg{color:#b45309}details{margin:.6rem 0}summary{cursor:pointer;padding:.3rem 0}`;
