#!/usr/bin/env python3
"""Make Lisbon Fringe's observability vaults (observability.fringe@PrompTugal.dinis, 11 November 2026, at Dinis Cruz's
word, brief 2: "we need to put logs on the website ... track all the visits"). Copied from PrompTugal__News__Website
newsroom/tools/obs/obs_setup.py (observability@PrompTugal.dinis, 6 November), with the fringe's own vaults:

    SG_SEND_ACCESS_TOKEN=proxy-injected python3 -I admin/tools/obs/obs_setup.py

(The environment's proxy injects the real SG/Send token into requests to dev.send.sgraph.ai; the variable only has
to be set.)

1. the PRIVATE data vault (fringe-obs-data): a README, the drain key (identity/private/, an RSA-4096 pair made here;
   only its public half leaves the vault), identity/lanes.json; then append lanes configured on it: 'site' (four,
   written by assets/obs/obs.js on every page) and 'agents' (two, written by admin/tools/agent-log.mjs);
2. the PUBLIC vault (fringe-obs-public): the drain writes counts into it, and its read key is published;
3. writes the public half to this repository: assets/obs/obs.json (endpoint, vault id, the lanes' append tokens and the
   drain's public key: public on purpose, a token can only write to its lane and the key can only encrypt) and
   data/obs/vaults.json (the public vault's id and read key);
4. keeps the credentials in ~/.sg-send/obs-fringe/creds.json (0600), outside the repository, and seals a copy to the
   lead's encryption key (conductor.fringe-promptugal, active, in data/keys.json) into admin/obs/sealed/lead.json
   (sgit hybrid envelope v2: RSA-OAEP-SHA256 + AES-256-GCM), so they outlive this session.
Run once. Prints no credential.
"""
import datetime, hashlib, json, os, secrets, subprocess, sys, urllib.request

sys.dont_write_bytecode = True
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
HOST = 'https://dev.send.sgraph.ai'
AGENT = 'observability.fringe@PrompTugal.dinis'
CREDS = os.path.expanduser('~/.sg-send/obs-fringe/creds.json')
VAULTS = os.path.expanduser('~/vaults')
LEAD = 'conductor.fringe-promptugal'
h = lambda s: hashlib.sha256(s.encode()).hexdigest()

def post(url, body, headers):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST', headers={'Content-Type': 'application/json', **headers})
    with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read() or b'{}')

def sgit(cwd, *a):
    r = subprocess.run(['sgit', *a], cwd=cwd, capture_output=True, text=True)
    if r.returncode: sys.exit(f'obs_setup: sgit {a[0]} failed (exit {r.returncode}): ' + (r.stderr or r.stdout).strip().splitlines()[-1][:200])
    return r.stdout

def wjson(p, obj, mode=None):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w') as f: f.write(json.dumps(obj, indent=2, ensure_ascii=False) + '\n')
    if mode: os.chmod(p, mode)

def create(name, readme, token):
    os.makedirs(VAULTS, exist_ok=True)
    d = os.path.join(VAULTS, name)
    if os.path.exists(d): sys.exit(f'obs_setup: {d} exists; this runs once')
    sgit(VAULTS, 'create', name, '--base-url', HOST, '--token', token, '--no-push')
    open(os.path.join(d, 'README.md'), 'w').write(readme)
    return d

def push(d, msg):
    sgit(d, 'commit', msg); sgit(d, 'push')
    vk = open(os.path.join(d, '.sg_vault', 'local', 'vault_key')).read().strip()
    return vk, vk.split(':')[-1]

def main():
    if os.path.exists(CREDS): sys.exit(f'obs_setup: {CREDS} exists; the vaults are made already')
    token = os.environ['SG_SEND_ACCESS_TOKEN']
    from sgit_ai.crypto.PKI__Crypto import PKI__Crypto
    from sgit_ai.crypto.Vault__Crypto import Vault__Crypto
    pki, today = PKI__Crypto(), datetime.datetime.now(datetime.timezone.utc).strftime('%-d %B %Y')
    lead = next((k for k in json.load(open(os.path.join(ROOT, 'data', 'keys.json')))['keys'] if k['id'] == LEAD and k.get('status') == 'active'), None)
    if not lead: sys.exit(f'obs_setup: no active {LEAD} key in data/keys.json to seal to')

    # 1. the private data vault, with the drain key inside it
    data = create('fringe-obs-data', f'# Lisbon Fringe observability: the data vault (private)\n\nMade by {AGENT} on {today}, at Dinis Cruz\'s word (brief 2), with admin/tools/obs/obs_setup.py in PrompTugal/PrompTugal__News__Fringe. Page views and reads from fringe.promptugal.news (assets/obs/obs.js) and the fringe agents\' run records (admin/tools/agent-log.mjs) arrive sealed to the drain key (identity/) on this vault\'s append lanes; the drain (admin/tools/obs/obs_drain.py) opens them, keeps them here by the hour (events/<day>/<hh>/events.jsonl) and publishes counts to the public vault. Private.\n', token)
    priv, pub = pki.generate_encryption_key_pair()
    pub_pem, priv_pem = pki.export_public_key_pem(pub), pki.export_private_key_pem(priv)
    fp = pki.compute_fingerprint(pub)
    os.makedirs(os.path.join(data, 'identity', 'private'), exist_ok=True)
    open(os.path.join(data, 'identity', 'private', 'private_key.pem'), 'w').write(priv_pem)
    wjson(os.path.join(data, 'identity', 'public-bundle.json'), {'encrypt': pub_pem, 'fingerprint': fp, 'label': 'Lisbon Fringe observability drain'})
    names = ['site 1', 'site 2', 'site 3', 'site 4', 'agents 1', 'agents 2']
    toks = [secrets.token_hex(32) for _ in names]
    wjson(os.path.join(data, 'identity', 'lanes.json'), {'about': 'The append lanes, in order, by the SHA-256 of each token (the anchor the server holds).',
                                                         'lanes': [{'name': n, 'anchor': h(t)} for n, t in zip(names, toks)]})
    data_vk, data_id = push(data, 'the data vault: README, the drain key, the lanes')
    enum_key = secrets.token_hex(32)
    write_key = Vault__Crypto().derive_keys_from_vault_key(data_vk)['write_key']
    r = post(f'{HOST}/api/vault/append/configure/{data_id}', {'append_anchors': [h(t) for t in toks], 'enum_key_hash': h(enum_key)},
             {'x-sgraph-vault-write-key': write_key, 'x-sgraph-access-token': token})
    if r.get('status') != 'configured': sys.exit(f'obs_setup: configure answered {r.get("status")}')

    # 2. the public vault
    pubv = create('fringe-obs-public', f'# Who reads fringe.promptugal.news (public)\n\nMade by {AGENT} on {today}, at Dinis Cruz\'s word (brief 2). Written by the drain (admin/tools/obs/obs_drain.py in PrompTugal/PrompTugal__News__Fringe): latest/*.json, <day>/day.json, <day>/<hh>/hour.json and data/public.json. Counts only: no IP, no cookie, no tab id, no time zone or language in any file. Shown at https://fringe.promptugal.news/traffic/.\n', token)
    pub_vk, pub_id = push(pubv, 'the public vault: README')
    read_key = Vault__Crypto().derive_keys_from_vault_key(pub_vk)['read_key']
    read_key = read_key if isinstance(read_key, str) else read_key.hex()

    # 3. the public half, in this repository
    wjson(os.path.join(ROOT, 'assets', 'obs', 'obs.json'), {
        'about': f'Lisbon Fringe\'s observability lanes ({AGENT}, {today}, at Dinis Cruz\'s word; PrompTugal.news\'s model, its assets/obs/obs.json). Public on purpose: each append token can only write to its lane, and the key can only encrypt. \'site\' is used by assets/obs/obs.js on every page; \'agents\' by admin/tools/agent-log.mjs. The data vault is private; its drain is {AGENT}\'s.',
        'enabled': True, 'endpoint': HOST, 'vault_id': data_id,
        'lanes': {'site': toks[:4], 'agents': toks[4:]},
        'recipient': {'fingerprint': fp, 'encrypt': pub_pem},
        'geo': ['https://ipapi.co/json/', 'https://ipwho.is/'],
        'what': 'This site counts page views and reading time, publicly, to learn what is read and how links spread. Each event says: the page, the referring site (host only), the time to the minute, the site version, a random id that ends with the tab, the screen size class, the browser\'s language and time zone, the country, region and city (and the city\'s position, rounded to about 10 km), a link\'s tag (?via=), and an automation class if a bot declares itself. To find the place, the browser asks ipapi.co (or ipwho.is), which see the reader\'s IP address, as any website it calls would; this site reads only the place from the answer and keeps no IP address, no cookie, no user-agent string and no fingerprint. Do Not Track, Global Privacy Control and Pause in the footer turn it all off, the place lookup included. Published: counts only, at /traffic/.'})
    wjson(os.path.join(ROOT, 'data', 'obs', 'vaults.json'), {
        'about': 'The observability vaults /traffic/ reads. Only a published read key (sgit_public_read_ + 64 hex), never a vault key: a read key can only read, and this vault holds counts only.',
        'vaults': [{'id': 'fringe', 'name': 'Who reads fringe.promptugal.news: the published counts', 'site': 'fringe.promptugal.news', 'vault_id': pub_id,
                    'read_key': 'sgit_public_read_' + read_key, 'by': AGENT, 'made': datetime.date.today().isoformat(), 'private_data_vault': data_id,
                    'drain': 'admin/tools/obs/obs_drain.py'}]})

    # 4. the credentials: outside the repository, and sealed to the lead so they outlive this session
    creds = {'host': HOST, 'vault_id': data_id, 'vault_key': data_vk, 'enum_key': enum_key, 'tokens': toks, 'lane_names': names,
             'public_vault_id': pub_id, 'public_vault_key': pub_vk, 'data_dir': data, 'public_dir': pubv, 'made': today, 'by': AGENT}
    wjson(CREDS, creds, 0o600)
    plain = json.dumps({'type': 'fringe.obs/creds', **{k: v for k, v in creds.items() if not k.endswith('_dir')}})
    env = pki.hybrid_encrypt(pki.import_public_key_pem(lead['bundle']['encrypt']), plain)
    wjson(os.path.join(ROOT, 'admin', 'obs', 'sealed', 'lead.json'), {
        'about': f'The observability vaults\' credentials, sealed by {AGENT} on {today} to the lead\'s encryption key ({LEAD}, {lead["bundle"]["fingerprint"]}), so they outlive this session. sgit hybrid envelope v2 (RSA-OAEP-SHA256 + AES-256-GCM), base64; open with sgit_ai PKI__Crypto.hybrid_decrypt and the lead\'s private key.',
        'to': LEAD, 'to_fingerprint': lead['bundle']['fingerprint'], 'by': AGENT, 'sealed': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'),
        'envelope': env})
    print(f'obs_setup: data vault {data_id} (private, 6 lanes configured), public vault {pub_id} (read key published); drain key {fp}; '
          f'assets/obs/obs.json and data/obs/vaults.json written; credentials in {CREDS} and sealed to {LEAD}')

if __name__ == '__main__': main()
