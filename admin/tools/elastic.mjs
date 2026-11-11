#!/usr/bin/env node
// The Elastic ingest of Lisbon Tech Fringe (WS-215), elastic.1.fringe@PrompTugal.dinis, 11 November 2026, at Dinis
// Cruz's word (16:30 UTC: "I want to move us to Elastic"). The plan and the index design: docs/elastic-plan.md.
//
//   node admin/tools/elastic.mjs build    --kind events|graph|tasks|models|hooklog|all   documents to $TMPDIR/elastic-out/ (outside git),
//                                                                                          checked
//   node admin/tools/elastic.mjs check    --kind ...     the privacy checks only; exit 1 on any finding
//   node admin/tools/elastic.mjs mappings --write        write elastic/mappings/<kind>.json from the definitions below
//   ELASTIC_URL=https://<host> node admin/tools/elastic.mjs push --kind ...   create the index if missing, then _bulk
//
// One index per kind (fringe-<kind>), strict mappings, and every document carries source, read_at, signer, signer_key,
// commit, ingested_at, ingested_by. Ids are stable (sha256 of kind and id), so a re-ingest updates and never duplicates.
//
// Never sent: contact details (fields named like a contact are dropped; a value that looks like an email or a phone
// number fails the build), keys or tokens (fail closed; the hook log's commands are redacted a second time), model
// request or response text, signatures (only their presence). The key: the cloud session's proxy adds it for the
// deployment's host (a network secret); else ELASTIC_API_KEY from the process environment. It is never printed, logged
// or written (R8). No dependencies.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// in a cloud session Node's fetch must be told to use the proxy (as agent-log.mjs does, WS-162)
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && process.argv[2] === 'push') {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ME = 'elastic.1.fringe@PrompTugal.dinis'
const PREFIX = process.env.ELASTIC_PREFIX || 'fringe'
const KINDS = ['events', 'graph', 'tasks', 'models', 'hooklog']

const args = process.argv.slice(2), cmd = args[0], opt = {}
for (let i = 1; i < args.length; i++) {
    if (!args[i].startsWith('--')) continue
    const k = args[i].slice(2), v = (args[i + 1] && !args[i + 1].startsWith('--')) ? args[++i] : true
    opt[k] = v
}

// ---------- the mappings ----------
const kw = { type: 'keyword' }, txt = { type: 'text', fields: { raw: { type: 'keyword', ignore_above: 512 } } }
const date = { type: 'date' }, bool = { type: 'boolean' }, num = { type: 'double' }, int = { type: 'long' }
const COMMON = { kind: kw, source: kw, read_at: date, signer: kw, signer_key: kw, commit: kw, ingested_at: date, ingested_by: kw }
const MAPPINGS = {
    events: { id: kw, name: txt, url: kw, date: { type: 'date', format: 'yyyy-MM-dd' }, start: date, end: date, type: kw, organiser: txt,
        place: txt, join: txt, status: kw, storm_note: txt, storm_moved: bool, topics: kw, personas: kw, label: kw, cost: txt,
        check: txt, size: kw, in_lisbon: bool },
    graph: { id: kw, node: kw, name: txt, aliases: kw, community: kw, event: kw, type: kw, start: date, end: date, url: kw,
        organiser: kw, label: kw, ask: txt, rule: txt, edges: { type: 'object', dynamic: false, enabled: false } },
    tasks: { id: kw, doc: kw, packet: kw, altitude: kw, from: kw, for: txt, mandate: txt, tier: kw, runner: kw, environment: txt,
        ran_at: date, outputs: int, signed: bool, sig_by: kw },
    models: { day: { type: 'date', format: 'yyyy-MM-dd' }, model: kw, tier: kw, agent: kw, group: kw, calls: int, ok: int,
        cost_usd: num, tokens_in: int, tokens_out: int },
    hooklog: { t: date, session: kw, ev: kw, agent: kw, who: kw, role: kw, tool: kw, tool_kind: kw, decision: kw, rule: kw,
        target: txt, why: txt },
}
const mapping = kind => ({ settings: { number_of_shards: 1 }, mappings: { dynamic: 'strict', properties: { ...COMMON, ...MAPPINGS[kind] } } })

// ---------- the privacy checks ----------
const CONTACT_FIELD = /^(e-?mail|emails?|phone|phones|tel|mobile|whatsapp|contact|contacts|attendees|guests|guest_list|rsvps?)$/i
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]*[A-Za-z]{2,}/
const AGENT_NAME = /^[a-z0-9.]+@PrompTugal\.[a-z]+$/  // agent names look like emails and are not contacts
const PHONE = /(\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]\d{3}[\s.-]\d{3,4}\b|\btel:|\bmailto:/i
const SECRET = /(sk-[A-Za-z0-9_-]{16,}|\b(ApiKey|Bearer|Basic)\s+[A-Za-z0-9+/=._-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b[A-Za-z0-9+/]{48,}={0,2})/

function scrubFields(o) {   // drop contact-named fields, at any depth
    if (Array.isArray(o)) return o.map(scrubFields)
    if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).filter(([k]) => !CONTACT_FIELD.test(k)).map(([k, v]) => [k, scrubFields(v)]))
    return o
}
function findings(doc, where) {
    const out = []
    const walk = (v, p) => {
        if (typeof v === 'string') {
            const emails = (v.match(new RegExp(EMAIL, 'g')) || []).filter(m => !AGENT_NAME.test(m) && !/@PrompTugal\./.test(m))
            if (emails.length) out.push(`${where} ${p}: looks like an email`)
            if (PHONE.test(v) && !/^\d{4}-\d{2}-\d{2}/.test(v) && !/^https?:\/\//.test(v)) out.push(`${where} ${p}: looks like a phone number`)
            if (SECRET.test(v)) out.push(`${where} ${p}: looks like a key or token`)
        } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`))
        else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k)
    }
    walk(doc, '')
    return out
}
const redact = s => String(s ?? '').replace(new RegExp(SECRET, 'g'), '[redacted]').replace(new RegExp(EMAIL, 'g'), m => /@PrompTugal\./.test(m) ? m : '[email]').slice(0, 400)

// ---------- helpers ----------
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const git = c => { try { return execSync(`git -C "${ROOT}" ${c}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }
const HEAD = git('rev-parse --short HEAD') || 'unknown'
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const lastAgent = p => (git(`log -1 --format=%B -- "${p}"`).match(/^Agent:\s*(.+)$/m) || [])[1]?.trim() || 'unknown'
let KEYS = null
const keyOf = agent => {
    KEYS ??= (() => { try { return read('data/keys.json').keys } catch { return [] } })()
    const k = KEYS.find(x => x.agent === agent && x.status !== 'superseded') || KEYS.find(x => x.agent === agent)
    return k ? k.id : 'unknown'
}
const stamp = (kind, src, readAt, signer) => ({ kind, source: src, read_at: readAt || NOW, signer, signer_key: keyOf(signer), commit: HEAD, ingested_at: NOW, ingested_by: ME })
const idOf = (kind, id) => crypto.createHash('sha256').update(`${kind}:${id}`).digest('hex').slice(0, 32)
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined && o[k] !== null).map(k => [k, o[k]]))
const isoOrNull = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) ? v : undefined

// ---------- the builders: each returns [{ _id, doc }] ----------
const BUILD = {
    events() {
        const src = 'data/events.json', signer = lastAgent(src), d = read(src)
        return d.events.map(e => ({ _id: idOf('events', e.id), doc: { ...stamp('events', `repo:${src}@${HEAD}#${e.id} ${e.url || ''}`.trim(), e.read_at, signer),
            ...pick(e, ['id', 'name', 'url', 'date', 'organiser', 'place', 'join', 'status', 'storm_note', 'storm_moved', 'topics', 'personas', 'label', 'cost', 'check', 'size', 'in_lisbon']),
            start: isoOrNull(e.start), end: isoOrNull(e.end), type: e.kind } }))
    },
    graph() {
        const out = []
        for (const f of ['festivals', 'organisers', 'personas', 'sessions']) {
            const src = `data/graph/${f}.json`; if (!fs.existsSync(path.join(ROOT, src))) continue
            const d = read(src), signer = lastAgent(src), node = f.replace(/s$/, '')
            for (const n of d[f] || []) {
                const edges = pick(n, ['links', 'match', 'holds_when', 'lists_when', 'organiser'])
                out.push({ _id: idOf('graph', `${node}:${n.id}`), doc: { ...stamp('graph', `repo:${src}@${HEAD}#${n.id}`, n.read_at || d.updated, signer),
                    node, ...pick(n, ['id', 'name', 'aliases', 'community', 'event', 'url', 'label', 'ask', 'rule']),
                    ...(typeof n.organiser === 'string' ? { organiser: n.organiser } : {}),
                    type: n.kind, start: isoOrNull(n.start), end: isoOrNull(n.end), edges } })
            }
        }
        return out
    },
    tasks() {
        const out = [], dir = path.join(ROOT, 'tasks')
        for (const t of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
            const td = path.join(dir, t); if (!fs.statSync(td).isDirectory()) continue
            for (const f of fs.readdirSync(td).filter(f => f === 'packet.json' || /^result-.*\.json$/.test(f))) {
                const src = `tasks/${t}/${f}`, j = read(src), b = j.body || j
                const byName = typeof j.by === 'string' ? j.by : (j.by?.name || '').replace(/^[a-z]+:\s*/, '')
                const signer = byName || b.from || b.runner || lastAgent(src)
                out.push({ _id: idOf('tasks', src), doc: { ...stamp('tasks', `repo:${src}@${HEAD}`, b.ran_at || j.by?.signed_at, signer),
                    id: t, doc: f === 'packet.json' ? 'packet' : 'result', packet: b.packet || b.id, ...pick(b, ['altitude', 'from', 'for', 'mandate', 'tier', 'runner', 'environment']),
                    ran_at: isoOrNull(b.ran_at), outputs: Array.isArray(b.outputs) ? b.outputs.length : undefined,
                    signed: !!j.sig, sig_by: j.by?.fp || undefined } })
            }
        }
        return out
    },
    models() {   // day summaries only: never request or response text
        const src = 'data/models-ledger.json', d = read(src), signer = lastAgent(src), out = []
        for (const [day, s] of Object.entries(d.days || {})) for (const group of ['by_model', 'by_tier', 'by_agent']) for (const [k, v] of Object.entries(s[group] || {})) {
            const field = { by_model: 'model', by_tier: 'tier', by_agent: 'agent' }[group]
            out.push({ _id: idOf('models', `${day}:${group}:${k}`), doc: { ...stamp('models', `repo:${src}@${HEAD}#${day}`, d.updated, signer),
                day, group, [field]: k, ...pick(v, ['calls', 'ok', 'cost_usd', 'tokens_in', 'tokens_out']) } })
        }
        return out
    },
    hooklog() {  // this machine's ABP hook decisions (~/.abp/log/*.jsonl); commands redacted a second time
        const dir = process.env.ABP_LOG_DIR || path.join(os.homedir(), '.abp', 'log'), out = []
        for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')) : []) {
            const session = f.replace(/\.jsonl$/, '')
            fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).forEach((line, i) => {
                let e; try { e = JSON.parse(line) } catch { return }
                out.push({ _id: idOf('hooklog', `${session}:${i}:${e.t}`), doc: { ...stamp('hooklog', `abp-hook:${session}`, e.t, e.agent || 'unidentified'),
                    t: e.t, session, ...pick(e, ['ev', 'agent', 'who', 'role', 'tool', 'decision']), tool_kind: e.kind,
                    rule: e.rule || e.rules, target: e.target !== undefined ? redact(e.target) : undefined, why: e.why !== undefined ? redact(e.why) : undefined } })
            })
        }
        return out
    },
}

function clean(o) { return JSON.parse(JSON.stringify(o)) }   // drop undefined
function build(kind) {
    const docs = BUILD[kind]().map(x => ({ _id: x._id, doc: clean(scrubFields(x.doc)) }))
    const props = new Set(Object.keys(mapping(kind).mappings.properties)), bad = []
    for (const x of docs) {
        for (const k of Object.keys(x.doc)) if (!props.has(k)) bad.push(`${kind} ${x._id}: field ${k} not in the mapping`)
        bad.push(...findings(x.doc, `${kind} ${x.doc.source}`))
    }
    return { docs, bad }
}
const kinds = () => opt.kind === 'all' || !opt.kind ? KINDS : String(opt.kind).split(',')

// ---------- the commands ----------
async function push(kind, docs) {
    const base = (process.env.ELASTIC_URL || '').replace(/\/+$/, '')
    if (!/^https:\/\//.test(base)) throw new Error('ELASTIC_URL (https://<deployment host>) is not set')
    const headers = { 'content-type': 'application/json' }
    // never printed: an API key first; else the password (Dinis: "see ELASTIC_CLOUD for the elastic password") as basic
    // auth for ELASTIC_USER (default elastic); else nothing, and the proxy's network secret for the host applies
    const pw = process.env.ELASTIC_PASSWORD || process.env.ELASTIC_CLOUD
    if (process.env.ELASTIC_API_KEY) headers.authorization = `ApiKey ${process.env.ELASTIC_API_KEY}`
    else if (pw) headers.authorization = 'Basic ' + Buffer.from(`${process.env.ELASTIC_USER || 'elastic'}:${pw}`).toString('base64')
    const index = `${PREFIX}-${kind}`
    const head = await fetch(`${base}/${index}`, { method: 'HEAD', headers })
    if (head.status === 404) {
        const r = await fetch(`${base}/${index}`, { method: 'PUT', headers, body: JSON.stringify(mapping(kind)) })
        if (!r.ok) throw new Error(`create ${index}: HTTP ${r.status}`)
        console.log(`created ${index}`)
    } else if (!head.ok) throw new Error(`${index}: HTTP ${head.status}`)
    let sent = 0, errors = 0
    for (let i = 0; i < docs.length; i += 500) {
        const body = docs.slice(i, i + 500).map(x => JSON.stringify({ index: { _index: index, _id: x._id } }) + '\n' + JSON.stringify(x.doc)).join('\n') + '\n'
        const r = await fetch(`${base}/_bulk`, { method: 'POST', headers: { ...headers, 'content-type': 'application/x-ndjson' }, body })
        if (!r.ok) throw new Error(`_bulk ${index}: HTTP ${r.status}`)
        const j = await r.json()
        sent += j.items.length; errors += j.items.filter(it => it.index?.error).length
        for (const it of j.items.filter(it => it.index?.error).slice(0, 3)) console.log(`  error ${it.index._id}: ${it.index.error.type}: ${String(it.index.error.reason).slice(0, 160)}`)
    }
    console.log(`${index}: ${sent} sent, ${errors} errors`)
    return errors
}

async function main() {
    if (cmd === 'mappings') {
        for (const k of KINDS) {
            const s = JSON.stringify(mapping(k), null, 2) + '\n'
            if (opt.write) { fs.mkdirSync(path.join(ROOT, 'elastic', 'mappings'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'elastic', 'mappings', `${k}.json`), s) }
            else if (!opt.kind || opt.kind === k) process.stdout.write(`// ${PREFIX}-${k}\n${s}`)
        }
        if (opt.write) console.log(`wrote elastic/mappings/{${KINDS.join(',')}}.json`)
        return
    }
    if (!['build', 'check', 'push'].includes(cmd)) { console.log('usage: elastic.mjs build|check|push --kind ' + KINDS.join('|') + '|all; elastic.mjs mappings [--write]'); process.exit(2) }
    let failed = 0
    for (const kind of kinds()) {
        if (!BUILD[kind]) { console.log(`unknown kind ${kind}`); failed++; continue }
        const { docs, bad } = build(kind)
        console.log(`${PREFIX}-${kind}: ${docs.length} documents, ${bad.length} findings`)
        for (const b of bad.slice(0, 10)) console.log(`  ${b}`)
        if (bad.length) { failed++; continue }   // fail closed: nothing with a finding is written or sent
        if (cmd === 'build') {
            const out = path.join(os.tmpdir(), 'elastic-out')   // outside git (CLAUDE.md: never data dumps in git)
            fs.mkdirSync(out, { recursive: true })
            fs.writeFileSync(path.join(out, `${PREFIX}-${kind}.ndjson`), docs.map(x => JSON.stringify({ _id: x._id, ...x.doc })).join('\n') + '\n')
            console.log(`  -> ${path.join(out, `${PREFIX}-${kind}.ndjson`)}`)
        }
        if (cmd === 'push') failed += await push(kind, docs) ? 1 : 0
    }
    process.exit(failed ? 1 : 0)
}
main().catch(e => { console.error(`elastic.mjs: ${e.message}`); process.exit(1) })
