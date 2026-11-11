#!/usr/bin/env node
// The agent activity lane of Lisbon Fringe (work/21, observability.fringe@PrompTugal.dinis, 11 November 2026, at Dinis
// Cruz's word, brief 2). Copied from PrompTugal.news's newsroom/tools/agent-log.mjs (observability@PrompTugal.dinis);
// the record is the same (type web-summit.agent-run/v1). Changed here: the lane is this site's (assets/obs/obs.json),
// the keys are this repository's data/keys.json, and the paths. Every fringe agent runs it at the end of each wake;
// /traffic/ counts the runs. In a Claude Code cloud session it uses the session's proxy by itself.
//
//   node admin/tools/agent-log.mjs --agent researcher.fringe@PrompTugal.dinis \
//        --read repo:CLAUDE.md,repo:REALITY.md,https://fringe.promptugal.news/llms.txt \
//        --commits auto --did release:v0.1.40 --trigger person --notes "one line"
//
//   --read     URLs read this run, comma-separated (or repeat the flag); `url@bytes` adds the size. Markdown or HTML is
//              inferred from the URL (.md, llms.txt, raw.githubusercontent.com: md; else html); `url=md` forces it.
//              Repository files read from a clone: `repo:path/to/file.md`.
//   --did      commit ids, `release:vX.Y.Z`, `file:path`, `msg:<agent>` (a message sent), comma-separated.
//   --commits  auto: add this repository's commits from the last --since hours (default 12) whose Agent: trailer is you.
//   --trigger  schedule | person | message;   --tokens in/out (or a total);   --session id (default: this Claude session)
//   --dry      print the record, send nothing.
//
// The record is signed with your session key (~/.sg-send/keys, the one whose label is your agent name, or --key <fp>),
// so the drain names you by the key published in this repository's data/keys.json; then sealed to the lane's drain key
// (sgit hybrid envelope v2) and written to the agents' lane named in assets/obs/obs.json (read from this clone, or
// from https://fringe.promptugal.news/assets/obs/obs.json). The lane token only writes; the write is blind.
// Nothing secret goes in a record: a URL's query string and fragment are dropped before it is logged.
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync, spawnSync } from 'child_process'

// WS-162: in a cloud session Node's fetch must be told to use the proxy
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}

const args = process.argv.slice(2), opt = {}
for (let i = 0; i < args.length; i++) {
    const a = args[i]; if (!a.startsWith('--')) continue
    const k = a.slice(2), v = (args[i + 1] && !args[i + 1].startsWith('--')) ? args[++i] : true
    opt[k] = opt[k] === undefined ? v : [].concat(opt[k], v)
}
const die = m => { console.error('agent-log: ' + m); process.exit(1) }
const list = v => [].concat(v || []).flatMap(x => String(x).split(',')).map(s => s.trim()).filter(Boolean)
if (opt.help || !opt.agent) die('usage: node admin/tools/agent-log.mjs --agent <role@PrompTugal.person> --read <urls> --did <ids> [--commits auto] [--trigger t] [--tokens in/out] [--notes "..."] [--dry]')
const agent = String(opt.agent)
if (!/^[a-z0-9.-]+@[a-z0-9.-]+$/i.test(agent)) die(`--agent ${agent}: expected role.fringe@PrompTugal.person`)

const clean = u => { try { const x = new URL(u); x.search = ''; x.hash = ''; return x.toString() } catch { return u.replace(/[?#].*$/, '') } }
const read = list(opt.read).map(s => {
    let as = null, bytes = null
    const m = s.match(/^(.*?)(?:=(md|html))?(?:@(\d+))?$/); s = m[1]; as = m[2] || null; bytes = m[3] ? +m[3] : null
    if (s.startsWith('repo:')) return { url: s, as: as || (/\.(md|txt|json)$/.test(s) ? 'md' : 'file'), ...(bytes ? { bytes } : {}) }
    const url = clean(s)
    as = as || (/\.md$|llms(-full)?\.txt$|raw\.githubusercontent\.com/.test(url) ? 'md' : 'html')
    return { url, as, ...(bytes ? { bytes } : {}) }
})
const did = list(opt.did).map(s => {
    const [k, ...r] = s.split(':'); const v = r.join(':')
    if (!v && /^[0-9a-f]{7,40}$/.test(k)) return { commit: k }
    if (k === 'release') return { release: v }
    if (k === 'file') return { file: v }
    if (k === 'msg') return { message_to: v }
    return { note: s.slice(0, 120) }
})
if (opt.commits === 'auto') {
    try {
        const since = `${+(opt.since || 12)} hours ago`
        const esc = agent.replace(/[.]/g, '[.]')                         // the Agent: line anywhere in the body, or the subject's prefix
        const out = execFileSync('git', ['log', `--since=${since}`, '--format=%h%x09%s', '-E', `--grep=^Agent: *${esc} *$`, `--grep=^${esc}:`], { encoding: 'utf8' })
        for (const line of out.split('\n').filter(Boolean)) {
            const [h, subj] = line.split('\t')
            if (/^site v\d/.test(subj)) continue                                // CI's release commit quotes your trailer
            if (!did.some(d => d.commit === h)) did.push({ commit: h, subject: subj.slice(0, 160) })
        }
    } catch { }
}
let repo = ''
try { repo = execFileSync('git', ['config', '--get', 'remote.origin.url'], { encoding: 'utf8' }).trim().replace(/^.*github\.com[/:]/, '').replace(/\.git$/, '') } catch { }
const tokens = opt.tokens ? (String(opt.tokens).includes('/') ? (([i, o]) => ({ input: +i, output: +o }))(String(opt.tokens).split('/')) : { total: +opt.tokens }) : undefined
const rec = { type: 'web-summit.agent-run/v1', v: 1, agent, session: String(opt.session || process.env.CLAUDE_CODE_SESSION_ID || ''),
    run: new Date().toISOString().slice(0, 16) + 'Z', trigger: opt.trigger ? String(opt.trigger) : undefined,
    repo: repo || undefined, read, did, tokens, notes: opt.notes ? String(opt.notes).slice(0, 300) : undefined }
for (const k of Object.keys(rec)) if (rec[k] === undefined || rec[k] === '') delete rec[k]

// sign with the agent's own session key, if this machine holds it
const KEYS = path.join(process.env.PKI_AGENT_HOME || path.join(os.homedir(), '.sg-send'), 'keys')
let key = null
try {
    const dirs = fs.readdirSync(KEYS).map(d => path.join(KEYS, d)).filter(d => fs.existsSync(path.join(d, 'signing_private.pem')))
    const metas = dirs.map(d => ({ d, m: JSON.parse(fs.readFileSync(path.join(d, 'metadata.json'), 'utf8')) }))
    const pick = opt.key ? metas.find(x => [x.m.signing_fingerprint, x.m.encryption_fingerprint].includes(String(opt.key)))
        : metas.find(x => String(x.m.label).toLowerCase() === agent.toLowerCase()) || (metas.length === 1 ? metas[0] : null)
    if (pick) key = { fp: pick.m.signing_fingerprint, pem: fs.readFileSync(path.join(pick.d, 'signing_private.pem'), 'utf8') }
} catch { }
if (key) {
    try {
        const over = JSON.stringify(rec)
        const sig = crypto.sign('sha256', Buffer.from(over), { key: key.pem, dsaEncoding: 'ieee-p1363', passphrase: process.env.SG_SEND_PASSPHRASE || '' })
        rec.sig = { key: key.fp, alg: 'ECDSA-P256-SHA256-P1363', sig: sig.toString('base64'), over }
    } catch (e) { console.error(`agent-log: could not sign (${e.message.split('\n')[0]}); sending unsigned`) }
} else console.error('agent-log: no session key found for ' + agent + ' (pki-agent.mjs keygen --session); sending unsigned')

if (opt.dry) { const show = { ...rec }; if (show.sig) show.sig = { ...show.sig, over: '(the record above, as JSON)' }; console.log(JSON.stringify(show, null, 2)); process.exit(0) }

// the lane's public config: this clone's copy, else the live site's
const ROOT = path.dirname(path.dirname(path.dirname(new URL(import.meta.url).pathname)))
let cfg = null
try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'obs', 'obs.json'), 'utf8')) } catch { }
if (!cfg) { try { cfg = await (await fetch('https://fringe.promptugal.news/assets/obs/obs.json')).json() } catch (e) { die('cannot read assets/obs/obs.json: ' + e.message) } }
if (!cfg.enabled || !cfg.lanes?.agents?.length) die('the agents lane is not enabled in assets/obs/obs.json')

function seal(pem, text) {                                              // sgit hybrid envelope v2: RSA-OAEP-SHA256 + AES-256-GCM
    const aes = crypto.randomBytes(32), iv = crypto.randomBytes(12)
    const c = crypto.createCipheriv('aes-256-gcm', aes, iv), ct = Buffer.concat([c.update(text, 'utf8'), c.final(), c.getAuthTag()])
    const w = crypto.publicEncrypt({ key: pem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, aes)
    return Buffer.from(Buffer.from(JSON.stringify({ v: 2, w: w.toString('base64'), i: iv.toString('base64'), c: ct.toString('base64') })).toString('base64')).toString('base64')
}
const payload = seal(cfg.recipient.encrypt, JSON.stringify(rec))
const LA = cfg.lanes.agents, st = Math.floor(Math.random() * LA.length)            // a random first lane; on 507 the next
for (const token of LA.map((_, i) => LA[(st + i) % LA.length])) {
    const r = await fetch(`${cfg.endpoint}/api/vault/append/write/${cfg.vault_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ append_token: token, payload }) })
    if (r.status === 507) continue
    if (!r.ok) die(`the lane answered ${r.status}`)
    console.log(`agent-log: logged ${agent}'s run (${read.length} read, ${did.length} done)${rec.sig ? ', signed ' + rec.sig.key : ', unsigned'}`)
    process.exit(0)
}
die('every agents lane is full (507); tell observability.fringe@PrompTugal.dinis')
