const { chromium } = require('playwright');
(async () => { const SP = process.argv[2], b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), pg = await b.newPage({ viewport: { width: 1000, height: 500 } }), errs = [];
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const c = window.__cart, C = c.C, s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = u.max; for (const q of C.PERKS) s.perks[q.id] = q.max; for (const q of C.TPERKS) s.tperks[q.id] = q.max; s.rebirths = 30; s.trans = 12; s.runs = 4821; s.stars = s.starsTotal = 3e6; s.starsEver = 1e9; s.best = s.bestLife = C.ZONES[C.LAST + 72].at; s.zone = C.LAST + 72; c.S = s; c.toAim(); });
  await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly', null, { timeout: 8000 }); await pg.keyboard.up('Space'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { const c = window.__cart, r = c.run; r.x = c.C.ZONES[c.C.LAST + 73].at * 1.02; r.maxX = r.x; }); await pg.waitForTimeout(1200);
  console.log('fin started', await pg.evaluate(() => window.__cart.run.fin != null), 'zone', await pg.evaluate(() => window.__cart.C.ZONES[window.__cart.C.zoneAt(window.__cart.run.x)].name));
  await pg.screenshot({ path: SP + '/fin_0.png' });
  await pg.evaluate(() => { const r = window.__cart.run; r.fin = r.tr - 30; }); await pg.waitForTimeout(600); await pg.screenshot({ path: SP + '/fin_1.png' });
  await pg.evaluate(() => { const r = window.__cart.run; r.fin = r.tr - 56; }); await pg.waitForTimeout(600); await pg.screenshot({ path: SP + '/fin_2.png' });
  await pg.waitForFunction(() => window.__cart.state === 'ending', null, { timeout: 8000 }); const t0 = Date.now();
  for (const [k, ms] of [[3, 700], [4, 5500], [5, 8200], [6, 11500], [8, 15500]]) { await pg.waitForTimeout(Math.max(0, ms - (Date.now() - t0))); await pg.screenshot({ path: `${SP}/fin_${k}.png` }); }
  // a tap and keys no longer leave the ending; only the '나가기' button does
  await pg.mouse.click(500, 250); await pg.keyboard.press('Space'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(600);
  console.log('tap/keys keep the ending:', await pg.evaluate(() => window.__cart.state) === 'ending', '| exit button shown:', await pg.evaluate(() => !document.querySelector('#endExit').hidden));
  await pg.click('#endExit'); await pg.waitForTimeout(600);
  console.log('after exit button: state', await pg.evaluate(() => window.__cart.state), 'ended', await pg.evaluate(() => window.__cart.S.ended), 'ach fin', await pg.evaluate(() => !!window.__cart.S.ach.a_fin), 'errors', errs.length ? errs.slice(0, 3) : 'none');
  await pg.screenshot({ path: SP + '/fin_7.png' }); await b.close(); })();
