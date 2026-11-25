// Super phoenix, two ways: transform at any moment of the flight with the small fire button (Q) — the cart then does not rise again when it stops —
// or, if not used, it takes the place of the phoenix rise when the cart stops.  Either way every normal skill held becomes phoenix skills
// (3 springs / 2 dashes / 2 dives make one, a short last group still makes one).   node cartlaunch/tools/e2e/sphx.js <out dir>
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const OUT = process.argv[2], b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), errs = [], saves = JSON.parse(fs.readFileSync(__dirname + '/saves.json')); fs.mkdirSync(OUT, { recursive: true }); let ok = 0, bad = 0;
  const check = (name, cond, info) => { if (cond) ok++; else bad++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (info ? '  ' + JSON.stringify(info) : '')); };
  const look = pg => pg.evaluate(() => { const c = window.__cart, r = c.run, bt = document.querySelector('#sphxBtn'); return { state: c.state, hidden: bt.hidden, label: bt.textContent, risen: r && r.risen, sprint: r && +r.sphxT.toFixed(2), spring: r && r.spring, dash: r && r.dash, dive: r && r.dive, pspring: r && r.pspring, pdash: r && r.pdash, pdive: r && r.pdive, toast: document.querySelector('#toast').textContent }; });
  const stop = pg => pg.evaluate(() => { const c = window.__cart, r = c.run; r.vx = 0; r.vy = 0; r.y = c.C.ground(r.x, r.U); r.air = false; });
  for (const mode of ['key', 'tap', 'stop']) {
    const pg = await b.newPage({ viewport: { width: 1000, height: 500 }, hasTouch: mode === 'tap' }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
    const sv = Object.assign({}, saves.z10, { perks: { r_phoenix: 1 }, rebirths: 2, tperks: Object.assign({}, saves.z10.tperks || {}, { t_sphx: 3 }) }); await pg.addInitScript(s => localStorage.setItem('cart.save', s), JSON.stringify(sv)); await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93 || window.__cart.state !== 'charge'); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly'); await pg.waitForTimeout(800);
    await pg.evaluate(() => { const r = window.__cart.run; r.spring = 11; r.dash = 9; r.dive = 2; }); await pg.waitForTimeout(100);
    const pre = await look(pg);
    check(mode + ': 비행 중 처음부터 변신 버튼(숫자 없음)', !pre.hidden && pre.label === '🔥변신' && !pre.risen, pre);
    if (mode !== 'stop') {
      if (mode === 'key') await pg.keyboard.press('KeyQ'); else { const bb = await pg.locator('#sphxBtn').boundingBox(); await pg.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
      await pg.waitForTimeout(120); await pg.screenshot({ path: `${OUT}/sphx_${mode}_on.png` }); const on = await look(pg);
      check(mode + ': 변신 → 질주, 도약 11→4+5, 대시 9→5+5, 급강하 2→1+5, 버튼 숨김', on.hidden && on.sprint > 0 && on.risen && on.spring === 0 && on.dash === 0 && on.dive === 0 && on.pspring === 9 && on.pdash === 10 && on.pdive === 6 && /슈퍼 불사조 변신/.test(on.toast), on);
      await pg.keyboard.press('KeyQ'); await pg.waitForTimeout(100); const again = await look(pg); check(mode + ': 두 번째 Q는 무시', again.pspring === 9 && again.pdash === 10, again);
      // stopping after a transformation: no phoenix rise, the run ends
      await pg.waitForTimeout(4500); await stop(pg); await pg.waitForFunction(() => window.__cart.state === 'result', null, { timeout: 6000 }).catch(() => {}); const end = await look(pg);
      check(mode + ': 변신한 판은 멈추면 부활 없이 끝', end.state === 'result', { state: end.state });
    } else {
      await stop(pg); await pg.waitForFunction(() => window.__cart.run.risen, null, { timeout: 5000 }); await pg.waitForTimeout(150); const up = await look(pg);
      check('stop: 변신 안 하고 멈추면 슈퍼 불사조로 부활 + 남은 스킬 자동 전환', up.state === 'fly' && up.sprint > 0 && up.hidden && up.spring === 0 && up.dash === 0 && up.dive === 0 && up.pspring === 9 && up.pdash === 10 && up.pdive === 6, up);
      await pg.screenshot({ path: `${OUT}/sphx_stop.png` }); }
    await pg.close(); }
  // without the super phoenix: no button, the plain phoenix as before
  { const pg = await b.newPage({ viewport: { width: 1000, height: 500 } }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(s => localStorage.setItem('cart.save', s), JSON.stringify(Object.assign({}, saves.z10, { perks: { r_phoenix: 1 }, rebirths: 2 }))); await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93 || window.__cart.state !== 'charge'); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly'); await pg.waitForTimeout(600);
    const a = await look(pg); await pg.keyboard.press('KeyQ'); await pg.waitForTimeout(100); const q = await look(pg);
    check('슈퍼 불사조 없으면 버튼 없음, Q 무시', a.hidden && !q.risen && q.pspring === 0, q); await pg.close(); }
  const C = require('../../core.js'); const o = C.convOf({ spring: 11, dash: 9, dive: 3 });
  check('규칙: 도약 11→4, 대시 9→5, 급강하 3→2', o.spring === 4 && o.dash === 5 && o.dive === 2, o);
  check('설명 문구', /^즉시 슈퍼 불사조로 언제든 변신 가능/.test(C.TP.t_sphx.desc), C.TP.t_sphx.desc);
  // the phoenix dive's wind-up holds the cart in the air but must not eat its forward speed
  { const sv = Object.assign(C.newSave(), JSON.parse(JSON.stringify(saves.z10)), { tperks: { t_sphx: 3 } }), st = C.stats(sv), out = {};
    for (const kind of ['normal', 'phoenix']) { const r = C.newRun(st, 1, 1, 7); for (let i = 0; i < 150; i++) C.step(r, 1 / 60, {}); r.dive = 3; r.pdive = kind === 'phoenix' ? 3 : 0; const v0 = r.vx; let lo = v0; C.step(r, 1 / 60, { dive: true });
      for (let t = 0; t < 6 && (r.slam || r.pdc > 0 || t < 0.05); t += 1 / 60) { C.step(r, 1 / 60, {}); lo = Math.min(lo, r.vx); } out[kind] = { start: +(v0 / r.v0).toFixed(3), low: +(lo / r.v0).toFixed(3), land: +(r.vx / r.v0).toFixed(3) }; }
    check('불사조 급강하: 기 모으는 동안 앞속도 유지, 착지 속도 ≥ 일반 급강하', out.phoenix.low >= 0.9 * out.phoenix.start && out.phoenix.land >= out.normal.land, out); }
  check('페이지 오류 없음', !errs.length, errs);
  console.log(`\n${ok} OK, ${bad} FAIL`); await b.close(); process.exit(bad ? 1 : 0); })();
