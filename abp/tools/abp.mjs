#!/usr/bin/env node
// The ABP tools of Lisbon Fringe (architect.1.fringe@PrompTugal.dinis, work/39). Ported from PrompTugal__News__Website
// board/abp/tools/abp.mjs. No dependencies; the decisions come from the hook itself (.claude/hooks/abp.mjs).
//   node abp/tools/abp.mjs build                abp/<agent>.md for every agent in abp/policies.json, and abp/index.json
//   node abp/tools/abp.mjs check [--range A..B] [--json]
//                                               each commit's paths against its Agent: trailer's grant. OBSERVE ONLY:
//                                               it prints WARN lines and always exits 0 (Dinis, 13:36 UTC). The gate
//                                               calls it on the commits that are new since origin/dev.
//   node abp/tools/abp.mjs review [--since ISO] [--out FILE]
//                                               the hourly review: commits outside a grant, per rule and agent, the
//                                               hook log's observe events and overrides (this session's), what each teaches
//   node abp/tools/abp.mjs test                 the decisions on fixtures, and that the hook never blocks; exit 1 on a failure
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOOK = path.join(ROOT, '.claude', 'hooks', 'abp.mjs');
process.env.CLAUDE_PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || ROOT;
const abp = await import(HOOK);
const P = abp.loadPolicy(ROOT);
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const who = agent => { const w = abp.parseAgent(agent); return w ? { ...w, ...finishWho(w) } : { kind: 'unidentified', agent }; };
function finishWho(w) {
  const a = (P.agents || {})[w.agent];
  let role = (a && a.role) || (w.name ? w.name.split('.')[0] : null);
  if (w.agent === 'conductor.fringe@PrompTugal.dinis') role = 'lead';
  return { kind: a || w.kind === 'team' ? 'team' : w.kind, role };
}

// ---------- build ----------
function build() {
  const dir = path.join(ROOT, 'abp');
  const index = [];
  const RT = (() => { try { return Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/runtimes.json'), 'utf8')).agents.map((x) => [x.agent, x])); } catch { return {}; } })();
  for (const [agent, a] of Object.entries(P.agents).filter(([k]) => k !== 'about')) {
    const w = who(agent), g = abp.grantOf(w, P), r = P.roles[w.role] || {};
    const fill = s => s.replace(/\{person\}/g, w.person || '?').replace(/\{name\}/g, w.name || '?').replace(/\{claimed\}/g, 'NN-<item you own>.md').replace(/\{keyid\}/g, '<your key id>').replace(/#own-entry/, ' (your own entry)').replace(/#own-modules/, ' (your own page modules)');
    const flags = [g.subagents && 'sub-agents inside its own run', g.notify_person && 'a push notification to its person', g.remote_read && "reading the cloud sessions' list and events", g.messages && 'messages to other sessions', g.sessions && "starting sessions, at its person's word"].filter(Boolean);
    const shared = (P.shared_files.items || []).filter(x => x.owner === agent).map(x => x.file);
    const md = `---
title: "ABP: ${agent}"
agent: ${agent}
role: ${w.role}
policy: abp/policies.json v${P.version} (sha256:${P._sha})
generated: by node abp/tools/abp.mjs build; never edited by hand
kept_by: ${P.kept_by}
authority: Dinis Cruz, operator
---
# ABP: ${agent}

**Mode: observe.** The grant below is your mandate. Nothing blocks you: the hooks in \`.claude/settings.json\` and the gate log a call or a commit outside the grant, and the architect reviews the log every hour (Dinis, 11 November 2026, 13:36 UTC: "for now, you should start with observe mode so we can learn"). Keep to it as if it were enforced. A rule moves towards enforcement only after two or three rounds of logs, by Dinis's decision, rule by rule; even then a conductor or Dinis can override it, and the override is logged. Where this grant is too tight for a good reason, say so in your status asks ("Dinis: ...").

## Mandate (the grant)

- **Role:** ${w.role}${a.under ? `, under ${a.under}` : ''}. **Account:** ${a.account || 'unknown'}.${RT[agent] ? `\n- **Runs on:** ${RT[agent].runtime} (models: ${RT[agent].models}); **I/O level:** ${RT[agent].io_level} (data/runtimes.json, /agentic-team/where-agents-run/).` : ''}
- **Focus:** ${r.focus || a.lane || 'its status file only, until its grant is written'}.${a.lane ? `\n- **Lane:** ${a.lane}.` : ''}
- **Writes (this repository):** ${g.writes.map(x => '`' + fill(x) + '`').join(', ')}.${shared.length ? `\n- **Owns (shared files; others send it their changes):** ${shared.map(x => '`' + x + '`').join(', ')}.` : ''}
- **Writes (other repositories):** \`PrompTugal__News__Website board/keys.json\` (its own public key) only.
- **Writes (outside git):** ${P.common.writes_outside_repo.map(x => '`' + x.replace('{home}', '~') + '`').join(', ')}.
- **Tools:** reading, searching and writing files inside the paths above; the shell, within the rules below; reading the web (never websummit.com by machine); GitHub's read tools on ${P.tools.github_repos.map(x => '`' + x + '`').join(', ')}; the cloud session's documentation, \`add_repo\` for reading, and its own wake.${flags.length ? '\n- **Also granted:** ' + flags.join('; ') + '.' : ''}
- **Sends to:** ${g.send.map(h => '`' + h + '`').join(', ')} only.
- **Pushes to:** \`${g.branch}\`${g.branch === 'dev' ? ` with \`AGENT=${agent} admin/tools/release.sh\`` : ' (the lead reviews and brings it onto dev)'}.
- **Never:** ${r.never || 'writes outside its status file'}.${a.note ? `\n- **Note:** ${a.note}.` : ''}

## Outside the mandate (logged, not blocked)

- Any connector: Gmail, Google Drive, Calendar, Claude Docs, any MCP server but GitHub's read tools and the cloud session's own tools (R3).
- New sessions, scheduled tasks for other sessions, environments, credentials, workflows (R4).
- Pushing anywhere but \`${g.branch}\`; force-push, branch deletion, tags, history rewrites, empty commits (R5).
- Writing outside the paths above; \`abp/\` and \`.claude/\` (the architect's), \`briefs/\` (the lead's), \`BRIEF.md\` (never rewritten), \`admin/series.txt\` (dev's, at a major release), and a shared file another agent owns (R6).
- Comments, issues, pull requests or merges through GitHub's API; publishing artifacts; email; posts; a send to a host not listed (R7).
- Printing the environment or a secret; reading a private key into the conversation (R8).
- Committing or releasing under another agent's name (R9).

## Core rules (every agent)

${P.core.map(c => `- **${c.id}** ${c.rule} *(${c.barrier}; mode ${abp.ruleMode(c.id, P)})*`).join('\n')}

## Licence to operate

| | |
|---|---|
| Authority and accountable owner | Dinis Cruz, operator${w.person && w.person !== 'dinis' ? `; ${w.person} for their own conductor's work` : ''} |
| Licensee | ${agent} (its Claude Code session and its session key in \`data/keys.json\`) |
| Conditions | this ABP; CLAUDE.md; ROLES.md |
| Validity | from 11 November 2026, for the session's life, while its status file is kept |
| Review | every hour by ${P.kept_by} (\`node abp/tools/abp.mjs review\`); on any change to its reach |
`;
    fs.writeFileSync(path.join(dir, `${agent}.md`), md);
    index.push({ agent, role: w.role, person: w.person, account: a.account || null, branch: g.branch, writes: g.writes.map(fill), owns: shared, sends: g.send, page: `abp/${agent}.md` });
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ about: 'Every agent\'s grant, flattened from abp/policies.json by node abp/tools/abp.mjs build: what /abp/ shows.', policy: P.version, sha256: P._sha, mode: P.mode, agents: index }, null, 2) + '\n');
  console.log(`abp build: ${index.length} ABPs from abp/policies.json v${P.version} (sha256:${P._sha})`);
}

// ---------- check: each commit's paths against its Agent:'s grant (warn, never fail) ----------
export function commitsIn(range) {
  let raw;
  try { raw = git('log', '--no-merges', '--format=%x1e%h%x1f%cI%x1f%s%x1f%b%x1f', '--name-only', range); } catch { return []; }
  return raw.split('\x1e').slice(1).map(rec => {
    const [h, at, subject, body, files] = rec.split('\x1f');
    const t = /^Agent:\s*(\S+)/m.exec(body || '');
    const s = /^([A-Za-z][\w.-]*@[\w.-]+?)(?:\s*\([^)]*\))?:\s/.exec(subject || '');
    return { h, at, subject, trailer: t && t[1], agent: (t && t[1]) || (s && s[1]) || null, files: (files || '').split('\n').map(x => x.trim()).filter(Boolean) };
  });
}
export function checkCommit(c) {
  const out = [];
  if (!c.trailer) out.push({ rule: 'R9', file: null, why: 'no Agent: trailer (CLAUDE.md: subject "<agent>: <what>", trailers Agent:, Issue: WS-215, For:)' });
  if (!c.agent) return out;
  const w = who(c.agent);
  if (w.kind !== 'team' || !P.agents[c.agent]) out.push({ rule: 'R2', file: null, why: `${c.agent} has no grant in abp/policies.json yet` });
  for (const f of c.files) if (/^\.claude\//.test(f) && c.agent !== 'architect.1.fringe@PrompTugal.dinis') out.push({ rule: 'R6', file: f, why: `a change to the hooks by ${c.agent} (security finding 28: only architect.1 changes .claude/; review before agents wake on it)` });
  for (const f of c.files) if (f === 'abp/overrides.json' && !/^conductor\.|^architect\./.test(c.agent || '')) out.push({ rule: 'R6', file: f, why: `an override written by ${c.agent}: only a conductor (or Dinis) grants an override` });
  if (w.role === 'lead') return out;   // the lead writes widely by its role; its shared-file edits are listed by review
  for (const f of c.files) {
    if (f === 'data/keys.json' || /^team\/[^/]+\/(agents\/)?[^/]*\.json$/.test(f) && f.includes(w.name || '\0')) continue;
    const d = abp.checkWrite(w, path.join(ROOT, f), { readOwner: (abs) => (/^owner:[ \t]*(.*)$/m.exec(fs.readFileSync(abs, 'utf8')) || [, ''])[1].trim() }, P);
    if (d.decision === 'deny') out.push({ rule: d.rule, file: f, why: d.reason });
  }
  return out;
}
function check() {
  // locally: what this clone is about to push; in CI (the tree is already dev): the last few commits
  const range = arg('--range', (() => { if (process.env.GITHUB_SHA) return 'HEAD~5..HEAD'; try { git('rev-parse', '--verify', 'origin/dev'); return 'origin/dev..HEAD'; } catch { return 'HEAD~1..HEAD'; } })());
  const res = commitsIn(range).map(c => ({ ...c, findings: checkCommit(c) })).filter(c => c.findings.length);
  if (process.argv.includes('--json')) { console.log(JSON.stringify(res, null, 2)); return; }
  for (const c of res) for (const f of c.findings) console.log(`WARN abp ${f.rule} ${c.h} ${c.agent || '(no agent)'}: ${f.file ? f.file + ': ' : ''}${f.why} (observe: logged, not blocked)`);
  if (!res.length) console.log(`abp check: ${range}: every commit inside its grant`);
}

// ---------- review: the hourly report ----------
function review() {
  const since = arg('--since', new Date(Date.now() - 3600e3).toISOString());
  const cs = commitsIn(`--since=${since}`);
  const rows = cs.map(c => ({ ...c, findings: checkCommit(c) }));
  const byRule = {}, byAgent = {};
  for (const c of rows) for (const f of c.findings) { byRule[f.rule] = (byRule[f.rule] || 0) + 1; byAgent[c.agent || '(none)'] = (byAgent[c.agent || '(none)'] || 0) + 1; }
  // the hook log of this machine (each session logs its own: other sessions' logs reach the review only through their run logs)
  const LOG = process.env.ABP_LOG_DIR || path.join(os.homedir(), '.abp', 'log');
  const events = [];
  try { for (const f of fs.readdirSync(LOG)) for (const l of fs.readFileSync(path.join(LOG, f), 'utf8').split('\n')) { try { const e = JSON.parse(l); if (e.t >= since && (e.decision === 'observe' || e.decision === 'override' || e.ev === 'hook-error' || e.ev === 'altitude')) events.push(e); } catch {} } } catch {}
  const lines = [
    `# ABP review, ${now()}`, '',
    `Policy abp/policies.json v${P.version} (sha256:${P._sha}), mode ${P.mode}: nothing blocked. Since ${since}: ${rows.length} commits, ${rows.filter(c => c.findings.length).length} with paths outside their grant.`, '',
    '## Commits outside a grant (observe)', '',
    ...(rows.filter(c => c.findings.length).flatMap(c => c.findings.map(f => `- \`${c.h}\` ${c.agent || '(no agent)'} **${f.rule}** ${f.file ? '`' + f.file + '`: ' : ''}${f.why}`))),
    '', '## By rule', '', ...Object.entries(byRule).map(([r, n]) => `- ${r}: ${n}`),
    '', '## By agent', '', ...Object.entries(byAgent).sort((a, b) => b[1] - a[1]).map(([a, n]) => `- ${a}: ${n}`),
    '', `## Hook events on this machine (observe, override, hook-error): ${events.length}`, '',
    ...events.slice(-40).map(e => `- ${e.t} ${e.agent || 'unidentified'} ${e.decision || e.ev} ${e.rule || ''} ${e.tool || ''}: ${e.reason || e.error || ''}${e.override ? ` (override by ${e.override.by}: ${e.override.why})` : ''}`),
    '', '## What it teaches', '', '_Written by the architect at each review: which grants are too tight (a relaxation for Dinis), which are habits to change (a note to the agent), which rules look safe to move towards enforcement after three rounds._', '',
  ];
  const out = arg('--out');
  if (out) fs.writeFileSync(path.resolve(ROOT, out), lines.join('\n')); else console.log(lines.join('\n'));
}

// ---------- test ----------
function test() {
  let fails = 0;
  const t = (name, got, want) => { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ' (want ' + want + ')'}`); };
  const W = a => who(a);
  const d = (w, tool, ti) => abp.decide({ tool_name: tool, tool_input: ti, cwd: ROOT }, w, P).decision;
  const dev2 = W('dev.2.fringe@PrompTugal.dinis'), d1 = W('design.1.fringe@PrompTugal.dinis'), r2 = W('researcher.2.fringe@PrompTugal.dinis'), lead = W('conductor.fringe@PrompTugal.dinis'), indi = W('conductor.fringe@PrompTugal.indi');
  t('dev.2 writes build.mjs (owns it)', d(dev2, 'Write', { file_path: path.join(ROOT, 'admin/build/build.mjs') }), 'allow');
  t('design.1 writes build.mjs (dev.2 owns it)', d(d1, 'Edit', { file_path: path.join(ROOT, 'admin/build/build.mjs') }), 'deny');
  t('design.1 writes its design module', d(d1, 'Edit', { file_path: path.join(ROOT, 'admin/build/designs/a.mjs') }), 'allow');
  t('design.1 writes its status file', d(d1, 'Write', { file_path: path.join(ROOT, 'team/dinis/agents/design.1.json') }), 'allow');
  t('design.1 writes data/events.json', d(d1, 'Edit', { file_path: path.join(ROOT, 'data/events.json') }), 'deny');
  t('researcher.2 writes data/events.json', d(r2, 'Edit', { file_path: path.join(ROOT, 'data/events.json') }), 'allow');
  t('Indi writes data/communities.json', d(indi, 'Edit', { file_path: path.join(ROOT, 'data/communities.json') }), 'allow');
  t('Indi writes team/indi/status.json', d(indi, 'Edit', { file_path: path.join(ROOT, 'team/indi/status.json') }), 'allow');
  t('Indi writes team/vicky/status.json', d(indi, 'Edit', { file_path: path.join(ROOT, 'team/vicky/status.json') }), 'deny');
  t('dev.2 edits the hooks', d(dev2, 'Edit', { file_path: path.join(ROOT, '.claude/hooks/abp.mjs') }), 'deny');
  t('lead writes work/41', d(lead, 'Write', { file_path: path.join(ROOT, 'work/41-x.md') }), 'allow');
  t('git push origin main', d(dev2, 'Bash', { command: 'git push origin main' }), 'deny');
  t('git push --force', d(dev2, 'Bash', { command: 'git push --force origin dev' }), 'deny');
  t('release under own name', d(dev2, 'Bash', { command: 'AGENT=dev.2.fringe@PrompTugal.dinis admin/tools/release.sh' }), 'allow');
  t('release under another name', d(dev2, 'Bash', { command: 'AGENT=dev.1.fringe@PrompTugal.dinis admin/tools/release.sh' }), 'deny');
  t('curl websummit.com', d(r2, 'Bash', { command: 'curl -s https://websummit.com/' }), 'deny');
  t('Gmail connector', d(lead, 'mcp__abc__send_message', {}), 'deny');
  t('github read', d(dev2, 'mcp__github__get_file_contents', { owner: 'PrompTugal', repo: 'PrompTugal__News__Fringe' }), 'allow');
  t('github comment', d(dev2, 'mcp__github__add_issue_comment', { owner: 'PrompTugal', repo: 'PrompTugal__News__Fringe' }), 'deny');
  t('own wake', d(dev2, 'mcp__claude-code-remote__send_later', { delay_minutes: 60 }), 'allow');
  t('create_session by dev.2', d(dev2, 'mcp__claude-code-remote__create_session', {}), 'deny');
  t('create_session by the lead', d(lead, 'mcp__claude-code-remote__create_session', {}), 'allow');
  // the hook process: observe mode never blocks, whatever it would deny
  const run = (input, env = {}) => spawnSync(process.execPath, [HOOK, 'pre-tool'], { input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, ABP_LOG_DIR: path.join(os.tmpdir(), 'abp-test-log'), ...env } });
  const r1 = run({ session_id: 'test', tool_name: 'Bash', tool_input: { command: 'git push --force origin main' }, cwd: ROOT }, { ABP_AGENT: 'dev.2.fringe@PrompTugal.dinis' });
  t('hook: R5 enforced (Dinis): force-push to main is BLOCKED, exit 0 with a deny', `${r1.status}:${/"permissionDecision":"deny"/.test(r1.stdout)}`, '0:true');
  const r1o = run({ session_id: 'test', tool_name: 'Bash', tool_input: { command: 'git push --force origin main' }, cwd: ROOT }, { ABP_AGENT: 'dev.2.fringe@PrompTugal.dinis', ABP_OVERRIDE: 'R5:test of the conductor override', ABP_OVERRIDE_BY: 'conductor.fringe@PrompTugal.dinis' });
  t('hook: a conductor override lets an enforced rule through (and is logged)', `${r1o.status}:${r1o.stdout.trim() === '' ? 'empty' : 'deny'}`, '0:empty');
  const r8 = run({ session_id: 'test', tool_name: 'Bash', tool_input: { command: 'printenv' }, cwd: ROOT }, { ABP_AGENT: 'dev.2.fringe@PrompTugal.dinis' });
  t('hook: R8 enforced: printing the environment is BLOCKED', /"permissionDecision":"deny"/.test(r8.stdout), true);
  const r9 = run({ session_id: 'test', tool_name: 'Bash', tool_input: { command: 'AGENT=dev.1.fringe@PrompTugal.dinis admin/tools/release.sh' }, cwd: ROOT }, { ABP_AGENT: 'dev.2.fringe@PrompTugal.dinis' });
  t('hook: R9 enforced: releasing under another name is BLOCKED', /"permissionDecision":"deny"/.test(r9.stdout), true);
  const r6w = run({ session_id: 'test', tool_name: 'Edit', tool_input: { file_path: path.join(ROOT, 'data/events.json') }, cwd: ROOT }, { ABP_AGENT: 'design.1.fringe@PrompTugal.dinis' });
  t('hook: R6 still observe: an out-of-grant write is logged, not blocked', r6w.stdout.trim(), '');
  const ok5 = run({ session_id: 'test', tool_name: 'Bash', tool_input: { command: 'AGENT=dev.2.fringe@PrompTugal.dinis admin/tools/release.sh' }, cwd: ROOT }, { ABP_AGENT: 'dev.2.fringe@PrompTugal.dinis' });
  t('hook: the normal release is never blocked', ok5.stdout.trim(), '');
  const ok6 = run({ session_id: 'test', tool_name: 'Bash', tool_input: { command: 'git push -u origin work/security.fringe' }, cwd: ROOT }, { ABP_AGENT: 'security.fringe@PrompTugal.dinis' });
  t('hook: a branch agent pushing its own work/<name> is not blocked', ok6.stdout.trim(), '');
  const no6 = run({ session_id: 'test', tool_name: 'Bash', tool_input: { command: 'git push origin work/dev.fringe' }, cwd: ROOT }, { ABP_AGENT: 'security.fringe@PrompTugal.dinis' });
  t('hook: pushing another agent\'s branch is blocked (R5)', /"permissionDecision":"deny"/.test(no6.stdout), true);
  const r3 = run({ session_id: 'test', tool_name: 'Edit', tool_input: { file_path: path.join(ROOT, 'abp/policies.json') }, cwd: ROOT }, { ABP_AGENT: 'design.1.fringe@PrompTugal.dinis', ABP_OVERRIDE: 'R6:test of the escape hatch', ABP_OVERRIDE_BY: 'conductor.fringe@PrompTugal.dinis' });
  t('hook: an override is allowed (exit 0)', `${r3.status}:${r3.stdout.trim() === '' ? 'empty' : r3.stdout}`, '0:empty');
  const logf = path.join(os.tmpdir(), 'abp-test-log', 'test.jsonl');
  const last = fs.readFileSync(logf, 'utf8').trim().split('\n').map(l => JSON.parse(l)).filter(e => e.ev === 'tool').slice(-2);
  const evs = fs.readFileSync(logf, 'utf8').trim().split('\n').map(l => JSON.parse(l)).filter(e => e.ev === 'tool');
  t('hook: logged observe (R6 write)', (evs.find(e => e.rule === 'R6' && e.tool === 'Edit') || {}).decision, 'observe');
  t('hook: logged deny (R5 force-push)', (evs.find(e => e.rule === 'R5') || {}).decision, 'deny');
  t('hook: logged override with who', last[1].decision === 'override' && last[1].override.by, 'conductor.fringe@PrompTugal.dinis');
  const r6 = run({ session_id: 'test', tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose', prompt: 'x' }, cwd: ROOT }, { ABP_AGENT: 'design.1.fringe@PrompTugal.dinis' });
  const alt = fs.readFileSync(logf, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.ev === 'altitude').pop();
  t('hook: a sub-agent logs R12 mixing altitudes (A2 mandate, A3 grant), not blocked', `${r6.status}:${r6.stdout.trim() === '' ? 'empty' : r6.stdout}:${alt && alt.rule}:${alt && alt.mandate}<${alt && alt.grant}`, '0:empty:R12:A2<A3');
  run({ session_id: 'test2', tool_name: 'Agent', tool_input: { subagent_type: 'Explore', prompt: 'x' }, cwd: ROOT }, { ABP_AGENT: 'design.1.fringe@PrompTugal.dinis' });
  t('hook: a read-only Explore loop does not mix altitudes (no R12 event)', fs.readFileSync(path.join(os.tmpdir(), 'abp-test-log', 'test2.jsonl'), 'utf8').includes('"ev":"altitude"'), false);
  const r4 = spawnSync(process.execPath, [HOOK, 'pre-tool'], { input: 'garbage{', encoding: 'utf8', env: { ...process.env, ABP_LOG_DIR: path.join(os.tmpdir(), 'abp-test-log') } });
  t('hook: garbage input exits 0', r4.status, 0);
  const r5 = spawnSync(process.execPath, [HOOK, 'session-start'], { input: '{"session_id":"test","source":"compact"}', encoding: 'utf8', env: { ...process.env, ABP_LOG_DIR: path.join(os.tmpdir(), 'abp-test-log'), ABP_AGENT: 'design.1.fringe@PrompTugal.dinis' } });
  t('hook: session-start re-anchors the ABP', /ABP: design\.1\.fringe@PrompTugal\.dinis/.test(JSON.parse(r5.stdout).hookSpecificOutput.additionalContext), true);
  // finding 28: what the hook touches. Static: no network, process or key-store code, only the named variables.
  const src = fs.readFileSync(HOOK, 'utf8');
  t('28a hook source: no network module or fetch', /node:(https?|net|tls|dns|dgram|http2)\b|\bfetch\(|WebSocket/.test(src), false);
  t('28b hook source: no child process or worker', /node:(child_process|worker_threads|cluster)|(?<![.\w])(spawn|spawnSync|exec|execSync|execFile|execFileSync|fork)\(/.test(src), false);
  t('28c hook source: never names the key store in code', /path\.join\([^)]*['"]\.sg-send['"]/.test(src), false);
  const envs = [...new Set([...src.matchAll(/process\.env\.([A-Z_]+)/g)].map((m) => m[1]))].sort().join(',');
  t('28d hook source: reads only the named variables', envs, 'ABP_AGENT,ABP_LOG_DIR,ABP_OVERRIDE,ABP_OVERRIDE_BY,CLAUDE_PROJECT_DIR');
  t('28e hook source: writes only through logEvent (one append, one mkdir)', (src.match(/fs\.(writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync|renameSync|copyFileSync)/g) || []).sort().join(','), 'fs.appendFileSync,fs.mkdirSync');
  // Dynamic: run every mode under Node's permission model: reads allowed only in abp/, the hook, HOLD.md, .git/HEAD
  // and ~/.abp; writes only in the log folder; no child process. A fake HOME holds a private key it must not touch.
  const H = fs.mkdtempSync(path.join(os.tmpdir(), 'abp-home-')), LOG = path.join(H, '.abp', 'log');
  fs.mkdirSync(path.join(H, '.sg-send', 'keys', 'k'), { recursive: true }); fs.writeFileSync(path.join(H, '.sg-send', 'keys', 'k', 'private_key.pem'), 'NOT A KEY');
  fs.mkdirSync(LOG, { recursive: true }); fs.writeFileSync(path.join(H, '.abp', 'whoami'), 'design.1.fringe@PrompTugal.dinis\n');
  const allowRead = [path.join(ROOT, 'abp'), HOOK, path.join(ROOT, 'HOLD.md'), path.join(ROOT, '.git', 'HEAD'), path.join(H, '.abp')].map((p) => '--allow-fs-read=' + p);
  const jail = (mode, input) => spawnSync(process.execPath, ['--permission', ...allowRead, '--allow-fs-write=' + LOG, HOOK, mode], { input: JSON.stringify(input), encoding: 'utf8', env: { PATH: process.env.PATH, HOME: H, CLAUDE_PROJECT_DIR: ROOT } });
  const runs = [
    jail('session-start', { session_id: 'jail', source: 'startup' }),
    jail('prompt', { session_id: 'jail', prompt: 'hello' }),
    jail('pre-tool', { session_id: 'jail', tool_name: 'Bash', tool_input: { command: 'cat ~/.sg-send/keys/k/private_key.pem; git push origin dev' }, cwd: ROOT }),
    jail('pre-tool', { session_id: 'jail', tool_name: 'Edit', tool_input: { file_path: path.join(ROOT, 'work/48-where-agents-run.md') }, cwd: ROOT }),
    jail('pre-tool', { session_id: 'jail', tool_name: 'Agent', tool_input: { prompt: 'x' }, cwd: ROOT }),
    jail('pre-compact', { session_id: 'jail', trigger: 'auto' })];
  const jlog = fs.readFileSync(path.join(LOG, 'jail.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  t('28f under the permission model every mode exits 0', runs.map((r) => r.status).join(''), '000000');
  t('28g no access denied, no hook error (nothing read or written outside the allowed paths)', runs.some((r) => /ERR_ACCESS_DENIED/.test(r.stderr)) || jlog.some((e) => e.ev === 'hook-error'), false);
  t('28h it knows who it is from ~/.abp/whoami alone', jlog.find((e) => e.ev === 'session-start').agent, 'design.1.fringe@PrompTugal.dinis');
  t('28i it wrote only its log (the fake home holds .abp and the untouched .sg-send)', fs.readdirSync(H).sort().join(',') + ':' + fs.readdirSync(path.join(H, '.abp')).sort().join(','), '.abp,.sg-send:log,whoami');
  fs.rmSync(H, { recursive: true, force: true });
  fs.rmSync(path.join(os.tmpdir(), 'abp-test-log'), { recursive: true, force: true });
  console.log(fails ? `abp test: ${fails} failed` : 'abp test: all passed');
  process.exitCode = fails ? 1 : 0;
}

// ---------- whoami: the agent's label for the hook (finding 28: the hook itself never reads the key store) ----------
function whoami() {
  const KEYS = path.join(os.homedir(), '.sg-send', 'keys'), labels = new Set();
  try { for (const d of fs.readdirSync(KEYS)) { try { const m = JSON.parse(fs.readFileSync(path.join(KEYS, d, 'metadata.json'), 'utf8')); if (abp.parseAgent(m.label)) labels.add(m.label); } catch {} } } catch {}
  const out = path.join(os.homedir(), '.abp', 'whoami');
  if (labels.size !== 1) { console.log(`abp whoami: ${labels.size} agent labels in the key store (${[...labels].join(', ') || 'none'}): not written; the hook stays unidentified`); return; }
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, [...labels][0] + '\n');
  console.log(`abp whoami: ${[...labels][0]} -> ~/.abp/whoami`);
}
const cmd = process.argv[2];
if (cmd === 'build') build();
else if (cmd === 'check') check();
else if (cmd === 'review') review();
else if (cmd === 'test') test();
else if (cmd === 'whoami') whoami();
else console.log('usage: node abp/tools/abp.mjs build | check [--range A..B] | review [--since ISO] [--out FILE] | test');
