// Sensitivity: play to a given zone, then measure how much one more level of each upgrade changes average gold and distance.
//   node tools/sens.js [zone=6] [patch]     prints: id, level, gold gain %, distance gain %, ln(gain)/ln(cm) (its share of the "runaway sum")
const C = require('../core.js'); const { play, buyAll } = require('./sim.js');
for (const kv of (process.argv[3] || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='), [id, f] = k.split('.'); C.UP[id][f] = +v; }
const Z = +(process.argv[2] || 6), s = C.newSave(); let i = 0;
while (s.zone < Z && i < 3000) { i++; C.finish(play(s, i * 7 + 3), s); buyAll(s); }
const avg = st => { let g = 0, d = 0; for (let k = 0; k < 60; k++) { const r = play(st, 9000 + k * 11); const s2 = JSON.parse(JSON.stringify(st)); g += C.payout(r, s2).total; d += r.maxX; } return [g / 60, d / 60]; };
const [g0, d0] = avg(s); console.log(`zone ${s.zone} after ${i} runs, lv ${C.total(s)}, gold/run ${g0.toExponential(2)}, D ${d0.toExponential(2)}`);
let sum = 0; const rows = [];
for (const u of C.UPS) { const l = C.lvl(s, u.id); if (l >= u.max || C.lockReason(s, u.id)) { rows.push([u.id, l, null]); continue; } const s2 = JSON.parse(JSON.stringify(s)); s2.lv[u.id] = l + 1; const [g1, d1] = avg(s2), share = Math.log(Math.max(1e-9, g1 / g0)) / Math.log(Math.max(1.0001, C.cost(s2, u.id) / C.cost(s, u.id))); sum += Math.max(0, share); rows.push([u.id, l, (g1 / g0 - 1) * 100, (d1 / d0 - 1) * 100, share, C.cost(s, u.id) / Math.max(1e-9, g1 - g0), C.cost(s, u.id) / g0]); }
for (const r of rows) console.log(r[2] == null ? `${r[0].padEnd(9)} lv${String(r[1]).padStart(3)}  (max or locked)` : `${r[0].padEnd(9)} lv${String(r[1]).padStart(3)}  gold ${r[2].toFixed(1).padStart(6)}%  dist ${r[3].toFixed(1).padStart(6)}%  share ${r[4].toFixed(3)}  cost ${r[6].toFixed(1).padStart(6)} runs  payback ${(r[5] > 0 && r[5] < 9999 ? r[5].toFixed(0) : '—').padStart(5)} runs`);
console.log('runaway sum (must stay below 1):', sum.toFixed(2));
