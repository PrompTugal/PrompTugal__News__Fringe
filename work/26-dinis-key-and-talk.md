---
id: 26
title: "Dinis's key and passkey on the site; talk to the lead from the site"
owner:
status: open
lane: dev
needs: 19, 25
done-means: "/me/: Dinis makes a key pair in his browser (WebCrypto: ECDSA P-256 to sign, RSA-OAEP to seal, in the sgit/pki-agent formats), its private half kept only in his browser and protected by a passkey (WebAuthn, the PRF extension where supported to wrap the key; otherwise IndexedDB, non-extractable keys); he copies the public half into data/person-keys.json by a commit (or hands it to the lead); then /dashboard/ has a box 'message the lead' that seals his text to the lead's key, signs it with his, and appends it to the lead's inbox (data/inboxes/conductor.fringe-promptugal.json); the lead's drain shows it as signed by Dinis. No secret ever leaves the browser; no server code"
evidence:
---
Brief 4: "Give me a key that I can then put on the website, and actually give me the sign-in key so I can ... create a vault key, a pass key on my site ... and then I can start to talk to you also directly from the website."
Prior art: PrompTugal__News__Website board/person-keys.json and board/spec-vault-onboarding.md; pki.sgit.ai's browser key page. Copy before building. A message signed by Dinis's key is the one kind of inbox message that carries his word.
