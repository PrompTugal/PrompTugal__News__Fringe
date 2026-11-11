# Gravity: what the Fringe adapter needs from the library (draft, for dashboard@web-summit.silvio)

From gravity.fringe@PrompTugal.silvio, 11 Nov 2026, testing v0.1.0 (pinned) with the Lisbon Tech Fringe's live events (178 events, 11 topics).
Everything below was seen in a browser at 1440, 820 and 390 px. No JS errors, no sideways scroll.

1. **Hide built-in views.** The "Team" tab and its lens are RiskMandate's: the orb reads "The RiskMandate team · 178 agents · 11 people" and ignores `strings.teamOrb`. Ask: `views: { hide: ['team'] }` or make every word in it come from `strings`.
   Example: `Gravity.mount(el, { hideViews: ['team'], ... })`.
2. **Hide or replace the "Ask Claude" box and "My agent" pill.** They promise a feature the Fringe does not have. Ask: `ask: false` (or `ask: { placeholder, onAsk }`).
3. **Node title in the detail panel** shows the node's `id` (a slug: `2026-11-11-kyra-creator-club`) instead of its `label`. Ask: use `label` there.
4. **"MSGS 0" chip on every node card** and the "Topics that share events: 0" card inside a centre's lens: these count node-to-node flows. Our flows are centre-to-centre (topics that share events), which the docs allow. Ask: count centre flows too, or a `nodeChip(node)` option to set or hide the chip.
5. **The analysis card's text** ("Write the 14 missing policies…") is fixed RiskMandate copy, only its title takes `strings.analysis`. Ask: `analysis(centreId|null, api) -> html`, or hide it when absent.
6. **The time axis on the left** (11:00, 16:00, Now) is drawn from flow `at`; with centre flows it reads oddly. Ask: an option to hide it or to feed it from `feed[].at`.
7. **Long centre labels overlap** when two centres sit close ("Other topics" over "Investors"); on a phone, edge labels are cut. Ask: label collision nudging, or a `short` label per centre for narrow screens.
8. **Plugin layout:** the `.panel` class pins to the right; a plugin wanting the whole stage has no documented class. Ask: document a full-width plugin class (or say "style your own").

Small example (what the Fringe passes today):
```js
Gravity.mount(el, { data: { core:{label:'Lisbon Tech Fringe'}, centres:[{id:'topic-ai',label:'AI',color:'#43D9C6'}],
  nodes:[{id:'2026-11-11-kyra-creator-club',centre:'topic-ai',label:'Creator Club @ Web Summit (breakfast)',ok:true}],
  flows:[{from:'topic-ai',to:'topic-founders',count:6,at:'2026-11-11T16:13:00Z'}] }, strings:{...}, detail, metric, views:[weather, agenda] })
```
