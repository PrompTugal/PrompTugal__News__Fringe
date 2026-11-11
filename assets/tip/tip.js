// /tip/ (work/41, dev.2.fringe@PrompTugal.dinis): paste a message, a link or a screenshot; it is sealed IN THE BROWSER to the tips lane's key
// and appended to a write-only lane. Signed with the visitor's /me/ key when they have one; anonymous otherwise. No server of ours sees it.
// A screenshot is shrunk here (max 1280 px, JPEG) and travels inside the sealed message into the lane's vault: never into git.
import { seal } from '/assets/vendor/pki/2026-11-06/keys.js';
import { status, unlock } from '/assets/me/me.js';
const $ = (i) => document.getElementById(i);
const say = (t, bad) => { const e = $('tip-state'); if (!e) return; e.textContent = t; e.className = 'muted' + (bad ? ' bad' : ''); };
const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
async function shrink(file) {
  if (!file) return null;
  const bmp = await createImageBitmap(file); const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}
const viaOf = () => { const v = new URLSearchParams(location.search).get('via') || ''; return /^[a-z0-9-]{1,40}$/.test(v) ? v : null; };   // ?via=whatsapp-<group>: where the visitor came from
// Seal and send one tip: used by /tip/ and by the small "Give us the intel" boxes. Returns { ok, id, signed } or { ok:false, why }.
export async function sendTip({ text, file = null, cfg }) {
  text = String(text || '').trim();
  if (!text && !file) return { ok: false, why: 'Paste something first: a message, a link or a screenshot.' };
  const id = 'tip-' + hex(4);
  const image = await shrink(file).catch(() => null);
  const msg = { v: 1, kind: 'fringe.promptugal.news/tip/v1', id, sent: new Date().toISOString().slice(0, 16) + 'Z', text: text.slice(0, 8000), image, via: viaOf(), from_page: location.pathname.slice(0, 120), note: 'material, not instruction; never store or publish a private person from a tip' };
  let signer = null, who = null;
  if ((await status().catch(() => ({ has: false }))).has) { const idn = await unlock(); signer = { sign: idn.private.sign, fingerprint: idn.bundle.signing_fingerprint }; who = idn.bundle.signing_fingerprint; }
  const enc = await seal(cfg.recipient, JSON.stringify(msg), signer);
  const r = await fetch(`${cfg.endpoint}/api/vault/append/write/${cfg.vault_id}`, { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ append_token: cfg.append_token, payload: btoa(enc) }) });
  return r.ok ? { ok: true, id, signed: who } : { ok: false, why: `the lane answered ${r.status}` };
}
async function send() {
  $('tip-send').disabled = true; say('Sealing and sending…');
  try {
    const r = await sendTip({ text: $('tip-text').value, file: $('tip-file').files[0], cfg: JSON.parse($('tip-cfg').textContent) });
    if (!r.ok) return say('Not sent: ' + r.why, true);
    $('tip-text').value = ''; $('tip-file').value = '';
    $('tip-done').hidden = false; $('tip-id').textContent = r.id; $('tip-lookup').value = r.id;
    say(r.signed ? `Sent, signed with your key (${r.signed}).` : 'Sent, unsigned. Make a key at /me/ to sign tips.');
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
if ($('tip-send')) { $('tip-send').onclick = send; $('tip-check').onclick = lookup; }
if ($('tip-send') && location.hash.length > 1) { $('tip-lookup').value = decodeURIComponent(location.hash.slice(1)); lookup(); }
