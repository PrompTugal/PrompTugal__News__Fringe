// /storm/ (D30, design.4.fringe@PrompTugal.dinis): the storm as its own designed section. Nothing is copied by hand: the live block is
// filled in the reader's browser from the storm site's data API v1 by /storm.js (work/07). Without JavaScript the official links stay.
export const STORM_CSS = `
.storm-head{margin:var(--s4) 0 var(--s5);padding:var(--s4) 0 var(--s4);border-top:6px solid var(--red);border-bottom:1px solid var(--hair)}
.storm-head .k{font:500 12px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--red);margin:0 0 var(--s2)}
.storm-head h1{margin:0 0 var(--s2);font-size:var(--fs-h1);max-width:none}
.storm-head p{margin:0;color:var(--ink-2);max-width:40rem}
.storm-official{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:var(--s2);margin:var(--s4) 0}
.storm-official a{display:block;background:var(--panel);border:1px solid var(--hair);border-top:3px solid var(--ink);border-radius:var(--radius);padding:var(--s2) var(--s3);text-decoration:none;color:var(--ink)}
.storm-official a:hover{border-top-color:var(--red)}
.storm-official b{display:block;font:600 var(--fs-hed)/1.2 var(--serif)}.storm-official span{font:400 11px/1.3 var(--mono);color:var(--ink-3)}
#storm-live{margin:var(--s4) 0}#storm-live h3{font:500 12px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--green);margin:var(--s5) 0 var(--s2);padding-top:var(--s3);border-top:1px solid var(--hair)}
#storm-live>p:first-child{font:600 var(--fs-lead-hed)/1.2 var(--serif);letter-spacing:-.01em;margin:0 0 var(--s3)}
#storm-live ul{list-style:none;padding:0;margin:0}#storm-live li{padding:var(--s2) 0;border-bottom:1px solid var(--hair)}
#storm-live .tag{font:600 11px/1 var(--mono);letter-spacing:.08em;margin:0 var(--s2) 0 0;padding:3px 7px;border-radius:var(--radius)}
.storm-note{font-size:var(--fs-ui);color:var(--ink-3);margin:var(--s5) 0}
`;
export function stormBody(esc) {
  return `<section class="storm-head"><p class="k">The storm · Wednesday 11 November</p>
<h1>Storm Charles, and what it did to the week</h1>
<p>What is warned, what moved and how to get around, read live from the storm site's data. This site is not a warning service: for anything that matters, go to the official sources first.</p></section>
<div class="storm-official" aria-label="Official sources">
<a href="https://www.ipma.pt/"><b>IPMA</b><span>weather warnings</span></a>
<a href="https://www.prociv.gov.pt/"><b>ANEPC</b><span>civil protection</span></a>
<a href="https://storm-charles.promptugal.news"><b>Storm site</b><span>decisions, sources, data</span></a></div>
<div id="storm-live"><p class="muted">Loading the storm site's latest. If this stays empty, the three links above are the source.</p></div>
<script src="/storm.js" defer></script>
<p class="storm-note">Everything above is read in your browser from <a href="https://storm-charles.promptugal.news/api/v1/">the storm site's data API</a>, with its own source and the time it was read. Nothing here is copied by hand. Events that moved because of the storm are marked on <a href="/programme/">the programme</a>.</p>`;
}
