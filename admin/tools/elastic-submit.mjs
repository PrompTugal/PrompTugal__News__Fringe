#!/usr/bin/env node
// Any agent sends its own data to the swarm's Elastic (docs/elastic-guidance.md; elastic.1.fringe@PrompTugal.dinis
// keeps the deployment and watches every submission). Dinis, 11 November 2026: "multiple agents here should be
// submitting to Elastic ... allow all the other agents to submit, and then you can keep an eye and manage it".
//
//   AGENT=<you> ELASTIC_URL=https://<deployment>.es... node admin/tools/elastic-submit.mjs \
//        --index swarm-<kind> --file <docs.json | docs.ndjson> [--id id] [--time born] [--source <url or repo path>] [--about "..."] [--dry]
//
// The file: a JSON array, {"docs": [...]}, a feed file ({"elastic_feed": {...}, "docs": [...]}) or NDJSON. Each
// document gets source, read_at, signer, commit, ingested_at, ingested_by, t; contact-named fields are dropped; one
// that looks like it holds an email, a phone or a key is held back and named. The index is created on first write,
// owned by you (its _meta.owner); only you write to it after. The password: ELASTIC_CLOUD from the environment, never printed.

import fs from 'node:fs'
import { execSync, spawnSync } from 'node:child_process'
import { submitDocs } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && !process.argv.includes('--dry')) {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const opt = {}
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) opt[process.argv[i].slice(2)] = (process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) ? process.argv[++i] : true
if (!opt.index || !opt.file) { console.log('usage: AGENT=<you> elastic-submit.mjs --index <prefix>-<kind> --file <json|ndjson> [--id field] [--time field] [--source s] [--about text] [--dry]'); process.exit(2) }
const raw = fs.readFileSync(opt.file, 'utf8')
let docs, feed = {}
try { const j = JSON.parse(raw); feed = j.elastic_feed || {}; docs = Array.isArray(j) ? j : (j[feed.docs || 'docs'] || []) }
catch { docs = raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l)) }
const commit = (() => { try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } })()
let r
try { r = await submitDocs({ index: opt.index, docs, agent: process.env.AGENT, idField: opt.id || feed.id || 'id', timeField: opt.time || feed.time,
    source: opt.source || `repo:${opt.file}@${commit}`, commit, about: opt.about || feed.about || '', dry: !!opt.dry }) }
catch (e) { console.error(`elastic-submit: ${e.message}`); process.exit(1) }
console.log(`${opt.index}: ${r.ok} documents${opt.dry ? ' (dry: nothing sent)' : `, ${r.sent} sent, ${r.errors} errors`}, ${r.held.length} held back; owner ${r.owner}`)
for (const h of r.held.slice(0, 10)) console.log(`  held: ${h}`)
process.exit(r.errors ? 1 : 0)
