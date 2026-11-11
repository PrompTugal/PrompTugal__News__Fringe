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
<script type="application/json" id="tip-cfg">${json(cfg)}</script><script type="module" src="/assets/tip/tip.js"></script>`;
}
