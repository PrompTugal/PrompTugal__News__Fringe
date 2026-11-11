// /me/ and the "message the lead" box on /dashboard/ (work/26, dev.1.fringe@PrompTugal.dinis). The browser code is assets/me/me.js.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// the lead's inbox as the public config the browser needs: endpoint, vault, the write-only token and the lead's public seal key
function leadCfg() {
  const f = join(root, 'data/inboxes/conductor.fringe-promptugal.json');
  if (!existsSync(f)) return null;
  const i = JSON.parse(readFileSync(f, 'utf8'));
  return { endpoint: i.endpoint, vault_id: i.vault_id, append_token: i.append_token, agent: i.agent, recipient: { encrypt: i.recipient.encrypt, fingerprint: i.recipient.fingerprint, signing_fingerprint: i.recipient.signing_fingerprint } };
}
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
export const meCss = `.me textarea,.me input{width:100%;font:inherit;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg)}.me textarea{min-height:7em}
.me button{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:var(--bg);cursor:pointer;margin:6px 6px 6px 0}.me button.alt{background:var(--card);color:var(--fg);border-color:var(--line)}.me button:disabled{opacity:.5}.me .bad{color:#d33}`;
export function talkBox() {
  const cfg = leadCfg(); if (!cfg) return '';
  return `<h2>Message the lead</h2><div class="me card"><p class="muted">Sealed in your browser to the lead's key and signed with yours (<a href="/me/">make or check your key</a>), then appended to the lead's inbox. Nothing goes to a server of ours.</p>
<input id="talk-subject" placeholder="Subject (optional)" maxlength="200" aria-label="Subject"><textarea id="talk-text" placeholder="Your message to conductor.fringe@PrompTugal.dinis" maxlength="8000" aria-label="Message"></textarea>
<button type="button" id="talk-send">Send, signed</button><p id="talk-state" class="muted" aria-live="polite"></p></div>
<script type="application/json" id="lead-cfg">${json(cfg)}</script><script type="module" src="/assets/me/me.js"></script>`;
}
export function meBody() {
  const cfg = leadCfg();
  return `<div class="me"><h1>Your key</h1><p>Make a key pair in <em>this browser</em>, protected by a passkey. The private half never leaves the browser; only the public half goes on the site. With it you can <a href="/dashboard/">message the lead</a> from the dashboard, signed as you. Built for Dinis (brief 4); anyone else can make a key, but only a key listed in <code>data/person-keys.json</code> by a commit means a person's word.</p>
<h2>1. Make it</h2><p><button type="button" id="me-make">Make my key and passkey</button></p><p id="me-state" class="muted" aria-live="polite"></p>
<div id="me-has" hidden><h2>2. Put the public half on the site</h2><p class="muted">Fingerprints: <code id="me-fp"></code><br>Protection: <span id="me-mode"></span></p>
<p>Copy this entry into <code>data/person-keys.json</code> (the <code>keys</code> list) by a commit, or hand it to the lead. It is the public half only.</p><textarea id="me-pub" readonly rows="10" aria-label="Public key entry"></textarea><p><button type="button" id="me-copy">Copy it</button></p>
<h2>3. A backup (optional, recommended)</h2><p class="muted">If you clear this browser's data or lose the passkey, the key is gone. A backup is the private halves encrypted under a passphrase you choose, in the sgit format; keep the file private.</p><input id="me-pass" type="password" placeholder="Passphrase (8+ characters)" autocomplete="new-password" aria-label="Passphrase"><p><button type="button" class="alt" id="me-backup">Download an encrypted backup</button> <button type="button" class="alt" id="me-forget">Remove the key from this browser</button></p></div>
<p class="muted">How: keys.js from pki.sgit.ai (RSA-OAEP 4096 to seal, ECDSA P-256 to sign, sgit hybrid v2 envelopes); the private halves are AES-256-GCM encrypted in IndexedDB, wrapped by the passkey's PRF secret where it has one.</p></div>
${cfg ? `<script type="application/json" id="lead-cfg">${json(cfg)}</script>` : ''}<script type="module" src="/assets/me/me.js"></script>`;
}
