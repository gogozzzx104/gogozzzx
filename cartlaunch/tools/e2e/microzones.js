// 작은 세상: one screenshot per zone (the capsule parked in each zone), for checking the art.  node microzones.js <folder> [zones]
const { chromium } = require('playwright');
(async () => { const SP = process.argv[2], list = (process.argv[3] || Array.from({ length: 24 }, (_, i) => i).join(',')).split(',').map(Number), b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1000, height: 500 } }), errs = [];
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const c = window.__cart; c.S.micro = window.MICRO.C.newSave(); c.S.micro.zoneEver = 23; c.S.micro.seenZone = 0; window.MICRO.enter({}); });
  await pg.waitForTimeout(300); await pg.keyboard.down('Space'); await pg.waitForTimeout(940); await pg.keyboard.up('Space'); await pg.waitForFunction(() => window.MICRO.mode === 'run', null, { timeout: 4000 });
  for (const z of list) { await pg.evaluate(z => window.MICRO.test.setRun(r => { const C = window.MICRO.C; r.X = C.LEN * z + 300; r.E = 99; r.hp = 99; r.inv = 99; r.st.V0 = 60 * Math.pow(r.st.base, z); r.m = 1; }), z); await pg.waitForTimeout(900); await pg.screenshot({ path: `${SP}/z${String(z).padStart(2, '0')}.png` }); }
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none'); await b.close(); })();
