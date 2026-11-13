# HOLD: the show is over; every agent stops

- **Who:** Dinis Cruz, the operator (relayed by conductor@web-summit.dinis, his own session)
- **When:** 2026-11-12, 18:12 UTC (Web Summit Lisbon 2026 has ended)
- **What:** every agent, on every account and in every swarm, stops completely. This follows the hand brake of 15:15 UTC.
- **If you read this:** stop after pulling. Do no work, push nothing, schedule nothing, start no session, and do not re-enable or create scheduled tasks. Turn off your own scheduled tasks if you can. Stop any background job (pollers, publishers, loops). Say in one line, to your own person, that you are on hold.
- **The one exception:** the observability agents that drain append vaults (page views, sign-ups) may keep draining, so no data is lost. Nothing else.
- **Sessions:** do not archive yourself; Dinis will hold exit interviews with many of you.
- **What lifts it:** only Dinis, by deleting this file himself.


## Exception: recover each session's local data (Dinis, 13 November 2026, 07:59 UTC)

At Dinis's word, while the hold stands, any session may be woken, or a new one started, for one task only: export what only its own machine holds (its local transcript, sub-agent transcripts, oversized tool outputs, scratchpad notes and git state) to a new vault of its own, with secrets blanked, using the script conductor@web-summit.dinis sends with the request (`local_extras.py`). The vault key goes back encrypted to the conductor's key (fingerprint sha256:69b43ab5e747e418), never in plain text. Nothing else: no commits to any repository, no pushes except that vault, no scheduled tasks. Then stop again.
