// My day (D29, design.2.fringe@PrompTugal.dinis): the /my/ page shell and its styles. The behaviour is /myday.js (admin/build/myday.js),
// which also puts a star on every event card and page. The picks stay in the reader's browser; nothing is sent to us.
export const MYDAY_CSS = `
.my h1{margin-bottom:.2em}.my-lead{color:var(--ink-2,#3f424a);margin:.2em 0 1em;max-width:60ch}
.my-sum{font:400 .95rem var(--mono,ui-monospace,Menlo,monospace);margin:.4em 0 1em}.my-red{color:var(--red,#c52830)}
.my-day{font:600 1.2rem/1.2 var(--serif,Georgia,serif);margin:1.4em 0 .5em;padding-top:.5em;border-top:1px solid var(--ink,#121317)}.my-cnt{font:400 .85rem var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64)}
.my-flow{list-style:none;margin:0;padding:0;position:relative}.my-flow::before{content:"";position:absolute;left:61px;top:8px;bottom:8px;width:2px;background:var(--green,#006600);opacity:.5}
.my-flow>li{display:grid;grid-template-columns:50px 24px minmax(0,1fr);column-gap:6px;position:relative;padding:6px 0}
.my-t{font:600 .95rem var(--mono,ui-monospace,Menlo,monospace);text-align:right;padding-top:2px}
.my-dot{width:12px;height:12px;border-radius:50%;margin:6px 0 0 6px;background:var(--green,#006600);border:2px solid var(--green,#006600);position:relative;z-index:1;box-sizing:border-box}
.my-dot-g{background:var(--paper,#f6f3ec);border-style:dashed;border-color:var(--ink-3,#595c64)}
.my-c{min-width:0}.my-n{font:600 1.05rem/1.3 var(--serif,Georgia,serif);color:var(--ink,#121317);overflow-wrap:anywhere}
.my-m{font:400 .875rem/1.5 var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64);margin-top:2px;overflow-wrap:anywhere}
.my-chip{display:inline-block;font:600 .8125rem/1.4 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.06em;text-transform:uppercase;padding:0 6px;border:1px solid currentColor;border-radius:2px;color:var(--green,#006600)}
.st-online .my-chip{color:var(--cobalt,#1f4fa8)}.st-moved .my-chip{color:var(--warn,#8a5200)}.st-cancelled .my-chip{color:var(--red,#c52830)}.st-cancelled .my-n{text-decoration:line-through}.st-unknown .my-chip{color:var(--ink-3,#595c64);border-style:dashed}
.my-clash .my-c{background:var(--red-soft,#f8e4df);border-left:4px solid var(--red,#c52830);padding:4px 10px 6px}.my-clash .my-dot{background:var(--red,#c52830);border-color:var(--red,#c52830)}
.my-warn{margin:6px 0 2px;font-size:.95rem;color:var(--red,#c52830)}
.my-act{margin-top:6px;font-size:.95rem}
.my-gap .my-gapl{font:400 .9rem var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-3,#595c64);padding-top:2px}
.my-sug{margin-top:4px;font-size:.95rem;display:flex;flex-direction:column;gap:4px}
.my-btn{font:inherit;font-weight:600;min-height:44px;padding:0 16px;border-radius:8px;border:2px solid var(--green,#006600);background:transparent;color:var(--green,#006600);cursor:pointer}.my-btn:hover,.my-btn:focus-visible{background:var(--green,#006600);color:var(--paper,#f6f3ec)}
.my-primary{background:var(--green,#006600);color:var(--paper,#f6f3ec)}.my-sm{min-height:44px;padding:0 12px;font-size:.9rem}
.my-banner{background:var(--green-soft,#e2eedf);border:1px solid var(--green,#006600);border-radius:8px;padding:6px 14px;margin:0 0 14px}
.my-share{margin-top:1.8em;padding-top:.6em;border-top:1px solid var(--ink,#121317)}.my-share h2{font:600 1.2rem var(--serif,Georgia,serif);margin:.4em 0}
.my-link input{width:100%;font:400 .85rem var(--mono,ui-monospace,Menlo,monospace);padding:10px;border:1px solid var(--rule-2,#9d9580);background:var(--panel,#fffdf8);color:var(--ink,#121317);border-radius:6px}
.my-empty{padding:18px;border:1px dashed var(--rule-2,#9d9580);border-radius:8px}
@media (min-width:700px){.my-flow::before{left:67px}.my-flow>li{grid-template-columns:56px 24px minmax(0,1fr)}}`;

export const myDayBody = () => `<section class="my"><h1>My day</h1>
<p class="my-lead">The events you starred, as a timeline, with clashes and gaps. It lives in this browser: no account, nothing is sent to us. Share it as a link to move it to your phone.</p>
<div id="myday" aria-live="polite"><p class="muted">Loading your day (this page needs JavaScript to read what you picked)&hellip;</p></div>
<noscript><p>My day needs JavaScript, because your picks are kept in your browser. Everything else on this site works without it.</p></noscript></section>`;
