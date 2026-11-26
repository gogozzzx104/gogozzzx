// 작은 세상: arrow from the lot → lab → shrink launch → a run with keys → result → lab shop (buy) → back to the lot.
// node cartlaunch/tools/e2e/micro.js <output folder> [w h]
const { chromium } = require('playwright');
(async () => { const SP = process.argv[2], W = +(process.argv[3] || 1000), H = +(process.argv[4] || 500), b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), errs = [];
  const pg = await b.newPage({ viewport: { width: W, height: H } }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500);
  const ok = (name, v) => console.log((v ? 'OK  ' : 'FAIL') + ' ' + name);
  await pg.evaluate(() => { const c = window.__cart; c.S.micro = window.MICRO.C.newSave(); c.S.micro.light = 500; c.save(); });
  await pg.waitForTimeout(200); ok('발사대 오른쪽 화살표 보임', await pg.evaluate(() => !document.querySelector('#toMicro').hidden));
  await pg.click('#toMicro'); await pg.waitForTimeout(700); ok('작은 세상 연구소로 이동', await pg.evaluate(() => window.MICRO.on && window.MICRO.mode === 'lab'));
  await pg.screenshot({ path: SP + '/m_lab.png' });
  await pg.keyboard.down('Space'); await pg.waitForTimeout(500); await pg.screenshot({ path: SP + '/m_charge.png' }); await pg.waitForTimeout(430); await pg.keyboard.up('Space');
  await pg.waitForFunction(() => window.MICRO.mode === 'run', null, { timeout: 4000 }); ok('축소 발사 → 판 시작', true);
  for (let i = 0; i < 6; i++) { await pg.keyboard.down(i % 2 ? 'KeyW' : 'KeyS'); await pg.waitForTimeout(300); await pg.keyboard.up(i % 2 ? 'KeyW' : 'KeyS'); if (i === 2) { await pg.keyboard.press('KeyE'); await pg.screenshot({ path: SP + '/m_run.png' }); } }
  ok('키로 위아래 움직임', await pg.evaluate(() => Math.abs(window.MICRO.run.y) > 0.1 || window.MICRO.run.over));
  await pg.evaluate(() => { const r = window.MICRO.run; if (r && !r.over) r.E = 0.3; }); await pg.waitForFunction(() => window.MICRO.mode === 'result', null, { timeout: 6000 }); await pg.waitForTimeout(500);
  await pg.screenshot({ path: SP + '/m_result.png' }); ok('결과 카드', await pg.evaluate(() => !document.querySelector('#mResult').hidden));
  await pg.click('#mRShop'); await pg.waitForTimeout(300); const l0 = await pg.evaluate(() => window.MICRO.test.M().light);
  await pg.click('#mAll'); await pg.waitForTimeout(200); const l1 = await pg.evaluate(() => window.MICRO.test.M().light); ok('모두 구매로 빛 사용 ' + l0.toFixed(0) + ' → ' + l1.toFixed(0), l1 < l0);
  await pg.screenshot({ path: SP + '/m_shop.png' });
  for (const t of ['book', 'rec']) { await pg.click(`#mTabs button[data-t="${t}"]`); await pg.waitForTimeout(150); await pg.screenshot({ path: `${SP}/m_${t}.png` }); }
  // reconstruction: opens at the DNA zone, asks twice, gives crystals, resets the upgrades
  await pg.evaluate(() => { const m = window.MICRO.test.M(); m.zoneEver = 12; m.bestCyc = 12.4; m.lv.u_power = 20; }); await pg.click('#mTabs button[data-t="gear"]'); await pg.waitForTimeout(100);
  ok('재구성 탭 열림', await pg.evaluate(() => !!document.querySelector('#mTabs button[data-t="recon"]'))); await pg.click('#mTabs button[data-t="recon"]'); await pg.waitForTimeout(150);
  await pg.click('#mList button[data-recon]'); await pg.waitForTimeout(100); await pg.click('#mList button[data-recon]'); await pg.waitForTimeout(200);
  ok('재구성 → 결정 얻고 업그레이드 초기화', await pg.evaluate(() => { const m = window.MICRO.test.M(); return m.crys > 0 && m.recons === 1 && !m.lv.u_power; })); await pg.screenshot({ path: SP + '/m_recon.png' });
  await pg.click('#mList button[data-perk="k_reso"]'); await pg.waitForTimeout(100); ok('결정으로 능력 구매', await pg.evaluate(() => window.MICRO.test.M().perks.k_reso === 1));
  await pg.click('#mClose'); await pg.waitForTimeout(300); await pg.click('#mBack'); await pg.waitForTimeout(800);
  ok('왼쪽 화살표로 카트 발사대 복귀', await pg.evaluate(() => !window.MICRO.on && window.__cart.state === 'aim'));
  // reload while in the cart: stays in the cart; the save keeps the small world
  await pg.reload(); await pg.waitForTimeout(700); ok('새로고침 뒤 작은 세상 기록 유지', await pg.evaluate(() => !!(window.__cart.S.micro && window.__cart.S.micro.runs >= 1)));
  console.log('errors:', errs.length ? errs.slice(0, 6) : 'none'); await b.close(); })();
