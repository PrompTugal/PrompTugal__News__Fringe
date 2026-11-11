#!/usr/bin/env node
// The agentic runs on Elastic: fringe-altitudes (elastic.1.fringe@PrompTugal.dinis, WS-215). Dinis, 11 November 2026:
// "a new dashboard that is going to focus on the work me and Angelo are doing on distributed workloads"; the data is
// architect.1's export, data/altitude-runs.json (abp/tools/runs-export.mjs, from signed sources only), spec in
// docs/handoffs/2026-11-11-altitudes-on-elastic.md. One document per unit of work (A3 agent, A2 loops, A1 LLM calls,
// A0 compute, packets and their results), its `id` stable, so a re-push updates.
//
//   node admin/tools/elastic-altitudes.mjs build
//   ELASTIC_URL=https://... node admin/tools/elastic-altitudes.mjs push [--recreate]
//
// Never: key material (fingerprints only), prompt text, any person's data. A unit with a finding is held back.

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { findings, redact, idOf, clean, pushIndex, scrubFields } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && process.argv[2] === 'push') {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = 'data/altitude-runs.json', INDEX = 'fringe-altitudes', ME = 'elastic.1.fringe@PrompTugal.dinis'
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const git = c => { try { return execSync(`git -C "${ROOT}" ${c}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }
const HEAD = git('rev-parse --short HEAD')
const signer = (git(`log -1 --format=%B -- ${SRC}`).match(/^Agent:\s*(\S+)/m) || [])[1] || 'unknown'

const kw = { type: 'keyword' }, date = { type: 'date' }, long = { type: 'long' }, dbl = { type: 'double' }, bool = { type: 'boolean' }
export const MAPPING = { settings: { number_of_shards: 1 }, mappings: { dynamic: 'strict', properties: {
    // provenance (every index)
    kind: kw, source: kw, read_at: date, signer: kw, commit: kw, ingested_at: date, ingested_by: kw,
    // the spec (docs/handoffs/2026-11-11-altitudes-on-elastic.md)
    id: kw, run: kw, parent: kw, run_kind: kw, altitude: kw, role: kw, unit: { type: 'text', fields: { raw: { type: 'keyword', ignore_above: 512 } } },
    person: kw, runner: kw, issuer: kw, for: kw, environment: kw, key_fp: kw, born: date, signed_at: date, duration_ms: long,
    model: kw, cost_usd: dbl, latency_ms: long, valid: bool, verified: bool, item: kw, attempt: { type: 'integer' },
    outputs: { type: 'integer' }, valid_outputs: { type: 'integer' }, valid_share: dbl,
    reach_needs: { type: 'integer' }, reach_held: { type: 'integer' }, reach_exposure: { type: 'integer' }, reach_exposed: kw, grant: kw,
    // extra: the time each unit is drawn at, its depth in the tree, the objective, the rest
    t: date, depth: { type: 'integer' }, unverified: { type: 'integer' }, invalid: { type: 'integer' }, mixing: bool,
    objective: { type: 'text' }, max_tokens: { type: 'integer' }, tier: kw, items: { type: 'integer' }, calls: { type: 'integer' }, inputs: { type: 'integer' },
    attrs: { type: 'flattened', ignore_above: 1024 },
} } }

const d = JSON.parse(fs.readFileSync(path.join(ROOT, SRC), 'utf8'))
const units = d.docs || []
const byId = new Map(units.map(u => [u.id, u]))
const depth = u => { let n = 0, p = u; while (p?.parent && byId.has(p.parent) && n < 10) { p = byId.get(p.parent); n++ } return n }
const iso = v => (typeof v === 'string' && !isNaN(new Date(v))) ? new Date(v).toISOString() : undefined
const num = v => (v === null || v === undefined || v === '' || isNaN(+v)) ? undefined : +v
const arr = v => Array.isArray(v) ? v.map(String) : (v === undefined || v === null ? undefined : [String(v)])
const count = v => Array.isArray(v) ? v.length : num(v)

const docs = units.map(u => {
    const rc = u.runner_choices && typeof u.runner_choices === 'object' ? u.runner_choices : {}
    const doc = {
        kind: 'altitude-unit', source: `repo:${SRC}@${HEAD}#${u.id}`, read_at: iso(d.generated) || NOW, signer, commit: HEAD, ingested_at: NOW, ingested_by: ME,
        id: u.id, run: u.run, parent: u.parent || undefined, run_kind: u.run_kind, altitude: u.altitude, role: u.role, unit: redact(u.unit, 400),
        person: u.person, runner: u.runner, issuer: u.issuer, for: typeof u.for === 'string' ? u.for : undefined, environment: u.environment || 'unknown',
        key_fp: u.key_fp, born: iso(u.born), signed_at: iso(u.signed_at), duration_ms: num(u.duration_ms),
        model: u.model || undefined, cost_usd: num(u.cost_usd), latency_ms: num(u.latency_ms),
        valid: typeof u.valid === 'boolean' ? u.valid : undefined, verified: typeof u.verified === 'boolean' ? u.verified : undefined,
        item: u.item === undefined ? undefined : String(u.item), attempt: num(u.attempt),
        outputs: count(u.outputs), valid_outputs: num(u.valid_outputs), valid_share: num(u.valid_share),
        reach_needs: count(u.reach_needs), reach_held: count(u.reach_held), reach_exposure: count(u.reach_exposure),
        reach_exposed: arr(u.reach_exposed), grant: arr(u.grant),
        t: iso(u.born) || iso(u.signed_at) || iso(d.generated), depth: depth(u),
        unverified: u.verified === false ? 1 : 0, invalid: u.valid === false ? 1 : 0, mixing: count(u.reach_exposure) > 2,
        objective: u.objective ? redact(u.objective, 1000) : undefined,
        max_tokens: num(rc.max_tokens), tier: rc.tier || undefined, items: count(u.items), calls: count(u.calls), inputs: count(u.inputs),
        attrs: scrubFields({ runner_choices: rc }),
    }
    return { _id: idOf('altitudes', u.id), doc: clean(doc) }
})

const props = new Set(Object.keys(MAPPING.mappings.properties)), ok = [], bad = []
for (const x of docs) {
    const f = [...Object.keys(x.doc).filter(k => !props.has(k)).map(k => `field ${k} not in the mapping`), ...findings(x.doc, x.doc.id)]
    if (f.length) bad.push(...f.slice(0, 2)); else ok.push(x)
}
const by = {}; for (const x of ok) by[x.doc.altitude] = (by[x.doc.altitude] || 0) + 1
console.log(`${INDEX}: ${ok.length} units (${Object.entries(by).sort().map(([k, v]) => `${k} ${v}`).join(', ')}), ${ok.filter(x => x.doc.verified).length} verified, ${docs.length - ok.length} held back`)
for (const b of bad.slice(0, 8)) console.log(`  held: ${b}`)
if (process.argv[2] === 'push') {
    const r = await pushIndex(INDEX, MAPPING, ok, { recreate: process.argv.includes('--recreate') })
    console.log(`${INDEX}: ${r.sent} sent, ${r.errors} errors`)
    if (r.errors) process.exit(1)
}
