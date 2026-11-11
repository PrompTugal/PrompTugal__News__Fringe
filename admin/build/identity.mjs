// D9: the Lisbon Tech Week identity (design.4.fringe@PrompTugal.dinis). Type-only wordmark, an azulejo-style pattern
// drawn from scratch (a quatrefoil tile, SVG under 1 KB, nothing borrowed), and the CSS that uses the D8 palette tokens.
// The pattern colour comes from --azulejo-ink / --azulejo-a, so it follows light and dark: it is a CSS mask, not a fixed image.
const TILE = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke="#000" stroke-width="1.4"><circle cx="16" cy="16" r="5"/><path d="M16 4c4 0 4 8 0 8s-4-8 0-8zM16 28c4 0 4-8 0-8s-4 8 0 8zM4 16c0-4 8-4 8 0s-8 4-8 0zM28 16c0 4-8 4-8 0s8-4 8 0z"/><path d="M0 0l4 4M32 0l-4 4M0 32l4-4M32 32l-4-4"/></g></svg>`;
export const AZULEJO_URI = `url("data:image/svg+xml,${encodeURIComponent(TILE)}")`;

export const WORDMARK = `<span class="wm"><span class="wm-a">Lisbon</span> <span class="wm-b">Tech Week</span></span>`;

export const IDENTITY_CSS = `
.azulejo{background:rgba(var(--azulejo-ink),var(--azulejo-a));-webkit-mask:${AZULEJO_URI} 0 0/32px 32px;mask:${AZULEJO_URI} 0 0/32px 32px}
.tiles{height:var(--s5);background:var(--paper-2);position:relative;border-bottom:1px solid var(--rule-2)}.tiles::before{content:"";position:absolute;inset:0}.tiles::before{background:rgba(var(--azulejo-ink),calc(var(--azulejo-a) * 2.2));-webkit-mask:${AZULEJO_URI} 0 0/24px 24px;mask:${AZULEJO_URI} 0 0/24px 24px}
.tiles::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,var(--tram) 0 25%,var(--tile) 25% 50%,var(--terracotta) 50% 75%,var(--river) 75%)}
.wm{font:700 var(--fs-hed)/1 var(--serif);letter-spacing:-.01em;color:var(--ink)}.wm-b{color:var(--brand);font-style:italic}
.brand a:hover .wm-b{color:var(--terracotta)}
.nav a[aria-current="page"]{border-bottom-color:var(--tram);box-shadow:inset 0 -1px 0 var(--ink)}
.festival{position:relative;margin:0 calc(var(--gutter) * -1);padding:var(--s5) var(--gutter) var(--s4);background:linear-gradient(180deg,var(--tram-soft),var(--paper));border-bottom:1px solid var(--hair)}
.festival::before{content:"";position:absolute;inset:0;pointer-events:none;background:rgba(var(--azulejo-ink),calc(var(--azulejo-a) * .8));-webkit-mask:${AZULEJO_URI} 0 0/40px 40px;mask:${AZULEJO_URI} 0 0/40px 40px}
.festival>*{position:relative}.festival h1{font-size:var(--fs-nameplate);line-height:1.02;margin:0 0 var(--s3);letter-spacing:-.02em;max-width:14em}.festival .tag-line{font-size:var(--fs-dek);color:var(--ink-2)}.festival h1 em{color:var(--brand)}
.kicker{display:inline-block;background:var(--tram);color:var(--on-tram);font:700 var(--fs-label)/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;padding:var(--s1) var(--s2);border-radius:var(--radius);margin-bottom:var(--s3)}

/* D21 (design.1): compact header; wordmark, nav on one line; events come first */
.ptbar{font-size:12px}.ptbar a{padding:3px var(--gutter);font-weight:500}
header nav{display:flex;align-items:center;gap:var(--s3);padding:0 var(--gutter)!important}
.brand{flex:none;padding:var(--s2) 0!important}.wm{font-size:22px!important}
.nav{flex:1;flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;margin:0!important;-webkit-overflow-scrolling:touch}.nav::-webkit-scrollbar{display:none}
.nav a{white-space:nowrap;padding:var(--s3) var(--s2) calc(var(--s3) - 3px)!important;min-height:44px;font-size:14px}
.tiles{height:6px!important}.tiles::after{height:3px!important}
.ind{font-size:12px!important;padding:4px var(--gutter)!important;margin:0!important;border:0!important;border-bottom:1px solid var(--hair)!important;border-radius:0!important;background:var(--paper-2)!important;max-width:none!important}
main{padding-top:0!important}
.festival{padding:var(--s3) var(--gutter) var(--s2)!important}.festival .kicker{display:none}
.festival h1{font-size:24px!important;margin:0 0 2px!important;max-width:none!important}.festival .tag-line{font-size:14px!important;margin:0 0 4px!important}
.hero .count{font-size:14px;margin:0 0 var(--s2)}.hero .btn{display:inline-block;padding:6px 14px;min-height:0;margin:0 0 var(--s2);font-size:14px}
@media(min-width:768px){.wm{font-size:26px!important}}
/* D20: the taste pass. Calm, small, events first. These rules come last and win. */
.wa{font-size:12px;color:var(--ink-3);margin:var(--s1) 0 0}
.festival{margin:var(--s2) calc(var(--gutter) * -1) var(--s1);background:var(--tram-soft);border-bottom:2px solid var(--tram)}
.festival::before,.festival .kicker,.festival .tag-line{display:none}
.festival h1{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.festival .count{font-size:13px;font-weight:600;margin:0;color:var(--ink)}
.festival .btn{display:none}
.hero .card{margin:var(--s2) 0}
.jumps{margin:var(--s1) 0;padding:var(--s1) 0}
.jumps a{min-height:var(--chip-h);height:var(--chip-h);padding:0 var(--s3);font-size:13px;border-width:1px;font-weight:600}
h2{margin-top:1.2em}
`;
