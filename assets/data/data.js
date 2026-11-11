// /data/ (work/43, dev.1.fringe@PrompTugal.dinis, 11 November 2026, brief 13, Dinis: "add the graph, so we can actually query
// using SQL, which actually is quite cool"). SQL in the browser with sql.js (SQLite compiled to WebAssembly), loaded from a
// pinned cdnjs version and checked by its hash (the script by SRI, the .wasm by fetch integrity). The tables are made from our
// own public JSON: /api/v1/events.json, /api/v1/graph.json and, as they land, /api/v1/graph/<type>.json (work/42). Nothing
// you type leaves the browser.
(() => {
  'use strict';
  const WASM = { url: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm', integrity: 'sha384-kSm0AH9ho89napVfNFf/kCRTH6xBoCS3qf/ATGJeYFQFKiegBMLhQ3aUIZBlYLpa' };
  const GRAPH_TYPES = ['days', 'festivals', 'organisers', 'events', 'sessions', 'places', 'personas', 'topics'];
  const $ = (id) => document.getElementById(id);
  const today = new Date().toISOString().slice(0, 10);
  const ident = (s) => String(s).replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1');
  const scalar = (v) => (v === null || v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : typeof v === 'number' || typeof v === 'string' ? v : JSON.stringify(v));

  const getJson = async (u) => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
  // the rows of a graph file, whatever its wrapper: an array, or the first array inside an object ({ items | <type> | nodes ... })
  const rowsOf = (j, type) => Array.isArray(j) ? j : Array.isArray(j?.[type]) ? j[type] : Array.isArray(j?.items) ? j.items : (Object.values(j || {}).find((v) => Array.isArray(v) && v.length && typeof v[0] === 'object') || []);

  function load(db, name, rows, extra) {
    const cols = []; const seen = new Set();
    for (const r of rows) for (const k of Object.keys(r)) if (!seen.has(k)) { seen.add(k); cols.push(k); }
    const names = cols.map(ident); const all = names.concat(extra ? extra.map((e) => e[0]) : []);
    if (!all.length) return null;
    const types = cols.map((c) => (rows.every((r) => r[c] == null || typeof r[c] === 'number' || typeof r[c] === 'boolean') ? 'NUMERIC' : 'TEXT'));
    db.run(`CREATE TABLE ${name} (${all.map((c, i) => `"${c}" ${types[i] || 'TEXT'}`).join(', ')})`);
    const st = db.prepare(`INSERT INTO ${name} VALUES (${all.map(() => '?').join(',')})`);
    for (const r of rows) st.run(cols.map((c) => scalar(r[c])).concat(extra ? extra.map((e) => e[1](r)) : []));
    st.free();
    return { name, columns: all, rows: rows.length };
  }

  const EXAMPLES = [
    ['Free events from now on', `SELECT start, name, kind, neighbourhood, page\nFROM events\nWHERE cost = 'free' AND start >= '{now}'\nORDER BY start\nLIMIT 25;`],
    ['Organisers by number of events', `SELECT organiser, COUNT(*) AS events\nFROM events\nGROUP BY organiser\nORDER BY events DESC\nLIMIT 20;`],
    ['Events for investors and founders', `SELECT start, name, organiser, page\nFROM events\nWHERE date >= '{today}'\n  AND (topics LIKE '%invest%' OR name LIKE '%nvestor%' OR name LIKE '%VC%' OR name LIKE '%ounder%')\nORDER BY start\nLIMIT 25;`],
    ['What the storm moved', `SELECT date, name, status, storm_note, page\nFROM events\nWHERE storm_moved = 1 OR status IN ('moved', 'cancelled')\nORDER BY date, start;`],
    ['Sessions of Portugal Tech Week', `SELECT date, start, name, organiser, page\nFROM events\nWHERE name LIKE '%Portugal Tech Week%' OR organiser LIKE '%Portugal Tech Week%'\nORDER BY start\nLIMIT 50;`],
    ['Events by neighbourhood', `SELECT neighbourhood, COUNT(*) AS events\nFROM events\nWHERE neighbourhood IS NOT NULL\nGROUP BY neighbourhood\nORDER BY events DESC;`],
  ];

  function render(cols, rows) {
    const out = $('out'); out.textContent = '';
    if (!cols.length) { out.textContent = 'Done (no rows returned).'; return; }
    const t = document.createElement('table'); t.className = 'sqt';
    const hr = t.createTHead().insertRow();
    for (const c of cols) { const th = document.createElement('th'); th.textContent = c; hr.appendChild(th); }
    const b = t.createTBody();
    for (const r of rows) {
      const tr = b.insertRow();
      r.forEach((v, i) => {
        const td = tr.insertCell(); const s = v === null ? '' : String(v);
        if (cols[i] === 'page' && /^\/[a-z0-9\/_-]+\/$/i.test(s)) { const a = document.createElement('a'); a.href = s; a.textContent = 'open'; td.appendChild(a); }
        else if (/^https:\/\/[^\s]+$/.test(s) && /^(url|source|link)$/i.test(cols[i])) { const a = document.createElement('a'); a.href = s; a.rel = 'noopener noreferrer'; a.textContent = s.replace(/^https:\/\//, '').slice(0, 60); td.appendChild(a); }
        else td.textContent = s;
      });
    }
    const w = document.createElement('div'); w.className = 'sqw'; w.appendChild(t); out.appendChild(w);
    const n = document.createElement('p'); n.className = 'muted'; n.textContent = rows.length + ' row' + (rows.length === 1 ? '' : 's') + (rows.length >= 1000 ? ' (first 1000 shown)' : ''); out.appendChild(n);
  }

  async function main() {
    const status = (t, bad) => { const e = $('status'); e.textContent = t; e.className = 'muted' + (bad ? ' bad' : ''); };
    try {
      status('Loading SQLite (WebAssembly) and the data…');
      const [wasm, events, graph] = await Promise.all([
        fetch(WASM.url, { integrity: WASM.integrity, credentials: 'omit' }).then((r) => { if (!r.ok) throw new Error('wasm ' + r.status); return r.arrayBuffer(); }),
        getJson('/api/v1/events.json'), getJson('/api/v1/graph.json').catch(() => null),
      ]);
      const SQL = await window.initSqlJs({ wasmBinary: wasm });
      const db = new SQL.Database();
      const tables = [];
      tables.push(load(db, 'events', (events.events || []).map((e) => ({ ...e, check_note: e.check })), [['page', (r) => '/e/' + encodeURIComponent(r.id) + '/']]));
      if (graph) { tables.push(load(db, 'nodes', graph.nodes || [])); tables.push(load(db, 'edges', graph.edges || [])); }
      // the semantic graph (work/42), as its files land: one table per type, g_<type>
      await Promise.all(GRAPH_TYPES.map(async (t) => { try { const rows = rowsOf(await getJson('/api/v1/graph/' + t + '.json'), t); if (rows.length) tables.push(load(db, 'g_' + t, rows)); } catch { /* not built yet */ } }));
      const list = tables.filter(Boolean);
      $('tables').innerHTML = '';
      for (const t of list) { const li = document.createElement('li'); const b = document.createElement('strong'); b.textContent = t.name; li.append(b, document.createTextNode(` (${t.rows} rows): ${t.columns.join(', ')}`)); $('tables').appendChild(li); }
      const run = () => {
        const sql = $('sql').value.replace(/\{today\}/g, today).replace(/\{now\}/g, new Date().toISOString().slice(0, 16));
        const t0 = performance.now();
        try { const res = db.exec(sql); const r = res[res.length - 1]; if (!r) render([], []); else render(r.columns, r.values.slice(0, 1000)); const ms = Math.round(performance.now() - t0), n = r ? r.values.length : 0; status(n + ' row' + (n === 1 ? '' : 's') + ' in ' + ms + ' ms, run in your browser.'); }
        catch (e) { $('out').textContent = ''; status('SQL error: ' + e.message, true); }
        try { history.replaceState(null, '', '?sql=' + encodeURIComponent($('sql').value.slice(0, 1500))); } catch { /* ignore */ }
      };
      $('run').onclick = run;
      $('sql').addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); });
      const ex = $('examples'); ex.textContent = '';
      EXAMPLES.forEach(([label, q]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'alt'; b.textContent = label; b.onclick = () => { $('sql').value = q; run(); }; ex.appendChild(b); });
      $('run').disabled = false;
      const q = new URLSearchParams(location.search).get('sql');
      if (q) { $('sql').value = q.slice(0, 1500); run(); } else { $('sql').value = EXAMPLES[1][1]; run(); }
      status('Ready: ' + list.length + ' tables loaded from the public API. Nothing you type leaves your browser.');
    } catch (e) { status('Could not start: ' + e.message, true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
