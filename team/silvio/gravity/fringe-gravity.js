/* Fringe → Gravity adapter, by gravity.1.fringe@PrompTugal.silvio (WS-215), approved as a mock by Silvio, 11 Nov 2026. Gravity itself is loaded from https://web-summit.sgit.ai/lib/gravity/ (never copied here).
   Centres = topics; nodes = events (primary topic); flows = events that two topics share; feed = the events starting next.
   Plugins: Weather (IPMA, read through storm-charles.promptugal.news/api/v1/) and Agenda (by day). */
(function () {
  const API_EVENTS = 'https://lisbontechfringe.com/api/v1/events.json'
  const STORM = 'https://storm-charles.promptugal.news/api/v1/2026-11-10-storm-charles/weather/'
  const COLORS = ['#43D9C6', '#FF7FB0', '#A58BFF', '#F2B544', '#3DDC97', '#6EC1FF', '#FF9A5C', '#D9B26E', '#8EADA8']
  const TOPIC_PT = { 'ai': 'IA', 'growth & product': 'Crescimento e produto', 'international expansion': 'Expansão internacional', 'venture & fundraising': 'Capital e investimento', 'founders': 'Fundadores', 'saas & enterprise': 'SaaS e empresas', 'tech & innovation': 'Tecnologia e inovação', 'investors': 'Investidores', 'climate & impact': 'Clima e impacto', 'networking': 'Networking', 'other': 'Outros temas', 'startups': 'Startups', 'deeptech & hardware': 'Deeptech e hardware', 'health & bio': 'Saúde e bio' }
  const TOPIC_EN = { 'ai': 'AI', 'other': 'Other topics', 'saas & enterprise': 'SaaS & enterprise' }
  const getJ = u => fetch(u, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(r.status + ' ' + u); return r.json() })
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const DAY = { '2026-11-11': ['Qua 11', 'Wed 11'], '2026-11-12': ['Qui 12', 'Thu 12'], '2026-11-13': ['Sex 13', 'Fri 13'], '2026-11-14': ['Sáb 14', 'Sat 14'] }
  const hm = iso => iso ? iso.slice(11, 16) : '?'
  const isOn = e => e.status === 'on' || e.status === 'online'

  function build(src, lang) {
    const ev = src.events.filter(e => e.id && e.start)
    const top = e => (e.topics || []).map(t => String(t).toLowerCase())
    const cnt = {}; for (const e of ev) { const t = top(e)[0]; if (t) cnt[t] = (cnt[t] || 0) + 1 }
    const keep = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0])
    const centreOf = e => { const t = top(e).find(x => keep.includes(x)); return 'topic-' + slug(t || 'other') }
    const label = (t, L) => L === 'pt' ? (TOPIC_PT[t] || t) : (TOPIC_EN[t] || t.replace(/^./, c => c.toUpperCase()))
    const ids = [...keep, 'other']
    const centres = ids.map((t, i) => ({ id: 'topic-' + slug(t), label: label(t, lang), color: COLORS[i % COLORS.length] }))
      .filter(c => ev.some(e => centreOf(e) === c.id))
    const nodes = ev.map(e => ({ id: e.id, centre: centreOf(e), label: e.name.replace(/\s*·\s*(Wed|Thu|Fri|Sat).*$/, '').slice(0, 44), ok: isOn(e), last: (DAY[e.date] || [e.date, e.date])[lang === 'pt' ? 0 : 1] + ' ' + hm(e.start) }))
    const pair = new Map()
    for (const e of ev) { const cs = [...new Set(top(e).filter(x => keep.includes(x)).map(x => 'topic-' + slug(x)))]
      for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const k = cs[i] + '>' + cs[j], y = pair.get(k) || { from: cs[i], to: cs[j], count: 0, at: '' }; y.count++; if (e.read_at > y.at) y.at = e.read_at; pair.set(k, y) } }
    const now = new Date().toISOString()
    const next = ev.filter(e => e.start >= now).sort((a, b) => a.start.localeCompare(b.start))
    const feedSrc = (next.length ? next : ev.slice().sort((a, b) => b.start.localeCompare(a.start))).slice(0, 14)
    const feed = feedSrc.map(e => ({ at: e.start, from: e.id, to: [centreOf(e)], text: (DAY[e.date] || ['', e.date])[lang === 'pt' ? 0 : 1] + ' ' + hm(e.start) + ' · ' + e.name, tag: e.status }))
    const on = ev.filter(isOn).length
    return { gdata: { core: { label: 'Lisbon Tech Fringe' }, centres, nodes, flows: [...pair.values()], feed, at: src.built_at }, byId: new Map(ev.map(e => [e.id, e])), metric: { pct: Math.round(on / ev.length * 100), of: on, total: ev.length } }
  }

  const STR = {
    brandSub: ['Guia independente · 11 a 14 Nov', 'Independent guide · 11 to 14 Nov'],
    agents: ['Eventos', 'Events'], noPol: ['Adiados, cancelados ou por confirmar', 'Moved, cancelled or unknown'], withPol: ['A decorrer', 'On'],
    people: ['Temas', 'Topics'], msgsN: ['Eventos partilhados', 'Shared events'], pairs: ['Temas que partilham eventos', 'Topics that share events'],
    team0: ['A Fringe', 'The Fringe'], teamOrb: ['A <em>Lisbon Tech Fringe</em>', 'The <em>Lisbon Tech Fringe</em>'], hisAgents: ['os seus eventos', 'its events'],
    barriers: ['Eventos que se mantêm', 'Events still on'], weak: ['ATENÇÃO', 'CHECK'], perHour: ['eventos a começar, por hora', 'events starting, per hour'],
    talk: ['A seguir', 'Next up'], msgs: ['Os próximos eventos', 'The next events'], live2: ['lido da API da Fringe', 'read from the Fringe API'], pairsH: ['Os temas que mais se cruzam', 'The topics that cross most'],
    nAgents: ['EVENTOS', 'EVENTS'], policy: ['A DECORRER', 'ON'], noPolicy: ['VERIFICAR', 'CHECK'], allPol: ['TODOS A DECORRER', 'ALL ON'],
    analysis: ['✦ Nota da Fringe', '✦ Fringe note'], nodeBad: ['Este evento foi adiado, cancelado ou está por confirmar: vê a página do organizador.', 'This event is moved, cancelled or unknown: check the organiser\'s page.'],
    legend: ['Legenda', 'Legend'], lTeam: ['A Fringe', 'The Fringe'], lPerson: ['Tema', 'Topic'], lPol: ['Evento a decorrer', 'Event on'], lNo: ['Adiado, cancelado ou por confirmar', 'Moved, cancelled or unknown'], lMsg: ['Eventos partilhados', 'Shared events'],
    explore: ['Ver no Universo ›', 'See in the Universe ›'], talksWith: ['Partilha eventos com', 'Shares events with'], nobody: ['nenhum', 'none'], readToday: ['lido', 'read'], lastCommit: ['começa', 'starts'],
    askU: ['Pergunta sobre os eventos… (em breve)', 'Ask about the events… (coming soon)'], askT: ['Que eventos se mantêm hoje?', 'Which events are still on today?'],
    wx: ['Tempo', 'Weather'], ag: ['Agenda', 'Agenda']
  }

  function detail(D) { return (id, api) => { const e = D.byId.get(id), t = api.t, esc = api.esc; if (!e) return ''
    const en = api.lang === 'en', row = (k, v) => v ? `<li><b style="display:inline">${k}:</b> ${esc(v)}</li>` : ''
    const st = { on: en ? 'ON' : 'A DECORRER', online: 'ONLINE', moved: en ? 'MOVED' : 'ADIADO', cancelled: en ? 'CANCELLED' : 'CANCELADO', unknown: en ? 'UNKNOWN' : 'POR CONFIRMAR' }[e.status] || e.status
    return `<div class="ai"><b>${esc(e.name)}</b><span class="chip ${isOn(e) ? '' : 'am'}">${esc(st)}</span>
      <ul>${row(en ? 'When (Lisbon)' : 'Quando (Lisboa)', (DAY[e.date] || ['', e.date])[en ? 1 : 0] + ' ' + hm(e.start) + '–' + hm(e.end))}${row(en ? 'Where' : 'Onde', e.place)}${row(en ? 'Organiser' : 'Organizador', e.organiser)}${row(en ? 'Kind' : 'Tipo', e.kind)}${row(en ? 'Cost' : 'Custo', e.cost)}${row(en ? 'Storm' : 'Tempestade', e.storm_note)}</ul>
      <a class="polLink" href="${esc(e.url)}" target="_blank" rel="noopener">${en ? 'The organiser\'s page ›' : 'Página do organizador ›'}</a>
      <p class="note">${esc(e.label || '')} · ${en ? 'read' : 'lido'} ${esc((e.read_at || '').replace('T', ' ').slice(0, 16))} UTC</p></div>` } }

  const weather = { id: 'wx', label: STR.wx, icon: 'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z',
    mount(h, api) { this.h = h; this.api = api; h.innerHTML = '<div class="g" style="margin:8px auto;padding:16px;max-width:820px">…</div>'
      Promise.all([getJ(STORM + 'forecast.json'), getJ(STORM + 'warnings.json')]).then(([f, w]) => { this.f = f; this.w = w; this.show() }).catch(e => { h.firstChild.textContent = String(e) }) },
    show() { if (!this.f) return; const en = this.api.lang === 'en', esc = this.api.esc, f = this.f, w = this.w
      const days = f.daily.days.filter(d => DAY[d.forecastDate]).map(d => `<div class="g" style="padding:12px;border-radius:12px;min-width:120px;flex:1"><b>${DAY[d.forecastDate][en ? 1 : 0]}</b><div style="font-size:26px">${Math.round(d.tMax)}°<small style="color:var(--dim)"> / ${Math.round(d.tMin)}°</small></div><small>${esc(en ? d.idWeatherType_en : d.idWeatherType_pt)} · ${en ? 'rain' : 'chuva'} ${Math.round(d.precipitaProb)}%</small></div>`).join('')
      const warn = (w.lisbon || []).map(x => `<li><span class="chip ${x.level === 'red' ? 'bad' : 'am'}">${esc(x.level.toUpperCase())}</span> ${esc(x.type)} · ${esc(x.start_utc.slice(5, 16).replace('T', ' '))}–${esc(x.end_utc.slice(11, 16))}</li>`).join('')
      this.h.firstChild.innerHTML = `<p class="ph">${en ? 'Lisbon weather for the Fringe week' : 'O tempo em Lisboa na semana da Fringe'}</p><div style="display:flex;gap:10px;flex-wrap:wrap">${days}</div>
        <h3 style="margin:16px 0 6px">${en ? 'IPMA warnings, Lisbon' : 'Avisos do IPMA, Lisboa'} (${esc(w.lisbon_peak_level)})</h3><ul>${warn || (en ? '<li>none</li>' : '<li>nenhum</li>')}</ul>
        <p class="note">${en ? 'Not a warning service: follow' : 'Não é um serviço de avisos: segue'} <a href="https://www.ipma.pt/" target="_blank" rel="noopener">IPMA</a>, <a href="https://www.prociv.gov.pt/" target="_blank" rel="noopener">ANEPC</a> ${en ? 'and' : 'e'} <a href="https://storm-charles.promptugal.news" target="_blank" rel="noopener">storm-charles.promptugal.news</a>. ${en ? 'IPMA forecast read' : 'Previsão do IPMA lida'} ${esc(f.daily.read_utc.slice(11, 16))} UTC.</p>` } }

  const agenda = D => ({ id: 'ag', label: STR.ag, icon: 'M4 6h16M4 12h16M4 18h10',
    mount(h, api) { this.h = h; this.api = api; this.show() },
    show() { const en = this.api.lang === 'en', esc = this.api.esc, by = {}
      for (const e of D.byId.values()) (by[e.date] = by[e.date] || []).push(e)
      this.h.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;padding:16px">` + Object.keys(by).sort().map(d => `<div class="g" style="padding:12px;max-height:72vh;overflow:auto"><p class="ph">${(DAY[d] || [d, d])[en ? 1 : 0]} · ${by[d].length}</p>` +
        by[d].sort((a, b) => a.start.localeCompare(b.start)).map(e => `<div data-ev="${esc(e.id)}" role="button" tabindex="0" style="cursor:pointer;padding:6px 0;border-bottom:1px solid var(--edge)${isOn(e) ? '' : ';color:var(--bad)'}"><b style="color:var(--gold2)">${hm(e.start)}</b> ${esc(e.name)}</div>`).join('') + '</div>').join('') + '</div>'
      this.h.onclick = ev => { const x = ev.target.closest('[data-ev]'); if (x) this.api.openNode(x.dataset.ev) } } })

  async function start() {
    const host = document.querySelector('[data-fringe-universe]') || document.getElementById('universe')
    if (!host) return
    if (!window.Gravity) { host.textContent = 'Gravity did not load (web-summit.sgit.ai).'; return }
    let src; try { src = await getJ(API_EVENTS) } catch (e) { host.textContent = 'The Fringe API did not answer: ' + e.message; return }
    const lang = (() => { try { return localStorage.getItem('gravity.lang') || 'en' } catch { return 'en' } })()
    const D = build(src, lang)
    await window.Gravity.mount(host, { data: D.gdata, lang, start: 'uni', strings: STR, detail: detail(D), metric: D.metric, views: [weather, agenda(D)], tourCentre: D.gdata.centres[0].id, liveLabel: 'DATA · read ' + String(src.built_at).slice(11, 16) + ' UTC' })
  }
  start()
})()
