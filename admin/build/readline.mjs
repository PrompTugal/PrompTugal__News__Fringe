// "Status last checked ..." lines, with the date computed from read_at (design.1.fringe@PrompTugal.dinis, 12 November, advice 0652).
// Never says "today": a page built on Thursday must not call Wednesday's reads today. Times are UTC (Lisbon is on UTC in November).
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const day = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z'); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
const hm = (iso) => String(iso).slice(11, 16);

// reads: ISO timestamps. One read, a range on one day, or a range across days.
export function checkedPhrase(reads) {
  const r = reads.filter(Boolean).map(String).sort();
  if (!r.length) return '';
  const a = r[0], b = r.at(-1);
  if (a === b || hm(a) === hm(b) && a.slice(0, 10) === b.slice(0, 10)) return `${day(a)}, ${hm(a)} UTC`;
  if (a.slice(0, 10) === b.slice(0, 10)) return `${day(a)}, ${hm(a)} to ${hm(b)} UTC`;
  return `${day(a)} ${hm(a)} to ${day(b)} ${hm(b)} UTC`;
}
export const checkedLine = (reads, esc = String) => { const p = checkedPhrase(reads); return p ? `Status last checked ${esc(p)}; check the organiser's page before you go.` : ''; };
