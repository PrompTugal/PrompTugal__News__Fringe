#!/usr/bin/env python3
"""Outreach tracker (work/23, work/29). Builds data/outreach-tracker.json rows from data/events.json,
keeps the state a person set, and writes data/outreach.json (counts only) and work/23-tracker.md.
Organisations only; no contact details; the way to reach an organiser is the public page of its event.
Usage: python3 admin/tools/outreach.py   (idempotent; states are kept from the existing tracker)
States (set by a person's edit, never by an agent's send): listed, drafted, sent, answered, joined, declined."""
import json, re, os, datetime, sys
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
ev = json.load(open(f'{R}/data/events.json'))['events']
skip = re.compile(r'^(unknown|an independent organiser|independent organisers)', re.I)
canon = {  # spellings -> one organisation
 'yorkseed': 'Yorkseed Global Capital Network', 'valois by yorkseed': 'Valois by Yorkseed',
 'lisboaux': 'LisboaUX', 'staaake': 'staaake', 'tejá house': 'Tejá House', 'teja house': 'Tejá House',
 'lisbon business leaders': 'Lisbon Business Leaders', 'tech startups on the rooftop': 'Tech Startups on the Rooftop',
 'the nest by near': 'The Nest by NEAR', 'innovation wednesdays': 'Innovation Wednesdays',
 'friends of kyra': 'Friends of Kyra', 'kuma partners': 'Kuma Partners', 'canopy community': 'Canopy Community',
 'indvstry clvb': 'Indvstry Clvb', 'portugal tech week': 'Portugal Tech Week',
 'wet summit lisbon': 'WET SUMMIT Lisbon', 'ai ethics and integrity international association': 'AI Ethics and Integrity International Association (AIEI)',
 'unicorn factory lisboa': 'Unicorn Factory Lisboa', 'healthhub by unicorn factory lisboa': 'Unicorn Factory Lisboa',
 'google developer group lisboa': 'Google Developer Group Lisboa', 'indiebeers lisboa': 'IndieBeers Lisboa',
 'germany trade and invest': 'Germany Trade and Invest', 'beel': 'beel',
}
def lead(o):
    o = re.sub(r'\s*\((per|an |a |Luma|Yorkseed Global|Kyra|Lisbon edition|Baku|German|Kuma)[^)]*\)', '', o)
    o = re.sub(r'\s*\((per [^)]*)\)', '', o)
    o = re.split(r'\s+with\s+|,\s*with\s+|,\s+powered by|,\s+a group of|,\s+hosted by', o)[0].strip(' ,')
    o = o.replace('Yorkseed ™', 'Yorkseed')
    return canon.get(o.lower(), o)
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
rows = {}
for e in ev:
    o = e['organiser']
    if skip.match(o): continue
    n = lead(o)
    if n.lower().startswith('octo health'): n = 'Octo Health'
    if n.startswith('Top Tier Impact'): n = 'Top Tier Impact'
    if n.startswith('Primal Events'): n = 'Primal Events & Workshops'
    r = rows.setdefault(slug(n), {'id': slug(n), 'organiser': n, 'events': [], 'page': e['url']})
    r['events'].append(e['id'])
path = f'{R}/data/outreach-tracker.json'
old = {}
if os.path.exists(path):
    old = {r['id']: r for r in json.load(open(path))['organisers']}
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
out = []
for k, r in sorted(rows.items(), key=lambda kv: (-len(kv[1]['events']), kv[1]['organiser'].lower())):
    host = r['page'].split('/')[2].replace('www.', '')
    way = {'luma.com': "the 'Contact the host' link on the organiser's public Luma event page (check it is there before sending)",
           'meetup.com': "the 'Contact' or message link on the organiser's public Meetup group page (check it is there)"}.get(host,
           "the contact or enquiry form on the organiser's own public site (check it is there)")
    o = old.get(k, {})
    out.append({'id': k, 'organiser': r['organiser'], 'events': len(r['events']), 'page': r['page'], 'channel': way,
                'draft': 'work/drafts/organiser-note.md', 'draft_status': 'draft until Dinis approves',
                'state': o.get('state', 'drafted'), 'sent_by': o.get('sent_by', ''), 'sent_at': o.get('sent_at', ''),
                'note': o.get('note', '')})
doc = {'about': "Organiser tracker for work/23 and work/29. Organisations only, never private people; no contact details. 'page' is the organiser's public event page where its own 'contact host' route is. State is set by the person who sends: drafted, sent, answered, joined, declined. An agent never sends.",
       'updated': now, 'by': 'outreach.1.fringe@PrompTugal.dinis', 'organisers': out}
json.dump(doc, open(path, 'w'), indent=1, ensure_ascii=False); open(path, 'a').write('\n')
st = [r['state'] for r in out]
drafts = [f for f in os.listdir(f'{R}/work/drafts') if f.endswith('.md')]
counts = {'updated': now, 'by': 'outreach.1.fringe@PrompTugal.dinis', 'drafts_ready': len(drafts), 'organisers_listed': len(out),
          'contacted': sum(s in ('sent', 'answered', 'joined', 'declined') for s in st), 'answered': sum(s in ('answered', 'joined', 'declined') for s in st),
          'joined': st.count('joined'), 'note': 'Counts only. An agent never sends; a person does. Contacted counts what a person has marked sent.'}
json.dump(counts, open(f'{R}/data/outreach.json', 'w'), indent=1); open(f'{R}/data/outreach.json', 'a').write('\n')
md = ['# Work/23 tracker: one row per organiser', '',
      f'> Generated by `admin/tools/outreach.py` from data/events.json, {now} UTC, outreach.1.fringe@PrompTugal.dinis. Source of truth: `data/outreach-tracker.json`. Organisations only; no contact details. The note is **draft until Dinis approves**; a person sends it, through the organiser\'s own public route; an agent never does.', '',
      f'Organisers: {len(out)}. Drafted {st.count("drafted")}, sent {counts["contacted"]}, answered {counts["answered"]}, joined {counts["joined"]}.', '',
      '| Organiser | Events | Public route (their own page) | Draft | State | Sent by |', '|---|---|---|---|---|---|']
for r in out:
    md.append(f"| {r['organiser']} | {r['events']} | {r['channel'].split(' (')[0]}: {r['page']} | organiser-note.md | {r['state']} | {r['sent_by'] or '-'} |")
open(f'{R}/work/23-tracker.md', 'w').write('\n'.join(md) + '\n')
print(len(out), 'organisers', counts)
