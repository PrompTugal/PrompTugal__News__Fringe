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

## 9. A "Lisbon Tech Fringe" button on the RiskMandate dashboard (Silvio, 11 Nov 2026)

**What.** A button in the dashboard's top bar (next to Constelação · Equipa · Três escudos · X-Ray · GAMMA-Ray · Conversa) that takes the viewer straight to the Fringe universe.

**Why.** Silvio wants to jump quickly from the RiskMandate universe to the Fringe one: the same library drawing a second system.

**How, two ways:**

- **(a) No library change, in `assets/cc/stand.js` only.** Add a fourth plugin view:
  ```js
  const fringe = { id: 'fringe', label: ['Lisbon Tech Fringe', 'Lisbon Tech Fringe'], icon: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
    mount(h, api) { h.innerHTML = `<div class="g" style="margin:24px auto;padding:20px;max-width:640px"><p class="ph">${api.lang === 'en' ? 'The same library, another universe' : 'A mesma biblioteca, outro universo'}</p>
      <h2 style="margin:6px 0">Lisbon Tech Fringe</h2><p>${api.lang === 'en' ? '178 events this week around Web Summit, drawn as topics and the events that orbit them.' : '178 eventos esta semana à volta da Web Summit, desenhados como temas e os eventos que os orbitam.'}</p>
      <a class="polLink" href="FRINGE_URL" target="_blank" rel="noopener">${api.lang === 'en' ? 'Open the Fringe universe ›' : 'Abrir o universo da Fringe ›'}</a></div>` } }
  // then: views: [shields, xray, gamma, fringe]
  ```
- **(b) Library option (cleaner, reusable):** `links: [{ label: [pt, en], href, icon }]`, drawn in the toolbar as buttons that open `href`, so any universe can link to another.

**FRINGE_URL.** Once the lead routes it, the address will be https://lisbontechfringe.com/universe/ (asked in team/silvio/status.json). Until then the page exists only in this repository (team/silvio/gravity/index.html).
