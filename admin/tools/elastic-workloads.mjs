#!/usr/bin/env node
// Distributed workloads on Elastic (elastic.1.fringe@PrompTugal.dinis, WS-215; Dinis, 11 November 2026, 18:2x UTC:
// "a new dashboard that is going to focus on the work me and Angelo are doing on distributed workloads").
// One index, fringe-workloads, one document per fact of the model, each with a `facet`:
//
//   runtime, endpoint, io_level, mode       where agents can run and how a model is used (data/runtimes.json)
//   placement                               each agent's runtime, models, I/O level, account, mode (data/runtimes.json agents)
//   task                                    the where-agents-run matrix: a task, who does it now, what could (matrix)
//   altitude, trial                         the altitudes of execution, and the open-weight trials (data/operating-model.json)
//   work                                    every board item at its lowest altitude (data/work-altitudes.json, signed)
//   reach                                   each unit's needed, held, exposed and missing primitives (data/run-reach.json)
//   packet, output                          task packets run in other environments and each signed output (tasks/)
//   run                                     Angelo's conductor's run log, one line per agentic activity (team/angelo/runs.md)
//   trace                                   each step of Angelo's event-page traces (team/angelo/traces/*.json)
//
//   node admin/tools/elastic-workloads.mjs build
//   ELASTIC_URL=https://... node admin/tools/elastic-workloads.mjs push [--recreate]
//
// Human steps in traces are written as "a person": only agents are named (a trace notes one sender is private).

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { scrubFields, findings, redact, idOf, clean, pushIndex } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && process.argv[2] === 'push') {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ME = 'elastic.1.fringe@PrompTugal.dinis', INDEX = 'fringe-workloads'
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const git = c => { try { return execSync(`git -C "${ROOT}" ${c}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }).trim() } catch { return '' } }
const HEAD = git('rev-parse --short HEAD')
const read = p => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')) } catch { return null } }
const lastT = p => git(`log -1 --format=%cI -- "${p}"`) || NOW
const lastAgent = p => (git(`log -1 --format=%B -- "${p}"`).match(/^Agent:\s*(\S+)/m) || [])[1] || 'unknown'
const personOf = a => String(a || '').includes('@') ? String(a).split('@')[1].split('.').pop().toLowerCase() : undefined
const iso = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !isNaN(new Date(v))) ? new Date(v).toISOString() : undefined
const ALT = s => (String(s || '').match(/\bA[0-4]\b/) || [])[0]
const RT = s => (String(s || '').match(/\bR\d\b/) || [])[0]
const ARR = v => Array.isArray(v) ? v : []

const kw = { type: 'keyword' }, txt = { type: 'text', fields: { raw: { type: 'keyword', ignore_above: 512 } } }
export const MAPPING = { settings: { number_of_shards: 1 }, mappings: { dynamic: 'strict', properties: {
    kind: kw, source: kw, read_at: { type: 'date' }, signer: kw, commit: kw, ingested_at: { type: 'date' }, ingested_by: kw,
    facet: kw, id: kw, name: txt, text: { type: 'text' }, t: { type: 'date' },
    agent: kw, person: kw, role: kw, altitude: kw, runtime: kw, model: kw, endpoint: kw, io_level: kw, mode: kw, loop: kw,
    account: kw, status: kw, label: kw, judgement: kw, data_class: kw, now: kw, could: kw, step_kind: kw, packet: kw, trace: kw,
    cost_usd: { type: 'double' }, latency_ms: { type: 'double' }, tokens: { type: 'long' }, calls: { type: 'long' }, n: { type: 'long' },
    needed: { type: 'long' }, held: { type: 'long' }, exposed: { type: 'long' }, missing: { type: 'long' }, attempts: { type: 'long' },
    correct: { type: 'boolean' }, attrs: { type: 'flattened', ignore_above: 1024, depth_limit: 5 },
} } }

const docs = []
const add = (facet, id, src, fields) => {
    const signer = fields.signer || lastAgent(src.split('#')[0])
    docs.push({ _id: idOf('workloads', facet, id), doc: { kind: 'workload', facet, id: String(id), source: `repo:${src}@${HEAD}`, read_at: fields.read_at || lastT(src.split('#')[0]),
        signer, commit: HEAD, ingested_at: NOW, ingested_by: ME, ...fields, t: fields.t || lastT(src.split('#')[0]), signer } })
}
const attrs = o => { const s = scrubFields(o); return JSON.parse(JSON.stringify(s, (k, v) => typeof v === 'string' ? redact(v, 600) : v)) }

// ---- data/runtimes.json
const rt = read('data/runtimes.json') || {}
for (const r of ARR(rt.runtimes)) add('runtime', r.id, `data/runtimes.json#${r.id}`, { name: r.name, runtime: r.id, loop: r.loop, io_level: r.io_max, text: redact(r.notes, 2000), attrs: attrs(r) })
for (const e of ARR(rt.endpoints)) add('endpoint', e.id, `data/runtimes.json#${e.id}`, { name: e.name, endpoint: e.id, model: ARR(e.models).join(', ') || undefined, text: redact([e.cost, e.notes].filter(Boolean).join(' · '), 2000), attrs: attrs(e) })
for (const l of ARR(rt.io_levels)) add('io_level', l.id, `data/runtimes.json#${l.id}`, { name: l.name, io_level: l.id, text: redact(`${l.by || ''} · provenance: ${l.provenance || ''}`, 1000), attrs: attrs(l) })
for (const m of ARR(rt.modes?.items)) add('mode', m.id, `data/runtimes.json#${m.id}`, { name: m.name, mode: m.id, text: redact(`state: ${m.state}; held by: ${m.held_by}; record: ${m.record}; ABP: ${m.abp}`, 2000), attrs: attrs(m) })
for (const a of ARR(rt.agents)) add('placement', a.agent, `data/runtimes.json#agents/${a.agent}`, { name: a.agent, agent: a.agent, person: personOf(a.agent), role: a.role, runtime: RT(a.runtime) || a.runtime,
    model: a.models, endpoint: (String(a.models || '').match(/\bM\d\b/) || [])[0], io_level: a.io_level, account: a.account, mode: a.mode, attrs: attrs(a) })
ARR(rt.matrix).forEach((m, i) => add('task', `matrix-${i + 1}`, `data/runtimes.json#matrix/${i + 1}`, { name: m.task, role: m.who, loop: m.loop, io_level: m.io, judgement: m.judgement, data_class: m.data,
    now: m.now, could: m.could, mode: m.mode, runtime: RT(m.now), text: redact(`now: ${m.now} → could: ${m.could}`, 500), attrs: attrs(m) }))

// ---- data/operating-model.json
const om = read('data/operating-model.json') || {}
for (const a of ARR(om.altitudes?.items)) add('altitude', a.id, `data/operating-model.json#${a.id}`, { name: `${a.id} ${a.name}`, altitude: a.id, text: redact([a.is, a.can, a.reach, a.example].filter(Boolean).join(' · '), 2000), attrs: attrs(a) })
ARR(om.trials).forEach((t, i) => {
    const rows = ARR(t.rows), right = rows.filter(r => r.want && r.want === r.got).length
    add('trial', `trial-${i + 1}`, `data/operating-model.json#trials/${i + 1}`, { name: t.what, altitude: ALT(t.altitude), model: t.model, t: iso(t.at), cost_usd: +t.cost_usd || 0, latency_ms: +t.latency_ms || undefined,
        n: rows.length || undefined, text: redact(`${t.result || ''} · ${t.teaches || ''}`, 2000), attrs: attrs({ ...t, rows: undefined }) })
    rows.forEach((r, j) => add('trial-row', `trial-${i + 1}-${r.id || j}`, `data/operating-model.json#trials/${i + 1}/${r.id || j}`, { name: r.id, altitude: ALT(r.want), model: t.model, t: iso(t.at), correct: r.want === r.got, attrs: attrs(r) }))
    void right
})

// ---- data/work-altitudes.json (signed)
const wa = read('data/work-altitudes.json'), wab = wa?.body || {}
for (const w of ARR(wab.items)) add('work', w.id, `data/work-altitudes.json#${w.id}`, { name: w.title, altitude: ALT(w.altitude) || 'none', status: w.status, attempts: +w.attempts || undefined,
    t: iso(wab.generated), signer: (String(wa?.by?.name || '').match(/[\w.-]+@[\w.-]+/) || [])[0] || lastAgent('data/work-altitudes.json'), text: redact(w.why, 1000), attrs: attrs(w) })

// ---- data/run-reach.json
const rr = read('data/run-reach.json') || {}
for (const u of ARR(rr.units)) add('reach', u.unit, `data/run-reach.json#${u.unit}`, { name: u.unit, altitude: ALT(u.altitude), text: redact(u.how, 1000),
    needed: ARR(u.needs).length, held: ARR(u.held).length, exposed: ARR(u.exposure).length, missing: ARR(u.missing).length, attrs: attrs(u) })

// ---- tasks/ packets and signed results
const tdir = path.join(ROOT, 'tasks')
for (const t of fs.existsSync(tdir) ? fs.readdirSync(tdir) : []) {
    const td = path.join(tdir, t); if (!fs.statSync(td).isDirectory()) continue
    for (const f of fs.readdirSync(td).filter(f => f.endsWith('.json'))) {
        const src = `tasks/${t}/${f}`, j = read(src); if (!j) continue
        const b = j.body || j, by = (String(typeof j.by === 'string' ? j.by : j.by?.name || '').match(/[\w.-]+@[\w.-]+/) || [])[0]
        if (f === 'packet.json') add('packet', t, src, { name: redact(b.mandate, 300), packet: t, altitude: ALT(b.altitude), agent: b.from, person: personOf(b.from), signer: by || b.from,
            t: iso(j.by?.signed_at), text: redact(`for: ${b.for || ''} · tier: ${b.tier || ''}`, 500), attrs: attrs({ id: b.id, altitude: b.altitude, for: b.for, tier: b.tier, max_tokens: b.max_tokens, grant: b.grant }) })
        else for (const [i, o] of ARR(b.outputs).entries()) add('output', `${t}/${f}/${i}`, `${src}#${i}`, { name: o.input, packet: t, altitude: ALT(o.altitude) || 'none', agent: b.runner, person: personOf(b.runner),
            runtime: RT(b.environment), model: b.runner_choices?.model || b.runner_choices?.tier, t: iso(b.ran_at), signer: by || b.runner, attempts: +o.tries || undefined, text: redact(o.why, 500),
            attrs: attrs({ environment: b.environment, input: o.input, altitude: o.altitude }) })
    }
}

// ---- team/angelo/runs.md (one line per agentic activity; the day from git blame of that line)
const runsMd = 'team/angelo/runs.md'
if (fs.existsSync(path.join(ROOT, runsMd))) {
    const blame = git(`blame --line-porcelain -- ${runsMd}`).split('\n'), lineTime = []
    let cur = null
    for (const l of blame) { if (/^committer-time /.test(l)) cur = +l.split(' ')[1]; if (l.startsWith('\t')) lineTime.push(cur) }
    fs.readFileSync(path.join(ROOT, runsMd), 'utf8').split('\n').forEach((line, i) => {
        const c = line.split('|').map(s => s.trim()); if (c.length < 6 || !/^\d{1,2}:\d{2}/.test(c[1])) return
        const day = lineTime[i] ? new Date(lineTime[i] * 1000).toISOString().slice(0, 10) : '2026-11-11'
        const [h, m] = c[1].split(/[–-]/)[0].split(':'), calls = +(c[4].match(/(\d+)\s*tool calls/) || [])[1] || undefined
        add('run', `angelo-run-${i}`, `${runsMd}#L${i + 1}`, { name: redact(c[3], 300), agent: c[2], person: personOf(c[2]), t: `${day}T${h.padStart(2, '0')}:${m}:00Z`, calls, n: 1,
            text: redact(`${c[4]} → ${c[5]}`, 1000), signer: c[2] })
    })
}

// ---- team/angelo/traces/*.json (every step of an event page's making)
const trDir = path.join(ROOT, 'team/angelo/traces')
for (const f of fs.existsSync(trDir) ? fs.readdirSync(trDir).filter(f => f.endsWith('.json')) : []) {
    const src = `team/angelo/traces/${f}`, d = read(src); if (!d) continue
    for (const s of ARR(d.steps)) {
        const human = s.kind === 'human', who = human ? 'a person' : String(s.who || '')
        add('trace', `${d.event_id}/${s.n}`, `${src}#${s.n}`, { name: redact(s.what, 300), trace: d.event_id, step_kind: s.kind, agent: human ? undefined : who, person: human ? undefined : personOf(who),
            label: s.label, t: iso(s.t), n: +s.n, signer: String(d.traced_by || '').split(',')[0] })
    }
}

// ---- check, then build or push
const props = new Set(Object.keys(MAPPING.mappings.properties)), ok = [], bad = []
for (const x of docs) {
    const doc = clean(x.doc)
    const f = [...Object.keys(doc).filter(k => !props.has(k)).map(k => `field ${k}`), ...findings(doc, `${doc.facet} ${doc.id}`)]
    if (f.length) bad.push(...f.slice(0, 2)); else ok.push({ _id: x._id, doc })
}
const by = {}; for (const x of ok) by[x.doc.facet] = (by[x.doc.facet] || 0) + 1
console.log(`${INDEX}: ${ok.length} documents (${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(', ')}), ${docs.length - ok.length} held back`)
for (const b of bad.slice(0, 8)) console.log(`  held: ${b}`)
if (process.argv[2] === "dump") for (const f of ["placement","run","output","trace","trial"]) console.log(JSON.stringify(ok.find(x => x.doc.facet === f)?.doc, (k, v) => ["source","ingested_at","ingested_by","commit","attrs","kind"].includes(k) ? undefined : v))
if (process.argv[2] === "push") {
    const r = await pushIndex(INDEX, MAPPING, ok, { recreate: process.argv.includes('--recreate') })
    console.log(`${INDEX}: ${r.sent} sent, ${r.errors} errors`)
    if (r.errors) process.exit(1)
}
