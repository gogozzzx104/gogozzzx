const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1600, height: 800 } }), errs = [];
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const c = window.__cart, C = c.C, s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = u.max; s.lv.push = 250; for (const q of C.PERKS) s.perks[q.id] = q.max; for (const q of C.TPERKS) s.tperks[q.id] = q.max; s.rebirths = 30; s.starsTotal = s.starsEver = 1e9; s.best = s.bestLife = C.ZONES[C.LAST + 62].at; s.zone = C.LAST + 62; c.S = s; c.toAim(); });
  await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space');
  await pg.waitForFunction(() => window.__cart.state === 'fly', null, { timeout: 8000 });
  const gap = await pg.evaluate(() => new Promise(res => { let last = performance.now(), worst = 0, n = 0; const f = () => { const t = performance.now(); worst = Math.max(worst, t - last); last = t; if (++n < 420) requestAnimationFrame(f); else res(worst); }; requestAnimationFrame(f); }));
  console.log(await pg.evaluate(() => { const c = window.__cart, r = c.run; return `x=${r.x.toExponential(2)} zone ${c.C.zoneAt(r.x) - c.C.LAST} state ${c.state}`; }), 'worst frame gap', Math.round(gap), 'ms | errors', errs.length ? errs : 'none'); await pg.screenshot({ path: process.argv[2] + '/deep.png' }); await b.close(); })();
