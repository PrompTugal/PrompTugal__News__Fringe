#!/usr/bin/env node
// The gate: must print OK, and a red gate is no release. Budget: 5 seconds. Adapted from the storm site's
// (PrompTugal/PrompTugal__News__Storm-Charles admin/build/validate.mjs). It builds the site once, then checks:
//   1. the repository stays fast: no tracked file over 256 KB, no binary, nothing generated or from a key store;
//   2. no secret: private keys, tokens, vault keys;
//   3. every tracked JSON parses; every published event has a name, an https source and the time it was read;
//   4. every internal link resolves in the built site;
//   5. every page carries the independence line and links the organisers; the front page links the storm site;
//   7. no email address or phone number in data/ or the built site (finding 5; allow-list in the section).
// Run: node admin/build/validate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, '_site');
const t0 = Date.now(), errors = [], warns = [];
const fail = (m) => errors.push(m);

execFileSync(process.execPath, [path.join(ROOT, 'admin/build/build.mjs')], { stdio: 'inherit', env: process.env });

let tracked;
try { tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString().split('\0').filter(Boolean); }
catch { tracked = []; }
const MAX = 256 * 1024;
const BINARY_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|ico|pdf|zip|gz|tgz|7z|rar|mp4|mov|webm|mp3|wav|woff2?|ttf|otf|psd|sqlite|db|bin|exe|dmg|pkl|parquet)$/i;
const FORBIDDEN = /(^|\/)(node_modules|_site|\.sg_vault|\.sg-send|raw|captures|screenshots)\//;
const SELF = 'admin/build/validate.mjs';
for (const rel of tracked) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) continue;
  const st = fs.statSync(f);
  if (st.size > MAX) fail(`${rel}: ${st.size} bytes, over 256 KB: bulky data goes to a vault, git keeps a pointer`);
  if (BINARY_EXT.test(rel)) fail(`${rel}: a binary in git: images, PDFs and captures go to a vault`);
  if (FORBIDDEN.test(rel)) fail(`${rel}: this path never goes in git`);
  const buf = fs.readFileSync(f);
  if (buf.subarray(0, 8000).includes(0)) fail(`${rel}: binary content (a NUL byte)`);
  if (rel === SELF) continue;
  const s = buf.toString('utf8');
  if (/-----BEGIN ([A-Z]+ )?PRIVATE KEY-----/.test(s)) fail(`${rel}: a private key`);
  if (/\bsk-or-v1-[0-9a-f]{20,}|\bghp_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bAKIA[0-9A-Z]{16}\b|\bsk-ant-[A-Za-z0-9-]{20,}/.test(s)) fail(`${rel}: a token`);
  if (/sgit_(write|admin)_[A-Za-z0-9]{8,}/.test(s)) fail(`${rel}: a vault write key (only public read keys are published)`);
  if (/sgit_private_[a-z]+_[A-Za-z0-9]/.test(s)) fail(`${rel}: a vault key (sgit's private prefix)`);
  if (/(^|\/)(vault-key-[^/]*|[^/]*\.vault-key|access-token\.json|[^/]*\.key)$/.test(rel)) fail(`${rel}: a key file never goes in git`);
  if (rel.endsWith('.json')) { try { JSON.parse(s); } catch (e) { fail(`${rel}: invalid JSON (${e.message})`); } }
}
if (!tracked.length) warns.push('not a git checkout: the tracked-file checks were skipped');
else for (const need of ['admin/build/build.mjs', 'admin/build/validate.mjs', '.github/workflows/deploy.yml', 'admin/series.txt'])
  if (!tracked.includes(need)) fail(`${need} is not tracked by git (ignored?): CI would not have it`);

// published events: every one sourced and timed
const evf = path.join(ROOT, 'data/events.json');
if (fs.existsSync(evf)) {
  for (const [i, e] of (JSON.parse(fs.readFileSync(evf, 'utf8')).events || []).entries())
    if (!e.name || !/^https:\/\//.test(e.url || '') || !e.read_at || !e.date) fail(`data/events.json event ${i}: needs a name, an https url, a date and read_at`);
}

// the built site: links, independence
const html = [], built = new Set();
const walk = (d) => { built.add(d); for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else { built.add(f); if (f.endsWith('.html')) html.push(f); } } };
walk(OUT);
for (const f of html) {
  const rel = path.relative(OUT, f), s = fs.readFileSync(f, 'utf8');
  if (!/independent of Web Summit/.test(s) || !/href="https:\/\/websummit\.com\/?"/.test(s)) fail(`${rel}: the independence line or the link to the organisers is missing`);
  for (const [, u] of s.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#|data:)/.test(u)) continue;
    const p = decodeURI(u.split('#')[0].split('?')[0]);
    if (!p) continue;
    const target = p.startsWith('/') ? path.join(OUT, p) : path.join(path.dirname(f), p);
    const t = target.replace(/\/+$/, '');
    if (!built.has(t) && !built.has(path.join(t, 'index.html'))) fail(`${rel}: broken link ${u}`);
  }
}
const front = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
if (!/storm-charles\.promptugal\.news/.test(front) || !/not a warning service/i.test(front)) fail('index.html: the storm block (storm site link, "not a warning service") is missing');
for (const need of ['join/index.html', 'api/v1/events.json', 'llms.txt', 'version.json', 'sitemap.xml', '404.html', 'CNAME'])
  if (!fs.existsSync(path.join(OUT, need))) fail(`_site/${need} missing`);

const SITE_ORIGIN = JSON.parse(fs.readFileSync(path.join(ROOT, 'admin/site.json'), 'utf8')).origin.replace(/\/+$/, '');
for (const rel of ['index.html', 'join/index.html', 'graph/index.html']) {   // D2: every page carries the share meta tags (the PNG itself is rendered in CI and not required here)
  const h = fs.readFileSync(path.join(OUT, rel), 'utf8');
  for (const need of ['og:title', 'og:description', `og:image" content="${SITE_ORIGIN}/assets/og/share.png`, 'twitter:card'])
    if (!h.includes(need)) fail(`${rel}: missing ${need}`);
}
// 7. NO CONTACT DETAILS (security finding 5, dev.2.fringe@PrompTugal.dinis; CLAUDE.md: "No contact details, ever"): fails on an email address or a phone
//    number in tracked data/ JSON and in the built pages and API. Matches are reported MASKED (never printed in full). Allow-list, each a known non-contact:
//    agent labels (<role>@PrompTugal.<id>, @web-summit.<id>, with an optional .md for a file name), iCal uids (<evt|calev>-<id>@events.lu.ma: an opaque event id, not a
//    mailbox), and phone-shaped numbers inside SVG path data. A phone is a +<country> number, a tel: link, or a Portuguese mobile written with separators.
{
  const EMAIL = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+/g;
  const PHONE = /(?<![\w.])\+\d{1,3}[\s.\-]?\(?\d{1,4}\)?(?:[\s.\-]?\d{2,4}){2,4}(?!\d)|(?<![\w.])tel:[+\d]|(?<!\d)9[1236]\d[ .\-]\d{3}[ .\-]\d{3}(?!\d)/g;
  const OK_EMAIL = /@(?:[\w-]+\.)*(?:PrompTugal|web-summit)\.[a-z]+(?:\.md)?$|^[a-z]+-[A-Za-z0-9]+@events\.lu\.ma$/;
  const mask = (v) => v.slice(0, 2) + '***' + (v.includes('@') ? v.slice(v.indexOf('@')) : v.slice(-2));
  const targets = tracked.filter((f) => /^data\/.*\.jsonl?$/.test(f)).map((f) => path.join(ROOT, f));
  const walkOut = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walkOut(f); else if (/\.(html|json|txt|xml|md)$/.test(e.name)) targets.push(f); } };
  if (fs.existsSync(OUT)) walkOut(OUT);
  let found = 0;
  for (const f of targets) {
    if (!fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, 'utf8'), rel = path.relative(ROOT, f);
    for (const m of txt.matchAll(EMAIL)) if (!OK_EMAIL.test(m[0]) && found++ < 20) fail(`${rel}: an email address (${mask(m[0])}): no contact details, ever`);
    const nopath = txt.replace(/\s(?:d|points|viewBox|transform)="[^"]*"/g, '');
    for (const m of nopath.matchAll(PHONE)) if (found++ < 20) fail(`${rel}: a phone number (${mask(m[0])}): no contact details, ever`);
  }
  if (found > 20) fail(`...and ${found - 20} more contact-detail hits`);
}
const ms = Date.now() - t0;
// 6. ABP (work/39, abp/tools/abp.mjs check): each new commit's paths against its Agent: trailer's grant.
//    OBSERVE ONLY (Dinis, 11 November 2026, 13:36 UTC): a warning, never a failure.
try { for (const l of execFileSync(process.execPath, [path.join(ROOT, 'abp/tools/abp.mjs'), 'check'], { cwd: ROOT, encoding: 'utf8', timeout: 3000 }).split('\n')) if (l.startsWith('WARN ')) warns.push(l.slice(5)); }
catch (e) { warns.push(`abp check did not run (${String(e.message).split('\n')[0]}): logged, not blocking`); }
if (ms > 5000) warns.push(`the gate took ${ms} ms: over its 5 s budget`);
for (const w of warns) console.log('WARN ' + w);
if (errors.length) { for (const e of errors) console.log('FAIL ' + e); console.log(`RED at commit ${(process.env.GITHUB_SHA || 'local').slice(0, 7)} (${process.env.GITHUB_ACTOR || 'local'}): ${errors.length} problem(s), ${ms} ms`); process.exit(1); }
console.log(`OK ${process.env.VERSION || 'local'}: ${html.length} pages, ${tracked.length} tracked files, ${ms} ms`);
