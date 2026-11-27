// Full screen only by the button: taps, launches and the shop never turn it on; after '전체 화면' taps keep it on (also after a reload);
// after '창으로' it stays a window.  node cartlaunch/tools/e2e/fullscreen.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1000, height: 500 }, screen: { width: 1000, height: 500 } }), pg = await ctx.newPage(), errs = [];
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  const fs = () => pg.evaluate(() => !!document.fullscreenElement), ok = (n, v) => console.log((v ? 'OK  ' : 'FAIL') + ' ' + n);
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500);
  await pg.mouse.click(500, 300); await pg.waitForTimeout(300); await pg.keyboard.down('Space'); await pg.waitForTimeout(600); await pg.keyboard.up('Space'); await pg.waitForTimeout(300);
  ok('처음에는 탭·발사로 전체 화면이 되지 않음', !(await fs()));
  await pg.evaluate(() => window.__cart.openShop()); await pg.waitForTimeout(200); await pg.mouse.click(500, 300); await pg.waitForTimeout(300); ok('업그레이드 화면 탭으로도 안 됨', !(await fs()));
  await pg.evaluate(() => window.__cart.toAim()); await pg.waitForTimeout(200);
  await pg.click('#fsBtn'); await pg.waitForTimeout(700); ok('전체 화면 버튼 → 전체 화면', await fs());
  await pg.evaluate(() => document.exitFullscreen()); await pg.waitForTimeout(400); await pg.mouse.click(500, 300); await pg.waitForTimeout(500); ok('브라우저가 풀어도 다음 탭에서 다시 전체 화면', await fs());
  await pg.reload(); await pg.waitForTimeout(600); await pg.mouse.click(500, 300); await pg.waitForTimeout(500); ok('새로고침 뒤에도 선택 유지(탭하면 전체 화면)', await fs());
  await pg.waitForTimeout(300); const lbl = await pg.textContent('#fsBtn'); await pg.click('#fsBtn'); await pg.waitForTimeout(600); ok(`'${lbl}' 버튼 → 창`, !(await fs()));
  await pg.mouse.click(500, 300); await pg.waitForTimeout(300); await pg.keyboard.down('Space'); await pg.waitForTimeout(600); await pg.keyboard.up('Space'); await pg.waitForTimeout(500); ok('창으로 뒤에는 탭·발사해도 창 유지', !(await fs()));
  console.log('errors:', errs.length ? errs.slice(0, 3) : 'none'); await b.close(); })();
