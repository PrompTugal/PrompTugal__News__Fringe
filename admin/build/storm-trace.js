// /graph/trace/: draws the Storm Charles team's trace (data/storm-trace.json, served next to the page) as a timeline:
// one row per agent (a start with no end is a short hollow stub); inside a row, A3 sessions as a pale band, then A2 loops, A1 model calls and A0 compute as thin
// bars, then commits and messages, then model calls (folded per 5 minutes). Filters, a tooltip and a panel on tap.
// Plain SVG and vanilla JS, no dependencies, no requests but the snapshot. trace.view.fringe@PrompTugal.angelo.
(function () {
  var svg = document.getElementById('stv'); if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg', D = null;
  var tip = document.getElementById('stv-tip'), panel = document.getElementById('stv-panel'), countEl = document.getElementById('stv-count');
  var show = { A3: 1, A2: 1, A1: 1, A0: 1, steps: 1, calls: 1 }, items = [], sel = null;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var el = function (t, a, p) { var x = document.createElementNS(NS, t); for (var k in a) x.setAttribute(k, a[k]); if (p) p.appendChild(x); return x; };
  var T0, DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var iso = function (t) { return new Date(T0 + t * 1000).toISOString(); };
  var hm = function (t) { return iso(t).slice(11, 16); };
  var when = function (t) { var d = new Date(T0 + t * 1000); return DAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + hm(t); };
  var dur = function (s) { return s == null ? 'no end in the trace yet' : s < 1 ? Math.round(s * 1000) + ' ms' : s < 90 ? Math.round(s * 10) / 10 + ' s' : s < 5400 ? Math.round(s / 60) + ' min' : (s / 3600).toFixed(1) + ' h'; };
  var str = function (i) { return i >= 0 ? D.strings[i] : ''; };
  var spanName = function (s) { return str(s[4]).replace('{n}', s[11] != null ? s[11] : '?'); };
  var WORD = { A3: 'agent session', A2: 'loop', A1: 'model call', A0: 'compute' };

  fetch('/graph/trace/storm-trace.json').then(function (r) { return r.json(); }).then(function (d) {
    D = d; T0 = Date.parse(d.t0); D.end = (Date.parse(d.t1) - T0) / 1000; draw();
  }).catch(function () { countEl.textContent = 'The snapshot could not be loaded; the table below holds the same counts.'; });

  function draw() {
    var W = Math.max(300, svg.parentNode.clientWidth), narrow = W < 640;
    var labelW = narrow ? 0 : 172, x0 = narrow ? 6 : labelW + 4, pw = W - x0 - 10, top = 24, LH = narrow ? 44 : 30, B = narrow ? 14 : 1;
    var win = +document.getElementById('stv-win').value, we = D.end, ws = win ? Math.max(0, we - win * 3600) : Math.max(0, firstT() - 600);
    var X = function (t) { return x0 + (t - ws) / (we - ws) * pw; };
    var only = document.getElementById('stv-agent').value, quiet = document.getElementById('stv-quiet').checked;
    var inWin = function (s, e) { return e >= ws && s <= we; };
    // what each lane holds in view
    var lanes = {}, lane = function (a) { return lanes[a] || (lanes[a] = { sess: [], spans: [], steps: [], calls: [] }); };
    D.agents.forEach(function (g, a) { if (show.A3) g.sessions.forEach(function (s) { if (inWin(s[0], s[1])) lane(a).sess.push(s); }); });
    D.spans.forEach(function (s) { if (show[D.alts[s[1]]] && inWin(s[2], s[3] == null ? s[2] : s[2] + s[3])) lane(s[0]).spans.push(s); });
    if (show.steps) D.steps.forEach(function (s) { var t = s[1] * D.step_bucket; if (inWin(t, t + D.step_bucket)) lane(s[0]).steps.push(s); });
    if (show.calls) D.calls.forEach(function (s) { var t = s[1] * D.call_bucket; if (inWin(t, t + D.call_bucket)) lane(s[0]).calls.push(s); });
    var order = D.order.filter(function (a) { return (only === '' || +only === a) && (!quiet || lanes[a]); });
    var H = top + order.length * LH + 8;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    items = []; sel = null;
    // the time axis: ticks every 5 min to 6 h, a darker line and the day at midnight
    var steps = [300, 600, 900, 1800, 3600, 7200, 10800, 21600], step = steps[steps.length - 1];
    for (var i = 0; i < steps.length; i++) if (steps[i] / (we - ws) * pw >= (narrow ? 52 : 64)) { step = steps[i]; break; }
    var gA = el('g', {}, svg), off = (T0 / 1000) % step;
    for (var t = Math.ceil((ws + off) / step) * step - off; t <= we; t += step) {
      var x = X(t), mid = (T0 / 1000 + t) % 86400 === 0;
      el('line', { x1: x, x2: x, y1: top - 4, y2: H - 4, 'class': mid ? 'axd' : 'ax' }, gA);
      var tx = el('text', { x: x + 3, y: top - 8, 'class': 'axt' + (mid ? ' d' : '') }, gA);
      tx.textContent = mid ? when(t).slice(0, 6) : hm(t);
    }
    var gL = el('g', {}, svg), gM = el('g', {}, svg);
    var n = { spans: 0, steps: 0, calls: 0 };
    order.forEach(function (a, row) {
      var y = top + row * LH, b = y + B, L = lanes[a] || { sess: [], spans: [], steps: [], calls: [] }, g = D.agents[a];
      el('line', { x1: 0, x2: W, y1: y + LH - 0.5, y2: y + LH - 0.5, 'class': 'lsep' }, gL);
      var lab = el('text', { x: narrow ? x0 : 4, y: narrow ? y + 11 : y + 19, 'class': 'ln', tabindex: 0 }, gL);
      lab.textContent = g.name.replace(/^incident\./, '');
      lab.addEventListener('click', function (ev) { ev.stopPropagation(); agentPanel(a); });
      lab.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') agentPanel(a); });
      var put = function (kind, ref, xa, xb, ya, h, cls) {
        var xl = Math.max(x0, X(xa)), xr = Math.min(x0 + pw, X(xb)), w = Math.max(2, xr - xl);
        var r = el('rect', { x: xl, y: ya, width: w, height: h, rx: Math.min(2, w / 2), 'class': cls }, gM);
        items.push({ kind: kind, ref: ref, a: a, x0: xl, x1: xl + w, y0: ya, y1: ya + h, el: r });
      };
      L.sess.forEach(function (s) { put('sess', s, s[0], s[1], b, LH - B - 2, 'a3'); });
      L.spans.forEach(function (s) {
        var k = D.alts[s[1]], ya = b + (k === 'A2' ? 3 : k === 'A1' ? 9 : 15), e = s[3] == null ? s[2] + (we - ws) * 0.006 : s[2] + s[3];   // no end recorded: a short hollow stub, not a bar to the end
        put('span', s, s[2], e, ya, 4, k.toLowerCase() + (s[5] === 0 ? ' bad' : '') + (s[3] == null ? ' open' : '')); n.spans++;
      });
      var mx = 1; L.steps.forEach(function (s) { mx = Math.max(mx, s[2] + s[3] + s[4]); });
      L.steps.forEach(function (s) { var t = s[1] * D.step_bucket, r; put('step', s, t, t + D.step_bucket * 0.8, b + 21, 3, 'st'); r = items[items.length - 1].el; r.setAttribute('fill-opacity', (0.35 + 0.65 * (s[2] + s[3] + s[4]) / mx).toFixed(2)); n.steps += s[2] + s[3] + s[4]; });
      L.calls.forEach(function (s) { var t = s[1] * D.call_bucket; put('call', s, t, t + D.call_bucket * 0.8, b + 25, 3, 'ca'); n.calls += s[2]; });
    });
    countEl.textContent = order.length + ' agents in view, ' + n.spans + ' spans, ' + n.steps + ' commits and messages, ' + n.calls + ' model calls, ' + when(ws) + ' to ' + when(we) + ' UTC.';
    svg._lh = LH;
  }
  function firstT() { var t = D.end; D.spans.forEach(function (s) { if (s[2] < t) t = s[2]; }); D.agents.forEach(function (g) { g.sessions.forEach(function (s) { if (s[0] < t) t = s[0]; }); }); return t; }

  // the nearest mark to a point, within a few pixels (a finger is wider than a 2 px bar)
  function hit(ev) {
    var r = svg.getBoundingClientRect(), k = (svg.viewBox.baseVal.width || r.width) / r.width, x = (ev.clientX - r.left) * k, y = (ev.clientY - r.top) * k, best = null, bd = 1e9;
    items.forEach(function (it) {
      if (y < it.y0 - 2 || y > it.y1 + 2) return;
      var dx = x < it.x0 ? it.x0 - x : x > it.x1 ? x - it.x1 : 0;
      var score = dx + (it.kind === 'sess' ? 4 : 0);   // a thin bar inside a session wins over the session
      if (dx <= 8 && score < bd) { bd = score; best = it; }
    });
    return best;
  }
  svg.addEventListener('click', function (ev) { var it = hit(ev); if (it) open(it); });
  svg.addEventListener('mousemove', function (ev) {
    var it = hit(ev); if (!it) { tip.hidden = true; return; }
    tip.textContent = shortText(it); tip.hidden = false;
    var wr = svg.parentNode.getBoundingClientRect(), x = ev.clientX - wr.left + 12, y = ev.clientY - wr.top + 12;
    tip.style.left = Math.min(x, wr.width - 270) + 'px'; tip.style.top = y + 'px';
  });
  svg.addEventListener('mouseleave', function () { tip.hidden = true; });

  function who(a) { return D.agents[a].name; }
  function shortText(it) {
    var s = it.ref;
    if (it.kind === 'sess') return who(it.a) + ': session ' + s[2] + ', ' + hm(s[0]) + '–' + hm(s[1]);
    if (it.kind === 'span') return who(it.a) + ': ' + spanName(s) + ' (' + D.alts[s[1]] + ', ' + dur(s[3]) + ')';
    if (it.kind === 'step') return who(it.a) + ': ' + s[2] + ' commits, ' + s[3] + ' messages, ' + hm(s[1] * D.step_bucket);
    return who(it.a) + ': ' + s[2] + ' model calls, ' + hm(s[1] * D.call_bucket);
  }
  function fileLink(fi) { var f = D.files[fi]; return f ? '<a href="' + esc(D.files_base + f.path) + '">' + esc(f.path) + '</a>, read ' + esc(f.read_at.slice(11, 16)) + ' UTC' : ''; }
  function dl(rows) { return '<dl>' + rows.filter(function (r) { return r[1] !== '' && r[1] != null; }).map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>'; }
  function show_(html) { panel.innerHTML = '<button type="button" class="x" aria-label="Close">Close</button>' + html; panel.hidden = false; panel.querySelector('.x').onclick = function () { panel.hidden = true; if (sel) sel.classList.remove('sel'); }; panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  function open(it) {
    if (sel) sel.classList.remove('sel'); sel = it.el; sel.classList.add('sel');
    var s = it.ref, h;
    if (it.kind === 'sess') h = '<h3>' + esc(who(it.a)) + ', session ' + s[2] + '</h3>' + dl([['altitude', 'A3, agent session'], ['from', esc(when(s[0])) + ' UTC'], ['to', esc(when(s[1])) + ' UTC'], ['commits', s[3]], ['source', '<a href="' + esc(D.source.units) + '">units.json</a> (from their first to their last commit), read ' + esc(D.read_at.slice(11, 16)) + ' UTC']]);
    else if (it.kind === 'span') h = '<h3>' + esc(spanName(s)) + '</h3>' + dl([['altitude', esc(D.alts[s[1]] + ', ' + WORD[D.alts[s[1]]])], ['agent', esc(who(it.a))], ['start', esc(when(s[2])) + ' UTC'], ['end', s[3] == null ? 'no end in the trace yet' : esc(when(s[2] + s[3])) + ' UTC'], ['duration', esc(dur(s[3]))], ['outcome', s[5] === 1 ? 'valid' : s[5] === 0 ? 'not valid (failed or cancelled)' : ''], ['detail', esc(str(s[6]))], ['model', esc(str(s[7]))], ['cost', s[8] >= 0 ? '$' + (s[8] / 1e6).toFixed(6) : ''], ['their source', esc(str(s[9]))], ['file', fileLink(s[10])]]);
    else if (it.kind === 'step') h = '<h3>' + esc(who(it.a)) + ', ' + esc(when(s[1] * D.step_bucket)) + '–' + esc(hm((s[1] + 1) * D.step_bucket)) + ' UTC</h3>' + dl([['commits', s[2]], ['messages', s[3]], ['other', s[4]], ['source', '<a href="' + esc(D.source.trace) + '">their trace</a> (A3 steps, counted per 10 minutes), read ' + esc(D.read_at.slice(11, 16)) + ' UTC']]);
    else { var g = D.agents[it.a]; h = '<h3>' + esc(who(it.a)) + ': ' + s[2] + ' model calls</h3>' + dl([['window', esc(when(s[1] * D.call_bucket)) + '–' + esc(hm((s[1] + 1) * D.call_bucket)) + ' UTC'], ['answered', s[3] + ' ok, ' + (s[2] - s[3]) + ' not'], ['tokens', s[4] + ' in, ' + s[5] + ' out'], ['cost', '$' + (s[6] / 1e6).toFixed(4)], ['models (whole trace)', esc((g.models || []).map(function (m) { return m[0] + ' ' + m[1]; }).join(', '))], ['source', '<a href="' + esc(D.source.calls) + '">their model calls</a> (text-free), read ' + esc(D.read_at.slice(11, 16)) + ' UTC']]); }
    show_(h);
  }
  function agentPanel(a) {
    var g = D.agents[a], ins = g.inside;
    show_('<h3>' + esc(g.name) + '</h3>' + dl([['id', esc(g.id)], ['role', esc(g.role || '')], ['altitude', esc(g.alt + (g.altitude_label ? ' (' + g.altitude_label + ')' : '')) + (g.grant ? '; its session holds ' + esc(g.grant) + ' grants' : '')], ['runtime', esc(g.runtime || '')], ['I/O level', esc(g.io || '')], ['keys', g.keys], ['what it runs', ins ? ins.a2 + ' A2 loops, ' + ins.a1 + ' A1 call paths, ' + ins.a0 + ' A0 compute units (' + ins.crosses + ' crossing their altitude, as the librarian maps it)' : ''], ['sessions', g.sessions.map(function (s) { return s[2] + ': ' + esc(when(s[0])) + '–' + esc(hm(s[1])) + ' (' + s[3] + ' commits)'; }).join('<br>')], ['in the trace', g.n.spans + ' spans, ' + g.n.steps + ' commits and messages, ' + g.n.calls + ' model calls'], ['statuses', esc(g.statuses ? Object.keys(g.statuses).map(function (k) { return k + ' ' + g.statuses[k]; }).join(', ') : '')], ['source', '<a href="' + esc(D.source.units) + '">units.json</a>, <a href="' + esc(D.source.altitudes) + '">altitudes.json</a>, read ' + esc(D.read_at.slice(11, 16)) + ' UTC']]));
  }

  document.querySelectorAll('#stv-ctl .chip').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-alt'); show[k] = !show[k]; b.setAttribute('aria-pressed', show[k] ? 'true' : 'false'); if (D) draw(); }); });
  ['stv-agent', 'stv-win', 'stv-quiet'].forEach(function (id) { document.getElementById(id).addEventListener('change', function () { if (D) draw(); }); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (D) draw(); }, 150); });
})();
