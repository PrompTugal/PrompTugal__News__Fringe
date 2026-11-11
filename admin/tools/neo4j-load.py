#!/usr/bin/env python3
"""Load the Lisbon Tech Fringe swarm into Neo4j as a property graph (neo4j.1.fringe@PrompTugal.dinis, WS-215).

Sources (all in this repository or on our own public site):
  - the fringe graph: _site/api/v1/graph.json if built, else https://lisbontechfringe.com/api/v1/graph.json
  - the agentic runs: data/altitude-runs.json (A4..A0 units, parent to child, the key that signed each)
  - the grants: abp/policies.json; the hourly findings: `node abp/tools/abp.mjs review-export` (abp/reviews/)
  - the commits on dev (git log): who authored what, for whom, which file, and which of Dinis's words they act on
  - the keys: data/keys.json (public fingerprints only)
  - the live flows: data/elastic-export-swarm-flows.json (Elastic swarm-flows, re-exported hourly; --flows FILE for another)

The grammar is neo4j/grammar.json: every relationship type is a verb with an inverse; anything else is refused.
Every node carries the label :Fringe as well as its own, so --wipe removes only what this loader made.

Usage:
  python3 admin/tools/neo4j-load.py --emit /tmp/fringe.cypher          # Cypher file, no database needed
  python3 admin/tools/neo4j-load.py --load [--wipe]                     # into NEO4J_CLOUD (Aura), or --uri/--user/--password-file
  python3 admin/tools/neo4j-load.py --load --uri bolt://127.0.0.1:7687 --password-file ~/promptugal/.neo4j-local-pw

It never prints a password or a URI's credentials. NEO4J_CLOUD may hold JSON ({uri, username, password, database})
or the KEY=VALUE text Aura gives on download (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE).
"""
import argparse, fnmatch, hashlib, json, os, re, subprocess, sys, tempfile, urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GRAMMAR = json.loads((ROOT / 'neo4j/grammar.json').read_text())['verbs']
SITE_GRAPH = 'https://lisbontechfringe.com/api/v1/graph.json'
AGENT_RE = re.compile(r'^([A-Za-z][\w.-]*)@PrompTugal\.([a-z]+)$', re.I)
# Dinis's words as commits quote them: 'Dinis, 19:33 UTC: "can you ..."', "(Dinis, brief 15: 'The agents ...')"
WORD_RE = re.compile(r'Dinis(?P<pre>[^"\u201c\n]{0,60}?)[:)]\s*["\u201c](?P<text>[^"\u201d]{4,600}?)["\u201d]')


class G:
    def __init__(self):
        self.nodes = {}                     # (label, id) -> props
        self.rels = {}                      # (type, fl, fid, tl, tid) -> props

    def node(self, label, nid, /, **props):
        if nid is None or nid == '':
            return None
        key = (label, str(nid))
        cur = self.nodes.setdefault(key, {})
        for k, v in props.items():
            v = clean(v)
            if v is not None:
                cur[k] = v
        return key

    def rel(self, a, verb, b, /, **props):
        if a is None or b is None:
            return
        if verb not in GRAMMAR:
            raise SystemExit(f'neo4j-load: {verb} is not a verb in neo4j/grammar.json (no relates_to)')
        k = (verb, a[0], a[1], b[0], b[1])
        cur = self.rels.setdefault(k, {})
        for p, v in props.items():
            v = clean(v)
            if v is not None:
                cur[p] = v


def clean(v):
    if v is None:
        return None
    if isinstance(v, (bool, int, float, str)):
        return v
    if isinstance(v, list):
        if all(isinstance(x, str) for x in v):
            return v
        if all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
            return v
        return json.dumps(v, ensure_ascii=False)
    return json.dumps(v, ensure_ascii=False)


def person_of(agent):
    m = AGENT_RE.match(agent or '')
    return m.group(2).lower() if m else None


def agent_node(g, name, **props):
    if not name:
        return None
    a = g.node('Agent', name, name=name, person=person_of(name), **props)
    p = person_of(name)
    if p:
        g.rel(g.node('Person', p, name=p), 'OPERATES', a)
    return a


# ---------- the grants (abp/policies.json) ----------
def glob_re(glob):
    glob = glob.split('#')[0]
    out, i = '', 0
    while i < len(glob):
        if glob.startswith('**', i):
            out += '.*'; i += 2
        elif glob[i] == '*':
            out += '[^/]*'; i += 1
        elif glob[i] == '{':
            j = glob.index('}', i); out += '[^/]+'; i = j + 1
        else:
            out += re.escape(glob[i]); i += 1
    return re.compile('^' + out + '$')


def load_policies(g):
    P = json.loads((ROOT / 'abp/policies.json').read_text())
    for a in ['A4', 'A3', 'A2', 'A1', 'A0']:
        g.node('Altitude', a, name=a, means={'A4': 'swarm', 'A3': 'agent', 'A2': 'loop', 'A1': 'LLM call', 'A0': 'compute'}[a])
    for r in P['core']:
        mode = ((P.get('enforcement') or {}).get('rules', {}).get(r['id']) or {}).get('mode', P.get('mode', 'observe'))
        g.node('Rule', r['id'], name=r['id'], rule=r['rule'], barrier=r.get('barrier'), mode=mode)
    lanes = {'_common': [glob_re(w) for w in P.get('common', {}).get('writes', [])]}
    for role, R in P['roles'].items():
        if not isinstance(R, dict):
            continue
        rk = g.node('Role', role, name=role, focus=R.get('focus'), never=R.get('never'),
                    altitude=P['altitudes'].get('by_role', {}).get(role, P['altitudes'].get('default', 'A3')))
        lanes[role] = [glob_re(w) for w in R.get('writes', [])]
        for w in R.get('writes', []):
            g.rel(rk, 'MAY_WRITE', g.node('Path', w, glob=w), via='role')
        for h in R.get('send_hosts', []) or []:
            g.rel(rk, 'MAY_SEND_TO', g.node('Host', h, name=h), via='role')
    for name, A in P['agents'].items():
        if not isinstance(A, dict) or '@' not in name:
            continue
        role = A.get('role')
        alt = P['altitudes'].get('by_role', {}).get(role, P['altitudes'].get('default', 'A3'))
        a = agent_node(g, name, role=role, account=A.get('account'), branch=A.get('branch', 'dev'), has_grant=True)
        g.rel(a, 'PLAYS', g.node('Role', role, name=role))
        g.rel(a, 'WORKS_AT', g.node('Altitude', alt))
        lanes[name] = [glob_re(w) for w in A.get('extra_writes', []) or []]
        for w in A.get('extra_writes', []) or []:
            g.rel(a, 'MAY_WRITE', g.node('Path', w, glob=w), via='extra')
        for h in A.get('send_hosts', []) or []:
            g.rel(a, 'MAY_SEND_TO', g.node('Host', h, name=h), via='extra')
        for f in A.get('owns_shared', []) or []:
            g.rel(a, 'OWNS', g.node('File', f, path=f))
    for it in (P.get('shared_files') or {}).get('items', []):
        if '@' in (it.get('owner') or ''):
            g.rel(agent_node(g, it['owner']), 'OWNS', g.node('File', it['file'], path=it['file']), writers_seen=it.get('writers_seen'))
    return P, lanes


# ---------- the keys (public fingerprints only) ----------
def load_keys(g):
    for k in json.loads((ROOT / 'data/keys.json').read_text()).get('keys', []):
        b = k.get('bundle') or {}
        fp = b.get('fingerprint')
        if fp and k.get('agent'):
            g.rel(agent_node(g, k['agent']), 'HOLDS_KEY',
                  g.node('Key', fp, fingerprint=fp, signing_fingerprint=b.get('signing_fingerprint'), kind='agent session key',
                         status=k.get('status'), added=k.get('added')))


# ---------- the agentic runs ----------
def load_runs(g):
    D = json.loads((ROOT / 'data/altitude-runs.json').read_text())
    units = {d['id']: d for d in D['docs']}
    for d in D['docs']:
        run = g.node('Run', d['run'], name=d['run'], kind=d.get('run_kind'), objective=d.get('objective'), environment=d.get('environment'))
        if d.get('runner'):
            g.rel(agent_node(g, d['runner']), 'RAN', run)
        props = {k: v for k, v in d.items() if k not in ('run', 'parent', 'reach_exposed', 'id')}
        props['name'] = d.get('unit')
        u = g.node('Unit', d['id'], **props)
        g.rel(run, 'CONTAINS', u)
        g.rel(u, 'IS_AT', g.node('Altitude', d['altitude']))
        if d.get('parent') in units:
            g.rel(g.node('Unit', d['parent']), 'HANDS_TO', u)
        if d.get('key_fp'):
            g.rel(g.node('Key', d['key_fp'], fingerprint=d['key_fp'], kind='unit key'), 'SIGNED', u, verified=d.get('verified'), at=d.get('signed_at'))
        for r in d.get('reach_exposed') or []:
            verb, *rest = r.split('.')
            g.rel(u, 'EXPOSES', g.node('Reach', r, name=r, verb=verb, object=rest[0] if rest else None, scope=rest[1] if len(rest) > 1 else None))
        if d.get('model'):
            g.rel(u, 'CALLS', g.node('Model', d['model'], name=d['model']), cost_usd=d.get('cost_usd'), latency_ms=d.get('latency_ms'))
        if d.get('item'):
            g.rel(u, 'WORKS_ON', g.node('Item', d['item'], name=d['item'], file=f"work/{d['item'].split('/',1)[-1]}.md"))
    return len(D['docs'])


# ---------- the findings (abp review-export, one document per finding per round) ----------
def load_findings(g, P, lanes):
    out = Path(tempfile.gettempdir()) / 'neo4j-abp-reviews.json'
    subprocess.run(['node', 'abp/tools/abp.mjs', 'review-export', '--out', str(out)], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    docs = json.loads(out.read_text())
    rounds = {r['round']: r for r in (P.get('review') or {}).get('rounds', [])}
    n = 0
    for d in docs:
        rv = g.node('Review', f"round-{d['round']}", name=f"round {d['round']}", round=d['round'], file=d.get('round_file'), at=d.get('at') if d.get('kind') == 'round summary' else None,
                    note=rounds.get(d['round'], {}).get('note'))
        if d.get('kind') == 'round summary':
            g.node('Review', f"round-{d['round']}", commits=d.get('commits'), findings=d.get('findings'))
            continue
        n += 1
        f = g.node('Finding', d['id'], name=f"{d['rule']} {d.get('file') or ''}".strip(), rule=d['rule'], kind=d.get('kind'), why=d.get('why'),
                   mode=d.get('mode'), at=d.get('at'), area=d.get('area'), round=d['round'])
        g.rel(rv, 'RECORDS', f)
        g.rel(f, 'BREACHES', g.node('Rule', d['rule']))
        if d.get('agent') and d['agent'] != '(none)':
            g.rel(f, 'FLAGS', agent_node(g, d['agent']))
        if d.get('file'):
            g.rel(f, 'CONCERNS', g.node('File', d['file'], path=d['file']))
        if d.get('commit'):
            g.rel(f, 'CITES', g.node('Commit', d['commit']))
    return n


# ---------- the commits on dev ----------
def load_commits(g, lanes, since):
    raw = subprocess.run(['git', 'log', '--no-merges', f'--since={since}', '--format=%x1e%h%x1f%p%x1f%cI%x1f%s%x1f%b%x1f', '--name-only'],
                         cwd=ROOT, check=True, capture_output=True, text=True).stdout
    words, n = 0, 0
    for rec in raw.split('\x1e')[1:]:
        h, parents, at, subject, body, files = (rec.split('\x1f') + [''] * 6)[:6]
        t = re.search(r'^Agent:\s*(\S+)', body, re.M)
        s = re.match(r'^([A-Za-z][\w.-]*@[\w.-]+?)(?:\s*\([^)]*\))?:\s', subject)
        agent = (t and t.group(1)) or (s and s.group(1))
        fr = re.search(r'^For:\s*(.+)$', body, re.M)
        files = [x.strip() for x in files.split('\n') if x.strip()]
        c = g.node('Commit', h, sha=h, subject=subject[:300], at=at.replace('+00:00', 'Z'), agent=agent, files=len(files))
        n += 1
        for p in parents.split():
            g.rel(c, 'FOLLOWS', g.node('Commit', p))
        a = agent_node(g, agent) if agent and '@' in agent else None
        g.rel(a, 'AUTHORED', c)
        if fr:
            target = fr.group(1).strip()
            if '@' in target:
                g.rel(c, 'IS_FOR', agent_node(g, target.split()[0]))
            elif 'dinis' in target.lower():
                g.rel(c, 'IS_FOR', g.node('Person', 'dinis', name='dinis'))
        own_role = None
        if a:
            own_role = g.nodes.get(a, {}).get('role')
        for f in files:
            fk = g.node('Brief' if f.startswith('briefs/') and f.endswith('.md') else 'File', f, path=f)
            if fk[0] == 'Brief':
                g.rel(g.node('Person', 'dinis', name='dinis'), 'GAVE', fk)
            g.rel(c, 'CHANGES', fk)
            # a lane: the roles whose writes cover this file. A commit crosses into a lane that is not its author's.
            if own_role and own_role not in ('lead',):
                mine = any(rx.match(f) for rx in lanes.get(own_role, []) + lanes['_common'] + lanes.get(agent, []))
                if not mine:
                    for role, rxs in lanes.items():
                        if role != own_role and not role.startswith('_') and '@' not in role and any(rx.match(f) for rx in rxs):
                            g.rel(c, 'CROSSES_INTO', g.node('Role', role), file=f)
        for m in WORD_RE.finditer(subject + '\n' + body):
            text = ' '.join(m.group('text').split())
            when = re.search(r'(\d{1,2}:\d[\dx])\s*UTC', m.group('pre'))
            brief = re.search(r'brief\s*(\d+)', m.group('pre'), re.I)
            wid = 'word:' + hashlib.sha256(text.encode()).hexdigest()[:12]
            w = g.node('Word', wid, text=text, name=text[:60], said_at=when.group(1) if when else None,
                       brief=int(brief.group(1)) if brief else None, first_seen=at.replace('+00:00', 'Z'))
            g.rel(g.node('Person', 'dinis', name='dinis'), 'SAID', w)
            g.rel(c, 'ACTS_ON', w)
            words += 1
    return n, words


# ---------- the fringe graph ----------
def load_fringe(g, path):
    if path and Path(path).exists():
        data = json.loads(Path(path).read_text())
    elif (ROOT / '_site/api/v1/graph.json').exists():
        data = json.loads((ROOT / '_site/api/v1/graph.json').read_text())
    else:
        with urllib.request.urlopen(SITE_GRAPH, timeout=30) as r:
            data = json.loads(r.read())
    label = {'event': 'Event', 'community': 'Community', 'topic': 'Topic', 'place': 'Place', 'festival': 'Festival'}
    by_id = {}
    for n in data['nodes']:
        L = label.get(n.get('type'))
        if not L:
            continue
        props = {k: v for k, v in n.items() if k not in ('x', 'y', 'type', 'id')}
        props['name'] = n.get('label')
        by_id[n['id']] = g.node(L, n['id'], **props)
    fv = {v['fringe_verb']: k for k, v in GRAMMAR.items() if v.get('fringe_verb')}
    for e in data['edges']:
        verb = fv.get(e['verb'])
        if verb is None:
            raise SystemExit(f"neo4j-load: fringe verb '{e['verb']}' has no entry in neo4j/grammar.json")
        g.rel(by_id.get(e['from']), verb, by_id.get(e['to']), source=e.get('source'), read_at=e.get('read_at'))
    return data.get('version'), len(by_id), len(data['edges'])


# ---------- Elastic swarm-flows (data/elastic-export-swarm-flows.json, exported by elastic.1 / architect.1) ----------
# One document per phase (start, step, end) of a unit. Only the newest carry OTel trace_id/span_id/parent_span_id,
# so a span's parent is found through unit_id -> parent_id first, then parent_span_id.
def load_flows(g, path):
    txt = Path(path).read_text()
    try:
        docs = json.loads(txt)
        if isinstance(docs, dict):
            docs = docs.get('docs') or docs.get('hits', {}).get('hits', [])
    except json.JSONDecodeError:
        docs = [json.loads(l) for l in txt.splitlines() if l.strip()]
    docs = [d.get('_source', d) for d in docs]
    units, by_span = {}, {}
    for d in sorted(docs, key=lambda d: (d.get('seq') or 0, d.get('at') or '')):
        uid = d.get('unit_id') or d.get('span_id') or (d.get('span') or {}).get('id')
        if not uid:
            continue
        u = units.setdefault(uid, {'phases': []})
        u['phases'].append(d.get('phase'))
        for k in ('flow', 'altitude', 'role', 'runner', 'person', 'environment', 'model', 'key_fp', 'trace_id', 'span_id', 'parent_span_id', 'parent_id', 'valid'):
            if d.get(k) is not None:
                u[k] = d[k]
        if d.get('phase') == 'start' or 'started' not in u:
            u.setdefault('started', d.get('at'))
        if d.get('phase') == 'end':
            u['ended'] = d.get('at')
        if d.get('span_id'):
            by_span[d['span_id']] = uid
    from datetime import datetime
    ts = lambda x: datetime.fromisoformat(x.replace('Z', '+00:00'))
    run_keys = {props.get('key_fp'): key for key, props in g.nodes.items() if key[0] == 'Unit' and props.get('key_fp')}
    for uid, u in units.items():
        dur = int((ts(u['ended']) - ts(u['started'])).total_seconds() * 1000) if u.get('ended') and u.get('started') else None
        s = g.node('Span', uid, unit_id=uid, name=f"{u.get('altitude', '')} {u.get('role', '')} {uid[-8:]}".strip(), flow=u.get('flow'),
                   altitude=u.get('altitude'), role=u.get('role'), runner=u.get('runner'), model=u.get('model'), valid=u.get('valid'),
                   key_fp=u.get('key_fp'), trace_id=u.get('trace_id'), span_id=u.get('span_id'), started=u.get('started'), ended=u.get('ended'),
                   duration_ms=dur, phases=[p for p in u['phases'] if p], finished=bool(u.get('ended')))
        if u.get('flow'):
            g.rel(s, 'BELONGS_TO', g.node('Flow', u['flow'], name=u['flow']))
        if u.get('trace_id'):
            g.rel(s, 'BELONGS_TO', g.node('Trace', u['trace_id'], trace_id=u['trace_id']))
        parent = u.get('parent_id') if u.get('parent_id') in units else by_span.get(u.get('parent_span_id'))
        if parent:
            g.rel(s, 'IS_CHILD_OF', g.node('Span', parent))
        if u.get('altitude'):
            g.rel(s, 'IS_AT', g.node('Altitude', u['altitude']))
        if u.get('key_fp'):
            g.rel(g.node('Key', u['key_fp'], fingerprint=u['key_fp']), 'SIGNED', s)
            if u['key_fp'] in run_keys:
                g.rel(s, 'IS_LIVE_VIEW_OF', run_keys[u['key_fp']])
        if u.get('runner') and '@' in u['runner']:
            g.rel(agent_node(g, u['runner']), 'EMITTED', s)
    return len(units)


def build(args):
    g = G()
    P, lanes = load_policies(g)
    load_keys(g)
    stats = {'units': load_runs(g)}
    stats['findings'] = load_findings(g, P, lanes)
    stats['commits'], stats['words'] = load_commits(g, lanes, args.since)
    stats['fringe_version'], stats['fringe_nodes'], stats['fringe_edges'] = load_fringe(g, args.graph)
    flows = args.flows or (ROOT / 'data/elastic-export-swarm-flows.json')
    if Path(flows).exists():
        stats['spans'] = load_flows(g, flows)
    for v, s in GRAMMAR.items():
        g.node('Verb', v, name=v, says=s['says'], inverse=s['inverse'], subject=s['from'], object=s['to'])
    return g, stats


# ---------- writing ----------
def batches(g):
    by_label = defaultdict(list)
    for (L, i), p in g.nodes.items():
        by_label[L].append({'id': i, 'p': p})
    by_rel = defaultdict(list)
    for (v, fl, fi, tl, ti), p in g.rels.items():
        if (fl, fi) in g.nodes and (tl, ti) in g.nodes:
            by_rel[(v, fl, tl)].append({'a': fi, 'b': ti, 'p': p})
    stmts = [f'CREATE CONSTRAINT fringe_{L.lower()}_id IF NOT EXISTS FOR (n:{L}) REQUIRE n.id IS UNIQUE' for L in sorted(by_label)]
    work = []
    for L, rows in sorted(by_label.items()):
        work.append((f'UNWIND $rows AS r MERGE (n:{L} {{id: r.id}}) SET n:Fringe SET n += r.p', rows))
    for (v, fl, tl), rows in sorted(by_rel.items()):
        inv = GRAMMAR[v]['inverse'].replace("'", "\\'")
        work.append((f"UNWIND $rows AS r MATCH (a:{fl} {{id: r.a}}) MATCH (b:{tl} {{id: r.b}}) "
                     f"MERGE (a)-[e:{v}]->(b) SET e += r.p, e.inverse = '{inv}'", rows))
    return stmts, work


def cy(v):
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=True)       # Cypher reads "..." with \" \\ \n \uXXXX
    if isinstance(v, list):
        return '[' + ', '.join(cy(x) for x in v) + ']'
    if isinstance(v, dict):
        return '{' + ', '.join(f'`{k}`: {cy(x)}' for k, x in v.items()) + '}'
    return 'null'


def emit(g, path):
    stmts, work = batches(g)
    with open(path, 'w') as f:
        f.write('// Lisbon Tech Fringe swarm graph (admin/tools/neo4j-load.py). Run with cypher-shell -f, or paste in Neo4j Browser.\n')
        for s in stmts:
            f.write(s + ';\n')
        for q, rows in work:
            for i in range(0, len(rows), 200):
                f.write(q.replace('UNWIND $rows AS r', f'UNWIND {cy(rows[i:i+200])} AS r', 1) + ';\n')


def creds(args):
    raw = os.environ.get('NEO4J_CLOUD') or os.environ.get('NEO4J__CLOULD')
    bare = bool(raw) and re.fullmatch(r'[A-Za-z0-9_\-]{16,}', raw.strip()) is not None  # a password alone, as in Aura's console
    uri = args.uri or os.environ.get('NEO4J_URI')
    if uri:
        if args.password_file:
            pw = Path(os.path.expanduser(args.password_file)).read_text().strip()
        elif bare:
            pw = raw.strip()
        else:
            pw = ''
        return {'uri': uri, 'user': args.user, 'password': pw, 'database': args.database}
    if bare:
        raise SystemExit('neo4j-load: NEO4J_CLOUD holds a password only, with no URI. Give the instance URI with '
                         '--uri neo4j+s://<instance id>.databases.neo4j.io (or NEO4J_URI); the URI is not a secret')
    if not raw:
        raise SystemExit('neo4j-load: no NEO4J_CLOUD in this session (environment variables reach a session at its start) and no --uri')
    try:
        j = json.loads(raw)
        c = {'uri': j.get('uri') or j.get('NEO4J_URI'), 'user': j.get('username') or j.get('user') or j.get('NEO4J_USERNAME') or 'neo4j',
             'password': j.get('password') or j.get('NEO4J_PASSWORD'), 'database': j.get('database') or j.get('NEO4J_DATABASE')}
    except (json.JSONDecodeError, AttributeError):
        kv = dict(re.findall(r'^\s*([A-Z_]+)\s*=\s*(\S+)\s*$', raw, re.M))
        c = {'uri': kv.get('NEO4J_URI'), 'user': kv.get('NEO4J_USERNAME', 'neo4j'), 'password': kv.get('NEO4J_PASSWORD'), 'database': kv.get('NEO4J_DATABASE')}
        if not c['uri']:
            parts = raw.split()
            if parts and re.match(r'^(neo4j|bolt)(\+s|\+ssc)?://', parts[0]):
                c = {'uri': parts[0], 'user': parts[1] if len(parts) > 2 else 'neo4j', 'password': parts[-1], 'database': None}
    missing = [k for k in ('uri', 'password') if not c.get(k)]
    if missing:
        raise SystemExit(f'neo4j-load: NEO4J_CLOUD is set but has no {", ".join(missing)} (fields read: uri, username, password, database)')
    return c


def load(g, args):
    from neo4j import GraphDatabase
    c = creds(args)
    host = re.sub(r'//[^@/]*@', '//', c['uri'])
    stmts, work = batches(g)
    with GraphDatabase.driver(c['uri'], auth=(c['user'], c['password']), notifications_min_severity='OFF') as drv:
        drv.verify_connectivity()
        kw = {'database': c['database']} if c.get('database') else {}
        with drv.session(**kw) as s:
            if args.wipe:
                s.run('MATCH (n:Fringe) CALL (n) { DETACH DELETE n } IN TRANSACTIONS OF 5000 ROWS').consume()
            for q in stmts:
                s.run(q).consume()
            for q, rows in work:
                for i in range(0, len(rows), 1000):
                    s.run(q, rows=rows[i:i + 1000]).consume()
            n = s.run('MATCH (n:Fringe) RETURN count(n) AS n').single()['n']
            r = s.run('MATCH (:Fringe)-[e]->(:Fringe) RETURN count(e) AS n').single()['n']
    print(f'neo4j-load: {n} nodes, {r} relationships in {host.split("://")[0]}://{host.split("://")[-1].split(":")[0]}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--emit', help='write a Cypher file')
    ap.add_argument('--load', action='store_true', help='load into Neo4j')
    ap.add_argument('--wipe', action='store_true', help='first remove every :Fringe node')
    ap.add_argument('--uri'); ap.add_argument('--user', default='neo4j'); ap.add_argument('--password-file'); ap.add_argument('--database')
    ap.add_argument('--graph', help='a local graph.json (default: _site/ or the live site)')
    ap.add_argument('--flows', help='an Elastic swarm-flows export (default data/elastic-export-swarm-flows.json)')
    ap.add_argument('--since', default='2026-11-09T00:00Z', help='commits since (git log --since)')
    ap.add_argument('--stats', help='write a summary JSON (e.g. data/neo4j-stats.json)')
    args = ap.parse_args()
    g, stats = build(args)
    labels = defaultdict(int)
    for (L, _) in g.nodes:
        labels[L] += 1
    verbs = defaultdict(int)
    for k in g.rels:
        verbs[k[0]] += 1
    stats.update(nodes=len(g.nodes), relationships=len(g.rels), by_label=dict(sorted(labels.items())), by_verb=dict(sorted(verbs.items())))
    print('neo4j-load:', json.dumps({k: stats.get(k) for k in ('nodes', 'relationships', 'units', 'findings', 'commits', 'words', 'fringe_nodes', 'spans')}))
    if args.stats:
        Path(args.stats).write_text(json.dumps(stats, indent=1) + '\n')
    if args.emit:
        emit(g, args.emit)
        print(f'neo4j-load: Cypher written to {args.emit} ({os.path.getsize(args.emit)} bytes)')
    if args.load:
        load(g, args)


if __name__ == '__main__':
    main()
