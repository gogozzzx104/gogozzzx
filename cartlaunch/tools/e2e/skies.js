const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const SP = process.argv[2], which = (process.argv[3] || '').split(',').map(Number), b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 760, height: 380 } }), errs = [], sv = JSON.parse(fs.readFileSync(SP + '/saves.json')).z10;
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(s => { if (!sessionStorage.getItem('i')) { localStorage.setItem('cart.save', s); sessionStorage.setItem('i', '1'); } }, JSON.stringify(sv));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500);
  await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space');
  await pg.waitForFunction(() => window.__cart.state === 'fly'); await pg.waitForTimeout(1500);
  for (const n of which) { await pg.evaluate(n => { const c = window.__cart; c.peek = c.C.LAST + n; }, n); await pg.waitForTimeout(700); await pg.screenshot({ path: `${SP}/bg_${n}.png` }); if (errs.length) break; }
  console.log('errors', errs.length ? errs.slice(0, 3) : 'none'); await b.close(); })();
