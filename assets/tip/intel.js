// The small "Seen an event? Give us the intel" boxes (work/46, dev.2.fringe@PrompTugal.dinis): same sealed lane as /tip/.
import { sendTip } from '/assets/tip/tip.js';
const cfgEl = document.getElementById('tip-cfg'), cfg = cfgEl ? JSON.parse(cfgEl.textContent) : null;
const via = new URLSearchParams(location.search).get('via'), okVia = /^[a-z0-9-]{1,40}$/.test(via || '') ? via : null;
document.querySelectorAll('.intel').forEach((box) => {
  const ta = box.querySelector('textarea'), btn = box.querySelector('button'), st = box.querySelector('.intel-state'), wa = box.querySelector('.intel-wa');
  if (wa && okVia) wa.href = wa.href.replace(/via%3Dwhatsapp-share/, 'via%3D' + encodeURIComponent(okVia));
  btn.onclick = async () => {
    btn.disabled = true; st.textContent = 'Sealing and sending…';
    try { const r = await sendTip({ text: ta.value, cfg }); st.textContent = r.ok ? `Thank you. Your tip id is ${r.id}; follow it at /tip/#${r.id}.` : 'Not sent: ' + r.why; if (r.ok) ta.value = ''; }
    catch (e) { st.textContent = 'Not sent: ' + (e.message || e); } finally { btn.disabled = false; }
  };
});
