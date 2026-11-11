// /graph/: draws the layout build.mjs computed (admin/build/graph.mjs) and filters it. No dependencies, no requests.
(function () {
  var data = JSON.parse(document.getElementById('gdata').textContent);
  var svg = document.getElementById('graph'), NS = 'http://www.w3.org/2000/svg';
  var byId = {}, adj = {};
  data.nodes.forEach(function (n) { byId[n.id] = n; adj[n.id] = []; });
  data.edges.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var el = function (t, a) { var x = document.createElementNS(NS, t); for (var k in a) x.setAttribute(k, a[k]); return x; };

  // fit the view to the layout
  var xs = data.nodes.map(function (n) { return n.x; }), ys = data.nodes.map(function (n) { return n.y; });
  var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
  var size = Math.max(x1 - x0, y1 - y0) * 1.08, u = size / 500;   // u: one screen-ish unit, so dots and words keep their size
  var home = [(x0 + x1 - size) / 2, (y0 + y1 - size) / 2, size, size], view = home.slice();
  var setView = function () { svg.setAttribute('viewBox', view.join(' ')); };
  setView();

  var gE = el('g', {}), gN = el('g', {}), gL = el('g', {});
  svg.appendChild(gE); svg.appendChild(gN); svg.appendChild(gL);
  var lines = data.edges.map(function (e) {
    var a = byId[e[0]], b = byId[e[1]], l = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    gE.appendChild(l); return { l: l, a: e[0], b: e[1] };
  });
  var dots = {}, labels = {};
  data.nodes.forEach(function (n) {
    var r = (n.type === 'event' ? 3.5 : 3.5 + Math.sqrt(n.degree) * 1.6) * u;
    var c = el('circle', { cx: n.x, cy: n.y, r: r, 'class': 't-' + n.type, tabindex: 0 });
    var t = el('title', {}); t.textContent = n.label + ' (' + n.type + ')'; c.appendChild(t);
    c.addEventListener('click', function (ev) { ev.stopPropagation(); select(n.id); });
    c.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') select(n.id); });
    gN.appendChild(c); dots[n.id] = c;
    if (n.type !== 'event' && n.degree >= 3) {
      var lb = el('text', { x: n.x + r + u, y: n.y + 3.5 * u, 'font-size': 10 * u, 'stroke-width': 2.5 * u }); lb.textContent = n.label; gL.appendChild(lb); labels[n.id] = lb;
    }
  });

  // filters
  var state = { q: '', day: {}, kind: {}, cancelled: false, storm: false }, visible = {};
  var any = function (o) { for (var k in o) if (o[k]) return true; return false; };
  function apply() {
    var q = state.q.trim().toLowerCase(), qNodes = {};
    if (q) data.nodes.forEach(function (n) { if (n.type !== 'event' && n.label.toLowerCase().indexOf(q) >= 0) adj[n.id].forEach(function (m) { qNodes[m] = 1; }); });
    visible = {};
    var nEv = 0;
    data.nodes.forEach(function (n) {
      if (n.type !== 'event') return;
      var hay = [n.label, n.organiser, n.place, (n.topics || []).join(' ')].join(' ').toLowerCase();
      var ok = (!q || hay.indexOf(q) >= 0 || qNodes[n.id]) && (!any(state.day) || state.day[n.date]) && (!any(state.kind) || state.kind[n.kind])
        && !(state.cancelled && n.status === 'cancelled') && !(state.storm && n.storm_moved !== true);
      if (ok) { visible[n.id] = 1; nEv++; adj[n.id].forEach(function (m) { visible[m] = 1; }); }
    });
    data.nodes.forEach(function (n) { var on = !!visible[n.id]; dots[n.id].classList.toggle('off', !on); if (labels[n.id]) labels[n.id].classList.toggle('off', !on); });
    lines.forEach(function (x) { x.l.classList.toggle('off', !(visible[x.a] && visible[x.b])); });
    document.querySelectorAll('li[data-ev]').forEach(function (li) { li.hidden = !visible[li.getAttribute('data-ev')]; });
    document.querySelectorAll('details[data-node]').forEach(function (d) { d.hidden = !visible[d.getAttribute('data-node')]; });
    document.getElementById('gcount').textContent = nEv + ' of ' + data.nodes.filter(function (n) { return n.type === 'event'; }).length + ' events shown';
  }
  document.querySelectorAll('.chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f'), v = b.getAttribute('data-v'), on = b.getAttribute('aria-pressed') !== 'true';
      if (f === 'q') {
        document.querySelectorAll('.chip[data-f=q]').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        state.q = on ? v : ''; document.getElementById('gq').value = state.q;
      } else state[f][v] = on;
      b.setAttribute('aria-pressed', on ? 'true' : 'false'); apply();
    });
  });
  document.getElementById('gq').addEventListener('input', function (e) {
    state.q = e.target.value; document.querySelectorAll('.chip[data-f=q]').forEach(function (o) { o.setAttribute('aria-pressed', String(o.getAttribute('data-v') === state.q)); }); apply();
  });
  document.getElementById('gcan').addEventListener('change', function (e) { state.cancelled = e.target.checked; apply(); });
  document.getElementById('gstorm').addEventListener('change', function (e) { state.storm = e.target.checked; apply(); });

  // selection: the panel says what a dot joins
  var panel = document.getElementById('gpanel'), sel = null;
  function select(id) {
    if (sel) { dots[sel].classList.remove('sel'); }
    lines.forEach(function (x) { x.l.classList.toggle('on', x.a === id || x.b === id); });
    sel = id; dots[id].classList.add('sel');
    var n = byId[id], h = '<strong>' + esc(n.label) + '</strong> <span class="tag">' + esc(n.type) + '</span>';
    if (n.type === 'event') {
      h += '<div class="muted">' + esc(n.date) + (n.start ? ' ' + esc(n.start.slice(11, 16)) + ' UTC' : '') + ' · ' + esc(n.kind) + ' · ' + esc(n.status) + (n.storm_moved ? ' · moved by the storm' : '') + '</div>'
        + '<div class="muted">' + esc(n.place || '') + '</div><div><a href="/e/' + esc(encodeURIComponent(n.id.slice(6))) + '/">Its page here</a> · <a href="' + esc(n.url) + '">The organiser\'s page</a></div>';   // work/22
    } else {
      var l = [n.ptnews && '<a href="' + esc(n.ptnews) + '">on pt.news</a>', n.gamma_ray && '<a href="' + esc(n.gamma_ray) + '">GAMMA-Ray card</a>'].filter(Boolean).join(' · ');
      if (l) h += '<div class="muted">' + l + '</div>';
    }
    var nb = adj[id].map(function (m) { return byId[m]; });
    h += '<ul>' + nb.map(function (m) { return '<li>' + (m.url ? '<a href="' + esc(m.url) + '">' + esc(m.label) + '</a>' : '<a href="#" data-sel="' + esc(m.id) + '">' + esc(m.label) + '</a>') + ' <span class="muted">' + esc(m.type) + '</span></li>'; }).join('') + '</ul>';
    panel.innerHTML = h; panel.hidden = false;
    panel.querySelectorAll('[data-sel]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); select(a.getAttribute('data-sel')); }); });
  }

  // zoom and pan
  document.querySelectorAll('.gzoom button').forEach(function (b) {
    b.addEventListener('click', function () {
      var z = +b.getAttribute('data-z');
      if (!z) view = home.slice(); else { var cx = view[0] + view[2] / 2, cy = view[1] + view[3] / 2; view[2] *= z; view[3] *= z; view[0] = cx - view[2] / 2; view[1] = cy - view[3] / 2; }
      setView();
    });
  });
  var drag = null;
  svg.addEventListener('pointerdown', function (e) { if (e.target === svg) { drag = { x: e.clientX, y: e.clientY, v: view.slice() }; svg.setPointerCapture(e.pointerId); } });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return; var k = view[2] / svg.getBoundingClientRect().width;
    view[0] = drag.v[0] - (e.clientX - drag.x) * k; view[1] = drag.v[1] - (e.clientY - drag.y) * k; setView();
  });
  svg.addEventListener('pointerup', function () { drag = null; });
  apply();
})();
