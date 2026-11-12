#!/usr/bin/env node
// The best of Elastic (and Grafana) for the swarm: a presenter page in the swarm stage's own language
// (elastic.1.fringe@PrompTugal.dinis; Dinis, 12 November 2026, 07:4x UTC: "a complete new page ... a best of ... take
// screenshots of Kibana and even Elastic ... allow me to present what we're doing and the dashboards to somebody ...
// with explanations ... arrows ... I should be able to show Elastic and show the power of what we do").
//
//   node admin/tools/elastic-showcase.mjs --shots <dir with capture.json and the JPEGs> --out <page.html>
//
// The scenes (what each says, where each callout points) are elastic/showcase/scenes.json, in git. The screenshots are
// not: they are taken by elastic.1's capture script into a scratch folder and embedded in the page (CLAUDE.md: no
// binaries in git). A callout names a panel by its title; the capture recorded where every panel sits.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const opt = {}
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) opt[process.argv[i].slice(2)] = process.argv[i + 1]
const SHOTS = opt.shots, OUT = opt.out
if (!SHOTS || !OUT) { console.log('usage: elastic-showcase.mjs --shots <dir> --out <file.html>'); process.exit(2) }
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'elastic', 'showcase', 'scenes.json'), 'utf8'))
const CAP = JSON.parse(fs.readFileSync(path.join(SHOTS, 'capture.json'), 'utf8'))
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

let missing = 0
const scenes = S.scenes.map(sc => {
    const out = { ...sc }
    if (sc.shot) {
        const c = CAP[sc.shot]
        if (!c) { console.log(`  scene ${sc.id}: no capture "${sc.shot}"`); missing++; return out }
        const img = fs.readFileSync(path.join(SHOTS, path.basename(c.file)))
        out.img = `data:image/jpeg;base64,${img.toString('base64')}`
        out.w = c.width; out.h = c.height; out.live = sc.live || c.url
        out.callouts = (sc.callouts || []).map(co => {
            let box = co.box
            if (!box && co.panel !== undefined) {
                const cands = typeof co.panel === 'number' ? [c.boxes[co.panel]] : c.boxes.filter(b => norm(b.title).includes(norm(co.panel)))
                const b = cands[0]
                if (!b) { console.log(`  scene ${sc.id}: no panel "${co.panel}"`); missing++ } else box = { x: b.x / c.width, y: b.y / c.height, w: b.w / c.width, h: b.h / c.height }
            }
            return { ...co, box }
        }).filter(co => co.box)
        // the view is cropped to the region the callouts need, if the scene asks (focus), else shows the top of the dashboard
        out.view = sc.view || null
    }
    return out
})

const tpl = fs.readFileSync(path.join(ROOT, 'elastic', 'showcase', 'template.html'), 'utf8')
const data = { title: S.title, about: S.about, read_at: S.read_at, by: S.by, kibana: S.kibana, scenes }
const html = tpl.replace('/*__DATA__*/null', JSON.stringify(data).replace(/</g, '\\u003c'))
fs.writeFileSync(OUT, html)
console.log(`${OUT}: ${scenes.length} scenes, ${scenes.filter(s => s.img).length} screenshots, ${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB${missing ? `, ${missing} callouts or captures missing` : ''}`)
