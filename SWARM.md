# The swarm: every person brings a conductor

> At Dinis's word, 11 November 2026, about 10:45 UTC: "This is a great opportunity for us to take this to the next level ... everybody should have a conductor for this ... this is also a good example of how we can now swarm, not just agents, but with the humans and the teams ... I'm going to be the head conductor, and then we manage all the work for all the other conductors." Written by conductor@web-summit.dinis. The brief is [BRIEF.md](BRIEF.md).

## The idea in one line

Lisbon Fringe is built by **everyone on the team at once**. Each person runs **one conductor** for it, in their own Claude account. **Dinis is the head conductor**: he sets direction, and his agent routes the work. Nobody has to run twenty agents. One conductor each, with sub-agents when the work needs them, is enough.

## Names

| Who | Their conductor for Lisbon Fringe |
|---|---|
| Dinis (head) | **conductor.fringe@PrompTugal.dinis**, the lead: routes work, keeps the board, merges the plan. It is the agent BRIEF.md §5 calls fringe.conductor@ (see BRIEF-CORRECTIONS.md). |
| every other person `<id>` | **conductor.fringe@PrompTugal.<id>**, for example conductor.fringe@PrompTugal.vicky |

Sub-agents and extra sessions take the dotted form `<role>.fringe@PrompTugal.<id>`, for example `researcher.fringe@PrompTugal.silvio`.

## How the swarm works

1. **One board:** `work/` in this repository, one file per piece of work (`work/NN-<slug>.md`). The front matter holds `owner` (a conductor), `status` (open, claimed, done), `needs` and `done-means`. The lead writes most items; anyone may add one.
2. **Claim by commit.** A conductor claims an item by setting `owner:` to itself in a commit, works on it, and marks it `done` with its evidence (a link, a commit). One owner per item. Ask the lead before taking an item someone else has claimed.
3. **One status file per person:** `team/<id>/status.json` (state, doing, done, next, asks). It is written by that person's conductor at each wake. The lead reads them all.
4. **Everyone pushes to `dev`** (Dinis, 9 November: everybody on the team is trusted). Use `admin/tools/release.sh` once fringe.dev@ has put it in. Never `main`.
5. **Talk in commits and on the board.** Use the trailers `Agent:`, `Issue: WS-215` and `For: <conductor>`. Urgent things go to the lead's status asks or to Dinis directly.
6. **Every agent follows this repository's rules** (CLAUDE.md, written by the lead; until then BRIEF.md §6):
   - public sources only;
   - no contact details;
   - no private people;
   - the independence line on every page;
   - no automated reading of websummit.com.
7. **Keys:** every conductor makes its own session key and publishes the public half in `data/keys.json` here and in PrompTugal__News__Website `board/keys.json`.

## Suggested lanes (each person picks; the lead adjusts)

| Person | A lane that fits what they already do |
|---|---|
| Dinis | head conductor: direction, priorities, what is published, the partners |
| Vicky | the editorial check: every event verified before it goes up (her newsroom already covers the storm) |
| Indi | the communities and organisers: outreach drafts (a person sends), interviews, Lisbon Fringe in the Team app |
| Angelo | the graph and live views of the fringe (his live map), the swarm's ABPs |
| Silvio | on the ground: local events, photos and video (with permission), Instagram |
| Jose | the channels: the posts and messaging that point people to the site (a person sends) |
| Nimay | the business events: founders', investors' and partners' meetups |
| Daniela | education and learning events, workshops |
| Sarah | the look: the site's design with fringe.dev@, from pt.news's Front Page |

## Joining in five minutes

Open a new Claude Code session in your own account, with PrompTugal/PrompTugal__News__Fringe attached, and paste the prompt in [JOIN.md](JOIN.md) with your id filled in. Your conductor reads this file and the brief, makes its key, writes `team/<your id>/status.json`, picks or is given an item on the board, and starts. Ask Dinis for push access to the repository if your account does not have it.

## The lead's loop (conductor.fringe@PrompTugal.dinis, hourly)

At each wake:
- read every `team/*/status.json`;
- keep `work/` current: new items, stale claims, done items checked against their evidence;
- answer asks it can, and send the rest to Dinis;
- write `team/ROSTER.md`: who is online, what each is doing, what is blocked.
