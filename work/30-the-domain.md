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
