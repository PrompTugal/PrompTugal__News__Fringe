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

// Two facts, each with its time (advice 0852, the lead 09:2x): the times seen in the organisers' own calendar feeds (seen_at, from
// researcher.2's iCal pass), and when cancellations and notes were last read (read_at). "today" only when it is the build's day.
const when = (iso, now) => (String(iso).slice(0, 10) === new Date(now).toISOString().slice(0, 10) ? 'today' : day(iso));
export function statusLine(events, now = new Date(), esc = String) {
  const reads = events.map((e) => e.read_at).filter(Boolean);
  const seen = events.filter((e) => e.seen_at);
  if (!reads.length) return '';
  const tail = `cancellations and notes last checked ${checkedPhrase(reads)}; check the organiser's page before you go.`;
  if (!seen.length) return esc(`Status last checked ${checkedPhrase(reads)}; check the organiser's page before you go.`);
  const latest = seen.map((e) => e.seen_at).sort().at(-1);
  return esc(`Times confirmed in the organisers' calendar feeds ${when(latest, now)} at ${hm(latest)} UTC (${seen.length} of ${events.length} events seen); ${tail}`);
}
export function eventStatusLine(e, now = new Date(), esc = String) {
  if (!e.read_at) return '';
  const tail = `cancellation and notes last checked ${checkedPhrase([e.read_at])}; check the organiser's page before you go.`;
  if (!e.seen_at) return esc(`Status last checked ${checkedPhrase([e.read_at])}; check the organiser's page before you go.`);
  return esc(`Time confirmed in the organiser's calendar feed ${when(e.seen_at, now)} at ${hm(e.seen_at)} UTC; ${tail}`);
}
