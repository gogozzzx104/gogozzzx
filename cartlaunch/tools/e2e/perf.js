// Time spent drawing one frame while flying, per graphics mode (script time only; a headless browser rasterises on the CPU, so compare
// the figures with each other rather than reading them as real devices).
//   node cartlaunch/tools/e2e/perf.js cartlaunch/tools/e2e [path=cartlaunch/index.html]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const SP = process.argv[2], path = process.argv[3] || 'cartlaunch/index.html', b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), saves = JSON.parse(fs.readFileSync(SP + '/saves.json'));
  for (const gfx of ['low', 'mid', 'high']) { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true }), pg = await ctx.newPage(); await pg.route(/fonts\./, r => r.abort());
    await pg.addInitScript(([s, q]) => { localStorage.setItem('cart.save', s); localStorage.setItem('cart.opt', JSON.stringify({ gfx: q })); const raf = window.requestAnimationFrame.bind(window); window.__work = []; window.requestAnimationFrame = cb => raf(t => { const a = performance.now(); cb(t); window.__work.push(performance.now() - a); }); }, [JSON.stringify(saves.z10), gfx]);
    await pg.goto('http://localhost:8766/' + path); await pg.waitForTimeout(500);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93 || window.__cart.state !== 'charge'); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly');
    await pg.evaluate(() => { window.__work.length = 0; }); await pg.waitForTimeout(6000);
    const r = await pg.evaluate(() => { const w = window.__work.slice().sort((x, y) => x - y), cv = document.querySelector('#cv'); return { frames: w.length, avg: +(w.reduce((x, y) => x + y, 0) / w.length).toFixed(2), p95: +w[Math.floor(w.length * 0.95)].toFixed(2), canvas: cv.width + 'x' + cv.height }; });
    console.log(path.includes('_old') ? 'before' : gfx.padEnd(5), JSON.stringify(r)); await ctx.close(); if (path.includes('_old')) break; }
  await b.close(); })();
