// Event cards (D3, design.3.fringe@PrompTugal.dinis). One card, used on / and as "related" on /e/<id>/.
// Scannable on a phone: a status chip, the time range, the area (or Online), the organiser, and the /e/ link.
// Status is always written out in the chip (never colour alone). Cancelled cards are muted and sink within their hour.
import { eventPath, hasPage, area } from './event-pages.mjs';

export const STATUS = { on: 'On', online: 'Online', moved: 'Moved', cancelled: 'Cancelled', unknown: 'Unknown' };

export const CARD_CSS = `
:root{--on:#0b6e4f;--on-bg:#e3f3ec;--online:#1d5fb4;--online-bg:#e4eefb;--moved:#8a5200;--moved-bg:#fdf0d8;--cancelled:#5d5d5d;--cancelled-bg:#ececec;--unknown:#5d5d5d}
@media (prefers-color-scheme:dark){:root{--on:#7fe0b8;--on-bg:#12342a;--online:#8db8f5;--online-bg:#172a45;--moved:#f2bd62;--moved-bg:#3b2a0c;--cancelled:#a8a8a8;--cancelled-bg:#2a2a2a;--unknown:#a8a8a8}}
.evs{display:grid;gap:10px;margin:8px 0;padding:0;list-style:none}
.ev{position:relative;background:var(--card);border:1px solid var(--line);border-left:5px solid var(--st,var(--line));border-radius:10px;padding:10px 12px 10px;overflow-wrap:anywhere}
.ev:focus-within,.ev:hover{border-color:var(--st,var(--accent))}
.ev-top{display:flex;gap:8px 10px;align-items:center;flex-wrap:wrap;font-size:.9rem}
.ev-time{font-weight:600;font-variant-numeric:tabular-nums}.ev-time small{font-weight:400;color:var(--muted)}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:.78rem;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:2px 9px;border-radius:99px;color:var(--st);background:var(--st-bg);border:1px solid var(--st)}
.chip::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--st)}
.chip.unknown{background:transparent;border-style:dashed}.chip.unknown::before{background:transparent;border:1.5px solid var(--st);width:6px;height:6px}
.chip.cancelled::before{border-radius:1px;transform:rotate(45deg)}.chip.moved::before{border-radius:1px}
.ev-name{font-size:1.06rem;line-height:1.3;margin:6px 0 4px;font-weight:700}
.ev-name a{color:var(--fg);text-decoration:none}.ev-name a::after{content:"";position:absolute;inset:0;border-radius:10px}
.ev-name a:hover,.ev-name a:focus-visible{text-decoration:underline}
.ev-meta{color:var(--muted);font-size:.92rem}.ev-meta b{color:var(--fg);font-weight:600}
.ev-storm{margin-top:6px;font-size:.85rem;color:var(--moved);background:var(--moved-bg);border-radius:6px;padding:4px 8px}
.ev-foot{margin-top:6px;font-size:.82rem;color:var(--muted);position:relative;z-index:1}
.ev-foot a{position:relative;z-index:2}
.ev.st-on{--st:var(--on);--st-bg:var(--on-bg)}.ev.st-online{--st:var(--online);--st-bg:var(--online-bg)}.ev.st-moved{--st:var(--moved);--st-bg:var(--moved-bg)}
.ev.st-cancelled{--st:var(--cancelled);--st-bg:var(--cancelled-bg);background:transparent;border-style:dashed;border-left-style:solid}
.ev.st-cancelled .ev-name a{color:var(--muted);text-decoration:line-through}.ev.st-cancelled .ev-top{color:var(--muted)}
.ev.st-unknown{--st:var(--unknown);--st-bg:transparent}
.chip.on{--st:var(--on);--st-bg:var(--on-bg)}.chip.online{--st:var(--online);--st-bg:var(--online-bg)}.chip.moved{--st:var(--moved);--st-bg:var(--moved-bg)}
.chip.cancelled{--st:var(--cancelled);--st-bg:var(--cancelled-bg)}.chip.unknown{--st:var(--unknown);--st-bg:transparent}
@media (min-width:640px){.evs{grid-template-columns:1fr 1fr}}`;

const hm = (iso) => (/T\d\d:\d\d/.test(String(iso)) ? String(iso).slice(11, 16) : null);
export function timeRange(e) {
  const s = hm(e.start), en = hm(e.end);
  if (!s) return 'time not stated';
  const overnight = e.end && String(e.end).slice(0, 10) !== String(e.start).slice(0, 10);
  return en ? `${s}–${en}${overnight ? ' +1d' : ''}` : `from ${s}`;
}
export function placeShort(e) {
  if (area(e) === 'online') return 'Online';
  const m = String(e.place || '').match(/\(([^()]+)\)\s*$/);   // the area, in the page's own spelling
  if (m) return m[1].split(/[\/,]/)[0].trim();
  const p = String(e.place || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  return p ? (p.length > 38 ? p.slice(0, 36).trimEnd() + '…' : p) : 'Place not stated';
}
const orgShort = (e) => String(e.organiser || '').replace(/\s*\((per|from|on|as)\b[^)]*\)\s*/gi, ' ').trim() || 'Organiser not named';

// Order for a day: by start hour, then cancelled ones last within that hour, then by start time.
export function sortDay(list) {
  const hour = (e) => String(e.start || e.date).slice(0, 13);
  return [...list].sort((a, b) => hour(a).localeCompare(hour(b)) || (a.status === 'cancelled') - (b.status === 'cancelled') || String(a.start).localeCompare(String(b.start)));
}

// deps: { esc, linkify }. opts.why: a short extra line (related events).
export function eventCard(e, { esc }, opts = {}) {
  const st = STATUS[e.status] ? e.status : 'unknown';
  const href = hasPage(e) ? eventPath(e) : e.url;
  const note = String(e.storm_note || '').trim();
  const cut = note.length > 110 ? note.slice(0, 110).replace(/\s+\S*$/, '') + '…' : note;
  const storm = e.storm_moved && note && !/^not stated/i.test(note) ? `<div class="ev-storm">Storm: ${esc(cut)}</div>` : '';
  return `<li class="ev st-${st}"><div class="ev-top"><span class="chip ${st}">${STATUS[st]}</span><span class="ev-time">${esc(timeRange(e))} <small>Lisbon</small></span></div>
<h3 class="ev-name"><a href="${esc(href)}">${esc(e.name)}</a></h3>
<div class="ev-meta"><b>${esc(placeShort(e))}</b> · ${esc(orgShort(e))}${opts.why ? ` · ${esc(opts.why)}` : ''}</div>${storm}
<div class="ev-foot"><a href="${esc(e.url)}">Organiser's page</a>${opts.date ? ` · ${esc(opts.date)}` : ''}</div></li>`;
}
export const cardList = (items) => `<ul class="evs">${items.join('')}</ul>`;
