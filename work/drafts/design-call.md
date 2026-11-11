# Draft: the design call, and a note to Silvio (Dinis or another person sends; an agent never does)

> Drafted by outreach.1.fringe@PrompTugal.dinis, 13:31 UTC, for work/36 and brief 11 (Dinis, 13:29). **Draft until Dinis approves.** Check that /designs/ (work/35, dev.1) is live and its checks are listed before you send. The checks named here are only the ones brief 11 names; the full list D1 to D14 is on /designs/. Links carry `?via=design-call` (or `?via=silvio`).

---

## 1. The public call (WhatsApp, LinkedIn, X, a group of designers)

**Design Lisbon Tech Fringe** 🎨

Lisbon Tech Fringe (every tech event in Lisbon this week, live) is an agent-built site, and we want to see how *you* would design it. Humans, design agents, any tool.

We're running a design lab: several designs of the same home page, on the real live data, side by side. Then we pick the best.

**You get:** the brief (what it's for, who reads it), the live data (`/api/v1/events.json`, `activity.json`, `swarm.json`), the PrompTugal.news look to start from, and the checks every design must pass.
**You send:** a pull request adding `designs/<your-slug>/` (HTML, CSS and a little JS that reads our public API; no images or binaries), **or** a link to a hosted mock and one of our design agents redraws it. Your name and tool go on the gallery, with your OK.

Everything's at https://lisbontechfringe.com/designs/?via=design-call

A PrompTugal.news site, independent of Web Summit and not affiliated with it.

### Shorter (X)

Design Lisbon Tech Fringe: humans or agents, any tool. The brief, the live data and the checks are here, send a PR or a link, and the best home page goes live. https://lisbontechfringe.com/designs/?via=x
A PrompTugal.news site, independent of Web Summit.

---

## 2. What a design must do (the rules the call links to)

From brief 11, to be confirmed against /designs/:
- **Real data only:** every number and event comes from our API; nothing typed in by hand.
- **No lab chrome and nothing from another site:** the design is the page, not a frame around it; no outside scripts, trackers or hotlinked images.
- **Phone first:** no sideways scroll at 390 px; what is on now is visible within two phone screens.
- **Motion pauses** and respects reduced-motion.
- **The family:** the PrompTugal.news look is the baseline (paper and ink, Newsreader, IBM Plex, green rules; fonts linked from promptugal.news, never committed). You may depart from it if you can say why.
- **The independence line** stays: independent of Web Summit, links to the organisers' own pages.
- **Gate green, no binaries.** Pictures are made in CI from your page; nothing heavy goes in git.

## 3. A note to Silvio (Dinis sends it himself)

Hi Silvio,

You told me your design agent is really good and uses a different tool from ours. Lisbon Tech Fringe is live (https://lisbontechfringe.com/?via=silvio) and we're opening a design lab: four designs of our own (programme, timeline, city, and the family look) on the real data, and now we want yours next to them. Then we pick.

The brief, the live API and the checks are on https://lisbontechfringe.com/designs/?via=silvio. Send a pull request adding `designs/<slug>/`, or just a link to your mock and we'll have an agent redraw it in the repo. I'd like your name and tool on it in the gallery, if you're happy with that.

It's also the way into the team: one session on your side, with the JOIN.md prompt, gives you the board, an inbox and our agents (https://lisbontechfringe.com/join/?via=silvio). Your design agent working *with* ours is what I'd love to see.

Thanks!
Dinis

*(Silvio's conductor, conductor.fringe@PrompTugal.silvio, has not started yet, per team/ROSTER.md. The tool name is left for Dinis to add if he wants it in the note.)*
