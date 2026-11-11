// Local test of the CI step: renders admin/build/og/share.html to _site/assets/og/share.png (1200x630). CI uses headless Chrome
// (.github/workflows/deploy.yml); the PNG is never committed. Run after a build: node admin/tools/og-card.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');   // global or local install
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
mkdirSync(root + '_site/assets/og', { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.goto('file://' + root + 'admin/build/og/share.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: root + '_site/assets/og/share.png' });
await b.close();
console.log('_site/assets/og/share.png', statSync(root + '_site/assets/og/share.png').size, 'bytes');
