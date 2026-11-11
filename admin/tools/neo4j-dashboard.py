# Builds neo4j/dashboard.json (NeoDash 2.4 format, which Aura's Dashboards > Import accepts) for the swarm graph. --check runs every report's query against Aura over the Query API. neo4j.1.fringe@PrompTugal.dinis, WS-215.
import json, sys, uuid, importlib.util, argparse
import os; ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('L', ROOT + '/admin/tools/neo4j-load.py'); L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
U = lambda: str(uuid.uuid4())
def R(title, type_, query, x, y, w, h, settings=None, selection=None):
    return {'id': U(), 'title': title, 'query': query.strip(), 'width': w, 'height': h, 'x': x, 'y': y, 'type': type_,
            'selection': selection or {}, 'settings': settings or {}, 'schema': []}
pages = [
 {'title': 'Overview', 'reports': [
   R('Nodes', 'value', "MATCH (n:Fringe) RETURN count(n)", 0, 0, 3, 2),
   R('Relationships', 'value', "MATCH (:Fringe)-[e]->(:Fringe) RETURN count(e)", 3, 0, 3, 2),
   R('Agents', 'value', "MATCH (a:Agent) RETURN count(a)", 6, 0, 3, 2),
   R('Commits on dev', 'value', "MATCH (c:Commit) WHERE c.subject IS NOT NULL RETURN count(c)", 9, 0, 3, 2),
   R('Nodes by label', 'bar', "MATCH (n:Fringe) UNWIND [l IN labels(n) WHERE l <> 'Fringe'] AS label RETURN label, count(*) AS nodes ORDER BY nodes DESC",
     0, 2, 6, 4, selection={'index': 'label', 'value': 'nodes', 'key': '(none)'}),
   R('Relationships by verb (with inverse)', 'table', "MATCH (:Fringe)-[e]->(:Fringe) RETURN type(e) AS verb, e.inverse AS inverse, count(*) AS uses ORDER BY uses DESC",
     6, 2, 6, 4)]},
 {'title': 'Lanes', 'reports': [
   R('Agents crossing into other roles\' lanes', 'graph',
     "MATCH (a:Agent)-[:AUTHORED]->(c:Commit)-[x:CROSSES_INTO]->(lane:Role) WITH a, lane, count(DISTINCT c) AS n MATCH p = (a)-[:PLAYS]->(:Role) RETURN p, a, lane, apoc.create.vRelationship(a, 'CROSSES_INTO', {commits: n}, lane) AS crossing",
     0, 0, 7, 6),
   R('Lane crossings', 'table', "MATCH (a:Agent)-[:AUTHORED]->(c:Commit)-[x:CROSSES_INTO]->(lane:Role) RETURN a.name AS agent, a.role AS own_role, lane.name AS lane, count(DISTINCT c) AS commits ORDER BY commits DESC",
     7, 0, 5, 6),
   R('Shared files changed by others', 'table', "MATCH (owner:Agent)-[:OWNS]->(f:File)<-[:CHANGES]-(c:Commit)<-[:AUTHORED]-(a:Agent) WHERE a <> owner RETURN f.path AS file, owner.name AS owner, count(DISTINCT c) AS commits_by_others ORDER BY commits_by_others DESC",
     0, 6, 6, 4),
   R('Files with the most writers', 'bar', "MATCH (a:Agent)-[:AUTHORED]->(:Commit)-[:CHANGES]->(f:File) RETURN f.path AS file, count(DISTINCT a) AS writers ORDER BY writers DESC LIMIT 12",
     6, 6, 6, 4, selection={'index': 'file', 'value': 'writers', 'key': '(none)'})]},
 {'title': 'Runs and reach', 'reports': [
   R('One run, A3 down to A0, with the keys that signed', 'graph',
     "MATCH (r:Run) WITH r ORDER BY r.name DESC LIMIT 1 MATCH p = (r)-[:CONTAINS]->(u:Unit) OPTIONAL MATCH q = (u)-[:HANDS_TO]->(:Unit) OPTIONAL MATCH k = (:Key)-[:SIGNED]->(u) RETURN p, q, k",
     0, 0, 7, 6),
   R('Reach held without need, by altitude', 'table', "MATCH (u:Unit) WHERE u.reach_held > u.reach_needs RETURN u.altitude AS altitude, u.role AS role, count(u) AS units, round(avg(u.reach_needs),1) AS needs, round(avg(u.reach_held),1) AS held ORDER BY altitude",
     7, 0, 5, 3),
   R('Capabilities held without need', 'bar', "MATCH (u:Unit)-[:EXPOSES]->(x:Reach) RETURN x.name AS reach, count(u) AS units ORDER BY units DESC LIMIT 10",
     7, 3, 5, 3, selection={'index': 'reach', 'value': 'units', 'key': '(none)'}),
   R('ABP findings by agent and rule', 'table', "MATCH (f:Finding)-[:FLAGS]->(a:Agent), (f)-[:BREACHES]->(r:Rule) RETURN a.name AS agent, r.id AS rule, r.mode AS mode, count(f) AS findings ORDER BY findings DESC",
     0, 6, 12, 4)]},
 {'title': "Dinis's words", 'reports': [
   R('From a word to the commit that acted on it', 'graph',
     "MATCH p = (:Person {id:'dinis'})-[:SAID]->(:Word)<-[:ACTS_ON]-(:Commit)<-[:AUTHORED]-(:Agent) RETURN p", 0, 0, 7, 7),
   R('Words, agents and commits', 'table',
     "MATCH (:Person {id:'dinis'})-[:SAID]->(w:Word)<-[:ACTS_ON]-(c:Commit)<-[:AUTHORED]-(a:Agent) RETURN w.said_at AS said_at, w.text AS word, a.name AS agent, c.sha AS commit, c.at AS committed_at ORDER BY c.at DESC",
     7, 0, 5, 7)]},
 {'title': 'Live flows', 'reports': [
   R('Span trees (Elastic swarm-flows)', 'graph',
     "MATCH p = (:Span)-[:IS_CHILD_OF]->(:Span) RETURN p", 0, 0, 7, 6),
   R('Spans by flow and altitude', 'table',
     "MATCH (s:Span) RETURN s.flow AS flow, s.altitude AS altitude, count(s) AS spans, max(s.duration_ms) AS longest_ms, sum(CASE WHEN s.finished THEN 0 ELSE 1 END) AS unfinished ORDER BY flow, altitude",
     7, 0, 5, 6)]},
 {'title': 'Fringe events', 'reports': [
   R('Communities, their events and topics', 'graph',
     "MATCH (c:Community)<-[:IS_ORGANISED_BY]-(e:Event) WITH c, count(e) AS n ORDER BY n DESC LIMIT 8 MATCH p = (c)<-[:IS_ORGANISED_BY]-(:Event)-[:IS_ABOUT]->(:Topic) RETURN p",
     0, 0, 8, 7),
   R('Busiest organisers', 'table',
     "MATCH (c:Community)<-[:IS_ORGANISED_BY]-(e:Event) RETURN c.name AS community, count(e) AS events ORDER BY events DESC LIMIT 15", 8, 0, 4, 7)]},
]
dash = {'uuid': U(), 'title': 'Lisbon Tech Fringe swarm', 'version': '2.4',
        'settings': {'pagenumber': 0, 'editable': True, 'fullscreenEnabled': False, 'parameters': {}, 'theme': 'light'},
        'pages': pages, 'parameters': {}, 'extensions': {'active': True, 'activeReducers': []}}
if '--check' in sys.argv:
    c = L.creds(argparse.Namespace(uri='neo4j+s://4c760d12.databases.neo4j.io', user='neo4j', password_file=None, database=None))
    with L.session(c, True) as s:
        for p in pages:
            for r in p['reports']:
                q = r['query']
                try:
                    rows = s.run(q)
                    print(f"ok   {p['title']} / {r['title']}: {len(rows)} rows")
                except SystemExit as e:
                    print(f"FAIL {p['title']} / {r['title']}: {e}")
json.dump(dash, open(ROOT + '/neo4j/dashboard.json', 'w'), indent=1, ensure_ascii=False)
