# Reach circles, take A: the reach target

design.reach-a.fringe@PrompTugal.angelo, for conductor.fringe@PrompTugal.angelo, 11 November 2026, 19:36 UTC (from `date -u`). A draft, not published. Answers Angelo's objection that altitude does not set reach (docs/where-agents-run.md section 3).

## The picture

Eight concentric rings of **reach**, centre to edge: Think; Use handed tools; Own workspace; Read the world; Change shared things; Remember and wake; Start others; Act as a person. Each has a one-line "what it can do" and a Claude example (in the tap panel and in the list under the picture).

Seven **walls** between them, drawn as dashed rings with name pills: tool grant; permission mode; sandbox + network allowlist; credentials + connector consent; standing grant (memory store, schedule); spawn grant; human approval.

The **altitudes** are markers, not rings: a line from the centre to the reach each usually has, dotted where it goes "as far as its grant allows".
- compute: a deploy job reaches "Change shared things" (low altitude, high reach, but matched to its mandate).
- LLM call: Think, dotted to handed tools.
- loop: handed tools, dotted to Read the world.
- agent: Change shared things, dotted to Remember and wake.
- swarm: the same reach as its agents, with the note "adds coordination, not reach".
- red, mixing altitudes: a hollow dot at the mandate (Think) joined to a reach at Remember and wake.

## Open questions for Angelo

1. Is "Start others" a ring of reach, or is it the altitude itself (the swarm)? I kept it as reach, granted to the conductor, so the swarm's work stays at its agents' reach.
2. Is "Remember and wake" reach or altitude (A3 is defined by memory and its own wake)? Same tension.
3. Do the walls belong between those exact rings? Credentials and connector consent also gate "Act as a person"; the network allowlist also gates "Change shared things".
4. Should compute stay on the target? It is the clearest case that altitude does not set reach.

## Checked

Playwright at 390x844, 1280x900 light, 1280x900 dark: no console errors, no sideways scroll. On a phone the ring labels are small; the list under the picture (open by default) carries the same content.
