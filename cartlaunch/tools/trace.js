const C = require('../core.js'); const { play, buyAll } = require('./sim.js');
const Z = +(process.argv[2] || 7), s = C.newSave(); let i = 0; while (s.zone < Z && i < 4000) { i++; C.finish(play(s, i * 7 + 3), s); buyAll(s); }
const st = C.stats(s), r = C.newRun(st, 0.995, 1.03, 4242); console.log('zone', s.zone, 'v0', r.v0.toFixed(0), 'U', r.U.toFixed(1), 'tw', r.tw.toFixed(1), 'e', st.e, 'mu', st.mu.toFixed(3), 'drag', st.drag.toExponential(2), 'thrust', st.thrust.toFixed(1), 'fuel', st.fuel);
let nextT = 0, air = 0, grd = 0;
while (!r.over) { const alt = r.y - C.ground(r.x, r.U), sp = Math.hypot(r.vx, r.vy), grounded = alt < Math.max(1.2, 0.5 * r.S), tgt = C.river(r, r.x + 0.5 * r.cw), inp = {};
  inp.boost = r.fuel > 0 && !grounded && r.tr > 0.3 && ((alt < tgt * 1.1 && r.vy < 0.2 * sp) || sp < 0.8 * r.v0); inp.spring = r.spring > 0 && ((grounded && sp > 0.15 * r.v0 && r.tr > 0.5) || (!grounded && st.airjump && alt < 0.6 * tgt && r.vy < 0)); inp.dash = r.dash > 0 && !grounded && sp < 0.9 * r.v0 && r.tr > 1; inp.dive = r.dive > 0 && !grounded && alt > tgt + 2.2 * r.c && r.vy > -0.4 * sp;
  C.step(r, 1 / 20, inp); if (r.air) air += 0.05; else grd += 0.05;
  if (r.tr >= nextT) { nextT += 2; console.log(`t=${r.tr.toFixed(0).padStart(3)}s x=${(r.x / r.U).toFixed(0).padStart(5)}U alt=${(alt / r.U).toFixed(1).padStart(5)}U sp=${(sp / r.v0).toFixed(2)}v0 vx=${(r.vx / r.v0).toFixed(2)} ${r.air ? 'air' : 'gnd'} b=${r.bounces} coins=${r.coins} tops=${r.tops}`); } }
console.log('end', r.why, 'D', (r.maxX / r.U).toFixed(0) + 'U', 'air', air.toFixed(0), 's ground', grd.toFixed(0), 's');
