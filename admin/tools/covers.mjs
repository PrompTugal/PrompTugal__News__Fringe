#!/usr/bin/env node
// Event covers (work/45): each event's own cover image (the page's og:image), into the covers vault; mapped in data/event-images.json.
//   node admin/tools/covers.mjs [--date 2026-11-11] [--limit N] [--no-push] [--force]
// Covers only: the og:image the organiser chose for sharing. Never a guest list, never a screenshot of the page body.
// Luma pages only (the hosts sources.md marks machine-readable). Never websummit.com, never a login page.
// Files go to <vault>/<event-id>.<ext>; git gets only data/event-images.json (pointers: vault id, path, sha256, source URL, captured_at).
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const DATE = arg('date', new Date().toISOString().slice(0, 10)), LIMIT = Number(arg('limit', 0)) || 0, NOPUSH = !!arg('no-push', false), FORCE = !!arg('force', false);
const HOST = 'https://dev.send.sgraph.ai', MAX_FILES = 15000, MAX_BYTES = 1_500_000;
// Luma (sources.md: public pages allowed) and organisers' own sites (the lead's addendum, 14:00 UTC). NO automated reading of
// Meetup (on hold), Eventbrite, Partiful (forbid it) or websummit.com: those events get no automated cover, and are listed in the status.
const NO = /(^|\.)(luma\.com|lu\.ma|lumacdn\.com|meetup\.com|eventbrite\.[a-z.]+|partiful\.com|websummit\.com)$/i;
const allowed = e => { const h = new URL(e.url).hostname; return !NO.test(h); };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const iso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const sgit = (cwd, ...a) => execFileSync('sgit', ['--base-url', HOST, '--token', 'proxy-injected', ...a], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const vfile = path.join(ROOT, 'data/capture-vaults.json'), reg = JSON.parse(fs.readFileSync(vfile, 'utf8'));
const VROOT = path.join(os.homedir(), '.sg-send', 'captures');
const files = d => { let n = 0; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === '.sg_vault') continue; n += e.isDirectory() ? files(path.join(d, e.name)) : 1; } return n; };
let vault = reg.vaults.find(v => v.purpose === 'covers' && v.status === 'active');
if (files(path.join(VROOT, vault.dir)) >= MAX_FILES) {   // a new covers vault before 20,000 files
  const dir = 'covers-' + String(reg.vaults.filter(v => v.purpose === 'covers').length + 1).padStart(3, '0');
  const id = /Vault ID:\s*(\S+)/.exec(sgit(VROOT, 'init', dir))[1]; vault.status = 'full';
  vault = { id, dir, status: 'active', purpose: 'covers', kind: 'normal', opened_at: iso(), read_key_public: false, note: 'opened: the previous covers vault reached ' + MAX_FILES + ' files' }; reg.vaults.push(vault);
  fs.writeFileSync(vfile, JSON.stringify(reg, null, 1) + '\n');
}
const VDIR = path.join(VROOT, vault.dir);

const ifile = path.join(ROOT, 'data/event-images.json');
const out = fs.existsSync(ifile) ? JSON.parse(fs.readFileSync(ifile, 'utf8')) : { about: "Each event's own cover image (the og:image its organiser set on the public Luma page), kept in a covers vault with a public read key (data/capture-vaults.json). Pointers only: vault id, path, sha256, source URL, captured_at. Credit: 'image: <organiser>'. Covers only, never a guest list or a host's face from the page body (work/45).", images: [] };
const have = new Map(out.images.map(i => [i.event_id, i]));
let events = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/events.json'), 'utf8')).events.filter(e => e.date === DATE && allowed(e));
if (LIMIT) events = events.slice(0, LIMIT);

const { chromium } = require('playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'LisbonFringeCapture/1 (+https://fringe.promptugal.news; independent guide; public pages only)' });
let ok = 0, skip = 0, fail = 0;
for (const e of events) {
  if (!FORCE && have.has(e.id)) { skip++; continue; }
  const page = await ctx.newPage(); page.setDefaultTimeout(25000); let err = null;
  try {
    const r = await page.goto(e.url, { waitUntil: 'domcontentloaded' });
    if (!r || r.status() >= 400 || /\/(login|signin|sign-in|auth)\b/i.test(page.url())) throw new Error('http ' + (r && r.status()));
    const og = await page.evaluate(() => (document.querySelector('meta[property="og:image"]') || {}).content || null);
    if (!og) throw new Error('no og:image');
    const u = new URL(og, e.url);
    if (!/^https:$/.test(u.protocol)) throw new Error('not https');
    const resp = await ctx.request.get(u.href, { timeout: 25000 });
    const ct = resp.headers()['content-type'] || '';
    if (!resp.ok() || !/^image\/(jpeg|png|webp|gif)/.test(ct)) throw new Error('not an image: ' + resp.status() + ' ' + ct);
    const buf = await resp.body(); if (buf.length > MAX_BYTES) throw new Error('over ' + MAX_BYTES + ' bytes');
    const ext = /png/.test(ct) ? 'png' : /webp/.test(ct) ? 'webp' : /gif/.test(ct) ? 'gif' : 'jpg';
    const rel = `${e.id}.${ext}`; fs.writeFileSync(path.join(VDIR, rel), buf);
    have.set(e.id, { event_id: e.id, vault_id: vault.id, path: rel, sha256: sha(buf), bytes: buf.length, content_type: ct, source_url: u.href, page_url: e.url, organiser: e.organiser, captured_at: iso() });
    ok++; console.log('ok  ', e.id, buf.length);
  } catch (x) { err = String(x.message || x).split('\n')[0].slice(0, 120); fail++; console.log('FAIL', e.id, err); }
  await page.close(); await new Promise(r => setTimeout(r, 400));
}
await browser.close();
out.images = [...have.values()].sort((a, b) => a.event_id.localeCompare(b.event_id)); out.updated = iso(); out.vaults = [...new Set(out.images.map(i => i.vault_id))];
fs.writeFileSync(ifile, JSON.stringify(out, null, 1) + '\n');
if (!NOPUSH && ok) { sgit(VDIR, 'commit', `covers ${DATE}: ${ok} new`); console.log(sgit(VDIR, 'push').trim().split('\n').slice(-1)[0]); }
console.log(`covers ${DATE}: ${ok} new, ${skip} already had, ${fail} failed; ${out.images.length} mapped; vault ${vault.id} (${files(VDIR)} files)`);
