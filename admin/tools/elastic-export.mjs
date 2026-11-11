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
const file = path.join(ROOT, 'data', `elastic-export-${opt.index}.json`)
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n')
console.log(`${path.relative(ROOT, file)}: ${docs.length} of ${j.hits.total.value} documents, ${held.length} held back, ${(fs.statSync(file).size / 1024).toFixed(0)} KB`)
