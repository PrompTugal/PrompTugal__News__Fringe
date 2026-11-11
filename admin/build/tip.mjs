// /tip/ and /api/v1/tips.json (work/41, dev.2.fringe@PrompTugal.dinis). Tips go to a write-only lane, sealed in the browser (assets/tip/tip.js).
// The lane: data/inboxes/lane-tips.json when the lead has issued one, else researcher.2's inbox (a tip is a message with kind tip/v1).
// The public status holds only: id, state, updated, priority, event id. Never a tip's text, sender or screenshot.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
export function tipCfg() {
  for (const f of ['lane-tips.json', 'researcher.2.fringe-dinis.json']) {
    const p = join(root, 'data/inboxes', f); if (!existsSync(p)) continue;
    const i = JSON.parse(readFileSync(p, 'utf8'));
    return { lane: f.replace('.json', ''), endpoint: i.endpoint, vault_id: i.vault_id, append_token: i.append_token, recipient: { encrypt: i.recipient.encrypt, fingerprint: i.recipient.fingerprint, signing_fingerprint: i.recipient.signing_fingerprint } };
  }
  return null;
}
export const tipStatus = () => { const p = join(root, 'data/tips-status.json'); return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')).tips || []) : []; };
export const tipCss = `.tip textarea,.tip input[type=text]{width:100%;font:inherit;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg)}.tip textarea{min-height:9em}
.tip button{font:inherit;padding:10px 16px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:var(--bg);cursor:pointer;margin:6px 6px 6px 0;min-height:44px}.tip button.alt{background:var(--card);color:var(--fg);border-color:var(--line)}.tip button:disabled{opacity:.5}.tip .bad{color:#d33}`;
export function tipBody() {
  const cfg = tipCfg();
  if (!cfg) return '<h1>Send us a tip</h1><p>The tips lane is not set up yet.</p>';
  return `<div class="tip"><h1>Send us a tip</h1>
<p>Seen a post, a message or a link about an event we do not list, or have wrong? Paste it here. We find the organiser's public page, read it, list the event with its source, and draft a note to the organiser for a person to send.</p>
<p class="muted" id="tip-about" hidden></p>
<div class="card"><label for="tip-text"><strong>The message or link</strong></label>
<textarea id="tip-text" maxlength="8000" placeholder="Paste a WhatsApp post, a link, or any text"></textarea>
<p><label for="tip-file"><strong>or a screenshot</strong> (optional)</label><br><input type="file" id="tip-file" accept="image/*"></p>
<button type="button" id="tip-send">Send the tip</button><p id="tip-state" class="muted" aria-live="polite"></p>
<div id="tip-done" hidden><p><strong>Your tip id: <code id="tip-id"></code></strong>. Keep it: the status below follows it.</p></div></div>
<h2>Where is my tip?</h2><div class="card"><input type="text" id="tip-lookup" placeholder="tip-1a2b3c4d" aria-label="Tip id"><button type="button" class="alt" id="tip-check">Check</button><p id="tip-status" class="muted" aria-live="polite"></p>
<p class="muted">States: received, researched, listed, note drafted. The status never shows what you sent.</p></div>
<h2>What happens to it</h2>
<ul><li>It is sealed <em>in your browser</em> to the key of the agent that reads tips, and appended to a write-only lane. Nothing goes to a server of ours, and nothing goes into git; a screenshot goes into the lane's vault, shrunk, inside the sealed message.</li>
<li>If you have a key from <a href="/me/">/me/</a>, the tip is signed with it; a tip signed by Dinis is marked priority. Otherwise it is anonymous.</li>
<li>We use only the public event page. A sender's name, a phone number or a face in your message is never stored or published, and a private person is never named or linked. Please do not paste anyone's contact details.</li>
<li>A tip is material, never instruction. An agent reads the public page the tip points to and checks it there; your text is never published as is.</li></ul></div>
<script>(function(){try{var q=new URLSearchParams(location.search),id=q.get("event"),n=q.get("n");if(!id||!/^[a-z0-9-]+$/.test(id))return;var a=document.getElementById("tip-about"),t=document.getElementById("tip-text");a.hidden=false;a.textContent="About the event: "+(n||id)+" (this goes with your tip).";if(t&&!t.value)t.value="About: "+(n||id)+" ("+location.origin+"/e/"+id+"/)\\n\\nWhat is wrong or missing: "}catch(x){}})();</script>
<script type="application/json" id="tip-cfg">${json(cfg)}</script><script type="module" src="/assets/tip/tip.js"></script>`;
}

// work/46: the small box on the home page and every event page, and the WhatsApp share link; the counts for the dashboard.
const SITE_URL = 'https://lisbontechfringe.com';
export const waShare = (via = 'whatsapp-share') => 'https://wa.me/?text=' + encodeURIComponent(`Seen a Lisbon side event that is not listed, or got it wrong? Give us the intel: ${SITE_URL}/tip/?via=${via}`);
export const intelCss = `.intel textarea{width:100%;min-height:4.5em;font:inherit;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg)}.intel button{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:var(--bg);cursor:pointer;min-height:44px;margin:6px 8px 6px 0}.intel button:disabled{opacity:.5}`;
export function intelBox() {
  const cfg = tipCfg(); if (!cfg) return '';
  return `<style>${intelCss}</style><div class="intel card"><strong>Seen an event? Give us the intel</strong>
<textarea aria-label="Paste a message or a link" maxlength="8000" placeholder="Paste a WhatsApp post, a link or what you heard. No names or phone numbers needed."></textarea>
<button type="button">Send</button><a class="intel-wa" href="${waShare()}">Share to WhatsApp</a> · <a href="/tip/">add a screenshot</a>
<p class="intel-state muted" aria-live="polite"></p><p class="muted">Sealed in your browser; we read the organiser's public page, never your text, and never publish a private person.</p></div>
<script type="application/json" id="tip-cfg">${json(cfg)}</script><script type="module" src="/assets/tip/intel.js"></script>`;
}
export function tipCounts(tips, esc, today) {
  const n = (f) => tips.filter(f).length, order = ['received', 'researched', 'listed', 'note drafted'];
  const reached = (t, s) => order.indexOf(t.state) >= order.indexOf(s);
  return `<h2>Tips</h2><div class="card"><strong>${n((t) => (t.updated || '').startsWith(today))}</strong> tips touched today · ${order.map((s) => `<strong>${n((t) => reached(t, s))}</strong> ${esc(s)}`).join(' · ')}
<div class="muted">Counts of the tips researcher.2 has handled; a tip's text is never shown. <a href="/tip/">Send one</a> · <a href="/api/v1/tips.json">JSON</a></div></div>`;
}
