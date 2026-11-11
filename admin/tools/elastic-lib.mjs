// Shared by admin/tools/elastic*.mjs (elastic.1.fringe@PrompTugal.dinis, WS-215): the privacy checks, the redaction,
// and the push (create the index with its mapping if missing, then _bulk). The key or password is never printed.

import crypto from 'node:crypto'

export const CONTACT_FIELD = /^(e-?mail|emails?|phone|phones|tel|mobile|whatsapp|contact|contacts|contact_details|attendees|guests|guest_list|rsvps?|speakers|people|linkedin|address_private)$/i
export const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]*[A-Za-z]{2,}/
const OURS = /@(PrompTugal|promptugal|web-summit|ios\.PrompTugal|sgit|SGit)[.\w-]*$/   // agent names (role@PrompTugal.id) are not contacts
const PHONE = /(\+\d{1,3}[\s.-]?)\(?\d{2,4}\)?[\s.-]\d{3}[\s.-]\d{3,4}\b|\btel:\+?\d|\bmailto:/i
export const SECRET = /(sk-[A-Za-z0-9_-]{16,}|\b(ApiKey|Bearer|Basic)\s+[A-Za-z0-9+/=._-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/
const LONG = /[A-Za-z0-9+_-]{40,}={0,2}/g   // a long token is key-shaped only when it mixes upper, lower and digits (hashes and paths do not)
const b64json = t => { try { return /^[\[{]"/.test(Buffer.from(t, 'base64').toString('utf8')) } catch { return false } }   // a URL's encoded filter, not a key
const keyLike = t => !b64json(t) && !/[-_]/.test(t.replace(/^(sk|pk|ghp|gho|xox[a-z])[-_]/, '')) && /[A-Z]/.test(t) && /[a-z]/.test(t) && (t.match(/\d/g) || []).length >= 4   // slugs have hyphens; hashes have no upper case
const hasSecret = v => SECRET.test(v) || (v.match(LONG) || []).some(keyLike)

export function scrubFields(o) {   // drop contact-named fields, at any depth
    if (Array.isArray(o)) return o.map(scrubFields)
    if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).filter(([k]) => !CONTACT_FIELD.test(k)).map(([k, v]) => [k, scrubFields(v)]))
    return o
}
const isOurs = m => OURS.test(m) || /@PrompTugal\./.test(m) || /noreply@anthropic\.com$/.test(m)
export function redact(s, max = 400) {
    return String(s ?? '')
        .replace(new RegExp(SECRET, 'g'), '[redacted]').replace(LONG, m => keyLike(m) ? '[redacted]' : m)
        .replace(new RegExp(EMAIL, 'g'), m => isOurs(m) ? m : '[email]')
        .replace(new RegExp(PHONE, 'gi'), '[phone]')
        .slice(0, max)
}
export function findings(doc, where) {
    const out = []
    const walk = (v, p) => {
        if (typeof v === 'string') {
            if ((v.match(new RegExp(EMAIL, 'g')) || []).some(m => !isOurs(m))) out.push(`${where} ${p}: looks like an email`)
            if (PHONE.test(v) && !/^\d{4}-\d{2}-\d{2}/.test(v) && !/^https?:\/\/\S+$/.test(v)) out.push(`${where} ${p}: looks like a phone number`)
            if (hasSecret(v)) out.push(`${where} ${p}: looks like a key or token`)
        } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`))
        else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k)
    }
    walk(doc, '')
    return out
}
export const idOf = (...parts) => crypto.createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 32)
export const clean = o => JSON.parse(JSON.stringify(o))

export function auth() {
    const h = {}
    const pw = process.env.ELASTIC_PASSWORD || process.env.ELASTIC_CLOUD
    if (process.env.ELASTIC_API_KEY) h.authorization = `ApiKey ${process.env.ELASTIC_API_KEY}`
    else if (pw) h.authorization = 'Basic ' + Buffer.from(`${process.env.ELASTIC_USER || 'elastic'}:${pw}`).toString('base64')
    return h
}
export function base() {
    const b = (process.env.ELASTIC_URL || '').replace(/\/+$/, '')
    if (!/^https:\/\//.test(b)) throw new Error('ELASTIC_URL (https://<deployment>.es.<region>...) is not set')
    return b
}
export async function pushIndex(index, mapping, docs, { recreate = false } = {}) {
    const B = base(), headers = { 'content-type': 'application/json', ...auth() }
    if (recreate) await fetch(`${B}/${index}`, { method: 'DELETE', headers })
    const head = await fetch(`${B}/${index}`, { method: 'HEAD', headers })
    if (head.status === 404) {
        const r = await fetch(`${B}/${index}`, { method: 'PUT', headers, body: JSON.stringify(mapping) })
        if (!r.ok) throw new Error(`create ${index}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`)
    } else if (!head.ok) throw new Error(`${index}: HTTP ${head.status}`)
    let sent = 0, errors = 0
    for (let i = 0; i < docs.length; i += 500) {
        const body = docs.slice(i, i + 500).map(x => JSON.stringify({ index: { _index: index, _id: x._id } }) + '\n' + JSON.stringify(x.doc)).join('\n') + '\n'
        const r = await fetch(`${B}/_bulk`, { method: 'POST', headers: { ...headers, 'content-type': 'application/x-ndjson' }, body })
        if (!r.ok) throw new Error(`_bulk ${index}: HTTP ${r.status}`)
        const j = await r.json()
        const bad = j.items.filter(it => it.index?.error)
        sent += j.items.length; errors += bad.length
        for (const it of bad.slice(0, 3)) console.log(`  error ${it.index._id}: ${it.index.error.type}: ${String(it.index.error.reason).slice(0, 200)}`)
    }
    await fetch(`${B}/${index}/_refresh`, { method: 'POST', headers })
    return { sent, errors }
}

// ---------- submissions by any agent (docs/elastic-guidance.md) ----------
// An index is <prefix>-<kind>; its owner is written in the index's own _meta when it is created, and only the owner
// (or elastic.1, who keeps the deployment) writes to it after. Every submission is logged in elastic-submissions.
export const STEWARD = 'elastic.1.fringe@PrompTugal.dinis'
export const PREFIXES = ['fringe', 'ptnews', 'websummit', 'swarm', 'agents']
export const INDEX_RX = new RegExp(`^(${PREFIXES.join('|')})-[a-z0-9][a-z0-9-]{1,60}$`)
const AGENT_RX = /^[a-z0-9][\w.-]*@[A-Za-z][\w.-]+$/
const kwT = { type: 'keyword' }, dateT = { type: 'date' }
export const PROVENANCE = { kind: kwT, source: kwT, read_at: dateT, signer: kwT, commit: kwT, ingested_at: dateT, ingested_by: kwT, t: dateT, id: kwT }
export const openMapping = (owner, about = '') => ({
    settings: { number_of_shards: 1, 'index.mapping.total_fields.limit': 400 },
    mappings: {
        _meta: { owner, created_by: owner, created_at: new Date().toISOString(), guidance: 'docs/elastic-guidance.md', about },
        date_detection: true, dynamic_date_formats: ['strict_date_optional_time'],
        dynamic_templates: [
            { text_fields: { match_pattern: 'regex', match: '^(text|body|summary|description|why|notes?)$', mapping: { type: 'text' } } },
            { strings: { match_mapping_type: 'string', mapping: { type: 'keyword', ignore_above: 1024, fields: { text: { type: 'text' } } } } },
        ],
        properties: { ...PROVENANCE },
    },
})

async function indexMeta(index) {
    const r = await fetch(`${base()}/${index}/_mapping`, { headers: auth() })
    if (r.status === 404) return null
    if (!r.ok) throw new Error(`${index}: HTTP ${r.status}`)
    const j = await r.json()
    return Object.values(j)[0]?.mappings?._meta || {}
}

export async function submitDocs({ index, docs, agent, idField = 'id', timeField, source, commit = '', about = '', dry = false, via = 'push' }) {
    if (!INDEX_RX.test(index)) throw new Error(`index "${index}": must be <${PREFIXES.join('|')}>-<kind> (lower case, digits, hyphens)`)
    if (!AGENT_RX.test(agent || '')) throw new Error('AGENT (your agent name, as for release.sh) is not set or not an agent name')
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z'), ok = [], held = []
    for (const [i, raw] of docs.entries()) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { held.push(`#${i}: not an object`); continue }
        const d = scrubFields(raw)
        const key = d[idField] ?? crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex').slice(0, 24)
        const t = timeField && d[timeField] ? d[timeField] : (d.t || d.read_at || now)
        const doc = clean({ ...d, id: String(key), t, kind: d.kind || index.split('-').slice(1).join('-'), source: d.source || source, read_at: d.read_at || now,
            signer: agent, commit: d.commit || commit, ingested_at: now, ingested_by: agent })
        const f = findings(doc, `#${i} ${key}`)
        if (f.length) held.push(...f.slice(0, 2)); else ok.push({ _id: idOf(index, key), doc })
    }
    const meta = dry ? null : await indexMeta(index)
    const owner = meta ? (meta.owner || STEWARD) : agent   // an index made before owners were recorded is the steward's
    if (owner !== agent && agent !== STEWARD) throw new Error(`${index} is owned by ${owner}: write to your own index (docs/elastic-guidance.md)`)
    let r = { sent: 0, errors: 0 }
    if (!dry && ok.length) r = await pushIndex(index, openMapping(agent, about), ok)
    if (!dry) {   // the audit trail (elastic.1 reads it every wake)
        const log = { t: now, agent, index, via, sent: r.sent, errors: r.errors, held: held.length, source, commit, owner: meta ? (meta.owner || STEWARD) : agent }
        await pushIndex('elastic-submissions', { settings: { number_of_shards: 1 }, mappings: { _meta: { owner: STEWARD }, properties: { t: dateT, agent: kwT, index: kwT, via: kwT, owner: kwT, source: kwT, commit: kwT, sent: { type: 'long' }, errors: { type: 'long' }, held: { type: 'long' } } } },
            [{ _id: idOf('submission', agent, index, now), doc: log }]).catch(() => {})
    }
    return { ok: ok.length, held, ...r, owner: meta ? (meta.owner || STEWARD) : agent }
}
