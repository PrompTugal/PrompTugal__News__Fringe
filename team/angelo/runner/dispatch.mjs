#!/usr/bin/env node
// Dry-run adapter: one of our signed task packets (tasks/<id>/packet.json, abp/tools/packets.mjs) as a workflow_dispatch
// on the Storm Charles team's runner design (https://storm-charles.promptugal.news/agents/conductor/RUNNER.html).
// runner.fringe@PrompTugal.angelo for conductor.fringe@PrompTugal.angelo, 11 November 2026 (WS-215). See mapping.md here.
//   node team/angelo/runner/dispatch.mjs --id <packet id> [--repo owner/name] [--workflow run.yml] [--ref main]
//        [--as conductor.fringe@PrompTugal.angelo] [--out artifact|console|lane] [--json]
// It SENDS NOTHING: no network call, no token read, no file written. It verifies the packet (packets.mjs verify), finds the
// commit on origin that holds it, and prints the request it would send, the trace ids, and where the result would land.
// The runner repository does not exist yet (Dinis creates it): the default --repo is a placeholder.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const hex = (s, n) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, n);
// the same derivations as abp/tools/flow.mjs and the storm's tools/models-calls.mjs (they agree): one trace per flow
const traceIdOf = (flow) => hex('trace:' + flow, 32);
const spanIdOf = (unit) => hex('span:' + unit, 16);
const unitOfAgent = (agent) => 'A3-' + agent;                 // the storm's convention for the calling agent's unit
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' }).trim();
const fail = (m) => { console.error('dispatch (dry run): ' + m); process.exit(1); };

const id = arg('--id');
if (!id) fail('usage: node team/angelo/runner/dispatch.mjs --id <packet id> [--repo owner/name] [--workflow run.yml] [--ref main] [--as AGENT] [--out artifact|console|lane] [--json]');
const repo = arg('--repo', 'UNSET/runner-repo-not-yet-created');
const workflow = arg('--workflow', 'run.yml');
const ref = arg('--ref', 'main');
const as = arg('--as', 'conductor.fringe@PrompTugal.angelo');
const out = arg('--out', 'artifact');
if (!['artifact', 'console', 'lane'].includes(out)) fail('--out is artifact, console or lane');
const rel = `tasks/${id}/packet.json`;
if (!fs.existsSync(path.join(ROOT, rel))) fail(`no ${rel}`);

// 1. verify with our own tool, unchanged
const v = spawnSync(process.execPath, [path.join(ROOT, 'abp/tools/packets.mjs'), 'verify', '--id', id], { cwd: ROOT, encoding: 'utf8' });
if (v.status !== 0) fail('packets.mjs verify failed, nothing would be dispatched:\n' + (v.stdout || '') + (v.stderr || ''));

// 2. the immutable packet: the last commit on origin/dev that touched it, and the sha256 of its bytes at that commit
const env = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const P = env.body;
const commit = git('log', '-1', '--format=%H', 'origin/dev', '--', rel);
if (!commit) fail(`${rel} is not on origin/dev yet: push it first (the runner reads it by URL at a commit)`);
const atCommit = execFileSync('git', ['-C', ROOT, 'show', `${commit}:${rel}`]);
const sha256 = crypto.createHash('sha256').update(atCommit).digest('hex');
const local = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const origin = git('remote', 'get-url', 'origin').replace(/\.git$/, '').replace(/^https:\/\/github\.com\//, '');
const packet_url = `https://raw.githubusercontent.com/${origin}/${commit}/${rel}`;

// 3. our packet -> their job
const MODE = { A0: 'compute', A1: 'llm', A2: 'loop' };
const mode = MODE[P.altitude];
if (!mode) fail(`altitude ${P.altitude} has no runner mode (A0, A1, A2 only: an A3 is an agent, not a job)`);
const flow = `dispatch-${id}-${as.split('@')[0]}-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`;
const callerUnit = unitOfAgent(as);
const keyEntry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/keys.json'), 'utf8')).keys.find((k) => k.agent === as && k.status !== 'superseded');
if (!keyEntry) fail(`no key for ${as} in data/keys.json: the runner could not seal a result to it`);
const replyTo = keyEntry.id;
const inputs = {                                   // the seven inputs of the design's run.yml, all strings (GitHub's rule)
  mode,
  task: 'fringe-packet',                          // proposed: one generic runner task that takes prompt + output from the packet
  packet_url,
  packet_sha256: sha256,
  reply_to: replyTo,                               // the dispatcher's key id in our data/keys.json: the one who lands the result
  trace_id: traceIdOf(flow),
  parent_span_id: spanIdOf(callerUnit),
};
const proposed = {                                  // not in the design yet (mapping.md, gaps): the smallest additions
  out,                                             // the way out; the design has three but no input to choose one
  keys_url: `https://raw.githubusercontent.com/${origin}/${git('log', '-1', '--format=%H', 'origin/dev', '--', 'data/keys.json')}/data/keys.json`,
  output_schema_from: 'packet.body.output',        // {required, enum} -> JSON schema (below), checked by the runner
};
const schema = { type: 'object', required: P.output.required, properties: Object.fromEntries(P.output.required.map((k) => [k, P.output.enum && P.output.enum[k] ? { type: 'string', enum: P.output.enum[k] } : { type: 'string', minLength: 1 }])) };
const runnerName = `runner.${repo.split('/')[1] || 'unset'}`;
const request = {
  method: 'POST',
  endpoint: `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
  headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer <a token with actions:write on the runner repository only; never printed>' },
  body: { ref, inputs },
};
const expected = {
  github_answer: '204 No Content (no run id in the answer: find the run by listing the workflow\'s runs, event=workflow_dispatch, created after the dispatch)',
  find_run: `GET https://api.github.com/repos/${repo}/actions/workflows/${workflow}/runs?event=workflow_dispatch&per_page=5`,
  result: out === 'artifact' ? { where: `the run's artifact (proposed name: result-${id})`, read: `GET https://api.github.com/repos/${repo}/actions/runs/<run_id>/artifacts (actions:read)` }
    : out === 'console' ? { where: 'the job log, metadata and the result JSON on one marked line', read: `GET https://api.github.com/repos/${repo}/actions/runs/<run_id>/logs` }
      : { where: 'the runner\'s results lane on dev.send.sgraph.ai, sealed to ' + replyTo, read: 'drain the lane, open with our session key, check the runner\'s signature' },
  lands_at: `tasks/${id}/result-${runnerName}.json (committed by the conductor after it checks the runner's signature, packet_sha256 and the schema)`,
  flow: { flow, trace_id: inputs.trace_id, parent_unit: callerUnit, parent_span_id: inputs.parent_span_id, note: 'the runner\'s A1/A2 spans should hang under parent_span_id in this trace' },
};
const report = { dry_run: true, sent: false, packet: { id, altitude: P.altitude, from: P.from, for: P.for, inputs: P.inputs.length, grant: P.grant, tier: P.tier, max_tokens: P.max_tokens, signed_by_fp: env.by.fp, verify: v.stdout.trim(), commit, sha256_at_commit: sha256, local_matches_commit: local === sha256 }, request, proposed_inputs: proposed, output_schema: schema, expected };

if (process.argv.includes('--json')) { console.log(JSON.stringify(report, null, 1)); process.exit(0); }
console.log(`DRY RUN: nothing sent. Packet ${id} (${P.altitude}, ${P.inputs.length} inputs, grant ${JSON.stringify(P.grant)}), from ${P.from}`);
console.log(`verify: ${v.stdout.trim()}`);
console.log(`packet at ${commit.slice(0, 12)} on origin/dev, sha256 ${sha256}${local === sha256 ? '' : ' (WARNING: the working copy differs from that commit)'}`);
console.log(`\nWOULD SEND:\n${request.method} ${request.endpoint}`);
for (const [k, val] of Object.entries(request.headers)) console.log(`${k}: ${val}`);
console.log('\n' + JSON.stringify(request.body, null, 2));
console.log(`\nproposed extra inputs (not in the design yet): ${JSON.stringify(proposed, null, 2)}`);
console.log(`output schema for the runner's check: ${JSON.stringify(schema)}`);
console.log(`\nEXPECTED: ${expected.github_answer}`);
console.log(`run: ${expected.find_run}`);
console.log(`result: ${expected.result.where}; read with ${expected.result.read}`);
console.log(`lands at: ${expected.lands_at}`);
console.log(`trace: ${expected.flow.trace_id}, parent span ${expected.flow.parent_span_id} (${callerUnit}), flow ${flow}`);
