#!/usr/bin/env node
// Renders a design module (admin/build/designs/<id>.mjs) into _site/designs/<id>/index.html for local checks.
// The real frame (the ?design= switcher, /designs/) is work/35's; this shows one design in the shell's look with the
// same data: node admin/tools/design-preview.mjs b   (run the build first, so _site/ has the api files and tokens)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { eventPath, hasPage } from '../build/event-pages.mjs';
import { placeShort } from '../build/cards.mjs';
import { sizeOf } from '../build/tiers.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const id = process.argv[2] || 'b';
const at = process.env.AT ? new Date(process.env.AT) : new Date();
const mod = await import(pathToFileURL(join(root, 'admin/build/designs', id + '.mjs')).href);
const data = JSON.parse(readFileSync(join(root, 'data/events.json'), 'utf8'));
const events = Array.isArray(data) ? data : data.events;
const j = (p) => (existsSync(join(root, p)) ? JSON.parse(readFileSync(join(root, p), 'utf8')) : null);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const out = mod.render({ events, activity: j('_site/api/v1/activity.json'), swarm: j('_site/api/v1/swarm.json'), at, esc, eventPath, hasPage, sizeOf, placeShort });
const tokens = readFileSync(join(root, 'admin/build/tokens.css'), 'utf8');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(mod.meta.name)}: design ${esc(id)}</title>
<style>${tokens}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 var(--sans)}main{max-width:1180px;margin:0 auto;padding:0 16px}
.pv-bar{background:var(--ink);color:var(--paper);font:12px var(--mono);text-align:center;padding:5px}.pv-bar a{color:var(--paper)}
.pv-ind{font-size:.85rem;padding:8px 16px;background:var(--paper-2);border-bottom:1px solid var(--hair)}
${out.css}</style></head><body>
<div class="pv-bar"><a href="https://promptugal.news">Lisbon Tech Fringe &middot; a PrompTugal.news site</a></div>
<div class="pv-ind">Lisbon Tech Fringe is independent of Web Summit. <a href="https://websummit.com/">The organisers' official site</a>. (design preview: ${esc(id)})</div>
<main>${out.body}</main><script>${out.script}</script></body></html>`;
mkdirSync(join(root, '_site/designs', id), { recursive: true });
writeFileSync(join(root, '_site/designs', id, 'index.html'), html);
console.log(`_site/designs/${id}/index.html`, html.length, 'bytes');
