#!/usr/bin/env python3
"""Messages waiting per inbox, for the dashboard (work/25): writes data/inbox-counts.json (counts only).

    python3 -I admin/tools/inbox_counts.py

Run by the lead, who holds each issued inbox's enum key in ~/.sg-send/fringe-inboxes/issued-<id>.json (never in git).
It lists each lane (names and times of the files only, never their content) and counts them; an inbox the lead did not
issue is 'unknown'. Prints counts only.
"""
import datetime, json, os, sys, urllib.request
sys.dont_write_bytecode = True
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEEP = os.path.expanduser('~/.sg-send/fringe-inboxes')


def lane(c):
    entries, after = [], None
    while True:
        body = {'include_content': False, 'limit': 200, **({'after_file_id': after} if after else {})}
        req = urllib.request.Request(f"{c['host']}/api/vault/append/list/{c['vault_id']}", data=json.dumps(body).encode(), method='POST',
                                     headers={'Content-Type': 'application/json', 'x-sgraph-vault-enum-key': c['enum_key']})
        with urllib.request.urlopen(req, timeout=60) as r: page = json.loads(r.read() or b'{}')
        entries += page.get('entries', [])
        if not page.get('truncated') or not page.get('entries'): return entries
        after = entries[-1]['file_id']


out = {}
for f in sorted(os.listdir(os.path.join(ROOT, 'data', 'inboxes'))):
    kid = f[:-5]; cf = os.path.join(KEEP, f'issued-{kid}.json')
    if not os.path.exists(cf): out[kid] = {'messages': None, 'note': 'not issued by this lead session'}; continue
    try:
        es = lane(json.load(open(cf)))
        last = max((int(e['file_id'][:13]) for e in es if e['file_id'][:13].isdigit()), default=None)
        out[kid] = {'messages': len(es), 'last_at': datetime.datetime.fromtimestamp(last / 1000, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ') if last else None}
    except Exception as e:
        out[kid] = {'messages': None, 'note': type(e).__name__}
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
json.dump({'about': 'Messages in each agent inbox (work/19), counts only, by the lead (admin/tools/inbox_counts.py). Read or not is not known here: each agent drains its own.',
           'by': 'conductor.fringe@PrompTugal.dinis', 'updated': now, 'inboxes': out}, open(os.path.join(ROOT, 'data', 'inbox-counts.json'), 'w'), indent=1)
open(os.path.join(ROOT, 'data', 'inbox-counts.json'), 'a').write('\n')
print({k: v.get('messages') for k, v in out.items()})
