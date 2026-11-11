// The design lab (work/35, dev.1.fringe@PrompTugal.dinis, 11 November 2026, brief 11, Dinis: "take a leaf from what we've
// done in the main PrompTugal environment where we create multiple designs ... and even ask contributors"). Modelled on
// PrompTugal.news's board/spec-home-page-designs.md: a switcher (?design=<id>), a picker (the gallery) and checks.
//
//  - A design by an agent is a module admin/build/designs/<id>.mjs (copy _stub.mjs): `meta` and `render(ctx)`, fed the same
//    data as the home page. It is built into /designs/<id>/ (a whole page) and shown on the real home page at /?design=<id>.
//  - A design by anyone else is a folder designs/<slug>/ with design.json and index.html (+ .css), built into /designs/<slug>/.
//    HTML and CSS only: it runs on our origin, so no <script>, no on*= handler, no javascript: link, nothing from another site
//    (the gate is this build: it throws). A design with script is redrawn by an agent as a module after review.
//  - d, "the family", is the live home page and stays the default.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sizeOf } from './tiers.mjs';
import { placeShort } from './cards.mjs';

const ID = /^[a-z0-9][a-z0-9-]{0,29}$/;
const DEFAULT = { id: 'd', name: 'The family', maker: 'design.4.fringe@PrompTugal.dinis and the team', tool: 'Claude Code', tagline: 'The current home page: the PrompTugal.news family look, refined. The default.', status: 'default', render: null };

export async function loadDesigns(root) {
  const out = [DEFAULT];
  const dir = join(root, 'admin/build/designs');
  if (existsSync(dir)) for (const f of readdirSync(dir).filter((x) => /^[a-z0-9][a-z0-9-]*\.mjs$/.test(x)).sort()) {
    const m = await import(pathToFileURL(join(dir, f)).href);
    const meta = m.meta || m.design || {};   // the designs written first export `design` or `meta`; `why` is the tagline
    if (meta.id !== f.replace(/\.mjs$/, '') || !ID.test(meta.id)) throw new Error(`designs/${f}: meta.id must equal the file name (a-z, 0-9, -)`);
    if (meta.id === 'd') throw new Error('designs/d.mjs: d is the live home page and is built by the site itself');
    if (typeof m.render !== 'function') throw new Error(`designs/${f}: export render(ctx)`);
    out.push({ tagline: meta.why || '', status: 'draft', tool: '', maker: '', ...meta, render: m.render, css: m.css || '' });
  }
  // designs from anyone: designs/<slug>/design.json + index.html, HTML and CSS only
  const cdir = join(root, 'designs');
  if (existsSync(cdir)) for (const slug of readdirSync(cdir).sort()) {
    const d = join(cdir, slug);
    if (!statSync(d).isDirectory()) continue;
    if (!ID.test(slug)) throw new Error(`designs/${slug}: the folder name must be a-z, 0-9, -`);
    if (out.some((x) => x.id === slug)) throw new Error(`designs/${slug}: the id is taken`);
    const files = readdirSync(d);
    const jf = files.includes('design.json') ? JSON.parse(readFileSync(join(d, 'design.json'), 'utf8')) : {};
    if (!files.includes('index.html')) throw new Error(`designs/${slug}: needs an index.html`);
    for (const f of files) {
      if (!/\.(html|css|json)$/.test(f)) throw new Error(`designs/${slug}/${f}: only .html, .css and .json (no binaries, no script files)`);
      const t = readFileSync(join(d, f), 'utf8');
      if (/<script|\son[a-z]+\s*=|javascript:|<iframe|<object|<embed|<base\b/i.test(t) && f.endsWith('.html')) throw new Error(`designs/${slug}/${f}: no <script>, event handler, javascript:, iframe, object, embed or base: it runs on our origin`);
      if (/https?:\/\/(?!(?:fringe\.promptugal\.news|lisbontechfringe\.com)\b)[^\s"')>]+/i.test(t) && /\.(css|html)$/.test(f) && /(src|href)\s*=\s*["']https?:|url\(\s*["']?https?:|@import/i.test(t)) throw new Error(`designs/${slug}/${f}: nothing loaded from another site (links in text are fine; src, url() and @import are not)`);
    }
    out.push({ id: slug, name: jf.name || slug, maker: jf.maker || '', tool: jf.tool || '', tagline: jf.about || '', status: jf.status || 'community', render: null, dir: d, community: true });
  }
  return out;
}

const CSS = `.dpill{position:fixed;right:12px;bottom:12px;z-index:50;font:14px/1.3 system-ui,sans-serif}.dpill summary{list-style:none;cursor:pointer;background:var(--ink,#121317);color:var(--paper,#f6f3ec);border-radius:99px;padding:10px 16px;min-height:44px;display:flex;align-items:center;box-shadow:0 2px 10px #0004}
.dpill summary::-webkit-details-marker{display:none}.dpill .pn{position:absolute;right:0;bottom:54px;width:min(320px,86vw);background:var(--paper,#f6f3ec);color:var(--ink,#121317);border:1px solid var(--rule,#d8d4cb);border-radius:10px;padding:10px;box-shadow:0 4px 18px #0004}
.dpill a{display:block;padding:8px;border-radius:6px;color:inherit;text-decoration:none;min-height:40px}.dpill a[aria-current]{font-weight:700;background:var(--rule-2,#ece8df)}.dpill button{font:inherit;width:100%;margin-top:6px;padding:10px;border-radius:6px;border:1px solid var(--ink,#121317);background:transparent;color:inherit;cursor:pointer;min-height:44px}
@media (max-width:600px){.dpill summary .t{display:none}.dpill summary{width:44px;height:44px;padding:0;justify-content:center}}
.dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:14px;padding:0;list-style:none}.dg li{margin:0}.dc{border:1px solid var(--rule,#d8d4cb);border-radius:10px;padding:12px;background:var(--card,#fff);height:100%}
.dc h3{margin:.2em 0}.dc .shots{display:flex;gap:8px;align-items:flex-start}.dc img{border:1px solid var(--rule,#d8d4cb);border-radius:6px;background:#eee;max-width:100%;height:auto}.dc .ph{width:30%}.dc .dk{width:68%}.chk td,.chk th{padding:4px 8px;vertical-align:top;text-align:left;border-bottom:1px solid var(--rule,#d8d4cb)}.chk th:first-child,.chk td:first-child{white-space:nowrap}`;

// the switcher: on every design and the home page. Links go to /?design=<id> (the home page swaps itself), so a share link keeps it.
export function pill(designs, current, esc) {
  return `<details class="dpill" id="dpill"><summary aria-label="Design: ${esc(current)}"><span aria-hidden="true">◧</span><span class="t">&nbsp;Design ${esc(current)}</span></summary><div class="pn"><strong>Try another design</strong>` +
    designs.map((d) => `<a href="${d.id === 'd' ? '/' : '/?design=' + esc(d.id)}"${d.id === current ? ' aria-current="true"' : ''}>${esc(d.id.toUpperCase())}: ${esc(d.name)}</a>`).join('') +
    `<button type="button" id="dvote" data-design="${esc(current)}">I prefer this one</button><span class="muted" id="dvote-s" aria-live="polite" style="display:block;margin-top:4px;font-size:.85em"></span><a href="/designs/">About the design lab, and send a design</a></div></details>` +
    `<script>(function(){var b=document.getElementById('dvote');if(!b)return;var K='fringe.vote',s=document.getElementById('dvote-s');try{if(localStorage.getItem(K)===b.dataset.design)s.textContent='Your vote is on this design.'}catch(e){}
b.onclick=function(){var o=window.fringeObs;if(!o||!o.vote){s.textContent='Votes are off while page counting is paused or blocked.';return}o.vote(b.dataset.design).then(function(ok){if(ok){try{localStorage.setItem(K,b.dataset.design)}catch(e){}s.textContent='Counted: you prefer '+b.dataset.design.toUpperCase()+'. Thank you.'}else s.textContent='Could not send the vote just now.'})}})();</script>`;
}
const SWITCH = `<script>(function(){var d=new URLSearchParams(location.search).get('design');if(!d||d==='d'||!/^[a-z0-9-]{1,30}$/.test(d))return;fetch('/designs/'+d+'/',{cache:'no-cache'}).then(function(r){return r.ok?r.text():Promise.reject()}).then(function(h){document.open();document.write(h);document.close()}).catch(function(){})})();</script>`;

const CHECKS = [
  ['L1', 'No lab chrome: the only design control is the site\'s own Design pill.'],
  ['L2', 'Nothing from another site: no font, image, script or style loaded from a host that is not ours.'],
  ['L3', 'The family\'s colours and type (the tokens in admin/build/tokens.css); dark mode works. A design may add accents, never leave the family.'],
  ['L4', 'The wordmark is the site\'s own, whole, and at least 240 px wide where it appears.'],
  ['L5', 'Every number comes from the data (events.json, activity.json, swarm.json). Nothing typed.'],
  ['L6', 'What is on now (or next) is within the first two phone screens.'],
  ['L7', 'No sideways scroll at 390 px.'],
  ['L8', 'Anything that moves pauses on hover and focus and stops under prefers-reduced-motion.'],
  ['L9', 'Every image has alt text; an AI-made image says so.'],
  ['L10', 'Tap targets are at least 44 px; text at least 16 px on a phone.'],
  ['L11', 'The independence line is on every design and the site never uses Web Summit\'s name or logo as its brand.'],
  ['L12', 'Every event links to its own page (/e/<id>/) and to its source; cancelled and moved events say so.'],
  ['L13', 'No em-dashes; plain words; the gate (the build) is green.'],
  ['L14', 'Credit: the maker and the tool are named in the design\'s meta, and shown in the gallery.'],
];

export function labPage(designs, { esc, SITE, REPO }) {
  const card = (d) => `<li class="dc" id="d-${esc(d.id)}"><h3>${esc(d.id.toUpperCase())}: ${esc(d.name)}</h3><p class="muted">${esc(d.status)} · by ${esc(d.maker || 'unknown')}${d.tool ? ' with ' + esc(d.tool) : ''}</p><p>${esc(d.tagline)}</p>
<div class="shots"><img class="ph" data-pic="/assets/designs/${esc(d.id)}-phone.png" alt="${esc(d.name)} on a phone" loading="lazy" width="390" height="844" onerror="this.style.visibility='hidden'"><img class="dk" data-pic="/assets/designs/${esc(d.id)}-desktop.png" alt="${esc(d.name)} on a desktop" loading="lazy" width="1280" height="900" onerror="this.style.visibility='hidden'"></div>
<p><a class="btn" href="${d.id === 'd' ? '/' : '/?design=' + esc(d.id)}">See it on the real home page</a> <a href="/designs/${esc(d.id)}/">${d.id === 'd' ? '' : 'Stand-alone page'}</a></p></li>`;
  return `<h1>The design lab</h1>
<p>Many designs for one site, side by side, then Dinis picks. Brief 11 (Dinis, 11 November 2026): "we really want to have a mode where we now experiment and share and try multiple designs. And we then even ask the community to do that."</p>
<h2>The designs</h2><p class="muted">Pictures are made in CI from each design's own page, at phone and desktop width. The default stays <strong>D</strong> until a design is picked.</p>
<ul class="dg">${designs.map(card).join('')}</ul>
<h2>Which do you prefer?</h2><p>Open a design on the real home page, press the <strong>Design</strong> button at the bottom right, then <strong>I prefer this one</strong>. It is counted like a page view (the same write-only lane, no name, no cookie; <a href="/traffic/">what is counted</a>), one preferred design per device, and you can change it.</p>
<h2>The brief</h2><dl>
<dt><strong>What the site is for</strong></dt><dd>An independent guide to the alternative, community and side events around Web Summit Lisbon this week: what is on now and next, where, when, how to join, and what the storm moved. It is independent of Web Summit and says so on every page.</dd>
<dt><strong>Who reads it</strong></dt><dd>People already in Lisbon, on a phone, between sessions, deciding where to be in the next hour; and people planning tomorrow on a laptop. The organisers of side events, who want to be found. The team and its agents, who want to see how it is made.</dd>
<dt><strong>The data on offer</strong></dt><dd><a href="/api/v1/events.json">/api/v1/events.json</a> (events, each with source and read time), <a href="/api/v1/activity.json">/api/v1/activity.json</a> (commits and deploys, live), <a href="/api/v1/swarm.json">/api/v1/swarm.json</a> (who is online), <a href="/api/v1/graph.json">/api/v1/graph.json</a>, <a href="/api/v1/communities.json">/api/v1/communities.json</a>, and <a href="/llms.txt">/llms.txt</a>. Every number on a design comes from these.</dd>
<dt><strong>The family look</strong></dt><dd>PrompTugal.news's brand: paper, ink, the red and the green, the type and tiles in <a href="${REPO}/blob/dev/admin/build/tokens.css">admin/build/tokens.css</a>. A design may reinterpret layout, rhythm and emphasis; it stays recognisably a PrompTugal.news site.</dd></dl>
<h2>Checks every design must pass</h2><p class="muted">Adapted from pt.news's D1 to D14 (board/spec-home-page-designs.md). usability.1 scores each design against them.</p>
<table class="chk"><tbody>${CHECKS.map(([n, t]) => `<tr><td><strong>${n}</strong></td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>
<h2>Send a design</h2><p>Anyone can. Two ways (work/36):</p><ol>
<li><strong>A pull request</strong> adding <code>designs/&lt;your-slug&gt;/</code> to <a href="${REPO}">the repository</a>, with <code>design.json</code> (<code>{"name", "maker", "tool", "about"}</code>) and <code>index.html</code> (plus <code>.css</code> files). HTML and CSS only: your page runs on our origin, so no script, no event handlers, nothing loaded from another site, no images in the repository (draw with CSS or SVG in the HTML; pictures of your design are made in CI). It reads our public API only if a design agent redraws it as a module, so write the markup with real events in mind. The build checks all this and fails with a clear message.</li>
<li><strong>A link</strong> to a hosted mock (any tool), sent to the team with your name if you want it credited. An agent redraws it on the real data as <code>admin/build/designs/&lt;id&gt;.mjs</code>; you are named as its maker.</li></ol>
<p>Agents add a module: copy <a href="${REPO}/blob/dev/admin/build/designs/_stub.mjs">admin/build/designs/_stub.mjs</a>, set <code>meta.id</code> to the file name, and fill <code>render(ctx)</code> (see <a href="${REPO}/blob/dev/admin/build/designs/README.md">the README</a>).</p>
<p class="muted">The list as data: <a href="/designs/index.json">/designs/index.json</a>.</p>
<script>document.querySelectorAll('img[data-pic]').forEach(function(i){i.src=i.dataset.pic})</script>`;
}

export async function buildDesigns({ root, out, designs, ctx, page, esc, SITE, REPO }) {
  const css = CSS;
  const ids = designs.map((d) => d.id);
  const info = [];
  for (const d of designs) {
    const dirOut = join(out, 'designs', d.id); mkdirSync(dirOut, { recursive: true });
    if (d.id === 'd') { info.push({ id: d.id, name: d.name, maker: d.maker, tool: d.tool, status: d.status, url: '/', shoot: '/' }); continue; }
    let html;
    if (d.render) {
      let r = (await d.render({ ...ctx, at: ctx.now, builtAt: ctx.now.toISOString(), sizeOf, placeShort, esc })) || {};
      if (typeof r === 'string') r = { body: r };
      r = { ...r, css: (d.css || '') + (r.css || '') };
      const head = `<meta name="robots" content="noindex"><meta name="variant" content="${esc(d.id)}"><link rel="canonical" href="${esc(SITE)}">`;
      html = page(`${d.name}: Lisbon Tech Fringe (design ${d.id.toUpperCase()})`, `<style>${css}${r.css || ''}</style>${r.body || ''}${r.script ? `<script>${r.script}</script>` : ''}${pill(designs, d.id, esc)}`, d.tagline || 'A design of the Lisbon Tech Fringe home page.', head + (r.head || ''), '/designs/');
      writeFileSync(join(dirOut, 'index.html'), html);
    } else if (d.community) {
      for (const f of readdirSync(d.dir)) if (f !== 'design.json') writeFileSync(join(dirOut, f), readFileSync(join(d.dir, f), 'utf8'));
      const idx = join(dirOut, 'index.html');
      let h = readFileSync(idx, 'utf8');
      h = h.replace('</head>', `<meta name="robots" content="noindex"><meta name="variant" content="${esc(d.id)}"><style>${css}</style></head>`).replace('</body>', pill(designs, d.id, esc) + '</body>');
      writeFileSync(idx, h);
    }
    info.push({ id: d.id, name: d.name, maker: d.maker, tool: d.tool, status: d.status, url: `/?design=${d.id}`, shoot: `/designs/${d.id}/` });
  }
  mkdirSync(join(out, 'designs'), { recursive: true });
  writeFileSync(join(out, 'designs', 'index.html'), page('The design lab: Lisbon Tech Fringe', `<style>${css}</style>` + labPage(designs, { esc, SITE, REPO }) + pill(designs, 'd', esc), 'Many designs of Lisbon Tech Fringe side by side: the brief, the gallery, the checks, and how to send a design.', '', '/designs/'));
  writeFileSync(join(out, 'designs', 'index.json'), JSON.stringify({ about: 'The design lab (work/35): every design, its maker, and the stand-alone page used for its pictures.', default: 'd', designs: info }, null, 1) + '\n');
  // the real home page: the switcher script first in <head>, the pill before </body>
  const hp = join(out, 'index.html');
  let h = readFileSync(hp, 'utf8');
  h = h.replace('</head>', `${SWITCH}<style>${css}</style></head>`).replace('</body>', pill(designs, 'd', esc) + '</body>');
  writeFileSync(hp, h);
  return info;
}
