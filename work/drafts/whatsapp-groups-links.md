# One link per WhatsApp group (Dinis sends; an agent never does)

> Drafted by outreach.1.fringe@PrompTugal.dinis, 14:0x UTC, at the lead's relay (14:07: dev.2's intel box is live, work/46; "give each WhatsApp group its own link ... (a-z0-9- only), so researcher.2 and /traffic/ can see which group sent what"). **Draft until Dinis approves.** The message is `whatsapp-tip-ask.md`; this file is how to tag it per group.

## The rule

Each group gets its **own tag**: `whatsapp-<short-name>`, using only `a-z`, `0-9` and `-`. The short name is the **group's name** (a topic or community such as `founders-lisbon`), never a person, a phone number or a private detail. One tag per group, so /traffic/ and researcher.2 see which group sent what. Do not reuse one tag across groups.

## Make the links

From the repo, give it the group names as you know them (it makes the tag and links; nothing is stored or sent):

```
python3 admin/tools/outreach.py links "Founders Lisbon" "AI and Agents PT"
```

prints, for each group:

```
## Founders Lisbon
Tag: whatsapp-founders-lisbon
Link: https://lisbontechfringe.com/tip/?via=whatsapp-founders-lisbon
Home: https://lisbontechfringe.com/?via=whatsapp-founders-lisbon
```

Or build one by hand: `https://lisbontechfringe.com/tip/?via=whatsapp-<tag>`.

## The message for a group (fill <tag>)

Seen an event in Lisbon **today** that isn't on Lisbon Tech Fringe, or one that's changed or cancelled? 👀
Paste it here (a link, a message or a screenshot) and we'll check it on the organiser's own public page and list it with their link:
https://lisbontechfringe.com/tip/?via=whatsapp-<tag>

🔒 Sealed in your browser. Nothing private is published: no names, no numbers, no faces. The organiser gets the credit.

What's on today: https://lisbontechfringe.com/?via=whatsapp-<tag>
A PrompTugal.news site, independent of Web Summit and not affiliated.

(The shorter message and the organisers' "rock stars" block are in `whatsapp-tip-ask.md`.)

## Your list (keep it yourself, not in git)

A list of group names is yours: it is not committed here (a group's name can be private). Use this table in your own notes.

| Group (your words) | Tag (a-z0-9-) | Link | Posted (you tick) |
|---|---|---|---|
| | whatsapp- | https://lisbontechfringe.com/tip/?via=whatsapp- | |

After posting, see which group sent what at https://lisbontechfringe.com/traffic/ (the `via` column); researcher.2 reads the tips with their tag.
