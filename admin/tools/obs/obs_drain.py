#!/usr/bin/env python3
"""Drain Lisbon Fringe's observability lanes (observability.fringe@PrompTugal.dinis, 11 November 2026, at Dinis Cruz's
word, brief 2). PrompTugal.news's newsroom/tools/obs/obs_drain.py (observability@PrompTugal.dinis), with this site's
vaults; its steps are kept, and its transform is cut to the counts /traffic/ shows:

    python3 -I admin/tools/obs/obs_drain.py [--creds ~/.sg-send/obs-fringe/creds.json] [--dry]

L  load: list every lane with the enum key, fetch in batches of 25;
E  extract: open each record with the drain key (identity/private/ in the data vault); an agent run
   (admin/tools/agent-log.mjs) is checked against the agent's own key in data/keys.json (an active key whose agent is
   that agent, the signature over this very record). A failure is kept and marked, never dropped;
S  save raw: each record into the PRIVATE data vault by the hour it happened (events/<day>/<hh>/events.jsonl), once;
   commit and push; only then mark the records processed, so a failed push loses nothing;
T  transform: counts only (views by page, hour, country, city, referrer and ?via= tag; reads; tabs; agents' runs);
   places with fewer than CITY_MIN views fold into their country;
S  save public: data/public.json and latest/traffic.json in the PUBLIC vault (read key in data/obs/vaults.json), and
   data/obs/traffic.json in this repository for /traffic/. No raw event, IP, tab id, time zone or language in either.
Prints counts only, never a key or an event. Every record is an untrusted claim: the lanes' tokens are public.
"""
import argparse, base64, collections, json, os, subprocess, sys, time, urllib.error, urllib.request

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
AGENT = 'observability.fringe@PrompTugal.dinis'
RUN_TYPE = 'web-summit.agent-run/v1'                                      # the team's record type, kept so all sources read alike
SITE = 'fringe.promptugal.news'

def hosts():
    """The site's hosts, counted together (work/30: the move to lisbontechfringe.com): admin/site.json's origin, the
    first address, and the new domain with and without www. Events from any other host (a local test) are not readers."""
    try: origin = json.load(open(os.path.join(ROOT, 'admin', 'site.json')))['origin'].split('//', 1)[-1].strip('/')
    except Exception: origin = SITE
    return {origin, SITE, 'lisbontechfringe.com', 'www.lisbontechfringe.com'}
CITY_MIN = 5
BOTS = {'googlebot', 'bingbot', 'bot', 'webdriver', 'headless'}

def post(c, op, body):
    req = urllib.request.Request(f"{c['host']}/api/vault/append/{op}/{c['vault_id']}", data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', 'x-sgraph-vault-enum-key': c['enum_key']})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        raise SystemExit(f'obs_drain: {op} failed with {e.code}')

def sgit(vault, *args, ok_fail=False):
    r = subprocess.run(['sgit', *args], cwd=vault, capture_output=True, text=True)
    if r.returncode and not ok_fail: raise SystemExit(f"obs_drain: sgit {args[0]} failed (exit {r.returncode}); nothing marked processed")
    return r

def jload(p, default):
    try: return json.load(open(p))
    except Exception: return default

# ---------------------------------------------------------------- extract: agents' runs, verified
def ecdsa_ok(pub, sg):
    from cryptography.hazmat.primitives.asymmetric import ec, utils
    from cryptography.hazmat.primitives import hashes
    raw = base64.b64decode(sg['sig'])
    pub.verify(utils.encode_dss_signature(int.from_bytes(raw[:32], 'big'), int.from_bytes(raw[32:], 'big')), sg['over'].encode(), ec.ECDSA(hashes.SHA256()))

def verify_agent(rec, keys):
    sg = rec.pop('sig', None)
    if not sg: rec['signed'] = False; return rec
    try:
        from cryptography.hazmat.primitives import serialization
        k = next((k for k in keys if (k.get('bundle') or {}).get('signing_fingerprint') == sg.get('key')), None)
        if not k: raise ValueError(f"no published key {sg.get('key')}")
        if str(k.get('agent', '')).lower() != str(rec.get('agent', '')).lower(): raise ValueError(f"key {sg.get('key')} is {k.get('agent')}'s, not {rec.get('agent')}'s")
        if k.get('status') not in (None, '', 'active'): raise ValueError(f"key {sg.get('key')} is {k.get('status')}")
        ecdsa_ok(serialization.load_pem_public_key(k['bundle']['sign'].encode()), sg)
        if json.loads(sg['over']) != rec: raise ValueError('the record differs from what was signed')
        rec['signed'] = True; rec['key'] = sg['key']; rec['key_id'] = k['id']
    except Exception as e:
        rec['signed'] = False; rec['sig_finding'] = f'{type(e).__name__}: {e}'[:200]
    return rec

# ---------------------------------------------------------------- save raw (private), by the hour it happened
def hour_of(r):
    t = str(r.get('ts') or r.get('run') or '')
    if len(t) >= 13: return t[:10], t[11:13]
    if r.get('_received'): g = time.gmtime(r['_received'] / 1000); return time.strftime('%Y-%m-%d', g), time.strftime('%H', g)
    return None

def fix_clock(r):
    """A browser's clock is a claim: more than 6 hours from when the lane received it, the record is filed by the time it
    was received and the claim kept as ts_claimed (PrompTugal.news's obs_lets.fix_clock)."""
    t, rcv = r.get('ts') or r.get('run'), r.get('_received')
    if not t or not rcv or len(str(t)) < 16: return r
    try: claimed = time.mktime(time.strptime(str(t)[:16], '%Y-%m-%dT%H:%M')) - time.mktime(time.gmtime(0))
    except ValueError: return r
    if abs(claimed - rcv / 1000) > 6 * 3600:
        key = 'ts' if r.get('ts') else 'run'
        r[key + '_claimed'] = r[key]; r[key] = time.strftime('%Y-%m-%dT%H:%MZ', time.gmtime(rcv / 1000))
    return r

def save_raw(vault, rows):
    touched, by = set(), collections.defaultdict(list)
    for r in rows:
        fix_clock(r)
        if r.get('test') or r.get('v') != 1: continue
        h = hour_of(r)
        if h: by[h].append(r)
    for (day, hh), rs in by.items():
        p = os.path.join(vault, 'events', day, hh, 'events.jsonl'); os.makedirs(os.path.dirname(p), exist_ok=True)
        seen = {json.loads(l).get('_file') for l in open(p) if l.strip()} if os.path.exists(p) else set()
        new = [r for r in rs if r.get('_file') not in seen]
        if new:
            with open(p, 'a') as f:
                for r in new: f.write(json.dumps(r, sort_keys=True) + '\n')
            touched.add((day, hh))
    return touched

def all_rows(vault):
    base = os.path.join(vault, 'events'); out = []
    if not os.path.isdir(base): return out
    for d in sorted(os.listdir(base)):
        for h in sorted(os.listdir(os.path.join(base, d))):
            p = os.path.join(base, d, h, 'events.jsonl')
            if os.path.exists(p): out += [json.loads(l) for l in open(p) if l.strip()]
    return out

# ---------------------------------------------------------------- transform: counts only
def norm(path):
    path = str(path or '/').split('?')[0]
    return path[:-len('index.html')] if path.endswith('/index.html') else path

def counts(rows, now, pub_id):
    pages = [r for r in rows if r.get('type') in ('view', 'read') and r.get('path')]
    bots = [r for r in pages if r.get('agent') in BOTS]
    H = hosts()
    off_site = [r for r in pages if r.get('site') and r['site'] not in H]   # a local test or a copy elsewhere
    pages = [r for r in pages if not r.get('site') or r['site'] in H]
    bots = [r for r in pages if r.get('agent') in BOTS]
    people = [r for r in pages if r.get('agent') not in BOTS]
    seen, reads = set(), []
    for r in people:                                                     # a read re-sent from the next page can arrive twice
        if r['type'] != 'read': continue
        k = (r.get('sid'), r.get('path'), r.get('ts'), r.get('visible_s'), r.get('scroll'))
        if k not in seen: seen.add(k); reads.append(r)
    views = [r for r in people if r['type'] == 'view']
    C = lambda it: collections.Counter(x for x in it if x)
    by_country = C(r.get('country') for r in views)
    # a town is its city and country: ipapi.co and ipwho.is name the same region differently ("Lisbon", "Distrito de Lisboa")
    city_raw = C(', '.join(x for x in (r.get('city'), r.get('country')) if x) if r.get('city') else '' for r in views)
    by_city = [[k, n] for k, n in city_raw.most_common() if n >= CITY_MIN]
    other = sum(n for k, n in city_raw.items() if n < CITY_MIN)
    if other: by_city.append([f'(places under {CITY_MIN} views, in their country above)', other])
    hours = C((r.get('ts') or '')[:13].replace('T', ' ') + ':00' for r in views)
    if hours:
        last = time.strptime(max(hours)[:13], '%Y-%m-%d %H'); t1 = time.mktime(last)
        span = [time.strftime('%Y-%m-%d %H:00', time.localtime(t1 - 3600 * i)) for i in range(47, -1, -1)]
        by_hour = [[h, hours.get(h, 0)] for h in span]
    else: by_hour = []
    rd = collections.defaultdict(lambda: [0, 0, 0])
    for r in reads: x = rd[norm(r['path'])]; x[0] += 1; x[1] += r.get('visible_s', 0) or 0; x[2] += r.get('scroll', 0) or 0
    runs = [r for r in rows if r.get('type') == RUN_TYPE]
    return {
        'v': 1, 'site': sorted(H), 'generated': now, 'public_vault': pub_id, 'city_min': CITY_MIN, 'by': AGENT,
        'about': 'Counts only, drained from the private vault by admin/tools/obs/obs_drain.py: no raw event, IP, tab id, time zone or language. Readers exclude declared bots and automation (counted in totals.bots).',
        'totals': {'views': len(views), 'reads': len(reads), 'tabs': len({r.get('sid') for r in people if r.get('sid')}),
                   'countries': len(by_country), 'shares': sum(1 for r in views if r.get('via')), 'bots': sum(1 for r in bots if r['type'] == 'view'),
                   'agent_runs': len(runs), 'agent_runs_signed': sum(1 for r in runs if r.get('signed'))},
        'by_hour': by_hour,
        'by_page': C(norm(r['path']) for r in views).most_common(),
        'reading': sorted([[p, n, round(s / n), round(sc / n)] for p, (n, s, sc) in rd.items()], key=lambda x: -x[1]),
        'by_country': by_country.most_common(),
        'by_city': by_city,
        'by_referrer': C(r.get('ref') for r in views if r.get('ref') not in H).most_common(30),
        'by_host': C(r.get('site') or SITE for r in views).most_common(),
        'other_hosts_views': sum(1 for r in off_site if r['type'] == 'view'),
        'by_via': C(r.get('via') for r in views).most_common(),
        'via_detail': {v: {'views': n, 'tabs': len({r.get('sid') for r in views if r.get('via') == v}),
                           'countries': len({r.get('country') for r in views if r.get('via') == v and r.get('country')})}
                       for v, n in C(r.get('via') for r in views).items()},
        'by_screen': C(r.get('screen') for r in views).most_common(),
        'agents': C(r.get('agent') for r in runs).most_common(),
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--creds', default=os.path.expanduser('~/.sg-send/obs-fringe/creds.json'))
    ap.add_argument('--dry', action='store_true')
    o = ap.parse_args()
    c = json.load(open(o.creds))
    data, pub = c['data_dir'], c['public_dir']
    for d, vk in ((data, c['vault_key']), (pub, c['public_vault_key'])):           # a new session: clone the vaults from their keys
        if not os.path.isdir(d):
            os.makedirs(os.path.dirname(d), exist_ok=True)
            r = subprocess.run(['sgit', 'clone', vk, d, '--base-url', c['host']], capture_output=True, text=True)
            if r.returncode: raise SystemExit(f'obs_drain: could not clone {os.path.basename(d)} (exit {r.returncode})')
    from sgit_ai.crypto.PKI__Crypto import PKI__Crypto
    from concurrent.futures import ThreadPoolExecutor
    pki, pool, t0 = PKI__Crypto(), ThreadPoolExecutor(max_workers=16), time.time()
    sgit(data, 'pull', ok_fail=True); sgit(pub, 'pull', ok_fail=True)
    # L
    entries, after = [], None
    while True:
        r = post(c, 'list', {'include_content': False, 'limit': 200, **({'after_file_id': after} if after else {})})
        page = r.get('entries', []); entries += page
        if not r.get('truncated') or not page: break
        after = page[-1]['file_id']
    lanes = collections.OrderedDict()
    for e in entries: lanes.setdefault(e['inbox'], []).append(e['file_id'])
    by_lane = {c['lane_names'][c['tokens'].index(t)]: len(ids) for t, ids in lanes.items() if t in c['tokens']}
    print(f'obs_drain: {len(entries)} pending: ' + (', '.join(f'{k} {v}' for k, v in by_lane.items()) or 'none'))
    if o.dry: return
    # E
    key = pki.import_private_key_pem(open(os.path.join(data, 'identity/private/private_key.pem')).read())
    keys = json.load(open(os.path.join(ROOT, 'data', 'keys.json')))['keys']
    def extract(content):
        try:
            ev = json.loads(pki.hybrid_decrypt(key, base64.b64decode(content).decode())['plaintext'])
            if ev.get('type') == RUN_TYPE: return verify_agent(ev, keys)
            ev.pop('sig', None); ev.pop('person', None)                   # no keyring on this site: a page event is anonymous
            return ev
        except Exception as e: return {'v': 0, 'undecryptable': True, 'error': type(e).__name__}
    batches = [(token, ids[i:i + 25]) for token, ids in lanes.items() for i in range(0, len(ids), 25)]
    fetched = list(pool.map(lambda tb: (tb[0], post(c, 'fetch', {'inbox': tb[0], 'file_ids': tb[1]}).get('files', [])), batches))
    items = [(token, f) for token, files in fetched for f in files]
    rows, done, bad = [], collections.defaultdict(list), 0
    for (token, f), ev in zip(items, pool.map(lambda tf: extract(tf[1]['content']), items)):
        bad += 1 if ev.get('undecryptable') else 0
        ev['_file'] = f['file_id']; ev['_lane'] = c['tokens'].index(token) + 1 if token in c['tokens'] else 0
        ev['_received'] = int(f['file_id'][:13]) if f['file_id'][:13].isdigit() else None
        rows.append(ev); done[token].append(f['file_id'])
    # S raw: commit and push, then mark processed
    touched = save_raw(data, rows)
    stamp = time.strftime('%Y-%m-%dT%H:%MZ', time.gmtime())
    if touched:
        sgit(data, 'commit', f'drain {stamp}: {len(rows)} record(s), {len(touched)} hour(s)'); sgit(data, 'push')
    marks = [(token, ids[i:i + 25]) for token, ids in done.items() for i in range(0, len(ids), 25)]
    list(pool.map(lambda m: post(c, 'mark-processed', {'inbox': m[0], 'file_ids': m[1]}), marks))
    # T + S public
    t = counts(all_rows(data), stamp, c['public_vault_id'])
    for p in (os.path.join(pub, 'latest', 'traffic.json'), os.path.join(pub, 'data', 'public.json'), os.path.join(ROOT, 'data', 'obs', 'traffic.json')):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'w') as f: f.write(json.dumps(t, indent=1, ensure_ascii=False) + '\n')
    r = subprocess.run(['sgit', 'commit', f'publish {stamp}'], cwd=pub, capture_output=True, text=True)
    odd = []
    if not any(w in (r.stdout + r.stderr).lower() for w in ('nothing', 'no changes')):
        p = subprocess.run(['sgit', 'push'], cwd=pub, capture_output=True, text=True)
        if p.returncode: odd.append('the public vault push failed')
    for lane, n in by_lane.items():
        if n >= 800: odd.append(f'lane {lane} holds {n} pending: ' + ('FULL (507)' if n >= 1000 else 'near full'))
    T = t['totals']
    print(f"obs_drain: {stamp[11:16]} UTC, drained {len(rows)} ({bad} undecryptable) in {round(time.time() - t0, 1)} s; "
          f"all time: {T['views']} views, {T['reads']} reads, {T['tabs']} tabs, {T['countries']} countries, {T['shares']} shared-link views, "
          f"{T['bots']} bot views, {T['agent_runs']} agent runs; " + ('; '.join('ODD: ' + x for x in odd) if odd else 'nothing odd'))

if __name__ == '__main__': main()
