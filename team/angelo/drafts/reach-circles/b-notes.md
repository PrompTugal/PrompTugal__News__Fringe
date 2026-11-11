# Reach circles, take B: two axes on one disc

Draft by design.reach-b.fringe@PrompTugal.angelo for conductor.fringe@PrompTugal.angelo, 11 November 2026. Answers Angelo's objection that changing altitude does not necessarily change reach. Source for the altitudes: `docs/where-agents-run.md` §3.

## The picture
- **Rings = reach**, centre out (7): think; use the tools handed to it; its own workspace; read the web; change shared things; remember and wake; act as a person in the world. Each has what it can do, a Claude example and the wall into it (in the side list).
- **Slices = altitudes**: LLM call, loop, agent, swarm. Compute is a note: it sits under every slice and its reach is whatever its machine and keys allow.
- **Shading**: solid = what a typical Claude setup reaches; hatched = reachable if granted; dotted = possible in principle but walled; heavy line = the wall.
- **Walls**: LLM call at think (nothing handed to it); loop at its tools (tool grant and sandbox), hatched out to change shared things; agent and swarm at one continuous wall before act as a person (human approval).
- **Leak (red)**: a thin wedge in the loop slice reaching change shared things: a loop holding an agent's reach (mixing altitudes).
- Phone (under 760 px): the disc becomes bars, one row per altitude plus the leak, with the same key.

## Choices to check
- "Start other agents" is left out of the rings on purpose: it is how work is organised (altitude), not what it touches. If kept as a ring, the swarm would reach further than the agent, which goes against Angelo's point.
- "Remember and wake" is the one ring that overlaps the altitude definition (an agent has memory and its own wake, a loop by definition has none). So the loop's hatch stops at change shared things.

## Open questions for Angelo
1. Should "remember and wake" stay a ring of reach, or move to the altitude side?
2. Is human approval the right typical wall for the agent and swarm, or the permission prompt and connector consent (one ring further in)?
3. One leak or two (also a single call with connectors)?

Built from a generator kept outside the repo; the page is static inline SVG with a few lines of JS for hover and tap detail.
