// The storm block (work/07): read live, in the reader's browser, from the storm site's data API v1
// (https://storm-charles.promptugal.news/api/v1/README.md: addresses and fields stable within v1).
// Shows the storm site's headline, IPMA's Lisbon warnings and what moved on transport, each with its source and
// the time it was read. Remote text is only ever set with textContent; only https links are made.
// If anything fails, the static block (links to the storm site, IPMA and ANEPC) stays as it is.
(function () {
  var API = 'https://storm-charles.promptugal.news/api/v1/';
  var box = document.getElementById('storm-live');
  if (!box || !window.fetch) return;
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = String(text); if (cls) e.className = cls; return e; }
  function link(href, text) {
    if (!/^https:\/\//.test(href || '')) return el('span', text);
    var a = el('a', text); a.href = href; a.rel = 'noopener'; return a;
  }
  function t(s) { return s ? String(s).slice(0, 16).replace('T', ' ').replace(/Z$/, '') + ' UTC' : 'time unknown'; }
  function get(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  get(API + 'index.json').then(function (idx) {
    var inc = (idx.incidents || []).filter(function (i) { return i.status === 'open'; })[0] || (idx.incidents || [])[0];
    if (!inc) return;
    var ds = {}; (idx.datasets || []).forEach(function (d) { if (d.incident === inc.id) ds[d.path] = d.url; });
    var abs = function (u) { return u ? new URL(u, 'https://storm-charles.promptugal.news/').href : null; };
    var out = document.createDocumentFragment();
    if (inc.headline && inc.headline.text) {
      var p = el('p'); p.appendChild(el('strong', 'Latest: ')); p.appendChild(document.createTextNode(inc.headline.text + ' '));
      p.appendChild(link(inc.headline.url, '(source)'));
      if (inc.headline.at) p.appendChild(el('span', ' · ' + inc.headline.at, 'muted'));
      out.appendChild(p);
    }
    var jobs = [];
    if (ds['weather/warnings.json']) jobs.push(get(abs(ds['weather/warnings.json'])).then(function (w) {
      var list = (w.lisbon || []);
      out.appendChild(el('h3', 'IPMA warnings for Lisbon'));
      if (!list.length) { out.appendChild(el('p', 'No warning above green for the Lisbon district (read ' + t(w.read_utc) + ').', 'muted')); return; }
      var rank = { red: 0, orange: 1, yellow: 2 };
      list = list.slice().sort(function (a, b) { return (rank[a.level] ?? 3) - (rank[b.level] ?? 3) || String(a.start_utc).localeCompare(String(b.start_utc)); });
      var ul = el('ul');
      list.forEach(function (x) {
        var li = el('li'); li.appendChild(el('span', String(x.level || '').toUpperCase(), 'tag lvl-' + String(x.level || '').replace(/[^a-z]/g, '')));
        li.appendChild(document.createTextNode(' ' + (x.type || '') + ', ' + t(x.start_utc) + ' to ' + t(x.end_utc) + '. ' + (x.text_en || x.text_pt || '') + ' '));
        li.appendChild(link(x.source, '(IPMA)'));
        ul.appendChild(li);
      });
      out.appendChild(ul);
      out.appendChild(el('p', 'Read ' + t(w.read_utc) + ' by the storm site.', 'muted'));
    }));
    if (ds['transport/services.json']) jobs.push(get(abs(ds['transport/services.json'])).then(function (s) {
      var ops = s.operators || [];
      if (!ops.length) return;
      out.appendChild(el('h3', 'What moved: transport'));
      var ul = el('ul');
      ops.forEach(function (o) { var li = el('li'); li.appendChild(el('strong', o.operator || o.id)); li.appendChild(document.createTextNode(': ' + (o.state || 'unknown'))); ul.appendChild(li); });
      out.appendChild(ul);
      var m = el('p', 'Updated ' + t(s.updated) + '. Details and every operator\'s notices: ', 'muted');
      m.appendChild(link('https://storm-charles.promptugal.news/', 'the storm site')); out.appendChild(m);
    }));
    return Promise.all(jobs.map(function (j) { return j.catch(function () {}); })).then(function () {
      if (out.childNodes.length) { box.textContent = ''; box.appendChild(out); }
    });
  }).catch(function () { /* keep the static block */ });
})();
