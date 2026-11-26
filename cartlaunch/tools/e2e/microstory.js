// 작은 세상 이야기: all cart achievements → the last checkout → the cashier's question and the dive into the floor → the intro →
// a run that reaches the decimal point → the trip back up → the epilogue at the checkout → back in the lab.
// node cartlaunch/tools/e2e/microstory.js <output folder>
const { chromium } = require('playwright');
(async () => { const SP = process.argv[2], b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), pg = await b.newPage({ viewport: { width: 1000, height: 500 } }), errs = [];
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  const ok = (name, v) => console.log((v ? 'OK  ' : 'FAIL') + ' ' + name);
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const c = window.__cart, C = c.C, s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = u.max; for (const q of C.PERKS) s.perks[q.id] = q.max; for (const q of C.TPERKS) s.tperks[q.id] = q.max; s.rebirths = 30; s.trans = 12; s.runs = 4821; s.stars = s.starsTotal = 3e6; s.starsEver = 1e9; s.best = s.bestLife = C.ZONES[C.LAST + 72].at; s.zone = C.LAST + 72; s.ended = 1; for (const a of C.ACH) s.ach[a.id] = 1; c.S = s; c.toAim(); });
  await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly', null, { timeout: 8000 }); await pg.keyboard.up('Space'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { const c = window.__cart, r = c.run; r.x = c.C.ZONES[c.C.LAST + 73].at * 1.02; r.maxX = r.x; }); await pg.waitForTimeout(1200);
  await pg.evaluate(() => { const r = window.__cart.run; r.fin = r.tr - 56; }); await pg.waitForFunction(() => window.__cart.state === 'ending', null, { timeout: 9000 }); const t0 = Date.now();
  for (const [k, ms] of [['a', 3500], ['b', 11500], ['c', 16000], ['d', 19200], ['e', 20500], ['f', 22600], ['f2', 24300]]) { await pg.waitForTimeout(Math.max(0, ms - (Date.now() - t0))); await pg.screenshot({ path: `${SP}/s_${k}.png` }); }
  ok('계산원과 벽으로 가는 동안 나가기 버튼 없음', await pg.evaluate(() => document.querySelector('#endExit').hidden));
  await pg.waitForFunction(() => window.MICRO.on && window.MICRO.mode === 'intro', null, { timeout: 6000 }); ok('작아져 문으로 들어간 뒤 작은 세상 인트로', true); const t1 = Date.now();
  ok('카트 엔딩 횟수 기록 (2번째)', await pg.evaluate(() => window.__cart.S.ended === 2));
  for (const [k, ms] of [['g', 2000], ['h', 4800], ['h2', 9600], ['h3', 14900], ['i', 17800]]) { await pg.waitForTimeout(Math.max(0, ms - (Date.now() - t1))); await pg.screenshot({ path: `${SP}/s_${k}.png` }); }
  await pg.waitForTimeout(300); await pg.mouse.click(500, 250); await pg.waitForTimeout(500); ok('인트로 뒤 연구소', await pg.evaluate(() => window.MICRO.mode === 'lab' && window.MICRO.test.M().introSeen === 1));
  // a run that reaches the bottom of everything
  await pg.keyboard.down('Space'); await pg.waitForTimeout(940); await pg.keyboard.up('Space'); await pg.waitForFunction(() => window.MICRO.mode === 'run', null, { timeout: 4000 }); await pg.waitForTimeout(600);
  await pg.evaluate(() => window.MICRO.test.found()); await pg.waitForFunction(() => window.MICRO.mode === 'found', null, { timeout: 4000 }); const t2 = Date.now(); ok('소수점 발견 연출', true);
  for (const [k, ms] of [['j', 2700], ['k', 6000]]) { await pg.waitForTimeout(Math.max(0, ms - (Date.now() - t2))); await pg.screenshot({ path: `${SP}/s_${k}.png` }); }
  await pg.waitForFunction(() => window.__cart.state === 'ending' && !window.MICRO.on, null, { timeout: 8000 }); const t3 = Date.now(); ok('다시 커진 뒤 계산대 에필로그', true);
  for (const [k, ms] of [['l', 4300], ['m', 7400], ['n', 9600], ['o', 11800], ['p', 15000]]) { await pg.waitForTimeout(Math.max(0, ms - (Date.now() - t3))); await pg.screenshot({ path: `${SP}/s_${k}.png` }); }
  await pg.click('#endExit'); await pg.waitForTimeout(900); ok('나가기 → 작은 세상 연구소', await pg.evaluate(() => window.MICRO.on && window.MICRO.mode === 'lab'));
  ok('소수점 찾음 기록·업적', await pg.evaluate(() => window.MICRO.test.M().ended === 1 && !!window.MICRO.test.M().ach.m_found));
  await pg.screenshot({ path: `${SP}/s_q.png` });
  console.log('errors:', errs.length ? errs.slice(0, 6) : 'none'); await b.close(); })();
