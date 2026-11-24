// Screenshots of every main screen, for looking the game over by eye.
//   node cartlaunch/tools/e2e/shots.js <out dir> [saves dir] [only: aim,fly,shop,star,veil,trans,result,port,gfx]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const OUT = process.argv[2], SP = process.argv[3] || __dirname, only = (process.argv[4] || '').split(',').filter(Boolean), want = k => !only.length || only.includes(k);
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), saves = JSON.parse(fs.readFileSync(SP + '/saves.json')), errs = [];
  fs.mkdirSync(OUT, { recursive: true });
  const open = async (save, vp = { width: 1100, height: 540 }, extra = {}) => { const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: true }), pg = await ctx.newPage();
    await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
    await pg.addInitScript(([s, x]) => { if (!sessionStorage.getItem('i')) { if (s) localStorage.setItem('cart.save', s); for (const k in x) localStorage.setItem(k, x[k]); sessionStorage.setItem('i', '1'); } }, [save ? JSON.stringify(save) : '', extra]);
    await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(600); return [pg, ctx]; };
  const fire = async pg => { await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93 || window.__cart.state !== 'charge'); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly'); };
  const shot = (pg, n) => pg.screenshot({ path: `${OUT}/${n}.png` });
  if (want('aim')) { const [pg, ctx] = await open(null); await shot(pg, 'aim_new'); await pg.keyboard.down('Space'); await pg.waitForTimeout(700); await shot(pg, 'charge'); await pg.keyboard.up('Space'); await ctx.close(); }
  if (want('fly')) for (const k of ['z3', 'z6', 'z10']) { const [pg, ctx] = await open(saves[k]); await fire(pg); await pg.waitForTimeout(1500); await shot(pg, 'fly_' + k + '_a'); await pg.waitForTimeout(3500); await shot(pg, 'fly_' + k + '_b'); await ctx.close(); }
  if (want('sky')) { const [pg, ctx] = await open(saves.z10); await fire(pg); for (const z of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 22, 26]) { await pg.evaluate(v => { window.__cart.peek = v; }, z); await pg.waitForTimeout(140); await shot(pg, 'sky_' + String(z).padStart(2, '0')); } await ctx.close(); }
  if (want('shop')) { const [pg, ctx] = await open(saves.z10); await pg.evaluate(() => window.__cart.openShop()); await pg.waitForTimeout(300);
    for (const t of ['launch', 'body', 'gear', 'money', 'star', 'skin', 'info']) { const el = await pg.$(`.tab[data-t="${t}"]`); if (!el) continue; await el.click(); await pg.waitForTimeout(250); await shot(pg, 'shop_' + t); if (t === 'launch' || t === 'gear') { const nd = await pg.$('.nd:not(.lock)'); if (nd) { await nd.click(); await pg.waitForTimeout(250); await shot(pg, 'shop_' + t + '_sel'); } } }
    await ctx.close(); }
  if (want('veil')) { const [pg, ctx] = await open(saves.z3); await pg.evaluate(() => window.__cart.openShop()); await pg.waitForTimeout(300); const el = await pg.$('.tab[data-t="star"]'); if (el) { await el.click(); await pg.waitForTimeout(300); } await shot(pg, 'veil_star'); await ctx.close(); }
  if (want('trans')) { const k = Object.keys(saves).find(q => (saves[q].trans || 0) > 0 || (saves[q].shards || 0) > 0) || Object.keys(saves).pop(); const [pg, ctx] = await open(saves[k]); await pg.evaluate(() => window.__cart.openShop()); await pg.waitForTimeout(300);
    for (const t of ['star', 'trans', 'launch']) { const el = await pg.$(`.tab[data-t="${t}"]`); if (!el) continue; await el.click(); await pg.waitForTimeout(250); await shot(pg, 'late_' + t); } await ctx.close(); }
  if (want('result')) { const [pg, ctx] = await open(saves.z6); await fire(pg); await pg.waitForTimeout(2500); await pg.evaluate(() => document.querySelector('#endBtn').click()); await pg.waitForTimeout(900); await shot(pg, 'result'); await ctx.close(); }
  if (want('port')) { const [pg, ctx] = await open(saves.z10, { width: 390, height: 844 }); await shot(pg, 'port_aim'); await pg.evaluate(() => window.__cart.openShop()); await pg.waitForTimeout(300); await shot(pg, 'port_shop'); const el = await pg.$('.tab[data-t="star"]'); if (el) { await el.click(); await pg.waitForTimeout(250); await shot(pg, 'port_star'); } await ctx.close(); }
  if (want('gfx')) for (const q of ['low', 'high']) { const [pg, ctx] = await open(saves.z10, { width: 1100, height: 540 }, { 'cart.opt': JSON.stringify({ gfx: q }) }); await fire(pg); await pg.waitForTimeout(2500); await shot(pg, 'gfx_' + q); await ctx.close(); }
  console.log('errors:', errs.length ? [...new Set(errs)].slice(0, 8) : 'none'); await b.close();
})();
