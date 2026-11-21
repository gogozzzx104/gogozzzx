// Balance simulator: a simple bot plays and buys the cheapest upgrade it can afford.  node tools/sim.js [maxRuns]
const C = require('../core.js');
function play(s, meter) { const r = C.newRun(C.stats(s), meter, 1); let guard = 0;
  while (!r.over && guard++ < 1300) { const alt = r.y - C.ground(r.x), sp = Math.hypot(r.vx, r.vy);
    C.step(r, 1 / 12, { boost: r.tr > 0.2, skill: (alt < 1.5 && sp > 2 && r.spring > 0 && r.tr > 0.6) || (r.dash > 0 && r.vy < 0 && alt > 3) }); }
  return r; }
function buyAll(s) { for (;;) { let best = null; for (const u of C.UPS) if (C.canBuy(s, u.id) && (!best || C.cost(s, u.id) < C.cost(s, best))) best = u.id; if (!best) break; C.buy(s, best); } }
if (process.argv[3]) C.CFG.infl = +process.argv[3];
const s = C.newSave(), max = +process.argv[2] || 1500; let time = 0, lastZone = 0; const log = [];
for (let i = 1; i <= max; i++) { const r = play(s, i % 3 ? 0.99 : 0.8), p = C.finish(r, s); time += r.tr + 8; buyAll(s);
  if (s.zone > lastZone) { lastZone = s.zone; log.push(`zone ${s.zone} ${C.ZONES[s.zone].name}: run ${i}, ${(time / 60).toFixed(0)} min, lv total ${Object.values(s.lv).reduce((a, b) => a + b, 0)}`); }
  if ([1, 10, 30, 60, 100, 150, 200, 300, 400, 500, 600, 700, 800, 1000].includes(i)) console.log(`run ${i}: D=${r.maxX.toFixed(0)}m v0=${r.v0.toFixed(0)} tr=${r.tr.toFixed(0)}s b=${r.bounces} why=${r.why} gold+${p.total.toExponential(2)} mult=${p.mult.toFixed(2)} lv=${Object.values(s.lv).reduce((a, b) => a + b, 0)}`); }
console.log(log.join('\n')); console.log('best', s.best.toFixed(0), 'maxed', C.UPS.filter(u => C.lvl(s, u.id) >= u.max).length, '/', C.UPS.length, 'stars if rebirth', C.starsFor(s.bestLife));
console.log(C.UPS.map(u => u.id + ':' + C.lvl(s, u.id)).join(' '));
