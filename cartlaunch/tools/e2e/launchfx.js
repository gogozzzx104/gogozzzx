const { chromium } = require('playwright');
(async () => { const SP = process.argv[2], b = await chromium.launch(), errs = [], tiers = ['anti', 'singu', 'bang', 'cosmos'];
  for (let ti = 0; ti < 4; ti++) { const pg = await b.newPage({ viewport: { width: 760, height: 380 } }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
    await pg.evaluate(([ti, tiers]) => { const c = window.__cart, C = c.C, s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = u.max; s.lv.push = 120; tiers.forEach((id, k) => { if (k > ti) s.lv[id] = 0; }); for (const q of C.PERKS) s.perks[q.id] = q.max; s.tperks = { t_gauge: 20 }; s.rebirths = 20; s.best = s.bestLife = C.ZONES[C.LAST + 3].at; s.zone = C.LAST + 3; c.S = s; c.toAim(); }, [ti, tiers]);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly', null, { timeout: 8000 }); await pg.keyboard.up('Space'); const t0 = Date.now(); let worst = 0, last = t0;
    for (const [k, ms] of [[0, 250], [1, 900], [2, 1900]]) { await pg.waitForTimeout(Math.max(0, ms - (Date.now() - t0))); await pg.screenshot({ path: `${SP}/lfx_${ti}_${k}.png` }); }
    const gap = await pg.evaluate(() => new Promise(res => { let last = performance.now(), worst = 0, n = 0; const f = () => { const t = performance.now(); worst = Math.max(worst, t - last); last = t; if (++n < 60) requestAnimationFrame(f); else res(worst); }; requestAnimationFrame(f); }));
    console.log(tiers[ti], 'worst frame gap', Math.round(gap), 'ms'); await pg.close(); }
  console.log('errors', errs.length ? errs.slice(0, 3) : 'none'); await b.close(); })();
