// /traffic/ (work/21, observability.fringe@PrompTugal.dinis, 11 November 2026, at Dinis Cruz's word, brief 2: "really
// track all the visits and see the traffic and hopefully see people going and sharing"). Renders data/obs/traffic.json,
// the counts the drain (admin/tools/obs/obs_drain.py) publishes each hour into the public vault and here. Counts only:
// no raw event, IP, tab id or contact detail is in that file or on this page. Small places (under CITY_MIN views) are
// folded into their country by the drain.
import { fileURLToPath } from 'node:url';
import { worldSvg } from './worldmap.mjs';
const GEO = fileURLToPath(new URL('../../data/geo/countries-110m.json', import.meta.url));
const bar = (n, max) => `<span class="tb" style="width:${max ? Math.max(2, Math.round(100 * n / max)) : 0}%"></span>`;

function table(esc, title, rows, head, note = '', col = 'Views') {
  if (!rows?.length) return `<h2>${esc(title)}</h2><p class="muted">Nothing yet.</p>`;
  const max = Math.max(...rows.map((r) => r[1] || 0));
  return `<h2>${esc(title)}</h2>${note ? `<p class="muted">${note}</p>` : ''}<table class="tt"><thead><tr><th>${esc(head)}</th><th>${col}</th><th></th></tr></thead><tbody>` +
    rows.map(([k, n]) => `<tr><td>${esc(k)}</td><td>${n}</td><td class="tbc">${bar(n, max)}</td></tr>`).join('') + '</tbody></table>';
}

export const trafficCss = `.tt{width:100%;border-collapse:collapse;font-size:.92rem;table-layout:fixed}.tt td,.tt th{padding:4px 6px;border-bottom:1px solid var(--line);text-align:left;overflow-wrap:anywhere}
.tt th:nth-child(2),.tt td:nth-child(2){width:4.5em;text-align:right}.tt th:nth-child(3){width:35%}.tbc{width:35%}.tb{display:inline-block;height:10px;background:var(--accent);border-radius:3px}
.kp{display:flex;gap:8px;flex-wrap:wrap}.kp .card{flex:1 1 140px;margin:0}.kp b{display:block;font-size:1.5rem}
.hours{display:flex;align-items:flex-end;gap:2px;height:90px;border-bottom:1px solid var(--line)}.hours span{flex:1;background:var(--accent);min-height:1px;border-radius:2px 2px 0 0}`;

export function trafficBody(t, esc, origin = '') {
  const intro = `<h1>Traffic</h1><p>Who reads Lisbon Tech Fringe, from where, and how its links spread. Counted in the browser by <code>assets/obs/obs.js</code>, sealed to a write-only lane, and drained every hour by observability.fringe@ into counts. <strong>Counts only:</strong> no IP address, no cookie, no tab id and no contact detail is kept on this page or in git.</p>
<p class="muted">Share a link with a tag to see it spread: <code>${origin}/?via=&lt;channel&gt;</code> (letters, digits, <code>.</code> <code>_</code> <code>-</code>). A tag names the link, never the person.</p>`;
  const how = `<h2>What is counted</h2><p class="muted">Each page load sends a <em>view</em>, and a <em>read</em> when the tab is hidden: the page, the referring site (host only), the time to the minute, the site version, a random id that ends with the tab, the screen size class, the browser's language and time zone, a link's <code>?via=</code> tag, the host and path of a link followed to another site, and the country, region and city. To find the place, the browser asks ipapi.co (or ipwho.is), which see the reader's IP address, as any site it calls would; only the place is read from the answer. Do Not Track, Global Privacy Control and <strong>Pause</strong> in the footer turn it all off, the place lookup included. Places with fewer than ${t?.city_min ?? 5} views are shown only as their country.</p>`;
  if (!t) return intro + `<p class="card">The first drain has not run yet: counts appear here after the next hourly drain (at :37 UTC).</p>` + how;
  const tot = t.totals || {};
  const hours = t.by_hour || [];
  const hmax = Math.max(1, ...hours.map((h) => h[1] || 0));
  return intro +
    `<p class="muted">Drained ${esc(t.generated)} UTC from public vault <code>${esc(t.public_vault || '')}</code>. Readers only (declared bots and automation are counted apart: ${tot.bots ?? 0} views).</p>` +
    `<div class="kp"><div class="card"><b>${tot.views ?? 0}</b>views</div><div class="card"><b>${tot.reads ?? 0}</b>reads</div><div class="card"><b>${tot.tabs ?? 0}</b>tabs</div><div class="card"><b>${tot.countries ?? 0}</b>countries</div><div class="card"><b>${tot.shares ?? 0}</b>views from a shared link</div></div>` +
    (hours.length ? `<h2>Views by hour (UTC, last 48)</h2><div class="hours" role="img" aria-label="Views per hour">${hours.map(([h, n]) => `<span title="${esc(h)}: ${n}" style="height:${Math.round(100 * n / hmax)}%"></span>`).join('')}</div>` +
    `<p class="muted">${esc(hours[0][0])} to ${esc(hours.at(-1)[0])}</p>` : '<h2>Views by hour</h2><p class="muted">No reader views yet.</p>') +
    (t.map ? `<h2>Where readers are</h2>${worldSvg(GEO, t.by_country, t.map.towns, esc)}<p class="muted">Countries shaded by views; red dots are towns with ${t.city_min ?? 5} or more views. Hover for numbers.</p>` : '') +
    flowsHtml(t.flows, esc) +
    table(esc, 'Shares: views by ?via= tag', t.by_via, 'Tag', 'Each tag is a link someone shared; its views include the pages read after arriving.') +
    table(esc, 'By page', t.by_page, 'Page') +
    table(esc, 'By country', t.by_country, 'Country') +
    table(esc, 'By city', t.by_city, 'City, country') +
    table(esc, 'By referring site', t.by_referrer, 'Referrer') +
    (t.outbound?.length ? table(esc, 'Links followed to other sites', t.outbound, 'From page → to', 'Clicks on links that leave the site (for example to the storm site): host and path only.', 'Clicks') : '') +
    (t.by_host?.length ? table(esc, 'By address', t.by_host, 'Host', 'fringe.promptugal.news and lisbontechfringe.com are counted together.') : '') +
    (t.agents ? table(esc, "The agents' runs (admin/tools/agent-log.mjs)", t.agents, 'Agent', '', 'Runs') : '') +
    how;
}

// the paths readers take (Dinis, 11 November 2026: "understand the paths that people are going ... the most popular")
function flowsHtml(f, esc) {
  if (!f?.tabs) return '';
  return `<h2>How readers move</h2><p class="muted">${f.tabs} visits (tabs); ${100 - f.bounce_rate}% went past their first page.</p>` +
    table(esc, 'How they arrived', f.arrived, 'First page came from', 'WhatsApp, LinkedIn and most apps send no referrer: a ?via= tag on the link is the only way to see a share.', 'Visits') +
    table(esc, 'Where visits start', f.entry_pages, 'Entry page', '', 'Visits') +
    table(esc, 'The steps readers take', f.steps, 'From → to', 'Each step is one page followed by the next in the same tab.', 'Times') +
    table(esc, 'Where visits end', f.exit_pages, 'Last page', '', 'Visits') +
    table(esc, 'Pages per visit', f.pages_per_tab, 'Pages', '', 'Visits') +
    (f.via_reached?.length ? table(esc, 'Where shared links lead', f.via_reached, 'Tag: page', 'Pages reached by visits that arrived on a tagged link.', 'Visits') : '');
}
