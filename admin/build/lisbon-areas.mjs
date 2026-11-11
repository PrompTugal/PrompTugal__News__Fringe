// Lisbon's neighbourhoods for the maps (design C and the home page's city map; design.3.fringe@PrompTugal.dinis).
// Centres are approximate (lon, lat) of public place names, used only to place marks on a schematic. Not a survey.
export const AREAS = {
  'Parque das Nações': [-9.094, 38.768], 'Moscavide': [-9.103, 38.775], 'Beato': [-9.1105, 38.7226], 'Anjos': [-9.1347, 38.7253], 'Penha de França': [-9.1294, 38.7283],
  'Martim Moniz': [-9.136, 38.7165], 'Castelo / Mouraria': [-9.1335, 38.7139], 'Alfama': [-9.1285, 38.7118], 'Baixa': [-9.1375, 38.7105], 'Bica / Chiado': [-9.1435, 38.7096], 'Bairro Alto': [-9.1455, 38.7133],
  'Cais do Sodré': [-9.1448, 38.7060], 'Santos': [-9.153, 38.7075], 'Alcântara': [-9.1779, 38.7036], 'Belém': [-9.193, 38.6967], 'Rato': [-9.1545, 38.7195],
  'Marquês / Avenidas': [-9.1495, 38.7255], 'Saldanha': [-9.1456, 38.7339], 'Picoas': [-9.1485, 38.7310],
};
export const AREAS_LIST = () => Object.keys(AREAS);
const FAR = ['Estoril', 'Sintra', 'Cascais', 'Santarém', 'Covilhã', 'Mértola'];
export const RULES = [
  [/parque das na[cç][oõ]es|alameda dos oceanos|cais das naus|dom jo[aã]o ii\b|meo arena|bojador|oriente\b/i, 'Parque das Nações'], [/moscavide/i, 'Moscavide'],
  [/beato|infante dom henrique|unicorn factory|tv\. grilo/i, 'Beato'], [/ptw palace|palácio ptw|gomes freire|\banjos\b|almirante reis|alm\. reis/i, 'Anjos'],
  [/penha de fran[cç]a|neves ferreira/i, 'Penha de França'], [/martim moniz/i, 'Martim Moniz'], [/castelo|mouraria|tancos/i, 'Castelo / Mouraria'], [/alfama/i, 'Alfama'],
  [/baixa|rua do com[eé]rcio|pra[cç]a do com[eé]rcio/i, 'Baixa'], [/bairro alto/i, 'Bairro Alto'], [/bica|chiado|nova do carvalho/i, 'Bica / Chiado'],
  [/cais do sodr[eé]|24 de julho|dom lu[ií]s i|palmeira|tej[aá] house/i, 'Cais do Sodré'], [/casa do impacto|santos|s[aã]o bento|marqu[eê]s de abrantes/i, 'Santos'],
  [/alc[aâ]ntara|lx factory/i, 'Alcântara'], [/bel[eé]m|maat/i, 'Belém'], [/\brato\b|campo de ourique/i, 'Rato'],
  [/marqu[eê]s de pombal|duque de loul[eé]|avenidas novas|5 de outubro/i, 'Marquês / Avenidas'], [/saldanha|pedro nunes/i, 'Saldanha'], [/picoas|sousa martins/i, 'Picoas'],
];
const FARRE = new RegExp(`\\b(${FAR.join('|')})\\b`, 'i');
export const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// One group per event: a named neighbourhood, Online, Beyond the map (another town), or "Address with guests" when the page does not say.
export function groupOf(e) {
  const p = String(e.place || '');
  if (/^online\b/i.test(p) || e.status === 'online') return 'Online';
  const m = p.match(/\(([^()]+)\)\s*$/);
  const text = (m ? m[1] + ' ' : '') + p;
  const far = text.match(FARRE); if (far) return 'Beyond the map';
  for (const [re, name] of RULES) if (re.test(text)) return name;
  return 'Address with guests';
}


// A researcher's `neighbourhood` field (work/44) wins when it names a known area; else the place text decides. in_lisbon === false means outside Lisbon.
const ALIAS = [[/rato|campo de ourique/i, 'Rato'], [/santos|s[aã]o bento/i, 'Santos'], [/marqu[eê]s|avenidas/i, 'Marquês / Avenidas'], [/bica|chiado/i, 'Bica / Chiado'], [/castelo|mouraria/i, 'Castelo / Mouraria'], [/parque das na/i, 'Parque das Nações'], [/penha/i, 'Penha de França'], [/cais do sodr/i, 'Cais do Sodré'], [/bairro alto/i, 'Bairro Alto']];
export function areaOf(e) {
  if (/^online\b/i.test(String(e.place || '')) || e.status === 'online') return 'Online';
  if (e.in_lisbon === false) return 'Beyond the map';
  const n = String(e.neighbourhood || '').trim();
  if (n) {
    if (AREAS[n]) return n;
    for (const [re, k] of ALIAS) if (re.test(n)) return k;
    for (const k of Object.keys(AREAS)) if (k.toLowerCase() === n.toLowerCase()) return k;
    if (FARRE.test(n)) return 'Beyond the map';
  }
  return groupOf(e);
}
