/* My day (D29, design.2.fringe@PrompTugal.dinis; brief 13, Dinis 13:58 UTC: "we can use local storage ... create the personalized
   schedule for what they want to go ... select things they want to do ... just deselect it").
   One small script, on every page, no account, nothing sent anywhere:
     - a star on every event card and event page (found by its link to /e/<id>/), to pick or drop the event;
     - the picks live in this browser's localStorage (every access in try/catch; when storage is blocked they live in memory
       for the visit), under the key ltf.myday.v1, as a list of event ids and nothing else;
     - a quiet pill "My day (n)" once something is picked, linking /my/;
     - on /my/: the personal timeline of the picks (clashes shown, gaps with nearby suggestions, remove, share link ?my=<ids>).
   The share link carries only event ids. The events themselves are read from /api/v1/events.json on this site. */
(function () {
  'use strict';
  var KEY = 'ltf.myday.v1', ID = /^[a-z0-9][a-z0-9-]{0,120}$/, MAXN = 80, mem = [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---- storage ---------------------------------------------------------------------------------------------
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(v)) return v.filter(function (x) { return typeof x === 'string' && ID.test(x); }).slice(0, MAXN); } catch (e) { return mem.slice(); }
    return [];
  }
  function save(list) {
    list = list.filter(function (x, i) { return ID.test(x) && list.indexOf(x) === i; }).slice(0, MAXN);
    mem = list.slice();
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* blocked or full: the picks live for this visit */ }
    return list;
  }
  var picks = load();
  function has(id) { return picks.indexOf(id) >= 0; }
  function toggle(id) { picks = save(has(id) ? picks.filter(function (x) { return x !== id; }) : picks.concat(id)); changed(); }
  function remove(id) { picks = save(picks.filter(function (x) { return x !== id; })); changed(); }
  function setAll(list) { picks = save(list); changed(); }
  var listeners = [];
  function changed() { listeners.forEach(function (f) { try { f(); } catch (e) { } }); }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { picks = load(); changed(); } });

  // ---- style -----------------------------------------------------------------------------------------------
  var css = document.createElement('style');
  css.textContent =
    '.md-host{position:relative}.md-star{position:absolute;right:2px;top:2px;z-index:4;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;padding:0;cursor:pointer;font:400 1.5rem/1 system-ui,sans-serif;color:var(--ink-3,#595c64)}' +
    '.md-star:hover,.md-star:focus-visible{color:var(--green,#006600)}.md-star[aria-pressed="true"]{color:var(--green,#006600)}.md-star:focus-visible{outline:2px solid var(--focus,#ffbf1f);outline-offset:-4px}' +
    '.md-host.md-pad{padding-right:46px}' +
    '.sharerow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.sharerow .share-note{flex-basis:100%}.md-add{display:inline-flex;align-items:center;gap:6px;margin:.2em 0 .8em;font:inherit;font-weight:600;padding:10px 16px;min-height:44px;border-radius:8px;border:2px solid var(--green,#006600);background:transparent;color:var(--green,#006600);cursor:pointer}.md-add:hover,.md-add:focus-visible,.md-add[aria-pressed="true"]{background:var(--green,#006600);color:var(--paper,#f6f3ec)}' +
    '.md-pill{position:fixed;left:12px;bottom:12px;z-index:50;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border-radius:99px;background:var(--ink,#121317);color:var(--paper,#f6f3ec);font:600 .9rem system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.25)}.md-pill:hover,.md-pill:focus-visible{background:var(--green,#006600);color:#fff}' +
    '.md-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
  document.head.appendChild(css);

  // ---- stars on every event card ----------------------------------------------------------------------------
  function idOf(a) { var m = /^\/e\/([a-z0-9][a-z0-9-]*)\/?$/.exec(a.getAttribute('href') || ''); return m ? m[1] : null; }
  function nameOf(host, a) { return (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120); }
  function paint(btn, id, name) {
    var on = has(id);
    btn.textContent = on ? '★' : '☆';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', (on ? 'Remove from my day: ' : 'Add to my day: ') + name);
    btn.title = on ? 'In my day: tap to remove' : 'Add to my day';
  }
  function decorate() {
    if (/^\/my\/?$/.test(location.pathname)) return;
    $$('a[href^="/e/"]').forEach(function (a) {
      var id = idOf(a); if (!id || a.closest('.md-host') && a.closest('.md-host').querySelector('.md-star[data-id="' + id + '"]')) return;
      if (a.closest('nav, header, footer, .jumps, .md-pill')) return;
      var host = a.closest('li, .card, .ev, .row, .big, .b-ev, .tl-row, article');
      if (!host || host.querySelector('.md-star')) return;
      var name = nameOf(host, a); if (!name) return;
      host.classList.add('md-host', 'md-pad');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'md-star'; b.setAttribute('data-id', id); b.setAttribute('data-name', name);
      paint(b, id, name);
      b.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); toggle(id); });
      host.appendChild(b);
    });
  }
  function refresh() {
    $$('.md-star').forEach(function (b) { paint(b, b.getAttribute('data-id'), b.getAttribute('data-name')); });
    $$('.md-add').forEach(function (b) { paintAdd(b); });
    pill();
  }
  listeners.push(refresh);

  // ---- the event page: a button with words -------------------------------------------------------------------
  function paintAdd(b) {
    var on = has(b.getAttribute('data-id'));
    b.textContent = on ? '★ In my day (remove)' : '☆ Add to my day';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function eventPage() {
    var m = /^\/e\/([a-z0-9][a-z0-9-]*)\/?$/.exec(location.pathname); if (!m) return;
    var row = $('.sharerow') || $('h1'); if (!row || $('.md-add')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'md-add'; b.setAttribute('data-id', m[1]);
    paintAdd(b); b.addEventListener('click', function () { toggle(m[1]); });
    if (row.classList.contains('sharerow')) { row.hidden = false; row.appendChild(b); } else { row.insertAdjacentElement('afterend', b); }
  }

  // ---- the pill ---------------------------------------------------------------------------------------------
  function pill() {
    var p = $('.md-pill'), onMy = /^\/my\/?$/.test(location.pathname);
    if (!picks.length || onMy) { if (p) p.remove(); return; }
    if (!p) { p = document.createElement('a'); p.className = 'md-pill'; p.href = '/my/'; document.body.appendChild(p); }
    p.textContent = '★ My day (' + picks.length + ')';
  }

  // ---- /my/: the personal timeline --------------------------------------------------------------------------
  var H = 3600000;
  function hm(t) { return new Date(t).toISOString().slice(11, 16); }
  function dayKey(t) { return new Date(t).toISOString().slice(0, 10); }
  function areaOf(e) { var m = /\(([^()]+)\)\s*$/.exec(e.place || ''); return /^online\b/i.test(e.place || '') || e.status === 'online' ? 'online' : (m ? m[1].split(/[\/,]/)[0].trim().toLowerCase() : ''); }
  function span(e) { var s = Date.parse(e.start), en = Date.parse(e.end); if (isNaN(s)) return null; return { s: s, e: isNaN(en) ? s + 2 * H : en, x: isNaN(en) }; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dur(ms) { var m = Math.round(ms / 60000), h = Math.floor(m / 60); return (h ? h + ' h ' : '') + (m % 60 ? (m % 60) + ' min' : '').trim() || '0 min'; }
  function dayName(k, today) {
    var d = new Date(k + 'T00:00:00Z'), w = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()];
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
    return (k === today ? 'Today' : k === dayKey(Date.parse(today + 'T00:00:00Z') + 24 * H) ? 'Tomorrow' : w) + ' · ' + w.slice(0, 3) + ' ' + d.getUTCDate() + ' ' + m;
  }

  function mySetup() {
    var root = $('#myday'); if (!root) return;
    var q = ''; try { q = new URLSearchParams(location.search).get('my') || ''; } catch (e) { }
    var linkIds = q.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return ID.test(x); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, MAXN);
    var imported = linkIds.length > 0;
    var events = null, byId = {};
    function ids() { return imported ? linkIds : picks; }

    function row(e, sp, clashWith) {
      var st = e.status || 'unknown', label = { on: 'On', online: 'Online', moved: 'Moved', cancelled: 'Cancelled' }[st] || 'Unknown';
      return '<li class="my-row st-' + esc(st) + (clashWith.length ? ' my-clash' : '') + '"><span class="my-t">' + hm(sp.s) + '</span><span class="my-dot" aria-hidden="true"></span><div class="my-c">' +
        '<a class="my-n" href="/e/' + esc(e.id) + '/">' + esc(e.name) + '</a>' +
        '<div class="my-m"><span class="my-chip">' + label + '</span> ' + hm(sp.s) + (sp.x ? ' (end not stated)' : '–' + hm(sp.e)) + ' UTC · ' + esc((areaOf(e) === 'online' ? 'Online' : (e.place || 'place not stated')).slice(0, 70)) + '</div>' +
        (clashWith.length ? '<div class="my-warn"><b>Clash</b> with ' + clashWith.map(function (c) { return esc(c.name.slice(0, 60)); }).join('; ') + '. Keep both or pick one.</div>' : '') +
        '<div class="my-act">' + (imported ? '' : '<button type="button" class="my-btn" data-rm="' + esc(e.id) + '">Remove</button>') + ' <a href="' + esc(e.url) + '">Organiser\'s page</a></div></div></li>';
    }
    function suggest(prev, next, gapS, gapE, pickedSet, today) {
      var areas = [prev && areaOf(prev.e), next && areaOf(next.e)].filter(function (a) { return a && a !== 'online'; });
      var out = [];
      events.forEach(function (e) {
        if (pickedSet[e.id] || e.status === 'cancelled') return;
        var sp = span(e); if (!sp || sp.s < gapS || sp.s > gapE - 30 * 60000 || sp.e > gapE + 15 * 60000) return;
        var a = areaOf(e); if (!(areas.length ? areas.indexOf(a) >= 0 : false)) return;
        out.push({ e: e, sp: sp });
      });
      out.sort(function (a, b) { return a.sp.s - b.sp.s; });
      return out.slice(0, 2);
    }
    function paintMy() {
      if (!events) return;
      var list = ids().map(function (id) { return byId[id]; }).filter(Boolean);
      var missing = ids().length - list.length, head = '', body = '';
      var today = dayKey(Date.now());
      if (imported) head += '<div class="my-banner"><p><b>You opened a shared day</b> with ' + list.length + ' event' + (list.length === 1 ? '' : 's') + '. It is not saved in your browser yet.</p><p><button type="button" class="my-btn my-primary" id="my-save">Add these to my day</button> <a href="/my/">See my own day</a></p></div>';
      if (!list.length) {
        body = '<p class="my-empty">' + (imported ? 'Nothing in this link matches an event we list.' : 'Nothing picked yet. Tap the star ☆ on any event, on the home page, the programme or an event page, and it appears here as a timeline.') + ' <a href="/">Back to today in Lisbon</a>.</p>';
      } else {
        var days = {}; list.forEach(function (e) { var sp = span(e); if (!sp) return; (days[dayKey(sp.s)] = days[dayKey(sp.s)] || []).push({ e: e, sp: sp }); });
        var keys = Object.keys(days).sort(function (a, b) { return (a === today ? -1 : b === today ? 1 : 0) || a.localeCompare(b); });
        var pickedSet = {}; list.forEach(function (e) { pickedSet[e.id] = 1; });
        var clashes = 0;
        keys.forEach(function (k) {
          var items = days[k].sort(function (a, b) { return a.sp.s - b.sp.s; });
          body += '<h2 class="my-day">' + dayName(k, today) + ' <span class="my-cnt">' + items.length + '</span></h2><ol class="my-flow">';
          var maxEnd = 0, prev = null;
          items.forEach(function (it, i) {
            var cw = items.filter(function (o) { return o !== it && o.e.status !== 'cancelled' && it.e.status !== 'cancelled' && o.sp.s < it.sp.e && it.sp.s < o.sp.e; }).map(function (o) { return o.e; });
            if (cw.length) clashes++;
            if (i > 0 && it.sp.s - maxEnd >= 45 * 60000) {
              var sg = suggest(prev, it, maxEnd, it.sp.s, pickedSet, today);
              body += '<li class="my-gap"><span class="my-t"></span><span class="my-dot my-dot-g" aria-hidden="true"></span><div class="my-c"><div class="my-gapl">Free ' + dur(it.sp.s - maxEnd) + ', ' + hm(maxEnd) + ' to ' + hm(it.sp.s) + ' UTC</div>' +
                (sg.length ? '<div class="my-sug">Nearby in that gap: ' + sg.map(function (s) { return '<span><a href="/e/' + esc(s.e.id) + '/">' + esc(s.e.name.slice(0, 54)) + '</a> ' + hm(s.sp.s) + ' <button type="button" class="my-btn my-sm" data-add="' + esc(s.e.id) + '">+ Add</button></span>'; }).join(' ') + '</div>' : '') + '</div></li>';
            }
            body += row(it.e, it.sp, cw);
            if (it.sp.e > maxEnd) maxEnd = it.sp.e; prev = it;
          });
          body += '</ol>';
        });
        head += '<p class="my-sum"><b>' + list.length + '</b> picked' + (clashes ? ' · <b class="my-red">' + clashes + '</b> in a clash' : ' · no clashes') + (missing ? ' · ' + missing + ' no longer listed' : '') + '</p>';
        var link = location.origin + '/my/?my=' + ids().join(',');
        body += '<div class="my-share"><h2>Take it with you</h2><p>The link carries only the event ids. No account, nothing is sent to us; the picks live in this browser.</p>' +
          '<p><button type="button" class="my-btn my-primary" id="my-share">Share my day</button> ' + (imported ? '' : '<button type="button" class="my-btn" id="my-clear">Remove all</button>') + ' <span id="my-note" class="muted" role="status" aria-live="polite"></span></p>' +
          '<p class="my-link"><input readonly value="' + esc(link) + '" aria-label="Link to this day" onclick="this.select()"></p></div>';
      }
      root.innerHTML = head + body;
    }
    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-rm')) { remove(t.getAttribute('data-rm')); }
      else if (t.hasAttribute('data-add')) { var id = t.getAttribute('data-add'); if (!has(id)) setAll(picks.concat(id)); }
      else if (t.id === 'my-clear') { if (confirm('Remove all ' + picks.length + ' events from my day?')) setAll([]); }
      else if (t.id === 'my-save') { setAll(picks.concat(linkIds)); history.replaceState(null, '', '/my/'); imported = false; linkIds = []; paintMy(); }
      else if (t.id === 'my-share') {
        var url = location.origin + '/my/?my=' + ids().join(','), note = $('#my-note');
        var say = function (m) { if (note) { note.textContent = m; setTimeout(function () { note.textContent = ''; }, 3500); } };
        if (navigator.share) { navigator.share({ title: 'My day at Lisbon Tech Fringe', url: url }).catch(function () { }); }
        else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(function () { say('Link copied'); }, function () { say('Copy the link below'); }); }
        else { say('Copy the link below'); }
      }
    });
    listeners.push(paintMy);
    root.innerHTML = '<p class="muted">Loading your day…</p>';
    fetch('/api/v1/events.json').then(function (r) { return r.json(); }).then(function (d) {
      events = d.events || d; (events || []).forEach(function (e) { if (e.id) byId[e.id] = e; }); paintMy();
    }).catch(function () { root.innerHTML = '<p class="my-empty">The events could not be loaded. Try again in a minute.</p>'; });
  }

  // ---- start -----------------------------------------------------------------------------------------------
  function start() {
    decorate(); eventPage(); pill(); mySetup();
    var timer = null;
    new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(function () { decorate(); }, 120); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.ltfMyDay = { has: has, toggle: toggle, all: function () { return picks.slice(); } };
})();
