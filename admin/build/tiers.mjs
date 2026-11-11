// Big events and small events (D18, brief 8; design.3.fringe@PrompTugal.dinis).
// Two tiers, both in time order, neither buries the other: majors as a slim strip, community events as a dense list.
// `size` ("major" | "community") comes from data/events.json when the researcher has set it; until then it is derived here.
import { eventPath, hasPage } from './event-pages.mjs';
import { STATUS, timeRange, placeShort, sortDay } from './cards.mjs';

const MAJOR_NAME = /\b(conference|unconference|festival|tech day|awards ceremony|bitcointalks|grand finale|wet summit|primum next)\b/i;
const hours = (e) => { const a = Date.parse(e.start), b = Date.parse(e.end); return a && b ? (b - a) / 36e5 : 0; };
// Derived (hypothesis, not fact): a conference or festival by kind or name, or a long multi-session day that is not a coworking room or a clinic.
export function sizeOf(e) {
  if (e.size === 'major' || e.size === 'community') return e.size;
  if (e.kind === 'conference' || e.kind === 'unconference' || (MAJOR_NAME.test(e.name || '') && !/field trip|\bpost\b/i.test(e.name || ''))) return 'major';
  if (hours(e) >= 8 && hours(e) <= 14 && !/co-?working|clinic|residence/i.test(e.name || '')) return 'major';
  return 'community';
}

export const TIER_CSS = `
.bigs{margin:12px 0 4px}.bigs h2{margin:0 0 6px;padding:0;border:0;font-size:1.05rem}
.bigs-row{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x proximity;margin:0;padding:2px 0 8px;list-style:none;scrollbar-width:thin}
.big{flex:none;width:224px;scroll-snap-align:start;position:relative;background:var(--panel);border:1px solid var(--hair);border-top:4px solid var(--st,var(--brand));border-radius:10px;padding:8px 10px;overflow-wrap:anywhere}
.big .bt{font-size:.78rem;color:var(--ink-3);font-variant-numeric:tabular-nums}.big .bt b{color:var(--ink,var(--fg))}
.big a{display:block;color:var(--ink,var(--fg));text-decoration:none;font-weight:700;line-height:1.25;margin:2px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.big a::after{content:"";position:absolute;inset:0}.big a:focus-visible{text-decoration:underline}
.big .bw{font-size:.82rem;color:var(--ink-3)}
.big.st-on{--st:var(--on)}.big.st-online{--st:var(--online)}.big.st-moved{--st:var(--moved)}.big.st-cancelled{--st:var(--cancelled);opacity:.75}.big.st-cancelled a{text-decoration:line-through}
.dense{list-style:none;margin:6px 0;padding:0;border-top:1px solid var(--hair)}
.row{position:relative;display:grid;grid-template-columns:3.8em 1fr;gap:0 8px;padding:7px 2px;border-bottom:1px solid var(--hair);overflow-wrap:anywhere}
.row .rt{grid-row:span 2;font-variant-numeric:tabular-nums;font-weight:600;font-size:.9rem;color:var(--ink-2,var(--fg));padding-top:1px}
.row a{color:var(--ink,var(--fg));text-decoration:none;font-weight:600;line-height:1.3}.row a::after{content:"";position:absolute;inset:0}.row a:focus-visible,.row a:hover{text-decoration:underline}
.row .rm{font-size:.84rem;color:var(--ink-3)}
.row .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:var(--st);vertical-align:baseline}
.row.st-on{--st:var(--on)}.row.st-online{--st:var(--online)}.row.st-moved{--st:var(--moved)}.row.st-cancelled{--st:var(--cancelled)}.row.st-unknown{--st:var(--unknown)}
.row.st-unknown .dot{background:transparent;border:1.5px solid var(--st)}
.row .stx{font-weight:700;text-transform:uppercase;font-size:.72rem;letter-spacing:.03em;color:var(--st);margin-right:4px}
.row.st-cancelled a{text-decoration:line-through;color:var(--ink-3)}
.row[hidden],.big[hidden]{display:none}`;

const stOf = (e) => (STATUS[e.status] ? e.status : 'unknown');
const startHm = (e) => (/T\d\d:\d\d/.test(String(e.start)) ? String(e.start).slice(11, 16) : '–');
const orgShort = (e) => String(e.organiser || '').replace(/\s*\((per|from|on|as|a)\b[^)]*\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
const href = (e) => (hasPage(e) ? eventPath(e) : e.url);
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayShort = (e) => { const d = new Date(String(e.date) + 'T00:00:00Z'); return `${DAY[d.getUTCDay()]} ${d.getUTCDate()}`; };

export function bigCard(e, { esc }, attrs = '') {
  const st = stOf(e);
  return `<li class="big st-${st}"${attrs}><div class="bt"><b>${esc(dayShort(e))}</b> · ${esc(timeRange(e))} · ${esc(STATUS[st])}</div><a href="${esc(href(e))}">${esc(e.name)}</a><div class="bw">${esc(placeShort(e))}</div></li>`;
}
export function denseRow(e, { esc }, attrs = '', why = '', withDay = false) {
  const st = stOf(e), org = orgShort(e);
  return `<li class="row st-${st}"${attrs}><span class="rt">${withDay ? esc(dayShort(e)) + '<br>' : ''}${esc(startHm(e))}</span><a href="${esc(href(e))}">${esc(e.name)}</a><span class="rm"><span class="dot"></span>${st === 'on' ? '' : `<span class="stx">${esc(STATUS[st])}</span>`}${esc(placeShort(e))}${org ? ' · ' + esc(org) : ''}${why ? ' · ' + esc(why) : ''}</span></li>`;
}
export const bigStrip = (list, deps, title = 'Big events') => list.length
  ? `<section class="bigs" aria-label="${title}"><h2>${title} <span class="muted">(${list.length})</span></h2><ul class="bigs-row">${list.map((e) => bigCard(e, deps)).join('')}</ul></section>` : '';
export const denseList = (list, deps) => (list.length ? `<ul class="dense">${list.map((e) => denseRow(e, deps)).join('')}</ul>` : '');
export const byTime = (list) => sortDay(list);   // by start hour, cancelled last within the hour
export const split = (list) => ({ majors: byTime(list.filter((e) => sizeOf(e) === 'major')), community: byTime(list.filter((e) => sizeOf(e) !== 'major')) });
