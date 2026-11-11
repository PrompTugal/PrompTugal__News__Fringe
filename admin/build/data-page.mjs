// /data/ (work/43, dev.1.fringe@PrompTugal.dinis): SQL in the browser over the site's own public JSON. The code is assets/data/data.js.
// sql.js 1.10.3 from cdnjs, pinned and hash-checked (script: SRI here; .wasm: fetch integrity in data.js).
export const dataCss = `.sq textarea{width:100%;min-height:9em;font:14px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;padding:8px;border:1px solid var(--rule,#d8d4cb);border-radius:6px;background:var(--card,#fff);color:var(--ink,#121317)}
.sq button{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid var(--ink,#121317);background:var(--ink,#121317);color:var(--paper,#f6f3ec);cursor:pointer;margin:4px 6px 4px 0;min-height:44px}.sq button.alt{background:transparent;color:inherit}.sq button:disabled{opacity:.5}
.sqw{overflow-x:auto;max-width:100%}.sqt{border-collapse:collapse;font-size:.9rem}.sqt th,.sqt td{border-bottom:1px solid var(--rule,#d8d4cb);padding:4px 8px;text-align:left;vertical-align:top;max-width:28em;overflow-wrap:anywhere}.sqt th{position:sticky;top:0;background:var(--paper,#f6f3ec)}.sq .bad{color:#c52830}`;
export function dataBody(esc) {
  return `<div class="sq"><h1>Query the graph with SQL</h1>
<p>Ask the data anything, in SQL, in your browser. The tables are made from the site's own public JSON (<a href="/api/v1/events.json">events.json</a>, <a href="/api/v1/graph.json">graph.json</a> and, as they land, <code>/api/v1/graph/&lt;type&gt;.json</code>). <strong>Nothing you type leaves your browser.</strong> It runs <a href="https://sql.js.org/">sql.js</a> (SQLite compiled to WebAssembly), pinned to one version and checked by hash.</p>
<h2>Try one</h2><div id="examples" class="muted">Loading…</div>
<h2>Your query</h2><textarea id="sql" spellcheck="false" aria-label="SQL query">SELECT organiser, COUNT(*) AS events FROM events GROUP BY organiser ORDER BY events DESC LIMIT 20;</textarea>
<p><button type="button" id="run" disabled>Run (Ctrl+Enter)</button> <span id="status" class="muted" aria-live="polite">Loading…</span></p>
<div id="out"></div>
<h2>The tables</h2><p class="muted">Every column is text or a number; lists (topics) are text, so use LIKE. <code>{today}</code> in a query becomes today's date (UTC), and <code>{now}</code> the current time. A column named <code>page</code> becomes a link to the site's page.</p><ul id="tables"><li>Loading…</li></ul>
<noscript><p>This page needs JavaScript: the SQL runs in your browser.</p></noscript></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js" integrity="sha384-8D3Rsfo535FqoC1pHCCQMrNf75UgzyoG/HQm9zOzITRrz3QKzecc2E7JXKGCXoWu" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="/assets/data/data.js" defer></script>`;
}
