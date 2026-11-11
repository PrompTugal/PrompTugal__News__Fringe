// Lisbon Fringe's page views and reads (observability.fringe@PrompTugal.dinis, 11 November 2026, at Dinis Cruz's word,
// brief 2: "we need to really track all the visits and see the traffic and hopefully see people going and sharing").
// Copied from PrompTugal.news's assets/obs/obs.js (observability@PrompTugal.dinis, 6 November), into this site's own
// vault (assets/obs/obs.json). Two events per page load:
//   view  when the page loads;
//   read  the first time the tab is hidden or closed: seconds the page was visible and the deepest scroll (percent).
// Each says: the page, the referring site (host only), the time to the minute, the site version, a random id that
// ends with the tab, the screen size class, the browser's language and time zone, an automation class if a bot
// declares itself, a link's tag (?via=), and the country, region and city from the browser's own lookup (obs.json
// `geo`: ipapi.co then ipwho.is, once per tab, 2.5 s timeout; only the place fields are read, the IP in the answer
// never is). No IP address, no cookie, no user-agent string, no browser fingerprint. Sealed to the drain key (sgit
// hybrid envelope v2: RSA-OAEP-SHA256 + AES-256-GCM) and written to a write-only append lane; on 507 the next lane.
// Do Not Track, Global Privacy Control and the footer's Pause switch stop it. Never blocks, never shows an error.
// The drain (admin/tools/obs/obs_drain.py) publishes counts only, at /traffic/.
(() => {
    'use strict'
    try {
        const nav = navigator
        const dnt = nav.doNotTrack === '1' || window.doNotTrack === '1' || nav.globalPrivacyControl === true
        const LS = { get: k => { try { return localStorage.getItem('fringe.obs.' + k) } catch { return null } }, set: (k, v) => { try { v === null ? localStorage.removeItem('fringe.obs.' + k) : localStorage.setItem('fringe.obs.' + k, v) } catch { } } }
        const SS = { get: k => { try { return sessionStorage.getItem('fringe.obs.' + k) } catch { return null } }, set: (k, v) => { try { sessionStorage.setItem('fringe.obs.' + k, v) } catch { } }, del: k => { try { sessionStorage.removeItem('fringe.obs.' + k) } catch { } } }
        const paused = () => LS.get('off') === '1'
        const script = document.currentScript, base = script ? script.src.replace(/obs\.js(\?.*)?$/, '') : '/assets/obs/'

        // the disclosure and the pause switch, in the footer of every page
        const footer = () => {
            const row = document.querySelector('footer'); if (!row || row.querySelector('.obs-note')) return
            const s = document.createElement('span'); s.className = 'obs-note'
            const a = document.createElement('a'); a.href = '/traffic/'; a.textContent = 'what is counted'
            if (dnt) { s.append(' · Page views: off (Do Not Track or Global Privacy Control is on). ', a); row.appendChild(s); return }
            const b = document.createElement('button'); b.type = 'button'; b.style.cssText = 'font:inherit;background:none;border:0;padding:0;text-decoration:underline;cursor:pointer;color:inherit'
            const t = document.createTextNode('')
            const draw = () => { t.textContent = paused() ? ' · Page views: paused on this device. ' : ' · Counted, publicly: page views, reading time, the referring site, links followed to other sites, a link\'s ?via= tag and your town. To find the town your browser asks ipapi.co or ipwho.is, which see your IP address; we keep no IP and set no cookie. '; b.textContent = paused() ? 'Resume' : 'Pause' }
            b.onclick = () => { LS.set('off', paused() ? null : '1'); draw() }
            s.append(t, b, ' · ', a); draw(); row.appendChild(s)
        }
        const safeFooter = () => { try { footer() } catch { } }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeFooter); else safeFooter()
        if (dnt || paused()) return

        let sid = SS.get('sid'); if (!sid) { sid = [...crypto.getRandomValues(new Uint8Array(4))].map(x => x.toString(16).padStart(2, '0')).join(''); SS.set('sid', sid) }
        const path = location.pathname, done = new Set()

        const b64 = bytes => { let s = ''; for (const x of new Uint8Array(bytes)) s += String.fromCharCode(x); return btoa(s) }
        const unpem = pem => Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), c => c.charCodeAt(0))
        async function seal(pem, text) {
            const S = crypto.subtle
            const pub = await S.importKey('spki', unpem(pem), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
            const aes = await S.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
            const iv = crypto.getRandomValues(new Uint8Array(12))
            const c = await S.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aes, new TextEncoder().encode(text))
            const w = await S.encrypt({ name: 'RSA-OAEP' }, pub, await S.exportKey('raw', aes))
            return btoa(btoa(JSON.stringify({ v: 2, w: b64(w), i: b64(iv), c: b64(c) })))   // the lane takes base64 of the .enc text
        }
        // automation by class only, never the user-agent string itself
        const ua = nav.userAgent || ''
        const agent = nav.webdriver ? 'webdriver' : /HeadlessChrome|PhantomJS/.test(ua) ? 'headless'
            : /Googlebot/i.test(ua) ? 'googlebot' : /bingbot/i.test(ua) ? 'bingbot' : /bot|crawl|spider|slurp/i.test(ua) ? 'bot' : ''
        const w = window.innerWidth || 1024
        let ref = ''; try { ref = document.referrer ? new URL(document.referrer).host : '' } catch { }
        // the place, once per tab: country, region and city only (the IP field of the answer is never read)
        const place = async c => {
            // no lookup on the pages that take a person's details (PrompTugal.news security@'s S34: /contribute/; here /submit/ too)
            if (/\/(contribute|submit)\//.test(location.pathname)) return { country: '', country_code: '', region: '', city: '' }
            const had = SS.get('geo'); if (had) { try { return JSON.parse(had) } catch { } }
            for (const url of (c.geo || [])) {
                try {
                    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 2500)
                    const r = await fetch(url, { signal: ac.signal, credentials: 'omit', referrerPolicy: 'no-referrer' }); clearTimeout(t)
                    if (!r.ok) continue
                    const j = await r.json(); if (j.success === false || j.error) continue
                    const g = { country: String(j.country_name || j.country || '').slice(0, 60), country_code: String(j.country_code || '').slice(0, 2).toUpperCase(),
                        region: String(j.region || '').slice(0, 60), city: String(j.city || '').slice(0, 60) }
                    // the city's position for the world map, rounded to 0.1 degree (about 10 km): a town, never a street
                    const la = +(j.latitude ?? j.lat), lo = +(j.longitude ?? j.lon)
                    if (isFinite(la) && isFinite(lo) && (la || lo)) { g.lat = Math.round(la * 10) / 10; g.lon = Math.round(lo * 10) / 10 }
                    SS.set('geo', JSON.stringify(g)); return g
                } catch { }
            }
            const g = { country: '', country_code: '', region: '', city: '' }; SS.set('geo', JSON.stringify(g)); return g
        }
        // a link's tag (Dinis, 6 November: "I just sent a link to somebody ... I would like to see if they open it ... and
        // forward it"): ?via=<tag> (or utm_source / utm_campaign) on the link you send. Kept for the tab, so the pages read
        // after arriving count too; a tag names the link, never the person. Letters, digits, '.', '_' and '-', 40 at most.
        const tagOf = () => { try { const q = new URLSearchParams(location.search); const t = q.get('via') || q.get('utm_campaign') || q.get('utm_source') || ''; return /^[A-Za-z0-9._-]{1,40}$/.test(t) ? t.toLowerCase() : '' } catch { return '' } }
        let via = tagOf(); if (via) SS.set('via', via); else via = SS.get('via') || ''
        const common = () => {
            const e = { v: 1, src: 'fringe', site: location.host, ver: ((document.querySelector('footer a[href="/version.json"]') || {}).textContent || '').trim(),
                ts: new Date().toISOString().slice(0, 16) + 'Z', sid, path, ref, lang: nav.language || '',
                screen: w < 600 ? 'phone' : w < 1000 ? 'tablet' : 'desktop', tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '') }
            if (agent) e.agent = agent
            if (via) e.via = via
            // an A/B test (Dinis, 6 November 2026, 13:20: "A/B testing when needed ... on the website"): the variant this page
            // was shown, from <html data-variant> or <meta name="variant">, set by whoever runs the test; no new identifier
            let qd = ''; try { qd = new URLSearchParams(location.search).get('design') || '' } catch { }   // the home page's ?design=<id> (work/35)
            const H = document.documentElement.dataset, vr = H.variant || (document.querySelector('meta[name="variant"]') || {}).content || qd
            if (/^[A-Za-z0-9._-]{1,40}$/.test(vr)) e.variant = vr
            return e
        }

        let visibleMs = 0, since = document.visibilityState === 'visible' ? performance.now() : null, maxScroll = 0
        const scrolled = () => { const h = document.documentElement, top = window.scrollY || h.scrollTop, all = Math.max(1, h.scrollHeight - window.innerHeight); maxScroll = Math.max(maxScroll, Math.min(100, Math.round(100 * top / all))) }
        window.addEventListener('scroll', scrolled, { passive: true })

        let cfgP = null
        const cfg = () => cfgP || (cfgP = fetch(base + 'obs.json', { cache: 'no-cache' }).then(r => r.json()))
        const send = async ev => {
            if (paused()) return false
            const c = await cfg(); if (!c.enabled || !c.lanes || !c.lanes.site || !c.lanes.site.length) return false
            if (!('country' in ev)) Object.assign(ev, await place(c))
            const payload = await seal(c.recipient.encrypt, JSON.stringify(ev))
            const L = c.lanes.site, start = Math.floor(Math.random() * L.length)   // a random first lane spreads the load
            for (const token of L.map((_, i) => L[(start + i) % L.length])) {
                const r = await fetch(`${c.endpoint}/api/vault/append/write/${c.vault_id}`, { method: 'POST', keepalive: true,
                    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ append_token: token, payload }) })
                if (r.status !== 507) return r.ok
            }
            return false
        }
        const resend = () => {                                            // reads an earlier page in this tab could not finish sending
            try {
                for (const k of Object.keys(sessionStorage).filter(k => k.startsWith('fringe.obs.pending.'))) {
                    const ev = JSON.parse(sessionStorage.getItem(k)); sessionStorage.removeItem(k)
                    send(ev).catch(() => { })
                }
            } catch { }
        }
        // the design lab's vote (work/35, dev.1.fringe@): "I prefer this one" is one more event, type 'vote' with the design id
        // (a-z, 0-9, '-'); the same lane, no name, no cookie. Absent while counting is paused or off, so the page says so.
        window.fringeObs = { vote: d => /^[a-z0-9-]{1,30}$/.test(String(d)) ? send(Object.assign(common(), { type: 'vote', design: String(d) })).catch(() => false) : Promise.resolve(false) }
        const view = () => { resend(); if (done.has('view')) return; done.add('view'); send(Object.assign(common(), { type: 'view' })).catch(() => { }) }
        const finish = () => {
            if (since !== null) { visibleMs += performance.now() - since; since = null }
            if (done.has('read')) return
            scrolled(); done.add('read')
            const ev = Object.assign(common(), { type: 'read', visible_s: Math.min(3600, Math.round(visibleMs / 1000)), scroll: maxScroll })
            const key = 'pending.' + ev.path + '.' + Date.now()
            SS.set(key, JSON.stringify(ev))                                   // kept until written: leaving can cut the send short
            send(ev).then(ok => { if (ok) SS.del(key) }).catch(() => { })
        }
        // a link followed to another site (Dinis, 11 November 2026: "we should be pointing to the storm ... create
        // connections back to the data sets"): the target's host and path only, never its query or fragment
        document.addEventListener('click', e => {
            try {
                const l = e.target.closest && e.target.closest('a[href]'); if (!l) return
                const u = new URL(l.href, location.href); if (!/^https?:$/.test(u.protocol) || u.host === location.host) return
                send(Object.assign(common(), { type: 'out', to: (u.host + u.pathname).slice(0, 120) })).catch(() => { })
            } catch { }
        }, true)
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') since = performance.now(); else finish() })
        window.addEventListener('pagehide', finish)
        cfg().catch(() => { })
        if (document.readyState === 'complete') setTimeout(view, 0); else window.addEventListener('load', view)
    } catch { }
})()
