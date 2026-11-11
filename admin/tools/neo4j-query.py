#!/usr/bin/env python3
"""Run the named questions in neo4j/queries.cypher against Neo4j (neo4j.1.fringe@PrompTugal.dinis, WS-215).

  python3 admin/tools/neo4j-query.py [--only NAME] [--out data/neo4j-answers.json] (--uri ... --password-file ... | NEO4J_CLOUD)
Credentials as admin/tools/neo4j-load.py; nothing secret is printed.
"""
import argparse, importlib.util, json, re, subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('loader', ROOT / 'admin/tools/neo4j-load.py')
L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)


def queries():
    out = []
    for block in re.split(r'\n(?=// name: )', (ROOT / 'neo4j/queries.cypher').read_text()):
        m = re.match(r'// name: (\S+)\n// asks: (.+)\n([\s\S]+)', block.strip())
        if m:
            out.append({'name': m.group(1), 'asks': m.group(2).strip(), 'cypher': m.group(3).strip().rstrip(';')})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only'); ap.add_argument('--out'); ap.add_argument('--limit', type=int, default=25)
    ap.add_argument('--uri'); ap.add_argument('--user', default='neo4j'); ap.add_argument('--password-file'); ap.add_argument('--database')
    args = ap.parse_args()
    from neo4j import GraphDatabase
    c = L.creds(args)
    answers = []
    with GraphDatabase.driver(c['uri'], auth=(c['user'], c['password']), notifications_min_severity='OFF') as drv:
        kw = {'database': c['database']} if c.get('database') else {}
        with drv.session(**kw) as s:
            for q in queries():
                if args.only and q['name'] != args.only:
                    continue
                rows = [r.data() for r in s.run(q['cypher'])]
                answers.append({**q, 'rows': rows[:args.limit], 'row_count': len(rows)})
                print(f"\n## {q['name']}: {q['asks']}  ({len(rows)} rows)")
                for r in rows[:args.limit]:
                    print('  ', json.dumps(r, ensure_ascii=False, default=str)[:300])
    if args.out:
        at = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        head = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        Path(args.out).write_text(json.dumps({'about': 'Answers to neo4j/queries.cypher over the swarm graph (admin/tools/neo4j-load.py), by neo4j.1.fringe@PrompTugal.dinis. Facts read from the repository and its public site at the time below; fingerprints only, never key material.',
                                              'read_at': at, 'repo_head': head, 'answers': answers}, indent=1, ensure_ascii=False, default=str) + '\n')


if __name__ == '__main__':
    main()
