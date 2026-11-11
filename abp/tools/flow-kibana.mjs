#!/usr/bin/env node
// Kibana for swarm-flows (abp/tools/flow.mjs): "Flows: the beginning, the middle and the end" (Dinis, 18:5x UTC).
// A data view on swarm-flows (ids keep their first names, so the dashboard's URL stays) (time field 'at'); a Vega Gantt chart of every unit of the flows in the time range (one
// bar per unit from its start to its end, coloured by altitude, retries as ticks); the units by altitude; a saved
// search of the raw events. Imported by stable ids, so a re-run updates. The credential is read by
// admin/tools/elastic-lib.mjs and never printed.
//   KIBANA_URL=https://<deployment>.kb.<region>... node abp/tools/flow-kibana.mjs import
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const L = await import(path.join(ROOT, 'admin/tools/elastic-lib.mjs'));
const DV = 'fringe-flows-dv', GANTT = 'fringe-flows-gantt', ALT = 'fringe-flows-by-altitude', SEARCH = 'fringe-flows-events', DASH = 'fringe-flows-dashboard';
const COLORS = { A4: '#121317', A3: '#595c64', A2: '#1f4fa8', A1: '#c52830', A0: '#006600' };

// One bar per unit (rows keyed by unit_id, never by name: the same event ids recur across packets and runners; the lead,
// 21:0x UTC). Labels lead with the runner's short name and the packet. colorBy: 'altitude' (the general view) or 'runner'
// (the cross-conductor view).
const RUNNER_COLORS = ['#1f4fa8', '#c52830', '#1f6f3a', '#8a5a00', '#6b3fa0', '#0f7c8c'];
function ganttSpec({ title, subtitle, colorBy = 'altitude', packetsOnly = false, query = null }) {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: { text: title, subtitle },
    data: { url: { ...(packetsOnly || query ? {} : { '%context%': true, '%timefield%': 'at' }), index: 'swarm-flows', body: { size: 5000, ...(query ? { query } : packetsOnly ? { query: { prefix: { flow: 'packet-' } } } : {}), sort: [{ at: 'asc' }], _source: ['flow', 'unit_id', 'parent_id', 'altitude', 'name', 'phase', 'at', 'model', 'valid', 'note', 'environment', 'runner'] } }, format: { property: 'hits.hits' } },
    transform: [
      { calculate: 'time(toDate(datum._source.at))', as: 't' },
      { calculate: 'datum._source.unit_id', as: 'unit' }, { calculate: 'datum._source.altitude', as: 'altitude' }, { calculate: 'datum._source.phase', as: 'phase' },
      { calculate: 'datum._source.flow', as: 'flow' }, { calculate: 'datum._source.environment', as: 'environment' },
      { calculate: "replace(replace(split(datum._source.runner || '', '@')[0] + '@' + (split(datum._source.runner || '', '@')[1] || ''), 'conductor.fringe@PrompTugal.', ''), '.fringe@PrompTugal.', '@')", as: 'runner' },
      { calculate: "indexof(datum.flow, '@') > 0 ? replace(substring(datum.flow, 0, indexof(datum.flow, '@')), /^[0-9]{8}-[0-9]{4}-/, '') : indexof(datum.flow, 'packet-') == 0 ? replace(substring(datum.flow, 0, lastindexof(substring(datum.flow, 0, lastindexof(datum.flow, '-')), '-')), 'packet-2026-11-11-', '') : datum.flow", as: 'packet' },
      { calculate: "replace(replace(datum._source.name, / by .*$/, ''), 'LLM call: ', '')", as: 'what' },
      { filter: 'datum.phase != "step"' },
      { aggregate: [{ op: 'min', field: 't', as: 'start' }, { op: 'max', field: 't', as: 'end' }, { op: 'max', field: 'what', as: 'what' }], groupby: ['unit', 'altitude', 'flow', 'packet', 'runner', 'environment'] },
      { calculate: 'datum.end == datum.start ? datum.start + 400 : datum.end', as: 'end2' },
      { calculate: "datum.runner + ' · ' + datum.packet + ' · ' + datum.altitude + ' ' + datum.what + '  ‹' + substring(replace(datum.unit, 'sha256:', ''), 0, 6) + '›'", as: 'label' },
      { calculate: "timeFormat(datum.start, '%H:%M:%S')", as: 'from' }, { calculate: "timeFormat(datum.end, '%H:%M:%S')", as: 'to' }, { calculate: 'format((datum.end - datum.start) / 1000, ".1f")', as: 'secs' },
    ],
    width: 'container', autosize: { type: 'fit', contains: 'padding' },
    mark: { type: 'bar', cornerRadius: 2 },
    encoding: {
      y: { field: 'label', type: 'nominal', sort: { field: 'start', op: 'min' }, axis: { title: null, labelLimit: 520 } },
      x: { field: 'start', type: 'quantitative', title: 'UTC', scale: { zero: false, nice: false }, axis: { labelExpr: "timeFormat(datum.value, '%H:%M:%S')", tickCount: 8 } }, x2: { field: 'end2' },
      color: colorBy === 'runner' ? { field: 'runner', type: 'nominal', scale: { range: RUNNER_COLORS }, title: 'runner' } : { field: 'altitude', type: 'nominal', scale: { domain: Object.keys(COLORS), range: Object.values(COLORS) } },
      tooltip: [{ field: 'packet', title: 'run' }, { field: 'runner' }, { field: 'environment' }, { field: 'altitude' }, { field: 'what', title: 'unit' }, { field: 'from', title: 'start (UTC)' }, { field: 'to', title: 'end (UTC)' }, { field: 'secs', title: 'seconds' }],
    },
  };
}
const gantt = ganttSpec({ title: 'Every unit, from its start to its end', subtitle: 'one bar per unit (row = unit); colour = altitude' });
const ganttRuns = ganttSpec({ title: 'Swarm runs (R8, GitHub Actions): every unit, start to end', subtitle: 'each run starts with a push; one bar per unit; colour = altitude; labels: requester · run · unit', query: { prefix: { environment: 'R8' } } });
const ganttPackets = ganttSpec({ title: 'Cross-conductor packets: every call, from its start to its end', subtitle: 'one bar per unit (row = unit); colour = runner; labels: runner · packet · unit', colorBy: 'runner', packetsOnly: true });
const byAlt = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json', title: 'Units started, by altitude',
  data: { url: { '%context%': true, '%timefield%': 'at', index: 'swarm-flows', body: { size: 0, aggs: { a: { terms: { field: 'altitude', size: 10 }, aggs: { p: { filter: { term: { phase: 'start' } } } } } } } }, format: { property: 'aggregations.a.buckets' } },
  mark: 'bar', width: 'container',
  encoding: { x: { field: 'key', type: 'nominal', title: null, sort: ['A4', 'A3', 'A2', 'A1', 'A0'] }, y: { field: 'p.doc_count', type: 'quantitative', title: 'units' }, color: { field: 'key', type: 'nominal', scale: { domain: Object.keys(COLORS), range: Object.values(COLORS) }, legend: null } },
};
const vis = (id, title, spec) => ({ id, type: 'visualization', attributes: { title, description: '', visState: JSON.stringify({ title, type: 'vega', aggs: [], params: { spec: JSON.stringify(spec, null, 1) } }), uiStateJSON: '{}', kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [] }) } }, references: [] });
// the cross-conductor packets (the lead, 20:3x UTC, for Dinis): every packet flow side by side, by runner and environment
const xc = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: { text: 'Cross-conductor packets: each run side by side', subtitle: 'one bar per run (packet × runner × environment and account); green = valid answers, red = invalid; same model' },
  data: { url: { index: 'swarm-flows', body: { size: 2000, query: { bool: { filter: [{ prefix: { flow: 'packet-' } }, { prefix: { 'name.raw': 'LLM call' } }, { term: { phase: 'end' } }] } }, _source: ['flow', 'runner', 'environment', 'valid', 'model', 'latency_ms', 'cost_usd'] } }, format: { property: 'hits.hits' } },
  transform: [
    { calculate: "replace(datum._source.flow, 'packet-2026-11-11-', '')", as: 'f1' },
    { calculate: "substring(datum.f1, 0, lastindexof(datum.f1, '-'))", as: 'f2' },
    { calculate: "substring(datum.f2, 0, lastindexof(datum.f2, '-'))", as: 'packet' },
    { calculate: "replace(split(datum._source.runner, '@')[1], 'PrompTugal.', '')", as: 'runner' },
    { calculate: "datum._source.environment", as: 'env' },
    { calculate: "datum.runner + '  ·  ' + datum.packet", as: 'run' },
    { calculate: 'datum._source.valid ? "valid" : "invalid"', as: 'answer' },
    { calculate: 'datum._source.model', as: 'model' }, { calculate: 'datum._source.latency_ms', as: 'latency' }, { calculate: 'datum._source.cost_usd', as: 'cost' },
  ],
  mark: { type: 'bar', cornerRadius: 2 }, width: 'container',
  encoding: {
    y: { field: 'run', type: 'nominal', axis: { title: null, labelLimit: 420 } },
    x: { aggregate: 'count', type: 'quantitative', title: 'LLM calls (A1)' },
    color: { field: 'answer', type: 'nominal', scale: { domain: ['valid', 'invalid'], range: ['#1f6f3a', '#c52830'] }, title: null },
    tooltip: [{ field: 'packet' }, { field: 'runner' }, { field: 'env', title: 'environment and account' }, { field: 'answer' }, { aggregate: 'count', title: 'calls' }, { field: 'model' }],
  },
};
const objects = [
  { id: DV, type: 'index-pattern', attributes: { title: 'swarm-flows', name: 'Flows: every unit, start to end (live)', timeFieldName: 'at' }, references: [] },
  vis(GANTT, 'Flows: every unit from start to end', gantt),
  vis(ALT, 'Flows: units by altitude', byAlt),
  vis('fringe-flows-cross-conductor', 'Flows: cross-conductor packets, side by side', xc),
  vis('fringe-flows-packets-gantt', 'Flows: cross-conductor packets, start to end', ganttPackets),
  vis('fringe-flows-swarm-runs-gantt', 'Flows: swarm runs (R8), start to end', ganttRuns),
  { id: 'fringe-swarm-runs-dashboard', type: 'dashboard', attributes: { title: 'Flows: swarm runs (every run starts with a push)', description: 'By architect.1: the runs of PrompTugal__News__Swarm__Runs (R8, GitHub Actions). Each flow id is <request>@<commit>#<workflow run>.<attempt>.', timeRestore: true, timeFrom: 'now-24h', timeTo: 'now', refreshInterval: { pause: false, value: 10000 }, panelsJSON: JSON.stringify([{ panelIndex: 'r', gridData: { x: 0, y: 0, w: 48, h: 90, i: 'r' }, embeddableConfig: {}, panelRefName: 'panel_r' }]), optionsJSON: JSON.stringify({ useMargins: true, hidePanelTitles: false }), kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [] }) } }, references: [{ name: 'panel_r', type: 'visualization', id: 'fringe-flows-swarm-runs-gantt' }, { name: 'tag-swarm', type: 'tag', id: 'b65d1710-1de3-2a2d-482f-7640090dff54' }, { name: 'tag-fringe', type: 'tag', id: '99c5e151-4199-bf04-aad0-543949689f1f' }] },
  { id: 'fringe-flows-packets-search', type: 'search', attributes: { title: 'Flows: cross-conductor packet calls', description: 'Every A1 call of every packet run, by runner and environment', columns: ['runner', 'environment', 'flow', 'name', 'model', 'valid', 'latency_ms', 'cost_usd'], sort: [['at', 'desc']], kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: 'flow : packet-* and name.raw : LLM* and phase : end', language: 'kuery' }, filter: [], indexRefName: 'kibanaSavedObjectMeta.searchSourceJSON.index' }) } }, references: [{ name: 'kibanaSavedObjectMeta.searchSourceJSON.index', type: 'index-pattern', id: DV }] },
  { id: 'fringe-packets-dashboard', type: 'dashboard', attributes: { title: 'Flows: cross-conductor packets', description: 'By architect.1, for Dinis\'s cross-conductor OpenRouter test (11 November 2026, 20:3x UTC): every packet run side by side, by runner, environment and account; every call below.', timeRestore: true, timeFrom: 'now-24h', timeTo: 'now', refreshInterval: { pause: false, value: 10000 }, panelsJSON: JSON.stringify([{ panelIndex: 'x', gridData: { x: 0, y: 0, w: 48, h: 14, i: 'x' }, embeddableConfig: {}, panelRefName: 'panel_x' }, { panelIndex: 'g', gridData: { x: 0, y: 14, w: 48, h: 24, i: 'g' }, embeddableConfig: {}, panelRefName: 'panel_g' }, { panelIndex: 'c', gridData: { x: 0, y: 38, w: 48, h: 16, i: 'c' }, embeddableConfig: {}, panelRefName: 'panel_c' }]), optionsJSON: JSON.stringify({ useMargins: true, hidePanelTitles: false }), kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [] }) } }, references: [{ name: 'panel_x', type: 'visualization', id: 'fringe-flows-cross-conductor' }, { name: 'panel_g', type: 'visualization', id: 'fringe-flows-packets-gantt' }, { name: 'panel_c', type: 'search', id: 'fringe-flows-packets-search' }, { name: 'tag-swarm', type: 'tag', id: 'b65d1710-1de3-2a2d-482f-7640090dff54' }, { name: 'tag-fringe', type: 'tag', id: '99c5e151-4199-bf04-aad0-543949689f1f' }] },
  { id: SEARCH, type: 'search', attributes: { title: 'Flows: the events', description: '', columns: ['flow', 'phase', 'altitude', 'name', 'environment', 'model', 'duration_ms', 'valid', 'note'], sort: [['at', 'desc']], kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [], indexRefName: 'kibanaSavedObjectMeta.searchSourceJSON.index' }) } }, references: [{ name: 'kibanaSavedObjectMeta.searchSourceJSON.index', type: 'index-pattern', id: DV }] },
  { id: DASH, type: 'dashboard', attributes: { title: 'Flows: the beginning, the middle and the end', description: 'By architect.1. Dinis, 11 November 2026: "I want to start to see the execution. I want to see the beginning, the middle, and ending." Every unit of every run (A4 swarm, A3 agent, A2 loop, A1 LLM call, A0 compute), live from abp/tools/flow.mjs, from every environment.', timeRestore: true, timeFrom: 'now-6h', timeTo: 'now', refreshInterval: { pause: false, value: 10000 },
    panelsJSON: JSON.stringify([
      { panelIndex: 'g', gridData: { x: 0, y: 0, w: 48, h: 26, i: 'g' }, embeddableConfig: {}, panelRefName: 'panel_g' },
      { panelIndex: 'a', gridData: { x: 0, y: 26, w: 16, h: 12, i: 'a' }, embeddableConfig: {}, panelRefName: 'panel_a' },
      { panelIndex: 's', gridData: { x: 16, y: 26, w: 32, h: 12, i: 's' }, embeddableConfig: {}, panelRefName: 'panel_s' }]),
    optionsJSON: JSON.stringify({ useMargins: true, hidePanelTitles: false }), kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify({ query: { query: '', language: 'kuery' }, filter: [] }) } },
    references: [{ name: 'panel_g', type: 'visualization', id: GANTT }, { name: 'panel_a', type: 'visualization', id: ALT }, { name: 'panel_s', type: 'search', id: SEARCH }, { name: 'tag-swarm', type: 'tag', id: 'b65d1710-1de3-2a2d-482f-7640090dff54' }, { name: 'tag-fringe', type: 'tag', id: '99c5e151-4199-bf04-aad0-543949689f1f' }] },
];

if (process.argv[2] === 'import') {
  const K = (process.env.KIBANA_URL || '').replace(/\/+$/, '');
  if (!/^https:\/\//.test(K)) { console.error('KIBANA_URL is not set'); process.exit(1); }
  const fd = new FormData();
  fd.append('file', new Blob([objects.map((o) => JSON.stringify(o)).join('\n') + '\n'], { type: 'application/ndjson' }), 'flows.ndjson');
  const r = await fetch(`${K}/api/saved_objects/_import?overwrite=true`, { method: 'POST', headers: { 'kbn-xsrf': 'true', ...L.auth() }, body: fd });
  const j = await r.json();
  console.log(`kibana import: HTTP ${r.status}, ${j.successCount ?? 0} objects${j.errors && j.errors.length ? ', errors: ' + JSON.stringify(j.errors).slice(0, 300) : ''}`);
  console.log(`dashboard: ${K}/app/dashboards#/view/${DASH}`);
  console.log(`packets: ${K}/app/dashboards#/view/fringe-packets-dashboard`);
  console.log(`swarm runs: ${K}/app/dashboards#/view/fringe-swarm-runs-dashboard`);
} else console.log('usage: KIBANA_URL=... node abp/tools/flow-kibana.mjs import');
