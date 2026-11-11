#!/usr/bin/env node
// The pull path (elastic.1.fringe@PrompTugal.dinis, each hourly wake): any JSON file committed in this repository with a
// top-level "elastic_feed" is sent to Elastic for its owner, so an agent without the password or the host in its grant
// still lands its data (docs/elastic-guidance.md). The owner is the Agent: trailer of the file's last commit; the feed
// must name the same owner, or it is skipped and reported.
//
//   {"elastic_feed": {"index": "swarm-<kind>", "owner": "<agent>", "id": "id", "time": "born", "docs": "docs", "about": "..."},
//    "docs": [ {...}, ... ]}
//
//   ELASTIC_URL=https://... node admin/tools/elastic-feeds.mjs [--dry]

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { submitDocs } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && !process.argv.includes('--dry')) {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'), dry = process.argv.includes('--dry')
const git = c => execSync(`git -C "${ROOT}" ${c}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }).trim()
const HEAD = git('rev-parse --short HEAD')
let found = ''; try { found = git('grep -l -e "\\"elastic_feed\\"" -- "*.json"') } catch { /* no match */ }
const files = found.split('\n').filter(f => f && !f.startsWith('_site/') && !f.startsWith('elastic/examples/'))
let failed = 0
for (const f of files) {
    let j; try { j = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')) } catch { console.log(`${f}: not JSON, skipped`); continue }
    const feed = j.elastic_feed; if (!feed || typeof feed !== 'object') continue
    const committer = (git(`log -1 --format=%B -- "${f}"`).match(/^Agent:\s*(\S+)/m) || [])[1]
    if (!committer || (feed.owner && feed.owner !== committer)) { console.log(`${f}: feed owner ${feed.owner || '(none)'} is not the last committer ${committer || '(none)'}; skipped`); failed++; continue }
    try {
        const r = await submitDocs({ index: feed.index, docs: j[feed.docs || 'docs'] || [], agent: committer, idField: feed.id || 'id', timeField: feed.time,
            source: `repo:${f}@${HEAD}`, commit: HEAD, about: feed.about || '', dry, via: 'feed' })
        console.log(`${f} -> ${feed.index}: ${r.ok} documents${dry ? ' (dry)' : `, ${r.sent} sent, ${r.errors} errors`}, ${r.held.length} held back; owner ${r.owner}`)
        for (const h of r.held.slice(0, 5)) console.log(`  held: ${h}`)
        if (r.errors) failed++
    } catch (e) { console.log(`${f}: ${e.message}`); failed++ }
}
if (!files.length) console.log('no feeds (no committed JSON with a top-level "elastic_feed")')
process.exit(failed ? 1 : 0)
