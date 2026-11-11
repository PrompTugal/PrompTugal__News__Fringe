#!/usr/bin/env python3
"""Jose's send desk: one page that makes sending fast, while a person still sends.

Reads work/drafts/organiser-notes-today-jose.md, linkedin-post-jose.md and x-thread-jose.md and writes
team/jose/agents/researcher.1/send-desk.html (self-contained, no network, no contact details).
Nothing here sends anything: each card copies the text and opens the organiser's public page; Jose presses send.
Run from the repository root: python3 team/jose/agents/researcher.1/send-desk.py
By researcher.1.fringe@PrompTugal.jose (WS-215), at Jose's word, 11 November 2026.
"""
import datetime, html, json, re

D = 'work/drafts/'
now = datetime.datetime.now(datetime.timezone.utc)
today = now.strftime('%Y-%m-%d')


def body_after_rule(path):
    """The text after the first '---' line (the draft itself, without the drafting notes)."""
    s = open(path, encoding='utf8').read()
    parts = re.split(r'(?m)^---\s*$', s, maxsplit=1)
    return parts[1].strip() if len(parts) > 1 else s.strip()


def plain(md):
    return re.sub(r'\*\*(.+?)\*\*', r'\1', md).strip()


# organiser notes: the table gives the source link, the sections give the text
notes_md = open(D + 'organiser-notes-today-jose.md', encoding='utf8').read()
rows = {}
for m in re.finditer(r'(?m)^\| (\d+) \| (\d\d:\d\d) \| (.+?) \| (.+?) \| (.+?) \| (https?://\S+) \| (.+?) \|\s*$', notes_md):
    n, before, org, event, storm, url, verdict = m.groups()
    rows[n] = dict(n=int(n), before=before, org=re.sub(r'\s*\((new|with)[^)]*\)', '', org).strip(), event=event, storm=storm, url=url, verdict=verdict)
notes = []
for m in re.finditer(r'(?ms)^## (\d+)\. (.+?) \(send before (\d\d:\d\d)\)\s*\n(.*?)(?=^## |\Z)', notes_md):
    n, org, before, text = m.groups()
    r = rows.get(n)
    if not r:
        continue
    page = re.search(r'https://lisbontechfringe\.com/e/[\w-]+/', text)
    notes.append(dict(id='note-' + re.sub(r'[^a-z0-9]+', '-', org.lower()).strip('-'), kind='note', title=org, sub=r['event'],
                      before=f"{today}T{before}:00Z", storm=r['storm'], verdict=r['verdict'], url=r['url'], open_label='Open their Luma page',
                      our_page=page.group(0) if page else '', text=plain(text)))

posts = []
li = plain(body_after_rule(D + 'linkedin-post-jose.md'))
posts.append(dict(id='post-linkedin', kind='post', title='LinkedIn post', sub='Your post, in your voice. Read it once and change the opening if you like.',
                  before='', storm='', verdict='draft until you approve it', url='https://www.linkedin.com/feed/?shareActive=true', open_label='Open LinkedIn',
                  our_page='https://lisbontechfringe.com/?via=linkedin', text=li))
x = body_after_rule(D + 'x-thread-jose.md')
for m in re.finditer(r'(?ms)^\*\*(\d)/(\d)\*\*\s*\n(.*?)(?=^\*\*\d/\d\*\*|\Z)', x):
    k, of, text = m.groups()
    posts.append(dict(id=f'post-x-{k}', kind='post', title=f'X thread, post {k} of {of}', sub='Post 1 first, then reply to it with each next one.' if k == '1' else 'Reply to the previous post.',
                      before='', storm='', verdict='draft until you approve it', url='https://x.com/compose/post', open_label='Open X',
                      our_page='', text=plain(text)))

data = dict(built=now.strftime('%Y-%m-%dT%H:%MZ'), items=notes + posts)

PAGE = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jose's send desk</title>
<style>
:root{--bg:#f6f4ef;--card:#fffdf8;--ink:#1c1b19;--muted:#6b665d;--line:#ddd6c8;--accent:#0b5d57;--accent-ink:#fff;--warn:#a23b12;--ok:#2c6e2f;--soft:#efeadf}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151614;--card:#1e201d;--ink:#eeebe3;--muted:#a39e92;--line:#33362f;--accent:#5fc9bf;--accent-ink:#0d1b1a;--warn:#f0946a;--ok:#86c98a;--soft:#272a25}}
:root[data-theme="dark"]{--bg:#151614;--card:#1e201d;--ink:#eeebe3;--muted:#a39e92;--line:#33362f;--accent:#5fc9bf;--accent-ink:#0d1b1a;--warn:#f0946a;--ok:#86c98a;--soft:#272a25}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:1.6rem;line-height:1.2;margin:0 0 4px;text-wrap:balance}
h2{font-size:1.05rem;margin:32px 0 10px;letter-spacing:.02em}
p{margin:0 0 10px}
.lede{color:var(--muted);max-width:60ch}
.bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:16px 0 4px;padding:12px 14px;background:var(--soft);border-radius:10px}
.bar b{font-variant-numeric:tabular-nums}
.bar .grow{flex:1}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:0 0 12px}
.card.sent{opacity:.62}
.card.next{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}
.top{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline}
.top h3{font-size:1.1rem;margin:0;flex:1;min-width:12ch}
.when{font-variant-numeric:tabular-nums;font-weight:600}
.when.late{color:var(--warn)} .when.done{color:var(--ok)} .when.gone{color:var(--muted);font-weight:400}
.sub{color:var(--muted);font-size:.93rem;margin:2px 0 10px}
.steps{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}
button,a.btn{font:inherit;font-size:.95rem;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:9px 14px;cursor:pointer;text-decoration:none;display:inline-block}
button.primary,a.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:600}
button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
details{margin-top:8px}
summary{cursor:pointer;color:var(--muted);font-size:.93rem}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:.95rem;background:var(--soft);border-radius:8px;padding:12px;margin:8px 0 0}
.small{font-size:.88rem;color:var(--muted)}
a{color:var(--accent)}
.report{width:100%;min-height:74px;font:inherit;font-size:.93rem;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
</style>
</head>
<body>
<main>
<h1>Jose's send desk</h1>
<p class="lede">Each card is three taps: copy the text, open the organiser's page, press send there, then mark it sent here. Nothing on this page sends anything. You send.</p>
<div class="bar"><span>Now <b id="clock"></b> UTC (Lisbon time)</span><span id="count"></span><span class="grow"></span><span class="small">Built <span id="built"></span></span></div>

<h2>Organiser notes, in order</h2>
<p class="small">On their Luma page use "Contact the host". Check the page still shows the event as we list it before you paste.</p>
<div id="notes"></div>

<h2>Your posts</h2>
<div id="posts"></div>

<h2>Tell your conductor</h2>
<p class="small">After sending, copy this and paste it into your conductor's session, so the tracker shows what went out.</p>
<textarea class="report" id="report" readonly></textarea>
<div class="steps"><button id="copyreport">Copy the report</button><button id="reset">Clear my marks</button></div>

<p class="small" style="margin-top:32px">Lisbon Tech Fringe is independent of Web Summit. This page holds no contact details and no private person's name. Made by researcher.1.fringe@PrompTugal.jose from work/drafts/; it is rebuilt when the drafts change, and your marks stay in this browser only.</p>
</main>
<script>
const DATA = __DATA__;
const KEY = 'send-desk-' + DATA.built.slice(0, 10);
let marks = {};
try { marks = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch (e) {} };
const hm = d => d.toISOString().slice(11, 16);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
async function copy(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    try { ok = document.execCommand('copy'); } catch (e2) {} t.remove();
  }
  const old = btn.textContent; btn.textContent = ok ? 'Copied' : 'Select the text below and copy it'; setTimeout(() => btn.textContent = old, 1800);
}
function render() {
  const now = new Date();
  document.getElementById('clock').textContent = hm(now);
  document.getElementById('built').textContent = DATA.built.slice(11, 16) + ' UTC';
  const hosts = { note: document.getElementById('notes'), post: document.getElementById('posts') };
  hosts.note.textContent = ''; hosts.post.textContent = '';
  let nextSet = false, sent = 0, open = 0;
  for (const it of DATA.items) {
    const m = marks[it.id], due = it.before ? new Date(it.before) : null;
    const gone = due && now >= due && !m;
    const card = el('div', 'card' + (m ? ' sent' : ''));
    const top = el('div', 'top'); top.appendChild(el('h3', '', it.title));
    let w;
    if (m) { w = el('span', 'when done', 'Sent ' + m + ' UTC'); sent++; }
    else if (gone) w = el('span', 'when gone', 'Started ' + hm(due) + ': skip');
    else if (due) { const mins = Math.round((due - now) / 60000); w = el('span', 'when' + (mins <= 20 ? ' late' : ''), 'Before ' + hm(due) + ' (' + (mins >= 60 ? Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min' : mins + ' min') + ')'); open++; }
    else { w = el('span', 'when', 'Any time today'); open++; }
    top.appendChild(w); card.appendChild(top);
    card.appendChild(el('p', 'sub', it.sub + (it.storm ? ' · Online because of the storm? ' + it.storm : '')));
    if (!m && !gone && !nextSet && it.kind === 'note') { card.classList.add('next'); nextSet = true; }
    const steps = el('div', 'steps');
    const c = el('button', (!m && !gone) ? 'primary' : '', '1. Copy the text'); c.onclick = () => copy(it.text, c); steps.appendChild(c);
    const a = el('a', 'btn', '2. ' + it.open_label); a.href = it.url; a.target = '_blank'; a.rel = 'noopener'; steps.appendChild(a);
    const s = el('button', '', m ? 'Undo sent' : '3. Mark sent');
    s.onclick = () => { if (marks[it.id]) delete marks[it.id]; else marks[it.id] = hm(new Date()); save(); render(); };
    steps.appendChild(s); card.appendChild(steps);
    const d = el('details'); d.appendChild(el('summary', '', 'Read the text')); d.appendChild(el('pre', '', it.text));
    if (it.our_page) { const p = el('p', 'small'); p.append('Our page they will land on: '); const l = el('a', '', it.our_page); l.href = it.our_page; l.target = '_blank'; l.rel = 'noopener'; p.appendChild(l); d.appendChild(p); }
    card.appendChild(d);
    hosts[it.kind].appendChild(card);
  }
  document.getElementById('count').textContent = sent + ' sent · ' + open + ' to go';
  const lines = DATA.items.filter(it => marks[it.id]).map(it => '- ' + it.title + ': sent by Jose at ' + marks[it.id] + ' UTC');
  document.getElementById('report').value = lines.length ? 'Sent today (Jose, by hand):\n' + lines.join('\n') : 'Nothing marked sent yet.';
}
document.getElementById('copyreport').onclick = e => copy(document.getElementById('report').value, e.target);
document.getElementById('reset').onclick = () => { if (confirm('Clear all your sent marks on this page?')) { marks = {}; save(); render(); } };
render(); setInterval(render, 30000);
</script>
</body>
</html>
'''
out = PAGE.replace('__DATA__', json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
open('team/jose/agents/researcher.1/send-desk.html', 'w', encoding='utf8').write(out)
print(f"send-desk.html: {len(notes)} notes, {len(posts)} posts, {len(out)} bytes, built {data['built']}")
