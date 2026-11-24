// A flight in progress survives a reload of the page: once through this device's storage, once through the viewer's update hook (faked here).
//   node cartlaunch/tools/e2e/resume.js cartlaunch/tools/e2e
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const SP = process.argv[2], b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), saves = JSON.parse(fs.readFileSync(SP + '/saves.json')), errs = [];
  const ctx = await b.newContext({ viewport: { width: 1000, height: 500 } }), pg = await ctx.newPage();
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(s => { if (!localStorage.getItem('seeded')) { localStorage.setItem('cart.save', s); localStorage.setItem('seeded', '1'); }
    const h = sessionStorage.getItem('hot'); if (h) { sessionStorage.removeItem('hot'); window.claude = { hot: { data: JSON.parse(h), ready(fn) { setTimeout(() => fn(this.data), 30); }, snapshot(fn) { window.__snap = fn; } } }; } else window.claude = { hot: { data: {}, ready(fn) { setTimeout(() => fn(this.data), 30); }, snapshot(fn) { window.__snap = fn; } } }; }, JSON.stringify(saves.z10));
  const fire = async () => { await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93 || window.__cart.state !== 'charge'); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly'); };
  const info = () => pg.evaluate(() => { const c = window.__cart, r = c.run; return { state: c.state, x: r ? Math.round(r.x) : 0, tr: r ? +r.tr.toFixed(2) : 0, runs: c.S.runs, coins: r ? r.coins : 0, used: r ? r.used.size : 0, isSet: r ? r.used instanceof Set : null }; });
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500);
  // 1) plain reload: the copy kept on the device is picked up
  await fire(); await pg.waitForTimeout(3000); await pg.evaluate(() => window.__cart.liveStore()); const a = await info();
  await pg.reload(); await pg.waitForTimeout(700); const b1 = await info();
  console.log('reload   before', JSON.stringify(a), '\n         after ', JSON.stringify(b1), b1.state === 'fly' && b1.x >= a.x && b1.runs === a.runs && b1.isSet ? 'OK' : 'FAIL');
  // 2) an update delivered by the viewer: the snapshot it took comes back as hot data
  await pg.waitForTimeout(1500); const snap = await pg.evaluate(() => JSON.stringify(window.__snap())); const c0 = await info();
  await pg.evaluate(s => { sessionStorage.setItem('hot', s); localStorage.removeItem('cart.live'); }, snap); await pg.reload(); await pg.waitForTimeout(700); const c1 = await info();
  console.log('update   before', JSON.stringify(c0), '\n         after ', JSON.stringify(c1), c1.state === 'fly' && c1.x >= c0.x && c1.runs === c0.runs ? 'OK' : 'FAIL', 'pending notice', await pg.evaluate(() => window.__cart.updated));
  await pg.evaluate(() => document.querySelector('#endBtn').click()); await pg.waitForTimeout(400); const d = await info(); console.log('ended    ', JSON.stringify(d), d.state === 'result' && d.runs === c1.runs + 1 ? 'OK' : 'FAIL');
  // 3) a finished run is never picked up twice, and an old copy is ignored
  await pg.reload(); await pg.waitForTimeout(700); const e = await info(); console.log('after end', e.state, e.state === 'aim' ? 'OK' : 'FAIL');
  await pg.evaluate(() => localStorage.setItem('cart.live', JSON.stringify({ v: 1, at: Date.now() - 200000, slot: 1, runs: window.__cart.S.runs, state: 'fly', run: { x: 5, vx: 1, st: {} } }))); await pg.reload(); await pg.waitForTimeout(700); console.log('stale copy', (await info()).state === 'aim' ? 'OK' : 'FAIL');
  // 4) the shop is reopened on the same tab
  await pg.evaluate(() => { window.__cart.openShop(); document.querySelector('.tab[data-t="money"]').click(); window.__cart.liveStore(); }); await pg.reload(); await pg.waitForTimeout(700);
  console.log('shop     ', await pg.evaluate(() => window.__cart.state + ' ' + (document.querySelector('.tab.on') || {}).dataset.t), 'errors:', errs.length ? errs.slice(0, 5) : 'none'); await b.close(); })();
