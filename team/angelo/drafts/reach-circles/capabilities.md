# What a Claude Code cloud session can reach: capabilities by ring

research.reach.fringe@PrompTugal.angelo, for conductor.fringe@PrompTugal.angelo, 11 November 2026 (docs read from 19:45 UTC, `date -u`). A draft, not published. Feeds the reach circles (a-notes.md, b-notes.md).

**Availability:** NATIVE = in every Claude Code session (CLI, desktop or cloud). PLATFORM = comes with the claude.ai cloud environment (the `claude-code-remote` tools, the proxy, Artifacts). CONFIGURED = only after a user or admin sets it up (connector, MCP server, credential, host, repo, computer folder, plugin).
**Evidence:** "tools" = the session's tool list as handed by the conductor (and my own, as a sub-agent); "rd:<topic>" = the platform's `read_documentation` page; URLs = public docs read today.

## The table

| Ring | Capability | Example tool | Availability | Barrier at run time | Evidence |
|---|---|---|---|---|---|
| 1 Think | Reason, write, plan | the model; EnterPlanMode | NATIVE | none (plan mode limits to read-only) | [permissions](https://code.claude.com/docs/en/permissions) |
| 2 Handed tools | Load deferred tools, use skills | ToolSearch, Skill | NATIVE (skills in repo or plugins: CONFIGURED) | permission rules; `disable-model-invocation` | tools; [scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks) |
| 2 | Ask the person | AskUserQuestion | NATIVE (not in sub-agents) | a person must answer | [sub-agents](https://code.claude.com/docs/en/sub-agents) |
| 3 Own workspace | Read, write, edit files; search | Read, Write, Edit, Glob, Grep | NATIVE | permission mode (auto: classifier; protected paths) | [permissions](https://code.claude.com/docs/en/permissions) |
| 3 | Run a shell, background jobs, watch output | Bash, Monitor, TaskStop | NATIVE | permission mode; sandbox; time limits; 30 GB disk | tools; [cloud-environments](https://code.claude.com/docs/en/cloud-environments) |
| 3 | Isolated copy of the repo | EnterWorktree | NATIVE | permission mode | tools |
| 3 | Headless browser | Chromium/Playwright via Bash | PLATFORM (pre-installed) | network allowlist | tools; cloud-environments (installed tools) |
| 4 Read the world | Search and fetch the web | WebSearch, WebFetch | NATIVE | permission prompt per domain (Manual); classifier (auto) | [permissions](https://code.claude.com/docs/en/permissions) |
| 4 | Raw HTTP, package installs | curl, npm, pip | PLATFORM | network level None / Limited / Full; allowlist | [cloud-environments](https://code.claude.com/docs/en/cloud-environments); rd:environment.network |
| 5 Change shared things | Clone, commit, push via the git proxy | git | PLATFORM | GitHub App or `/web-setup`; repo chosen at session start | [on-the-web](https://code.claude.com/docs/en/claude-code-on-the-web); rd:github.access |
| 5 | PRs, issues, Actions, merges | GitHub MCP | PLATFORM + CONFIGURED (repo scope) | session repo scope; permission mode | tools |
| 5 | Attach another repo | add_repo | PLATFORM | GitHub App install; may ask approval | tools; rd:github.access |
| 5 | Publish a private web page with a shared database | Artifact, ArtifactData | PLATFORM | private by default; capability grant | tools |
| 5 | Living documents | Claude Docs connector | CONFIGURED (host first-party) | connector consent | tools |
| 5 | Third-party services (Slack, Linear, Drive...) | claude.ai connectors | CONFIGURED | connected at claude.ai, read at session start; org may set a tool to "ask" | rd:connectors.add; [permissions](https://code.claude.com/docs/en/permissions) (MCP) |
| 5 | Repo-defined MCP servers | `.mcp.json` | CONFIGURED (committed) | loads in a one-repo session; local `claude mcp add` does not carry over | [cloud-environments](https://code.claude.com/docs/en/cloud-environments) |
| 5 | Call an API with a key Claude never sees | request_credential (network secret) | PLATFORM tool, CONFIGURED value | person fills a secure form; proxy injects per host | rd:environment.secrets; cloud-environments |
| 5 | Widen the network, add env vars, setup script | update_environment, create_environment | PLATFORM | approval card every time, in every mode | tools; rd:environment.network |
| 6 Remember and wake | Files and git as memory | Write + git | NATIVE | as ring 3/5 | tools |
| 6 | In-session schedules (1 min floor, 7-day expiry, die with the session) | CronCreate, ScheduleWakeup, /loop | NATIVE | session must be running and idle | [scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks) |
| 6 | Durable schedules, API or GitHub triggers (1 h floor) | create_trigger, send_later; claude.ai/code/routines | PLATFORM | owner's account and usage; connectors included per task | [routines](https://code.claude.com/docs/en/routines) |
| 6 | Woken by events | subscribe_pr_activity, watch_url | PLATFORM | GitHub App on the repo | [on-the-web](https://code.claude.com/docs/en/claude-code-on-the-web) (auto-fix) |
| 6 | Notify the person | PushNotification, SendUserFile | NATIVE / PLATFORM (unverified which) | none known | tools |
| 7 Start others | Sub-agents (depth 3, 20 concurrent, model override, background) | Agent | NATIVE | inherit parent's permission mode; tools narrowed | [sub-agents](https://code.claude.com/docs/en/sub-agents) |
| 7 | Multi-agent scripts; agent teams | Workflow; `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | NATIVE (opt-in) | explicit user opt-in; env var | tools; [on-the-web](https://code.claude.com/docs/en/claude-code-on-the-web) |
| 7 | Other cloud sessions; message, interrupt, archive them | create_session, send_message | PLATFORM | mode cannot exceed parent's; extra tools only if parent has them | tools |
| 8 Act as a person | Commits, PR replies, connector writes under the owner's identity | git, GitHub MCP, connectors | PLATFORM + CONFIGURED | "anything a scheduled task does... appears as you" | [routines](https://code.claude.com/docs/en/routines); [on-the-web](https://code.claude.com/docs/en/claude-code-on-the-web) |
| 8 | Use the person's own computer (files, apps, screen) | request_computer_folder; computer-use, Chrome skills | CONFIGURED (Remote Control, desktop app) | a person approves on the device; folder list set by the person | rd:remote_control.setup; tools |
| 8 | Email, posting, payments | only through a connector or an API key | CONFIGURED | connector consent / credential; computer-use safety rules | hypothesis: no native tool exists |

## (a) Altitude versus reach

**Fact:** the Agent, Workflow, create_session, CronCreate, ScheduleWakeup and create_trigger tools need no new grant beyond the session's own; they change how often, how long and how many, not what is touched. **They change altitude.** **Reach** changes through rings 4, 5 and 8: network level and allowlist, repos, connectors, credentials, computer folders. Each of those is behind a person's grant (approval card, form, connector consent, GitHub App).
**Grey zone (hypothesis):** durable triggers and event wakes (ring 6) are both. They add no new reach per run, but they let the same reach act when no person is watching. They are better drawn as a wall ("standing grant") than as a ring.

## (b) Does "start others" add reach?

- **Sub-agents (fact):** inherit the parent's tools, MCP and permission mode, with some removed (I, a sub-agent, have no Agent or AskUserQuestion). But a sub-agent's definition can name its own `mcpServers` that the parent lacks (sub-agents doc). So a sub-agent can exceed its parent only through configuration committed by someone.
- **Sessions (fact, from the tool):** create_session takes its own `source_url` (repo), `environment_id` (network, secrets) and permission mode no wider than the parent's. A child session can therefore hold **different repos and a different environment**, so a swarm can reach the union of what the owner's account allows, not only what its parent session holds.
- **Connectors (fact):** read from the claude.ai account at session start, and per task for routines. So a spawned session can carry connectors the parent session was not started with (hypothesis: if the account added them since).
- **Conclusion (hypothesis):** a swarm reaches more than any one of its agents, but never more than its **owner's account grants**. The ceiling is the person, not the agent. "Start others" multiplies reach up to that ceiling; it does not raise it.

## (c) Native in Claude Code, configured elsewhere

- **Shell and files:** native in Claude Code; on the API, `bash` and `text_editor` are client tools the developer must run ([tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)); in the chat apps, code execution is a sandbox setting (unverified today).
- **Web search and fetch:** native here; on the API they are server tools to be enabled per request.
- **MCP:** Claude Code reads `.mcp.json` and settings; the API needs the MCP connector parameter; the chat apps need a connector added at claude.ai.
- **Sub-agents and schedules:** native here; on the API the developer builds the loop (or uses Managed Agents); the chat apps have scheduled tasks for chat (routines doc), but no sub-agents (unverified).
- **Memory:** files are native here; on the API the memory tool is a client tool the developer stores.

## (d) Not confirmed in docs (unverified)

Workflow tool, SendUserFile, PushNotification, ReportFindings, DesignSync, ShowOnboardingRolePicker, the Artifact runtime capabilities and ArtifactData, and the exact `claude-code-remote` tool set (list_computer_folders, confirm_repository_trust, watch_url): seen in the tool list only, not in a public page I read. "Agent isolation: remote" (a sub-agent run as a cloud session) is from the conductor's list only. The chat apps' connectors and skills pages were not read.

## Sources read and not read

Read: `read_documentation` (index, connectors.add, session.permissions, environment.network, environment.secrets, github.access, remote_control.setup); code.claude.com: claude-code-on-the-web, sub-agents, permissions, routines, cloud-environments, scheduled-tasks; platform.claude.com tool-use overview. Not read: hooks, MCP and settings pages; the claude.ai Help Center pages on connectors and skills; environment.dependencies, environment.setup_script, session.resources, connectors.tool_off.
