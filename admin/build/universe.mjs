// /universe/: "the Fringe universe", our live events drawn with Silvio's Gravity library (work: gravity.1.fringe@PrompTugal.silvio, team/silvio/gravity/).
// This file only serves the adapter and wraps it in the site's page. Gravity itself is NOT copied here unless a pinned copy is vendored.
// ONE constant decides where gravity.js comes from (Dinis's call: vendor a pinned copy, or load it cross-site):
//   - if assets/vendor/gravity/gravity.js exists, the page uses the vendored copy at /assets/vendor/gravity/gravity.js (served from our own origin);
//   - otherwise it loads the pinned v0.1.0 from web-summit.sgit.ai at run time (cross-site).
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const GRAVITY_CROSS_SITE = 'https://web-summit.sgit.ai/lib/gravity/v0/v0.1/v0.1.0/gravity.js';
// Subresource Integrity (security finding 37): the pinned v0.1.0 file's sha384, computed from the served file at 19:2x UTC on 11 Nov 2026 (same bytes as
// a copy fetched 1.5 h earlier; the server sends access-control-allow-origin: *, so crossorigin="anonymous" works). If Silvio's team ever changes that
// file in place, the browser REFUSES it and the page shows "Gravity did not load": fail closed, by design. Recompute: curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A
export const GRAVITY_INTEGRITY = 'sha384-vjVc69B6PuC78LgClm4VQnjia9Y9TmGuoVDn/NCopGIUDcyVrdLMaDEq9Kaw0ch+';
export const GRAVITY_VENDORED = '/assets/vendor/gravity/gravity.js';
export const vendored = () => existsSync(join(root, 'assets/vendor/gravity/gravity.js'));
export const GRAVITY_SRC = () => (vendored() ? GRAVITY_VENDORED : GRAVITY_CROSS_SITE);
// the attributes every Gravity script tag must carry (finding 37); empty for the vendored same-origin copy
export const gravityAttrs = () => (vendored() ? '' : ` integrity="${GRAVITY_INTEGRITY}" crossorigin="anonymous"`);
export const universeCss = `.uv-note{font-size:.85rem}#universe{min-height:88vh;overflow:hidden;background:#04100F;color:#EAF6F3;max-width:none;width:100vw;margin-left:calc(50% - 50vw)}body{overflow-x:clip}`;
export function universeBody(esc) {
  const cross = !vendored();
  return `<h1>The Fringe universe</h1>
<p class="muted uv-note">Our live events drawn as a universe: topics as centres, events orbiting them, with weather and agenda views. Drawn with <a href="https://web-summit.sgit.ai/lib/gravity/">Gravity</a> (Silvio's library); the adapter is <code>team/silvio/gravity/fringe-gravity.js</code> and reads <a href="/api/v1/events.json">/api/v1/events.json</a> live. Flows are shared topics, not people moving.${cross ? ' This page loads the Gravity library from web-summit.sgit.ai when you open it.' : ''} <a href="/graph/">The graph</a> · <a href="/programme/">The programme</a></p>
<div id="universe" data-fringe-universe></div>
<script src="${esc(GRAVITY_SRC())}"${gravityAttrs()}></script><script src="/universe/fringe-gravity.js"></script>`;
}
