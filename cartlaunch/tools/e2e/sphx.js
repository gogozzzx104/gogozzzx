// Super phoenix conversion: after the super phoenix rises, the small fire button (Q) turns every normal skill held into phoenix skills,
// 3 springs / 2 dashes / 2 dives make one and a short last group still makes one.   node cartlaunch/tools/e2e/sphx.js <out dir>
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const OUT = process.argv[2], b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), errs = [], saves = JSON.parse(fs.readFileSync(__dirname + '/saves.json')); fs.mkdirSync(OUT, { recursive: true }); let ok = 0, bad = 0;
  const check = (name, cond, info) => { if (cond) ok++; else bad++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (info ? '  ' + JSON.stringify(info) : '')); };
  for (const mode of ['key', 'tap']) {
    const pg = await b.newPage({ viewport: { width: 1000, height: 500 }, hasTouch: mode === 'tap' }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
    const sv = Object.assign({}, saves.z10, { perks: { r_phoenix: 1 }, rebirths: 2, tperks: Object.assign({}, saves.z10.tperks || {}, { t_sphx: 3 }) }); await pg.addInitScript(s => localStorage.setItem('cart.save', s), JSON.stringify(sv)); await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93 || window.__cart.state !== 'charge'); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly'); await pg.waitForTimeout(800);
    // before the rise: nothing to convert yet, and Q does nothing
    await pg.evaluate(() => { const r = window.__cart.run; r.spring = 11; r.dash = 9; r.dive = 2; }); await pg.keyboard.press('KeyQ'); await pg.waitForTimeout(150);
    const pre = await pg.evaluate(() => { const r = window.__cart.run; return { hidden: document.querySelector('#convBtn').hidden, spring: r.spring, dash: r.dash, dive: r.dive, pspring: r.pspring }; });
    check(mode + ': 부활 전에는 전환 버튼 없음, Q 무시', pre.hidden && pre.spring === 11 && pre.dash === 9 && pre.dive === 2 && pre.pspring === 0, pre);
    await pg.evaluate(() => { const c = window.__cart, r = c.run; r.vx = 0; r.vy = 0; r.y = c.C.ground(r.x, r.U); r.air = false; });
    await pg.waitForFunction(() => window.__cart.run.risen, null, { timeout: 5000 }); await pg.waitForTimeout(300);
    const mid = await pg.evaluate(() => { const r = window.__cart.run, bt = document.querySelector('#convBtn'); return { hidden: bt.hidden, label: bt.textContent, spring: r.spring, dash: r.dash, dive: r.dive, pspring: r.pspring, pdash: r.pdash, pdive: r.pdive }; });
    check(mode + ': 부활 뒤 남은 스킬은 그대로, 불사조 스킬 5회씩, 버튼 "+10"', !mid.hidden && mid.spring === 11 && mid.dash === 9 && mid.dive === 2 && mid.pspring === 5 && mid.pdash === 5 && mid.pdive === 5 && /\+10/.test(mid.label), mid);
    await pg.screenshot({ path: `${OUT}/sphx_${mode}_before.png` });
    if (mode === 'key') await pg.keyboard.press('KeyQ'); else { const bb = await pg.locator('#convBtn').boundingBox(); await pg.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    await pg.waitForTimeout(120); await pg.screenshot({ path: `${OUT}/sphx_${mode}_after.png` });
    const post = await pg.evaluate(() => { const r = window.__cart.run; return { hidden: document.querySelector('#convBtn').hidden, spring: r.spring, dash: r.dash, dive: r.dive, pspring: r.pspring, pdash: r.pdash, pdive: r.pdive, toast: document.querySelector('#toast').textContent, dashBtn: document.querySelector('#dashBtn small').textContent }; });
    // 11 springs -> 4, 9 dashes -> 5, 2 dives -> 1 (added to the 5 each from the rise; a few may already be spent by the time we look, so check what the cart lost)
    check(mode + ': 전환 뒤 도약 11→4, 대시 9→5, 급강하 2→1, 일반 0개, 버튼 숨김', post.hidden && post.spring === 0 && post.dash === 0 && post.dive === 0 && post.pspring === 9 && post.pdash === 10 && post.pdive === 6, post);
    check(mode + ': 전환 안내 문구', /도약 11→🔥4/.test(post.toast) && /대시 9→🔥5/.test(post.toast) && /급강하 2→🔥1/.test(post.toast), { toast: post.toast });
    // a pit-stop refill after converting brings the button back for that one skill
    await pg.evaluate(() => { window.__cart.run.dash = 1; }); await pg.waitForTimeout(150); const re = await pg.evaluate(() => { const bt = document.querySelector('#convBtn'); return { hidden: bt.hidden, label: bt.textContent }; });
    check(mode + ': 다시 생긴 일반 대시 1개에 버튼 다시 나타남 "+1"', !re.hidden && /\+1$/.test(re.label), re);
    await pg.close(); }
  // pure rule check, no page
  const C = require('../../core.js'); const r = { spring: 11, dash: 9, dive: 3, pspring: 0, pdash: 0, pdive: 0, risen: true, st: { sphx: 1 }, ev: [] }; C.conv(r);
  check('규칙: 도약 11→4, 대시 9→5, 급강하 3→2', r.pspring === 4 && r.pdash === 5 && r.pdive === 2 && r.spring + r.dash + r.dive === 0, { p: [r.pspring, r.pdash, r.pdive] });
  check('규칙: 일반 불사조만 있으면 전환 불가', !C.canConv({ spring: 3, dash: 0, dive: 0, risen: true, st: { sphx: 0 } }));
  check('페이지 오류 없음', !errs.length, errs);
  console.log(`\n${ok} OK, ${bad} FAIL`); await b.close(); process.exit(bad ? 1 : 0); })();
