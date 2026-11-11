// /guidance/ (from CONTRIBUTING.md) and /abp/ (from abp/index.json): work/40 and work/39, architect.1.fringe@PrompTugal.dinis.
// The markdown is the source: the page is rendered from it at build time, so the two never drift.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const guidanceCss = `.gd table{border-collapse:collapse;width:100%;font-size:.9rem;margin:.6em 0}.gd th,.gd td{border:1px solid var(--hair,#ccc);padding:6px 8px;text-align:left;vertical-align:top}
.gd .tw{overflow-x:auto}.gd a,.gd td{overflow-wrap:anywhere}.gd blockquote{margin:.6em 0;padding:.4em .8em;border-left:3px solid var(--brand,#333);color:var(--ink-3,#555)}.gd code{overflow-wrap:anywhere}
.abp-list{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.abp-list .card{margin:0}.abp-list ul{margin:.3em 0;padding-left:1.1em;font-size:.85rem}`;

// a small markdown renderer: headings, paragraphs, lists, tables, quotes, **bold**, `code`, links
export function md(src, esc) {
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https:\/\/[^\s<)]+[^\s<).,;:])/g, '$1<a href="$2">$2</a>');
  const out = []; let list = null, table = null, para = [];
  const flush = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
    if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; }
    if (table) { const [h, ...rows] = table; out.push(`<div class="tw"><table><thead><tr>${h.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); table = null; }
  };
  for (const line of src.replace(/^---[\s\S]*?\n---\n/, '').split('\n')) {
    let m;
    if (!line.trim()) { flush(); continue; }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { flush(); const n = Math.min(m[1].length + (m[1].length === 1 ? 0 : 0), 4); out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^\|/.test(line)) { if (list || para.length) flush(); const cells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()); if (cells.every((c) => /^:?-+:?$/.test(c) || c === '')) continue; (table ||= []).push(cells); continue; }
    if ((m = /^>\s?(.*)$/.exec(line))) { flush(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = /^\s*(?:[-*]|(\d+)\.)\s+(.*)$/.exec(line))) { if (para.length || table) flush(); const t = m[1] ? 'ol' : 'ul'; if (list && list.t !== t) flush(); (list ||= { t, items: [] }).items.push(m[2]); continue; }
    if (list && /^\s+\S/.test(line)) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
    if (list || table) flush();
    para.push(line.trim());
  }
  flush();
  return out.join('\n');
}

export function guidanceBody(esc) {
  const src = readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8');
  return `<style>${guidanceCss}</style><div class="gd">${md(src, esc)}</div>
<p class="muted">This page is built from <code>CONTRIBUTING.md</code> in the repository. The grants it describes are in <a href="/abp/">the Agent Behaviour Policies</a>.</p>`;
}

export function abpBody(esc, REPO) {
  const f = join(root, 'abp/index.json');
  if (!existsSync(f)) return '<h1>Agent Behaviour Policies</h1><p>Not built yet.</p>';
  const ix = JSON.parse(readFileSync(f, 'utf8'));
  const card = (a) => `<div class="card"><strong>${esc(a.agent)}</strong><div class="muted">${esc(a.role)}${a.account ? ' · ' + esc(a.account) : ''} · pushes to ${esc(a.branch)}</div>
<ul>${a.writes.map((w) => `<li><code>${esc(w)}</code></li>`).join('')}</ul>${a.owns.length ? `<div class="muted">Owns: ${a.owns.map((o) => `<code>${esc(o)}</code>`).join(', ')}</div>` : ''}
<a href="${esc(REPO)}/blob/dev/${esc(a.page)}">its ABP</a></div>`;
  return `<style>${guidanceCss}</style>
<h1>Agent Behaviour Policies</h1>
<p><strong>Who may edit what, where.</strong> Every agent that builds this site has a grant: the paths it writes, the hosts it sends to, the tools it uses. Deny by default. Policy <code>abp/policies.json</code> v${esc(ix.policy)} (sha256:${esc(ix.sha256)}).</p>
<div class="card"><strong>Mode: ${esc(ix.mode)}.</strong> Nothing is blocked. The hooks and the gate log every action outside a grant, so the team can learn which lines are right; a rule moves towards enforcement only after two or three rounds of logs, and only by Dinis's decision, rule by rule. A conductor or Dinis can always override, and the override is logged.</div>
<p>External contributors and their agents: read <a href="/guidance/">the guidance</a>.</p>
<h2>${ix.agents.length} agents</h2>
<div class="abp-list">${ix.agents.map(card).join('')}</div>
<p class="muted">Built from <code>abp/index.json</code> (<code>node abp/tools/abp.mjs build</code>). The map of who actually writes where, from git: <a href="/api/v1/architecture.json">/api/v1/architecture.json</a>.</p>`;
}
