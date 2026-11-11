#!/usr/bin/env node
// Task packets on Elastic: fringe-packets (elastic.1.fringe@PrompTugal.dinis, WS-215). For the cross-conductor test
// Dinis asked for at 20:3x UTC (the lead's packets p3, p4 to Angelo's conductor, and Angelo's back): one document per
// packet (issued), per result (who ran it, where, at what cost) and per A1 call inside a result (model, cost, latency,
// valid, its own key fingerprint, born and signed), so both conductors' runs sit side by side.
//
//   node admin/tools/elastic-packets.mjs build
//   ELASTIC_URL=https://... node admin/tools/elastic-packets.mjs push
//
// Never: the prompt (only its sha256), key material (fingerprints only), a person's data.

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { findings, idOf, clean, pushIndex, redact } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && process.argv[2] === 'push') {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const INDEX = 'fringe-packets', ME = 'elastic.1.fringe@PrompTugal.dinis'
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const HEAD = (() => { try { return execSync(`git -C "${ROOT}" rev-parse --short HEAD`, { encoding: 'utf8' }).trim() } catch { return '' } })()
const kw = { type: 'keyword' }, date = { type: 'date' }, num = { type: 'double' }, long = { type: 'long' }
export const MAPPING = { settings: { number_of_shards: 1 }, mappings: { dynamic: 'strict', properties: {
    kind: kw, source: kw, read_at: date, signer: kw, commit: kw, ingested_at: date, ingested_by: kw,
    doc: kw, id: kw, packet: kw, t: date, altitude: kw, issuer: kw, runner: kw, person: kw, runner_person: kw, issuer_person: kw,
    environment: kw, account: kw, router: kw, tier: kw, max_tokens: long, model: kw, input: kw, try: long, ok: { type: 'boolean' },
    cost_usd: num, latency_ms: num, calls: long, outputs: long, valid_outputs: long, valid_share: num, inputs: long,
    key_fp: kw, born: date, signed_at: date, ledger_id: kw, prompt_sha256: kw, signed: { type: 'boolean' }, mandate: { type: 'text' },
    cross: { type: 'boolean' }, phase: kw, role: kw, flow: kw, unit_id: kw, parent_id: kw, trace_id: kw, span_id: kw, parent_span_id: kw,
    duration_ms: num, valid: { type: 'boolean' }, seq: long, name: kw,
} } }

const personOf = a => String(a || '').includes('@') ? String(a).split('@')[1].split('.').pop().toLowerCase() : undefined
const iso = v => (typeof v === 'string' && !isNaN(new Date(v))) ? new Date(v).toISOString() : undefined
const num1 = v => (v === null || v === undefined || v === '' || isNaN(+v)) ? undefined : +v
const envParts = e => { const s = String(e || ''), head = s.split(';')[0]; const i = head.indexOf(','); return { environment: (i < 0 ? head : head.slice(0, i)).trim() || 'unknown', account: i < 0 ? undefined : head.slice(i + 1).trim() || undefined, router: (s.match(/router:\s*([^;]+)/) || [])[1]?.trim() } }   // 'R1 Claude Code cloud, <account>; router: ...'
const byName = j => (String(typeof j.by === 'string' ? j.by : j.by?.name || '').match(/[\w.-]+@[\w.-]+/) || [])[0]

const docs = [], dir = path.join(ROOT, 'tasks')
for (const t of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    const td = path.join(dir, t); if (!fs.statSync(td).isDirectory()) continue
    let packet = null
    try { packet = JSON.parse(fs.readFileSync(path.join(td, 'packet.json'), 'utf8')) } catch { continue }
    const pb = packet.body || {}, issuer = pb.from || byName(packet)
    const base = (src, extra) => ({ kind: 'packet', source: `repo:tasks/${t}/${src}@${HEAD}`, read_at: NOW, commit: HEAD, ingested_at: NOW, ingested_by: ME, packet: t, issuer, issuer_person: personOf(issuer), ...extra })
    docs.push({ _id: idOf('packet', t), doc: { ...base('packet.json', {}), doc: 'packet', id: t, t: iso(pb.issued_at) || iso(packet.by?.signed_at), altitude: pb.altitude, tier: pb.tier,
        max_tokens: num1(pb.max_tokens), inputs: Array.isArray(pb.inputs) ? pb.inputs.length : undefined, mandate: redact(pb.mandate, 1000), signer: issuer,
        key_fp: packet.by?.fp, born: iso(packet.by?.born), signed_at: iso(packet.by?.signed_at), signed: !!packet.sig, runner: String(pb.for || '').match(/[\w.-]+@[\w.-]+/)?.[0] } })
    for (const f of fs.readdirSync(td).filter(f => /^result-.*\.json$/.test(f))) {
        let r; try { r = JSON.parse(fs.readFileSync(path.join(td, f), 'utf8')) } catch { continue }
        const b = r.body || {}, runner = b.runner || byName(r), env = envParts(b.environment)
        const BOOK = new Set(['call_fp', 'input', 'tries', 'why', 'error'])   // bookkeeping; any other field is the answer
        const outs = Array.isArray(b.outputs) ? b.outputs : [], valid = outs.filter(o => o && !o.error && Object.keys(o).some(k => !BOOK.has(k))).length
        const calls = Array.isArray(b.calls) ? b.calls : []
        const cross = !!(personOf(runner) && personOf(issuer) && personOf(runner) !== personOf(issuer))
        docs.push({ _id: idOf('result', t, f), doc: { ...base(f, {}), doc: 'result', id: `${t}/${runner}`, t: iso(b.ran_at), altitude: 'A2', runner, person: personOf(runner), runner_person: personOf(runner),
            ...env, tier: b.runner_choices?.tier, max_tokens: num1(b.runner_choices?.max_tokens), model: b.runner_choices?.model || undefined,
            cost_usd: num1(b.cost_usd), calls: calls.length, outputs: outs.length, valid_outputs: valid, valid_share: outs.length ? valid / outs.length : undefined,
            key_fp: r.by?.fp, born: iso(r.by?.born), signed_at: iso(r.by?.signed_at), signed: !!r.sig, signer: runner, cross } })
        ;(Array.isArray(b.flow_events) ? b.flow_events : []).forEach((e, i) => {   // the run's own flow (abp/tools/flow.mjs inside packets.mjs)
            const ep = envParts(e.environment || b.environment)
            docs.push({ _id: idOf('event', t, f, e.unit_id, e.phase, e.seq ?? i), doc: { ...base(f, {}), doc: 'event', id: `${t}/${runner}/event/${i}`, t: iso(e.at), altitude: e.altitude, runner: e.runner || runner,
                person: e.person || personOf(runner), runner_person: personOf(e.runner || runner), ...ep, phase: e.phase, role: e.role, flow: e.flow, name: String(e.name || '').slice(0, 200),
                unit_id: e.unit_id, parent_id: e.parent_id || undefined, trace_id: e.trace_id, span_id: e.span_id, parent_span_id: e.parent_span_id || undefined, key_fp: e.key_fp,
                model: e.model || undefined, cost_usd: num1(e.cost_usd), latency_ms: num1(e.latency_ms), duration_ms: num1(e.duration_ms), valid: typeof e.valid === 'boolean' ? e.valid : undefined,
                seq: num1(e.seq), signer: e.runner || runner, cross } })
        })
        calls.forEach((c, i) => {
            const cb = c.body || c
            docs.push({ _id: idOf('call', t, f, i), doc: { ...base(f, {}), doc: 'call', id: `${t}/${runner}/${i}`, t: iso(c.by?.born) || iso(b.ran_at), altitude: 'A1', runner, person: personOf(runner), runner_person: personOf(runner),
                ...env, model: cb.model, input: String(cb.input ?? '').slice(0, 200), try: num1(cb.try), ok: cb.ok === true || cb.ok === 'True' || cb.ok === 'true',
                cost_usd: num1(cb.cost_usd), latency_ms: num1(cb.latency_ms), ledger_id: cb.ledger_id, prompt_sha256: cb.prompt_sha256,
                key_fp: c.by?.fp, born: iso(c.by?.born), signed_at: iso(c.by?.signed_at), signed: !!c.sig, signer: runner, cross } })
        })
    }
}
const props = new Set(Object.keys(MAPPING.mappings.properties)), ok = [], bad = []
for (const x of docs) { const d = clean(x.doc); const f = [...Object.keys(d).filter(k => !props.has(k)).map(k => `field ${k}`), ...findings(d, d.id)]; if (f.length) bad.push(...f.slice(0, 2)); else ok.push({ _id: x._id, doc: d }) }
const c = k => ok.filter(x => x.doc.doc === k).length
console.log(`${INDEX}: ${ok.length} documents (packets ${c('packet')}, results ${c('result')}, calls ${c('call')}, flow events ${c('event')}; cross-conductor results ${ok.filter(x => x.doc.doc === 'result' && x.doc.cross).length}), ${docs.length - ok.length} held back`)
for (const b of bad.slice(0, 6)) console.log(`  held: ${b}`)
if (process.argv[2] === 'push') {
    const r = await pushIndex(INDEX, MAPPING, ok, { prune: NOW })
    console.log(`${INDEX}: ${r.sent} sent, ${r.errors} errors${r.pruned ? `, ${r.pruned} removed` : ''}`)
    if (r.errors) process.exit(1)
}
