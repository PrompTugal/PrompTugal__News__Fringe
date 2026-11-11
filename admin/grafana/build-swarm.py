#!/usr/bin/env python3
"""Build admin/grafana/swarm.json, the 'Swarm' dashboard (work/51, grafana.1.fringe@PrompTugal.dinis).
No secrets: data sources are template variables (Infinity for https://lisbontechfringe.com/api/v1/,
Elasticsearch for the swarm's fringe-* indices). --test runs each Infinity query on the stack
named by GRAFANA_URL with GRAFANA_TOKEN (read-only use; the token is never printed)."""
import json, os, sys, urllib.request

API = 'https://lisbontechfringe.com/api/v1/'
INF = {'type': 'yesoreyeram-infinity-datasource', 'uid': '${infinity}'}
ES = {'type': 'elasticsearch', 'uid': '${elastic}'}

def col(sel, text=None, typ='string'):
    return {'selector': sel, 'text': text or sel.split('.')[-1], 'type': typ}

def inf(ref, f, root='', cols=(), by=None, expr=None, filt=None):
    q = {'refId': ref, 'datasource': INF, 'type': 'json', 'source': 'url', 'parser': 'backend',
         'format': 'table', 'url': API + f, 'url_options': {'method': 'GET'},
         'root_selector': root, 'columns': list(cols)}
    if expr: q['summarizeExpression'] = expr
    if by: q['summarizeBy'] = by
    if filt: q['filterExpression'] = filt
    return q

def es(ref, index, metric='count', split=None, field='t', size=12, query=''):
    q = {'refId': ref, 'datasource': ES, 'query': f'_index:{index}' + (f' AND {query}' if query else ''),
         'metrics': [{'id': '1', 'type': metric}], 'timeField': field, 'bucketAggs': []}
    if split: q['bucketAggs'].append({'id': '2', 'type': 'terms', 'field': split,
              'settings': {'size': str(size), 'order': 'desc', 'orderBy': '_count', 'min_doc_count': '1'}})
    q['bucketAggs'].append({'id': '3', 'type': 'date_histogram', 'field': field,
              'settings': {'interval': 'auto', 'min_doc_count': '0', 'trimEdges': '0'}})
    return q

panels, y = [], [0]
def row(title):
    panels.append({'type': 'row', 'title': title, 'collapsed': False, 'gridPos': {'h': 1, 'w': 24, 'x': 0, 'y': y[0]}, 'panels': []}); y[0] += 1
def add(p, w, h, x):
    p['gridPos'] = {'h': h, 'w': w, 'x': x, 'y': y[0]}; p['id'] = len(panels) + 1; panels.append(p)
def nl(h): y[0] += h
def stat(title, q, desc='', unit='none', mappings=None, steps=None):
    return {'type': 'stat', 'title': title, 'description': desc, 'datasource': INF, 'targets': [q],
            'fieldConfig': {'defaults': {'unit': unit, 'mappings': mappings or [],
                'thresholds': {'mode': 'absolute', 'steps': steps or [{'color': 'blue', 'value': None}]}}, 'overrides': []},
            'options': {'reduceOptions': {'calcs': ['lastNotNull'], 'fields': '', 'values': False}, 'colorMode': 'background', 'graphMode': 'none', 'textMode': 'value'}}
def bars(title, q, desc='', horiz=True):
    return {'type': 'barchart', 'title': title, 'description': desc, 'datasource': q['datasource'], 'targets': [q],
            'options': {'orientation': 'horizontal' if horiz else 'vertical', 'showValue': 'auto', 'legend': {'showLegend': False}, 'xTickLabelRotation': 0},
            'fieldConfig': {'defaults': {'color': {'mode': 'palette-classic'}}, 'overrides': []}}
def table(title, q, desc=''):
    return {'type': 'table', 'title': title, 'description': desc, 'datasource': q['datasource'], 'targets': [q],
            'options': {'showHeader': True, 'cellHeight': 'sm'}, 'fieldConfig': {'defaults': {}, 'overrides': []}}
def pie(title, q, desc=''):
    return {'type': 'piechart', 'title': title, 'description': desc, 'datasource': INF, 'targets': [q],
            'options': {'pieType': 'donut', 'legend': {'displayMode': 'table', 'placement': 'right', 'values': ['value']}, 'reduceOptions': {'calcs': ['lastNotNull'], 'fields': '', 'values': True}}}
def series(title, q, desc='', stack=True, bars_=True):
    return {'type': 'timeseries', 'title': title, 'description': desc, 'datasource': q['datasource'], 'targets': [q],
            'fieldConfig': {'defaults': {'custom': {'drawStyle': 'bars' if bars_ else 'line', 'fillOpacity': 80 if bars_ else 10,
                'stacking': {'mode': 'normal' if stack else 'none'}}}, 'overrides': []},
            'options': {'legend': {'displayMode': 'table', 'placement': 'right', 'calcs': ['sum']}, 'tooltip': {'mode': 'multi'}}}

HEALTH = [{'type': 'value', 'options': {'green': {'color': 'green', 'text': 'green'}, 'amber': {'color': 'orange', 'text': 'amber'}, 'red': {'color': 'red', 'text': 'red'}}}]

row('Now (swarm.json, activity.json: the public API, rebuilt at each deploy)')
add(stat('Swarm health', inf('A', 'swarm.json', 'overall', [col('health')]), 'overall.health of /api/v1/swarm.json', mappings=HEALTH), 4, 4, 0)
add(stat('Agents online', inf('A', 'swarm.json', 'counts', [col('agents_online', typ='number')])), 4, 4, 4)
add(stat('Commits, last hour', inf('A', 'activity.json', 'totals.last_hour', [col('commits', typ='number')])), 4, 4, 8)
add(stat('Deploys, last hour', inf('A', 'activity.json', 'totals.last_hour', [col('deploys', typ='number')])), 4, 4, 12)
add(stat('Events listed', inf('A', 'swarm.json', 'health.events', [col('count', typ='number')])), 4, 4, 16)
add(stat('Events not re-read in 3 h', inf('A', 'swarm.json', 'health.events', [col('stale_over_3h', typ='number')]),
         'Events whose read_at is over 3 hours old', steps=[{'color': 'green', 'value': None}, {'color': 'orange', 'value': 10}, {'color': 'red', 'value': 50}]), 4, 4, 20)
nl(4)
add(table('Swarm sections', inf('A', 'swarm.json', 'sections', [col('title'), col('health'), col('headline'), col('why')])), 24, 7, 0)
nl(7)

row('Commits and pushes per agent')
add(bars('Commits per agent, last 3 hours', inf('A', 'activity.json', 'commits', [col('agent'), col('sha')], by='agent', expr='count(sha)'),
         'Counted from /api/v1/activity.json (a 3-hour window; agent from the Agent: trailer)'), 12, 10, 0)
add(series('Commits per release (each CI tag)', inf('A', 'releases.json', 'releases', [col('time', 'time', 'timestamp'), col('commit_count', 'commits', 'number')]),
           'One bar per release from /api/v1/releases.json; a release is one push or several that land together', stack=False), 12, 10, 12)
nl(10)
add(table('Releases', inf('A', 'releases.json', 'releases', [col('version'), col('time', 'time', 'timestamp'), col('commit_count', 'commits', 'number'), col('agents')])), 12, 8, 0)
add(table('Agents (status files)', inf('A', 'swarm.json', 'agents', [col('name'), col('role'), col('online'), col('age_min', 'minutes since update', 'number'), col('wake'), col('state')]),
          'From the status files; age_min is the time since the agent last wrote its status (a proxy for its last wake)'), 12, 8, 12)
nl(8)

row('Events by status (events.json)')
add(pie('Events by status', inf('A', 'events.json', 'events', [col('status'), col('id')], by='status', expr='count(id)')), 8, 9, 0)
add(bars('Events by kind', inf('A', 'events.json', 'events', [col('kind'), col('id')], by='kind', expr='count(id)')), 8, 9, 8)
add(bars('Events by day', inf('A', 'events.json', 'events', [col('date'), col('id')], by='date', expr='count(id)'), horiz=False), 8, 9, 16)
nl(9)

row('Model calls and spend (models.json)')
add(table('Model experiments', inf('A', 'models.json', 'experiments', [col('at'), col('task'), col('tier'), col('model'), col('open_weight'),
          col('calls', typ='number'), col('tokens_in', typ='number'), col('tokens_out', typ='number'), col('cost_usd', typ='number')])), 16, 8, 0)
add(bars('Spend by model (USD)', inf('A', 'models.json', 'experiments', [col('model'), col('cost_usd', typ='number')], by='model', expr='sum(cost_usd)')), 8, 8, 16)
nl(8)

row('From Elastic (needs the read-only Elasticsearch data source on fringe-*, time field t)')
add(series('Commits per agent over time (fringe-commits)', es('A', 'fringe-commits', split='agent')), 12, 10, 0)
add(series('ABP hook decisions (fringe-hooklog)', es('A', 'fringe-hooklog', split='decision'), 'allow, observe (would deny), deny, override'), 12, 10, 12)
nl(10)
add(series('ABP observe and deny by rule (fringe-hooklog)', es('A', 'fringe-hooklog', split='rule', query='decision:(observe OR deny)')), 12, 9, 0)
add(series('ABP observe and deny by agent (fringe-hooklog)', es('A', 'fringe-hooklog', split='agent', query='decision:(observe OR deny)')), 12, 9, 12)
nl(9)

dash = {
    'uid': 'swarm-fringe', 'title': 'Swarm', 'tags': ['lisbon-tech-fringe', 'swarm', 'WS-215'],
    'description': 'Lisbon Tech Fringe swarm (independent of Web Summit). Built by admin/grafana/build-swarm.py (grafana.1.fringe@PrompTugal.dinis). Public data only; no secrets.',
    'timezone': 'utc', 'refresh': '5m', 'time': {'from': 'now-24h', 'to': 'now'}, 'schemaVersion': 39, 'editable': True,
    'links': [{'title': 'Lisbon Tech Fringe', 'url': 'https://lisbontechfringe.com/', 'type': 'link', 'targetBlank': True},
              {'title': 'The API', 'url': 'https://lisbontechfringe.com/api/v1/README.md', 'type': 'link', 'targetBlank': True}],
    'templating': {'list': [
        {'name': 'infinity', 'label': 'Infinity', 'type': 'datasource', 'query': 'yesoreyeram-infinity-datasource', 'current': {'text': 'grafanacloud-infinity', 'value': 'grafanacloud-infinity'}, 'hide': 0},
        {'name': 'elastic', 'label': 'Elastic (fringe-*)', 'type': 'datasource', 'query': 'elasticsearch', 'current': {}, 'hide': 0}]},
    'panels': panels,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'swarm.json')
open(out, 'w').write(json.dumps(dash, indent=2) + '\n')
print(f'wrote {out}: {sum(p["type"] != "row" for p in panels)} panels')

if '--test' in sys.argv:
    base, tok = os.environ['GRAFANA_URL'].rstrip('/'), os.environ['GRAFANA_TOKEN']
    bad = 0
    for p in panels:
        for t in p.get('targets', []):
            if t['datasource']['type'] != 'yesoreyeram-infinity-datasource': continue
            q = dict(t, datasource={'type': INF['type'], 'uid': 'grafanacloud-infinity'})
            req = urllib.request.Request(base + '/api/ds/query', json.dumps({'from': 'now-24h', 'to': 'now', 'queries': [q]}).encode(),
                                         {'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json'})
            try:
                r = json.load(urllib.request.urlopen(req, timeout=60))['results']['A']
                fr = (r.get('frames') or [{}])[0]; vals = fr.get('data', {}).get('values', [])
                rows = len(vals[0]) if vals else 0
                ok = r.get('status') == 200 and rows > 0 and not r.get('error')
                head = [v[:2] for v in vals][:4]
                print(('ok  ' if ok else 'BAD ') + f'{p["title"]}: {rows} rows {json.dumps(head)[:160]} {r.get("error","")[:160]}')
                bad += not ok
            except Exception as e:
                print(f'BAD {p["title"]}: {str(e)[:200]}'); bad += 1
    sys.exit(1 if bad else 0)
