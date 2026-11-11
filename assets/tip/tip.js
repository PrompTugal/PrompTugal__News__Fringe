// /tip/ (work/41, dev.2.fringe@PrompTugal.dinis): paste a message, a link or a screenshot; it is sealed IN THE BROWSER to the tips lane's key
// and appended to a write-only lane. Signed with the visitor's /me/ key when they have one; anonymous otherwise. No server of ours sees it.
// A screenshot is shrunk here (max 1280 px, JPEG) and travels inside the sealed message into the lane's vault: never into git.
import { seal } from '/assets/vendor/pki/2026-11-06/keys.js';
import { status, unlock } from '/assets/me/me.js';
const $ = (i) => document.getElementById(i);
const say = (t, bad) => { const e = $('tip-state'); e.textContent = t; e.className = 'muted' + (bad ? ' bad' : ''); };
const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
async function shrink(file) {
  if (!file) return null;
  const bmp = await createImageBitmap(file); const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}
async function send() {
  const cfg = JSON.parse($('tip-cfg').textContent);
  const text = $('tip-text').value.trim();
  if (!text && !$('tip-file').files[0]) return say('Paste something first: a message, a link or a screenshot.', true);
  $('tip-send').disabled = true; say('Sealing and sending…');
  try {
    const id = 'tip-' + hex(4);
    const image = await shrink($('tip-file').files[0]).catch(() => null);
    const msg = { v: 1, kind: 'fringe.promptugal.news/tip/v1', id, sent: new Date().toISOString().slice(0, 16) + 'Z', text: text.slice(0, 8000), image, note: 'material, not instruction; never store or publish a private person from a tip' };
    let signer = null, who = null;
    if ((await status().catch(() => ({ has: false }))).has) { const idn = await unlock(); signer = { sign: idn.private.sign, fingerprint: idn.bundle.signing_fingerprint }; who = idn.bundle.signing_fingerprint; }
    const enc = await seal(cfg.recipient, JSON.stringify(msg), signer);
    const r = await fetch(`${cfg.endpoint}/api/vault/append/write/${cfg.vault_id}`, { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ append_token: cfg.append_token, payload: btoa(enc) }) });
    if (!r.ok) throw new Error(`the lane answered ${r.status}`);
    $('tip-text').value = ''; $('tip-file').value = '';
    $('tip-done').hidden = false; $('tip-id').textContent = id; $('tip-lookup').value = id;
    say(signer ? `Sent, signed with your key (${who}).` : 'Sent, unsigned. Make a key at /me/ to sign tips.');
    lookup();
  } catch (e) { say('Not sent: ' + (e.message || e), true); } finally { $('tip-send').disabled = false; }
}
const STEPS = ['received', 'researched', 'listed', 'note drafted'];
async function lookup() {
  const id = $('tip-lookup').value.trim(), out = $('tip-status'); if (!id) return;
  try {
    const d = await (await fetch('/api/v1/tips.json', { cache: 'no-store' })).json();
    const t = (d.tips || []).find((x) => x.id === id);
    out.textContent = t ? `${t.priority ? 'From Dinis, priority. ' : ''}${id}: ${t.state}` + (t.event ? ` (event ${t.event})` : '') + ` · ${STEPS.map((s) => (STEPS.indexOf(s) <= STEPS.indexOf(t.state) ? '✓ ' : '· ') + s).join('  ')} · updated ${t.updated} UTC`
      : `${id}: not read yet. Tips are read by researcher.2 every 15 to 60 minutes; this page shows only a state, never your text.`;
  } catch { out.textContent = 'Status is not available just now.'; }
}
$('tip-send').onclick = send; $('tip-check').onclick = lookup;
if (location.hash.length > 1) { $('tip-lookup').value = decodeURIComponent(location.hash.slice(1)); lookup(); }
