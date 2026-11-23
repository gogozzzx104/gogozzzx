// Four player types play a career; prints pace, run feel and income so rounds of tuning can be compared.
//   node tools/bots.js [runs=450] [modes=pilot,idle,trick,push] [sens=zone]
const C = require('../core.js');
const A = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const rng = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function play(s, seed, mode, m) {
  const st = C.stats(s), rnd = rng(seed), good = mode !== 'idle', perfect = rnd() < (good ? 0.6 : 0.3), meter = perfect ? 0.995 : 0.55 + rnd() * 0.35, kr = rnd(), kick = !good ? 1 : kr < 0.35 ? 1.06 + st.kickB : kr < 0.7 ? 1.03 + st.kickB / 2 : 1;
  const r = C.newRun(st, meter, kick, seed); let guard = 0, dead = 0, acts = 0, lastAct = 0, gap = 0;
  while (!r.over && guard++ < 4000) {
    const gy = C.ground(r.x, r.U), alt = r.y - gy, sp = Math.hypot(r.vx, r.vy), grounded = alt < Math.max(1.2, 0.5 * r.S), inp = {}; let tgt = C.river(r, r.x + 0.5 * r.cw); if (mode !== 'idle') { const i0 = Math.floor(r.x / r.cw - 1.2); out: for (let i = Math.max(0, i0); i <= i0 + 2; i++) for (const o of C.cellObjs(r, i)) if (!o.grounded && o.type !== 'ring' && o.x > r.x && !r.used.has(o.id)) { tgt = o.y - C.ground(o.x, r.U); break out; } }
    if (mode === 'idle') { inp.boost = r.tr > 0.2; inp.skill = (grounded && sp > 2 && r.spring > 0 && r.tr > 0.6) || (r.dash > 0 && r.vy < 0 && !grounded); }
    else {
      inp.boost = r.fuel > 0 && r.tr > 0.3 && ((alt < tgt * 1.1 && r.vy < 0.2 * sp) || sp < 0.8 * r.v0);
      inp.spring = r.spring > 0 && ((grounded && sp > 0.15 * r.v0 && r.tr > 0.5) || (!grounded && st.airjump && alt < 0.6 * tgt && r.vy < 0));
      inp.dash = r.dash > 0 && sp < 0.9 * r.v0 && r.tr > 1 && (!grounded || sp < 0.5 * r.v0);
      inp.dive = r.dive > 0 && !grounded && alt > tgt + 2.2 * r.c && r.vy > -0.4 * sp;
      // attitude: the trick bot flips while high, everyone who steers lines the cart up with the slope before touching down
      const dg = 0.1 * r.U, xl = r.x + r.vx * 0.4 * r.U / (sp + 1), sl = Math.atan((C.ground(xl + dg, r.U) - C.ground(xl - dg, r.U)) / (2 * dg)), low = alt < 2.2 * r.S + Math.max(0, -r.vy) * 0.5 * r.U / (r.v0 + 1) * 3;
      if (!grounded) { if (mode === 'trick' && !low && alt > 1.5 * r.c) inp.spin = 1; else if (low || mode !== 'trick') { let e = sl + ((((seed * 31 + r.bounces * 17) % 97) / 97) - 0.5) * 0.5 - r.ang; e = Math.atan2(Math.sin(e), Math.cos(e)); const u = e - 0.12 * r.spin; inp.spin = Math.abs(u) > 0.12 ? Math.sign(u) : 0; } }
    }
    if (inp.spring || inp.dash || inp.dive || inp.skill) { acts++; gap = Math.max(gap, r.tr - lastAct); lastAct = r.tr; }
    if (!(r.fuel > 0.05 || r.spring > 0 || r.dash > 0 || r.dive > 0)) dead += 1 / 20;
    C.step(r, 1 / 20, inp); }
  if (m) { m.n++; m.dur += r.tr; m.dead += dead / Math.max(1, r.tr); m.acts += acts; m.coins += r.coins; m.b += r.bounces; m.tr += r.tricks; m.clean += r.cleans || 0; m.max = Math.max(m.max, r.tr); }
  return r;
}
const W = { push: 2, runup: 1.5, ad: 1.5, sling: 1.5, cannon: 1.5, rail: 1.5, ramp: 1.5, tire: 1, wheel: 0.8, frame: 0.8, aero: 0.8, rocket: 0.8, spring: 0.7, coin: 0.6, float: 3, wing: 0.7, dash: 0.7, fuel: 0.6, timing: 0.6, sponsor: 0.7, hover: 0.6 };
function buyAll(s, mode) { for (;;) { let best = null, bv = Infinity; for (const u of C.UPS) { if (mode === 'push' && u.id !== 'push' && u.id !== 'float') continue; if (C.canBuy(s, u.id)) { const v = C.cost(s, u.id) / (W[u.id] || 0.3); if (v < bv) { bv = v; best = u.id; } } } if (!best) break; C.buy(s, best); } }
function career(mode, runs) { const s = C.newSave(), zr = [], m = { n: 0, dur: 0, dead: 0, acts: 0, coins: 0, b: 0, tr: 0, clean: 0, max: 0 }; let g = 0;
  for (let i = 1; i <= runs; i++) { const z0 = s.zone, late = i > runs - 120, r = play(s, i * 7 + 3, mode, late ? m : null), p = C.finish(r, s); if (late) g += p.total; buyAll(s, mode); for (let z = z0 + 1; z <= s.zone; z++) zr[z] = i; }
  return { mode, zr, s, m, gold: g / 120 }; }
if (require.main === module) {
  const runs = +(A.runs || 450), modes = (A.modes || 'pilot,idle,trick,push').split(',');
  for (const mode of modes) { const c = career(mode, runs), m = c.m, k = m.n;
    console.log(`${mode.padEnd(5)} z${c.s.zone} | zone runs ${c.zr.slice(1).join(' ')} | last120: ${(m.dur / k).toFixed(0)}s (max ${m.max.toFixed(0)}) dead ${(m.dead / k * 100).toFixed(0)}% acts ${(m.acts / k).toFixed(1)} coins ${(m.coins / k).toFixed(0)} b ${(m.b / k).toFixed(1)} flips ${(m.tr / k).toFixed(1)} clean ${(m.clean / k).toFixed(1)} gold ${c.gold.toExponential(2)}`);
    if (A.sens && mode === 'trick') { const s = c.s, avg = t => { let x = 0; for (let j = 0; j < 40; j++) x += C.payout(play(t, 9000 + j * 11, mode), JSON.parse(JSON.stringify(t))).total; return x / 40; }, g0 = avg(s), out = [];
      for (const u of C.UPS) { const l = C.lvl(s, u.id); if (l + 3 > u.max || C.lockReason(s, u.id)) continue; const t = JSON.parse(JSON.stringify(s)); t.lv[u.id] = l + 3; out.push([u.id, (avg(t) / g0 - 1) * 100]); }
      out.sort((a, b) => a[1] - b[1]); console.log('  +3 levels, gold %: ' + out.map(o => o[0] + ' ' + o[1].toFixed(0)).join(', ')); } }
}
module.exports = { play, buyAll, career };
