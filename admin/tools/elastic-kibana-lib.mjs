// The Kibana kit (elastic.1.fringe@PrompTugal.dinis, WS-215): the builders behind every dashboard of the swarm on
// Elastic, shared so any agent can make its own (docs/elastic-guidance.md). Saved objects are plain JSON; ids are
// sha256-derived and namespaced by the owner (setOwner), so a re-import updates in place and agents never collide.
// Data views are shared by pattern (one id per index pattern, whoever defines it).
//
//   import * as K from './elastic-kibana-lib.mjs'
//   K.setOwner('architect.1.fringe@PrompTugal.dinis')
//   const dv = K.dataView('fringe-altitudes', 'The agentic runs', 't')
//   K.dashboard('my-key', 'Title', 'Description', K.tag('My tag', 'what', '#6092C0'), [[[K.metric('m1', 'Units', dv, K.C.count('Units')), K.L, 8, 6]]])
//   await K.importObjects(process.env.KIBANA_URL)

import crypto from 'node:crypto'
import { auth } from './elastic-lib.mjs'

let NS = ''
export function setOwner(agent) { NS = agent || '' }
export const uid = (type, ...p) => crypto.createHash('sha256').update([...(NS && type !== 'dv' ? [NS] : []), type, ...p].join(':')).digest('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*/, '$1-$2-$3-$4-$5')
export const objects = []
export const add = o => { const i = objects.findIndex(x => x.id === o.id && x.type === o.type); if (i >= 0) objects[i] = o; else objects.push(o); return o.id }
export const INDEPENDENT = 'Independent of Web Summit; built by the PrompTugal agentic team from public sources. Not a warning service.'
export const tag = (name, description = '', color = '#6092C0') => add({ type: 'tag', id: uid('tag', name), attributes: { name, description, color }, references: [] })

export const DV = {}
export function dataView(pattern, name, timeField) {
    DV[pattern] = add({ type: 'index-pattern', id: uid('dv', pattern), attributes: { title: pattern, name, timeFieldName: timeField, allowNoIndex: true }, references: [] })
    return DV[pattern]
}

// ---------- Lens columns ----------
export const C = {
    count: (label = 'Count') => ({ label, customLabel: true, dataType: 'number', operationType: 'count', isBucketed: false, scale: 'ratio', sourceField: '___records___', params: { emptyAsNull: true } }),
    unique: (f, label) => ({ label, customLabel: true, dataType: 'number', operationType: 'unique_count', isBucketed: false, scale: 'ratio', sourceField: f, params: { emptyAsNull: true } }),
    avg: (f, label) => ({ label, customLabel: true, dataType: 'number', operationType: 'average', isBucketed: false, scale: 'ratio', sourceField: f, params: { emptyAsNull: true } }),
    max: (f, label) => ({ label, customLabel: true, dataType: 'number', operationType: 'max', isBucketed: false, scale: 'ratio', sourceField: f, params: { emptyAsNull: true } }),
    sum: (f, label) => ({ label, customLabel: true, dataType: 'number', operationType: 'sum', isBucketed: false, scale: 'ratio', sourceField: f, params: { emptyAsNull: true } }),
    date: (f, label = 'Time', interval = 'auto') => ({ label, customLabel: true, dataType: 'date', operationType: 'date_histogram', isBucketed: true, scale: 'interval', sourceField: f, params: { interval, includeEmptyRows: true, dropPartials: false } }),
    terms: (f, label, size = 10, orderBy = 'm', other = true) => ({ label, customLabel: true, dataType: 'string', operationType: 'terms', isBucketed: true, scale: 'ordinal', sourceField: f, params: { size, orderBy: { type: 'column', columnId: orderBy }, orderDirection: 'desc', otherBucket: other, missingBucket: false, parentFormat: { id: 'terms' } } }),
}

export function lens(key, title, dv, visType, visualization, columns, columnOrder, query = '') {
    const id = uid('lens', key)
    return add({ type: 'lens', id, typeMigrationVersion: '10.1.0', coreMigrationVersion: '8.8.0', attributes: { title, description: '', visualizationType: visType, state: {
        visualization, query: { query, language: 'kuery' }, filters: [], internalReferences: [], adHocDataViews: {},
        datasourceStates: { formBased: { layers: { L: { columns, columnOrder, incompleteColumns: {}, sampling: 1 } } } } } },
        references: [{ type: 'index-pattern', id: dv, name: 'indexpattern-datasource-layer-L' }] })
}
// a metric tile
export const METRICS = new Set()
export const metric = (key, title, dv, col, query) => { col.label = title; const id = lens(key, title, dv, 'lnsMetric', { layerId: 'L', layerType: 'data', metricAccessor: 'm' }, { m: col }, ['m'], query); METRICS.add(id); return id }
// bars over time, split by a field
export const overTime = (key, title, dv, timeField, split, query, { series = 'bar_stacked', interval = 'auto', metricCol } = {}) => {
    const cols = { x: C.date(timeField, 'Time', interval), m: metricCol || C.count() }, order = ['x']
    if (split) { cols.s = C.terms(split, split, 10); order.push('s') }
    order.push('m')
    return lens(key, title, dv, 'lnsXY', { legend: { isVisible: true, position: 'right' }, valueLabels: 'hide', preferredSeriesType: series, fittingFunction: 'None',
        layers: [{ layerId: 'L', layerType: 'data', seriesType: series, xAccessor: 'x', accessors: ['m'], ...(split ? { splitAccessor: 's' } : {}), position: 'top', showGridlines: false }] }, cols, order, query)
}
// top values as horizontal bars
export const top = (key, title, dv, field, query, { size = 12, metricCol, label } = {}) =>
    lens(key, title, dv, 'lnsXY', { legend: { isVisible: false, position: 'right' }, valueLabels: 'show', preferredSeriesType: 'bar_horizontal', fittingFunction: 'None',
        layers: [{ layerId: 'L', layerType: 'data', seriesType: 'bar_horizontal', xAccessor: 'x', accessors: ['m'], position: 'top', showGridlines: false }] },
        { x: C.terms(field, label || field, size, 'm', false), m: metricCol || C.count() }, ['x', 'm'], query)
// a donut
export const donut = (key, title, dv, field, query, { size = 8, metricCol } = {}) =>
    lens(key, title, dv, 'lnsPie', { shape: 'donut', layers: [{ layerId: 'L', layerType: 'data', primaryGroups: ['g'], metrics: ['m'], numberDisplay: 'percent', categoryDisplay: 'default', legendDisplay: 'default', nestedLegend: false }] },
        { g: C.terms(field, field, size), m: metricCol || C.count() }, ['g', 'm'], query)
// a table: rows by fields, then metrics
export const table = (key, title, dv, rows, metrics, query) => {
    const cols = {}, order = []
    metrics.forEach((m, i) => { cols[`m${i}`] = m })
    rows.forEach(([f, label, size], i) => { cols[`r${i}`] = C.terms(f, label, size || 20, 'm0', false); order.push(`r${i}`) })
    metrics.forEach((_, i) => order.push(`m${i}`))
    return lens(key, title, dv, 'lnsDatatable', { layerId: 'L', layerType: 'data', columns: order.map(c => ({ columnId: c, isTransposed: false })) }, cols, order, query)
}
// a heatmap: x by y
export const heat = (key, title, dv, xField, yField, query, { xDate = false } = {}) =>
    lens(key, title, dv, 'lnsHeatmap', { layerId: 'L', layerType: 'data', shape: 'heatmap', xAccessor: 'x', yAccessor: 'y', valueAccessor: 'm',
        legend: { isVisible: true, position: 'right', type: 'heatmap_legend' }, gridConfig: { type: 'heatmap_grid', isCellLabelVisible: false, isYAxisLabelVisible: true, isXAxisLabelVisible: true, isYAxisTitleVisible: false, isXAxisTitleVisible: false } },
        { x: xDate ? C.date(xField, 'Time', '1h') : C.terms(xField, xField, 12), y: C.terms(yField, yField, 15), m: C.count() }, ['x', 'y', 'm'], query)

// saved searches (the documents themselves, newest first)
export const search = (key, title, dv, columns, query = '', sortField = 't', dir = 'desc') => add({ type: 'search', id: uid('search', key), attributes: {
    title, description: '', columns, sort: [[sortField, dir]], grid: {}, hideChart: true, isTextBasedQuery: false,
    kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query, language: 'kuery' }, filter: [], indexRefName: 'kibanaSavedObjectMeta.searchSourceJSON.index' }) } },
    references: [{ name: 'kibanaSavedObjectMeta.searchSourceJSON.index', type: 'index-pattern', id: dv }] })

// a markdown panel
export const md = (key, text) => add({ type: 'visualization', id: uid('md', key), attributes: { title: '', description: '', uiStateJSON: '{}', version: 1,
    visState: JSON.stringify({ title: '', type: 'markdown', aggs: [], params: { fontSize: 12, openLinksInNewTab: true, markdown: text } }),
    kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [] }) } }, references: [] })

// a dashboard: rows of [id, type, width, height]
export function dashboard(key, title, description, tag, rows, { from = 'now-30d', to = 'now', refresh = 300000 } = {}) {
    const panels = [], refs = []
    let y = 0, n = 0
    for (const row of rows) {
        let x = 0, h = 0
        for (const [id, type, w, ph, opts = {}] of row) {   // opts: { timeRange: {from, to}, title } for this panel only
            const i = `p${++n}`
            panels.push({ type, gridData: { x, y, w, h: ph, i }, panelIndex: i, embeddableConfig: { enhancements: {}, ...(type === 'visualization' && !opts.title || METRICS.has(id) ? { hidePanelTitles: true } : {}), ...(opts.timeRange ? { timeRange: opts.timeRange } : {}), ...(opts.title ? { title: opts.title } : {}) }, panelRefName: `panel_${i}` })
            refs.push({ name: `${i}:panel_${i}`, type, id })
            x += w; h = Math.max(h, ph)
        }
        y += h
    }
    refs.push({ type: 'tag', id: tag, name: `tag-ref-${tag}` })
    return add({ type: 'dashboard', id: uid('dash', key), attributes: { title, description, panelsJSON: JSON.stringify(panels),
        optionsJSON: JSON.stringify({ useMargins: true, syncColors: true, syncCursor: true, syncTooltips: true, hidePanelTitles: false }),
        timeRestore: true, timeFrom: from, timeTo: to, refreshInterval: { pause: false, value: refresh },
        kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [] }) } }, references: refs })
}
export const L = 'lens', S = 'search', V = 'visualization'

// import every object built so far (or a given list) into Kibana, overwriting by id
export async function importObjects(kibanaUrl, list = objects) {
    const K = String(kibanaUrl || '').replace(/\/+$/, '')
    if (!/^https:\/\//.test(K)) throw new Error('KIBANA_URL is not set')
    const form = new FormData()
    form.append('file', new Blob([list.map(o => JSON.stringify(o)).join('\n') + '\n'], { type: 'application/ndjson' }), 'objects.ndjson')
    const r = await fetch(`${K}/api/saved_objects/_import?overwrite=true`, { method: 'POST', headers: { 'kbn-xsrf': 'true', ...auth() }, body: form })
    const raw = await r.text(); let j = {}; try { j = JSON.parse(raw) } catch {}
    if (!r.ok) console.log(raw.slice(0, 600))
    console.log(`import: HTTP ${r.status}, success ${j.success}, ${j.successCount ?? 0} objects`)
    for (const e of (j.errors || []).slice(0, 10)) console.log(`  ${e.type} ${e.id}: ${JSON.stringify(e.error).slice(0, 200)}`)
    return j
}
export const dashboards = () => objects.filter(o => o.type === 'dashboard')

// a Vega or Vega-Lite panel (the spec as an object; Kibana keeps it as text). Used for the swarm's own views in Kibana.
export const vega = (key, title, spec) => add({ type: 'visualization', id: uid('vega', key), attributes: { title, description: '', uiStateJSON: '{}', version: 1,
    visState: JSON.stringify({ title, type: 'vega', aggs: [], params: { spec: JSON.stringify(spec, null, 2) } }),
    kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [] }) } }, references: [] })
