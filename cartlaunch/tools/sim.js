// Balance simulator.  A bot plays whole careers (several rebirths) with real inputs.
//   node tools/sim.js [runs=1500] [pilot=1] [lives=4] [v=0]
// pilot=1: steers along the coin stream with boost / spring / dash / dive.  pilot=0: only holds boost and jumps.
const C = require('../core.js');
const A = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const MAX = +(A.runs || 1500), PILOT = A.pilot !== '0', LIVES = +(A.lives || 4), V = +(A.v || 0);
const rng = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function play(s, seed, pilot = PILOT) {
  const st = C.stats(s), rnd = rng(seed), perfect = rnd() < 0.6, meter = perfect ? 0.995 : 0.55 + rnd() * 0.35, kr = rnd(), kick = kr < 0.35 ? 1.06 + st.kickB : kr < 0.7 ? 1.03 + st.kickB / 2 : 1;
  const r = C.newRun(st, meter, kick, seed); let guard = 0;
  while (!r.over && guard++ < 4000) {
    const alt = r.y - C.ground(r.x, r.U), sp = Math.hypot(r.vx, r.vy), grounded = alt < Math.max(1.2, 0.5 * r.S), inp = {};
    if (pilot) { const tgt = C.river(r, r.x + 0.5 * r.cw);
      inp.boost = r.fuel > 0 && !grounded && r.tr > 0.3 && ((alt < tgt * 1.1 && r.vy < 0.2 * sp) || sp < 0.8 * r.v0);
      inp.spring = r.spring > 0 && ((grounded && sp > 0.15 * r.v0 && r.tr > 0.5) || (!grounded && st.airjump && alt < 0.6 * tgt && r.vy < 0));
      inp.dash = r.dash > 0 && !grounded && sp < 0.9 * r.v0 && r.tr > 1;
      inp.dive = r.dive > 0 && !grounded && alt > tgt + 2.2 * r.c && r.vy > -0.4 * sp; }
    else { inp.boost = r.tr > 0.2; inp.skill = (grounded && sp > 2 && r.spring > 0 && r.tr > 0.6) || (r.dash > 0 && r.vy < 0 && !grounded); }
    C.step(r, 1 / 20, inp); }
  return r;
}
play = (s, seed, pilot = PILOT) => require('./bots.js').play(s, seed, pilot ? 'pilot' : 'idle');   // same bots as tools/bots.js
// Shopping like a sensible player: core upgrades first, side upgrades only once they are cheap next to the core ones.
const W = { push: +(process.env.PUSHW || 2), runup: 1.5, ad: 1.5, sling: 1.5, cannon: 1.5, rail: 1.5, ramp: 1.5, tire: 1, wheel: 0.8, frame: 0.8, aero: 0.8, rocket: 0.8, spring: 0.7, coin: 0.6, float: 3, wing: 0.7, dash: 0.7, fuel: 0.6, timing: 0.6, sponsor: 0.7, hover: 0.6 };
function buyAll(s) { for (;;) { let best = null, bv = Infinity; for (const u of C.UPS) if (C.canBuy(s, u.id)) { const v = C.cost(s, u.id) / (W[u.id] || 0.3); if (v < bv) { bv = v; best = u.id; } } if (!best) break; C.buy(s, best); } }
function buyPerks(s) { for (;;) { let best = null, bc = 1e9; for (const p of C.PERKS) { const l = s.perks[p.id] || 0, c = C.perkCost(p, l); if (l < p.max && !C.perkLock(s, p.id) && c <= s.stars && c < bc) { best = p.id; bc = c; } } if (!best) break; C.buyPerk(s, best); } }
if (require.main === module) {
  const s = C.newSave(); if (process.env.TP) { Object.assign(s, JSON.parse(process.env.TP)); }   // e.g. TP='{"tperks":{"t_gold":3},"rebirths":12}' to start a post-transcendence cycle
  let time = 0, life = 1, lifeRun = 0, lastGain = 0, lifeBest = 0, lifeTime = 0, coinShare = 0, coinN = 0, durSum = 0, durMax = 0, ga = 0, da = 0, ca = 0; const fmt = n => n.toExponential(1);
  console.log(`== life 1 (pilot=${PILOT})`);
  for (let i = 1; i <= MAX; i++) {
    const z0 = s.zone, r = play(s, i * 7 + 3), p = C.finish(r, s); time += r.tr + 7; lifeTime += r.tr + 7; lifeRun++; durSum += r.tr; durMax = Math.max(durMax, r.tr); buyAll(s);
    if (p.total > 0) { coinShare += p.coins * p.mult * p.gold / p.total; coinN++; }
    ga = ga * 0.8 + 0.2 * (p.total - p.first * p.mult * p.gold) / p.gold; da = da * 0.8 + 0.2 * r.tr; ca = ca * 0.8 + 0.2 * r.coins;
    if (s.zone > z0) console.log(`  z${s.zone} ${C.ZONES[s.zone].name}: run ${lifeRun} (${(lifeTime / 60).toFixed(0)}m)  v0=${r.v0.toFixed(0)} gold~${fmt(ga)} gref=${fmt(C.gref(s.zone))} lv=${C.total(s)} push=${C.lvl(s, 'push')} coins~${ca.toFixed(0)} dur~${da.toFixed(0)}s`);
    if (r.maxX > lifeBest * 1.1) { lifeBest = r.maxX; lastGain = lifeRun; }
    if (V && i % V === 0) console.log(`  run ${lifeRun}: D=${fmt(r.maxX)} v0=${r.v0.toFixed(0)} gold=${fmt(p.total)} coins=${r.coins}/${r.crates} b=${r.bounces} dur=${r.tr.toFixed(0)}s ${r.why}`);
    const gain = C.starsFor(s.bestLife);
    if (life < LIVES && gain >= 3 && lifeRun - lastGain > 30 && gain >= 0.25 * s.starsTotal) {
      console.log(`  -> rebirth after ${lifeRun} runs (${(lifeTime / 60).toFixed(0)}m), best ${fmt(s.bestLife)} z${s.zone}, +${gain} stars (total ${s.starsTotal + gain}), lv ${C.total(s)}, avg run ${(durSum / lifeRun).toFixed(0)}s max ${durMax.toFixed(0)}s, coin share ${(coinShare / coinN * 100).toFixed(0)}%`);
      C.rebirth(s); buyPerks(s); buyAll(s); life++; lifeRun = 0; lastGain = 0; lifeBest = 0; lifeTime = 0; coinShare = coinN = 0; durSum = durMax = 0; ga = da = ca = 0;
      console.log(`== life ${life}  perks: ${Object.entries(s.perks).map(e => e.join(':')).join(' ')}`); }
  }
  console.log(`end: life ${life} run ${lifeRun}, best ${fmt(s.best)} z${C.zoneAt(s.best)}, total ${(time / 3600).toFixed(1)}h, lv ${C.total(s)}, avg run ${(durSum / Math.max(1, lifeRun)).toFixed(0)}s max ${durMax.toFixed(0)}s, coin share ${(coinShare / Math.max(1, coinN) * 100).toFixed(0)}%`);
  if (V) console.log(C.UPS.map(u => u.id + ':' + C.lvl(s, u.id)).join(' '));
}
module.exports = { play, buyAll, buyPerks };
