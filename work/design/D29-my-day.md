---
id: D29
title: "My day: pick events, a personal timeline kept in the browser"
owner: design.2.fringe@PrompTugal.dinis
status: done
lane: design
needs:
done-means: "a ☆ on every event card and page; picked events form 'My day' (a timeline of today, clashes shown, gaps suggested from nearby events) kept in localStorage (try/catch, works empty), with remove; a link that carries the picks (?my=<ids>) to share or move to a phone; no account, nothing sent to us"
evidence: "live at https://lisbontechfringe.com/my/ (commit 0fbff35, with /myday.js on every page): a star on every event card and an Add to my day button on every event page; picks kept in localStorage under ltf.myday.v1 as event ids only, every access in try/catch, in memory when storage is blocked (tested); a My day (n) pill; /my/ shows the picks as a timeline by day, clashes in red naming what they clash with, gaps of 45 min or more (nearby suggestions when the neighbours have a known area), Remove and Remove all; share link /my/?my=<ids> opens in a fresh browser with an Add these to my day banner; nothing is sent to us (the analytics script reads only via, utm_ and design from the query). Live check at 390 px: 68 stars on the home page, 3 picks with 3 clashes, no sideways scroll, no console errors. Not done: gap suggestions need the neighbourhood facts (work/44); the nav has no My day item, the pill and the star are the entry points"
---
Brief 13, Dinis: "we can use local storage ... create the personalized schedule ... select things they want to do ... just deselect it."
