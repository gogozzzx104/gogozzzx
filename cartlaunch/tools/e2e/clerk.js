// The cashier's line at an ordinary ending, by how many cart achievements will be left after it.  node clerk.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1000, height: 500 } }), errs = [];
  await pg.route(/fonts\./, r => r.abort()); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8766/cartlaunch/index.html'); await pg.waitForTimeout(400);
  const cases = [['처음, 3개 남음', { missing: ['a_tr50', 'a_re50', 'a_combo1k'], hint: 0, ended: 1 }, '업적이 얼마 남지 않으셨네요?'], ['두 번째, 3개 남음', { missing: ['a_tr50', 'a_re50', 'a_combo1k'], hint: 1, ended: 1 }, '남은 업적이… 3개군요.'],
    ['두 번째, 2개 남음', { missing: ['a_tr50', 'a_re50'], hint: 1, ended: 1 }, '남은 업적이… 2개군요.'], ['엔딩 5번만 남음 (3번)', { missing: ['a_fin5'], hint: 1, ended: 1 }, '3번만 엔딩을 보시면…'],
    ['엔딩 5번만 남음 (2번)', { missing: ['a_fin5'], hint: 1, ended: 2 }, '두 번 남으셨군요..?'], ['엔딩 5번만 남음 (1번)', { missing: ['a_fin5'], hint: 1, ended: 3 }, '이제 슬슬 업적 클리어에 도달 직전이시네요?'],
    ['이번 엔딩으로 전부 달성', { missing: ['a_fin5'], hint: 1, ended: 4 }, '업적을 전부 클리어하셨네요?'], ['전부 달성 뒤 다시 방문', { missing: [], hint: 1, ended: 5 }, 'MIC']];
  for (const [name, o, want] of cases) {
    await pg.evaluate(o => { const c = window.__cart, C = c.C, s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = u.max; for (const q of C.PERKS) s.perks[q.id] = q.max; for (const q of C.TPERKS) s.tperks[q.id] = q.max; s.rebirths = 30; s.trans = 12; s.runs = 4821; s.stars = s.starsTotal = 3e6; s.starsEver = 1e9; s.best = s.bestLife = C.ZONES[C.LAST + 72].at; s.zone = C.LAST + 72; s.ended = o.ended; s.clerkHint = o.hint; for (const a of C.ACH) s.ach[a.id] = 1; for (const m of o.missing) delete s.ach[m]; c.S = s; c.toAim(); }, o);
    await pg.keyboard.down('Space'); await pg.waitForFunction(() => window.__cart.state === 'fly', null, { timeout: 8000 }); await pg.keyboard.up('Space'); await pg.waitForTimeout(900);
    await pg.evaluate(() => { const c = window.__cart, r = c.run; r.x = c.C.ZONES[c.C.LAST + 73].at * 1.02; r.maxX = r.x; }); await pg.waitForTimeout(700);
    await pg.evaluate(() => { const r = window.__cart.run; r.fin = r.tr - 56; }); await pg.waitForFunction(() => window.__cart.state === 'ending', null, { timeout: 9000 });
    const e = await pg.evaluate(() => window.__cart.endS), got = e.mic ? 'MIC' : (e.say || []).map(l => l[2]).join(' / ');
    console.log((want === 'MIC' ? e.mic : got.includes(want)) ? 'OK  ' : 'FAIL', name, '→', got);
    if (!e.mic) { await pg.waitForTimeout(4200); await pg.click('#endExit'); await pg.waitForTimeout(400); }
    else { await pg.waitForFunction(() => window.MICRO && window.MICRO.on, null, { timeout: 30000 }); await pg.evaluate(() => { window.MICRO.finishIntro(); window.MICRO.leave(); }); await pg.waitForTimeout(700); } }
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none'); await b.close(); })();
