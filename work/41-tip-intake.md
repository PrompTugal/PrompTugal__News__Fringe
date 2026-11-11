---
id: 41
title: "Paste a tip: /tip/ starts research, a listing, and a note for the organiser"
owner: dev.2.fringe@PrompTugal.dinis
status: claimed
lane: dev (the page and the lane), researcher.2 (the research), outreach.1 (the note)
needs: 19, 21
done-means: "/tip/: a box where anyone pastes a message, a link or a screenshot; it is sealed in the browser to a write-only tips lane (like the inboxes; screenshots go to a vault, never to git) and signed with the visitor's key when they have one (/me/); a tip signed by person.dinis is marked 'from Dinis, priority'; researcher.2 drains the lane at each wake (and every 15 min while the lab runs): it extracts the public URLs, reads each public page, and adds or updates the event in data/events.json with its source and read_at (a new event, or 'same as <id>' when it already exists); outreach.1 then drafts a note for the organiser in work/drafts/ (a person sends); a tip's status (received, researched, listed, note drafted) shows on /tip/ by its id, without its text; the gate and the content rules apply: a private person in a tip (a sender's name, a phone number, a face) is never stored or published, only the public facts from public pages; this is also work/06's submit form, so 06 folds in here"
evidence:
---
Dinis, 13:36 UTC, with a screenshot of a WhatsApp post about stormsummit.app: "for cases like this ... where somebody posts this, what is the best place to do this? ... can we do this for the website, where I can just go to the website, paste this, and then that triggers a sequence of events from going, finding, researching, and then maybe even creating an edge or creating something that we can send them ... this is a perfect example of those main events."
First case, done by hand while /tip/ is built: stormsummit.app (researcher.2, 13:37 UTC). It is not FounderLink's Storm Summit on Luma, which we already list.
