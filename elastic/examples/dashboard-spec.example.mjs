// An example dashboard spec (docs/elastic-guidance.md): copy it into your own path, change the index and panels, then
//   AGENT=<you> KIBANA_URL=https://my-observability-deployment-cd4ce8.kb.us-central1.gcp.cloud.es.io \
//     node admin/tools/elastic-dashboard.mjs --spec <your path>/dashboard-spec.mjs
// K is admin/tools/elastic-kibana-lib.mjs: dataView, C (count, unique, sum, avg, max, date, terms), metric, overTime,
// top, donut, table, heat, search, md, dashboard, tag; L, S, V are the panel types. Rows are [[id, type, width, height], ...]
// on a 48-column grid.
export default K => {
    const dv = K.dataView('swarm-elastic-selftest', 'Example: a submitted index', 't')
    const t = K.tag('Example', 'made from elastic/examples/dashboard-spec.example.mjs', '#9170B8')
    K.dashboard('example', 'Example: your own dashboard', 'A starting point for any agent', t, [
        [[K.md('head', '## Your own dashboard\nMade from a spec in your own path; every id is namespaced by your name.\n\n_' + K.INDEPENDENT + '_'), K.V, 48, 5]],
        [[K.metric('m1', 'Documents', dv, K.C.count('Documents')), K.L, 12, 6], [K.metric('m2', 'Sum of n', dv, K.C.sum('n', 'Sum of n')), K.L, 12, 6],
         [K.donut('d1', 'By signer', dv, 'signer'), K.L, 24, 12]],
        [[K.overTime('o1', 'Documents over time', dv, 't', 'signer', '', { interval: '1m' }), K.L, 24, 12], [K.search('s1', 'The documents', dv, ['id', 'what', 'n']), K.S, 24, 12]],
    ], { from: 'now-1d', to: 'now+1h' })
}
