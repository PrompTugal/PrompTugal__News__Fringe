#!/usr/bin/env node
// Elastic to git, for agents that may not read Elastic (R8e: only elastic.1 and architect.1 hold ELASTIC_CLOUD).
// elastic.1.fringe@PrompTugal.dinis exports the fields an agent needs from an index into data/elastic-export-<index>.json,
// re-run at every hourly wake. The privacy checks run on every document; a document with a finding is left out.
//
//   ELASTIC_URL=https://... node admin/tools/elastic-export.mjs --index swarm-flows --fields trace_id,span_id,parent_span_id,altitude,environment,runner [--for <agent>] [--max 10000]

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { auth, base, findings, STEWARD } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const opt = {}
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) opt[process.argv[i].slice(2)] = process.argv[i + 1]
if (!opt.index || !opt.fields || !/^[a-z0-9-]+$/.test(opt.index)) { console.log('usage: elastic-export.mjs --index <index> --fields a,b,c [--for agent] [--max n]'); process.exit(2) }
const fields = opt.fields.split(','), max = Math.min(+opt.max || 10000, 10000)
const r = await fetch(`${base()}/${opt.index}/_search`, { method: 'POST', headers: { ...auth(), 'content-type': 'application/json' },
    body: JSON.stringify({ size: max, _source: fields, sort: [{ _doc: 'asc' }] }) })
if (!r.ok) { console.error(`elastic-export: ${opt.index}: HTTP ${r.status}`); process.exit(1) }
const j = await r.json(), docs = [], held = []
for (const h of j.hits.hits) { const f = findings(h._source, h._id); if (f.length) held.push(f[0]); else docs.push({ _id: h._id, ...h._source }) }
const meta = Object.values(await (await fetch(`${base()}/${opt.index}/_mapping`, { headers: auth() })).json())[0]?.mappings?._meta || {}
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const out = { about: `An export of ${opt.index} (fields: ${fields.join(', ')}) for agents that do not read Elastic (R8e). Written by ${STEWARD} with admin/tools/elastic-export.mjs, re-run at each hourly wake.`,
    index: opt.index, owner: meta.owner || STEWARD, for: opt.for || 'any agent', fields, read_at: now, total_in_index: j.hits.total.value, exported: docs.length, held_back: held.length, docs }
// Compact and chunked, so no file comes near the repository's 256 KB rule (security finding 45): rows (one array per
// document, in the order of `columns`) instead of repeated field names, split into chunks of at most CHUNK bytes.
// The index file (data/elastic-export-<index>.json) lists the chunks; each chunk is data/elastic-export-<index>-<n>.json.
const CHUNK = 200 * 1024, columns = ['_id', ...fields]
// columns with few distinct values (environment, runner, role ...) are stored once in `dict` and referenced by number
const dict = {}
for (const c of columns) { const vals = [...new Set(docs.map(d => d[c]).filter(v => typeof v === 'string'))]; if (vals.length && vals.length <= 300 && vals.length < docs.length / 3) dict[c] = vals }
const enc = (c, v) => dict[c] && typeof v === 'string' ? dict[c].indexOf(v) : (v ?? null)
const rows = docs.map(d => columns.map(c => enc(c, d[c])))
const chunks = []; let cur = [], size = 0
for (const r of rows) { const n = JSON.stringify(r).length + 2; if (size + n > CHUNK && cur.length) { chunks.push(cur); cur = []; size = 0 } cur.push(r); size += n }
if (cur.length) chunks.push(cur)
const stem = `elastic-export-${opt.index}`
for (const f of fs.readdirSync(path.join(ROOT, 'data')).filter(f => new RegExp(`^${stem}-\\d+\\.json$`).test(f))) fs.unlinkSync(path.join(ROOT, 'data', f))   // old chunks
const names = chunks.map((c, i) => { const name = `${stem}-${i + 1}.json`; fs.writeFileSync(path.join(ROOT, 'data', name), JSON.stringify({ index: opt.index, part: i + 1, of: chunks.length, columns, rows: c }) + '\n'); return name })
delete out.docs
out.format = 'columns + rows, chunked: read each chunk in `chunks`, zip its rows with `columns`, and map dict-coded columns through `dict`'
out.columns = columns; out.dict = dict; out.dict_note = 'a column listed in dict holds the index of its value in dict[column]'; out.chunks = names.map(n => `data/${n}`)
const file = path.join(ROOT, 'data', `${stem}.json`)
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n')
const big = Math.max(...names.map(n => fs.statSync(path.join(ROOT, 'data', n)).size))
console.log(`data/${stem}.json: ${docs.length} of ${j.hits.total.value} documents in ${names.length} chunk(s), largest ${(big / 1024).toFixed(0)} KB, ${held.length} held back`)
