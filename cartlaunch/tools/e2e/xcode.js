// Save code: copy on one browser, paste on another (a fresh context), with what phones and chat apps do to long text;
// a code cut short must say so; old CART1 codes still load.  node cartlaunch/tools/e2e/xcode.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), errs = [];
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 1000, height: 500 } }), pg = await ctx.newPage(); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message)); await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500); return { ctx, pg }; };
  const A = await open();
  // an end-game save: every upgrade, perk, ability and achievement, the small world too
  const json = await A.pg.evaluate(() => { const c = window.__cart, C = c.C, s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = u.max; for (const q of C.PERKS) s.perks[q.id] = q.max; for (const q of C.TPERKS) s.tperks[q.id] = q.max; for (const a of C.ACH) s.ach[a.id] = 1; s.runs = 515; s.rebirths = 135; s.gold = 1.16e21; s.micro = window.MICRO.C.newSave(); s.micro.light = 999; s.micro.runs = 5; c.S = s; c.save(); return JSON.stringify(s); });
  await A.pg.evaluate(() => window.__cart.openShop()); await A.pg.click('#sTabs [data-t="info"]'); await A.pg.waitForTimeout(200);
  await A.pg.click('[data-xcode="copy"]'); await A.pg.waitForTimeout(600); const code = await A.pg.inputValue('textarea.xbox');
  const v1 = 'CART1.' + Buffer.from(json).toString('base64');
  console.log('압축 코드', code.length + '자 (예전 방식이면 ' + v1.length + '자)', code.slice(0, 8), '…', code.slice(-3));
  const variants = [['그대로', code, 1], ['줄바꿈 끼움', code.replace(/(.{60})/g, '$1\n'), 1], ['보이지 않는 공백', code.replace(/(.{40})/g, '$1​'), 1], ['앞뒤에 다른 글', '여기 저장 코드: ' + code + ' (폰에서 복사)', 1],
    ['NBSP·소프트하이픈', code.replace(/(.{50})/g, '$1 ­'), 1], ['예전 CART1 코드', v1, 1], ['끝이 잘림', code.slice(0, Math.floor(code.length * 0.7)), 0], ['가운데가 빠짐', code.slice(0, 300) + code.slice(340), 0]];
  for (const [name, text, good] of variants) { const B = await open();
    await B.pg.evaluate(() => window.__cart.openShop()); await B.pg.click('#sTabs [data-t="info"]'); await B.pg.waitForTimeout(150); await B.pg.click('[data-xcode="paste"]'); await B.pg.waitForTimeout(150);
    await B.pg.fill('#xIn', text); await B.pg.click('[data-xcode="load"]'); await B.pg.waitForTimeout(400); if (good) { await B.pg.click('[data-xcode="load"]'); await B.pg.waitForTimeout(400); }
    const r = await B.pg.evaluate(() => ({ runs: window.__cart.S.runs, micro: window.__cart.S.micro && window.__cart.S.micro.runs, msg: (document.querySelector('.xmsg') || {}).textContent || '' }));
    const ok = good ? r.runs === 515 && r.micro === 5 : r.runs !== 515 && /잘렸/.test(r.msg); console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name, good ? '' : '→ ' + r.msg.slice(0, 60)); await B.ctx.close(); }
  console.log('errors:', errs.length ? errs.slice(0, 4) : 'none'); await b.close(); })();
