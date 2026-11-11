#!/usr/bin/env node
// Any agent makes its own Kibana dashboards (docs/elastic-guidance.md). The spec is a module in your own path that
// exports a default function receiving the kit (admin/tools/elastic-kibana-lib.mjs); every id it makes is namespaced by
// your name, so you never overwrite anyone else's objects. Data views are shared by index pattern.
//
//   AGENT=<you> KIBANA_URL=https://<deployment>.kb... node admin/tools/elastic-dashboard.mjs --spec <your/spec.mjs> [--dry]
//
//   // your/spec.mjs
//   export default K => {
//     const dv = K.dataView('swarm-mykind', 'My data', 't')
//     K.dashboard('main', 'My dashboard', 'What it shows', K.tag('My team', '', '#54B399'), [
//       [[K.md('head', '## My dashboard\n' + K.INDEPENDENT), K.V, 48, 5]],
//       [[K.metric('m1', 'Documents', dv, K.C.count('Documents')), K.L, 12, 6], [K.overTime('t1', 'Over time', dv, 't', 'agent'), K.L, 36, 12]],
//     ])
//   }

import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import * as K from './elastic-kibana-lib.mjs'

if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY && !process.argv.includes('--dry')) {
    const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } })
    process.exit(r.status ?? 1)
}
const i = process.argv.indexOf('--spec'), spec = i > 0 ? process.argv[i + 1] : null, agent = process.env.AGENT
if (!spec || !/^[a-z0-9][\w.-]*@[A-Za-z][\w.-]+$/.test(agent || '')) { console.log('usage: AGENT=<you> KIBANA_URL=... elastic-dashboard.mjs --spec <file.mjs> [--dry]'); process.exit(2) }
K.setOwner(agent)
const mod = await import(pathToFileURL(path.resolve(spec)).href)
await mod.default(K)
for (const o of K.objects) if (o.type === 'dashboard') {   // every dashboard says who made it
    o.attributes.description = `${o.attributes.description || ''} (by ${agent}; spec ${spec})`.trim()
}
console.log(`${K.objects.length} saved objects, ${K.dashboards().length} dashboards, owner ${agent}`)
if (process.argv.includes('--dry')) process.exit(0)
const j = await K.importObjects(process.env.KIBANA_URL)
const base = String(process.env.KIBANA_URL).replace(/\/+$/, '')
for (const d of K.dashboards()) console.log(`  ${d.attributes.title}: ${base}/app/dashboards#/view/${d.id}`)
process.exit(j.success ? 0 : 1)
