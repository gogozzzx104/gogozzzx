// Holding a side button on the map rolls the strip faster and faster to its end.
//   node cartlaunch/tools/e2e/maphold.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1000, height: 500 } }), errs = []; await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const c = window.__cart, C = c.C, s = C.newSave(); s.rebirths = 30; s.best = C.ZONES[C.LAST + 60].at * 1.1; s.zoneEver = C.LAST + 60; s.zone = 3; c.S = s; c.save(); c.openShop(); document.querySelector('.tab[data-t="map"]').click(); }); await pg.waitForTimeout(500);
  const st = () => pg.evaluate(() => { const M = window.__cart.MAP; return { pos: +M.pos.toFixed(2), n: M.n, fast: !!M.fast, dirty: [...M.cells.values()].filter(c => c.dirty).length, cap: document.querySelector('.mcap h3').textContent }; });
  const R = await (await pg.$('.fa.r')).boundingBox(), L = await (await pg.$('.fa.l')).boundingBox(); console.log('start', JSON.stringify(await st()));
  await pg.mouse.move(R.x + R.width / 2, R.y + R.height / 2); await pg.mouse.down(); await pg.waitForTimeout(150); await pg.mouse.up(); await pg.waitForTimeout(500); console.log('tap right        ', JSON.stringify(await st()));
  await pg.mouse.down(); const t0 = Date.now(), log = []; let endAt = 0; for (let k = 0; k < 16; k++) { await pg.waitForTimeout(250); const q = await st(); log.push(q.pos); if (!endAt && q.pos >= q.n - 1) endAt = Date.now() - t0; } console.log('hold right, pos every 0.25 s:', log.join(' '), '| reached the end after', endAt, 'ms');
  await pg.mouse.up(); await pg.waitForTimeout(600); console.log('released at end  ', JSON.stringify(await st()));
  await pg.mouse.move(L.x + L.width / 2, L.y + L.height / 2); await pg.mouse.down(); await pg.waitForTimeout(1500); await pg.mouse.up(); await pg.waitForTimeout(700); const a = await st(); console.log('hold left 1.5 s  ', JSON.stringify(a), Number.isInteger(a.pos) && a.dirty === 0 ? 'OK (stopped on a frame, scenery drawn)' : 'FAIL');
  await pg.keyboard.down('ArrowLeft'); await pg.waitForTimeout(3500); await pg.keyboard.up('ArrowLeft'); await pg.waitForTimeout(600); const z = await st(); console.log('hold key to start', JSON.stringify(z), z.pos === 0 ? 'OK' : 'FAIL', '| errors', errs.length ? errs : 'none'); await b.close(); })();
