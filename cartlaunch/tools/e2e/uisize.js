// Size settings: the three steppers change the shop, flight HUD and result card scales; touch screens get bigger top buttons.
// node cartlaunch/tools/e2e/uisize.js <folder>
const { chromium } = require('playwright');
(async () => { const SP = process.argv[2], b = await chromium.launch(), errs = [], ok = (n, v) => console.log((v ? 'OK  ' : 'FAIL') + ' ' + n);
  const pg = await b.newPage({ viewport: { width: 1000, height: 500 } }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500);
  const v = n => pg.evaluate(n => +getComputedStyle(document.getElementById('root')).getPropertyValue(n), n);
  await pg.click('#optBtn'); await pg.waitForTimeout(200); const k0 = await v('--k'), h0 = await v('--hk'), c0 = await v('--ck');
  await pg.click('[data-ostep="ui"][data-d="0.1"]'); await pg.click('[data-ostep="ui"][data-d="0.1"]'); await pg.waitForTimeout(150);
  await pg.click('[data-ostep="hud"][data-d="0.05"]'); await pg.click('[data-ostep="card"][data-d="-0.1"]'); await pg.waitForTimeout(200);
  const k1 = await v('--k'), h1 = await v('--hk'), c1 = await v('--ck');
  ok(`업그레이드 화면 ${k0} → ${k1} (+20%)`, Math.abs(k1 / k0 - 1.2) < 0.01); ok(`비행 화면 ${h0} → ${h1} (+5%)`, Math.abs(h1 / h0 - 1.05) < 0.01); ok(`결과 카드 ${c0} → ${c1} (−10%)`, Math.abs(c1 / c0 - 0.9) < 0.01);
  await pg.screenshot({ path: SP + '/ui_big.png' });
  await pg.reload(); await pg.waitForTimeout(500); ok('새로고침 뒤에도 유지', Math.abs((await v('--k')) / k0 - 1.2) < 0.01);
  if (await pg.evaluate(() => document.querySelector('#shop').hidden)) await pg.click('#optBtn'); else await pg.click('#sTabs [data-t="opt"]'); await pg.waitForTimeout(200); await pg.click('[data-ostep="ui"][data-d="0"]'); await pg.waitForTimeout(150); ok('가운데 버튼으로 100% 복귀', Math.abs((await v('--k')) - k0) < 0.01);
  for (let i = 0; i < 20; i++) await pg.click('[data-ostep="ui"][data-d="-0.1"]'); ok('최소 60%에서 멈춤', Math.abs((await v('--k')) / k0 - 0.6) < 0.01); await pg.screenshot({ path: SP + '/ui_small.png' });
  await pg.click('[data-ostep="ui"][data-d="0"]');
  const ph = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage(); await ph.route(/fonts\./, r => r.abort()); await ph.goto('http://localhost:8766/cartlaunch/index.html'); await ph.waitForTimeout(600);
  const hgt = await ph.evaluate(() => document.getElementById('optBtn').getBoundingClientRect().height); ok(`폰에서 위쪽 버튼이 손가락 크기 (설정 버튼 높이 ${hgt.toFixed(0)}px)`, hgt >= 36); await ph.screenshot({ path: SP + '/ui_phone.png' });
  console.log('errors:', errs.length ? errs.slice(0, 3) : 'none'); await b.close(); })();
