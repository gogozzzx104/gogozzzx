// Save code: copy on one browser, paste on another (a fresh context), with the corruptions a phone or a chat app can add.
// node cartlaunch/tools/e2e/xcode.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), errs = [];
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 1000, height: 500 } }), pg = await ctx.newPage(); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message)); await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(500); return { ctx, pg }; };
  const A = await open();
  await A.pg.evaluate(() => { const c = window.__cart, s = c.C.newSave(); s.runs = 777; s.rebirths = 9; s.gold = 12345; s.lv.push = 50; s.micro = window.MICRO.C.newSave(); s.micro.light = 999; s.micro.runs = 5; c.S = s; c.save(); });
  await A.pg.evaluate(() => { window.__cart.openShop(); }); await A.pg.click('#sTabs [data-t="info"]'); await A.pg.waitForTimeout(200);
  await A.pg.click('[data-xcode="copy"]'); await A.pg.waitForTimeout(300); const code = await A.pg.inputValue('textarea.xbox'); console.log('code length', code.length, code.slice(0, 12));
  const variants = { '그대로': code, '줄바꿈 끼움': code.replace(/(.{60})/g, '$1\n'), '보이지 않는 공백(ZWSP)': code.replace(/(.{40})/g, '$1​'), '앞뒤에 다른 글': '여기 저장 코드: ' + code + ' (폰에서 복사)', 'URL식 문자(-_)': code.replace(/\+/g, '-').replace(/\//g, '_'), 'NBSP·소프트하이픈': code.replace(/(.{50})/g, '$1 ­') };
  for (const [name, text] of Object.entries(variants)) { const B = await open();
    await B.pg.evaluate(() => window.__cart.openShop()); await B.pg.click('#sTabs [data-t="info"]'); await B.pg.waitForTimeout(150); await B.pg.click('[data-xcode="paste"]'); await B.pg.waitForTimeout(150);
    if (name === '그대로') console.log((await B.pg.evaluate(() => { const ta = document.querySelector('#xIn'), ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); ta.dispatchEvent(ev); return !ev.defaultPrevented; })) ? 'OK   붙여넣기 상자에서 우클릭·길게 누르기 메뉴 허용' : 'FAIL 우클릭 메뉴가 막힘');
    await B.pg.fill('#xIn', text); await B.pg.click('[data-xcode="load"]'); await B.pg.waitForTimeout(150); await B.pg.click('[data-xcode="load"]'); await B.pg.waitForTimeout(300);
    const r = await B.pg.evaluate(() => ({ runs: window.__cart.S.runs, micro: window.__cart.S.micro && window.__cart.S.micro.runs, msg: (document.querySelector('.xmsg') || {}).textContent }));
    const ok = r.runs === 777 && r.micro === 5; console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name, ok ? '' : JSON.stringify(r)); await B.ctx.close(); }
  console.log('errors:', errs.length ? errs.slice(0, 4) : 'none'); await b.close(); })();
