// The world map for /traffic/ (work/21, observability.fringe@PrompTugal.dinis, 11 November 2026, at Dinis Cruz's word:
// "can you do the map?"). Drawn at build time as inline SVG from data/geo/countries-110m.json (world-atlas 2.0.2, ISC,
// from Natural Earth, public domain), so a reader's browser calls no map server. Countries are shaded by views; towns
// with enough views (the drain's map.towns, CITY_MIN or more) are dots. Equirectangular, 80°N to 58°S.
import { readFileSync } from 'node:fs';

const ALIAS = { 'United States': 'United States of America', 'The Netherlands': 'Netherlands', 'Czech Republic': 'Czechia',
  'Russian Federation': 'Russia', 'Republic of Korea': 'South Korea', 'Korea, Republic of': 'South Korea', 'Viet Nam': 'Vietnam',
  'Bosnia and Herzegovina': 'Bosnia and Herz.', 'Dominican Republic': 'Dominican Rep.', 'Ivory Coast': "Côte d'Ivoire" };
const W = 1000, TOP = 80, BOT = -58, K = W / 360, H = Math.round((TOP - BOT) * K);
const px = (lon) => +((lon + 180) * K).toFixed(1), py = (lat) => +((TOP - lat) * K).toFixed(1);

let shapes = null;
function load(file) {
  if (shapes) return shapes;
  const topo = JSON.parse(readFileSync(file, 'utf8'));
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  const arcs = topo.arcs.map((a) => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
  const arc = (i) => (i < 0 ? arcs[~i].slice().reverse() : arcs[i]);
  const ring = (ids) => ids.flatMap((i, n) => (n ? arc(i).slice(1) : arc(i)));
  // a ring that crosses the date line (eastern Russia, Fiji) is drawn whole east of 180° and clipped by the frame
  const fix = (pts) => (pts.some(([lo]) => lo > 150) && pts.some(([lo]) => lo < -150) ? pts.map(([lo, la]) => [lo < 0 ? lo + 360 : lo, la]) : pts);
  const d = (rings) => rings.map((r) => 'M' + fix(ring(r)).map(([lo, la]) => `${px(lo)},${py(Math.max(BOT - 2, la))}`).join('L') + 'Z').join('');
  shapes = topo.objects.countries.geometries.filter((g) => g.properties.name !== 'Antarctica').map((g) => ({ name: g.properties.name,
    d: g.type === 'Polygon' ? d(g.arcs) : g.type === 'MultiPolygon' ? g.arcs.map(d).join('') : '' })).filter((s) => s.d);
  return shapes;
}

// colours come from the page's CSS variables, so light and dark both work
export function worldSvg(file, byCountry = [], towns = [], esc = String) {
  const views = new Map(byCountry.map(([c, n]) => [ALIAS[c] || c, n]));
  const max = Math.max(1, ...views.values()), tmax = Math.max(1, ...towns.map((t) => t.views));
  const shade = (n) => (n ? (0.25 + 0.75 * Math.log(1 + n) / Math.log(1 + max)).toFixed(2) : 0);
  const land = load(file).map((s) => { const n = views.get(s.name) || 0;
    return `<path d="${s.d}" fill="${n ? 'var(--accent)' : 'var(--line)'}"${n ? ` fill-opacity="${shade(n)}"` : ''} stroke="var(--bg)" stroke-width=".4"><title>${esc(s.name)}${n ? `: ${n} views` : ''}</title></path>`; }).join('');
  const dots = towns.map((t) => `<circle cx="${px(t.lon)}" cy="${py(t.lat)}" r="${(3 + 9 * Math.sqrt(t.views / tmax)).toFixed(1)}" fill="#e0533d" fill-opacity=".8" stroke="var(--bg)" stroke-width="1"><title>${esc(t.name)}: ${t.views} views</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="World map of views by country and town" style="width:100%;height:auto;display:block;overflow:hidden">${land}${dots}</svg>`;
}
