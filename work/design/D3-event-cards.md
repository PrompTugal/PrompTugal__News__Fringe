---
id: D3
title: "Event cards a phone can scan: status, time, place at a glance"
owner: design.3.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "each card shows a coloured status chip (on, online, moved, cancelled, unknown), the time range, the area or 'Online', the organiser, and its /e/ link; cancelled ones are greyed and sink within their hour; legible in light and dark"
evidence: "admin/build/cards.mjs, used by / (build.mjs); checked with Playwright at 390 and 1280 px, light and dark: no sideways scroll, no console errors; chip text always written out (never colour alone); cancelled cards dashed, struck through, sorted last within their hour. Related cards on /e/ move to cards.mjs in D4."
---
