// D9: the Lisbon Fringe identity (design.4.fringe@PrompTugal.dinis). Type-only wordmark, an azulejo-style pattern
// drawn from scratch (a quatrefoil tile, SVG under 1 KB, nothing borrowed), and the CSS that uses the D8 palette tokens.
// The pattern colour comes from --azulejo-ink / --azulejo-a, so it follows light and dark: it is a CSS mask, not a fixed image.
const TILE = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke="#000" stroke-width="1.4"><circle cx="16" cy="16" r="5"/><path d="M16 4c4 0 4 8 0 8s-4-8 0-8zM16 28c4 0 4-8 0-8s-4 8 0 8zM4 16c0-4 8-4 8 0s-8 4-8 0zM28 16c0 4-8 4-8 0s8-4 8 0z"/><path d="M0 0l4 4M32 0l-4 4M0 32l4-4M32 32l-4-4"/></g></svg>`;
export const AZULEJO_URI = `url("data:image/svg+xml,${encodeURIComponent(TILE)}")`;

export const WORDMARK = `<span class="wm"><span class="wm-a">Lisbon</span> <span class="wm-b">Fringe</span></span>`;

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
`;
