// The cart is drawn at its true angle while it spins in the air (no lag behind the judged attitude), at a normal and a hyper spin.
// node cartlaunch/tools/e2e/spinlag.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), errs = [];
  for (const [name, tspin] of [['보통 회전', 0], ['초회전 만렙', 1]]) { const pg = await b.newPage({ viewport: { width: 1000, height: 500 } }); await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
    await pg.evaluate(t => { const c = window.__cart, C = c.C, s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = u.max; if (t) for (const q of C.TPERKS) if (q.id === 't_spin') s.tperks[q.id] = q.max; s.zone = 10; s.best = s.bestLife = C.ZONES[10].at; c.S = s; c.toAim(); }, tspin);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.charge > 0.93); await pg.keyboard.up('Space'); await pg.waitForTimeout(480); await pg.keyboard.press('Space');
    await pg.waitForFunction(() => window.__cart.state === 'fly'); await pg.waitForTimeout(700);
    await pg.keyboard.down('KeyA'); let worst = 0, n = 0, w = 0;
    for (let i = 0; i < 40; i++) { await pg.waitForTimeout(80); const d = await pg.evaluate(() => { const c = window.__cart, r = c.run; if (!r || !r.air || Math.abs(r.spin) < 0.5) return null; let e = c.rot + r.ang; e = Math.atan2(Math.sin(e), Math.cos(e)); return [Math.abs(e), Math.abs(r.spin)]; }); if (d) { n++; worst = Math.max(worst, d[0]); w = Math.max(w, d[1]); } }
    await pg.keyboard.up('KeyA');
    console.log((n > 5 && worst < 0.02 ? 'OK  ' : 'FAIL') + ` ${name}: 공중 회전 중 ${n}회 측정, 최고 회전 ${w.toFixed(1)} rad/s, 화면과 실제 각도 차 최대 ${(worst * 57.3).toFixed(1)}°`); await pg.close(); }
  console.log('errors:', errs.length ? errs.slice(0, 3) : 'none'); await b.close(); })();
