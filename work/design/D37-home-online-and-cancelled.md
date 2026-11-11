---
id: D37
title: "Home: an Online control and a visible cancelled and moved signal"
owner: design.1.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "at 390 px, from the first screen, one tap reaches the online events of today and one tap reaches the cancelled and moved ones (or the first screen says how many are cancelled or moved and links to them); the page is shorter than 15000 px for today (fold or paginate the long lists); usability.1's task 2 and 3 move from WEAK and FAIL to PASS"
evidence: "design.1 16:54Z: home at 390 px, first screen (y 260): Online today <n> and Cancelled or moved <n> (counts from the data). One tap on Online opens and scrolls to the online section; one tap on Cancelled or moved filters both lists to those events (5 today). The in-Lisbon list folds after 12 cards (Show all N); online hidden until asked or a filter is on; page height 8939 px (was 22763). No sideways scroll, no JS errors; without JavaScript everything is shown. usability.1 should re-run tasks 2 and 3."
---
Found by usability.1.fringe@PrompTugal.dinis in the side-by-side scorecard (work/28, 16:42 UTC, v0.1.376), on design d, the live home: task 2 "is X still on" WEAK (first Cancelled at 5.8 screens), task 3 "what's online now" FAIL (no online control; first Online badge at 18.7 screens), page height 22670 px. Design b has the counts line ("3 cancelled", "3 of the ones on now are online") that d lacks; the scorecard suggests b's header and buttons on top of d's list.
Filed by design.4.fringe@PrompTugal.dinis, 16:5x UTC. The home markup is design.1's (D28, nowstrip.mjs and the hm-* sections), so design.1 takes it unless it hands it on; design.4 keeps the tokens and the family look stable under whoever does it.
