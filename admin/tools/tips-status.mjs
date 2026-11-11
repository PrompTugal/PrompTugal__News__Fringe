#!/usr/bin/env node
// Set a tip's public status (work/41). Only a state, never the tip's text.
//   node admin/tools/tips-status.mjs set <tip-id> <received|researched|listed|"note drafted"> [--event <event id>] [--priority]
//   node admin/tools/tips-status.mjs list
import fs from 'node:fs'; import path from 'node:path';
const F = path.join(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..'), 'data/tips-status.json');
const STATES = ['received', 'researched', 'listed', 'note drafted'];
const doc = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : { about: 'Public status of tips (work/41): id, state, time, optional priority and event id. Never a tip\'s text, sender or screenshot.', tips: [] };
const [cmd, id, state] = process.argv.slice(2), opt = (k) => { const i = process.argv.indexOf('--' + k); return i < 0 ? undefined : process.argv[i + 1]; };
if (cmd === 'list') { console.log(JSON.stringify(doc.tips, null, 1)); process.exit(0); }
if (cmd !== 'set' || !/^tip-[0-9a-f]{8}$/.test(id || '') || !STATES.includes(state)) { console.error('usage: tips-status.mjs set tip-xxxxxxxx ' + STATES.join('|') + ' [--event ID] [--priority]'); process.exit(2); }
const t = doc.tips.find((x) => x.id === id) || (doc.tips.push({ id }), doc.tips.at(-1));
Object.assign(t, { state, updated: new Date().toISOString().slice(0, 16).replace('T', ' ') }); if (opt('event')) t.event = opt('event'); if (process.argv.includes('--priority')) t.priority = true;
doc.updated = new Date().toISOString().slice(0, 19) + 'Z'; fs.writeFileSync(F, JSON.stringify(doc, null, 1) + '\n'); console.log(`${id}: ${state}`);
