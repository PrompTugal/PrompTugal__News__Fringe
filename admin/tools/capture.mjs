#!/usr/bin/env node
// Lisbon Fringe captures (work/27): screenshots + text + extracted fields, into a normal sgit vault; pointers only in git.
//
//   node admin/tools/capture.mjs [--vault-root ~/.sg-send/captures] [--limit N] [--no-push] [--only fringe|events]
//
// Per run: our pages at 390 px and 1280 px; each event's public organiser page (data/events.json url): one screenshot,
// its visible text, and our extracted fields. Files go to <vault>/<yyyy-mm-dd>/<hh>/<site>/. Git gets only
// data/capture-index-<yyyy-mm-dd>-<hh>.json (pointers: vault id, path, sha256, url, captured_at) and a small
// data/capture-index.json that lists the runs. Never a binary in git. Never websummit.com. Never a page behind a login.
// A new vault opens before one reaches MAX_FILES (20,000 is the hard limit; we rotate at 15,000).
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const VROOT = arg('vault-root', path.join(os.homedir(), '.sg-send', 'captures'));
const LIMIT = Number(arg('limit', 0)) || 0, NOPUSH = !!arg('no-push', false), ONLY = arg('only', '');
const HOST = 'https://dev.send.sgraph.ai', SITE = 'https://fringe.promptugal.news', MAX_FILES = 15000;
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const iso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const blocked = u => /(^|\.)websummit\.com$/i.test(new URL(u).hostname);
// PRIVACY (lead, 12:4x UTC, security finding 21): organiser pages show guest lists (private people's names and faces).
// Only hosts that sources.md marks as machine-readable ("Yes"): Luma event pages. Meetup is on hold. Every event
// screenshot hides images and is cropped to the header; page text stops at the first guest/host marker.
const ALLOW_EVENT_HOSTS = new Set(['luma.com', 'lu.ma']);
const MARKERS = /(hosted by|hosts?\b\s*$|\bgoing\b|attendees|guests|who'?s going|\d+\s+(going|guests)|see all|featured in)/i;
const cutText = t => { const m = MARKERS.exec(t); return m ? t.slice(0, m.index).trimEnd() : t; };
const RETAIN_UNTIL = Date.parse('2026-11-14T00:00:00Z');   // events' captures are deleted after 13 November
const EVENT_EVERY_MS = 24 * 3600 * 1000;                    // each event page at most once a day
const slug = s => s.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'index';
const sgit = (cwd, ...a) => execFileSync('sgit', ['--base-url', HOST, '--token', 'proxy-injected', ...a], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// ---- vault registry (data/capture-vaults.json) and the active vault
const vfile = path.join(ROOT, 'data/capture-vaults.json');
const reg = JSON.parse(fs.readFileSync(vfile, 'utf8'));
const files = d => { let n = 0; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === '.sg_vault') continue; n += e.isDirectory() ? files(path.join(d, e.name)) : 1; } return n; };
let active = reg.vaults.find(v => v.status === 'active');   // a vault marked private is never active and never published
if (files(path.join(VROOT, active.dir)) >= MAX_FILES) {           // rotate: open a new vault before the old one is full
  const dir = 'cap-' + String(reg.vaults.length + 1).padStart(3, '0');
  const out = sgit(VROOT, 'init', dir); const id = /Vault ID:\s*(\S+)/.exec(out)[1];
  active.status = 'full'; active.closed_at = iso();
  active = { id, dir, status: 'active', opened_at: iso(), kind: 'normal', note: 'opened because the previous vault reached ' + MAX_FILES + ' files (limit 20,000)' };
  reg.vaults.push(active); reg.updated = iso(); fs.writeFileSync(vfile, JSON.stringify(reg, null, 1) + '\n');
}
const VDIR = path.join(VROOT, active.dir);

// ---- what to capture
const events = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/events.json'), 'utf8')).events;
let pages = ['/', '/join/', '/graph/', '/traffic/', '/evolution/', '/storm/', '/now/', '/changes/', '/organisers/', '/dashboard/', '/how/', '/api/v1/events.json']
  .map(p => SITE + p);
try { const sm = await (await fetch(SITE + '/sitemap.xml')).text(); for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) if (!m[1].includes('/e/') && !pages.includes(m[1])) pages.push(m[1]); } catch {}
pages = pages.filter(u => !u.endsWith('.json'));
const targets = [];
if (ONLY !== 'events') for (const u of pages) targets.push({ site: 'fringe.promptugal.news', url: u, widths: [390, 1280] });
const lastSeen = {};   // url -> ms of the last successful event capture, from the pointers in git
try { const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/capture-index.json'), 'utf8')); for (const r of idx.runs) { if (reg.vaults.find(v => v.id === r.vault_id)?.private) continue; const run = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', r.file), 'utf8')); for (const c of run.captures) if (!c.error && c.event_id && c.vault_ok !== false) lastSeen[c.url] = Math.max(lastSeen[c.url] || 0, Date.parse(c.captured_at)); } } catch {}
const FORCE = !!arg('force', false);
if (ONLY !== 'fringe' && Date.now() < RETAIN_UNTIL) for (const e of events) { if (blocked(e.url) || !ALLOW_EVENT_HOSTS.has(new URL(e.url).hostname)) continue; if (!FORCE && Date.now() - (lastSeen[e.url] || 0) < EVENT_EVERY_MS) continue; targets.push({ site: new URL(e.url).hostname, url: e.url, widths: [1280], event: e }); }
if (LIMIT) targets.length = Math.min(targets.length, LIMIT);

const { chromium } = require('playwright');
const browser = await chromium.launch();
const t0 = new Date(), day = t0.toISOString().slice(0, 10), hh = t0.toISOString().slice(11, 13), runId = `${day}-${hh}`;
const rel = (...p) => path.join(day, hh, ...p);
const records = [];
const put = (relpath, buf) => { const f = path.join(VDIR, relpath); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); return sha(buf); };

for (const t of targets) {
  for (const w of t.widths) {
    const captured_at = iso(); let ctx, status = null, err = null, title = null, text = '', fields = null;
    const base = slug(t.url) + '-' + w;
    try {
      ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1, userAgent: 'LisbonFringeCapture/1 (+https://fringe.promptugal.news; independent guide; public pages only)' });
      const page = await ctx.newPage(); page.setDefaultTimeout(25000);
      const resp = await page.goto(t.url, { waitUntil: 'domcontentloaded' }); status = resp ? resp.status() : null;
      await page.waitForTimeout(1500);
      // never capture a login wall
      const gated = /\/(login|signin|sign-in|auth)\b/i.test(page.url());
      if (gated) { err = 'login wall: not captured'; }
      else if (status >= 400 && !t.event) { err = 'http ' + status + ': not captured'; }
      else {
        title = await page.title();
        text = await page.evaluate(() => document.body ? document.body.innerText : '');
        const og = await page.evaluate(() => (document.querySelector('meta[property="og:title"]') || {}).content || null);
        if (t.event) await page.addStyleTag({ content: 'img,picture,video,canvas,svg image,[style*="background-image"]{visibility:hidden!important}' });
        const png = await page.screenshot({ type: 'jpeg', quality: 70, ...(t.event ? { clip: { x: 0, y: 0, width: w, height: 400 } } : {}) });
        const shot = put(rel(t.site, base + '.jpg'), png);
        const body = (t.event ? cutText(text) : text).slice(0, 20000);
        const tsha = put(rel(t.site, base + '.txt'), body);
        if (t.event) {
          const e = t.event;
          fields = { event_id: e.id, name: e.name, our_status: e.status, our_start: e.start, our_end: e.end, our_read_at: e.read_at, page_title: title, og_title: og,
            http_status: status, name_found_on_page: body.toLowerCase().includes(e.name.toLowerCase().slice(0, 25)),
            cancelled_word_on_page: /cancel+ed|postponed|rescheduled|sold out/i.test(body) };
        } else fields = { page_title: title, http_status: status, chars: text.length };
        const fsha = put(rel(t.site, base + '.json'), JSON.stringify({ url: t.url, captured_at, width: w, fields }, null, 1));
        records.push({ site: t.site, url: t.url, width: w, captured_at, http_status: status, error: null,
          files: { screenshot: { path: rel(t.site, base + '.jpg'), sha256: shot, bytes: png.length }, text: { path: rel(t.site, base + '.txt'), sha256: tsha }, fields: { path: rel(t.site, base + '.json'), sha256: fsha } },
          ...(t.event ? { event_id: t.event.id, our_status: t.event.status, name_found_on_page: fields.name_found_on_page } : {}) });
      }
    } catch (e) { err = String(e.message || e).split('\n')[0].slice(0, 160); }
    finally { if (ctx) await ctx.close(); }
    if (err) records.push({ site: t.site, url: t.url, width: w, captured_at, http_status: status, error: err, files: null, ...(t.event ? { event_id: t.event.id } : {}) });
    console.log(`${err ? 'FAIL' : 'ok  '} ${w} ${t.url}${err ? '  ' + err : ''}`);
    await new Promise(r => setTimeout(r, 400));   // polite: one page at a time
  }
}
await browser.close();

// ---- pointers in git
const run = { run: runId, captured_at: t0.toISOString().replace(/\.\d+Z$/, 'Z'), finished_at: iso(), vault: { id: active.id, host: HOST }, count: records.length, ok: records.filter(r => !r.error).length, captures: records };
fs.writeFileSync(path.join(ROOT, `data/capture-index-${runId}.json`), JSON.stringify(run, null, 1) + '\n');
const ifile = path.join(ROOT, 'data/capture-index.json');
const idx = fs.existsSync(ifile) ? JSON.parse(fs.readFileSync(ifile, 'utf8')) : { about: 'Pointers only (work/27). Each run file lists vault id, path, sha256, url and captured_at; the files themselves live in the vault.', runs: [] };
idx.runs = idx.runs.filter(r => r.run !== runId).concat([{ run: runId, file: `capture-index-${runId}.json`, vault_id: active.id, captured_at: run.captured_at, count: run.count, ok: run.ok }]);
idx.updated = iso(); fs.writeFileSync(ifile, JSON.stringify(idx, null, 1) + '\n');

// ---- retention: after 13 November the event captures are deleted from the active vault
if (Date.now() >= RETAIN_UNTIL) for (const d of fs.readdirSync(VDIR, { withFileTypes: true })) if (d.isDirectory() && d.name !== '.sg_vault') for (const h of fs.readdirSync(path.join(VDIR, d.name))) for (const site of fs.readdirSync(path.join(VDIR, d.name, h))) if (site !== 'fringe.promptugal.news') fs.rmSync(path.join(VDIR, d.name, h, site), { recursive: true, force: true });
// ---- commit and push the vault
if (!NOPUSH) {
  sgit(VDIR, 'commit', `capture run ${runId}: ${run.ok}/${run.count}`);
  const o = sgit(VDIR, 'push'); console.log(o.trim().split('\n').slice(-2).join('\n'));
}
console.log(`run ${runId}: ${run.ok}/${run.count} captured into vault ${active.id} (${files(VDIR)} files)`);
