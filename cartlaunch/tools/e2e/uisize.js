// UI 크기 (5 steps) scales the shop, flight HUD and result card together; touch screens get finger-sized top buttons.
// node cartlaunch/tools/e2e/uisize.js <folder>
const { chromium } = require('playwright');
(async () => { const SP = process.argv[2], b = await chromium.launch(), errs = [], ok = (n, v) => console.log((v ? 'OK  ' : 'FAIL') + ' ' + n);
  const pg = await b.newPage({ viewport: { width: 1000, height: 500 } }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500);
  const v = () => pg.evaluate(() => ['--k', '--hk', '--ck'].map(n => +getComputedStyle(document.getElementById('root')).getPropertyValue(n)));
  await pg.click('#optBtn'); await pg.waitForTimeout(200); const base = await v();
  ok('설정에 UI 크기 5단계', (await pg.$$eval('[data-opt="gui"]', bs => bs.map(x => x.textContent))).join(',') === '매우 작음,작음,보통,큼,매우 큼');
  for (const [lb, f] of [['매우 작음', 0.75], ['작음', 0.88], ['큼', 1.15], ['매우 큼', 1.32]]) { await pg.click(`[data-opt="gui"]:text-is("${lb}")`); await pg.waitForTimeout(150); const x = await v(); ok(`${lb}: 세 곳 모두 ×${f}`, x.every((q, i) => Math.abs(q / base[i] - f) < 0.01)); if (lb === '매우 큼') await pg.screenshot({ path: SP + '/ui_big.png' }); }
  await pg.reload(); await pg.waitForTimeout(500); ok('새로고침 뒤에도 유지', Math.abs((await v())[0] / base[0] - 1.32) < 0.01);
  await pg.evaluate(() => { localStorage.setItem('cart.opt', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('cart.opt') || '{}'), { gui: 1 }))); });
  const ph = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage(); await ph.route(/fonts\./, r => r.abort()); await ph.goto('http://localhost:8766/cartlaunch/index.html'); await ph.waitForTimeout(600);
  const hgt = await ph.evaluate(() => { const r = document.getElementById('optBtn').getBoundingClientRect(); return Math.min(r.width, r.height); }); ok(`폰 위쪽 버튼 크기 (짧은 변 ${hgt.toFixed(0)}px)`, hgt >= 36);
  console.log('errors:', errs.length ? errs.slice(0, 3) : 'none'); await b.close(); })();
