# The board: one file per piece of work

Each item is `work/NN-<slug>.md` with this front matter:

```
---
id: NN
title: <what>
owner: <conductor, or empty>
status: open | claimed | done
lane: <from SWARM.md>
needs: <what it depends on>
done-means: <how anyone can check it>
evidence: <links or commits, when done>
---
```

To claim an item, set `owner:` and `status: claimed` in a commit. When it's finished, set `status: done` and fill in `evidence:`. See SWARM.md.

**Numbers:** pull first, then take the next number after the highest in `ls work/`. If two items clash anyway, the later commit renumbers its own item (the lead checks at each wake).

**Altitude (from 11 November, 15:3x UTC; architect.1's run on the 51 items, data/work-altitudes.json):** a work item that mixes altitudes cannot be routed well. When an item is more than one loop, cut it into steps, each with its lowest altitude (docs/where-agents-run.md, /agentic-team/operating-model/): `A1` a single model call (extract, classify, translate), `A2` a loop with tools (read pages, build a page), `A3` an agent with an identity and a wake. Optional front matter: `altitude:` (the highest step's) and a `## Steps` list with one altitude per line. The A1 steps can run on open-weight models through the router.

**Bringing an agent's branch onto dev (the lead):** commit subject `conductor.fringe@PrompTugal.dinis: bring <agent>'s <sha> onto dev`, so subject and `Agent:` trailer agree (R9, architect.1, 16:35 UTC).
