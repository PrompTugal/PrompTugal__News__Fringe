#!/usr/bin/env node
// The index catalog (elastic.1.fringe@PrompTugal.dinis): every index on the swarm's Elastic, its owner, documents and
// what it holds, written to data/elastic-catalog.json as a feed (so it lands in swarm-elastic-catalog at the next
// elastic-feeds.mjs run, and is readable in git by agents without Elastic). docs/elastic-guidance.md section 7.
//
//   ELASTIC_URL=https://... node admin/tools/elastic-catalog.mjs

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { auth, base, STEWARD } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const WHAT = {
    'fringe-events': ['Lisbon Tech Fringe events, each re-read at its public URL', 'admin/tools/elastic.mjs', 'Lisbon Tech Fringe: the week live'],
    'fringe-graph': ['the semantic graph: festivals, organisers, personas, sessions', 'admin/tools/elastic.mjs', 'Lisbon Tech Fringe: the week live'],
    'fringe-tasks': ['task packets and their signed results (tasks/)', 'admin/tools/elastic.mjs', ''],
    'fringe-models': ["the model router's ledger, day summaries only", 'admin/tools/elastic.mjs', 'Lisbon Tech Fringe: the week live'],
    'fringe-hooklog': ["ABP hook decisions (elastic.1's session; others to come)", 'admin/tools/elastic.mjs', 'The agentic team: who did what, and under which policy'],
    'fringe-workloads': ['distributed workloads: runtimes, endpoints, placements, matrix, altitudes, trials, reach, packets, Angelo\'s runs and traces', 'admin/tools/elastic-workloads.mjs', 'Distributed workloads: the altitudes of execution (Dinis and Angelo)'],
    'fringe-altitudes': ["every unit of every agentic run (architect.1's data/altitude-runs.json)", 'admin/tools/elastic-altitudes.mjs', 'The altitudes of execution, live'],
    'elastic-submissions': ['the audit trail: every submission by every agent', 'admin/tools/elastic-lib.mjs submitDocs', 'Elastic operations: who submits what'],
}
for (const s of ['fringe', 'ptnews', 'websummit']) for (const k of ['commits', 'content', 'entities', 'runs', 'status'])
    WHAT[`${s}-${k}`] = [`${{ fringe: 'Lisbon Tech Fringe', ptnews: 'PrompTugal.news', websummit: 'the Web Summit site' }[s]}: ${k}, from its public repository`, 'admin/tools/elastic-sites.mjs', { fringe: 'Lisbon Tech Fringe: the week live', ptnews: 'PrompTugal.news: the agentic newsroom', websummit: "Web Summit site: the team's field guide" }[s]]

const h = auth()
const cat = await (await fetch(`${base()}/_cat/indices/fringe-*,ptnews-*,websummit-*,swarm-*,agents-*,elastic-*?format=json&h=index,docs.count,store.size`, { headers: h })).json()
const maps = await (await fetch(`${base()}/fringe-*,ptnews-*,websummit-*,swarm-*,agents-*,elastic-*/_mapping`, { headers: h })).json()
const docs = cat.sort((a, b) => a.index.localeCompare(b.index)).map(c => {
    const meta = maps[c.index]?.mappings?._meta || {}, w = WHAT[c.index] || []
    return { id: c.index, index: c.index, owner: meta.owner || STEWARD, docs: +c['docs.count'], size: c['store.size'],
        about: meta.about || w[0] || '', tool: w[1] || (meta.owner && meta.owner !== STEWARD ? 'admin/tools/elastic-submit.mjs' : ''), dashboard: w[2] || '',
        created_at: meta.created_at, dynamic: Object.keys(maps[c.index]?.mappings?.properties || {}).length }
})
const out = { elastic_feed: { index: 'swarm-elastic-catalog', owner: STEWARD, id: 'id', time: 'read_at', docs: 'docs', about: 'every index on the swarm\'s Elastic, its owner and what it holds' },
    about: 'The index catalog of the swarm\'s Elastic (docs/elastic-guidance.md section 7), written by admin/tools/elastic-catalog.mjs.', read_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), by: STEWARD,
    docs: docs.map(d => ({ ...d, read_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') })) }
fs.writeFileSync(path.join(ROOT, 'data', 'elastic-catalog.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`data/elastic-catalog.json: ${docs.length} indices, ${docs.reduce((s, d) => s + d.docs, 0)} documents; owners: ${[...new Set(docs.map(d => d.owner))].join(', ')}`)
