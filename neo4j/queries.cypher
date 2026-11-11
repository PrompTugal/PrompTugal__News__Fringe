// Lisbon Tech Fringe swarm graph: questions and the Cypher that answers them (neo4j.1.fringe@PrompTugal.dinis, WS-215).
// Each query starts with "// name: <id>" and "// asks: <question>". admin/tools/neo4j-query.py runs them all.

// name: reach-beyond-need
// asks: Which units held more reach than they needed, and by how much (A0 compute and A1 calls holding an agent's grant)?
MATCH (r:Run)-[:CONTAINS]->(u:Unit)
WHERE u.reach_held > u.reach_needs
RETURN u.altitude AS altitude, u.role AS role, count(u) AS units,
       round(avg(u.reach_needs), 1) AS avg_needs, round(avg(u.reach_held), 1) AS avg_held,
       round(avg(u.reach_exposure), 1) AS avg_excess, collect(DISTINCT r.name)[0..3] AS runs
ORDER BY avg_excess DESC;

// name: reach-most-exposed
// asks: Which capabilities are held without need by the most units?
MATCH (u:Unit)-[:EXPOSES]->(x:Reach)
RETURN x.name AS reach, x.verb AS verb, x.scope AS scope, count(u) AS units_holding_without_need
ORDER BY units_holding_without_need DESC LIMIT 15;

// name: lanes-crossed
// asks: Which agents cross into which other roles' lanes (commits that change files only another role may write)?
MATCH (a:Agent)-[:AUTHORED]->(c:Commit)-[x:CROSSES_INTO]->(lane:Role)
RETURN a.name AS agent, a.role AS own_role, lane.name AS lane, count(DISTINCT c) AS commits, collect(DISTINCT x.file)[0..4] AS files
ORDER BY commits DESC;

// name: findings-by-agent-and-rule
// asks: Which agents does the hourly ABP review flag, under which rules, over which rounds?
MATCH (rv:Review)-[:RECORDS]->(f:Finding)-[:FLAGS]->(a:Agent), (f)-[:BREACHES]->(r:Rule)
RETURN a.name AS agent, r.id AS rule, r.mode AS mode, count(f) AS findings, collect(DISTINCT rv.round) AS rounds
ORDER BY findings DESC;

// name: shared-files-touched-by-others
// asks: Which shared files are changed by agents other than their owner?
MATCH (owner:Agent)-[:OWNS]->(f:File)<-[:CHANGES]-(c:Commit)<-[:AUTHORED]-(a:Agent)
WHERE a <> owner
RETURN f.path AS file, owner.name AS owner, count(DISTINCT c) AS commits_by_others, collect(DISTINCT a.name)[0..5] AS others
ORDER BY commits_by_others DESC;

// name: word-to-commit
// asks: The path from Dinis's word to a commit: what he said, which agent acted on it, in which commit, changing what.
MATCH p = (d:Person {id: 'dinis'})-[:SAID]->(w:Word)<-[:ACTS_ON]-(c:Commit)<-[:AUTHORED]-(a:Agent)
OPTIONAL MATCH (c)-[:CHANGES]->(f)
WITH w, c, a, collect(f.id)[0..4] AS files
RETURN w.said_at AS said_at, w.text AS word, a.name AS agent, c.sha AS commit, c.at AS committed_at, files
ORDER BY committed_at DESC;

// name: run-tree
// asks: How does each run hand work down the altitudes (A3 agent to A2 loops to A1 calls), and what did it cost?
MATCH (agent:Agent)-[:RAN]->(r:Run)-[:CONTAINS]->(u:Unit)
RETURN r.name AS run, agent.name AS runner, u.altitude AS altitude, count(u) AS units,
       round(sum(coalesce(u.cost_usd, 0)) * 1e6) / 1e6 AS cost_usd, sum(CASE WHEN u.verified THEN 1 ELSE 0 END) AS signed_and_verified
ORDER BY run, altitude DESC;

// name: unverified-or-unsigned
// asks: Which units have no verified signature (no key, or a key that did not verify)?
MATCH (u:Unit) WHERE NOT (u)<-[:SIGNED {verified: true}]-(:Key)
RETURN u.id AS unit, u.altitude AS altitude, u.role AS role, u.runner AS runner;

// name: agents-without-grant
// asks: Which agents commit on dev but have no grant in abp/policies.json?
MATCH (a:Agent)-[:AUTHORED]->(c:Commit) WHERE a.has_grant IS NULL
RETURN a.name AS agent, count(c) AS commits ORDER BY commits DESC;

// name: busiest-files
// asks: Which files have the most writers (where the swarm collides)?
MATCH (a:Agent)-[:AUTHORED]->(:Commit)-[:CHANGES]->(f:File)
RETURN f.path AS file, count(DISTINCT a) AS writers, collect(DISTINCT a.name)[0..6] AS who
ORDER BY writers DESC LIMIT 12;

// name: fringe-organisers
// asks: In the fringe graph, which communities organise the most events, and on which topics?
MATCH (c:Community)<-[:IS_ORGANISED_BY]-(e:Event)
OPTIONAL MATCH (e)-[:IS_ABOUT]->(t:Topic)
RETURN c.name AS community, count(DISTINCT e) AS events, collect(DISTINCT t.name)[0..5] AS topics
ORDER BY events DESC LIMIT 12;

// name: grammar
// asks: Every verb in the graph, with its inverse and how often it is used (no relates_to).
MATCH (v:Verb)
OPTIONAL MATCH ()-[e]->() WHERE type(e) = v.id
RETURN v.id AS verb, v.says AS says, v.inverse AS inverse, v.subject AS subject, v.object AS object, count(e) AS uses
ORDER BY uses DESC;
