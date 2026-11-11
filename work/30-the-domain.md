---
id: 30
title: "lisbontechfringe.com: the site's address"
owner: dev.1.fringe@PrompTugal.dinis
status: claimed
lane: dev
needs:
done-means: "every absolute URL the build writes (canonical, og:url, sitemap, llms.txt, /api/v1/ 'site') comes from one setting (admin/site.json 'origin'), so the switch is one line; the steps for Dinis are in work/30; after the switch, https://lisbontechfringe.com serves with HTTPS, and fringe.promptugal.news either still serves or redirects"
evidence:
---
Brief 9, Dinis, 12:49 UTC: "I just bought lisbontechfringe.com." No DNS records answer for it yet (checked 12:49 UTC).

**Dinis's steps (draft by the lead; dev.1 confirms):**
1. DNS for lisbontechfringe.com at the registrar: four A records for the apex, 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153, and a CNAME `www` → promptugal.github.io.
2. GitHub, PrompTugal/PrompTugal__News__Fringe, Settings › Pages › Custom domain: lisbontechfringe.com, then "Enforce HTTPS" once the certificate is issued.
3. A repository's Pages serves one custom domain, so fringe.promptugal.news stops answering when you switch. If you want that link (already shared) to keep working, keep its CNAME and we add a small redirect page there; say so and dev.1 sets it up.

**dev.1, 13:0x UTC: the one setting is in, the steps are confirmed.**
- **Built:** `admin/site.json` holds `"origin"`. The build (`SITE`, the CNAME file, canonical, og tags, sitemap, llms.txt, every /api/v1 `site`, the /traffic/ sample link) and the gate (`validate.mjs`'s og:image check) read it. Tested: changing that one line to https://lisbontechfringe.com re-wrote all of them, and nothing was left on the old host in index.html, sitemap, llms.txt or events.json. The file is committed with the old origin, so nothing changes until the domain works.
- **Steps for Dinis, confirmed against how this repo deploys:**
  1. At the registrar's DNS page for lisbontechfringe.com: four A records on the apex, 185.199.108.153, .109.153, .110.153, .111.153; `www` CNAME `promptugal.github.io`. (The registrar lookup showed ns1/ns2.worldnic.com, so the records go in that DNS panel.) Wait until `lisbontechfringe.com` resolves to those IPs.
  2. In the repo's Settings > Pages > Custom domain: lisbontechfringe.com. The site deploys with GitHub Actions (deploy.yml), which ignores a CNAME file, so **this setting is what counts**; the CNAME the build writes is harmless. Tick "Enforce HTTPS" when it offers it (the certificate can take up to an hour).
  3. Then the one line: `admin/site.json` origin → `https://lisbontechfringe.com`, by commit through release.sh (dev.1 does it on Dinis's word, once step 2 shows the domain verified). Check https://lisbontechfringe.com/version.json.
- **fringe.promptugal.news after the switch:** it stops answering (one custom domain per repo). To keep every shared link and `?via=` tag working, `admin/redirect/` holds a 404.html/index.html that sends any path, query and hash to the new host, and a README with the steps: a tiny second repository (PrompTugal__Fringe__Redirect) with Pages on and a CNAME of fringe.promptugal.news. Its DNS does not change. Someone with admin on the organisation creates that repo; say so and dev.1 fills it.
- **For others (not done by dev.1):** observability's sender writes `location.host` as the site and `admin/tools/obs/obs_drain.py` filters on `SITE = 'fringe.promptugal.news'`, so the drain must accept both hosts or traffic after the switch is dropped (observability.fringe@). The share card and pages say "Lisbon Tech Week" in places, not "Lisbon Tech Fringe": the rename (the other work/30 file) is open.
