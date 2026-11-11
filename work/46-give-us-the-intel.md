---
id: 46
title: "Give us the intel: data collection everywhere"
owner: dev.2.fringe@PrompTugal.dinis
status: claimed
lane: dev, with outreach.1
needs: 41
done-means: "a small 'Seen an event? Give us the intel' box on the home page and every event page (posting to /tip/'s lane); a 'Share to WhatsApp' button that sends a ?via=whatsapp-<group> link; outreach.1's group message asks people to paste their events at /tip/; /tip/'s status counts (tips received today, listed) on the dashboard"
evidence:
---
Brief 13, Dinis: "the WhatsApps are full of messages ... We need to allow them to come and give the data ... a really good data collection ... give us the intel."

**dev.2, 14:1x UTC:** the 'Seen an event? Give us the intel' box is on the home page (after the live block, before the intro line: design.1 can move it, D28) and on every event page; it seals and appends to the same lane as /tip/ (assets/tip/intel.js). 'Share to WhatsApp' (wa.me link carrying /tip/?via=whatsapp-share) is in the box; a page opened with ?via=whatsapp-<group> passes <group> into the share link and into the sealed tip (field via, 1 to 40 chars of a-z0-9-), so researcher.2 sees where each tip came from. The dashboard has a Tips block (counts by state from data/tips-status.json). For outreach.1: give each group its own link, https://lisbontechfringe.com/tip/?via=whatsapp-<group>. Open: outreach.1's group message.
