---
id: 30
title: "Rename to Lisbon Tech Fringe (Dinis's decision) and pick the domain"
owner:
status: open
lane: dev, design (the lead routes)
needs:
done-means: "every page, the share card, the llms.txt, the API 'about' lines and the drafts say 'Lisbon Tech Fringe'; the domain Dinis buys serves the site and fringe.promptugal.news redirects to it so every ?via= link already sent keeps working; the independence line is unchanged; /version.json serves the commit"
evidence:
---
**Dinis, 11 Nov 2026 (in the outreach session, outreach.1):** a "Lisbon Fringe" for comedy, theatre and dance is announced for 2027, so we need another name. "also let's go with 'Lisbon Tech Fringe' which doesn't seem to have been used much before."

**Domain (outreach.1, 12:2x UTC; a DNS lookup is a hint, not a registration check):** lisbontechfringe.com, .org, .eu, .news, .events, .io, .ai, .co, techfringe.pt and lisbon-tech-fringe.com all gave "no such domain"; lisbon-tech-fringe.com also returned 404 from the .com registry's own lookup (so unregistered). lisbontechfringe.pt: DNS says free; the DNS.PT registry lookup was not reachable from the sandbox. Dinis asked about lisbontechfringe.pt and lisbon-tech-fringe.com. Suggested set: lisbontechfringe.com (main), lisbontechfringe.pt, lisbon-tech-fringe.com (redirect). Dinis buys; an agent does not.

**Done already (outreach.1):** the five drafts in work/drafts/ (links still on fringe.promptugal.news until the domain is live).
**Not done:** the site, the share card, the CNAME, the API text, REALITY.md. Brand wording elsewhere stays "Lisbon Tech Fringe", never Web Summit's name.

**Decision, Dinis, 12:4x UTC (outreach.1 session): bought lisbontechfringe.com.** (Registry nameservers in a DNS lookup: ns1/ns2.worldnic.com, so it is registered and not yet pointed anywhere we have set.) lisbontechfringe.pt, lisbon-tech-fringe.com and .ai are optional extras, not bought as far as outreach.1 knows.

**Steps, in order (outreach.1's reading; dev and the lead check it):**
1. **Dinis, at the registrar's DNS page:** for the apex, four A records to GitHub Pages: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (the same IPs fringe.promptugal.news already resolves to); and a CNAME `www` to `promptugal.github.io`. Only the people who hold the registrar login can do this.
2. **dev:** the site is on GitHub Pages and takes one custom domain: `admin/build/build.mjs:253` writes the CNAME file (`fringe.promptugal.news`). Change it to `lisbontechfringe.com` only once step 1 resolves, then set the custom domain and 'Enforce HTTPS' in the repo's Pages settings (a repo admin does that).
3. **Consequence to decide first:** with one custom domain, fringe.promptugal.news stops serving this site once the CNAME changes; it does not redirect by itself. Anything already shared with `?via=` on the old host would break. Options: (a) accept it, since nothing has been sent yet by an agent (a person may have sent some: Dinis knows); (b) keep a one-page redirect on promptugal.news's own site for the `fringe` name; (c) switch late, after the first posts. outreach.1 keeps every draft's link on fringe.promptugal.news until the new domain serves the site, then swaps them in one commit.
4. **Then:** sitemap, og tags, llms.txt, API 'about' and REALITY.md say lisbontechfringe.com; /version.json is read at the new host.
