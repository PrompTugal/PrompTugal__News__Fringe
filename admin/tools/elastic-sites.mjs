#!/usr/bin/env node
// The sites on Elastic Cloud (elastic.1.fringe@PrompTugal.dinis, WS-215; Dinis, 11 November 2026: "start putting as much
// data as you can in Elastic ... create a dashboard and data set for the main PrompTugal website, and also one for the
// Web Summit site"). For each site in elastic/sites.json, from a clone of its public repository:
//
//   <site>-commits   every commit: time, agent (Agent: trailer, else the subject's prefix), person, subject, files, dirs
//   <site>-content   the markdown (briefs, docs, articles, desks...): title, path, text (redacted), last commit and agent
//   <site>-entities  the structured data (events, companies, stories, places...): one document per record, attrs flattened
//   <site>-runs      the agents' run reports and wakes
//   <site>-status    the agents' status files
//
//   node admin/tools/elastic-sites.mjs build [--site fringe|ptnews|websummit|all] [--kind commits,content,...]
//   ELASTIC_URL=https://... node admin/tools/elastic-sites.mjs push [--site ...] [--kind ...] [--recreate]
//
// One mapping for all five kinds (elastic/mappings/site-doc.json): strict at the top, the record's own fields in a
// flattened `attrs`. Never sent: see "never" in elastic/sites.json. Author names and emails are never read from git.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { scrubFields, findings, redact, idOf, clean, pushIndex } from './elastic-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && process.argv[2] === 'push') {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ME = 'elastic.1.fringe@PrompTugal.dinis'
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'elastic', 'sites.json'), 'utf8'))
const KINDS = ['commits', 'content', 'entities', 'runs', 'status']
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const args = process.argv.slice(2), cmd = args[0], opt = {}
for (let i = 1; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = (args[i + 1] && !args[i + 1].startsWith('--')) ? args[++i] : true

// ---------- the mapping ----------
const kw = { type: 'keyword' }, date = { type: 'date' }
export const MAPPING = {
    settings: { number_of_shards: 1, 'index.mapping.total_fields.limit': 200 },
    mappings: { dynamic: 'strict', properties: {
        kind: kw, site: kw, source: kw, read_at: date, signer: kw, commit: kw, ingested_at: date, ingested_by: kw,
        id: kw, path: kw, dir: kw, area: kw, type: kw, url: kw, status: kw, state: kw, outcome: kw,
        title: { type: 'text', fields: { raw: { type: 'keyword', ignore_above: 512 } } },
        text: { type: 'text' },
        t: date, end: date, agent: kw, person: kw, role: kw, for: kw, tags: kw,
        n: { type: 'long' }, files: { type: 'long' }, words: { type: 'long' }, cost_usd: { type: 'double' }, duration_s: { type: 'double' },
        attrs: { type: 'flattened', ignore_above: 1024, depth_limit: 6 },
    } },
}

// ---------- helpers ----------
const home = p => p.replace(/^~/, os.homedir())
const sh = (dir, c) => execSync(c, { cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] })
const EXCL = CFG.exclude_always.map(r => new RegExp(r, 'i'))
const allowed = p => !EXCL.some(r => r.test(p))
const personOf = a => String(a || '').includes('@') ? String(a).split('@')[1].split('.').pop().toLowerCase() : undefined
const roleOf = a => String(a || '').split('@')[0].replace(/\.\d+$/, '').split('.')[0] || undefined
const iso = v => {
    if (typeof v !== 'string') return undefined
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) { const d = new Date(v); return isNaN(d) ? undefined : d.toISOString() }
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v + 'T00:00:00Z'
    if (/^\d{8}T\d{6}Z$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(9, 11)}:${v.slice(11, 13)}:${v.slice(13, 15)}Z`
    return undefined
}
const firstTime = (o, keys) => { for (const k of keys) { const v = iso(o?.[k]); if (v) return v } }
function trimAttrs(o, depth = 0) {   // keep the record queryable but bounded
    if (Array.isArray(o)) return o.slice(0, 40).map(x => trimAttrs(x, depth + 1))
    if (o && typeof o === 'object') {
        if (depth >= 4) return JSON.stringify(o).slice(0, 300)
        return Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('$')).slice(0, 60).map(([k, v]) => [k, trimAttrs(v, depth + 1)]))
    }
    if (typeof o === 'string') return redact(o, 1000)
    return o
}
const areaOf = p => p.split('/').slice(0, p.split('/').length > 2 ? 2 : 1).join('/')

function repoState(site) {
    const dir = home(site.dir)
    if (!fs.existsSync(dir)) throw new Error(`${site.repo}: no clone at ${site.dir} (git clone --filter=blob:none https://github.com/${site.repo}.git)`)
    return { dir, head: sh(dir, 'git rev-parse --short HEAD').trim(), files: sh(dir, 'git ls-files').split('\n').filter(Boolean) }
}

// one pass over history: commits, and each path's last commit
function history(dir) {
    const raw = sh(dir, `git log --no-renames '--format=%x1e%H%x1f%cI%x1f%s%x1f%(trailers:key=Agent,valueonly,separator=%x2C)%x1f%(trailers:key=For,valueonly,separator=%x2C)%x1f%(trailers:key=Issue,valueonly,separator=%x2C)%x1f%b%x1d' --name-only`)
    const commits = [], last = new Map()
    for (const block of raw.split('\x1e').filter(b => b.trim())) {
        const [meta, names = ''] = block.split('\x1d')
        const [sha, t, subject, agentT, forT, issue, body = ''] = meta.replace(/^\n+/, '').split('\x1f')
        const rest = names.split('\n')
        const bodyAgent = (body.match(/^Agent:\s*(\S+)/m) || [])[1]
        const files = rest.join('\n').split('\n').map(s => s.trim()).filter(Boolean)
        const agent = (agentT || '').trim().split(',')[0].trim() || bodyAgent
            || (subject.match(/([A-Za-z0-9][\w.-]*@[A-Za-z][\w-]*(?:\.[A-Za-z][\w-]*)+)(?=[:\s(),]|$)/) || [])[1]
            || ((subject.match(/workers?\/([\w.-]+?)'s/) || [])[1] ? `${subject.match(/workers?\/([\w.-]+?)'s/)[1]} (worker)` : '')
            || 'unattributed'
        commits.push({ sha, t, subject, agent, for: (forT || '').trim() || undefined, issue: (issue || '').trim() || undefined, files })
        for (const f of files) if (!last.has(f)) last.set(f, { sha, t, agent })
    }
    return { commits, last }
}

// ---------- the builders ----------
function base(siteKey, kind, src, signer, head) {
    return { kind, site: siteKey, source: src, signer, commit: head, ingested_at: NOW, ingested_by: ME }
}

function buildSite(siteKey, kinds) {
    const site = CFG.sites[siteKey], { dir, head, files } = repoState(site)
    const H = history(dir), out = {}
    const readJSON = p => { try { return JSON.parse(fs.readFileSync(path.join(dir, p), 'utf8')) } catch { return null } }
    const match = (rx) => files.filter(f => allowed(f) && rx.some(r => new RegExp(r).test(f)))

    if (kinds.includes('commits')) out.commits = H.commits.map(c => ({ _id: idOf(siteKey, 'commit', c.sha), doc: {
        ...base(siteKey, 'commit', `https://github.com/${site.repo}/commit/${c.sha}`, c.agent, c.sha.slice(0, 7)),
        id: c.sha, t: c.t, read_at: c.t, agent: c.agent, person: personOf(c.agent), role: roleOf(c.agent), for: c.for,
        title: redact(c.subject, 300), files: c.files.length, n: 1,
        tags: [...new Set(c.files.filter(allowed).map(areaOf))].slice(0, 30), attrs: { issue: c.issue } } }))

    if (kinds.includes('content')) out.content = match(site.content).filter(p => p.endsWith('.md')).map(p => {
        let s = ''; try { s = fs.readFileSync(path.join(dir, p), 'utf8') } catch { return null }
        if (s.length > 400000) s = s.slice(0, 400000)
        const fm = {}, m = s.match(/^---\n([\s\S]*?)\n---\n?/)
        if (m) for (const line of m[1].split('\n')) { const k = line.match(/^([\w-]+):\s*(.*)$/); if (k) fm[k[1]] = k[2].replace(/^["']|["']$/g, '').slice(0, 300) }
        const body = m ? s.slice(m[0].length) : s
        const title = fm.title || (body.match(/^#\s+(.+)$/m) || [])[1] || path.basename(p, '.md')
        const L = H.last.get(p) || {}
        return { _id: idOf(siteKey, 'content', p), doc: {
            ...base(siteKey, 'content', `https://github.com/${site.repo}/blob/${head}/${p}`, L.agent || 'unknown', head),
            id: p, path: p, dir: path.dirname(p), area: areaOf(p), type: p.split('/')[0].endsWith('.md') ? 'root' : p.split('/')[0],
            title: redact(title, 300), text: redact(body, 30000), words: body.split(/\s+/).filter(Boolean).length,
            t: L.t || NOW, read_at: L.t || NOW, agent: L.agent, person: personOf(L.agent), role: roleOf(L.agent), status: fm.status, n: 1,
            attrs: scrubFields(fm) } }
    }).filter(Boolean)

    const record = (kind, p, rec, extra = {}) => {
        const L = H.last.get(p) || {}
        const r = scrubFields(rec)
        const t = firstTime(r, ['started', 'run_at', 'read_at', 'read_on', 'updated', 'last_wake', 'date', 'start', 'when', 'at', 'ran_at']) || L.t || NOW
        const agent = typeof r.agent === 'string' ? r.agent : (typeof r.by === 'string' ? r.by : L.agent)
        return { ...base(siteKey, kind, `https://github.com/${site.repo}/blob/${head}/${p}${extra.anchor ? '#' + extra.anchor : ''}`, L.agent || 'unknown', head),
            id: String(r.id || r.slug || extra.anchor || p).slice(0, 300), path: p, area: areaOf(p),
            title: redact(r.title || r.name || r.subject || r.objective || r.line || r.focus || r.what || r.id || path.basename(path.dirname(p)), 300),
            url: [r.url, r.website, r.source_url, r.source].find(u => typeof u === 'string' && /^https?:\/\//.test(u)),
            status: typeof r.status === 'string' ? r.status.slice(0, 100) : undefined,
            state: typeof r.state === 'string' ? r.state.slice(0, 200) : undefined,
            outcome: typeof r.outcome === 'string' ? r.outcome.slice(0, 100) : undefined,
            t, read_at: firstTime(r, ['read_at', 'read_on', 'run_at']) || L.t || NOW, end: firstTime(r, ['ended', 'closed', 'end']),
            agent, person: personOf(agent), role: roleOf(agent),
            cost_usd: Number.isFinite(+r.cost_usd) && r.cost_usd !== null && r.cost_usd !== '' ? +r.cost_usd : undefined,
            ...extra.fields, attrs: trimAttrs(r) }
    }

    if (kinds.includes('entities')) {
        const docs = []
        for (const e of site.entities || []) {
            const pick = r => e.only ? Object.fromEntries(e.only.filter(k => k in r).map(k => [k, r[k]])) : r
            if (e.glob) for (const p of match([e.glob])) { const r = readJSON(p); if (r && typeof r === 'object' && !Array.isArray(r)) docs.push({ _id: idOf(siteKey, 'entity', p), doc: { ...record('entity', p, pick(r)), type: e.type } }) }
            if (e.file && allowed(e.file)) {
                const d = readJSON(e.file); if (!d) continue
                const lists = e.list === '*' ? Object.entries(d).filter(([, v]) => Array.isArray(v)) : [[e.list, d[e.list]]]
                for (const [ln, arr] of lists) (Array.isArray(arr) ? arr : []).forEach((r, i) => {
                    if (!r || typeof r !== 'object') return
                    const anchor = `${ln}/${r.id || r.slug || i}`
                    docs.push({ _id: idOf(siteKey, 'entity', e.file, anchor, e.type), doc: { ...record('entity', e.file, pick(r), { anchor }), id: String(r.id || r.slug || anchor), type: e.type } })
                })
            }
        }
        out.entities = docs
    }

    if (kinds.includes('runs')) {
        const docs = []
        for (const rx of site.runs || []) {
            if (rx.startsWith('@')) {
                const [f, list] = rx.slice(1).split('#'), d = readJSON(f)
                ;(d?.[list] || []).forEach((r, i) => docs.push({ _id: idOf(siteKey, 'run', f, r.id || i), doc: runDoc(record('run', f, r, { anchor: `${list}/${r.id || i}` }), r) }))
            } else for (const p of match([rx])) { const r = readJSON(p); if (r && !Array.isArray(r)) docs.push({ _id: idOf(siteKey, 'run', p), doc: runDoc(record('run', p, r), r) }) }
        }
        out.runs = docs
    }

    if (kinds.includes('status')) out.status = match(site.status || []).map(p => {
        const r = readJSON(p); if (!r || Array.isArray(r)) return null
        const d = record('status', p, r)
        const list = k => Array.isArray(r[k]) ? r[k].map(x => typeof x === 'string' ? x : JSON.stringify(x)) : []
        d.text = redact([r.state, ...list('doing'), ...list('done'), ...list('next'), ...list('asks')].filter(Boolean).join('\n'), 30000)
        d.n = list('asks').length
        d.tags = list('asks').some(a => /^Dinis:/.test(a)) ? ['asks-dinis'] : []
        d.agent = d.agent || (p.match(/team\/([^/]+)\/(agents\/([^/]+)\.json|status\.json)/) || []).slice(1).filter(Boolean).pop()
        d.t = firstTime(r, ['updated', 'last_wake']) || d.t
        return { _id: idOf(siteKey, 'status', p), doc: d }
    }).filter(Boolean)

    return { out, head }
}
function runDoc(d, r) {
    const tc = r.tool_calls?.total ?? (Array.isArray(r.steps) ? r.steps.length : undefined)
    d.n = Number.isFinite(+tc) ? +tc : 1
    const s = Date.parse(d.t), e = Date.parse(d.end || '')
    if (s && e && e > s) d.duration_s = (e - s) / 1000
    d.title = redact(r.line || r.objective || r.kind || d.title, 300)
    return d
}

function check(siteKey, kind, docs) {
    const props = new Set(Object.keys(MAPPING.mappings.properties)), ok = [], bad = []
    for (const x of docs) {
        const doc = clean(x.doc)
        const f = [...Object.keys(doc).filter(k => !props.has(k)).map(k => `field ${k} not in the mapping`), ...findings(doc, `${siteKey}-${kind} ${doc.path || doc.id}`)]
        if (f.length) bad.push(...f.slice(0, 2)); else ok.push({ _id: x._id, doc })
    }
    return { ok, bad }
}

async function main() {
    if (!['build', 'push', 'mapping'].includes(cmd)) { console.log('usage: elastic-sites.mjs build|push [--site fringe|ptnews|websummit|all] [--kind commits,content,entities,runs,status] [--recreate]; mapping --write'); process.exit(2) }
    if (cmd === 'mapping') { fs.mkdirSync(path.join(ROOT, 'elastic', 'mappings'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'elastic', 'mappings', 'site-doc.json'), JSON.stringify(MAPPING, null, 2) + '\n'); console.log('wrote elastic/mappings/site-doc.json'); return }
    const sites = !opt.site || opt.site === 'all' ? Object.keys(CFG.sites) : String(opt.site).split(',')
    const kinds = !opt.kind || opt.kind === 'all' ? KINDS : String(opt.kind).split(',')
    const summary = {}
    for (const s of sites) {
        const { out } = buildSite(s, kinds)
        for (const [kind, docs] of Object.entries(out)) {
            const { ok, bad } = check(s, kind, docs), index = `${s}-${kind}`
            const line = `${index}: ${ok.length} documents, ${docs.length - ok.length} held back by the checks`
            if (cmd === 'push') {
                const r = await pushIndex(index, MAPPING, ok, { recreate: !!opt.recreate, prune: ['content', 'entities', 'status'].includes(kind) ? NOW : null })
                console.log(`${line}; ${r.sent} sent, ${r.errors} errors${r.pruned ? `, ${r.pruned} removed (gone from the source)` : ''}`); summary[index] = { docs: ok.length, held: docs.length - ok.length, errors: r.errors }
            } else { console.log(line); summary[index] = { docs: ok.length, held: docs.length - ok.length } }
            for (const b of bad.slice(0, opt.verbose ? 40 : 3)) console.log(`  held: ${b}`)
        }
    }
    if (opt.summary) fs.writeFileSync(opt.summary, JSON.stringify({ at: NOW, by: ME, indices: summary }, null, 2) + '\n')
}
main().catch(e => { console.error(`elastic-sites.mjs: ${e.message}`); process.exit(1) })
