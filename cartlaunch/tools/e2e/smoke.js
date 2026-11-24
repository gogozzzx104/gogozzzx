const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const SP = process.argv[2], b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), saves = JSON.parse(fs.readFileSync(SP + '/saves.json')), errs = [];
  for (const [name, vp] of [['land', { width: 844, height: 390 }], ['port', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true }), pg = await ctx.newPage();
    await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(name + ' PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(name + ' ' + m.text()); });
    await pg.addInitScript(s => { if (!sessionStorage.getItem('i')) { localStorage.setItem('cart.save', s); sessionStorage.setItem('i', '1'); } }, JSON.stringify(saves.z10));
    await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space');
    await pg.waitForFunction(() => window.__cart.state === 'fly'); await pg.waitForTimeout(2200); await pg.keyboard.press('KeyS');
    await pg.waitForFunction(() => window.__cart.run.slams > 0 || window.__cart.state !== 'fly', null, { timeout: 20000 }); await pg.waitForTimeout(250); await pg.screenshot({ path: `${SP}/slam_${name}.png` });
    const r = await pg.evaluate(() => { const r = window.__cart.run; return { slams: r.slams, combo: r.combo, maxCombo: r.maxCombo }; });
    await pg.waitForFunction(() => window.__cart.state === 'result', null, { timeout: 110000 });
    console.log(name, JSON.stringify(r), await pg.evaluate(() => document.querySelector('#rRows').innerText.replace(/\n/g, ' ').slice(0, 260)));
    if (name === 'port') { await pg.evaluate(() => window.__cart.openShop()); await pg.waitForTimeout(300); await pg.screenshot({ path: `${SP}/shop_port.png` }); }
    await ctx.close(); }
  console.log('errors:', errs.length ? errs.slice(0, 6) : 'none'); await b.close(); })();
